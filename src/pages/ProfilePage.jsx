import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios'; // Import API client
import { 
  LogOut, User, Mail, Settings, Shield, 
  Bell, ChevronRight, Save, X, Camera, Map, Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProfilePage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    
    // UI State
    const [activeTab, setActiveTab] = useState('overview');
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Real Data State
    const [stats, setStats] = useState({ tripCount: 0, recentTrips: [] });
    
    // Form State (Pre-filled with user data)
    const [formData, setFormData] = useState({
        username: user?.username || '',
        email: user?.email || '',
        bio: 'Avid traveler & explorer.', // Note: Add 'bio' to your backend User model if you want this persistent
        notifications: true
    });

    // Reset form when user loads
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                username: user.username || '',
                email: user.email || ''
            }));
            fetchUserStats();
        }
    }, [user]);

    // Fetch Real Trip Data
    const fetchUserStats = async () => {
        try {
            const { data } = await api.get('/trips');
            setStats({
                tripCount: data.length,
                recentTrips: data.slice(0, 3) // Get top 3 most recent
            });
        } catch (e) {
            console.error("Failed to fetch stats", e);
        }
    };

    const handleLogout = async () => {
        if (confirm('Are you sure you want to log out?')) {
            await logout();
            navigate('/login');
        }
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // Update User Profile
            await api.put('/user/profile', {
                username: formData.username,
                email: formData.email
            });
            alert("Profile updated successfully!");
            setIsEditing(false);
            window.location.reload(); // Reload to refresh global user context
        } catch (err) {
            alert(err.response?.data?.message || "Failed to update profile.");
        } finally {
            setIsLoading(false);
        }
    };

    // Helper: Time Ago formatted
    const timeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        if (diffInDays === 0) return 'Today';
        if (diffInDays === 1) return 'Yesterday';
        return `${diffInDays}d ago`;
    };

    // --- Sub-Components for Tabs ---

    const OverviewTab = () => (
        <div className="space-y-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2 mb-2 text-blue-600">
                        <Map size={20} />
                        <span className="font-bold text-sm">Trips Planned</span>
                    </div>
                    {/* Real Data: Trip Count */}
                    <p className="text-2xl font-bold text-gray-900">{stats.tripCount}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                    <div className="flex items-center gap-2 mb-2 text-purple-600">
                        <Shield size={20} />
                        <span className="font-bold text-sm">Account Status</span>
                    </div>
                    {/* Real Data: Check verification */}
                    <p className="text-sm font-bold text-gray-900 mt-2 bg-white inline-block px-2 py-1 rounded shadow-sm">
                        {(user?.email_verified_at || user?.google_id) ? 'Verified Member' : 'Member'}
                    </p>
                </div>
            </div>

            {/* Recent Activity (Real Data) */}
            <div className="bg-white border border-gray-100 rounded-xl p-4">
                <h3 className="font-bold text-gray-800 mb-3">Recent Activity</h3>
                <div className="space-y-3">
                    {stats.recentTrips.length > 0 ? (
                        stats.recentTrips.map(trip => (
                            <div key={trip.id} onClick={() => navigate(`/trips/${trip.id}`)} className="flex items-center gap-3 text-sm p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition">
                                <div className="w-2 h-2 rounded-full bg-green-500 shrink-0"></div>
                                <p className="text-gray-600 truncate">
                                    Created trip to <span className="font-bold text-gray-800">{trip.destination}</span>
                                </p>
                                <span className="ml-auto text-xs text-gray-400 shrink-0">{timeAgo(trip.created_at)}</span>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-gray-400 italic p-2">No recent activity.</p>
                    )}
                </div>
            </div>
        </div>
    );

    const SettingsTab = () => (
        <div className="space-y-4">
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Bell className="text-gray-500" size={20} />
                        <div>
                            <p className="font-medium text-gray-900">Push Notifications</p>
                            <p className="text-xs text-gray-500">Receive alerts about your trips</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={formData.notifications}
                            onChange={(e) => setFormData({...formData, notifications: e.target.checked})}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>
                
                <button onClick={() => navigate('/profile/security')} className="w-full p-4 flex items-center justify-between hover:bg-gray-50 text-left">
                    <div className="flex items-center gap-3">
                        <Shield className="text-gray-500" size={20} />
                        <div>
                            <p className="font-medium text-gray-900">Privacy & Security</p>
                            <p className="text-xs text-gray-500">Change password and visibility</p>
                        </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                </button>
            </div>

            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                <h3 className="font-bold text-red-700 text-sm mb-1">Danger Zone</h3>
                <p className="text-xs text-red-600 mb-3">Deleting your account is permanent.</p>
                <button className="px-4 py-2 bg-white border border-red-200 text-red-600 text-sm font-bold rounded-lg hover:bg-red-50">
                    Delete Account
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 pb-20"> {/* pb-20 for BottomNav space */}
            {/* Header / Banner */}
            <div className="bg-white pb-6 shadow-sm border-b border-gray-100">
                <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 relative">
                    {/* Logout Button Absolute Top Right */}
                    <button 
                        onClick={handleLogout}
                        className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm p-2 rounded-full text-white hover:bg-white/30 transition"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
                
                <div className="px-6 -mt-12 flex justify-between items-end">
                    <div className="relative">
                        <img 
                            src={user?.profile_pic || `https://ui-avatars.com/api/?name=${user?.username || 'User'}&background=random`} 
                            alt="Profile"
                            className="w-24 h-24 rounded-2xl border-4 border-white shadow-md bg-white object-cover"
                        />
                        <button className="absolute bottom-0 right-0 bg-gray-900 text-white p-1.5 rounded-full border-2 border-white shadow-sm">
                            <Camera size={14} />
                        </button>
                    </div>
                    <button 
                        onClick={() => setIsEditing(!isEditing)}
                        className={`px-4 py-2 rounded-lg font-bold text-sm border shadow-sm transition-colors flex items-center gap-2
                        ${isEditing 
                            ? 'bg-gray-100 text-gray-700 border-gray-200' 
                            : 'bg-blue-600 text-white border-transparent hover:bg-blue-700'}`}
                    >
                        {isEditing ? <><X size={16}/> Cancel</> : <><Edit2 size={16}/> Edit Profile</>}
                    </button>
                </div>

                <div className="px-6 mt-4">
                    {isEditing ? (
                        <form onSubmit={handleSaveProfile} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Username</label>
                                <input 
                                    className="w-full border p-2 rounded-lg bg-gray-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-blue-100"
                                    value={formData.username}
                                    onChange={e => setFormData({...formData, username: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                                <input 
                                    className="w-full border p-2 rounded-lg bg-gray-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-blue-100"
                                    value={formData.email}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                            <button 
                                disabled={isLoading}
                                className="w-full bg-green-600 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-transform"
                            >
                                {isLoading ? "Saving..." : <><Save size={18} /> Save Changes</>}
                            </button>
                        </form>
                    ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <h1 className="text-2xl font-bold text-gray-900">{user?.username || 'Guest User'}</h1>
                            <p className="text-gray-500 flex items-center gap-1.5 text-sm mt-1">
                                <Mail size={14} /> {user?.email}
                            </p>
                            <p className="text-gray-600 mt-3 text-sm leading-relaxed max-w-sm">
                                {formData.bio}
                            </p>
                        </motion.div>
                    )}
                </div>

                {/* Tab Switcher */}
                <div className="flex gap-6 px-6 mt-6 border-b border-gray-100">
                    {['overview', 'settings'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-3 text-sm font-bold capitalize transition-colors relative
                                ${activeTab === tab ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            {tab}
                            {activeTab === tab && (
                                <motion.div 
                                    layoutId="activeTab"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="p-6">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'overview' ? <OverviewTab /> : <SettingsTab />}
                </motion.div>
            </div>
            
        </div>
    );
}
