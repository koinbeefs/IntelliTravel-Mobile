import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Users, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';

export default function ChatPage() {
    const { tripId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [tripTitle, setTripTitle] = useState('Trip Chat');
    const [collaborators, setCollaborators] = useState([]);
    const scrollRef = useRef();
    const messagesEndRef = useRef();

    // 1. Fetch trip details and collaborators
    useEffect(() => {
        const fetchTripInfo = async () => {
            try {
                const [tripRes, collabRes] = await Promise.all([
                    api.get(`/trips/${tripId}`),
                    api.get(`/trips/${tripId}/collaborators`)
                ]);
                setTripTitle(tripRes.data.title);
                setCollaborators(collabRes.data);
            } catch (e) {
                console.error('Failed to fetch trip info', e);
            }
        };
        fetchTripInfo();
    }, [tripId]);

    // 2. Poll for messages
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const { data } = await api.get(`/trips/${tripId}/messages`);
                setMessages(data);
            } catch (e) {
                console.error('Failed to fetch messages', e);
            }
        };

        fetchMessages();
        const timer = setInterval(fetchMessages, 3000);
        return () => clearInterval(timer);
    }, [tripId]);

    // 3. Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        // Optimistic UI
        const tempMsg = {
            id: Date.now(),
            content: input,
            user: { id: user.id, username: user.username, profile_pic: user.profile_pic },
            created_at: new Date().toISOString(),
        };

        setMessages([...messages, tempMsg]);
        setInput('');

        try {
            await api.post(`/trips/${tripId}/messages`, { content: tempMsg.content });
        } catch (e) {
            console.error('Failed to send message', e);
        }
    };

    // Helper: Format timestamp
    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    };

    // Helper: Check if same day
    const isSameDay = (d1, d2) => {
        const date1 = new Date(d1);
        const date2 = new Date(d2);
        return date1.toDateString() === date2.toDateString();
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* FIXED HEADER */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-lg sticky top-0 z-20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => navigate(-1)} 
                            className="p-2 hover:bg-white/20 rounded-full transition"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="font-bold text-lg">{tripTitle}</h1>
                            <p className="text-xs text-blue-100 flex items-center gap-1">
                                <Users size={12} />
                                {collaborators.length} member{collaborators.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                    <button className="p-2 hover:bg-white/20 rounded-full transition">
                        <MoreVertical size={20} />
                    </button>
                </div>
            </div>

            {/* SCROLLABLE MESSAGES AREA */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                <AnimatePresence>
                    {messages.map((msg, index) => {
                        const isMe = msg.user.id === user.id;
                        const showDate = index === 0 || !isSameDay(msg.created_at, messages[index - 1]?.created_at);

                        return (
                            <div key={msg.id}>
                                {/* Date Separator */}
                                {showDate && (
                                    <div className="flex justify-center my-4">
                                        <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full font-medium">
                                            {new Date(msg.created_at).toLocaleDateString('en-US', { 
                                                month: 'short', 
                                                day: 'numeric', 
                                                year: 'numeric' 
                                            })}
                                        </span>
                                    </div>
                                )}

                                {/* Message Bubble */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className={`flex gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                                >
                                    {/* Avatar (only for others) */}
                                    {!isMe && (
                                        <img
                                            src={msg.user.profile_pic || `https://ui-avatars.com/api/?name=${msg.user.username}&background=random`}
                                            alt={msg.user.username}
                                            className="w-8 h-8 rounded-full border-2 border-white shadow-sm shrink-0"
                                        />
                                    )}

                                    {/* Bubble */}
                                    <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                                        {!isMe && (
                                            <span className="text-xs font-bold text-gray-600 px-1">
                                                {msg.user.username}
                                            </span>
                                        )}
                                        <div
                                            className={`px-4 py-2.5 rounded-2xl shadow-sm ${
                                                isMe
                                                    ? 'bg-blue-600 text-white rounded-br-md'
                                                    : 'bg-white text-gray-800 rounded-bl-md border border-gray-100'
                                            }`}
                                        >
                                            <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                                        </div>
                                        <span className={`text-[10px] text-gray-400 px-1`}>
                                            {formatTime(msg.created_at)}
                                        </span>
                                    </div>
                                </motion.div>
                            </div>
                        );
                    })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* FIXED INPUT BAR */}
            <form 
                onSubmit={handleSend} 
                className="p-4 bg-white border-t border-gray-200 flex gap-3 items-center sticky bottom-0"
            >
                <input
                    className="flex-1 border border-gray-300 rounded-full px-5 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                    placeholder="Type a message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                />
                <button
                    type="submit"
                    disabled={!input.trim()}
                    className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Send size={20} />
                </button>
            </form>
        </div>
    );
}
