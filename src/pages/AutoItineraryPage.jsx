import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, Check, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTrip } from '../hooks/useTrip';
import api from '../lib/axios';
import ItineraryTimeline from '../components/ItineraryTimeline';

export default function AutoItineraryPage() {
    const { tripId } = useParams();
    const navigate = useNavigate();
    const { currentTrip, itineraries, fetchTrip, addToItinerary } = useTrip();
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [selectedDay, setSelectedDay] = useState(1);
    const [recommendations, setRecommendations] = useState([]);

    useEffect(() => {
        fetchTrip(tripId).then(() => setLoading(false));
    }, [tripId]);

    useEffect(() => {
        if (currentTrip && !itineraries.length) {
            generateRecommendations();
        }
    }, [currentTrip]);

    const generateRecommendations = async () => {
  setGenerating(true);
  try {
    const { data } = await api.get(`/trips/${tripId}/recommendations`);
    console.log('Recommendations response:', data);

    const raw = Array.isArray(data.recommendations) ? data.recommendations : [];

    const normalized = raw.map((r, idx) => ({
      id: r.id ?? idx,
      day: r.day ?? 1,
      order: r.order ?? 0,
      name: r.name ?? `${r.type} Activity`,
      type: r.type ?? 'activity',
      time: r.time ?? '09:00',
      duration: r.duration ?? 60,
      score: r.score ?? null,
      lat: r.lat ?? null,
      lng: r.lng ?? null,
    }));

    setRecommendations(normalized);
  } catch (e) {
    console.error('Failed to generate recommendations:', e);
  } finally {
    setGenerating(false);
  }
};


    const handleAcceptRecommendations = async () => {
  setLoading(true);
  try {
    for (const rec of recommendations) {
      await addToItinerary({
        trip_id: parseInt(tripId, 10),                 // ensure int
        place_id: `rec_${rec.id}`,
        place_name: rec.name || `${rec.type} on Day ${rec.day}`,
        // Fallback to trip center if rec has no coordinates yet
        lat: rec.lat ?? currentTrip.center_lat,
        lng: rec.lng ?? currentTrip.center_lng,
        day_number: rec.day,
        order: rec.order,
        time: rec.time,
        duration_minutes: rec.duration,
        notes: 'Recommended based on your preferences',
      });
    }
    navigate(`/trip-details/${tripId}`);
  } catch (e) {
    console.error('Failed to accept recommendations:', e.response?.data || e.message);
    alert('Failed to accept recommendations');
  } finally {
    setLoading(false);
  }
};


    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your trip...</p>
                </div>
            </div>
        );
    }

    const tripDays = currentTrip.start_date
        ? Math.floor((new Date(currentTrip.end_date) - new Date(currentTrip.start_date)) / (1000 * 60 * 60 * 24)) + 1
        : 3;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-4 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                    <button onClick={() => navigate('/trips')} className="p-2 hover:bg-white/20 rounded-full">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold">{currentTrip.title}</h1>
                        <p className="text-indigo-100 text-sm">AI-Generated Itinerary</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 max-w-2xl mx-auto">
                {generating ? (
                    <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-8 text-center"
                    >
                        <Zap size={48} className="mx-auto text-indigo-600 mb-4" />
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Generating Your Itinerary</h2>
                        <p className="text-gray-600">Using AI to create personalized recommendations...</p>
                    </motion.div>
                ) : recommendations.length > 0 ? (
                    <div className="space-y-6">
                        {/* Info Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg"
                        >
                            <p className="text-green-900 font-semibold mb-1">✨ Itinerary Ready!</p>
                            <p className="text-green-800 text-sm">
                                AI has created a {tripDays}-day itinerary based on your preferences and travel history.
                                You can customize it further after accepting.
                            </p>
                        </motion.div>

                        {/* Day Tabs */}
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {Array.from({ length: tripDays }, (_, i) => i + 1).map(day => (
                                <button
                                    key={day}
                                    onClick={() => setSelectedDay(day)}
                                    className={`px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all
                                        ${selectedDay === day
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                >
                                    Day {day}
                                </button>
                            ))}
                        </div>

                        {/* Preview Timeline */}
                        <div className="space-y-4">
                            {recommendations
                                .filter(r => r.day === selectedDay)
                                .sort((a, b) => a.order - b.order)
                                .map((rec, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="bg-white p-4 rounded-lg border border-gray-200 flex gap-4"
                                    >
                                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-600 shrink-0">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-900">{rec.name || `${rec.type} Activity`}</h3>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {rec.time} • {rec.duration} min
                                            </p>
                                            <p className="text-xs text-indigo-600 mt-2">
                                                ⭐ Recommended: {rec.score ? `${Math.round(rec.score)}% match` : 'Based on preferences'}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 sticky bottom-0 bg-gray-50 p-4 rounded-lg">
                            <button
                                onClick={generateRecommendations}
                                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-300 active:scale-95 transition-transform flex items-center justify-center gap-2"
                            >
                                <RefreshCw size={18} />
                                Regenerate
                            </button>
                            <button
                                onClick={handleAcceptRecommendations}
                                disabled={loading}
                                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <Check size={18} />
                                Accept & Continue
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No recommendations available yet</p>
                        <button
                            onClick={generateRecommendations}
                            className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700"
                        >
                            Try Again
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
