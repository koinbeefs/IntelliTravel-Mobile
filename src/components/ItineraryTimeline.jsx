import { useState } from 'react';
import { Trash2, Clock, MapPin, Edit2, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import WeatherWidget from './WeatherWidget';

export default function ItineraryTimeline({ itineraries, onDelete, onEdit, selectedDay }) {
    const [expandedId, setExpandedId] = useState(null);

    const dayItems = itineraries
        .filter(i => i.day_number === selectedDay)
        .sort((a, b) => a.order - b.order);

    if (dayItems.length === 0) {
        return (
            <div className="text-center py-8 text-gray-400">
                <MapPin size={32} className="mx-auto mb-2 opacity-50" />
                <p>No places for Day {selectedDay}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {dayItems.map((item, idx) => {
                // FIX: Parse gas stations safely
                let gasStations = [];
                try {
                    if (Array.isArray(item.nearby_gas_stations)) {
                        gasStations = item.nearby_gas_stations;
                    } else if (typeof item.nearby_gas_stations === 'string') {
                        gasStations = JSON.parse(item.nearby_gas_stations);
                    }
                } catch (e) {
                    gasStations = [];
                }

                return (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="relative"
                    >
                        {/* Timeline line */}
                        {idx < dayItems.length - 1 && (
                            <div className="absolute left-6 top-14 w-0.5 h-12 bg-gradient-to-b from-blue-300 to-blue-100" />
                        )}

                        {/* Main card */}
                        <div className="flex gap-4">
                            {/* Timeline dot */}
                            <div className="flex flex-col items-center pt-1">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ring-4 transition-all
                                    ${idx === 0 
                                        ? 'bg-blue-600 text-white ring-blue-100' 
                                        : 'bg-gray-200 text-gray-600 ring-gray-50'}`}>
                                    {idx + 1}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 pb-4">
                                {/* FIX: Changed <button> to <div> and added cursor-pointer */}
                                <div
                                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                                    className="w-full text-left cursor-pointer"
                                >
                                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                        {/* Header */}
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1">
                                                <h3 className="font-bold text-gray-900 text-lg">{item.place_name}</h3>
                                                <div className="flex items-center gap-2 mt-1 text-gray-500 text-sm">
                                                    {item.time && (
                                                        <>
                                                            <Clock size={14} />
                                                            <span>{item.time}</span>
                                                            <span>•</span>
                                                        </>
                                                    )}
                                                    <span>{item.duration_minutes} min</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDelete(item.id);
                                                }}
                                                className="p-1.5 hover:bg-red-50 rounded-lg transition"
                                            >
                                                <Trash2 size={16} className="text-red-500" />
                                            </button>
                                        </div>

                                        {/* Address */}
                                        {item.place_address && (
                                            <div className="flex items-start gap-2 text-gray-600 text-sm mb-3">
                                                <MapPin size={14} className="mt-0.5 shrink-0" />
                                                <p>{item.place_address}</p>
                                            </div>
                                        )}

                                        {/* Quick info */}
                                        <div className="flex items-center justify-between">
                                            {item.drive_time_from_previous ? (
                                                <div className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                                    {item.drive_time_from_previous} min from previous
                                                </div>
                                            ) : <div></div>}
                                            <ChevronDown
                                                size={16}
                                                className={`text-gray-400 transition-transform ${
                                                    expandedId === item.id ? 'rotate-180' : ''
                                                }`}
                                            />
                                        </div>
                                    </div>

                                    {/* Expanded content */}
                                    {expandedId === item.id && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mt-3 space-y-3"
                                            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
                                        >
                                            {/* Weather */}
                                            <WeatherWidget
                                                lat={item.lat}
                                                lng={item.lng}
                                                placeTitle={item.place_name}
                                            />

                                            {/* FIX: Use parsed gasStations array */}
                                            {gasStations && gasStations.length > 0 && (
                                                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                                                    <p className="text-sm font-bold text-yellow-900 mb-2">⛽ Nearby Gas Stations</p>
                                                    <div className="space-y-1">
                                                        {gasStations.slice(0, 3).map((station, idx) => (
                                                            <p key={idx} className="text-xs text-yellow-800">
                                                                • {station.name}
                                                            </p>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Edit button */}
                                            <button
                                                onClick={() => onEdit(item)}
                                                className="w-full bg-blue-50 text-blue-600 py-2 rounded-lg font-semibold text-sm hover:bg-blue-100 transition flex items-center justify-center gap-2"
                                            >
                                                <Edit2 size={14} />
                                                Edit Details
                                            </button>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
