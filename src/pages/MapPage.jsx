import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useState, useEffect } from 'react';
import { Search, Navigation, X, Star, Crosshair, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';

// Fix Leaflet Icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

// --- 1. Map Controller (Handles Auto-Center) ---
function MapController({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, zoom, { animate: true, duration: 1.5 });
        }
    }, [center, zoom, map]);
    return null;
}

export default function MapPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [places, setPlaces] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [userPos, setUserPos] = useState(null);
    const [mapCenter, setMapCenter] = useState({ lat: 14.5995, lng: 120.9842 });
    const [activeCategory, setActiveCategory] = useState(null);

    // --- 2. Custom Icon Generators ---

    const getUserIcon = () => {
        const profilePic = user?.profile_pic || `https://ui-avatars.com/api/?name=${user?.username || 'Me'}&background=38a1db&color=fff`;
        return L.divIcon({
            className: 'custom-user-icon',
            html: `
                <div class="w-12 h-12 rounded-full border-4 border-white shadow-xl overflow-hidden ring-4 ring-blue-500/30 relative bg-blue-500 z-50">
                    <img src="${profilePic}" class="w-full h-full object-cover" />
                </div>
            `,
            iconSize: [48, 48],
            iconAnchor: [24, 24]
        });
    };

    const getPlaceIcon = (place) => {
        const cat = (place.category || '').toLowerCase();
        let iconSvg = '';
        let bgColor = 'bg-gray-500';

        if (cat.includes('restaurant') || cat.includes('catering') || cat.includes('food')) {
            bgColor = 'bg-orange-500';
            iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 text-white"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>`;
        } 
        else if (cat.includes('coffee') || cat.includes('cafe')) {
            bgColor = 'bg-amber-700';
            iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 text-white"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/></svg>`;
        }
        else if (cat.includes('hotel') || cat.includes('accommodation') || cat.includes('stay')) {
            bgColor = 'bg-blue-500';
            iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 text-white"><path d="M2 22h20"/><path d="M4 22V4a2 2 0 0 1 2-2h8.5L20 7.5V20a2 2 0 0 1-2 2H4Z"/><path d="M8 6h4"/><path d="M8 10h4"/><path d="M8 14h4"/><path d="M16 10h2"/><path d="M16 14h2"/></svg>`;
        }
        else if (cat.includes('health') || cat.includes('hospital')) {
            bgColor = 'bg-red-500';
            iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 text-white"><path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h5v5c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2z"/></svg>`;
        }
        else if (cat.includes('shop') || cat.includes('commercial') || cat.includes('store')) {
            bgColor = 'bg-purple-600';
            iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 text-white">ircle cx="8" cy="21" r="1"/>ircle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>`;
        }
        else {
            iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 text-white"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>ircle cx="12" cy="10" r="3"/></svg>`;
        }

        return L.divIcon({
            className: 'custom-place-icon',
            html: `
                <div class="marker-pin w-10 h-10 ${bgColor} rounded-full shadow-lg border-2 border-white flex items-center justify-center relative transition-transform hover:scale-110">
                    ${iconSvg}
                    ${place.rating ? `<div class="absolute -bottom-1 bg-white text-gray-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-md border border-gray-100">★ ${place.rating}</div>` : ''}
                </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        });
    };

    // --- 3. Logic ---

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setUserPos(newPos);
                setMapCenter(newPos);
            },
            (err) => console.log("Location denied"),
            { enableHighAccuracy: true }
        );
    }, []);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length > 2 && showSuggestions) {
                try {
                    const { data } = await api.get(`/places/autocomplete?query=${searchQuery}&lat=${mapCenter.lat}&lng=${mapCenter.lng}`);
                    setSuggestions(data);
                } catch (e) { setSuggestions([]); }
            } else { setSuggestions([]); }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, mapCenter, showSuggestions]);

    const handleSelectSuggestion = (suggestion) => {
        setSearchQuery(suggestion.name);
        setShowSuggestions(false);
        setMapCenter({ lat: suggestion.lat, lng: suggestion.lng });
        fetchPlaces(suggestion.lat, suggestion.lng, null, suggestion.name);
    };

    const fetchPlaces = async (lat, lng, category = null, query = null) => {
        setLoading(true);
        setActiveCategory(category);
        try {
            let url = `/places/search?lat=${lat}&lng=${lng}`;
            if (category) url += `&category=${category}`;
            if (query) url += `&query=${query}`;
            const { data } = await api.get(url);
            setPlaces(data);
        } catch (e) { console.error(e); } 
        finally { setLoading(false); }
    };

    const handleGoThere = (place) => {
        navigate('/route', { state: { target: place } });
    };

    const categories = [
        { id: 'restaurant', label: 'Eat', icon: '🍽️' },
        { id: 'hotel', label: 'Stay', icon: '🛏️' },
        { id: 'coffee', label: 'Coffee', icon: '☕' },
        { id: 'hospitals', label: 'Health', icon: '🏥' },
        { id: 'shopping', label: 'Shop', icon: '🛒' },
    ];

    return (
        <div className="h-screen w-full relative bg-gray-100 overflow-hidden">
            
            {/* Top UI Layer */}
            <div className="absolute top-0 left-0 w-full z-[1000] p-4 bg-gradient-to-b from-black/20 to-transparent pointer-events-none flex flex-col gap-3">
                
                {/* Search Bar */}
                <div className="pointer-events-auto relative">
                    <div className="bg-white rounded-full shadow-lg flex items-center px-4 py-3 gap-3 border border-gray-100">
                        <Search className="text-gray-400 shrink-0" size={20} />
                        <input 
                            type="text" 
                            placeholder="Search places..." 
                            className="flex-1 outline-none text-sm font-medium text-gray-700 bg-transparent placeholder:text-gray-400"
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                            onFocus={() => setShowSuggestions(true)}
                        />
                        {searchQuery && (
                            <button onClick={() => { setSearchQuery(''); setPlaces([]); setActiveCategory(null); }}>
                                <X size={18} className="text-gray-400" />
                            </button>
                        )}
                    </div>
                    
                    {/* Autocomplete */}
                    <AnimatePresence>
                        {suggestions.length > 0 && showSuggestions && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 z-50"
                            >
                                {suggestions.map((s) => (
                                    <button 
                                        key={s.id} 
                                        onClick={() => handleSelectSuggestion(s)} 
                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-50 last:border-0 transition"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                            <MapPin size={14} className="text-gray-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800 line-clamp-1">{s.name}</p>
                                            <p className="text-xs text-gray-400 line-clamp-1">{s.address}</p>
                                        </div>
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Categories */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pointer-events-auto pb-2">
                    {categories.map(cat => (
                        <button 
                            key={cat.id}
                            onClick={() => fetchPlaces(mapCenter.lat, mapCenter.lng, cat.id)}
                            className={`px-4 py-2.5 rounded-full shadow-sm text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 border
                                ${activeCategory === cat.id ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-white/50 backdrop-blur-md'}
                                                       `}
                        >
                            <span>{cat.icon}</span> {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Recenter Button */}
            {userPos && (
                <button 
                    onClick={() => setMapCenter(userPos)}
                    className="absolute bottom-28 right-4 z-[900] bg-white p-3.5 rounded-full shadow-lg active:bg-blue-50 text-blue-600 transition-colors hover:bg-gray-50"
                >
                    <Crosshair size={24} />
                </button>
            )}

            {/* Map */}
            <MapContainer center={[mapCenter.lat, mapCenter.lng]} zoom={15} zoomControl={false} className="h-full w-full z-0">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapController center={[mapCenter.lat, mapCenter.lng]} zoom={15} />

                {/* User Pin */}
                {userPos && <Marker position={[userPos.lat, userPos.lng]} icon={getUserIcon()} />}

                {/* Place Pins */}
                {places.map(place => (
                    <Marker 
                        key={place.id} 
                        position={[place.lat, place.lng]}
                        icon={getPlaceIcon(place)} 
                        eventHandlers={{
                            click: () => {
                                setSelectedPlace(place);
                                setMapCenter({ lat: place.lat, lng: place.lng });
                            },
                        }}
                    />
                ))}
            </MapContainer>

            {/* Details Panel */}
            <AnimatePresence>
                {selectedPlace && (
                    <motion.div 
                        initial={{ y: "100%" }} 
                        animate={{ y: 0 }} 
                        exit={{ y: "100%" }}
                        drag="y" 
                        dragConstraints={{ top: 0, bottom: 0 }}
                        onDragEnd={(e, { offset }) => { if (offset.y > 100) setSelectedPlace(null); }}
                        className="absolute bottom-0 left-0 w-full z-[1000] bg-white rounded-t-3xl shadow-[0_-5px_40px_rgba(0,0,0,0.15)] p-6 pb-24"
                    >
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 opacity-50" />
                        
                        <div className="flex gap-4">
                            <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 bg-gray-100 shadow-inner">
                                <img 
                                    src={selectedPlace.source === 'google' && selectedPlace.photo_reference 
                                        ? `http://localhost:8000/api/places/photo?ref=${selectedPlace.photo_reference}`
                                        : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200'
                                    }
                                    className="w-full h-full object-cover"
                                    alt={selectedPlace.name}
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <h2 className="text-lg font-bold text-gray-900 truncate pr-2">{selectedPlace.name}</h2>
                                    <button 
                                        onClick={() => setSelectedPlace(null)} 
                                        className="p-1.5 bg-gray-50 rounded-full hover:bg-gray-100 transition"
                                    >
                                        <X size={18} className="text-gray-500" />
                                    </button>
                                </div>
                                <p className="text-sm text-gray-500 line-clamp-2 mt-1">{selectedPlace.address}</p>
                                <div className="flex items-center gap-2 mt-3">
                                    {selectedPlace.rating && (
                                        <div className="flex items-center gap-1 bg-yellow-50 px-2.5 py-1 rounded-lg border border-yellow-100/50">
                                            <Star size={12} className="text-yellow-500 fill-yellow-500" />
                                            <span className="text-xs font-bold text-yellow-700">{selectedPlace.rating}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={() => handleGoThere(selectedPlace)}
                            className="w-full mt-6 bg-blue-600 text-white py-4 rounded-2xl font-bold text-base shadow-lg shadow-blue-200 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform hover:bg-blue-700"
                        >
                            <Navigation size={20} />
                            Go There
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
