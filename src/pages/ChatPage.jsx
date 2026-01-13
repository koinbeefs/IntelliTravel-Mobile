import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';

export default function ChatPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef();

  // 1. Poll for messages (Simple V1 approach)
  useEffect(() => {
    const fetchMessages = async () => {
        try {
            const { data } = await api.get(`/trips/${tripId}/messages`);
            setMessages(data);
        } catch (e) { console.error(e); }
    };

    fetchMessages();
    const timer = setInterval(fetchMessages, 3000); // Poll every 3s
    return () => clearInterval(timer);
  }, [tripId]);

  // 2. Scroll to bottom on new message
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // Optimistic UI update
    const tempMsg = { 
        id: Date.now(), 
        content: input, 
        user: { id: user.id, username: user.username }, 
        created_at: new Date().toISOString() 
    };
    setMessages([...messages, tempMsg]);
    setInput('');

    await api.post(`/trips/${tripId}/messages`, { content: tempMsg.content });
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <div className="bg-white p-4 shadow-sm flex items-center gap-3">
        <button onClick={() => navigate(-1)}><ArrowLeft /></button>
        <h1 className="font-bold">Trip Chat</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => {
            const isMe = msg.user.id === user.id;
            return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl ${isMe ? 'bg-blue-600 text-white' : 'bg-white text-gray-800'}`}>
                        {!isMe && <p className="text-xs opacity-50 mb-1">{msg.user.username}</p>}
                        <p>{msg.content}</p>
                    </div>
                </div>
            );
        })}
        <div ref={scrollRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 bg-white border-t flex gap-2">
        <input 
            className="flex-1 border rounded-full px-4 py-2"
            placeholder="Type a message..."
            value={input}
            onChange={e => setInput(e.target.value)}
        />
        <button type="submit" className="p-2 bg-blue-600 text-white rounded-full">
            <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
