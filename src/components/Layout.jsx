import { Home, ShoppingBag, Tag, User, Leaf, Menu, X, Star, Shield } from 'lucide-react'
import { useState } from 'react'
import './Layout.css'

const allNavItems = [
    { id: 'buyerhome', label: 'Home', Icon: Home, roles: ['buyer'] },
    { id: 'home', label: 'Home', Icon: Home, roles: ['farmer'] },
    { id: 'market', label: 'Market', Icon: ShoppingBag, roles: ['buyer', 'farmer', 'admin'] },
    { id: 'myshop', label: 'My Shop', Icon: Tag, roles: ['farmer'] },
    { id: 'premium', label: 'Premium', Icon: Star, roles: ['farmer'] },
    { id: 'admin', label: 'Admin Panel', Icon: Shield, roles: ['admin'] },
    { id: 'profile', label: 'Profile', Icon: User, roles: ['buyer', 'farmer', 'admin'] },
]

export default function Layout({ children, activePage, setActivePage, userRole, currentUser }) {
    const [sidebarOpen, setSidebarOpen] = useState(true)

    const isLanding = activePage === 'landing' || activePage === 'auth';

    const navItems = allNavItems.filter(item => item.roles.includes(userRole));

    const roleLabels = {
        buyer: 'Market Buyer',
        farmer: 'Verified Farmer',
        admin: 'System Administrator',
    };

    return (
        <div className={`app-shell ${isLanding ? 'app-shell--landing' : ''}`}>
            {/* ── SIDEBAR (desktop) ── */}
            {!isLanding && (
                <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : 'sidebar--collapsed'}`}>
                    <div className="sidebar__logo">
                        <div className="sidebar__logo-icon">
                            <Leaf size={22} />
                        </div>
                        {sidebarOpen && <span className="sidebar__logo-text">AgroLink</span>}
                    </div>

                    <button
                        className="sidebar__toggle"
                        onClick={() => setSidebarOpen(p => !p)}
                        aria-label="Toggle sidebar"
                    >
                        {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
                    </button>

                    <nav className="sidebar__nav">
                        {navItems.map((item) => {
                            const { id, label, Icon } = item;
                            return (
                                <button
                                    key={id}
                                    className={`sidebar__item ${activePage === id ? 'sidebar__item--active' : ''}`}
                                    onClick={() => setActivePage(id)}
                                    title={!sidebarOpen ? label : undefined}
                                >
                                    <Icon size={20} />
                                    {sidebarOpen && <span>{label}</span>}
                                    {!sidebarOpen && activePage === id && <div className="sidebar__active-dot" />}
                                </button>
                            );
                        })}
                    </nav>

                    {sidebarOpen && (
                        <div className="sidebar__footer">
                            <button
                                className="sidebar__user sidebar__user--clickable"
                                onClick={() => setActivePage('profile')}
                                title="Go to Profile"
                            >
                                <img
                                    src={currentUser?.avatar || `https://ui-avatars.com/api/?name=Guest&background=random`}
                                    alt="User avatar"
                                    className="sidebar__avatar"
                                />
                                <div>
                                    <p className="sidebar__user-name">{currentUser?.name || 'Guest User'}</p>
                                    <p className="sidebar__user-role">{currentUser?.role ? currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1) : roleLabels[userRole]}</p>
                                </div>
                            </button>
                        </div>
                    )}
                </aside>
            )}

            {/* ── MAIN CONTENT ── */}
            <div className={`main-area ${isLanding ? 'main-area--full' : ''}`}>
                <main key={activePage} className={`main-content scroll-y ${!isLanding ? 'fade-in' : ''}`}>
                    {children}
                </main>
            </div>

            {/* ── BOTTOM NAV (mobile) ── */}
            {!isLanding && (
                <nav className="bottom-nav">
                        {navItems.map((item) => {
                            const { id, label, Icon } = item;
                            return (
                                <button
                                    key={id}
                                    className={`bottom-nav__item ${activePage === id ? 'bottom-nav__item--active' : ''}`}
                                    onClick={() => setActivePage(id)}
                                    aria-label={label}
                                >
                                    <Icon size={20} />
                                    <span>{label}</span>
                                </button>
                            );
                        })}
                </nav>
            )}
        </div>
    )
}
