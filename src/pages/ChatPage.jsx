import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Users, MoreVertical, Image as ImageIcon, MapPin, X, Camera, Check, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';

// ... (Keep THEMES and BUBBLE_THEMES constants same as before) ...
const THEMES = {
    blue: 'from-blue-600 to-indigo-600',
    purple: 'from-purple-600 to-pink-600',
    green: 'from-emerald-600 to-teal-600',
    orange: 'from-orange-500 to-red-500',
    dark: 'from-gray-800 to-black',
};

const BUBBLE_THEMES = {
    blue: 'bg-blue-600',
    purple: 'bg-purple-600',
    green: 'bg-emerald-600',
    orange: 'bg-orange-500',
    dark: 'bg-gray-800',
};

export default function ChatPage() {
    const { tripId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    // Core State
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [tripData, setTripData] = useState(null);
    const [collaborators, setCollaborators] = useState([]);
    
    // UI State
    const [showSettings, setShowSettings] = useState(false);
    const [activeTheme, setActiveTheme] = useState('blue');
    const [isSharingLocation, setIsSharingLocation] = useState(false);
    const [activeSharers, setActiveSharers] = useState([]);
    const [selectedMessageId, setSelectedMessageId] = useState(null); // For delete menu
    
    // File Upload State
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const fileInputRef = useRef();

    const messagesEndRef = useRef();

    // ... (Keep useEffects 1, 2, 3 for fetching data and polling exactly the same) ...
    // 1. Fetch Trip Data & Settings
    useEffect(() => {
        const fetchInit = async () => {
            try {
                const [tRes, cRes] = await Promise.all([
                    api.get(`/trips/${tripId}`),
                    api.get(`/trips/${tripId}/collaborators`)
                ]);
                setTripData(tRes.data);
                setCollaborators(cRes.data);
                if (tRes.data.chat_theme_color) setActiveTheme(tRes.data.chat_theme_color);
            } catch (e) { console.error(e); }
        };
        fetchInit();
    }, [tripId]);

    // 2. Poll Messages & Locations
    useEffect(() => {
        const poll = async () => {
            try {
                const [mRes, lRes] = await Promise.all([
                    api.get(`/trips/${tripId}/messages`),
                    api.get(`/trips/${tripId}/locations`)
                ]);
                setMessages(mRes.data);
                setActiveSharers(lRes.data);
            } catch (e) { console.error(e); }
        };
        poll();
        const timer = setInterval(poll, 3000);
        return () => clearInterval(timer);
    }, [tripId]);

    // 3. Location Tracking Logic
    useEffect(() => {
        let watcher;
        if (isSharingLocation) {
            watcher = navigator.geolocation.watchPosition(
                (pos) => {
                    api.post(`/trips/${tripId}/location`, {
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                        is_sharing: true
                    });
                },
                (err) => console.error(err),
                { enableHighAccuracy: true }
            );
        } else {
            api.post(`/trips/${tripId}/location`, { lat: 0, lng: 0, is_sharing: false });
        }
        return () => watcher && navigator.geolocation.clearWatch(watcher);
    }, [isSharingLocation, tripId]);


    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Handlers
    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() && !selectedImage) return;

        const formData = new FormData();
        if (input) formData.append('content', input);
        if (selectedImage) formData.append('image', selectedImage);

        // Optimistic UI Update
        const tempId = Date.now();
        const tempMsg = {
            id: tempId,
            content: input,
            type: selectedImage ? 'image' : 'text',
            attachment_url: selectedImage ? URL.createObjectURL(selectedImage) : null, // Show local preview
            user: { id: user.id, username: user.username, profile_pic: user.profile_pic },
            created_at: new Date().toISOString()
        };
        
        setMessages([...messages, tempMsg]);
        setInput('');
        setSelectedImage(null);
        setPreviewUrl(null);

        try {
            await api.post(`/trips/${tripId}/messages`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        } catch (e) {
            console.error('Failed to send', e);
            // Optionally remove the temp message on failure
        }
    };

    const handleDeleteMessage = async (msgId, mode) => {
        // mode = 'everyone' or 'me'
        if(!confirm(`Delete for ${mode}?`)) return;
        
        try {
            // Need to add DELETE route in backend: Route::delete('/messages/{id}', ...)
            await api.delete(`/messages/${msgId}`, { params: { mode } });
            
            // Remove from local state immediately
            setMessages(messages.filter(m => m.id !== msgId));
            setSelectedMessageId(null);
        } catch (e) {
            alert('Failed to delete message');
        }
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };
    
    // ... (keep updateTripSettings same as before) ...
    const updateTripSettings = async (updates) => {
        try {
            const formData = new FormData();
            if (updates.title) formData.append('title', updates.title);
            if (updates.chat_theme_color) formData.append('chat_theme_color', updates.chat_theme_color);
            if (updates.group_photo) formData.append('group_photo', updates.group_photo);

            const { data } = await api.post(`/trips/${tripId}/settings`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setTripData(data);
            if (updates.chat_theme_color) setActiveTheme(updates.chat_theme_color);
            alert('Settings updated!');
        } catch (e) { alert('Failed to update'); }
    };


    return (
        <div className="h-screen bg-gray-50 flex flex-col relative overflow-hidden">
            
            {/* --- FIXED HEADER (z-index 40) --- */}
            <div className={`fixed top-0 left-0 w-full z-40 bg-gradient-to-r ${THEMES[activeTheme]} text-white p-4 shadow-lg transition-colors duration-500`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/20 rounded-full">
                            <ArrowLeft size={20} />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/20 overflow-hidden border-2 border-white/50">
                                <img 
                                    src={tripData?.group_photo || tripData?.user?.profile_pic || `https://ui-avatars.com/api/?name=${tripData?.title || 'T'}&background=random`} 
                                    alt="Group"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div>
                                <h1 className="font-bold text-lg leading-tight line-clamp-1">{tripData?.title || 'Trip Chat'}</h1>
                                <p className="text-xs text-white/80 flex items-center gap-1">
                                    <Users size={12} /> {collaborators.length}
                                    {activeSharers.length > 0 && (
                                        <span className="flex items-center gap-1 ml-2 bg-green-500/20 px-1.5 py-0.5 rounded-full">
                                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"/> 
                                            {activeSharers.length} Live
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-white/20 rounded-full">
                        <MoreVertical size={20} />
                    </button>
                </div>
            </div>

            {/* --- SCROLLABLE MESSAGES (Padding top & bottom to clear fixed bars) --- */}
            <div className="flex-1 overflow-y-auto pt-20 pb-24 px-4 space-y-4" onClick={() => setSelectedMessageId(null)}>
                {messages.map((msg) => {
                    const isMe = msg.user.id === user.id;
                    return (
                        <motion.div 
                            key={msg.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`flex gap-2 ${isMe ? 'justify-end' : 'justify-start'} relative group`}
                        >
                             {/* DELETE MENU (Show on click) */}
                             {selectedMessageId === msg.id && isMe && (
                                <div className="absolute top-0 right-0 -mt-8 bg-white shadow-lg rounded-lg flex items-center p-1 z-10 text-xs">
                                    <button onClick={() => handleDeleteMessage(msg.id, 'me')} className="px-2 py-1 hover:bg-gray-100 text-gray-700">Delete for me</button>
                                    <div className="w-px h-3 bg-gray-300 mx-1"></div>
                                    <button onClick={() => handleDeleteMessage(msg.id, 'everyone')} className="px-2 py-1 hover:bg-red-50 text-red-600">Everyone</button>
                                </div>
                            )}

                            {!isMe && <img src={msg.user.profile_pic} className="w-8 h-8 rounded-full self-end mb-1" />}
                            
                            <div 
                                className={`max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                                onClick={(e) => { e.stopPropagation(); if(isMe) setSelectedMessageId(msg.id); }}
                            >
                                {!isMe && <span className="text-[10px] text-gray-500 ml-2 mb-1">{msg.user.username}</span>}

                                {/* --- UNIFORM IMAGE BUBBLE --- */}
                                {msg.type === 'image' || msg.attachment_url ? (
                                    <div className={`p-1 rounded-2xl overflow-hidden ${isMe ? BUBBLE_THEMES[activeTheme] : 'bg-white border'}`}>
                                        <img 
                                            src={msg.attachment_url} 
                                            className="w-64 h-64 object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                                            onClick={() => window.open(msg.attachment_url, '_blank')}
                                        />
                                        {/* Optional Caption */}
                                        {msg.content && msg.content !== 'Sent a photo' && (
                                            <p className={`text-sm px-2 py-1 ${isMe ? 'text-white' : 'text-gray-800'}`}>{msg.content}</p>
                                        )}
                                    </div>
                                ) : (
                                    <div className={`px-4 py-2 rounded-2xl shadow-sm text-sm ${
                                        isMe 
                                            ? `${BUBBLE_THEMES[activeTheme]} text-white rounded-br-none` 
                                            : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                    }`}>
                                        {msg.content}
                                    </div>
                                )}
                                <span className="text-[10px] text-gray-400 mt-1 mx-1">
                                    {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                            </div>
                        </motion.div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* --- FIXED INPUT BAR (z-index 40) --- */}
            <div className="fixed bottom-0 left-0 w-full z-40 bg-white border-t p-3 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
                {previewUrl && (
                    <div className="flex items-center gap-2 mb-2 p-2 bg-gray-100 rounded-lg w-fit">
                        <img src={previewUrl} className="w-12 h-12 object-cover rounded-md" />
                        <button onClick={() => { setSelectedImage(null); setPreviewUrl(null); }}><X size={16}/></button>
                    </div>
                )}
                <form onSubmit={handleSend} className="flex gap-2 items-end">
                    <button 
                        type="button" 
                        onClick={() => fileInputRef.current.click()}
                        className="p-3 text-gray-400 hover:bg-gray-100 rounded-full"
                    >
                        <ImageIcon size={22} />
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageSelect} 
                        hidden 
                        accept="image/*" 
                    />
                    
                    <div className="flex-1 bg-gray-100 rounded-2xl flex items-center px-4 py-2">
                        <input
                            className="flex-1 bg-transparent outline-none text-sm max-h-24"
                            placeholder="Message..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={!input.trim() && !selectedImage}
                        className={`p-3 rounded-full text-white shadow-md transition-all ${
                            (!input.trim() && !selectedImage) ? 'bg-gray-300' : BUBBLE_THEMES[activeTheme]
                        }`}
                    >
                        <Send size={20} />
                    </button>
                </form>
            </div>

            {/* --- SETTINGS MODAL (Same as before) --- */}
            <AnimatePresence>
                {showSettings && (
                     <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end"
                        onClick={() => setShowSettings(false)}
                    >
                        <motion.div 
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            onClick={e => e.stopPropagation()}
                            className="w-80 bg-white h-full shadow-2xl p-6 overflow-y-auto"
                        >
                            <h2 className="text-xl font-bold mb-6">Chat Settings</h2>

                            {/* Group Photo */}
                            <div className="mb-8 text-center">
                                <div className="w-24 h-24 mx-auto rounded-full bg-gray-100 mb-3 relative overflow-hidden group">
                                    <img 
                                        src={tripData?.group_photo || `https://ui-avatars.com/api/?name=${tripData?.title}`} 
                                        className="w-full h-full object-cover" 
                                    />
                                    <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition">
                                        <Camera className="text-white" />
                                        <input type="file" hidden onChange={(e) => updateTripSettings({ group_photo: e.target.files[0] })} />
                                    </label>
                                </div>
                                <input 
                                    className="text-center font-bold text-lg border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none w-full"
                                    defaultValue={tripData?.title}
                                    onBlur={(e) => updateTripSettings({ title: e.target.value })}
                                />
                            </div>

                            {/* Theme Selector */}
                            <div className="mb-8">
                                <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Theme Color</h3>
                                <div className="flex gap-3 flex-wrap">
                                    {Object.keys(THEMES).map(color => (
                                        <button
                                            key={color}
                                            onClick={() => updateTripSettings({ chat_theme_color: color })}
                                            className={`w-10 h-10 rounded-full bg-gradient-to-br ${THEMES[color]} shadow-sm flex items-center justify-center transition-transform hover:scale-110 ${activeTheme === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                                        >
                                            {activeTheme === color && <Check size={16} className="text-white" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Location Sharing */}
                            <div className="mb-8">
                                <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Location</h3>
                                <div className="bg-blue-50 p-4 rounded-xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                                            <MapPin size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800 text-sm">Live Ping</p>
                                            <p className="text-xs text-gray-500">Share location with group</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer"
                                            checked={isSharingLocation}
                                            onChange={(e) => setIsSharingLocation(e.target.checked)}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                                    </label>
                                </div>
                            </div>

                            {/* Active Location Sharers List */}
                            {activeSharers.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">On the Map</h3>
                                    <div className="space-y-2">
                                        {activeSharers.map(sharer => (
                                            <div key={sharer.id} className="flex items-center gap-2 text-sm p-2 hover:bg-gray-50 rounded-lg">
                                                <img src={sharer.profile_pic} className="w-6 h-6 rounded-full" />
                                                <span>{sharer.username}</span>
                                                <span className="ml-auto text-xs text-green-600 font-bold">Live</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
