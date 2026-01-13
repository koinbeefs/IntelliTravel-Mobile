import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit2, Share2, Download, MapPin, 
  Calendar, Clock, Trash2, UserPlus, MessageSquare, X 
} from 'lucide-react'; // <--- Added New Icons
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { useTrip } from '../hooks/useTrip';
import ItineraryTimeline from '../components/ItineraryTimeline';
import WeatherWidget from '../components/WeatherWidget';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/axios'; // <--- Import API

// Fix Leaflet icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

export default function TripDetailsPage() {
    const { tripId } = useParams();
    const navigate = useNavigate();
    const { currentTrip, itineraries, fetchTrip, getRouteDetails, deleteItinerary } = useTrip();
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState(1);
    const [routeDetails, setRouteDetails] = useState(null);
    const [showStats, setShowStats] = useState(false);

    // --- NEW: Collaboration State ---
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviting, setInviting] = useState(false);

    useEffect(() => {
        fetchTrip(tripId).then(async () => {
            try {
                const details = await getRouteDetails(tripId);
                setRouteDetails(details);
            } catch (e) {
                console.error('Failed to fetch route details:', e);
            }
            setLoading(false);
        });
    }, [tripId]);

    // --- NEW: Invite Handler ---
    const handleInvite = async (e) => {
        e.preventDefault();
        setInviting(true);
        try {
            await api.post(`/trips/${tripId}/invite`, { email: inviteEmail });
            alert("Invitation sent successfully!");
            setShowInviteModal(false);
            setInviteEmail('');
        } catch (error) {
            alert(error.response?.data?.message || "Failed to send invitation.");
        } finally {
            setInviting(false);
        }
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!currentTrip) {
        return <div className="h-screen flex items-center justify-center">Trip not found</div>;
    }

    const tripDays = itineraries.length > 0
        ? Math.max(...itineraries.map(i => i.day_number))
        : 1;

    const totalDistance = routeDetails?.total_distance || 0;
    const totalDuration = routeDetails?.total_duration || 0;
    const totalPlaces = itineraries.length;

    const routeCoordinates = routeDetails?.route?.geometry?.coordinates
        ? routeDetails.route.geometry.coordinates.map(c => [c[1], c[0]])
        : [];

    return (
        <div className="min-h-screen bg-gray-50 relative"> {/* Relative for Modal */}
            {/* Header */}
            <div className="bg-white p-4 shadow-sm border-b border-gray-100 sticky top-0 z-20">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate('/trips')} className="p-2 hover:bg-gray-100 rounded-full">
                            <ArrowLeft size={20} className="text-gray-700" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">{currentTrip.title}</h1>
                            <p className="text-xs text-gray-500">{currentTrip.destination}</p>
                        </div>
                    </div>
                    
                    {/* --- NEW: Collaboration Buttons --- */}
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setShowInviteModal(true)} 
                            className="p-2 bg-blue-50 hover:bg-blue-100 rounded-full text-blue-600" 
                            title="Invite Friends"
                        >
                            <UserPlus size={20} />
                        </button>
                        <button 
                            onClick={() => navigate(`/chat/${tripId}`)} 
                            className="p-2 bg-green-50 hover:bg-green-100 rounded-full text-green-600" 
                            title="Group Chat"
                        >
                            <MessageSquare size={20} />
                        </button>
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-blue-50 p-3 rounded-lg text-center">
                        <p className="text-xs text-gray-500 uppercase font-bold">Distance</p>
                        <p className="text-lg font-bold text-blue-600">{totalDistance.toFixed(1)} km</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg text-center">
                        <p className="text-xs text-gray-500 uppercase font-bold">Duration</p>
                        <p className="text-lg font-bold text-green-600">{Math.round(totalDuration)} hrs</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg text-center">
                        <p className="text-xs text-gray-500 uppercase font-bold">Places</p>
                        <p className="text-lg font-bold text-purple-600">{totalPlaces}</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 p-4 max-w-7xl mx-auto">
                {/* Left: Map */}
                <div className="flex-1 bg-white rounded-2xl shadow-sm overflow-hidden">
                    <MapContainer
                        center={[currentTrip.center_lat, currentTrip.center_lng]}
                        zoom={11}
                        className="h-96 w-full"
                        zoomControl={false}
                    >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        
                        {routeCoordinates.length > 0 && (
                            <Polyline positions={routeCoordinates} color="#2563eb" weight={4} opacity={0.7} />
                        )}

                        {itineraries.map((item, idx) => (
                            <Marker
                                key={item.id}
                                position={[item.lat, item.lng]}
                                title={`${idx + 1}. ${item.place_name}`}
                            />
                        ))}
                    </MapContainer>
                </div>

                {/* Right: Itinerary List */}
                <div className="lg:w-96 bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
                    {/* Day selector */}
                    <div className="p-4 border-b border-gray-100 flex gap-2 overflow-x-auto">
                        {Array.from({ length: tripDays }, (_, i) => i + 1).map(day => (
                            <button
                                key={day}
                                onClick={() => setSelectedDay(day)}
                                className={`px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all
                                    ${selectedDay === day
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                Day {day}
                            </button>
                        ))}
                    </div>

                    {/* Timeline */}
                    <div className="flex-1 overflow-y-auto p-4">
                        <ItineraryTimeline
                            itineraries={itineraries}
                            selectedDay={selectedDay}
                            onDelete={deleteItinerary}
                            onEdit={() => {}}
                        />
                    </div>

                    {/* Action buttons */}
                    <div className="p-4 border-t border-gray-100 space-y-3">
                        <button
                            onClick={() => navigate(`/trip-builder/${tripId}`)}
                            className="w-full bg-blue-50 text-blue-600 py-3 rounded-lg font-bold hover:bg-blue-100 active:scale-95 transition-transform flex items-center justify-center gap-2"
                        >
                            <Edit2 size={18} />
                            Edit Itinerary
                        </button>
                        <button
                            onClick={() => navigate(`/navigation/${tripId}`)}
                            className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 active:scale-95 transition-transform flex items-center justify-center gap-2"
                        >
                            <MapPin size={18} />
                            Start Navigation
                        </button>
                    </div>
                </div>
            </div>

            {/* Route Details Section */}
            {routeDetails && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-7xl mx-auto mt-6 p-4"
                >
                    <button
                        onClick={() => setShowStats(!showStats)}
                        className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-left font-bold text-gray-900 flex justify-between items-center"
                    >
                        📊 Route Details & Insights
                        <span className={`transition-transform ${showStats ? 'rotate-180' : ''}`}>▼</span>
                    </button>

                    {showStats && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-4 bg-white rounded-xl shadow-sm p-6"
                        >
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="text-center">
                                    <p className="text-sm text-gray-600 mb-1">Total Distance</p>
                                    <p className="text-2xl font-bold text-blue-600">{totalDistance.toFixed(1)}</p>
                                    <p className="text-xs text-gray-500">kilometers</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-gray-600 mb-1">Est. Duration</p>
                                    <p className="text-2xl font-bold text-green-600">{Math.round(totalDuration)}</p>
                                    <p className="text-xs text-gray-500">hours</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-gray-600 mb-1">Transit Type</p>
                                    <p className="text-2xl font-bold text-purple-600 capitalize">{currentTrip.transit_type}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-gray-600 mb-1">Trip Type</p>
                                    <p className="text-2xl font-bold text-indigo-600 capitalize">{currentTrip.trip_type}</p>
                                </div>
                            </div>

                            {/* Speed Limits & Road Info */}
                            {routeDetails?.speed_limits && routeDetails.speed_limits.length > 0 && (
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-3">🚗 Speed Limits & Roads</h3>
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {routeDetails.speed_limits.slice(0, 10).map((limit, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg text-sm">
                                                <span className="text-gray-700 truncate">{limit.name}</span>
                                                <span className="font-bold text-red-600">{limit.max_speed || '---'} km/h</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </motion.div>
            )}

            {/* --- NEW: Invite Modal --- */}
            <AnimatePresence>
                {showInviteModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center p-4"
                    >
                        <motion.div 
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl relative"
                        >
                            <button 
                                onClick={() => setShowInviteModal(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                            >
                                <X size={20} />
                            </button>

                            <div className="text-center mb-6">
                                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <UserPlus className="text-blue-600 w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Invite Friends</h3>
                                <p className="text-sm text-gray-500">Add people to plan this trip with you.</p>
                            </div>

                            <form onSubmit={handleInvite}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                    <input 
                                        type="email" 
                                        required
                                        placeholder="friend@example.com"
                                        className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        value={inviteEmail}
                                        onChange={e => setInviteEmail(e.target.value)}
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={inviting}
                                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {inviting ? 'Sending...' : 'Send Invite'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
