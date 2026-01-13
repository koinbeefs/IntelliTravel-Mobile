import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, loginAsGuest } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(username, password);
            navigate('/home');
        } catch (e) {
            setError('Invalid credentials.');
        }
    };

    // NEW: Handle Guest Click
    const handleGuest = () => {
        loginAsGuest();
        navigate('/home');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white p-6">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Welcome Back!</h1>
                    <p className="text-gray-500">Sign in to continue your journey</p>
                </div>

                {error && <div className="bg-red-100 text-red-600 p-3 rounded mb-4 text-sm text-center">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="text"
                            placeholder="Username or Email"
                            className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            placeholder="Password"
                            className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    
                    <button className="w-full bg-primary text-white py-4 rounded-xl font-semibold shadow-lg shadow-primary/30 hover:bg-sky-600 transition">
                        Login
                    </button>
                </form>
                <div className="mt-4 flex flex-col gap-3">
                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-gray-200"></div>
                        <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">or sign in with</span>
                        <div className="flex-grow border-t border-gray-200"></div>
                    </div>

                    <a 
                        href="https://intellitravel-production.up.railway.app/api/auth/google"
                        className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-50 transition"
                    >
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                        Google
                    </a>
                </div>

                {/* NEW: Guest Button */}
                <button 
                    onClick={handleGuest}
                    type="button"
                    className="w-full flex items-center justify-center gap-2 text-gray-500 font-medium py-3 hover:text-gray-700 transition"
                >
                    Continue as Guest
                </button>

                <div className="mt-8 text-center text-gray-500 text-sm">
                    Don't have an account? <Link to="/register" className="text-primary font-semibold">Register</Link>
                </div>
            </div>
        </div>
    );
}
