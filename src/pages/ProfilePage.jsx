import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Mail, Settings, Shield, Bell, ChevronRight, Save, X, Camera, Map, Edit2, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/axios';

export default function ProfilePage() {
    const { user, logout, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    // UI State
    const [activeTab, setActiveTab] = useState('overview');
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // Real Data State
    const [tripCount, setTripCount] = useState(0);
    const [memberSince, setMemberSince] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        username: '',
        email: '',
    });

    // 1. Load User Data & Stats
    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username || '',
                email: user.email || '',
            });

            // Format "Member Since"
            if (user.created_at) {
                const date = new Date(user.created_at);
                setMemberSince(date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
            }

            // Fetch Real Trip Count
            fetchTripStats();
        }
    }, [user]);

    const fetchTripStats = async () => {
        try {
            const { data } = await api.get('/trips');
            setTripCount(data.length);
        } catch (e) {
            console.error("Failed to fetch trip stats", e);
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
            // Call the actual update endpoint
            // Note: You need to ensure your backend supports PUT /user or similar.
            // For now, assuming standard Laravel AuthController "update" logic if implemented,
            // otherwise this is a placeholder for where you add that backend logic.
             await api.put('/user/profile', {
                username: formData.username,
                email: formData.email
            });
            
            alert("Profile updated successfully!");
            setIsEditing(false);
            // Ideally reload user context here, e.g. window.location.reload() or a context method
            window.location.reload(); 
        } catch (err) {
            alert(err.response?.data?.message || "Failed to update profile.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- Sub-Components ---
    const StatCard = ({ icon: Icon, label, value, color }) => (
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
                <Icon size={24} className="text-white" />
            </div>
            <div>
                <div className="text-2xl font-bold text-gray-800">{value}</div>
                <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</div>
            </div>
        </div>
    );

    if (authLoading) return <div className="p-8 text-center">Loading profile...</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header / Cover */}
            <div className="bg-blue-600 h-48 relative rounded-b-[2.5rem] shadow-lg overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
                
                {/* Top Bar */}
                <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center text-white z-10">
                    <h1 className="text-xl font-bold">My Profile</h1>
                    <button onClick={() => navigate('/home')} className="p-2 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/30 transition">
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Profile Info Card */}
            <div className="px-6 -mt-20 relative z-10">
                <div className="bg-white rounded-3xl shadow-xl p-6 flex flex-col items-center text-center">
                    <div className="relative mb-4">
                        <div className="w-24 h-24 rounded-full p-1 bg-white shadow-md">
                            <img 
                                src={user?.profile_pic || `https://ui-avatars.com/api/?name=${user?.username}&background=38a1db&color=fff`} 
                                alt="Profile" 
                                className="w-full h-full rounded-full object-cover bg-gray-200"
                            />
                        </div>
                        {isEditing && (
                            <button className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-lg border-2 border-white">
                                <Camera size={14} />
                            </button>
                        )}
                    </div>

                    <h2 className="text-2xl font-bold text-gray-800">{user?.username}</h2>
                    <p className="text-gray-500 text-sm mb-4">{user?.email}</p>
                    
                    <div className="flex items-center gap-2 text-xs font-medium bg-blue-50 text-blue-600 px-3 py-1 rounded-full">
                        <Shield size={12} />
                        <span>Verified Member</span>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="px-6 mt-6 grid grid-cols-2 gap-4">
                <StatCard 
                    icon={Map} 
                    label="Trips Planned" 
                    value={tripCount} 
                    color="bg-purple-500" 
                />
                 <StatCard 
                    icon={Calendar} 
                    label="Joined" 
                    value={memberSince || "Recently"} 
                    color="bg-orange-500" 
                />
            </div>

            {/* Tabs / Actions */}
            <div className="px-6 mt-8 space-y-4">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Account Settings</h3>

                {/* Edit Profile Toggle */}
                <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                    <div 
                        onClick={() => setIsEditing(!isEditing)}
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                <User size={20} />
                            </div>
                            <span className="font-medium text-gray-700">Edit Personal Details</span>
                        </div>
                        <ChevronRight size={18} className={`text-gray-400 transition-transform ${isEditing ? 'rotate-90' : ''}`} />
                    </div>

                    {/* Edit Form */}
                    <AnimatePresence>
                        {isEditing && (
                            <motion.form 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                onSubmit={handleSaveProfile}
                                className="px-4 pb-4 border-t border-gray-100 bg-gray-50/50"
                            >
                                <div className="space-y-3 pt-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 ml-1">Username</label>
                                        <input 
                                            type="text" 
                                            value={formData.username}
                                            onChange={(e) => setFormData({...formData, username: e.target.value})}
                                            className="w-full mt-1 p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 ml-1">Email Address</label>
                                        <input 
                                            type="email" 
                                            value={formData.email}
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                            className="w-full mt-1 p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 bg-white"
                                        />
                                    </div>
                                    <button 
                                        type="submit" 
                                        disabled={isLoading}
                                        className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition mt-2 flex justify-center items-center gap-2"
                                    >
                                        {isLoading ? "Saving..." : <><Save size={18} /> Save Changes</>}
                                    </button>
                                </div>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>

                {/* Security Link */}
                <button 
                    onClick={() => navigate('/profile/security')}
                    className="w-full bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:bg-gray-50 transition"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                            <Shield size={20} />
                        </div>
                        <span className="font-medium text-gray-700">Security & Privacy</span>
                    </div>
                    <ChevronRight size={18} className="text-gray-400" />
                </button>

                 {/* Logout Button */}
                 <button 
                    onClick={handleLogout}
                    className="w-full bg-white p-4 rounded-2xl border border-red-100 shadow-sm flex items-center justify-between hover:bg-red-50 transition group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 group-hover:bg-red-200 transition">
                            <LogOut size={20} />
                        </div>
                        <span className="font-medium text-red-600">Log Out</span>
                    </div>
                </button>
            </div>
            
            <div className="mt-8 text-center">
                <p className="text-xs text-gray-400">IntelliTravel v1.0.2</p>
            </div>
        </div>
    );
}
