import { Star, MapPin } from 'lucide-react';

export default function PlaceCard({ place, onClick }) {
    // Determine Image URL
    let imageUrl;
    if (place.source === 'google' && place.photo_reference) {
        imageUrl = `http://localhost:8000/api/places/photo?ref=${place.photo_reference}`;
    } else {
        const category = (place.category || '').toLowerCase();
        if (category.includes('hotel')) imageUrl = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80';
        else if (category.includes('shop')) imageUrl = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80';
        else if (category.includes('hospital')) imageUrl = 'https://images.unsplash.com/photo-1587351021759-3e566b9af9ef?w=400&q=80';
        else imageUrl = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80';
    }

    return (
        <div 
            onClick={() => {
                if (typeof onClick === 'function') {
                    onClick(place);
                }
            }} 
            className="min-w-[220px] w-[220px] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden snap-start hover:shadow-md transition-shadow flex flex-col cursor-pointer active:scale-95 transition-transform"
        >
            <div className="h-32 overflow-hidden relative bg-gray-200">
                <img 
                    src={imageUrl} 
                    alt={place.name} 
                    className="w-full h-full object-cover"
                    loading="lazy" 
                    onError={(e) => {
                        e.target.onerror = null; 
                        e.target.src = "https://placehold.co/400x300?text=No+Image";
                    }} 
                />
                
                {place.rating && (
                    <div className="absolute top-2 right-2 bg-white/95 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm">
                        <Star size={10} className="text-yellow-500 fill-yellow-500" />
                        {place.rating}
                    </div>
                )}
            </div>
            <div className="p-4 flex flex-col gap-1">
                <h3 className="font-bold text-gray-800 text-base truncate" title={place.name}>{place.name}</h3>
                <div className="flex items-start gap-1 text-gray-400 text-xs">
                    <MapPin size={12} className="mt-0.5 shrink-0" />
                    <p className="line-clamp-2 leading-tight">{place.address}</p>
                </div>
            </div>
        </div>
    );
}
