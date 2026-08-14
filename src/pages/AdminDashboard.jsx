import React, { useState, useMemo } from 'react';
import { Shield, Users, ShoppingCart, Award, Sparkles, AlertCircle, Ban, ArrowUpRight, DollarSign, Calendar, Trash2, Search, Check, X, Package, Crown, ChevronDown, ChevronRight, Star } from 'lucide-react';
import { api } from '../utils/api';
import './AdminDashboard.css';

// Developer-only credential (same as AuthPage gate — double-check)
const ADMIN_EMAIL = 'classicgenius@dev';

export default function AdminDashboard({
  currentUser,
  users = [],
  setUsers,
  products = [],
  setProducts,
  orders = [],
  bulkOrders = [],
  setBulkOrders,
  setActivePage,
  onDeleteUser,
  onUpdateProduct,
  onDeleteProduct
}) {
  // Guard: allow developer admin or any user with admin role to access this dashboard
  if (currentUser?.role !== 'admin' && currentUser?.email !== ADMIN_EMAIL) {
    return (
      <div className="admin-dashboard-container fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
        <Shield size={48} style={{ color: 'var(--danger, #ef4444)' }} />
        <h2 style={{ color: 'var(--danger, #ef4444)' }}>Access Denied</h2>
        <p style={{ color: 'var(--text-muted)' }}>This panel is restricted to system administrators only.</p>
        <button className="btn-approve" onClick={() => setActivePage?.('landing')}>← Return Home</button>
      </div>
    );
  }

  const [activeSubTab, setActiveSubTab] = useState('stats');
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [searchProductQuery, setSearchProductQuery] = useState('');
  const [accountTypeFilter, setAccountTypeFilter] = useState('all'); // 'all', 'registered', 'seed'
  const [featuredFilter, setFeaturedFilter] = useState('all'); // 'all', 'featured', 'standard'
  // Which user row is expanded in "All Users" tab
  const [expandedUserEmail, setExpandedUserEmail] = useState(null);

  // Helper to check if a user is an actual registered user vs demo seed data
  const isRegisteredUser = (user) => {
    if (!user || !user.email) return false;
    const email = user.email.toLowerCase().trim();
    const seedEmails = new Set([
      'classicgenius@dev',
      'james.asante@agrolink.gh',
      'farmer.brent@agrolink.gh',
      'kwame.farms@accra.gh',
      'accra.fresh@market.gh',
      'retail@buyers.gh'
    ]);
    if (seedEmails.has(email)) return false;
    return true;
  };

  // --- Metrics ---
  const registeredUsersCount = useMemo(() => users.filter(isRegisteredUser).length, [users]);
  const farmersCount = users.filter(u => u.role === 'farmer').length;
  const buyersCount = users.filter(u => u.role === 'buyer').length;
  const starterCount = users.filter(u => u.plan === 'starter').length;
  const businessCount = users.filter(u => u.plan === 'business').length;
  const totalSubscribers = starterCount + businessCount;
  const monthlyPremiumRevenue = (starterCount * 99) + (businessCount * 299);

  const pendingVerifications = users.filter(u => u.role === 'farmer' && !u.verified);
  const pendingOrganics = users.filter(u => u.role === 'farmer' && !u.organicCertified);

  // --- Filtered lists ---
  const filteredUsersList = useMemo(() =>
    users.filter(u => {
      const matchesSearch = u.name?.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchUserQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (accountTypeFilter === 'registered') return isRegisteredUser(u);
      if (accountTypeFilter === 'seed') return !isRegisteredUser(u);
      return true;
    }), [users, searchUserQuery, accountTypeFilter]);

  const filteredProductsList = useMemo(() =>
    products.filter(p => {
      const matchesSearch = p.name?.toLowerCase().includes(searchProductQuery.toLowerCase()) ||
        p.farm?.toLowerCase().includes(searchProductQuery.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchProductQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (featuredFilter === 'featured') return !!p.featured;
      if (featuredFilter === 'standard') return !p.featured;
      return true;
    }), [products, searchProductQuery, featuredFilter]);

  // Premium users sorted by plan tier
  const premiumUsers = useMemo(() =>
    users
      .filter(u => u.plan === 'starter' || u.plan === 'business')
      .sort((a, b) => (b.plan === 'business' ? 1 : 0) - (a.plan === 'business' ? 1 : 0)),
    [users]
  );

  // Helper: get products per user
  const getUserProducts = (email) => {
    if (!email) return [];
    const targetEmail = String(email).toLowerCase().trim();
    if (targetEmail === 'classicgenius@dev') return products;
    return products.filter(p => {
      if (!p) return false;
      const owner = String(p.ownerEmail || '').toLowerCase().trim();
      if (owner === targetEmail) return true;
      if (targetEmail === 'james.asante@agrolink.gh' && !owner) return true;
      return false;
    });
  };

  // --- Action Handlers ---
  const handleApproveVerification = (userEmail) => {
    const target = users.find(u => u.email === userEmail);
    const updated = users.map(u => u.email === userEmail ? { ...u, verified: true } : u);
    setUsers(updated);
    if (target?.id) {
      api.patch(`/users/${target.id}`, { verified: true }).catch(() => {});
    }
    if (currentUser?.email === userEmail) {
      const logged = JSON.parse(localStorage.getItem('agrolink_logged_user') || '{}');
      logged.verified = true;
      localStorage.setItem('agrolink_logged_user', JSON.stringify(logged));
    }
  };

  const handleApproveOrganic = (userEmail) => {
    const target = users.find(u => u.email === userEmail);
    const updated = users.map(u => u.email === userEmail ? { ...u, organicCertified: true } : u);
    setUsers(updated);
    if (target?.id) {
      api.patch(`/users/${target.id}`, { organicCertified: true }).catch(() => {});
    }
    if (currentUser?.email === userEmail) {
      const logged = JSON.parse(localStorage.getItem('agrolink_logged_user') || '{}');
      logged.organicCertified = true;
      localStorage.setItem('agrolink_logged_user', JSON.stringify(logged));
    }
  };

  const handleModifyPlan = (userEmail, targetPlan) => {
    const target = users.find(u => u.email === userEmail);
    const updated = users.map(u => u.email === userEmail ? {
      ...u,
      plan: targetPlan,
      joinedPremiumDate: targetPlan !== 'free' ? new Date().toLocaleDateString() : null,
      premiumRenewalDate: targetPlan !== 'free' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString() : null
    } : u);
    setUsers(updated);
    if (target?.id) {
      api.patch(`/users/${target.id}`, { plan: targetPlan }).catch(() => {});
    }
    if (currentUser?.email === userEmail) {
      const logged = JSON.parse(localStorage.getItem('agrolink_logged_user') || '{}');
      logged.plan = targetPlan;
      localStorage.setItem('agrolink_logged_user', JSON.stringify(logged));
      window.location.reload();
    }
  };

  const handleToggleSuspend = (userEmail, currentStatus) => {
    const target = users.find(u => u.email === userEmail);
    const updatedStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    const updated = users.map(u => u.email === userEmail ? { ...u, status: updatedStatus } : u);
    setUsers(updated);
    if (target?.id) {
      api.patch(`/users/${target.id}`, { status: updatedStatus }).catch(() => {});
    }
  };

  const handleToggleGlobalFeatured = (productId) => {
    const target = products.find(p => String(p.id) === String(productId));
    if (!target) return;
    const updatedProduct = { ...target, featured: !target.featured };
    if (onUpdateProduct) {
      onUpdateProduct(updatedProduct);
    } else {
      const updated = products.map(p => String(p.id) === String(productId) ? updatedProduct : p);
      setProducts(updated);
    }
  };

  const handleDeleteUserAccount = (user) => {
    if (!user || user.role === 'admin' || user.email === ADMIN_EMAIL) {
      alert("Cannot delete primary administrator account.");
      return;
    }

    const userProds = getUserProducts(user.email);
    const confirmed = window.confirm(
      `⚠️ PERMANENT DELETE WARNING:\n\nAre you sure you want to delete user account "${user.name}" (${user.email}) and ALL ${userProds.length} of their listed products?\n\nThis action will immediately remove the account and all associated products from the platform.`
    );

    if (confirmed) {
      if (onDeleteUser) {
        onDeleteUser(user.email, user.id);
      } else {
        setUsers(prev => prev.filter(u => u.email !== user.email));
        setProducts(prev => prev.filter(p => p.ownerEmail !== user.email));
      }
    }
  };

  const paymentHistory = [
    { id: 'TXN-9011', email: 'james.asante@agrolink.gh', plan: 'Business Premium', amount: 'GH₵ 299.00', date: '2026-07-20', status: 'success' },
    { id: 'TXN-9012', email: 'farmer.brent@agrolink.gh', plan: 'Starter Growth', amount: 'GH₵ 99.00', date: '2026-07-19', status: 'success' },
    { id: 'TXN-9013', email: 'kwame.farms@accra.gh', plan: 'Starter Growth', amount: 'GH₵ 99.00', date: '2026-07-17', status: 'success' },
    { id: 'TXN-9014', email: 'abigail.fruits@volt.gh', plan: 'Business Premium', amount: 'GH₵ 299.00', date: '2026-07-15', status: 'success' }
  ];

  const PLAN_LABELS = { free: 'Free', starter: 'Starter', business: 'Business' };
  const PLAN_PRICE = { free: 0, starter: 99, business: 299 };

  return (
    <div className="admin-dashboard-container fade-in">
      {/* Header */}
      <header className="admin-header-strip">
        <div className="admin-welcome-block">
          <div className="admin-logo-badge"><Shield size={22} /></div>
          <div>
            <h2>AgroLink Administration Panel</h2>
            <p>Developer-only portal — platform statistics, user management, and subscriptions.</p>
          </div>
        </div>
        <div className="admin-header-dev-badge">
          <span>🔐 Developer Session</span>
          <span className="admin-dev-email">{currentUser?.email}</span>
        </div>
      </header>

      {/* Sub Tab Nav */}
      <nav className="admin-tabs-nav">
        {[
          { id: 'stats', icon: <ArrowUpRight size={15} />, label: 'Platform Overview' },
          { id: 'all_users', icon: <Users size={15} />, label: `All Users (${users.length})` },
          { id: 'premium', icon: <Crown size={15} />, label: `Premium (${premiumUsers.length})` },
          { id: 'verifications', icon: <Award size={15} />, label: `Badges (${pendingVerifications.length + pendingOrganics.length})` },
          { id: 'accounts', icon: <Users size={15} />, label: 'Accounts List' },
          { id: 'featured', icon: <Sparkles size={15} />, label: 'Featured Manager' },
          { id: 'payments', icon: <DollarSign size={15} />, label: 'Payments History' },
        ].map(tab => (
          <button
            key={tab.id}
            className={`admin-tab-btn ${activeSubTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveSubTab(tab.id)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </nav>

      <div className="admin-tab-body">

        {/* ═══ STATS OVERVIEW ═══ */}
        {activeSubTab === 'stats' && (
          <div className="admin-view-fade fade-in">
            <div className="admin-overview-grid-widgets">
              <div className="widget-admin">
                <span className="label">Monthly Recurring Revenue</span>
                <h3>GH₵ {monthlyPremiumRevenue.toLocaleString()}.00</h3>
                <span className="helper text-success"><DollarSign size={12} /> Active subscriptions</span>
              </div>
              <div className="widget-admin">
                <span className="label">Premium Subscribers</span>
                <h3>{totalSubscribers} subscribers</h3>
                <span className="helper text-primary">{starterCount} Starter · {businessCount} Business</span>
              </div>
              <div className="widget-admin">
                <span className="label">Registered Accounts</span>
                <h3>{users.length} users</h3>
                <span className="helper text-primary">{registeredUsersCount} Actual Registered · {farmersCount} Farmers</span>
              </div>
              <div className="widget-admin">
                <span className="label">Platform Listings</span>
                <h3>{products.length} products</h3>
                <span className="helper text-success">{products.filter(p => p.featured).length} Promoted / Featured</span>
              </div>
            </div>

            <div className="admin-split-panels">
              <div className="admin-log-panel">
                <h4>Wholesale Bulk Inquiries Log</h4>
                <div className="logs-scroller">
                  {bulkOrders.length > 0 ? bulkOrders.map(b => (
                    <div key={b.id} className="log-line-item">
                      <span className="log-bullet">•</span>
                      <p>
                        Inquiry <strong>{b.id}</strong> by {b.buyerName} for {b.qty} {b.unit} of <strong>{b.productName}</strong>.
                        Status: <strong className={`status-${b.status}`}>{b.status}</strong>
                      </p>
                    </div>
                  )) : <p className="text-muted" style={{ padding: '12px' }}>No bulk inquiries yet.</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ ALL USERS — with expandable product list & delete actions ═══ */}
        {activeSubTab === 'all_users' && (
          <div className="admin-view-fade fade-in">
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div className="accounts-search-bar-row" style={{ flex: 1, minWidth: '240px', margin: 0 }}>
                <Search size={16} />
                <input
                  placeholder="Search users by name or email..."
                  value={searchUserQuery}
                  onChange={e => setSearchUserQuery(e.target.value)}
                />
              </div>

              {/* Account Type Filter */}
              <div style={{ display: 'flex', gap: '6px', background: 'var(--surface-white)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <button
                  style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', background: accountTypeFilter === 'all' ? 'var(--primary-green, #2E7D32)' : 'transparent', color: accountTypeFilter === 'all' ? '#fff' : 'var(--text-muted)' }}
                  onClick={() => setAccountTypeFilter('all')}
                >
                  All Users ({users.length})
                </button>
                <button
                  style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', background: accountTypeFilter === 'registered' ? 'var(--primary-green, #2E7D32)' : 'transparent', color: accountTypeFilter === 'registered' ? '#fff' : 'var(--text-muted)' }}
                  onClick={() => setAccountTypeFilter('registered')}
                >
                  Actual Registered ({registeredUsersCount})
                </button>
                <button
                  style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', background: accountTypeFilter === 'seed' ? 'var(--primary-green, #2E7D32)' : 'transparent', color: accountTypeFilter === 'seed' ? '#fff' : 'var(--text-muted)' }}
                  onClick={() => setAccountTypeFilter('seed')}
                >
                  Demo / Seed Data ({users.length - registeredUsersCount})
                </button>
              </div>
            </div>

            <div className="admin-all-users-list">
              {filteredUsersList.length === 0 && (
                <p className="text-muted" style={{ padding: '24px', textAlign: 'center' }}>No users found.</p>
              )}
              {filteredUsersList.map(u => {
                const userProds = getUserProducts(u.email);
                const isExpanded = expandedUserEmail === u.email;
                return (
                  <div key={u.email} className={`all-users-row-card ${isExpanded ? 'expanded' : ''}`}>
                    {/* Row header */}
                    <div
                      className="all-users-row-header"
                      onClick={() => setExpandedUserEmail(isExpanded ? null : u.email)}
                    >
                      <div className="all-users-avatar-col">
                        <img
                          src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'U')}&background=random`}
                          alt={u.name}
                          className="admin-user-row-avatar"
                          onError={e => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'U')}&background=3B82F6&color=fff`; }}
                        />
                      </div>
                      <div className="all-users-info-col">
                        <strong>{u.name}</strong>
                        <span className="text-muted">{u.email}</span>
                      </div>
                      <div className="all-users-badges-col">
                        <span className={`role-badge ${u.role}`}>{u.role?.toUpperCase()}</span>
                        <span className={`plan-badge ${u.plan || 'free'}`}>{PLAN_LABELS[u.plan || 'free']}</span>
                        {isRegisteredUser(u) && <span style={{ background: '#E0F2FE', color: '#0369A1', fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }}>ACTUAL REGISTERED</span>}
                        {u.verified && <span className="mini-verified-chip">✓ Verified</span>}
                        {u.organicCertified && <span className="mini-organic-chip">☘ Organic</span>}
                      </div>
                      <div className="all-users-stats-col">
                        <span><Package size={13} /> {userProds.length} product{userProds.length !== 1 ? 's' : ''}</span>
                        <span className={`status-badge-field ${u.status || 'active'}`}>{(u.status || 'active').toUpperCase()}</span>
                      </div>
                      <div className="all-users-expand-col" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {u.role !== 'admin' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteUserAccount(u); }}
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="Delete user account and all their products"
                          >
                            <Trash2 size={13} /> Delete User
                          </button>
                        )}
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </div>
                    </div>

                    {/* Expanded product section */}
                    {isExpanded && (
                      <div className="all-users-products-section">
                        {userProds.length === 0 ? (
                          <p className="empty-helper-text">This user has no products listed.</p>
                        ) : (
                          <div className="all-users-products-grid">
                            {userProds.map(p => (
                              <div key={p.id} className="all-users-product-mini-card">
                                <img
                                  src={p.img}
                                  alt={p.name}
                                  className="mini-product-img"
                                  onError={e => { e.target.onerror = null; e.target.src = 'https://placehold.co/80x80?text=No+img'; }}
                                />
                                <div className="mini-product-info">
                                  <strong>{p.name}</strong>
                                  <span className="text-muted">{p.category}</span>
                                  <span className="mini-price">GH₵ {parseFloat(p.price || 0).toFixed(2)} / {p.unit}</span>
                                  <span className="mini-stock">{p.stock}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
                                  <button
                                    className={`btn-promote-prod ${p.featured ? 'promoted' : ''}`}
                                    onClick={() => handleToggleGlobalFeatured(p.id)}
                                    style={{ fontSize: '11px', padding: '4px 8px' }}
                                  >
                                    <Sparkles size={11} /> {p.featured ? 'Featured' : 'Promote'}
                                  </button>
                                  <button
                                    onClick={() => onDeleteProduct?.(p.id)}
                                    style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                                  >
                                    <Trash2 size={11} /> Delete
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ PREMIUM USERS ═══ */}
        {activeSubTab === 'premium' && (
          <div className="admin-view-fade fade-in">
            <div className="premium-tab-header-bar">
              <h3><Crown size={18} /> Premium Subscribers</h3>
              <div className="premium-summary-chips">
                <span className="pchip starter">{starterCount} Starter · GH₵{starterCount * 99}/mo</span>
                <span className="pchip business">{businessCount} Business · GH₵{businessCount * 299}/mo</span>
                <span className="pchip total">Total MRR: GH₵{monthlyPremiumRevenue.toLocaleString()}</span>
              </div>
            </div>

            {premiumUsers.length === 0 ? (
              <div className="empty-listings" style={{ padding: '48px', textAlign: 'center' }}>
                <Crown size={40} style={{ opacity: 0.3 }} />
                <p>No premium subscribers yet.</p>
              </div>
            ) : (
              <div className="premium-users-cards-grid">
                {premiumUsers.map(u => {
                  const userProds = getUserProducts(u.email);
                  const planPrice = PLAN_PRICE[u.plan || 'free'];
                  return (
                    <div key={u.email} className={`premium-user-card plan-${u.plan}`}>
                      <div className="premium-card-top">
                        <img
                          src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'U')}&background=random`}
                          alt={u.name}
                          className="premium-user-avatar"
                          onError={e => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'U')}&background=3B82F6&color=fff`; }}
                        />
                        <div className="premium-user-identity">
                          <strong>{u.name}</strong>
                          <span className="text-muted">{u.email}</span>
                          <span className={`plan-badge ${u.plan}`}><Crown size={11} /> {PLAN_LABELS[u.plan]} Plan</span>
                        </div>
                        <div className="premium-plan-price-tag">
                          <span>GH₵{planPrice}</span>
                          <span className="per-month">/mo</span>
                        </div>
                      </div>

                      <div className="premium-card-stats">
                        <div className="pstat">
                          <span className="pstat-val">{userProds.length}</span>
                          <span className="pstat-label">Products</span>
                        </div>
                        <div className="pstat">
                          <span className="pstat-val">{userProds.filter(p => p.featured).length}</span>
                          <span className="pstat-label">Featured</span>
                        </div>
                        <div className="pstat">
                          <span className="pstat-val">{u.verified ? '✓' : '–'}</span>
                          <span className="pstat-label">Verified</span>
                        </div>
                        <div className="pstat">
                          <span className="pstat-val">{u.organicCertified ? '✓' : '–'}</span>
                          <span className="pstat-label">Organic</span>
                        </div>
                      </div>

                      <div className="premium-card-meta">
                        <span>Joined Premium: <strong>{u.joinedPremiumDate || 'N/A'}</strong></span>
                        <span>Renews: <strong>{u.premiumRenewalDate || 'N/A'}</strong></span>
                        {u.lastTransactionRef && (
                          <span>Paystack Ref: <strong style={{ fontFamily: 'monospace', color: '#0EA5E9' }}>{u.lastTransactionRef}</strong></span>
                        )}
                        <span>Status: <strong className={u.status === 'suspended' ? 'text-danger' : 'text-success'}>{(u.status || 'active').toUpperCase()}</strong></span>
                      </div>

                      {/* Subscriber's Uploaded Products & Promotion Control */}
                      <div className="premium-user-products-section">
                        <div className="psec-title">
                          <Package size={14} /> <span>Uploaded Products ({userProds.length})</span>
                        </div>
                        {userProds.length === 0 ? (
                          <p className="no-prods-text text-muted">No products uploaded yet.</p>
                        ) : (
                          <div className="premium-prods-list">
                            {userProds.map(p => (
                              <div key={p.id} className="premium-prod-row">
                                <img
                                  src={p.img}
                                  alt={p.name}
                                  className="premium-prod-thumb"
                                  onError={e => { e.target.onerror = null; e.target.src = 'https://placehold.co/60x60?text=Prod'; }}
                                />
                                <div className="premium-prod-details">
                                  <strong className="pprod-name">{p.name}</strong>
                                  <span className="premium-prod-sub">GH₵ {parseFloat(p.price || 0).toFixed(2)} / {p.unit} · {p.category}</span>
                                </div>
                                <button
                                  className={`btn-promote-prod ${p.featured ? 'promoted' : ''}`}
                                  onClick={() => handleToggleGlobalFeatured(p.id)}
                                  title={p.featured ? 'Remove from top Marketplace promotions' : 'Promote product to top of Marketplace'}
                                >
                                  <Sparkles size={12} /> {p.featured ? 'Promoted' : 'Promote'}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="premium-card-actions">
                        <select
                          value={u.plan}
                          onChange={e => handleModifyPlan(u.email, e.target.value)}
                          className="plan-select-dropdown"
                        >
                          <option value="free">Downgrade to Free</option>
                          <option value="starter">Starter Plan</option>
                          <option value="business">Business Plan</option>
                        </select>
                        <button
                          className={`btn-suspend-toggle ${u.status === 'suspended' ? 'reactivate' : 'suspend'}`}
                          onClick={() => handleToggleSuspend(u.email, u.status)}
                        >
                          {u.status === 'suspended' ? 'Activate' : 'Suspend'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══ VERIFICATION BADGES ═══ */}
        {activeSubTab === 'verifications' && (
          <div className="admin-view-fade fade-in">
            <div className="admin-split-panels flex-col">
              <div className="admin-list-panel-box">
                <h4>Pending Farmer Verification ({pendingVerifications.length})</h4>
                <div className="requests-table-wrapper">
                  <table className="admin-requests-table">
                    <thead><tr><th>Farmer Name</th><th>Email</th><th>Joined</th><th>Actions</th></tr></thead>
                    <tbody>
                      {pendingVerifications.length > 0 ? pendingVerifications.map(u => (
                        <tr key={u.email}>
                          <td><strong>{u.name}</strong></td>
                          <td>{u.email}</td>
                          <td>{u.joined || 'Today'}</td>
                          <td>
                            <button className="btn-approve" onClick={() => handleApproveVerification(u.email)}>
                              <Check size={14} /> Verify Farmer
                            </button>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan="4" className="empty-row text-muted">No pending verification requests.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="admin-list-panel-box">
                <h4>Pending Organic Certified Badge ({pendingOrganics.length})</h4>
                <div className="requests-table-wrapper">
                  <table className="admin-requests-table">
                    <thead><tr><th>Farmer Name</th><th>Email</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                      {pendingOrganics.length > 0 ? pendingOrganics.map(u => (
                        <tr key={u.email}>
                          <td><strong>{u.name}</strong></td>
                          <td>{u.email}</td>
                          <td><span className="text-muted">Awaiting audit</span></td>
                          <td>
                            <button className="btn-organic-approve" onClick={() => handleApproveOrganic(u.email)}>
                              <Award size={14} /> Certify Organic
                            </button>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan="4" className="empty-row text-muted">No pending organic cert requests.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ ACCOUNTS LIST ═══ */}
        {activeSubTab === 'accounts' && (
          <div className="admin-view-fade fade-in">
            <div className="accounts-search-bar-row">
              <Search size={16} />
              <input
                placeholder="Search user accounts by name or email..."
                value={searchUserQuery}
                onChange={e => setSearchUserQuery(e.target.value)}
              />
            </div>
            <div className="admin-accounts-list-table-wrapper">
              <table className="admin-accounts-table">
                <thead>
                  <tr>
                    <th>Avatar</th><th>User Details</th><th>Role</th><th>Plan</th>
                    <th>Status</th><th>Change Plan</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsersList.map(u => (
                    <tr key={u.email}>
                      <td>
                        <img
                          src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'U')}&background=random`}
                          alt="avatar"
                          className="admin-user-row-avatar"
                          onError={e => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'U')}&background=3B82F6&color=fff`; }}
                        />
                      </td>
                      <td>
                        <strong>{u.name}</strong>
                        <p className="text-muted">{u.email}</p>
                      </td>
                      <td><span className={`role-badge ${u.role}`}>{u.role?.toUpperCase()}</span></td>
                      <td><span className={`plan-badge ${u.plan || 'free'}`}>{(u.plan || 'free').toUpperCase()}</span></td>
                      <td><span className={`status-badge-field ${u.status || 'active'}`}>{(u.status || 'active').toUpperCase()}</span></td>
                      <td>
                        {u.role === 'farmer' ? (
                          <select
                            value={u.plan || 'free'}
                            onChange={e => handleModifyPlan(u.email, e.target.value)}
                            className="plan-select-dropdown"
                          >
                            <option value="free">Free Plan</option>
                            <option value="starter">Starter Plan</option>
                            <option value="business">Business Plan</option>
                          </select>
                        ) : <span className="text-muted">N/A</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className={`btn-suspend-toggle ${u.status === 'suspended' ? 'reactivate' : 'suspend'}`}
                            onClick={() => handleToggleSuspend(u.email, u.status)}
                          >
                            {u.status === 'suspended' ? 'Activate' : 'Suspend'}
                          </button>
                          {u.role !== 'admin' && (
                            <button
                              onClick={() => handleDeleteUserAccount(u)}
                              style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: 'none', borderRadius: '6px', padding: '5px 8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                              title="Delete User and all products"
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══ FEATURED PRODUCT MANAGER ═══ */}
        {activeSubTab === 'featured' && (
          <div className="admin-view-fade fade-in">
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div className="accounts-search-bar-row" style={{ flex: 1, minWidth: '240px', margin: 0 }}>
                <Search size={16} />
                <input
                  placeholder="Search listings by name, category, or farm..."
                  value={searchProductQuery}
                  onChange={e => setSearchProductQuery(e.target.value)}
                />
              </div>

              {/* Featured Filter Tabs */}
              <div style={{ display: 'flex', gap: '6px', background: 'var(--surface-white)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <button
                  style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', background: featuredFilter === 'all' ? 'var(--primary-green, #2E7D32)' : 'transparent', color: featuredFilter === 'all' ? '#fff' : 'var(--text-muted)' }}
                  onClick={() => setFeaturedFilter('all')}
                >
                  All Products ({products.length})
                </button>
                <button
                  style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', background: featuredFilter === 'featured' ? '#F59E0B' : 'transparent', color: featuredFilter === 'featured' ? '#fff' : 'var(--text-muted)' }}
                  onClick={() => setFeaturedFilter('featured')}
                >
                  ⭐ Featured Only ({products.filter(p => p.featured).length})
                </button>
                <button
                  style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', background: featuredFilter === 'standard' ? 'var(--primary-green, #2E7D32)' : 'transparent', color: featuredFilter === 'standard' ? '#fff' : 'var(--text-muted)' }}
                  onClick={() => setFeaturedFilter('standard')}
                >
                  Standard ({products.filter(p => !p.featured).length})
                </button>
              </div>
            </div>

            <div className="admin-featured-listings-wrapper">
              <table className="admin-featured-table">
                <thead>
                  <tr>
                    <th>Preview</th><th>Product</th><th>Seller / Farm</th><th>Price</th>
                    <th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProductsList.length === 0 ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No products found matching filters.</td></tr>
                  ) : filteredProductsList.map(p => (
                    <tr key={p.id}>
                      <td><img src={p.img} alt="Product" className="admin-product-row-img" onError={e => { e.target.onerror = null; e.target.src = 'https://placehold.co/60x60?text=Img'; }} /></td>
                      <td><strong>{p.name}</strong><p className="text-muted">{p.category}</p></td>
                      <td>{p.farm}<p className="text-muted" style={{ fontSize: '11px' }}>{p.ownerEmail}</p></td>
                      <td>GH₵ {parseFloat(p.price || 0).toFixed(2)} / {p.unit}</td>
                      <td><span className={`featured-indicator ${p.featured ? 'active' : 'inactive'}`}>{p.featured ? '⭐ FEATURED' : 'STANDARD'}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className={`btn-featured-status-toggle ${p.featured ? 'active' : ''}`}
                            onClick={() => handleToggleGlobalFeatured(p.id)}
                            title={p.featured ? 'Demote from Featured Top Display' : 'Promote to Featured Top Display'}
                          >
                            <Sparkles size={13} /> {p.featured ? 'Demote' : 'Promote to Featured'}
                          </button>
                          <button
                            onClick={() => onDeleteProduct?.(p.id)}
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="Delete Product"
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══ PAYMENTS HISTORY ═══ */}
        {activeSubTab === 'payments' && (
          <div className="admin-view-fade fade-in">
            <div className="payments-log-table-wrapper">
              <table className="admin-payments-table">
                <thead>
                  <tr>
                    <th>Transaction ID</th><th>Subscriber Email</th><th>Plan</th>
                    <th>Amount</th><th>Date</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.map(h => (
                    <tr key={h.id}>
                      <td><code>{h.id}</code></td>
                      <td>{h.email}</td>
                      <td><strong>{h.plan}</strong></td>
                      <td><strong className="text-success">{h.amount}</strong></td>
                      <td>{h.date}</td>
                      <td><span className="gateway-success-badge">SUCCESS</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
