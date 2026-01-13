import { useEffect, useState } from 'react';
import api from '../lib/axios';
import PlaceCard from '../components/PlaceCard';
import PlaceDetailsSheet from '../components/PlaceDetailsSheet';
import { Search, MapPin, Sparkles, TrendingUp, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Home() {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [recommended, setRecommended] = useState([]);
    const [popular, setPopular] = useState([]);
    const [highRated, setHighRated] = useState([]);
    const [loading, setLoading] = useState(true);
    const [locationName, setLocationName] = useState("Locating...");
    const [selectedPlace, setSelectedPlace] = useState(null);

    // Fetch Data
    useEffect(() => {
        const fetchData = async (lat, lng) => {
            setLoading(true);
            try {
                // Parallel Fetch: Recommended, Popular, High Rated
                const [recRes, popRes, highRes, geoRes] = await Promise.all([
                    api.get(`/places/recommended?lat=${lat}&lng=${lng}`),
                    api.get(`/places/popular?lat=${lat}&lng=${lng}`), // Fetch Popular separately
                    api.get(`/places/high-rated?lat=${lat}&lng=${lng}`),
                    api.get(`/places/reverse?lat=${lat}&lng=${lng}`)
                ]);
                
                setRecommended(recRes.data || []);
                setPopular(popRes.data || []);
                setHighRated(highRes.data || []);
                setLocationName(geoRes.data.address || "Unknown Location");
            } catch (e) {
                console.error("Fetch error", e);
                setLocationName("Manila, PH (Offline)");
            } finally {
                setLoading(false);
            }
        };

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => fetchData(pos.coords.latitude, pos.coords.longitude),
                () => fetchData(14.5995, 120.9842)
            );
        } else {
            fetchData(14.5995, 120.9842);
        }
    }, []);

    // Handle Card Click
    const handlePlaceClick = async (place) => {
        setSelectedPlace(place);
        try {
            await api.post('/interactions', {
                place_id: place.id,
                place_name: place.name,
                category: place.category || 'unknown'
            });
        } catch (e) {
            console.error("Failed to record interaction");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            
            {/* Header */}
            <div className="bg-white p-6 pb-6 rounded-b-3xl shadow-sm z-10 sticky top-0">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">Current Location</p>
                        <div className="flex items-center gap-1 text-gray-800 font-bold text-lg leading-none mt-1">
                            <MapPin size={18} className="text-blue-500" />
                            <span className="truncate max-w-[200px]">{locationName}</span>
                        </div>
                    </div>
                    <img src={user?.profile_pic} className="w-10 h-10 rounded-full border-2 border-gray-100" />
                </div>
                
                <Link to="/map">
                    <div className="relative">
                        <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
                        <input type="text" placeholder="Where to next?" className="w-full bg-gray-100 py-3 pl-12 pr-4 rounded-xl text-sm font-medium focus:outline-none pointer-events-none" readOnly />
                    </div>
                </Link>
            </div>

            {/* Feeds */}
            <div className="p-6 space-y-8">
                
                {/* 1. Personalized Recommendations */}
                <Section 
                    title="Recommended for You" 
                    subtitle="Based on your recent visits"
                    icon={<Sparkles size={16} className="text-yellow-500 fill-yellow-500" />}
                    data={recommended} 
                    loading={loading}
                    onItemClick={handlePlaceClick}
                />

                {/* 2. Popular Destinations */}
                <Section 
                    title="Popular Destinations" 
                    subtitle="Trending nearby"
                    icon={<TrendingUp size={16} className="text-blue-500" />}
                    data={popular} 
                    loading={loading}
                    onItemClick={handlePlaceClick}
                />

                {/* 3. Top Rated Restaurants (Fastfood & Karinderya Included) */}
                <Section 
                    title="Top Rated Food Spots" 
                    subtitle="Local favorites, fastfood & more"
                    icon={<Star size={16} className="text-orange-500 fill-orange-500" />}
                    data={highRated} 
                    loading={loading}
                    onItemClick={handlePlaceClick}
                />
            </div>

            {/* Place Details Modal */}
            <PlaceDetailsSheet 
                place={selectedPlace} 
                onClose={() => setSelectedPlace(null)}
                onNavigate={(p) => {
                    setSelectedPlace(null);
                    navigate('/map', { state: { target: p } }); 
                }}
            />
        </div>
    );
}

function Section({ title, subtitle, icon, data, loading, onItemClick }) {
    return (
        <section>
            <div className="flex justify-between items-end mb-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="font-bold text-xl text-gray-900">{title}</h2>
                        {icon}
                    </div>
                    {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
                </div>
                <button className="text-blue-600 text-sm font-bold">See All</button>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 snap-x no-scrollbar">
                {loading ? [1,2,3].map(i => <div key={i} className="min-w-[220px] h-48 bg-gray-200 rounded-2xl animate-pulse" />) : 
                 data.length > 0 ? data.map(place => <PlaceCard key={place.id} place={place} onClick={onItemClick} />) : 
                 <div className="w-full text-center py-8 text-gray-400 text-sm">No places found.</div>}
            </div>
        </section>
    );
}
