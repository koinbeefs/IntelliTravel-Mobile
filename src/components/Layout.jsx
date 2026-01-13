import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';

export default function Layout() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Main Content */}
            <main className="pb-24"> {/* padding-bottom for fixed nav */}
                <Outlet />
            </main>
            
            {/* Fixed Navigation */}
            <Navigation />
        </div>
    );
}
