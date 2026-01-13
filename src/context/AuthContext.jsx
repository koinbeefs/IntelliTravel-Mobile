import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/axios';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    // Check if user is logged in on load
    useEffect(() => {
        if (token) {
            api.get('/user')
                .then(({ data }) => setUser(data))
                .catch(() => {
                    localStorage.removeItem('token');
                    setToken(null);
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [token]);

    const login = async (username, password) => {
        const { data } = await api.post('/login', { username, password });
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
    };

    const register = async (username, email, password, password_confirmation) => {
        const { data } = await api.post('/register', { 
            username, email, password, password_confirmation 
        });
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
    };

    const loginAsGuest = () => {
        const guestUser = {
            id: 0,
            username: 'Guest',
            email: '',
            profile_pic: 'https://ui-avatars.com/api/?name=Guest&background=gray&color=fff',
            is_guest: true // We can check this flag later to hide features like Chat
        };
        setUser(guestUser);
        // We do NOT set a token, because guests don't have one.
        // If you refresh the page, the guest session will be lost. 
        // If you want it to persist, you can save 'is_guest' to localStorage.
    };

    const logout = async () => {
        if (token) {
            try {
                await api.post('/logout');
            } catch (e) {
                // Ignore error if token is invalid
            }
        }
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, loginAsGuest, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
