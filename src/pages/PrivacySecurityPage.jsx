import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Eye, EyeOff, Shield, Key, Download, Save, Globe } from 'lucide-react';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';

export default function PrivacySecurityPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Check if user is logged in via Google/Social
  const isSocialLogin = user?.google_id || user?.provider === 'google';

  // Password State
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [showPass, setShowPass] = useState(false);

  // Privacy State
  const [privacySettings, setPrivacySettings] = useState({
    isPublic: true,
    shareActivity: true,
    twoFactor: false
  });

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      alert("New passwords do not match");
      return;
    }
    
    setLoading(true);
    try {
      await api.put('/user/password', {
        current_password: passwords.current,
        new_password: passwords.new,
        new_password_confirmation: passwords.confirm
      });
      alert("Password updated successfully!");
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  const togglePrivacy = (key) => {
    // In production, call API to save preference
    setPrivacySettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm border-b border-gray-100 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Privacy & Security</h1>
          <p className="text-xs text-gray-500">Manage your account security</p>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        
        {/* 1. Account Security Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <Key size={18} className="text-blue-600" />
            <h2 className="font-bold text-gray-800 text-sm">Sign-in Method</h2>
          </div>

          {isSocialLogin ? (
            // VIEW FOR GOOGLE USERS
            <div className="p-6 flex flex-col items-center text-center">
               <div className="bg-blue-50 p-3 rounded-full mb-3">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
               </div>
               <h3 className="font-bold text-gray-900">Signed in with Google</h3>
               <p className="text-sm text-gray-500 mt-1 mb-4">
                 Your password and security are managed by Google. To change your password, please visit your Google Account settings.
               </p>
               <a 
                 href="https://myaccount.google.com/"
                 target="_blank"
                 rel="noreferrer"
                 className="text-blue-600 font-bold text-sm hover:underline"
               >
                 Manage Google Account
               </a>
            </div>
          ) : (
            // VIEW FOR EMAIL/PASSWORD USERS
            <form onSubmit={handlePasswordChange} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Current Password</label>
                <input 
                  type={showPass ? "text" : "password"}
                  className="w-full border p-2 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={passwords.current}
                  onChange={e => setPasswords({...passwords, current: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">New Password</label>
                  <input 
                    type={showPass ? "text" : "password"}
                    className="w-full border p-2 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={passwords.new}
                    onChange={e => setPasswords({...passwords, new: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Confirm</label>
                  <input 
                    type={showPass ? "text" : "password"}
                    className="w-full border p-2 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={passwords.confirm}
                    onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowPass(!showPass)}
                  className="text-xs text-gray-500 flex items-center gap-1 hover:text-gray-700"
                >
                  {showPass ? <EyeOff size={14}/> : <Eye size={14}/>} {showPass ? "Hide" : "Show"} Passwords
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : <><Save size={16}/> Update</>}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* 2. Privacy Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <Shield size={18} className="text-green-600" />
            <h2 className="font-bold text-gray-800 text-sm">Privacy Settings</h2>
          </div>
          
          <div className="divide-y divide-gray-100">
            {/* Public Profile Toggle */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 p-2 rounded-full text-blue-600">
                  <Globe size={20} />
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-900">Public Profile</p>
                  <p className="text-xs text-gray-500">Allow others to find your trips</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={privacySettings.isPublic}
                  onChange={() => togglePrivacy('isPublic')}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* 2FA Toggle */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-purple-50 p-2 rounded-full text-purple-600">
                  <Lock size={20} />
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-900">Two-Factor Auth</p>
                  <p className="text-xs text-gray-500">Secure your account</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={privacySettings.twoFactor}
                  onChange={() => togglePrivacy('twoFactor')}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* 3. Data Export */}
        <button className="w-full bg-white border border-gray-200 p-4 rounded-xl flex items-center justify-center gap-2 text-gray-600 font-bold text-sm hover:bg-gray-50">
          <Download size={18} />
          Download My Data
        </button>

      </div>
    </div>
  );
}
