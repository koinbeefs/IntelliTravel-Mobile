import { useState, useEffect } from 'react';
import { Search, MapPin, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/axios';

export default function PlaceSearchInput({ lat, lng, onSelect, placeholder = "Search places..." }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length > 2) {
                setLoading(true);
                try {
                    const { data } = await api.get('/itineraries/search-places', {
                        params: { query, lat, lng }
                    });
                    setResults(data);
                } catch (e) {
                    setResults([]);
                }
                setLoading(false);
            } else {
                setResults([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query, lat, lng]);

    const handleSelect = (place) => {
        onSelect(place);
        setQuery('');
        setResults([]);
        setShowResults(false);
    };

    return (
        <div className="relative">
            <div className="bg-white rounded-full shadow-lg flex items-center px-4 py-3 gap-3 border border-gray-100">
                <Search className="text-gray-400 shrink-0" size={20} />
                <input
                    type="text"
                    placeholder={placeholder}
                    className="flex-1 outline-none text-sm font-medium text-gray-700 bg-transparent"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setShowResults(true);
                    }}
                    onFocus={() => setShowResults(true)}
                />
                {query && (
                    <button onClick={() => setQuery('')}>
                        <X size={18} className="text-gray-400" />
                    </button>
                )}
                {loading && <Loader2 className="animate-spin text-blue-600" size={18} />}
            </div>

            <AnimatePresence>
                {showResults && results.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 z-50 max-h-96 overflow-y-auto"
                    >
                        {results.map((place, index) => ( // 1. Add index here
                            <button
                                // 2. Use place.place_id OR place.id OR fall back to index
                                key={place.place_id || place.id || index} 
                                onClick={() => handleSelect(place)}
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-50 last:border-0 transition"
                            >
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                    <MapPin size={16} className="text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-800 truncate">{place.name}</p>
                                    <p className="text-xs text-gray-400 truncate">{place.address}</p>
                                </div>
                                <span className="text-xs text-gray-400 capitalize shrink-0">{place.category}</span>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
