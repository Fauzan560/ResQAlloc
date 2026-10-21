const Hospital = require('../models/Hospital');
const HospitalResource = require('../models/HospitalResource');

/**
 * Hospital Matching Engine
 * 
 * Filters hospitals by required capabilities, ranks suitable options,
 * and provides explanations for recommendations.
 * 
 * NOTE: This is a demonstration engine for academic purposes.
 * Scores and rankings use simplified heuristics, not clinical decision models.
 */

// Map KTAS levels to required capabilities
const KTAS_REQUIREMENTS = {
  1: { // Resuscitation
    requiredCapabilities: ['Emergency Medicine', 'ICU', 'Ventilator'],
    preferredCapabilities: ['Trauma', 'Cardiac Surgery', 'Neurosurgery'],
    minICUBeds: 1,
    minVentilators: 1,
    requiresEmergency: true,
    requiresTrauma: true,
    maxDistanceKm: 15
  },
  2: { // Emergency
    requiredCapabilities: ['Emergency Medicine'],
    preferredCapabilities: ['ICU', 'General Surgery'],
    minICUBeds: 1,
    minVentilators: 0,
    requiresEmergency: true,
    requiresTrauma: false,
    maxDistanceKm: 20
  },
  3: { // Urgent
    requiredCapabilities: [],
    preferredCapabilities: ['Emergency Medicine', 'General Surgery'],
    minICUBeds: 0,
    minVentilators: 0,
    requiresEmergency: true,
    requiresTrauma: false,
    maxDistanceKm: 30
  },
  4: { // Less Urgent
    requiredCapabilities: [],
    preferredCapabilities: ['General Medicine'],
    minICUBeds: 0,
    minVentilators: 0,
    requiresEmergency: false,
    requiresTrauma: false,
    maxDistanceKm: 50
  },
  5: { // Non-Urgent
    requiredCapabilities: [],
    preferredCapabilities: ['General Medicine'],
    minICUBeds: 0,
    minVentilators: 0,
    requiresEmergency: false,
    requiresTrauma: false,
    maxDistanceKm: 50
  }
};

// Map symptoms to medical specialties
const SYMPTOM_SPECIALTY_MAP = {
  'chest pain': ['Cardiology', 'Cardiac Surgery', 'Emergency Medicine'],
  'heart attack': ['Cardiology', 'Cardiac Surgery', 'Emergency Medicine'],
  'cardiac arrest': ['Cardiology', 'Cardiac Surgery', 'Emergency Medicine'],
  'stroke': ['Neurology', 'Neurosurgery', 'Emergency Medicine'],
  'head injury': ['Neurology', 'Neurosurgery', 'Trauma'],
  'seizure': ['Neurology', 'Emergency Medicine'],
  'fracture': ['Orthopedics', 'Trauma'],
  'broken bone': ['Orthopedics', 'Trauma'],
  'accident': ['Trauma', 'Emergency Medicine', 'Orthopedics', 'General Surgery'],
  'road accident': ['Trauma', 'Emergency Medicine', 'Orthopedics', 'General Surgery'],
  'burn': ['General Surgery', 'Emergency Medicine'],
  'breathing difficulty': ['Pulmonology', 'Emergency Medicine'],
  'respiratory distress': ['Pulmonology', 'Emergency Medicine'],
  'abdominal pain': ['Gastroenterology', 'General Surgery'],
  'pregnancy': ['Obstetrics', 'Gynecology'],
  'labor': ['Obstetrics', 'Gynecology', 'Neonatology'],
  'child emergency': ['Pediatrics', 'Neonatology'],
  'pediatric': ['Pediatrics'],
  'poisoning': ['Emergency Medicine', 'General Medicine'],
  'overdose': ['Emergency Medicine', 'General Medicine'],
  'bleeding': ['Emergency Medicine', 'General Surgery'],
  'kidney': ['Nephrology', 'Urology'],
  'liver': ['Hepatology', 'Gastroenterology'],
  'cancer': ['Oncology', 'Surgical Oncology'],
  'eye injury': ['Ophthalmology'],
  'ear injury': ['ENT'],
  'mental health': ['Psychiatry'],
  'infection': ['General Medicine', 'Infectious Diseases'],
  'fever': ['General Medicine'],
  'transplant': ['Transplant'],
  'spine injury': ['Spine Surgery', 'Neurosurgery', 'Orthopedics']
};

/**
 * Calculate the Haversine distance between two coordinates.
 * Returns distance in kilometers.
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Derive required specialties from symptoms list.
 */
function deriveRequiredSpecialties(symptoms, chiefComplaint) {
  const specialties = new Set();
  
  const allText = [...(symptoms || []), chiefComplaint || '']
    .map(s => s.toLowerCase());

  for (const text of allText) {
    for (const [keyword, specs] of Object.entries(SYMPTOM_SPECIALTY_MAP)) {
      if (text.includes(keyword)) {
        specs.forEach(s => specialties.add(s));
      }
    }
  }

  return Array.from(specialties);
}

/**
 * Score a hospital for a given emergency case.
 * Returns { score, reasons, missingCapabilities, isFallback }
 */
function scoreHospital(hospital, resource, emergencyCase, patientLat, patientLon, requiredSpecs, ktasReqs) {
  let score = 0;
  const reasons = [];
  const missingCapabilities = [];
  let meetsAllRequirements = true;

  // 1. Distance score (0-30 points) - closer is better
  const distance = haversineDistance(
    patientLat, patientLon,
    hospital.location.coordinates[1], // latitude
    hospital.location.coordinates[0]  // longitude
  );
  
  if (distance <= 5) {
    score += 30;
    reasons.push(`Very close (${distance.toFixed(1)} km)`);
  } else if (distance <= 10) {
    score += 25;
    reasons.push(`Nearby (${distance.toFixed(1)} km)`);
  } else if (distance <= 20) {
    score += 15;
    reasons.push(`Moderate distance (${distance.toFixed(1)} km)`);
  } else if (distance <= 30) {
    score += 8;
  } else {
    score += 2;
  }

  // 2. Emergency department (0-15 points)
  if (ktasReqs.requiresEmergency) {
    if (hospital.hasEmergency) {
      score += 15;
      reasons.push('Has emergency department');
    } else {
      missingCapabilities.push('Emergency Department');
      meetsAllRequirements = false;
    }
  } else if (hospital.hasEmergency) {
    score += 8;
  }

  // 3. Trauma center (0-10 points)
  if (ktasReqs.requiresTrauma) {
    if (hospital.hasTraumaCenter) {
      score += 10;
      reasons.push('Has trauma center');
    } else {
      missingCapabilities.push('Trauma Center');
      meetsAllRequirements = false;
    }
  } else if (hospital.hasTraumaCenter) {
    score += 5;
  }

  // 4. Specialty match (0-20 points)
  const hospitalSpecs = hospital.specialties.map(s => s.toLowerCase());
  let specMatch = 0;
  let specTotal = requiredSpecs.length || 1;

  for (const spec of requiredSpecs) {
    if (hospitalSpecs.some(hs => hs.includes(spec.toLowerCase()) || spec.toLowerCase().includes(hs))) {
      specMatch++;
      reasons.push(`Has ${spec}`);
    } else {
      missingCapabilities.push(spec);
    }
  }

  score += Math.round((specMatch / specTotal) * 20);

  // 5. ICU / Ventilator availability (0-15 points)
  if (resource) {
    if (ktasReqs.minICUBeds > 0) {
      if (resource.icuBeds.available >= ktasReqs.minICUBeds) {
        score += 8;
        reasons.push(`ICU beds available (${resource.icuBeds.available})`);
      } else {
        missingCapabilities.push('ICU Beds');
        meetsAllRequirements = false;
      }
    }

    if (ktasReqs.minVentilators > 0) {
      if (resource.ventilators.available >= ktasReqs.minVentilators) {
        score += 7;
        reasons.push(`Ventilators available (${resource.ventilators.available})`);
      } else {
        missingCapabilities.push('Ventilators');
        meetsAllRequirements = false;
      }
    }

    // Bonus for accepting emergencies
    if (resource.acceptingEmergencies) {
      score += 3;
    } else {
      score -= 10;
      missingCapabilities.push('Currently not accepting emergencies');
      meetsAllRequirements = false;
    }

    // Blood bank
    if (hospital.hasBloodBank && resource.bloodBankStatus === 'available') {
      score += 3;
      reasons.push('Blood bank available');
    }
  } else {
    // No resource data - give partial score but flag it
    score += 5;
    reasons.push('Resource availability data not available (synthetic defaults)');
  }

  // 6. Hospital type bonus (0-5 points)
  if (hospital.type === 'Government' && hospital.totalBeds > 500) {
    score += 5;
    reasons.push('Large government hospital');
  } else if (hospital.accreditation && hospital.accreditation.includes('JCI')) {
    score += 5;
    reasons.push('JCI accredited');
  } else if (hospital.accreditation === 'NABH') {
    score += 3;
  }

  // Check if specialty requirements are fully met
  if (requiredSpecs.length > 0 && specMatch < requiredSpecs.length * 0.5) {
    meetsAllRequirements = false;
  }

  return {
    hospital: hospital._id,
    score,
    distance: Math.round(distance * 10) / 10,
    reasons,
    missingCapabilities,
    meetsAllRequirements,
    isFallback: !meetsAllRequirements
  };
}

/**
 * Main hospital matching function.
 * 
 * @param {Object} emergencyCase - The emergency case document
 * @param {Object} options - Additional options
 * @returns {Object} { matches, fallbacks, requiredSpecialties }
 */
async function matchHospitals(emergencyCase, options = {}) {
  const {
    maxResults = 10,
    includeInactive = false
  } = options;

  const ktasLevel = emergencyCase.severity?.ktasLevel || 3;
  const ktasReqs = KTAS_REQUIREMENTS[ktasLevel];

  // Get patient location
  const [patientLon, patientLat] = emergencyCase.location.coordinates;

  // Derive required specialties from symptoms and complaint
  const requiredSpecs = deriveRequiredSpecialties(
    emergencyCase.symptoms,
    emergencyCase.chiefComplaint
  );

  // Query hospitals within reasonable distance
  const query = { isActive: true };
  if (!includeInactive) {
    query.isActive = true;
  }

  const hospitals = await Hospital.find(query);

  // Get resource data for all hospitals
  const resources = await HospitalResource.find({
    hospital: { $in: hospitals.map(h => h._id) }
  });
  const resourceMap = {};
  resources.forEach(r => {
    resourceMap[r.hospital.toString()] = r;
  });

  // Score each hospital
  const scored = hospitals.map(hospital => {
    const resource = resourceMap[hospital._id.toString()];
    return scoreHospital(hospital, resource, emergencyCase, patientLat, patientLon, requiredSpecs, ktasReqs);
  });

  // Separate into full matches and fallbacks
  const fullMatches = scored
    .filter(s => s.meetsAllRequirements)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);

  const fallbacks = scored
    .filter(s => !s.meetsAllRequirements)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  // If no full matches, use top fallbacks with explanation
  let finalMatches = fullMatches;
  let usedFallback = false;

  if (fullMatches.length === 0) {
    usedFallback = true;
    finalMatches = fallbacks.map((f, i) => ({
      ...f,
      rank: i + 1,
      isFallback: true
    }));
  } else {
    finalMatches = fullMatches.map((m, i) => ({
      ...m,
      rank: i + 1
    }));
  }

  return {
    matches: finalMatches,
    fallbacks: usedFallback ? [] : fallbacks.slice(0, 3),
    usedFallback,
    requiredSpecialties: requiredSpecs,
    ktasLevel,
    ktasRequirements: ktasReqs,
    totalHospitalsEvaluated: hospitals.length,
    fallbackExplanation: usedFallback 
      ? `No hospital fully meets all requirements for KTAS Level ${ktasLevel}. The following are the best available options with partial capability match. Missing capabilities are listed for each option.`
      : null
  };
}

module.exports = {
  matchHospitals,
  deriveRequiredSpecialties,
  haversineDistance,
  KTAS_REQUIREMENTS,
  SYMPTOM_SPECIALTY_MAP
};
