import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Navigation, Loader2, PlayCircle, MapPin, Compass } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useTrip } from '../hooks/useTrip';

// --- 1. Custom "Heading" Icon (Arrow) ---
const createHeadingIcon = (heading) => L.divIcon({
  className: 'user-heading-marker',
  html: `
    <div style="transform: rotate(${heading}deg); width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
      <div style="width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-bottom: 20px solid #3b82f6; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

// --- 2. Map Controller ---
function LiveMapController({ center, heading }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      // Offset center slightly to show more of the road ahead? For now, keeps it centered.
      map.flyTo(center, 18, { animate: true, duration: 1.0 });
    }
  }, [center, map]);
  return null;
}

// --- Helper: Distance Calc ---
function getDistanceMeters(lat1, lon1, lat2, lon2) {
  var R = 6371; 
  var dLat = (lat2-lat1) * (Math.PI/180);
  var dLon = (lon2-lon1) * (Math.PI/180); 
  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * (Math.PI/180)) * Math.cos(lat2 * (Math.PI/180)) * 
          Math.sin(dLon/2) * Math.sin(dLon/2); 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c * 1000;
}

export default function LiveNavigationPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { currentTrip, itineraries, fetchTrip } = useTrip();

  // State
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(false); // Is navigation running?
  const [userPos, setUserPos] = useState(null);
  const [heading, setHeading] = useState(0);
  
  // Route State
  const [routePolyline, setRoutePolyline] = useState([]);
  const [nextStop, setNextStop] = useState(null);
  const [instructions, setInstructions] = useState("Ready to start");
  const [stats, setStats] = useState({ distance: 0, duration: 0 });

  // Refs for Cleanup
  const watchId = useRef(null);
  const wakeLock = useRef(null);

  // --- 1. Init Data ---
  useEffect(() => {
    fetchTrip(tripId).then(() => {
      setLoading(false);
    });
  }, [tripId]);

  // --- 2. Route Calculation (OSRM) ---
  const fetchRoute = async (start, end) => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end.lng},${end.lat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.routes?.[0]) {
        const route = data.routes[0];
        setRoutePolyline(route.geometry.coordinates.map(c => [c[1], c[0]]));
        setStats({
          distance: (route.distance / 1000).toFixed(1),
          duration: Math.ceil(route.duration / 60)
        });
        setInstructions(`Head to ${end.place_name}`);
      }
    } catch (e) {
      console.error("OSRM Error:", e);
    }
  };

  // --- 3. Start Navigation (Real Hardware Access) ---
  const startNavigation = async () => {
    if (!navigator.geolocation) return alert("GPS not supported");
    
    setActive(true);
    
    // A. Request Wake Lock (Keep screen on)
    try {
      if ('wakeLock' in navigator) {
        wakeLock.current = await navigator.wakeLock.request('screen');
      }
    } catch (err) {
      console.log("Wake Lock error:", err);
    }

    // B. Find first target
    const target = itineraries.find(i => i.order >= 0); // Logic: find next unvisited?
    if (target) setNextStop(target);

    // C. Start Watch
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, heading: gpsHeading, speed } = pos.coords;
        const newPos = [latitude, longitude];
        
        setUserPos(newPos);
        if (gpsHeading) setHeading(gpsHeading);

        // Logic: Calculate Route if empty
        if (routePolyline.length === 0 && target) {
          fetchRoute(newPos, target);
        }

        // Logic: Check Arrival (30 meters)
        if (target) {
          const dist = getDistanceMeters(latitude, longitude, target.lat, target.lng);
          if (dist < 30) {
            setInstructions(`You have arrived at ${target.place_name}!`);
            // Optional: Vibrate phone
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
          }
        }
      },
      (err) => console.error("GPS Error", err),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );
  };

  // --- 4. Cleanup ---
  useEffect(() => {
    return () => {
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
      if (wakeLock.current) wakeLock.current.release();
    };
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="relative h-screen w-full flex flex-col">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-[1000] p-4 bg-gradient-to-b from-black/50 to-transparent text-white">
        <button onClick={() => navigate(-1)} className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>

      {/* Map */}
      <MapContainer center={[14.5995, 120.9842]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        <LiveMapController center={userPos} heading={heading} />
        
        {/* Route Line */}
        {routePolyline.length > 0 && <Polyline positions={routePolyline} color="#3b82f6" weight={5} opacity={0.7} />}

        {/* User Arrow */}
        {userPos && (
          <Marker position={userPos} icon={createHeadingIcon(heading)} />
        )}

        {/* Destination */}
        {nextStop && <Marker position={[nextStop.lat, nextStop.lng]} />}
      </MapContainer>

      {/* Bottom Control Panel */}
      <div className="absolute bottom-0 left-0 right-0 z-[1000] bg-white rounded-t-3xl shadow-2xl p-6">
        {!active ? (
          <div className="text-center">
            <h2 className="text-xl font-bold mb-2">Ready to Start?</h2>
            <p className="text-gray-500 mb-4">
              Next Stop: {nextStop?.place_name || "Select a destination"}
            </p>
            <button 
              onClick={startNavigation}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2"
            >
              <Navigation className="w-5 h-5" /> Start Navigation
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <Compass className="w-8 h-8 text-blue-600" style={{ transform: `rotate(${heading}deg)` }} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">{stats.distance} km remaining</h3>
              <p className="text-gray-500">{instructions}</p>
            </div>
            <div className="text-right">
              <span className="block text-2xl font-bold">{stats.duration}</span>
              <span className="text-xs text-gray-400">MIN</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
