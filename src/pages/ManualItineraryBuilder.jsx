import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, X, Clock, Save, AlertTriangle, ChevronUp, ChevronDown, Edit2, Trash2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { useTrip } from '../hooks/useTrip';
import PlaceSearchInput from '../components/PlaceSearchInput';
import MapLayerSwitcher from '../components/MapLayerSwitcher';

// --- Leaflet Icon Fix ---
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- Helper: Fetch Drive Time (OSRM) ---
const getOSRMTime = async (lat1, lon1, lat2, lon2) => {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`;
    const res = await axios.get(url);
    if (res.data.routes?.[0]) {
      return res.data.routes[0].duration / 60; // Duration in minutes
    }
  } catch (e) {
    return 0;
  }
  return 0;
};

// --- Map Controller ---
function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 13);
  }, [center, map]);
  return null;
}

export default function ManualItineraryBuilder() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { currentTrip, itineraries, fetchTrip, addToItinerary, deleteItinerary, updateItinerary } = useTrip();

  // State
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(1);
  const [mapLayer, setMapLayer] = useState('street');
  const [warnings, setWarnings] = useState({}); // Store ID -> Warning String
  const [lastAddedPlace, setLastAddedPlace] = useState(null);

  // Edit Modal State
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({ time: '', duration: 60, notes: '' });

  // 1. Initial Load
  useEffect(() => {
    if (tripId) {
      fetchTrip(tripId).then(() => setLoading(false));
    }
  }, [tripId, fetchTrip]);

  // 2. Schedule Validation Logic
  useEffect(() => {
    const validateSchedule = async () => {
      const newWarnings = {};
      const dayItems = itineraries
        .filter(i => i.day_number === selectedDay)
        .sort((a, b) => a.order - b.order);

      for (let i = 0; i < dayItems.length - 1; i++) {
        const current = dayItems[i];
        const next = dayItems[i+1];

        // Only validate if both have assigned times
        if (current.time && next.time) {
          const t1 = new Date(`1970-01-01T${current.time}`);
          const t2 = new Date(`1970-01-01T${next.time}`);
          
          // Add duration of current activity
          t1.setMinutes(t1.getMinutes() + (current.duration_minutes || 60));

          const gapMinutes = (t2 - t1) / 60000; // Gap between End-A and Start-B

          if (gapMinutes < 0) {
            newWarnings[next.id] = "Overlap! Previous activity finishes after this starts.";
          } else {
            // Check physical travel time
            const driveTime = await getOSRMTime(current.lat, current.lng, next.lat, next.lng);
            if (gapMinutes < driveTime) {
              newWarnings[next.id] = `Impossible! Drive is ${Math.round(driveTime)}m, you have ${Math.round(gapMinutes)}m.`;
            }
          }
        }
      }
      setWarnings(newWarnings);
    };

    if (itineraries.length > 0) {
      const timer = setTimeout(validateSchedule, 1000); // Debounce
      return () => clearTimeout(timer);
    }
  }, [itineraries, selectedDay]);


  // Handlers
  const handleAddPlace = async (place) => {
    try {
      // Find max order for current day
      const currentDayItems = itineraries.filter(i => i.day_number === selectedDay);
      const maxOrder = Math.max(0, ...currentDayItems.map(i => i.order));

      // FIX: Handle both 'id' and 'place_id'
      const finalPlaceId = place.id || place.place_id; 

      if (!finalPlaceId) {
        alert("Error: Selected place has no valid ID.");
        return;
      }

      await addToItinerary({
        trip_id: parseInt(tripId),
        place_id: finalPlaceId, // <--- Use the robust variable
        place_name: place.name || place.address_line1, // Fallback for name
        place_address: place.address || place.formatted_address || '',
        lat: place.lat,
        lng: place.lng,
        day_number: selectedDay,
        order: maxOrder + 1,
        time: null, 
        duration_minutes: 60
      });
      setLastAddedPlace(place);
    } catch (e) {
      alert("Failed to add place");
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Remove this stop?")) {
      await deleteItinerary(id);
    }
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
    setEditForm({
      time: item.time || '',
      duration: item.duration_minutes || 60,
      notes: item.notes || ''
    });
  };

  const saveEdit = async () => {
    if (!editingItem) return;
    let timePayload = null;
    if (editForm.time && editForm.time.trim() !== '') {
       // Ensure only first 5 chars (HH:MM) are sent if seconds exist
       timePayload = editForm.time.substring(0, 5);
    }
    try {
      await updateItinerary(editingItem.id, {
        time: timePayload, 
        duration_minutes: editForm.duration,
        notes: editForm.notes
      });
      setEditingItem(null);
    } catch (e) {
      alert("Update failed: " + (e.response?.data?.message || e.message));
    }
  };

  const moveItem = async (item, direction) => {
    // Simple swap logic (In production, use batch update)
    const currentDayItems = itineraries
        .filter(i => i.day_number === selectedDay)
        .sort((a, b) => a.order - b.order);
    
    const idx = currentDayItems.findIndex(i => i.id === item.id);
    if (idx === -1) return;

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= currentDayItems.length) return;

    const otherItem = currentDayItems[swapIdx];

    // Swap orders
    await updateItinerary(item.id, { order: otherItem.order });
    await updateItinerary(otherItem.id, { order: item.order });
  };


  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!currentTrip) return <div className="p-10 text-center">Trip not found</div>;

  const dayItems = itineraries
    .filter(i => i.day_number === selectedDay)
    .sort((a, b) => a.order - b.order);

  const center = lastAddedPlace 
    ? [lastAddedPlace.lat, lastAddedPlace.lng] 
    : [currentTrip.center_lat || 14.5995, currentTrip.center_lng || 120.9842];

  return (
    <div className="h-screen flex flex-col relative bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 z-20 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-gray-800">{currentTrip.title}</h1>
            <p className="text-xs text-gray-500">Day {selectedDay} Planner</p>
          </div>
        </div>
        <button 
          onClick={() => navigate(`/trip-details/${tripId}`)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
        >
          <Save className="w-4 h-4" /> Done
        </button>
      </div>

      {/* Map Area */}
      <div className="h-1/3 w-full relative z-0">
        <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer url={mapLayer === 'satellite' 
             ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' 
             : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'} 
          />
          <MapUpdater center={center} />
          {dayItems.map((item, idx) => (
            <Marker key={item.id} position={[item.lat, item.lng]}>
              <Popup>{idx + 1}. {item.place_name}</Popup>
            </Marker>
          ))}
        </MapContainer>
        
        <div className="absolute top-4 right-4 z-[1000]">
          <MapLayerSwitcher currentLayer={mapLayer} onLayerChange={setMapLayer} />
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-2 bg-white border-b z-10">
        <PlaceSearchInput 
          lat={center[0]} 
          lng={center[1]} 
          onSelect={handleAddPlace} 
          placeholder="Add a stop to your route..." 
        />
      </div>

      {/* Day Selector */}
      <div className="flex gap-2 overflow-x-auto p-4 bg-gray-50 border-b">
         {/* Generate days based on trip length or just allow + button */}
         {[1,2,3].map(day => (
           <button 
             key={day}
             onClick={() => setSelectedDay(day)}
             className={`px-4 py-1 rounded-full text-sm whitespace-nowrap ${selectedDay === day ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600'}`}
           >
             Day {day}
           </button>
         ))}
      </div>

      {/* Timeline List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {dayItems.length === 0 ? (
          <div className="text-center text-gray-400 mt-10">
            <MapPin className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p>No stops yet. Use the search bar to add one.</p>
          </div>
        ) : (
          dayItems.map((item, index) => (
            <div key={item.id} className="bg-white p-3 rounded-xl border shadow-sm relative group">
              {/* Order Badge */}
              <div className="absolute -left-2 top-4 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow">
                {index + 1}
              </div>

              <div className="pl-6">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-gray-800">{item.place_name}</h3>
                  <div className="flex gap-1">
                    <button onClick={() => moveItem(item, 'up')} className="p-1 text-gray-400 hover:text-blue-600"><ChevronUp className="w-4 h-4"/></button>
                    <button onClick={() => moveItem(item, 'down')} className="p-1 text-gray-400 hover:text-blue-600"><ChevronDown className="w-4 h-4"/></button>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {item.time ? item.time : 'Set time'}
                  </div>
                  <span>•</span>
                  <span>{item.duration_minutes} min</span>
                </div>

                {/* Validation Warning */}
                {warnings[item.id] && (
                  <div className="mt-2 bg-red-50 text-red-600 text-xs p-2 rounded-lg flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{warnings[item.id]}</span>
                  </div>
                )}

                <div className="mt-3 flex justify-end gap-2 border-t pt-2">
                  <button onClick={() => handleEditClick(item)} className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div className="absolute inset-0 z-[2000] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold mb-4">Edit Stop</h3>
            
            <label className="block text-sm text-gray-600 mb-1">Time</label>
            <input 
              type="time" 
              className="w-full border p-2 rounded-lg mb-4"
              value={editForm.time}
              onChange={e => setEditForm({...editForm, time: e.target.value})}
            />

            <label className="block text-sm text-gray-600 mb-1">Duration (minutes)</label>
            <input 
              type="number" 
              className="w-full border p-2 rounded-lg mb-4"
              value={editForm.duration}
              onChange={e => setEditForm({...editForm, duration: parseInt(e.target.value)})}
            />

            <label className="block text-sm text-gray-600 mb-1">Notes</label>
            <textarea 
              className="w-full border p-2 rounded-lg mb-6"
              rows="3"
              value={editForm.notes}
              onChange={e => setEditForm({...editForm, notes: e.target.value})}
            />

            <div className="flex gap-3">
              <button 
                onClick={() => setEditingItem(null)} 
                className="flex-1 py-3 text-gray-600 font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={saveEdit} 
                className="flex-1 bg-blue-600 text-white rounded-xl font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
