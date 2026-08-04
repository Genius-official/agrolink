import React, { useState } from 'react';
import { Leaf, Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { apiLogin, apiRegister } from '../utils/api';
import './AuthPage.css';


export default function AuthPage({ onLogin, initialView = 'login' }) {
    const [isLogin, setIsLogin] = useState(initialView === 'login');
    const [loading, setLoading] = useState(false);
    const [role, setRole] = useState('farmer');

    // New State for form inputs
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    // Switch view resets error
    const toggleView = (loginState) => {
        setIsLogin(loginState);
        setError('');
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        try {
            if (!isLogin) {
                // REGISTER: Try API first, fallback to localStorage only if offline
                try {
                    const res = await apiRegister(fullName, email, password, role);
                    if (res?.user) { onLogin(res.user); return; }
                } catch (apiErr) {
                    if (!apiErr.message?.includes('Failed to fetch') && !apiErr.message?.includes('NetworkError')) {
                        setError(apiErr.message);
                        return;
                    }
                    console.warn('API registration offline, using localStorage:', apiErr.message);
                }
                // Local register: check email not already taken
                const existingUsers = JSON.parse(localStorage.getItem('agrolink_users') || '[]');
                if (existingUsers.find(u => u.email === email.toLowerCase().trim())) {
                    setError('An account with this email already exists. Please log in.');
                    return;
                }
                const localUser = {
                    id: `user-${Date.now()}`,
                    name: fullName.trim(),
                    email: email.toLowerCase().trim(),
                    role: role || 'farmer',
                    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`,
                    joined: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                    plan: 'free',
                    verified: false,
                    organicCertified: false,
                };
                existingUsers.push(localUser);
                localStorage.setItem('agrolink_users', JSON.stringify(existingUsers));
                onLogin(localUser);
                return;
            } else {
                // LOGIN: Try API first, fallback to localStorage only if offline
                try {
                    const res = await apiLogin(email, password);
                    if (res?.user) { onLogin(res.user); return; }
                } catch (apiErr) {
                    if (!apiErr.message?.includes('Failed to fetch') && !apiErr.message?.includes('NetworkError')) {
                        setError(apiErr.message);
                        return;
                    }
                    console.warn('API login offline, checking localStorage:', apiErr.message);
                }
                // Local login: check hardcoded admin
                if (email === 'classicgenius@dev' && password === 'classicgeniusdev') {
                    onLogin({
                        id: 'dev-admin-001',
                        name: 'AgroLink Admin',
                        email: 'classicgenius@dev',
                        role: 'admin',
                        plan: 'business',
                        avatar: `https://ui-avatars.com/api/?name=Dev+Admin&background=1a472a&color=fff`,
                    });
                    return;
                }
                // Check localStorage users
                const savedUsers = JSON.parse(localStorage.getItem('agrolink_users') || '[]');
                const found = savedUsers.find(u => u.email === email.toLowerCase().trim());
                if (!found) {
                    setError('No account found with this email. Please sign up.');
                    return;
                }
                onLogin(found);
                return;
            }
        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="auth-page">
            <div className="auth-bg">
                <div className="auth-blob auth-blob--1"></div>
                <div className="auth-blob auth-blob--2"></div>
            </div>

            <div className="auth-container">
                <div className="auth-card fade-in">
                    <div className="auth-header">
                        <div className="auth-logo">
                            <Leaf size={32} />
                        </div>
                        <h1>{isLogin ? 'Welcome Back' : 'Join AgroLink'}</h1>
                        <p>{isLogin ? 'Enter your details to access your dashboard' : 'Start your journey towards smarter farming'}</p>
                    </div>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        {error && <div className="auth-error-message" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', marginBottom: '16px', display: 'flex', alignItems: 'center', fontWeight: '500', border: '1px solid rgba(239, 68, 68, 0.2)' }}>{error}</div>}
                        {!isLogin && (
                            <div className="form-group">
                                <label><User size={18} /> Full Name</label>
                                <input 
                                    type="text" 
                                    placeholder="John Doe" 
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required 
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <label><Mail size={18} /> Email Address</label>
                            <input 
                                type="email" 
                                placeholder="john@example.com" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required 
                            />
                        </div>

                        <div className="form-group">
                            <label><Lock size={18} /> Password</label>
                            <div className="password-input-wrapper">
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="••••••••" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required 
                                />
                                <button 
                                    type="button" 
                                    className="password-toggle-btn"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {!isLogin && (
                            <div className="form-group">
                                <label><User size={18} /> Select Role</label>
                                <select
                                    className="auth-select"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    required
                                >
                                    <option value="buyer">Buyer</option>
                                    <option value="farmer">Farmer</option>
                                </select>
                            </div>
                        )}

                        {isLogin && (
                            <div className="auth-form__options">
                                <label className="remember-me">
                                    <input type="checkbox" /> Remember me
                                </label>
                                <button type="button" className="forgot-password">Forgot password?</button>
                            </div>
                        )}

                        <button type="submit" className="btn-auth" disabled={loading}>
                            {loading ? (
                                <span className="loader"></span>
                            ) : (
                                <>
                                    {isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>


                    <div className="auth-toggle-link">
                        {isLogin ? (
                            <p>Don't have an account? <button type="button" onClick={() => toggleView(false)}>Sign up</button></p>
                        ) : (
                            <p>Already have an account? <button type="button" onClick={() => toggleView(true)}>Sign in</button></p>
                        )}
                    </div>
                </div>
            </div>

            <footer className="auth-footer">
                <p>© 2026 AgroLink. Safe & Secure Agriculture Portal.</p>
            </footer>
        </div>
    );
}
