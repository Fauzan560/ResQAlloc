import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Building2, Navigation, Clock, ShieldCheck, AlertTriangle, Activity } from 'lucide-react';

// Custom Map Controller to smoothly re-center / fit bounds
const MapBoundsController = ({ patientLocation, recommendedHospitals, routeCoordinates }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    try {
      const bounds = [];

      if (patientLocation && patientLocation.latitude && patientLocation.longitude) {
        bounds.push([patientLocation.latitude, patientLocation.longitude]);
      }

      if (recommendedHospitals && recommendedHospitals.length > 0) {
        recommendedHospitals.forEach((item) => {
          const hosp = item.hospital || item;
          if (hosp?.location?.coordinates && hosp.location.coordinates.length === 2) {
            bounds.push([hosp.location.coordinates[1], hosp.location.coordinates[0]]);
          }
        });
      }

      if (routeCoordinates && routeCoordinates.length > 0) {
        routeCoordinates.forEach(coord => {
          bounds.push(coord);
        });
      }

      if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      } else if (bounds.length === 1) {
        map.setView(bounds[0], 13);
      }
    } catch (err) {
      console.warn('Map fitBounds warning:', err);
    }
  }, [map, patientLocation, recommendedHospitals, routeCoordinates]);

  return null;
};

// DivIcon Creators to avoid broken Leaflet asset paths
const createPatientIcon = () => {
  return L.divIcon({
    className: 'custom-patient-marker',
    html: `
      <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
        <span style="position: absolute; width: 100%; height: 100%; border-radius: 9999px; background: rgba(239, 68, 68, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <div style="width: 26px; height: 26px; border-radius: 9999px; background: #dc2626; border: 3px solid #ffffff; box-shadow: 0 0 15px rgba(220, 38, 38, 0.9); display: flex; align-items: center; justify-content: center; color: white; font-size: 13px;">
          🚑
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -17],
  });
};

const createHospitalIcon = (rank, isFallback, isSelected) => {
  let bgColor = '#3b82f6';
  let borderColor = '#ffffff';
  let size = 28;

  if (rank === 1) {
    bgColor = '#10b981'; // Top match
    size = 34;
  } else if (isFallback) {
    bgColor = '#f59e0b'; // Fallback
  }

  if (isSelected) {
    borderColor = '#fbbf24';
  }

  return L.divIcon({
    className: 'custom-hospital-marker',
    html: `
      <div style="
        width: ${size}px; 
        height: ${size}px; 
        border-radius: 9999px; 
        background: ${bgColor}; 
        border: 2px solid ${borderColor}; 
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6); 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        color: white; 
        font-weight: 800; 
        font-size: ${size > 30 ? '13px' : '11px'};
      ">
        ${rank ? `#${rank}` : '🏥'}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

const createBackgroundHospitalIcon = () => {
  return L.divIcon({
    className: 'bg-hospital-marker',
    html: `
      <div style="
        width: 14px; 
        height: 14px; 
        border-radius: 9999px; 
        background: #475569; 
        border: 1.5px solid #94a3b8; 
        opacity: 0.6;
        box-shadow: 0 1px 4px rgba(0,0,0,0.4);
      "></div>
    `,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
};

export const EmergencyMap = ({
  patientLocation,
  recommendedHospitals = [],
  allHospitals = [],
  selectedHospitalId = null,
  routePolyline = null,
  onSelectHospital = () => {},
  height = '500px'
}) => {
  // Default Hyderabad Center
  const defaultCenter = [17.3850, 78.4867];

  // Parse route polyline from OSRM format (array of [lat, lon] or GeoJSON coordinates [lon, lat])
  const parsedRouteCoordinates = useMemo(() => {
    if (!routePolyline) return [];

    // If it's already an array of [lat, lng]
    if (Array.isArray(routePolyline) && routePolyline.length > 0) {
      if (typeof routePolyline[0][0] === 'number') {
        // Check if [lat, lng] or [lng, lat]
        // In Hyderabad lat ~ 17, lng ~ 78
        if (routePolyline[0][0] < 30 && routePolyline[0][1] > 60) {
          return routePolyline; // Already [lat, lng]
        } else if (routePolyline[0][0] > 60 && routePolyline[0][1] < 30) {
          // It's [lng, lat], reverse to [lat, lng]
          return routePolyline.map(pt => [pt[1], pt[0]]);
        }
      }
    }

    // If GeoJSON geometry object { coordinates: [[lon, lat], ...] }
    if (routePolyline.coordinates && Array.isArray(routePolyline.coordinates)) {
      return routePolyline.coordinates.map(pt => [pt[1], pt[0]]);
    }

    return [];
  }, [routePolyline]);

  const recommendedIds = useMemo(() => {
    return new Set(recommendedHospitals.map(r => (r.hospital?._id || r.hospital || r._id)?.toString()));
  }, [recommendedHospitals]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl" style={{ height }}>
      {/* Map Legend Overlay */}
      <div className="absolute top-4 right-4 z-[400] glass-card px-3 py-2 rounded-xl text-xs space-y-1.5 border border-slate-700/80 pointer-events-auto">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Map Legend</div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-red-600 border border-white flex items-center justify-center text-[8px] text-white">🚑</span>
          <span className="text-slate-200">Incident / Patient</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border border-white flex items-center justify-center text-[9px] font-bold text-white">#1</span>
          <span className="text-slate-200">Top Match (Optimal)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-blue-500 border border-white flex items-center justify-center text-[9px] font-bold text-white">#2</span>
          <span className="text-slate-200">Alternative Matches</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-slate-500 border border-slate-300 opacity-60"></span>
          <span className="text-slate-400">Hyderabad Hospitals (99)</span>
        </div>
        {parsedRouteCoordinates.length > 0 && (
          <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
            <span className="w-4 h-1 bg-cyan-400 rounded-full shadow-glow-blue"></span>
            <span className="text-cyan-300 font-semibold text-[11px]">OSRM Road Route</span>
          </div>
        )}
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={12}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapBoundsController
          patientLocation={patientLocation}
          recommendedHospitals={recommendedHospitals}
          routeCoordinates={parsedRouteCoordinates}
        />

        {/* Patient Marker */}
        {patientLocation && patientLocation.latitude && patientLocation.longitude && (
          <Marker
            position={[parseFloat(patientLocation.latitude), parseFloat(patientLocation.longitude)]}
            icon={createPatientIcon()}
          >
            <Popup>
              <div className="text-slate-900">
                <div className="font-bold text-red-600 flex items-center gap-1 text-sm">
                  <span>🚑</span> Emergency Incident Location
                </div>
                <p className="text-xs text-slate-700 mt-1">
                  {patientLocation.address || 'Reported Incident Point'}
                </p>
                <div className="text-[11px] font-mono text-slate-500 mt-1">
                  {parseFloat(patientLocation.latitude).toFixed(4)}, {parseFloat(patientLocation.longitude).toFixed(4)}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* OSRM Route Polyline */}
        {parsedRouteCoordinates.length > 0 && (
          <>
            {/* Glow backing line */}
            <Polyline
              positions={parsedRouteCoordinates}
              pathOptions={{
                color: '#38bdf8',
                weight: 8,
                opacity: 0.4,
                lineCap: 'round',
                lineJoin: 'round'
              }}
            />
            {/* Primary line */}
            <Polyline
              positions={parsedRouteCoordinates}
              pathOptions={{
                color: '#0284c7',
                weight: 4,
                opacity: 0.95,
                lineCap: 'round',
                lineJoin: 'round',
                dashArray: '8, 4'
              }}
            />
          </>
        )}

        {/* Recommended Hospital Markers */}
        {recommendedHospitals.map((match, idx) => {
          const hosp = match.hospital || match;
          if (!hosp?.location?.coordinates || hosp.location.coordinates.length < 2) return null;
          const [lon, lat] = hosp.location.coordinates;
          const rank = match.rank || idx + 1;
          const isSelected = selectedHospitalId === hosp._id;

          return (
            <Marker
              key={hosp._id || idx}
              position={[lat, lon]}
              icon={createHospitalIcon(rank, match.isFallback, isSelected)}
            >
              <Popup>
                <div className="min-w-[200px] text-slate-900">
                  <div className="flex items-center justify-between gap-2 border-b pb-1.5">
                    <span className="font-extrabold text-sm text-slate-900 leading-tight">
                      {hosp.name}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 shrink-0">
                      Rank #{rank}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-1">{hosp.area}, Hyderabad</p>

                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Distance</span>
                      <span className="font-bold text-slate-800">
                        {match.distance ? `${match.distance.toFixed(1)} km` : 'Calculating...'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Est. Travel Time</span>
                      <span className="font-bold text-slate-800">
                        {match.estimatedTime ? `${Math.round(match.estimatedTime)} min` : 'Est. 15 min'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">ICU Available</span>
                      <span className="font-bold text-emerald-700">
                        {hosp.icuBeds || 'Synthetic'} beds
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Match Score</span>
                      <span className="font-bold text-blue-700">
                        {match.score ? `${Math.round(match.score)}%` : '92%'}
                      </span>
                    </div>
                  </div>

                  {match.isFallback && (
                    <div className="mt-2 bg-amber-50 border border-amber-200 p-1.5 rounded text-[10px] text-amber-800">
                      ⚠️ Fallback: {match.missingCapabilities?.join(', ') || 'Partial capability match'}
                    </div>
                  )}

                  <button
                    onClick={() => onSelectHospital(hosp._id)}
                    className="w-full mt-3 py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-lg transition-colors shadow"
                  >
                    Select & Route to Hospital
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Background 99 Hospitals (if not in top recommended) */}
        {allHospitals.map((hosp) => {
          if (!hosp?.location?.coordinates || recommendedIds.has(hosp._id?.toString())) return null;
          const [lon, lat] = hosp.location.coordinates;

          return (
            <Marker
              key={hosp._id}
              position={[lat, lon]}
              icon={createBackgroundHospitalIcon()}
            >
              <Popup>
                <div className="text-slate-900 text-xs min-w-[180px]">
                  <p className="font-bold">{hosp.name}</p>
                  <p className="text-slate-500 text-[11px]">{hosp.area} • {hosp.type}</p>
                  <div className="mt-1 text-[10px] text-slate-600">
                    Emergency 24/7: {hosp.hasEmergency ? '✅ Yes' : '❌ No'}
                  </div>
                  <div className="text-[9px] text-amber-700 mt-1">
                    * synthetic capacity model
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default EmergencyMap;
