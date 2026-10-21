export const HYDERABAD_ZONES = [
  { name: 'Banjara Hills (Road No. 12)', latitude: 17.4156, longitude: 78.4354, zone: 'Central' },
  { name: 'Jubilee Hills (Check Post)', latitude: 17.4319, longitude: 78.4073, zone: 'West' },
  { name: 'HITEC City (Cyber Towers)', latitude: 17.4504, longitude: 78.3808, zone: 'West' },
  { name: 'Gachibowli (ORR Junction)', latitude: 17.4401, longitude: 78.3489, zone: 'West' },
  { name: 'Secunderabad (Clock Tower)', latitude: 17.4411, longitude: 78.4983, zone: 'North' },
  { name: 'Charminar (Old City)', latitude: 17.3616, longitude: 78.4747, zone: 'South' },
  { name: 'Kukatpally (KPHB Colony)', latitude: 17.4938, longitude: 78.3986, zone: 'North-West' },
  { name: 'LB Nagar (Ring Road)', latitude: 17.3457, longitude: 78.5522, zone: 'East' },
  { name: 'Mehdipatnam (Bus Station)', latitude: 17.3916, longitude: 78.4398, zone: 'South-West' },
  { name: 'Begumpet (Airport Road)', latitude: 17.4435, longitude: 78.4682, zone: 'Central' },
  { name: 'Ameerpet (Metro Hub)', latitude: 17.4375, longitude: 78.4482, zone: 'Central' },
  { name: 'Dilsukhnagar (Main Road)', latitude: 17.3688, longitude: 78.5247, zone: 'East' },
  { name: 'Miyapur (X Roads)', latitude: 17.4968, longitude: 78.3614, zone: 'North-West' },
  { name: 'Shamshabad (RGIA Environs)', latitude: 17.2403, longitude: 78.4294, zone: 'South' },
  { name: 'Uppal (Metro Station)', latitude: 17.4018, longitude: 78.5602, zone: 'East' },
];

export const CHIEF_COMPLAINT_PRESETS = [
  {
    label: 'Chest Pain / Suspected Acute Coronary Syndrome',
    chiefComplaint: 'Severe retrosternal chest pain radiating to left arm',
    symptoms: ['Chest pain', 'Shortness of breath', 'Diaphoresis', 'Palpitations'],
    vitals: { heartRate: 115, systolicBP: 160, diastolicBP: 95, respiratoryRate: 24, oxygenSaturation: 94, temperature: 37.1, gcs: 15, painScale: 9 },
    capabilities: ['ICU', 'Ventilator', 'Cath Lab', 'Blood Bank'],
    category: 'Cardiac'
  },
  {
    label: 'Severe Road Traffic Trauma / Multi-System Injury',
    chiefComplaint: 'Motorcycle collision with high velocity blunt trauma',
    symptoms: ['Altered mental status', 'Abdominal distension', 'Pelvic fracture', 'Active bleeding'],
    vitals: { heartRate: 138, systolicBP: 82, diastolicBP: 50, respiratoryRate: 28, oxygenSaturation: 91, temperature: 36.2, gcs: 9, painScale: 8 },
    capabilities: ['Trauma Center', 'Trauma OT', 'Blood Bank', 'CT Scanner', 'ICU', 'Ventilator'],
    category: 'Trauma'
  },
  {
    label: 'Acute Ischemic Stroke / Neurological Deficit',
    chiefComplaint: 'Sudden onset right-sided hemiplegia and expressive aphasia',
    symptoms: ['Facial droop', 'Arm weakness', 'Slurred speech', 'Confusion'],
    vitals: { heartRate: 88, systolicBP: 185, diastolicBP: 105, respiratoryRate: 18, oxygenSaturation: 96, temperature: 36.9, gcs: 13, painScale: 3 },
    capabilities: ['Stroke Unit', 'CT Scanner', 'MRI', 'ICU', 'Neurology'],
    category: 'Neuro'
  },
  {
    label: 'Severe Acute Respiratory Failure',
    chiefComplaint: 'Extreme dyspnea, cyanosis, and accessory muscle use',
    symptoms: ['Shortness of breath', 'Stridor', 'Cyanosis', 'Tachypnea'],
    vitals: { heartRate: 125, systolicBP: 135, diastolicBP: 85, respiratoryRate: 34, oxygenSaturation: 82, temperature: 38.4, gcs: 14, painScale: 5 },
    capabilities: ['ICU', 'Ventilator', 'Oxygen Therapy', 'Pulmonology'],
    category: 'Respiratory'
  },
  {
    label: 'Pediatric Status Epilepticus',
    chiefComplaint: 'Prolonged generalized tonic-clonic seizure > 15 minutes',
    symptoms: ['Continuous convulsions', 'Loss of consciousness', 'Hypoxia', 'Hyperthermia'],
    vitals: { heartRate: 155, systolicBP: 95, diastolicBP: 60, respiratoryRate: 30, oxygenSaturation: 89, temperature: 39.2, gcs: 7, painScale: 0 },
    capabilities: ['Pediatric ICU', 'Ventilator', 'Pediatrics'],
    category: 'Pediatric'
  },
  {
    label: 'Third-Degree Thermal Burn Injury',
    chiefComplaint: 'Extensive flame burn covering chest, abdomen, and bilateral arms (~35% TBSA)',
    symptoms: ['Severe burns', 'Inhalation injury risk', 'Extreme pain', 'Hypovolemia'],
    vitals: { heartRate: 130, systolicBP: 100, diastolicBP: 65, respiratoryRate: 26, oxygenSaturation: 93, temperature: 36.5, gcs: 14, painScale: 10 },
    capabilities: ['Burn Unit', 'ICU', 'Blood Bank', 'Plastic Surgery'],
    category: 'Burns'
  }
];
