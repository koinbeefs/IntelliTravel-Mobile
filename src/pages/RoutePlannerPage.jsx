import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { useLocation, useNavigate } from 'react-router-dom';
import { useRoutePlanner } from '../hooks/useRoutePlanner';
import { Navigation, ArrowLeft, Clock, MapPin, Save, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/axios';
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

function RouteFitter({ routeData }) {
    const map = useMap();
    useEffect(() => {
        if (routeData && routeData.coordinates.length > 0) {
            const bounds = routeData.coordinates.map(c => [c[1], c[0]]);
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [routeData, map]);
    return null;
}

export default function RoutePlannerPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { target } = location.state || {}; 

    const [userPos, setUserPos] = useState(null);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [tripTitle, setTripTitle] = useState(target?.name || 'My Trip');
    const [saving, setSaving] = useState(false);
    
    const { route, steps, duration, distance, loading, calculateRoute, formatDuration, formatDistance } = useRoutePlanner();

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const start = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setUserPos(start);
                if (target) calculateRoute(start, { lat: target.lat, lng: target.lng });
            });
        }
    }, [target]); 

    const polylinePositions = route ? route.coordinates.map(c => [c[1], c[0]]) : [];

    // Save Trip Handler
    const handleSaveTrip = async () => {
        if (!tripTitle.trim()) {
            alert('Please enter a trip title');
            return;
        }

        setSaving(true);
        try {
            // 1. Create Trip
            const tripRes = await api.post('/trips', {
                title: tripTitle,
                start_date: new Date().toISOString().split('T')[0],
                route_data: JSON.stringify(route)
            });

            const tripId = tripRes.data.id;

            // 2. Save Starting Point
            await api.post('/itineraries', {
                trip_id: tripId,
                place_id: 'START_LOCATION',
                place_name: 'Starting Point',
                lat: userPos.lat,
                lng: userPos.lng,
                day_number: 1,
                order: 0
            });

            // 3. Save Destination
            if (target) {
                await api.post('/itineraries', {
                    trip_id: tripId,
                    place_id: target.id,
                    place_name: target.name,
                    place_address: target.address,
                    lat: target.lat,
                    lng: target.lng,
                    day_number: 1,
                    order: 1,
                    notes: `${formatDistance(distance)} • ${formatDuration(duration)}`
                });
            }

            setShowSaveModal(false);
            alert('🎉 Trip saved successfully!');
            navigate('/trips', { replace: true });
        } catch (e) {
            console.error('Save error:', e);
            alert('Failed to save trip. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="h-screen w-full flex flex-col relative bg-gray-50">
            
            {/* Header */}
            <div className="bg-white p-4 shadow-sm z-10 flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft size={20} className="text-gray-700" />
                    </button>
                    <div>
                        <h1 className="font-bold text-gray-800 text-lg">Route Preview</h1>
                        <p className="text-xs text-gray-500 truncate max-w-[200px]">
                            {target ? `To: ${target.name}` : 'Select destination'}
                        </p>
                    </div>
                </div>
                {route && (
                    <button 
                        onClick={() => setShowSaveModal(true)}
                        className="text-blue-600 font-bold text-sm flex items-center gap-1.5 hover:bg-blue-50 px-3 py-2 rounded-lg transition"
                    >
                        <Save size={16} /> Save
                    </button>
                )}
            </div>

            {/* Map */}
            <div className="flex-1 relative z-0">
                <MapContainer center={[14.5995, 120.9842]} zoom={13} className="h-full w-full">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {userPos && (
                        <Marker position={[userPos.lat, userPos.lng]}>
                            <Popup>📍 You are here</Popup>
                        </Marker>
                    )}
                    {target && (
                        <Marker position={[target.lat, target.lng]}>
                            <Popup>🎯 {target.name}</Popup>
                        </Marker>
                    )}
                    {polylinePositions.length > 0 && (
                        <Polyline positions={polylinePositions} color="#2563eb" weight={6} opacity={0.8} />
                    )}
                    {route && <RouteFitter routeData={route} />}
                </MapContainer>
            </div>

            {/* Directions Sheet */}
            <div className="bg-white rounded-t-3xl shadow-[0_-5px_30px_rgba(0,0,0,0.1)] z-10 max-h-[45vh] overflow-y-auto flex flex-col">
                {loading ? (
                    <div className="p-8 text-center text-gray-500 flex flex-col items-center gap-2">
                        <Loader2 className="animate-spin" size={24} />
                        Calculating best route...
                    </div>
                ) : route ? (
                    <div className="p-6">
                        {/* Summary */}
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-3xl font-bold text-blue-600">{formatDuration(duration)}</h2>
                                <div className="flex items-center gap-2 text-gray-500 text-sm mt-1 font-medium">
                                    <MapPin size={14} />
                                    <span>{formatDistance(distance)} away</span>
                                </div>
                            </div>
                            <button className="bg-blue-600 text-white w-14 h-14 rounded-full shadow-xl shadow-blue-200 flex items-center justify-center active:scale-90 transition-transform hover:bg-blue-700">
                                <Navigation size={28} />
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-gray-100 mb-6" />

                        {/* Turn-by-Turn */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Turn-by-Turn Directions</h3>
                            {steps.slice(0, 8).map((step, i) => (
                                <div key={i} className="flex gap-3 pb-3 border-b border-gray-50 last:border-0">
                                    <div className="mt-0.5 text-gray-400">
                                        <Navigation size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-800 font-medium">
                                            {step.maneuver.type === 'depart' ? '🚗 Start' : '↻ ' + step.maneuver.type}
                                            <span className="font-bold"> {step.name ? `on ${step.name}` : ''}</span>
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5">{step.distance.toFixed(0)}m</p>
                                    </div>
                                </div>
                            ))}
                            {steps.length > 8 && (
                                <p className="text-xs text-gray-400 text-center italic pt-2">+{steps.length - 8} more steps</p>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="p-8 text-center text-gray-400">
                        Select a destination from Home or Map to start planning.
                    </div>
                )}
            </div>

            {/* Save Modal */}
            <AnimatePresence>
                {showSaveModal && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            onClick={() => setShowSaveModal(false)}
                            className="fixed inset-0 bg-black/40 z-[100]"
                        />
                        <motion.div 
                            initial={{ y: '100%' }} 
                            animate={{ y: 0 }} 
                            exit={{ y: '100%' }}
                            className="fixed bottom-0 left-0 w-full z-[101] bg-white rounded-t-3xl p-6 shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-800">Save This Trip</h2>
                                <button onClick={() => setShowSaveModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-bold text-gray-600 block mb-2">Trip Title</label>
                                    <input 
                                        type="text" 
                                        value={tripTitle} 
                                        onChange={(e) => setTripTitle(e.target.value)}
                                        placeholder="e.g., Sweet Inferno Visit"
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                    <p className="text-sm text-blue-800">
                                        <span className="font-bold">📍 Route:</span> {formatDistance(distance)} • <span className="font-bold">⏱️ {formatDuration(duration)}</span>
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => setShowSaveModal(false)}
                                        className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleSaveTrip}
                                        disabled={saving}
                                        className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2 className="animate-spin" size={16} />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save size={16} />
                                                Save Trip
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
