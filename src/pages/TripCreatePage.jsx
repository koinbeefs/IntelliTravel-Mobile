import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, Sliders, MapPin, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTrip } from '../hooks/useTrip';
import api from '../lib/axios';

export default function TripCreatePage() {
  const navigate = useNavigate();
  const { createTrip } = useTrip();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState(null); // 'manual' or 'automatic'

  const [formData, setFormData] = useState({
    title: '',
    destination: 'Baguio, Benguet', // initial text but now editable with suggestions
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    transitType: 'car',
  });

  // NEW: destination suggestions state
  const [destQuery, setDestQuery] = useState('Baguio, Benguet');
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);
  const [destLoading, setDestLoading] = useState(false);

  // Keep destQuery and formData.destination in sync
  useEffect(() => {
    setDestQuery(formData.destination);
  }, []);

  // Debounced autocomplete for Destination
  useEffect(() => {
    if (!destQuery || destQuery.length < 2) {
      setDestSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setDestLoading(true);
      try {
        // Use a generic center for search (e.g. Manila) or add user location later
        const { data } = await api.get('/places/autocomplete', {
          params: {
            query: destQuery,
            lat: 14.5995, // Manila default center
            lng: 120.9842,
          },
        });
        setDestSuggestions(data || []);
      } catch (e) {
        setDestSuggestions([]);
      } finally {
        setDestLoading(false);
      }
    }, 300); // debounce

    return () => clearTimeout(timer);
  }, [destQuery]);

  const handleSelectDestination = (place) => {
    const label = place.name || place.address || formData.destination;
    setFormData({
      ...formData,
      destination: label,
      // optionally you could store center_lat/center_lng from geocode here instead of fixed Baguio
    });
    setDestQuery(label);
    setShowDestSuggestions(false);
  };

  const handleCreateTrip = async () => {
    if (!formData.title.trim()) {
      alert('Please enter a trip title');
      return;
    }

    if (!formData.destination.trim()) {
      alert('Please enter a destination');
      return;
    }

    if (!mode) {
      alert('Please choose Manual Builder or AI Generator first');
      return;
    }

    setLoading(true);
    try {
      const tripData = {
        title: formData.title,
        destination: formData.destination,
        trip_type: mode,
        transit_type: formData.transitType,
        start_date: formData.startDate,
        end_date: formData.endDate,
        // For now still using Baguio center; you can later replace this with geocoded coords
        center_lat: 16.4023,
        center_lng: 120.5960,
        description: `${mode === 'manual' ? 'Manually' : 'Automatically'} planned trip`,
      };

      const trip = await createTrip(tripData);

      if (mode === 'manual') {
        navigate(`/trip-builder/${trip.id}`);
      } else {
        navigate(`/trip-generator/${trip.id}`);
      }
    } catch (e) {
      alert('Failed to create trip: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!mode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Plan Your Trip</h1>
            <p className="text-gray-600">Choose how you want to build your itinerary</p>
          </div>

          <div className="space-y-4">
            {/* Manual Mode */}
            <button
              onClick={() => setMode('manual')}
              className="w-full bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95 border-2 border-transparent hover:border-blue-400"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Sliders size={24} className="text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Manual Builder</h2>
              </div>
              <p className="text-gray-600 text-left text-sm">
                Search and add places yourself. Build your own itinerary step by step.
              </p>
              <div className="mt-3 text-xs text-gray-500 text-left">
                ✓ Full control over places and order
                <br />
                ✓ Customize timing and notes
              </div>
            </button>

            {/* Automatic Mode */}
            <button
              onClick={() => setMode('automatic')}
              className="w-full bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95 border-2 border-transparent hover:border-indigo-400"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Zap size={24} className="text-indigo-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">AI Generator</h2>
              </div>
              <p className="text-gray-600 text-left text-sm">
                AI learns from your preferences and creates a personalized itinerary.
              </p>
              <div className="mt-3 text-xs text-gray-500 text-left">
                ✓ Based on your past trips
                <br />
                ✓ Smart recommendations included
              </div>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => setMode(null)} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">
          {mode === 'manual' ? 'Manual Builder' : 'AI Generator'}
        </h1>
      </div>

      {/* Form */}
      <div className="p-6 space-y-4 max-w-md mx-auto">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Trip Title</label>
          <input
            type="text"
            placeholder="e.g., Baguio Weekend Adventure"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>

        {/* DESTINATION WITH AUTOCOMPLETE */}
        <div className="relative">
          <label className="block text-sm font-bold text-gray-700 mb-2">Destination</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              className="w-full pl-9 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={destQuery}
              placeholder="Type a city, province, or place..."
              onChange={(e) => {
                const value = e.target.value;
                setDestQuery(value);
                setFormData({ ...formData, destination: value });
                setShowDestSuggestions(true);
              }}
              onFocus={() => {
                if (destSuggestions.length > 0) setShowDestSuggestions(true);
              }}
            />
            {destQuery && (
              <button
                type="button"
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                onClick={() => {
                  setDestQuery('');
                  setFormData({ ...formData, destination: '' });
                  setDestSuggestions([]);
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Suggestions dropdown */}
          <AnimatePresence>
            {showDestSuggestions && (destSuggestions.length > 0 || destLoading) && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto"
              >
                {destLoading && (
                  <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Searching…
                  </div>
                )}
                {!destLoading &&
                  destSuggestions.map((place) => (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => handleSelectDestination(place)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-start gap-2"
                    >
                      <MapPin className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-gray-800 line-clamp-1">
                          {place.name}
                        </p>
                        <p className="text-xs text-gray-500 line-clamp-1">
                          {place.address}
                        </p>
                      </div>
                    </button>
                  ))}
                {!destLoading && destSuggestions.length === 0 && destQuery.length >= 2 && (
                  <div className="px-3 py-2 text-xs text-gray-500">
                    No matches found. Try another city or province.
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Transit Type</label>
          <div className="grid grid-cols-2 gap-3">
            {['car', 'bike', 'walk', 'bus'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFormData({ ...formData, transitType: type })}
                className={`py-2 px-4 rounded-lg font-semibold text-sm transition-all
                  ${
                    formData.transitType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {type === 'car'
                  ? '🚗 Car'
                  : type === 'bike'
                  ? '🚴 Bike'
                  : type === 'walk'
                  ? '🚶 Walk'
                  : '🚌 Bus'}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleCreateTrip}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-blue-700 active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Creating...
            </>
          ) : (
            <>{mode === 'manual' ? '📍 Start Building' : '⚡ Generate Itinerary'}</>
          )}
        </button>
      </div>
    </div>
  );
}
