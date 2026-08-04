import React from 'react';
import { Leaf, ArrowRight, ShoppingBag, Sprout, Users, ShieldCheck, Droplets, Phone, Mail, User, Cpu } from 'lucide-react';
import './LandingPage.css';

export default function LandingPage({ onLoginClick, onSignupClick }) {
    

    return (
        <div className="landing-page">
            <nav className="landing-nav fade-in">
                <div className="nav-links nav-links-left">
                    {/* Intentionally left blank for aesthetic balance if needed, or can be removed completely */}
                </div>

                <div className="landing-nav__logo">
                    <div className="logo-icon-market">
                        <img src="/logo-placeholder.png" alt="AgroLink Logo" style={{ display: 'none' }} />
                        <div className="logo-custom">
                            <Leaf size={28} />
                        </div>
                    </div>
                </div>

                <div className="nav-links nav-links-right">
                    {/* Buttons moved to hero section */}
                </div>
            </nav>

            <main className="landing-hero nav-padding">
                <div className="container hero-layout-left">
                    <h1 className="hero-title-market" style={{ marginBottom: '30px' }}>
                        Bringing Local Farmers <br />
                        Right to your Table
                    </h1>
                    <div className="hero-actions-left">
                        <button className="btn-market-primary" onClick={onSignupClick}>
                            Sign Up
                        </button>
                        <button className="btn-market-secondary" onClick={onLoginClick}>
                            Login
                        </button>
                    </div>
                </div>
            </main>

            <section className="about-section">
                <div className="container about-grid">
                    <div className="about-content fade-in">
                        <div className="about-label">OUR MISSION</div>
                        <h2 className="about-title">Empowering Ghana's Agricultural Heartbeat</h2>
                        <p className="about-text">
                            AgroLink is more than just a marketplace; it's a digital revolution for the Ghanaian farmer. 
                            We bridge the gap between rural abundance and urban demand by connecting local producers 
                            directly with buyers, processors, and exporters.
                        </p>
                        <p className="about-text">
                            By leveraging real-time monitoring and equipment telemetry alongside market data, we ensure
                            that every stakeholder in the agricultural value chain—from the smallholder farmer to the
                            large-scale distributor—has the tools they need to thrive in a global economy.
                        </p>
                        <div className="about-stats">
                            <div className="about-stat">
                                <span className="about-stat-num">50k+</span>
                                <span className="about-stat-label">Verified Farmers</span>
                            </div>
                            <div className="about-stat">
                                <span className="about-stat-num">200+</span>
                                <span className="about-stat-label">Active Markets</span>
                            </div>
                        </div>
                    </div>
                    <div className="about-visual fade-in" style={{ animationDelay: '0.2s' }}>
                        <div className="about-image-wrapper">
                            <img src="/farming_panorama_ghana.png" alt="Ghanaian Farming" className="about-image" />
                            <div className="about-image-overlay"></div>
                            <div className="about-floating-badge">
                                <Leaf size={20} />
                                <span>100% Local</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="learn-more">
                <div className="container">
                    <div className="section-header fade-in">
                        <h2 className="section-title">Why Choose AgroLink?</h2>
                        <p className="section-subtitle">Everything you need to thrive in modern agriculture</p>
                    </div>

                    <div className="features-grid fade-in" style={{ animationDelay: '0.3s' }}>
                        <div className="feature-card">
                            <div className="feature-card__icon feature-card__icon--green">
                                <ShoppingBag size={24} />
                            </div>
                            <h3>Direct Market</h3>
                            <p>Connect directly with buyers and get the best prices for your produce without middlemen.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-card__icon feature-card__icon--blue">
                                <Cpu size={24} />
                            </div>
                            <h3>Machinery Monitor</h3>
                            <p>Track real-time health, fuel levels, and operation telemetry of your farm fleet.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-card__icon feature-card__icon--orange">
                                <Users size={24} />
                            </div>
                            <h3>Eco-System</h3>
                            <p>Join a thriving community of verified farmers and suppliers across Ghana.</p>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="landing-footer fade-in" style={{ animationDelay: '0.4s' }}>
                <div className="container">
                    <div className="footer-content">
                        <div className="footer-info">
                            <div className="logo-icon logo-icon--small">
                                <Leaf size={18} />
                            </div>
                            <p>© 2026 AgroLink. Cultivating the future of Ghana.</p>
                        </div>
                        <div className="footer-badges">
                            <div className="footer-badge">
                                <ShieldCheck size={16} /> Verified Platform
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div >
    );
}
