import { Link, useLocation } from 'react-router-dom';
import { Home, Map, Calendar, User } from 'lucide-react';

export default function Navigation() {
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    const navItems = [
        { icon: Home, label: 'Home', path: '/home' },
        { icon: Map, label: 'Map', path: '/map' },
        { icon: Calendar, label: 'Trips', path: '/trips' },
        { icon: User, label: 'Profile', path: '/profile' },
    ];

    return (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 z-50">
            <div className="flex justify-around h-20">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    
                    return (
                        <Link 
                            key={item.path}
                            to={item.path}
                            className={`flex flex-col items-center justify-center w-full gap-1.5 transition-colors
                                ${active ? 'text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
                        >
                            <Icon size={24} />
                            <span className={`text-xs font-bold ${active ? 'text-blue-600' : ''}`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                    return(
                        <Link
                            to="/trip-create"
                            className="fixed bottom-24 right-6 bg-blue-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-xl hover:bg-blue-700 active:scale-90 transition-transform z-40"
                            title="Create new trip"
                        >
                            <Icon size={24} />
                            <span className={`text-xs font-bold ${active ? 'text-blue-600' : ''}`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
