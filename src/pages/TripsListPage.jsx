import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Clock, ChevronRight, Trash2, Plus, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../lib/axios';

export default function TripsListPage() {
    const navigate = useNavigate();
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTrips();
    }, []);

    const fetchTrips = async () => {
        try {
            const { data } = await api.get('/trips');
            setTrips(data);
        } catch (e) {
            console.error('Fetch trips error:', e);
        } finally {
            setLoading(false);
        }
    };

    const deleteTrip = async (tripId) => {
        if (!confirm('Are you sure you want to delete this trip?')) return;
        try {
            await api.delete(`/trips/${tripId}`);
            setTrips(trips.filter(t => t.id !== tripId));
            alert('Trip deleted');
        } catch (e) {
            alert('Failed to delete trip');
        }
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            
            {/* Header */}
            <div className="bg-white p-6 shadow-sm sticky top-0 z-10 flex justify-between items-center border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft size={20} className="text-gray-700" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">My Trips</h1>
                        <p className="text-xs text-gray-500">{trips.length} saved trip{trips.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>
                <button 
                    onClick={() => navigate('/trip-create')}
                    className="bg-blue-600 text-white p-3 rounded-full shadow-lg active:scale-90 transition-transform"
                >
                    <Plus size={24} />
                </button>
            </div>

            {/* Trips List */}
            <div className="p-6 space-y-4">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : trips.length > 0 ? (
                    trips.map((trip, i) => (
                        <motion.div 
                            key={trip.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => navigate(`/trips/${trip.id}`)}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-900 text-lg">{trip.title}</h3>
                                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                        <MapPin size={14} />
                                        {trip.itineraries_count} location{trip.itineraries_count !== 1 ? 's' : ''}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteTrip(trip.id);
                                        }}
                                        className="p-2 hover:bg-red-50 rounded-lg transition"
                                    >
                                        <Trash2 size={18} className="text-red-500" />
                                    </button>
                                    <ChevronRight size={20} className="text-gray-400" />
                                </div>
                            </div>

                            <div className="flex gap-4 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                    <Calendar size={12} />
                                    {formatDate(trip.created_at)}
                                </div>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="text-center py-16">
                        <div className="text-4xl mb-3">🗺️</div>
                        <h3 className="font-bold text-gray-700 mb-1">No trips yet</h3>
                        <p className="text-sm text-gray-500 mb-4">Start planning your first adventure!</p>
                        <button 
                            onClick={() => navigate('/trip-create')}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition"
                        >
                            Plan a Trip
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
