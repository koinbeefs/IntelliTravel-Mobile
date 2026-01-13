import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Navigation, MapPin } from 'lucide-react';

export default function PlaceDetailsSheet({ place, onClose, onNavigate }) {
    if (!place) return null;

    const getImageUrl = (p) => {
        if (!p) return '';
        if (p.source === 'google' && p.photo_reference) {
            return `http://localhost:8000/api/places/photo?ref=${p.photo_reference}`;
        }
        const cat = (p.category || '').toLowerCase();
        if (cat.includes('hotel')) return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400';
        if (cat.includes('shop')) return 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400';
        if (cat.includes('food') || cat.includes('restaurant')) return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400';
        return 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400';
    };

    const imageUrl = getImageUrl(place);

    return (
        <AnimatePresence>
            {place && (
                <>
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/30 z-[1000] backdrop-blur-sm"
                    />
                    
                    {/* Sheet */}
                    <motion.div 
                        initial={{ y: "100%" }} 
                        animate={{ y: 0 }} 
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 w-full z-[1001] bg-white rounded-t-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
                    >
                        {/* Image Header */}
                        <div className="h-48 relative w-full shrink-0 bg-gray-100">
                            <img src={imageUrl} className="w-full h-full object-cover" alt={place.name} />
                            <button 
                                onClick={onClose} 
                                className="absolute top-4 right-4 bg-white/80 backdrop-blur p-2 rounded-full shadow-lg hover:bg-white transition"
                            >
                                <X size={20} className="text-gray-900" />
                            </button>
                            {place.rating && (
                                <div className="absolute bottom-4 left-4 bg-white/95 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-md">
                                    <Star size={12} className="text-yellow-500 fill-yellow-500" />
                                    {place.rating}
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <div className="p-6 pb-8 overflow-y-auto flex-1">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">{place.name}</h2>
                            
                            <div className="flex items-start gap-2 text-gray-600 mb-6">
                                <MapPin size={18} className="mt-0.5 shrink-0" />
                                <p className="text-sm leading-relaxed">{place.address}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <p className="text-xs text-gray-400 uppercase font-bold">Category</p>
                                    <p className="font-semibold text-gray-800 capitalize truncate">{place.category}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <p className="text-xs text-gray-400 uppercase font-bold">Reviews</p>
                                    <p className="font-semibold text-gray-800">{place.user_ratings_total || place.reviews || 'N/A'}</p>
                                </div>
                            </div>

                            <button 
                                onClick={() => onNavigate(place)}
                                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-200 flex items-center justify-center gap-2 active:scale-95 transition-transform hover:bg-blue-700"
                            >
                                <Navigation size={20} />
                                Get Directions
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
