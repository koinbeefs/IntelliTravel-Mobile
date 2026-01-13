import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function GoogleCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    // We need a way to set the token directly. 
    // Let's modify AuthContext slightly in a moment, 
    // but for now, we can access localStorage directly here.

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            localStorage.setItem('token', token);
            // Force a reload or update context (Reload is simpler for now to trigger auth check)
            window.location.href = '/home';
        } else {
            navigate('/login');
        }
    }, [navigate, searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-xl font-semibold text-gray-600">Processing Login...</div>
        </div>
    );
}
