import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import GoogleCallback from './pages/GoogleCallback';
import Layout from './components/Layout';
import MapPage from './pages/MapPage';
import Home from './pages/Home';
import RoutePlannerPage from './pages/RoutePlannerPage';
import TripsListPage from './pages/TripsListPage';
import TripDetailsPage from './pages/TripDetailsPage';
import ProfilePage from './pages/ProfilePage';
import TripCreatePage from './pages/TripCreatePage';
import ManualItineraryBuilder from './pages/ManualItineraryBuilder';
import AutoItineraryPage from './pages/AutoItineraryPage';
import LiveNavigationPage from './pages/LiveNavigationPage'; // <--- IMPORT THIS
import ChatPage from './pages/ChatPage';
import PrivacySecurityPage from './pages/PrivacySecurityPage';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );
    if (!user) return <Navigate to="/login" />;
    return children;
};

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    {/* Public / Standalone Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/auth/callback" element={<GoogleCallback />} />
                    
                    {/* Trip Creation & Tools (No Layout) */}
                    <Route path="/trip-create" element={<TripCreatePage />} />
                    <Route path="/trip-builder/:tripId" element={<ManualItineraryBuilder />} />
                    <Route path="/trip-generator/:tripId" element={<AutoItineraryPage />} />
                    <Route path="/trip-details/:tripId" element={<TripDetailsPage />} />
                    
                    {/* FIX: Add Navigation Route Here */}
                    <Route path="/navigation/:tripId" element={<LiveNavigationPage />} />

                    {/* Protected Routes with Layout (Sidebar, Header) */}
                    <Route element={
                        <ProtectedRoute>
                            <Layout />
                        </ProtectedRoute>
                    }>
                        <Route path="/home" element={<Home />} />
                        <Route path="/map" element={<MapPage />} />
                        <Route path="/route" element={<RoutePlannerPage />} />
                        <Route path="/trips" element={<TripsListPage />} />
                        <Route path="/trips/:tripId" element={<TripDetailsPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="chat/:tripId" element={<ChatPage />} />
                        <Route path="profile/security" element={<PrivacySecurityPage />} />
                    </Route>
                    
                    {/* Default Redirect */}
                    <Route path="/" element={<Navigate to="/home" />} />
                    <Route path="*" element={<Navigate to="/home" />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}
