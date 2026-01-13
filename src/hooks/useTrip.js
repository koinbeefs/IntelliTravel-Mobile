import { useState, useCallback } from 'react';
import api from '../lib/axios';

export function useTrip() {
    const [trips, setTrips] = useState([]);
    const [currentTrip, setCurrentTrip] = useState(null);
    const [itineraries, setItineraries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch all trips
    const fetchTrips = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/trips');
            setTrips(data);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch single trip with itinerary
    const fetchTrip = useCallback(async (tripId) => {
        setLoading(true);
        try {
            const [tripRes, itineraryRes] = await Promise.all([
                api.get(`/trips/${tripId}`),
                api.get(`/trips/${tripId}/itineraries`)
            ]);
            setCurrentTrip(tripRes.data);
            setItineraries(itineraryRes.data);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Create new trip
    const createTrip = useCallback(async (tripData) => {
        setLoading(true);
        try {
            const { data } = await api.post('/trips', tripData);
            setTrips([data, ...trips]);
            setCurrentTrip(data);
            return data;
        } catch (e) {
            setError(e.message);
            throw e;
        } finally {
            setLoading(false);
        }
    }, [trips]);

    // Add place to itinerary
const addToItinerary = useCallback(async (itineraryData) => {
  setLoading(true);
  try {
    const { data } = await api.post('/itineraries', itineraryData);
    setItineraries([...itineraries, data]);
    return data;
  } catch (e) {
    // Temporary detailed log
    console.error('Add itinerary failed:', e.response?.data || e.message);
    setError(e.message);
    throw e;
  } finally {
    setLoading(false);
  }
}, [itineraries]);


    // Update itinerary item
    const updateItinerary = useCallback(async (id, updates) => {
        try {
            const { data } = await api.put(`/itineraries/${id}`, updates);
            setItineraries(itineraries.map(i => i.id === id ? data : i));
            return data;
        } catch (e) {
            setError(e.message);
            throw e;
        }
    }, [itineraries]);

    // Delete itinerary item
    const deleteItinerary = useCallback(async (id) => {
        try {
            await api.delete(`/itineraries/${id}`);
            setItineraries(itineraries.filter(i => i.id !== id));
        } catch (e) {
            setError(e.message);
            throw e;
        }
    }, [itineraries]);

    // Calculate route
    const calculateRoute = useCallback(async (tripId) => {
        setLoading(true);
        try {
            const { data } = await api.post(`/trips/${tripId}/calculate-route`);
            setCurrentTrip(data.trip);
            setItineraries(data.itineraries);
            return data;
        } catch (e) {
            setError(e.message);
            throw e;
        } finally {
            setLoading(false);
        }
    }, []);

    // Get route details
    const getRouteDetails = useCallback(async (tripId) => {
        try {
            const { data } = await api.get(`/trips/${tripId}/route-details`);
            return data;
        } catch (e) {
            setError(e.message);
            throw e;
        }
    }, []);

    // Search places
    const searchPlaces = useCallback(async (query, lat, lng) => {
        try {
            const { data } = await api.get('/itineraries/search-places', {
                params: { query, lat, lng }
            });
            return data;
        } catch (e) {
            setError(e.message);
            return [];
        }
    }, []);

    // Get suggestions between waypoints
    const getSuggestions = useCallback(async (fromLat, fromLng, toLat, toLng) => {
        try {
            const { data } = await api.get('/itineraries/suggest-places', {
                params: { from_lat: fromLat, from_lng: fromLng, to_lat: toLat, to_lng: toLng }
            });
            return data;
        } catch (e) {
            setError(e.message);
            return [];
        }
    }, []);

    return {
        trips,
        currentTrip,
        itineraries,
        loading,
        error,
        fetchTrips,
        fetchTrip,
        createTrip,
        addToItinerary,
        updateItinerary,
        deleteItinerary,
        calculateRoute,
        getRouteDetails,
        searchPlaces,
        getSuggestions
    };
}
