import { Home, Map, MessageCircle, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function BottomNav() {
    const location = useLocation();
    
    const isActive = (path) => location.pathname === path 
        ? "text-blue-500" 
        : "text-gray-400 hover:text-blue-400";

    return (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 py-3 px-6 flex justify-between items-center z-[1000]">
            <Link to="/home" className={`flex flex-col items-center gap-1 ${isActive('/home')}`}>
                <Home size={24} />
                <span className="text-xs font-medium">Home</span>
            </Link>
            
            <Link to="/map" className={`flex flex-col items-center gap-1 ${isActive('/map')}`}>
                <Map size={24} />
                <span className="text-xs font-medium">Map</span>
            </Link>

            <Link to="/messages" className={`flex flex-col items-center gap-1 ${isActive('/messages')}`}>
                <MessageCircle size={24} />
                <span className="text-xs font-medium">Chat</span>
            </Link>

            <Link to="/profile" className={`flex flex-col items-center gap-1 ${isActive('/profile')}`}>
                <User size={24} />
                <span className="text-xs font-medium">Profile</span>
            </Link>
        </div>
    );
}
