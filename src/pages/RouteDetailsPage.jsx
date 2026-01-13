import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, Gauge, Fuel, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../lib/axios';

export default function RouteDetailsPage() {
    const { tripId } = useParams();
    const navigate = useNavigate();
    const [routeData, setRouteData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedRoute, setSelectedRoute] = useState('fastest');

    useEffect(() => {
        const fetchRouteDetails = async () => {
            try {
                const { data } = await api.get(`/trips/${tripId}/route-details`);
                setRouteData(data);
            } catch (e) {
                console.error('Failed to fetch route details:', e);
            } finally {
                setLoading(false);
            }
        };

        fetchRouteDetails();
    }, [tripId]);

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const getRouteIcon = (type) => {
        switch (type) {
            case 'fastest':
                return '⚡';
            case 'shortest':
                return '📏';
            case 'scenic':
                return '🏔️';
            default:
                return '🛣️';
        }
    };

    const getRouteDescription = (type) => {
        switch (type) {
            case 'fastest':
                return 'Optimize for time. Uses highways and main roads.';
            case 'shortest':
                return 'Minimize distance. Best for fuel efficiency.';
            case 'scenic':
                return 'Enjoy the journey. Takes you through scenic areas.';
            default:
                return 'Recommended route';
        }
    };

    const routes = routeData?.alternatives || {};
    const currentRoute = routes[selectedRoute];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white p-4 shadow-sm border-b border-gray-100 sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft size={20} className="text-gray-700" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900">Route Options</h1>
                </div>
            </div>

            <div className="p-4 max-w-2xl mx-auto space-y-4">
                {/* Route Selection Cards */}
                <div className="space-y-3">
                    {['fastest', 'shortest', 'scenic'].map(routeType => {
                        const route = routes[routeType];
                        if (!route) return null;

                        const duration = Math.round(route.duration / 60);
                        const distance = (route.distance / 1000).toFixed(1);
                        const isSelected = selectedRoute === routeType;

                        return (
                            <motion.button
                                key={routeType}
                                onClick={() => setSelectedRoute(routeType)}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`w-full p-4 rounded-2xl border-2 transition-all text-left
                                    ${isSelected
                                        ? 'bg-blue-50 border-blue-600 shadow-lg'
                                        : 'bg-white border-gray-200 hover:border-gray-300'}`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">{getRouteIcon(routeType)}</span>
                                        <div>
                                            <h3 className="font-bold text-gray-900 capitalize text-lg">{routeType}</h3>
                                            <p className="text-sm text-gray-600">{getRouteDescription(routeType)}</p>
                                        </div>
                                    </div>
                                    {isSelected && (
                                        <div className="bg-blue-600 text-white p-2 rounded-full">
                                            <Check size={20} />
                                        </div>
                                    )}
                                </div>

                                {/* Route Stats */}
                                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
                                    <div className="flex items-center gap-2">
                                        <Clock size={16} className={isSelected ? 'text-blue-600' : 'text-gray-600'} />
                                        <div>
                                            <p className="text-xs text-gray-500">Duration</p>
                                            <p className="font-bold text-gray-900">{duration} min</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin size={16} className={isSelected ? 'text-blue-600' : 'text-gray-600'} />
                                        <div>
                                            <p className="text-xs text-gray-500">Distance</p>
                                            <p className="font-bold text-gray-900">{distance} km</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>

                {/* Route Details for Selected Route */}
                {currentRoute && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl shadow-sm p-6 space-y-6"
                    >
                        <div>
                            <h3 className="font-bold text-gray-900 mb-4 text-lg capitalize">
                                {selectedRoute} Route Details
                            </h3>

                            {/* Speed Limits */}
                            {routeData?.speed_limits && routeData.speed_limits.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                        <Gauge size={18} className="text-red-600" />
                                        Speed Limits
                                    </h4>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {routeData.speed_limits.map((limit, idx) => (
                                            <div
                                                key={idx}
                                                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                                            >
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                                        {limit.name}
                                                    </p>
                                                    <p className="text-xs text-gray-600">
                                                        {(limit.distance / 1000).toFixed(1)} km
                                                    </p>
                                                </div>
                                                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full font-bold text-sm">
                                                    {limit.max_speed || '—'} km/h
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Turn-by-Turn Instructions */}
                            {currentRoute.legs && currentRoute.legs.length > 0 && (
                                <div>
                                    <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                        <MapPin size={18} className="text-blue-600" />
                                        Directions ({currentRoute.legs.length} segments)
                                    </h4>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {currentRoute.legs.map((leg, idx) => (
                                            <div key={idx} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                                                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                                        {leg.distance ? `${(leg.distance / 1000).toFixed(1)} km` : 'Continue'}
                                                    </p>
                                                    <p className="text-xs text-gray-600">
                                                        {leg.duration ? `${Math.round(leg.duration / 60)} min` : 'No duration'}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Summary */}
                        <div className="border-t border-gray-200 pt-4">
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="text-center">
                                    <p className="text-xs text-gray-600 uppercase font-bold">Total Distance</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {(currentRoute.distance / 1000).toFixed(1)} km
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-gray-600 uppercase font-bold">Total Time</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {Math.round(currentRoute.duration / 60)} min
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => navigate(`/navigation/${tripId}?route=${selectedRoute}`)}
                                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 active:scale-95 transition-transform"
                            >
                                ✅ Confirm Route & Start
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
