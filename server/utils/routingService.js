const fetch = require('node-fetch');

/**
 * Routing Service - integrates with OSRM (Open Source Routing Machine)
 * to provide road routes, distances, and estimated travel times.
 * 
 * Uses the public OSRM demo server for academic/demonstration purposes.
 * For production use, deploy a private OSRM instance.
 */

const OSRM_BASE_URL = process.env.OSRM_BASE_URL || 'https://router.project-osrm.org';

/**
 * Get route between two points.
 * 
 * @param {number} fromLat - Start latitude
 * @param {number} fromLon - Start longitude
 * @param {number} toLat - End latitude
 * @param {number} toLon - End longitude
 * @returns {Object} { distance, duration, geometry, steps }
 */
async function getRoute(fromLat, fromLon, toLat, toLon) {
  try {
    const url = `${OSRM_BASE_URL}/route/v1/driving/${fromLon},${fromLat};${toLon},${toLat}?overview=full&geometries=geojson&steps=true`;
    
    const response = await fetch(url, {
      timeout: 10000 // 10s timeout
    });
    
    if (!response.ok) {
      throw new Error(`OSRM request failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error('No route found');
    }

    const route = data.routes[0];

    return {
      distance: Math.round(route.distance / 100) / 10, // Convert to km, 1 decimal
      duration: Math.round(route.duration / 60),         // Convert to minutes
      geometry: route.geometry,                           // GeoJSON LineString
      steps: route.legs[0]?.steps?.map(step => ({
        instruction: step.maneuver?.instruction || '',
        distance: Math.round(step.distance),
        duration: Math.round(step.duration),
        name: step.name || ''
      })) || [],
      source: 'OSRM',
      disclaimer: 'Route calculated using OSRM public demo server. Travel times are estimates and may not reflect actual traffic conditions.'
    };
  } catch (error) {
    console.error('OSRM routing error:', error.message);
    
    // Fallback: estimate using straight-line distance
    return getEstimatedRoute(fromLat, fromLon, toLat, toLon);
  }
}

/**
 * Fallback route estimation using Haversine distance.
 * Used when OSRM is unavailable.
 */
function getEstimatedRoute(fromLat, fromLon, toLat, toLon) {
  const R = 6371;
  const dLat = toRad(toLat - fromLat);
  const dLon = toRad(toLon - fromLon);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(fromLat)) * Math.cos(toRad(toLat)) *
            Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightLineDistance = R * c;
  
  // Road distance is typically 1.3-1.5x straight-line distance in urban areas
  const estimatedRoadDistance = straightLineDistance * 1.4;
  // Assume average speed of 25 km/h in Hyderabad traffic
  const estimatedDuration = (estimatedRoadDistance / 25) * 60;

  return {
    distance: Math.round(estimatedRoadDistance * 10) / 10,
    duration: Math.round(estimatedDuration),
    geometry: {
      type: 'LineString',
      coordinates: [
        [fromLon, fromLat],
        [toLon, toLat]
      ]
    },
    steps: [],
    source: 'estimated',
    disclaimer: 'Route estimated using straight-line distance with urban traffic factor. OSRM service was unavailable.'
  };
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Get routes from patient to multiple hospitals.
 * Returns routes sorted by travel time.
 */
async function getMultipleRoutes(fromLat, fromLon, hospitals) {
  const routes = await Promise.all(
    hospitals.map(async (hospital) => {
      const [hospitalLon, hospitalLat] = hospital.location?.coordinates || 
        [hospital.longitude, hospital.latitude];
      
      const route = await getRoute(fromLat, fromLon, hospitalLat, hospitalLon);
      
      return {
        hospitalId: hospital._id || hospital.id,
        hospitalName: hospital.name,
        ...route
      };
    })
  );

  return routes.sort((a, b) => a.duration - b.duration);
}

module.exports = {
  getRoute,
  getEstimatedRoute,
  getMultipleRoutes
};
