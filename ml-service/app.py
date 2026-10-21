"""
ResQAlloc ML Service — KTAS Severity Classification

This service provides a REST API for predicting patient severity
using the Korean Triage and Acuity Scale (KTAS) framework.

DEMONSTRATION MODE NOTICE:
==========================
This service operates in DEMONSTRATION MODE. The classifier uses
a rule-based heuristic combined with a simple trained model on
synthetic features. It does NOT use real clinical training data
and should NOT be used for actual medical triage decisions.

The model is explicitly labeled as 'demo' in all responses.

Endpoints:
- POST /predict    - Predict KTAS severity level
- GET  /health     - Health check
- GET  /model-info - Model metadata and disclaimer
"""

import os
import json
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS

# Try to import sklearn; provide fallback if unavailable
try:
    from sklearn.ensemble import GradientBoostingClassifier
    from sklearn.preprocessing import StandardScaler
    import pickle
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    print("⚠️  scikit-learn not installed. Using pure rule-based classification.")

app = Flask(__name__)
CORS(app)

# ============================================================
# Feature Engineering & Preprocessing
# ============================================================

# Symptom keywords mapped to severity indicators
CRITICAL_KEYWORDS = [
    'cardiac arrest', 'not breathing', 'unconscious', 'unresponsive',
    'severe bleeding', 'massive hemorrhage', 'anaphylaxis', 'drowning',
    'choking', 'no pulse', 'cpr', 'resuscitation'
]

EMERGENCY_KEYWORDS = [
    'chest pain', 'heart attack', 'myocardial', 'stroke', 'severe pain',
    'head injury', 'head trauma', 'seizure', 'convulsion', 'overdose',
    'poisoning', 'major burn', 'stabbing', 'gunshot', 'assault',
    'difficulty breathing', 'respiratory distress', 'altered consciousness',
    'severe allergic', 'compound fracture', 'internal bleeding'
]

URGENT_KEYWORDS = [
    'fracture', 'broken', 'moderate pain', 'high fever', 'vomiting blood',
    'abdominal pain', 'dehydration', 'asthma attack', 'diabetic',
    'deep laceration', 'dislocation', 'severe headache', 'infection',
    'high blood pressure', 'chest tightness'
]

LESS_URGENT_KEYWORDS = [
    'mild pain', 'minor cut', 'sprain', 'rash', 'earache', 'toothache',
    'sore throat', 'cough', 'cold', 'mild fever', 'minor burn',
    'bruise', 'insect bite', 'nausea', 'diarrhea'
]

NON_URGENT_KEYWORDS = [
    'prescription', 'refill', 'follow-up', 'check-up', 'routine',
    'vaccination', 'medical certificate', 'chronic stable', 'counseling'
]

# Specialty requirements by symptom
SYMPTOM_TO_SPECIALTY = {
    'chest pain': ['Cardiology', 'Emergency Medicine'],
    'heart': ['Cardiology', 'Cardiac Surgery'],
    'stroke': ['Neurology', 'Neurosurgery'],
    'head injury': ['Neurology', 'Neurosurgery', 'Trauma'],
    'seizure': ['Neurology'],
    'fracture': ['Orthopedics', 'Trauma'],
    'broken': ['Orthopedics', 'Trauma'],
    'accident': ['Trauma', 'Emergency Medicine', 'Orthopedics'],
    'burn': ['General Surgery', 'Emergency Medicine'],
    'breathing': ['Pulmonology', 'Emergency Medicine'],
    'respiratory': ['Pulmonology'],
    'abdominal': ['Gastroenterology', 'General Surgery'],
    'pregnancy': ['Obstetrics', 'Gynecology'],
    'labor': ['Obstetrics', 'Neonatology'],
    'child': ['Pediatrics'],
    'pediatric': ['Pediatrics'],
    'poison': ['Emergency Medicine'],
    'overdose': ['Emergency Medicine'],
    'bleeding': ['Emergency Medicine', 'General Surgery'],
    'kidney': ['Nephrology'],
    'liver': ['Hepatology', 'Gastroenterology'],
    'cancer': ['Oncology'],
    'eye': ['Ophthalmology'],
    'ear': ['ENT'],
    'mental': ['Psychiatry'],
    'spine': ['Spine Surgery', 'Neurosurgery', 'Orthopedics'],
}


def preprocess_patient_data(data):
    """
    Preprocess patient data into feature vector for classification.
    
    Features extracted:
    - Vital sign abnormality scores
    - Symptom severity keywords
    - Age risk factor
    - Chief complaint category
    
    Returns: dict with features and metadata
    """
    vitals = data.get('vitals', {})
    symptoms = data.get('symptoms', [])
    chief_complaint = data.get('chiefComplaint', '').lower()
    patient = data.get('patient', {})
    
    # All text for keyword matching
    all_text = ' '.join([chief_complaint] + [s.lower() for s in symptoms])
    
    # --- Vital Sign Features ---
    vital_scores = []
    vital_flags = []
    
    # Heart rate
    hr = vitals.get('heartRate')
    if hr:
        hr = float(hr)
        if hr < 40 or hr > 150:
            vital_scores.append(3)  # Critical
            vital_flags.append(f'Heart rate critical: {hr} bpm')
        elif hr < 50 or hr > 120:
            vital_scores.append(2)  # Abnormal
            vital_flags.append(f'Heart rate abnormal: {hr} bpm')
        elif hr < 60 or hr > 100:
            vital_scores.append(1)  # Borderline
        else:
            vital_scores.append(0)  # Normal
    
    # Blood pressure (systolic)
    sbp = vitals.get('systolicBP')
    if sbp:
        sbp = float(sbp)
        if sbp < 70 or sbp > 200:
            vital_scores.append(3)
            vital_flags.append(f'Blood pressure critical: {sbp} mmHg')
        elif sbp < 90 or sbp > 180:
            vital_scores.append(2)
            vital_flags.append(f'Blood pressure abnormal: {sbp} mmHg')
        elif sbp < 100 or sbp > 140:
            vital_scores.append(1)
        else:
            vital_scores.append(0)
    
    # Respiratory rate
    rr = vitals.get('respiratoryRate')
    if rr:
        rr = float(rr)
        if rr < 8 or rr > 35:
            vital_scores.append(3)
            vital_flags.append(f'Respiratory rate critical: {rr}/min')
        elif rr < 10 or rr > 28:
            vital_scores.append(2)
        elif rr < 12 or rr > 22:
            vital_scores.append(1)
        else:
            vital_scores.append(0)
    
    # Oxygen saturation
    spo2 = vitals.get('oxygenSaturation')
    if spo2:
        spo2 = float(spo2)
        if spo2 < 85:
            vital_scores.append(3)
            vital_flags.append(f'SpO2 critical: {spo2}%')
        elif spo2 < 90:
            vital_scores.append(2)
            vital_flags.append(f'SpO2 low: {spo2}%')
        elif spo2 < 94:
            vital_scores.append(1)
        else:
            vital_scores.append(0)
    
    # Temperature
    temp = vitals.get('temperature')
    if temp:
        temp = float(temp)
        if temp < 34 or temp > 41:
            vital_scores.append(3)
            vital_flags.append(f'Temperature critical: {temp}°C')
        elif temp < 35 or temp > 39.5:
            vital_scores.append(2)
        elif temp < 36 or temp > 38:
            vital_scores.append(1)
        else:
            vital_scores.append(0)
    
    # Glasgow Coma Scale
    gcs = vitals.get('glasgowComaScale')
    if gcs:
        gcs = float(gcs)
        if gcs <= 8:
            vital_scores.append(3)
            vital_flags.append(f'GCS severely impaired: {gcs}')
        elif gcs <= 12:
            vital_scores.append(2)
            vital_flags.append(f'GCS moderately impaired: {gcs}')
        elif gcs <= 14:
            vital_scores.append(1)
        else:
            vital_scores.append(0)
    
    # Pain scale
    pain = vitals.get('painScale')
    if pain:
        pain = float(pain)
        if pain >= 9:
            vital_scores.append(2)
        elif pain >= 7:
            vital_scores.append(1)
        else:
            vital_scores.append(0)
    
    # --- Keyword Features ---
    critical_count = sum(1 for k in CRITICAL_KEYWORDS if k in all_text)
    emergency_count = sum(1 for k in EMERGENCY_KEYWORDS if k in all_text)
    urgent_count = sum(1 for k in URGENT_KEYWORDS if k in all_text)
    less_urgent_count = sum(1 for k in LESS_URGENT_KEYWORDS if k in all_text)
    non_urgent_count = sum(1 for k in NON_URGENT_KEYWORDS if k in all_text)
    
    # --- Age Risk Factor ---
    age = patient.get('age')
    age_risk = 0
    if age:
        age = float(age)
        if age < 1 or age > 80:
            age_risk = 2
        elif age < 5 or age > 65:
            age_risk = 1
    
    # --- Derive required specialties ---
    required_specialties = set()
    for keyword, specs in SYMPTOM_TO_SPECIALTY.items():
        if keyword in all_text:
            required_specialties.update(specs)
    
    # --- Build feature vector ---
    max_vital_score = max(vital_scores) if vital_scores else 0
    avg_vital_score = np.mean(vital_scores) if vital_scores else 0
    
    features = {
        'max_vital_score': max_vital_score,
        'avg_vital_score': float(avg_vital_score),
        'vital_count': len(vital_scores),
        'critical_keywords': critical_count,
        'emergency_keywords': emergency_count,
        'urgent_keywords': urgent_count,
        'less_urgent_keywords': less_urgent_count,
        'non_urgent_keywords': non_urgent_count,
        'age_risk': age_risk,
        'symptom_count': len(symptoms)
    }
    
    feature_vector = [
        features['max_vital_score'],
        features['avg_vital_score'],
        features['critical_keywords'],
        features['emergency_keywords'],
        features['urgent_keywords'],
        features['less_urgent_keywords'],
        features['non_urgent_keywords'],
        features['age_risk'],
        features['symptom_count']
    ]
    
    return {
        'features': features,
        'feature_vector': feature_vector,
        'vital_flags': vital_flags,
        'required_specialties': list(required_specialties)
    }


def rule_based_classify(preprocessed):
    """
    Rule-based KTAS classification using preprocessed features.
    This is the primary classification method in demo mode.
    """
    features = preprocessed['features']
    
    # Level 1: Resuscitation
    if (features['critical_keywords'] > 0 or 
        features['max_vital_score'] >= 3):
        return 1, 0.85
    
    # Level 2: Emergency
    if (features['emergency_keywords'] > 0 or 
        features['max_vital_score'] >= 2 or
        (features['avg_vital_score'] >= 1.5 and features['vital_count'] >= 3)):
        return 2, 0.78
    
    # Level 3: Urgent
    if (features['urgent_keywords'] > 0 or
        features['max_vital_score'] >= 1 or
        features['age_risk'] >= 2 or
        features['symptom_count'] >= 3):
        return 3, 0.72
    
    # Level 5: Non-Urgent
    if (features['non_urgent_keywords'] > 0 and
        features['max_vital_score'] == 0 and
        features['critical_keywords'] == 0 and
        features['emergency_keywords'] == 0):
        return 5, 0.80
    
    # Level 4: Less Urgent
    if (features['less_urgent_keywords'] > 0 or
        (features['max_vital_score'] == 0 and features['symptom_count'] <= 2)):
        return 4, 0.70
    
    # Default: Urgent (err on the side of caution)
    return 3, 0.60


# ============================================================
# Model Training (Demo - trained on synthetic feature patterns)
# ============================================================

demo_model = None
demo_scaler = None

def train_demo_model():
    """
    Train a simple Gradient Boosting classifier on synthetic
    feature patterns that mirror the rule-based logic.
    
    This creates a model that can be queried for predictions,
    but it is explicitly labeled as a DEMONSTRATION model.
    """
    global demo_model, demo_scaler
    
    if not SKLEARN_AVAILABLE:
        return False
    
    # Synthetic training data mirroring rule-based patterns
    # Features: [max_vital, avg_vital, critical_kw, emergency_kw, urgent_kw, less_urgent_kw, non_urgent_kw, age_risk, symptom_count]
    np.random.seed(42)
    
    X_train = []
    y_train = []
    
    # Generate synthetic samples for each KTAS level
    for _ in range(200):
        # KTAS 1 - Resuscitation
        X_train.append([3, 2.5+np.random.random(), np.random.randint(1,3), np.random.randint(0,2), 0, 0, 0, np.random.randint(0,3), np.random.randint(2,6)])
        y_train.append(1)
        
        # KTAS 2 - Emergency  
        X_train.append([2, 1.5+np.random.random(), 0, np.random.randint(1,3), np.random.randint(0,2), 0, 0, np.random.randint(0,2), np.random.randint(1,5)])
        y_train.append(2)
        
        # KTAS 3 - Urgent
        X_train.append([1, 0.5+np.random.random()*0.8, 0, 0, np.random.randint(1,3), np.random.randint(0,1), 0, np.random.randint(0,2), np.random.randint(1,4)])
        y_train.append(3)
        
        # KTAS 4 - Less Urgent
        X_train.append([0, np.random.random()*0.3, 0, 0, 0, np.random.randint(1,3), 0, np.random.randint(0,1), np.random.randint(0,3)])
        y_train.append(4)
        
        # KTAS 5 - Non-Urgent
        X_train.append([0, 0, 0, 0, 0, 0, np.random.randint(1,3), 0, np.random.randint(0,2)])
        y_train.append(5)
    
    X_train = np.array(X_train)
    y_train = np.array(y_train)
    
    # Add noise for realism
    X_train = X_train + np.random.normal(0, 0.1, X_train.shape)
    X_train = np.clip(X_train, 0, None)
    
    demo_scaler = StandardScaler()
    X_scaled = demo_scaler.fit_transform(X_train)
    
    demo_model = GradientBoostingClassifier(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.1,
        random_state=42
    )
    demo_model.fit(X_scaled, y_train)
    
    print("✅ Demo KTAS model trained successfully")
    return True


# ============================================================
# API Endpoints
# ============================================================

KTAS_LABELS = {
    1: 'Resuscitation',
    2: 'Emergency', 
    3: 'Urgent',
    4: 'Less Urgent',
    5: 'Non-Urgent'
}

KTAS_COLORS = {
    1: '#DC2626',  # Red
    2: '#F97316',  # Orange
    3: '#EAB308',  # Yellow
    4: '#22C55E',  # Green
    5: '#3B82F6'   # Blue
}

KTAS_DESCRIPTIONS = {
    1: 'Immediate life-threatening condition requiring resuscitation',
    2: 'Potentially life-threatening condition requiring emergency care',
    3: 'Urgent condition that could potentially progress to serious',
    4: 'Less urgent condition that may benefit from treatment within 1-2 hours',
    5: 'Non-urgent condition suitable for scheduled care'
}


@app.route('/predict', methods=['POST'])
def predict_severity():
    """
    Predict KTAS severity level from patient data.
    
    Request body:
    {
        "chiefComplaint": "chest pain",
        "symptoms": ["shortness of breath", "sweating"],
        "vitals": {
            "heartRate": 110,
            "systolicBP": 85,
            "diastolicBP": 55,
            "respiratoryRate": 24,
            "temperature": 37.2,
            "oxygenSaturation": 92,
            "glasgowComaScale": 15,
            "painScale": 8
        },
        "patient": {
            "age": 55,
            "gender": "male"
        }
    }
    """
    try:
        data = request.get_json()
        
        if not data or not data.get('chiefComplaint'):
            return jsonify({
                'error': 'chiefComplaint is required',
                'status': 400
            }), 400
        
        # Preprocess
        preprocessed = preprocess_patient_data(data)
        
        # Classify using both methods
        rule_level, rule_confidence = rule_based_classify(preprocessed)
        
        model_level = None
        model_confidence = None
        model_used = 'rule_based'
        
        if demo_model is not None and demo_scaler is not None:
            try:
                X = np.array([preprocessed['feature_vector']])
                X_scaled = demo_scaler.transform(X)
                model_level = int(demo_model.predict(X_scaled)[0])
                model_proba = demo_model.predict_proba(X_scaled)[0]
                model_confidence = float(max(model_proba))
                model_used = 'gradient_boosting_demo'
            except Exception as e:
                print(f"Model prediction error: {e}")
        
        # Use model prediction if available and confident, else rule-based
        if model_level is not None and model_confidence > 0.5:
            final_level = model_level
            final_confidence = model_confidence * 0.9  # Discount for demo model
        else:
            final_level = rule_level
            final_confidence = rule_confidence
        
        response = {
            'ktas_level': final_level,
            'ktas_label': KTAS_LABELS[final_level],
            'ktas_color': KTAS_COLORS[final_level],
            'ktas_description': KTAS_DESCRIPTIONS[final_level],
            'confidence': round(final_confidence, 3),
            'model_type': model_used,
            'is_demo': True,
            'vital_flags': preprocessed['vital_flags'],
            'required_capabilities': preprocessed['required_specialties'],
            'feature_summary': {
                'vitals_assessed': preprocessed['features']['vital_count'],
                'max_vital_severity': preprocessed['features']['max_vital_score'],
                'keywords_matched': {
                    'critical': preprocessed['features']['critical_keywords'],
                    'emergency': preprocessed['features']['emergency_keywords'],
                    'urgent': preprocessed['features']['urgent_keywords']
                }
            },
            'disclaimer': (
                'DEMONSTRATION MODE: This severity prediction is generated by a demo model '
                'trained on synthetic data patterns. It does NOT represent actual clinical '
                'triage assessment and should NOT be used for real medical decisions.'
            )
        }
        
        return jsonify(response)
    
    except Exception as e:
        return jsonify({
            'error': str(e),
            'status': 500,
            'ktas_level': 3,
            'ktas_label': 'Urgent',
            'confidence': 0.3,
            'is_demo': True,
            'message': 'Error in prediction, defaulting to KTAS Level 3 (Urgent)'
        }), 200  # Return 200 with default to not break the flow


@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'ResQAlloc ML Service',
        'model_loaded': demo_model is not None,
        'sklearn_available': SKLEARN_AVAILABLE,
        'mode': 'demonstration',
        'disclaimer': 'This ML service operates in demonstration mode only.'
    })


@app.route('/model-info', methods=['GET'])
def model_info():
    return jsonify({
        'model_name': 'KTAS Severity Classifier (Demo)',
        'model_type': 'Gradient Boosting + Rule-Based Hybrid',
        'framework': 'scikit-learn' if SKLEARN_AVAILABLE else 'rule-based only',
        'ktas_levels': KTAS_LABELS,
        'ktas_colors': KTAS_COLORS,
        'ktas_descriptions': KTAS_DESCRIPTIONS,
        'features_used': [
            'Vital sign abnormality scores (heart rate, BP, respiratory rate, SpO2, temperature, GCS, pain)',
            'Symptom keyword severity indicators',
            'Age-based risk factor',
            'Symptom count'
        ],
        'training_data': 'Synthetic feature patterns (NOT real clinical data)',
        'accuracy_disclaimer': (
            'Model accuracy metrics are NOT reported because the model is trained on '
            'synthetic data and has NOT been validated against real clinical outcomes. '
            'Do not interpret predictions as clinically accurate.'
        ),
        'mode': 'DEMONSTRATION',
        'version': '1.0.0-demo'
    })


# ============================================================
# Application Startup
# ============================================================

if __name__ == '__main__':
    print("\n" + "="*50)
    print("  ResQAlloc ML Service — DEMONSTRATION MODE")
    print("="*50)
    
    if SKLEARN_AVAILABLE:
        train_demo_model()
    else:
        print("⚠️  Running with rule-based classification only")
    
    print(f"\n🚀 Starting ML service on port {os.environ.get('ML_PORT', 5001)}")
    print("⚠️  DEMO MODE: Not for clinical use\n")
    
    app.run(
        host='0.0.0.0',
        port=int(os.environ.get('ML_PORT', 5001)),
        debug=os.environ.get('FLASK_ENV') == 'development'
    )
