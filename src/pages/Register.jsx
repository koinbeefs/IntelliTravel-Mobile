import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        password_confirmation: ''
    });
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.password_confirmation) {
            setError("Passwords do not match");
            return;
        }

        try {
            await register(
                formData.username, 
                formData.email, 
                formData.password, 
                formData.password_confirmation
            );
            // On success, AuthContext sets the user, and Router redirects to Home
            navigate('/home');
        } catch (err) {
            // Handle Laravel validation errors
            if (err.response && err.response.data.errors) {
                // Get the first error message from the object
                const firstError = Object.values(err.response.data.errors)[0][0];
                setError(firstError);
            } else {
                setError('Registration failed. Please try again.');
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white p-6">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Create Account</h1>
                    <p className="text-gray-500">Join IntelliTravel today</p>
                </div>

                {error && <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm text-center">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="text"
                            placeholder="Username"
                            className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
                            value={formData.username}
                            onChange={(e) => setFormData({...formData, username: e.target.value})}
                            required
                        />
                    </div>
                    <div>
                        <input
                            type="email"
                            placeholder="Email Address"
                            className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            required
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            placeholder="Password"
                            className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            required
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            placeholder="Confirm Password"
                            className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
                            value={formData.password_confirmation}
                            onChange={(e) => setFormData({...formData, password_confirmation: e.target.value})}
                            required
                        />
                    </div>
                    
                    <button className="w-full bg-primary text-white py-4 rounded-xl font-semibold shadow-lg shadow-primary/30 hover:bg-sky-600 transition">
                        Sign Up
                    </button>
                </form>

                <div className="mt-8 text-center text-gray-500 text-sm">
                    Already have an account? <Link to="/login" className="text-primary font-semibold">Login</Link>
                </div>
            </div>
        </div>
    );
}
