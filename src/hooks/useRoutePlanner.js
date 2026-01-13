import { useState } from 'react';
import axios from 'axios';

export function useRoutePlanner() {
    const [route, setRoute] = useState(null); // The geometry (polyline)
    const [steps, setSteps] = useState([]);   // Turn-by-turn instructions
    const [duration, setDuration] = useState(0); // In seconds
    const [distance, setDistance] = useState(0); // In meters
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Calculate Route between two coordinates
    // Start/End formats: { lat: 14.5, lng: 121.0 }
    const calculateRoute = async (start, end) => {
        if (!start || !end) return;

        setLoading(true);
        setError(null);

        try {
            // OSRM Public API (Free)
            // Format: {lng},{lat};{lng},{lat}
            const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&steps=true`;
            
            const response = await axios.get(url);
            
            if (response.data.code !== 'Ok') {
                throw new Error("Could not calculate route");
            }

            const data = response.data.routes[0];
            
            setRoute(data.geometry); // GeoJSON LineString
            setSteps(data.legs[0].steps);
            setDuration(data.duration);
            setDistance(data.distance);
        } catch (err) {
            console.error(err);
            setError("Failed to calculate route. OSRM server might be busy.");
        } finally {
            setLoading(false);
        }
    };

    // Helper to format time (seconds -> "1 hr 20 min")
    const formatDuration = (secs) => {
        const hours = Math.floor(secs / 3600);
        const minutes = Math.floor((secs % 3600) / 60);
        if (hours > 0) return `${hours} hr ${minutes} min`;
        return `${minutes} min`;
    };

    // Helper to format distance (meters -> "12.5 km")
    const formatDistance = (meters) => {
        return (meters / 1000).toFixed(1) + " km";
    };

    return {
        route,
        steps,
        duration,
        distance,
        loading,
        error,
        calculateRoute,
        formatDuration,
        formatDistance
    };
}
