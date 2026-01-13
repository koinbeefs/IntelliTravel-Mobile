import { BrowserRouter, Routes, Route, Navigate, useNavigate} from 'react-router-dom';
import { useEffect } from 'react'; // Import useEffect
import { AuthProvider, useAuth } from './context/AuthContext';
import { App as CapacitorApp } from '@capacitor/app'; // Import Capacitor App
import { Browser } from '@capacitor/browser'; // Import Capacitor Browser
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

function AppUrlListener() {
    const navigate = useNavigate();

    useEffect(() => {
        CapacitorApp.addListener('appUrlOpen', async (data) => {
            console.log('App opened with URL:', data.url);
            
            // data.url example: "intellitravel://auth/callback?token=xyz123"
            try {
                const url = new URL(data.url);
                
                // Check if this is our Google Auth Callback
                if (url.host === 'auth' && url.pathname.includes('callback')) {
                    const token = url.searchParams.get('token');
                    if (token) {
                        // Save token
                        localStorage.setItem('token', token);
                        
                        // Close the In-App Browser (Chrome/Safari View)
                        await Browser.close();
                        
                        // Navigate to Home
                        // Force window reload to ensure AuthContext picks up the new token immediately
                        window.location.href = '/home'; 
                    }
                }
            } catch (e) {
                console.error('Deep link error:', e);
            }
        });
    }, [navigate]);

    return null; // This component doesn't render anything visible
}

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
            <AppUrlListener />
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
