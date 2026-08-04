import { useState } from 'react'
import { MapPin, Phone, Mail, Edit3, Check, Star, Package, LogOut, ShoppingBag, CalendarDays, X, AlertTriangle, Camera, Upload, Crown, Zap, Sparkles, Shield, ArrowRight, CreditCard, ShieldCheck, CheckCircle2, User, Building } from 'lucide-react'
import './ProfilePage.css'

const defaultStats = {
    rating: 5.0,
    reviews: 12,
    products: 4,
    ordersPlaced: 8,
    farmName: 'AgroLink Fresh Organic Farm',
    location: 'Accra, Greater Accra',
    phone: '+233 24 555 0192',
    bio: 'Dedicated to cultivating high-quality organic produce with sustainable farming practices across Ghana.'
}

const PREMIUM_AVATARS = [
    { id: 1, url: 'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=400&q=80', label: 'Farmer Male' },
    { id: 2, url: 'https://images.unsplash.com/photo-1594744803329-a584af1cae24?w=400&q=80', label: 'Farmer Female' },
    { id: 3, url: 'https://images.unsplash.com/photo-1622919846923-d39226c367f0?w=400&q=80', label: 'Agro Specialist' },
    { id: 4, url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80', label: 'Modern Buyer' },
    { id: 5, url: 'https://images.unsplash.com/photo-1554151228-14d9def656ec?w=400&q=80', label: 'Specialist' },
    { id: 6, url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80', label: 'Manager' },
]

function LogoutModal({ onConfirm, onCancel }) {
    return (
        <div className="logout-overlay" onClick={onCancel}>
            <div className="logout-modal" onClick={e => e.stopPropagation()}>
                <button className="logout-modal__close" onClick={onCancel} aria-label="Close">
                    <X size={18} />
                </button>
                <div className="logout-modal__icon">
                    <AlertTriangle size={32} />
                </div>
                <h3 className="logout-modal__title">Sign Out?</h3>
                <p className="logout-modal__text">
                    You will be returned to the landing page. Your profile settings will remain saved.
                </p>
                <div className="logout-modal__actions">
                    <button className="logout-modal__cancel" onClick={onCancel}>Cancel</button>
                    <button className="logout-modal__confirm" onClick={onConfirm}>
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>
            </div>
        </div>
    )
}

export default function ProfilePage({ onLogout, userRole = 'farmer', currentUser, onUpdateProfile, isDarkMode, onToggleDarkMode, setActivePage }) {
    const isBuyer = userRole === 'buyer'
    const plan = currentUser?.plan || 'free';
    const isStarter = plan === 'starter';
    const isBusiness = plan === 'business';
    const isPremium = isStarter || isBusiness;

    const dynamicData = {
        name: currentUser?.name || 'Guest User',
        role: currentUser?.role ? currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1) : 'Farmer',
        farmName: currentUser?.farmName || defaultStats.farmName,
        location: currentUser?.location || defaultStats.location,
        phone: currentUser?.phone || defaultStats.phone,
        email: currentUser?.email || 'user@agrolink.gh',
        bio: currentUser?.bio || defaultStats.bio,
        rating: defaultStats.rating,
        reviews: defaultStats.reviews,
        products: defaultStats.products,
        ordersPlaced: defaultStats.ordersPlaced,
        joined: currentUser?.joined || 'Jan 2026',
        avatar: currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'User')}&background=random`,
        verified: currentUser?.verified || false,
        organicCertified: currentUser?.organicCertified || false
    }

    const [profile, setProfile] = useState(dynamicData)
    const [editing, setEditing] = useState(false)
    const [editValues, setEditValues] = useState({ ...dynamicData })
    const [showLogoutModal, setShowLogoutModal] = useState(false)
    const [showAvatarModal, setShowAvatarModal] = useState(false)
    const [saveSuccess, setSaveSuccess] = useState(false)

    const resizeImage = (base64Str) => {
        return new Promise((resolve) => {
            const img = new Image()
            img.src = base64Str
            img.onload = () => {
                const canvas = document.createElement('canvas')
                let width = img.width
                let height = img.height
                const max_size = 400
                
                if (width > height) {
                    if (width > max_size) {
                        height *= max_size / width
                        width = max_size
                    }
                } else {
                    if (height > max_size) {
                        width *= max_size / height
                        height = max_size
                    }
                }
                
                canvas.width = width
                canvas.height = height
                const ctx = canvas.getContext('2d')
                ctx.drawImage(img, 0, 0, width, height)
                resolve(canvas.toDataURL('image/jpeg', 0.7))
            }
        })
    }

    const handleFileUpload = (e) => {
        const file = e.target.files[0]
        if (!file) return

        const reader = new FileReader()
        reader.onloadend = async () => {
            const base64String = reader.result
            const compressed = await resizeImage(base64String)
            
            setEditValues(p => ({ ...p, avatar: compressed }))
            setProfile(p => ({ ...p, avatar: compressed }))
            onUpdateProfile?.({ ...currentUser, avatar: compressed })
            setShowAvatarModal(false)
        }
        reader.readAsDataURL(file)
    }

    const handleSave = () => {
        setProfile({ ...editValues })
        setEditing(false)
        onUpdateProfile?.({
          name: editValues.name,
          email: editValues.email,
          phone: editValues.phone,
          location: editValues.location,
          farmName: editValues.farmName,
          bio: editValues.bio,
          avatar: editValues.avatar
        })
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
    }

    const handleLogout = () => {
        setShowLogoutModal(false)
        onLogout?.()
    }

    return (
        <div className="profile-page fade-in">
            {/* Header Banner & Hero Card */}
            <header className="profile-hero-card">
                <div className="profile-hero-bg" />
                <div className="profile-hero-content">
                    <div className="profile-avatar-wrap">
                        <img src={profile.avatar} alt={profile.name} className="profile-avatar" />
                        {profile.verified && <div className="profile-verified-badge" title="Verified Farm">✓</div>}
                        <button 
                            className="avatar-edit-overlay"
                            onClick={() => setShowAvatarModal(true)}
                            title="Change Photo"
                        >
                            <Camera size={20} />
                        </button>
                    </div>

                    <div className="profile-identity-block">
                        <div className="profile-name-row">
                            {editing ? (
                                <input 
                                    className="profile-name-input"
                                    value={editValues.name}
                                    onChange={e => setEditValues(p => ({ ...p, name: e.target.value }))}
                                />
                            ) : (
                                <h2 className="profile-name">{profile.name}</h2>
                            )}

                            {/* Subscription Pill */}
                            <span className={`profile-plan-pill plan-${plan}`}>
                                {isBusiness ? <Crown size={12} /> : isStarter ? <Zap size={12} /> : <User size={12} />}
                                {plan.toUpperCase()} TIER
                            </span>
                        </div>

                        <p className="profile-role">{profile.role} · <span className="profile-email-text">{profile.email}</span></p>

                        <div className="profile-badges-row">
                            {profile.verified && (
                                <span className="pbadge verified"><ShieldCheck size={12} /> Verified Producer</span>
                            )}
                            {profile.organicCertified && (
                                <span className="pbadge organic"><CheckCircle2 size={12} /> Organic Certified</span>
                            )}
                        </div>
                    </div>

                    {/* Stats Metric Strip */}
                    <div className="profile-stats-strip">
                        {isBuyer ? (
                            <>
                                <div className="profile-stat-box">
                                    <ShoppingBag size={16} className="stat-icon" />
                                    <div>
                                        <span className="stat-val">{profile.ordersPlaced}</span>
                                        <span className="stat-lbl">Orders Placed</span>
                                    </div>
                                </div>
                                <div className="stat-sep" />
                                <div className="profile-stat-box">
                                    <CalendarDays size={16} className="stat-icon" />
                                    <div>
                                        <span className="stat-val">{profile.joined}</span>
                                        <span className="stat-lbl">Member Since</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="profile-stat-box">
                                    <Star size={16} fill="#F59E0B" stroke="#F59E0B" className="stat-icon" />
                                    <div>
                                        <span className="stat-val">{profile.rating}</span>
                                        <span className="stat-lbl">Rating ({profile.reviews} reviews)</span>
                                    </div>
                                </div>
                                <div className="stat-sep" />
                                <div className="profile-stat-box">
                                    <Package size={16} className="stat-icon" />
                                    <div>
                                        <span className="stat-val">{profile.products}</span>
                                        <span className="stat-lbl">Active Listings</span>
                                    </div>
                                </div>
                                <div className="stat-sep" />
                                <div className="profile-stat-box">
                                    <CalendarDays size={16} className="stat-icon" />
                                    <div>
                                        <span className="stat-val">{profile.joined}</span>
                                        <span className="stat-lbl">Joined Platform</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {saveSuccess && (
                <div className="save-success-banner fade-in">
                    <CheckCircle2 size={18} /> Profile details saved successfully!
                </div>
            )}

            <div className="profile-body-grid">
                
                {/* ═══ SUBSCRIPTION PLAN CARD ═══ */}
                <div className={`profile-card subscription-card plan-${plan}`}>
                    <div className="profile-card__header">
                        <div className="card-title-icon-wrap">
                            {isBusiness ? <Crown size={22} className="crown-gold" /> : isStarter ? <Zap size={22} className="zap-green" /> : <Sparkles size={22} className="spark-blue" />}
                            <div>
                                <h3 className="profile-card__title">Membership & Subscription</h3>
                                <p className="card-sub-desc">Your current AgroLink platform plan and billing status.</p>
                            </div>
                        </div>
                        <span className={`plan-badge-status ${plan}`}>
                            {plan === 'free' ? 'FREE TIER' : `${plan.toUpperCase()} SUBSCRIBER`}
                        </span>
                    </div>

                    <div className="subscription-card-body">
                        {plan === 'free' ? (
                            <div className="free-plan-info-box">
                                <div className="free-plan-desc">
                                    <p>You are currently utilizing the <strong>Basic Free Plan</strong>. Upgrade to unlock customizable farm shop banners, live commodity price alerts, advanced SVG sales analytics, and promoted marketplace listings.</p>
                                </div>
                                <button
                                    className="btn-upgrade-membership"
                                    onClick={() => setActivePage?.('premium')}
                                >
                                    <Sparkles size={16} /> Upgrade to Premium Plan <ArrowRight size={16} />
                                </button>
                            </div>
                        ) : (
                            <div className="active-plan-details-grid">
                                <div className="plan-meta-item">
                                    <span className="lbl">Active Tier</span>
                                    <strong className="val">{isBusiness ? 'Business Enterprise' : 'Starter Growth'}</strong>
                                </div>
                                <div className="plan-meta-item">
                                    <span className="lbl">Billing Rate</span>
                                    <strong className="val">GH₵ {isBusiness ? '299.00' : '99.00'} / month</strong>
                                </div>
                                <div className="plan-meta-item">
                                    <span className="lbl">Joined Premium</span>
                                    <strong className="val">{currentUser?.joinedPremiumDate || 'Recently'}</strong>
                                </div>
                                <div className="plan-meta-item">
                                    <span className="lbl">Next Renewal</span>
                                    <strong className="val">{currentUser?.premiumRenewalDate || '30 days from now'}</strong>
                                </div>
                                {currentUser?.lastTransactionRef && (
                                    <div className="plan-meta-item full-width">
                                        <span className="lbl">Paystack Transaction Ref</span>
                                        <strong className="val ref-code">{currentUser.lastTransactionRef}</strong>
                                    </div>
                                )}
                                <div className="plan-actions-row">
                                    <button
                                        className="btn-manage-membership"
                                        onClick={() => setActivePage?.('premium')}
                                    >
                                        <Crown size={16} /> Manage Subscription & Analytics
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ═══ PERSONAL & FARM DETAILS CARD ═══ */}
                <div className="profile-card">
                    <div className="profile-card__header">
                        <div>
                            <h3 className="profile-card__title">
                                {isBuyer ? 'Account & Contact Details' : 'Farm & Business Profile'}
                            </h3>
                            <p className="card-sub-desc">Update your personal contact details and farm identity.</p>
                        </div>
                        <button
                            className={`profile-edit-btn ${editing ? 'editing' : ''}`}
                            onClick={editing ? handleSave : () => setEditing(true)}
                        >
                            {editing ? <><Check size={16} /> Save Changes</> : <><Edit3 size={16} /> Edit Profile</>}
                        </button>
                    </div>

                    <div className="profile-fields-grid">
                        <div className="profile-field">
                            <label className="profile-field__label"><User size={14} /> Full Name</label>
                            {editing ? (
                                <input
                                    className="input-field"
                                    value={editValues.name}
                                    onChange={e => setEditValues(p => ({ ...p, name: e.target.value }))}
                                />
                            ) : (
                                <p className="profile-field__value">{profile.name}</p>
                            )}
                        </div>

                        <div className="profile-field">
                            <label className="profile-field__label"><Mail size={14} /> Email Address</label>
                            {editing ? (
                                <input
                                    className="input-field"
                                    value={editValues.email}
                                    onChange={e => setEditValues(p => ({ ...p, email: e.target.value }))}
                                />
                            ) : (
                                <p className="profile-field__value">{profile.email}</p>
                            )}
                        </div>

                        {!isBuyer && (
                            <div className="profile-field">
                                <label className="profile-field__label"><Building size={14} /> Farm / Business Name</label>
                                {editing ? (
                                    <input
                                        className="input-field"
                                        value={editValues.farmName}
                                        onChange={e => setEditValues(p => ({ ...p, farmName: e.target.value }))}
                                    />
                                ) : (
                                    <p className="profile-field__value">{profile.farmName}</p>
                                )}
                            </div>
                        )}

                        <div className="profile-field">
                            <label className="profile-field__label"><Phone size={14} /> Phone Number</label>
                            {editing ? (
                                <input
                                    className="input-field"
                                    value={editValues.phone}
                                    onChange={e => setEditValues(p => ({ ...p, phone: e.target.value }))}
                                />
                            ) : (
                                <p className="profile-field__value">{profile.phone}</p>
                            )}
                        </div>

                        <div className="profile-field">
                            <label className="profile-field__label"><MapPin size={14} /> Location</label>
                            {editing ? (
                                <input
                                    className="input-field"
                                    value={editValues.location}
                                    onChange={e => setEditValues(p => ({ ...p, location: e.target.value }))}
                                />
                            ) : (
                                <p className="profile-field__value">{profile.location}</p>
                            )}
                        </div>

                        <div className="profile-field full-width">
                            <label className="profile-field__label">Store Bio / Description</label>
                            {editing ? (
                                <textarea
                                    className="textarea-field"
                                    rows="3"
                                    value={editValues.bio}
                                    onChange={e => setEditValues(p => ({ ...p, bio: e.target.value }))}
                                />
                            ) : (
                                <p className="profile-field__value bio-text">{profile.bio}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* ═══ APP PREFERENCES CARD ═══ */}
                <div className="profile-card">
                    <div className="profile-card__header">
                        <h3 className="profile-card__title">App Preferences & Security</h3>
                    </div>
                    <div className="profile-fields">
                        <div className="toggle-field">
                            <div className="toggle-info">
                                <span className="toggle-title">Dark Mode Theme</span>
                                <span className="toggle-desc">Switch between light and dark visual themes.</span>
                            </div>
                            <label className="toggle-switch">
                                <input 
                                    type="checkbox" 
                                    checked={isDarkMode} 
                                    onChange={onToggleDarkMode} 
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* ═══ SIGN OUT CARD ═══ */}
                <div className="profile-card profile-card--logout">
                    <div className="profile-fields">
                        <button
                            className="profile-logout-btn"
                            onClick={() => setShowLogoutModal(true)}
                        >
                            <LogOut size={18} />
                            Sign Out of AgroLink
                        </button>
                    </div>
                </div>

            </div>

            {/* Avatar Selection Modal */}
            {showAvatarModal && (
                <div className="avatar-modal-overlay" onClick={() => setShowAvatarModal(false)}>
                    <div className="avatar-modal" onClick={e => e.stopPropagation()}>
                        <div className="avatar-modal__header">
                            <h3>Choose Profile Photo</h3>
                            <button onClick={() => setShowAvatarModal(false)}><X size={20} /></button>
                        </div>
                        <div className="avatar-modal__grid">
                            <div className="avatar-upload-card">
                                <label className="avatar-upload-label">
                                    <Upload size={24} />
                                    <span>Upload Photo</span>
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="hidden-file-input" 
                                        onChange={handleFileUpload}
                                    />
                                </label>
                            </div>
                            {PREMIUM_AVATARS.map(ava => (
                                <button 
                                    key={ava.id} 
                                    className={`avatar-choice ${editValues.avatar === ava.url ? 'avatar-choice--active' : ''}`}
                                    onClick={() => {
                                        setEditValues(p => ({ ...p, avatar: ava.url }))
                                        setProfile(p => ({ ...p, avatar: ava.url }))
                                        onUpdateProfile?.({ ...currentUser, avatar: ava.url })
                                        setShowAvatarModal(false)
                                    }}
                                >
                                    <img src={ava.url} alt={ava.label} />
                                    <span>{ava.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <LogoutModal
                    onConfirm={handleLogout}
                    onCancel={() => setShowLogoutModal(false)}
                />
            )}
        </div>
    )
}
