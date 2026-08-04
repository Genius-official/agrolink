import React, { useState, useMemo, useEffect } from 'react';
import { newsItems } from '../data/newsData';
import { priceData } from '../data/priceData';
import { ShieldCheck, BarChart3, TrendingUp, Users, FileSpreadsheet, Sparkles, HelpCircle, Star, Award, Zap, Check, Lock, Calendar, MessageSquare, ArrowRight, ArrowLeft, CheckCircle2, X, Globe, ExternalLink, RefreshCw, Search, Clock, Percent, Trash2, Plus, Tag } from 'lucide-react';
import { processPaystackSubscription } from '../utils/paystackService';
import { fetchAgriNews } from '../utils/gnewsService';
import { api } from '../utils/api';
import './PremiumDashboard.css';

// SVG-based Sparkline & Bar Chart components for premium visualizations
function SVGBarChart({ data, labels, height = 180 }) {
  const maxValue = Math.max(...data, 100);
  return (
    <div className="svg-chart-container">
      <svg viewBox={`0 0 500 ${height}`} className="premium-svg-chart">
        {/* Grid lines */}
        <line x1="40" y1="10" x2="480" y2="10" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
        <line x1="40" y1="90" x2="480" y2="90" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
        <line x1="40" y1={height - 30} x2="480" y2={height - 30} stroke="rgba(255,255,255,0.1)" />

        {data.map((val, idx) => {
          const barWidth = 35;
          const spacing = (440 / data.length);
          const x = 50 + idx * spacing;
          const barHeight = ((height - 40) * val) / maxValue;
          const y = height - 30 - barHeight;

          return (
            <g key={idx} className="chart-bar-group">
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx="4"
                fill="url(#barGradient)"
                className="chart-bar"
              />
              <text
                x={x + barWidth / 2}
                y={y - 8}
                textAnchor="middle"
                fill="#fff"
                fontSize="10"
                fontWeight="600"
              >
                {val}
              </text>
              <text
                x={x + barWidth / 2}
                y={height - 10}
                textAnchor="middle"
                fill="rgba(255,255,255,0.6)"
                fontSize="11"
              >
                {labels[idx]}
              </text>
            </g>
          );
        })}

        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4ADE80" />
            <stop offset="100%" stopColor="#15803D" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function SVGLineChart({ data, labels, height = 180 }) {
  const maxValue = Math.max(...data, 100);
  const points = data
    .map((val, idx) => {
      const spacing = 400 / (data.length - 1);
      const x = 50 + idx * spacing;
      const y = height - 35 - ((height - 50) * val) / maxValue;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="svg-chart-container">
      <svg viewBox={`0 0 500 ${height}`} className="premium-svg-chart">
        {/* Grid lines */}
        <line x1="40" y1="15" x2="480" y2="15" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
        <line x1="40" y1="90" x2="480" y2="90" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
        <line x1="40" y1={height - 30} x2="480" y2={height - 30} stroke="rgba(255,255,255,0.1)" />

        {/* Shadow area under the line */}
        {points && (
          <path
            d={`M 50,${height - 30} L ${points} L 450,${height - 30} Z`}
            fill="url(#lineAreaGradient)"
            opacity="0.2"
          />
        )}

        {/* The line path */}
        <polyline
          fill="none"
          stroke="#4ADE80"
          strokeWidth="3.5"
          points={points}
          className="chart-polyline"
        />

        {/* Circles on vertices */}
        {data.map((val, idx) => {
          const spacing = 400 / (data.length - 1);
          const x = 50 + idx * spacing;
          const y = height - 35 - ((height - 50) * val) / maxValue;
          return (
            <g key={idx} className="chart-vertex">
              <circle cx={x} cy={y} r="5" fill="#fff" stroke="#16A34A" strokeWidth="2.5" />
              <text x={x} y={y - 10} textAnchor="middle" fill="#fff" fontSize="10" fontWeight="600">
                {val}
              </text>
              <text x={x} y={height - 10} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="11">
                {labels[idx]}
              </text>
            </g>
          );
        })}

        <defs>
          <linearGradient id="lineAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4ADE80" />
            <stop offset="100%" stopColor="#4ADE80" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// Live GNews Agricultural News Component
function NewsSearch() {
  const [query, setQuery] = useState('');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [notice, setNotice] = useState('');

  const loadNews = async (searchTerm = '', force = false) => {
    setLoading(true);
    try {
      const res = await fetchAgriNews(searchTerm, force);
      setArticles(res.articles || []);
      setIsLive(!!res.isLive);
      setNotice(res.notice || res.error || '');
    } catch (e) {
      console.error("Failed to load GNews", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews('', false);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadNews(query, true);
  };

  return (
    <div className="premium-subsection-card news-subsection-card">
      <div className="news-header-flex">
        <div>
          <h3 className="section-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Globe size={18} style={{ color: '#10B981' }} /> Agri News & Market Alerts
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', margin: 0 }}>
            Live global & regional agricultural news via GNews API
          </p>
        </div>
        <div className="news-header-actions">
          <span className={`news-status-badge ${isLive ? 'live-badge' : 'curated-badge'}`}>
            <span className="badge-pulse-dot" />
            {isLive ? 'GNews Live' : 'Curated Feed'}
          </span>
          <button
            className="news-refresh-btn"
            onClick={() => loadNews(query, true)}
            title="Refresh News Feed"
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'spin-icon' : ''} />
          </button>
        </div>
      </div>

      <form onSubmit={handleSearchSubmit} className="news-search-form">
        <div className="news-search-input-wrapper">
          <Search size={16} className="search-icon-muted" />
          <input
            type="text"
            placeholder="Search crop trends, cocoa, fertilizers..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="news-search-input-premium"
          />
        </div>
        <button type="submit" className="news-search-btn">Search</button>
      </form>

      {notice && (
        <div className="news-notice-banner">
          <span>ℹ️ {notice}</span>
        </div>
      )}

      <div className="news-scroll-container">
        {loading ? (
          <div className="news-loading-skeleton">
            <div className="skeleton-line title-skel" />
            <div className="skeleton-line text-skel" />
            <div className="skeleton-line text-skel short" />
          </div>
        ) : articles.length === 0 ? (
          <div className="news-empty-state">
            <p>No agricultural news articles found for "{query}".</p>
            <button className="news-reset-btn" onClick={() => { setQuery(''); loadNews('', true); }}>
              Reset Search
            </button>
          </div>
        ) : (
          articles.map((item) => (
            <div key={item.id} className="news-card-item">
              {item.image && (
                <div className="news-card-img-wrap">
                  <img src={item.image} alt={item.title} className="news-card-img" onError={(e) => { e.target.style.display = 'none'; }} />
                </div>
              )}
              <div className="news-card-content">
                <div className="news-card-meta">
                  <span className="news-source-tag">{item.sourceName || 'AgriNews'}</span>
                  <span className="news-date-tag">
                    <Clock size={12} /> {item.publishedAt}
                  </span>
                </div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="news-title-premium"
                >
                  {item.title} <ExternalLink size={13} className="ext-icon" />
                </a>
                <p className="news-snippet-premium">{item.snippet}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// PriceList preservation
function PriceList() {
  return (
    <div className="premium-subsection-card">
      <h3 className="section-subtitle">Market Prices Index</h3>
      <div className="price-table-wrapper">
        <table className="price-table-premium">
          <thead>
            <tr>
              <th>Commodity</th>
              <th>Current Price</th>
              <th>Currency</th>
            </tr>
          </thead>
          <tbody>
            {priceData.map(p => (
              <tr key={p.id}>
                <td>{p.productName}</td>
                <td>{p.price}</td>
                <td>{p.currency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function PremiumDashboard({ currentUser, products, orders, onUpdateProfile }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'insights', 'agronomy', 'reports', 'promos', 'billing'
  const isBusiness = currentUser?.plan === 'business';
  const isStarter = currentUser?.plan === 'starter';
  const isPremium = isStarter || isBusiness;

  // ─── Promotions state (premium feature) ───────────────────────────────────
  const [promoForm, setPromoForm] = useState({ title: '', type: 'percent', value: '', code: '', productId: '', active: true });
  const [promoError, setPromoError] = useState('');

  const handleAddPromo = (e) => {
    e.preventDefault();
    if (!promoForm.title.trim() || !promoForm.value) {
      setPromoError('Promotion title and discount value are required.');
      return;
    }
    setPromoError('');
    const currentPromos = currentUser?.promotions || [];
    const selectedProd = products.find(p => String(p.id) === String(promoForm.productId));
    const newPromo = {
      ...promoForm,
      id: Date.now(),
      productName: selectedProd?.name || 'All Store Products',
      farmName: currentUser?.name || 'Farm Store',
      createdAt: new Date().toISOString()
    };
    onUpdateProfile?.({ ...currentUser, promotions: [newPromo, ...currentPromos] });
    setPromoForm({ title: '', type: 'percent', value: '', code: '', productId: '', active: true });
  };

  const handleTogglePromo = (id) => {
    const updated = (currentUser?.promotions || []).map(p => String(p.id) === String(id) ? { ...p, active: !p.active } : p);
    onUpdateProfile?.({ ...currentUser, promotions: updated });
  };

  const handleDeletePromo = (id) => {
    const updated = (currentUser?.promotions || []).filter(p => String(p.id) !== String(id));
    onUpdateProfile?.({ ...currentUser, promotions: updated });
  };

  const myProducts = products.filter(p => p.ownerEmail === currentUser?.email);

  // CSV Exporter helper
  const handleExport = (type) => {
    let headers = [];
    let rows = [];
    let filename = `agrolink_${type}_report.csv`;

    if (type === 'sales') {
      headers = ['Date', 'Buyer Name', 'Amount (GH₵)', 'Status'];
      rows = orders.map(o => [o.date, o.buyerName, o.amount, o.status]);
    } else if (type === 'orders') {
      headers = ['Order ID', 'Product', 'Quantity', 'Unit', 'Total Amount', 'Status', 'Date'];
      rows = orders.map(o => [o.id, o.productName || 'Produce', o.qty, o.unit || 'kg', o.amount, o.status, o.date]);
    } else if (type === 'inventory') {
      headers = ['Product Name', 'Category', 'Price (GH₵)', 'Stock Description'];
      rows = products.map(p => [p.name, p.category, p.price, p.stock]);
    } else if (type === 'revenue') {
      headers = ['Date', 'Product', 'Quantity', 'Sales Revenue (GH₵)'];
      rows = orders.filter(o => o.status === 'delivered').map(o => [o.date, o.productName, o.qty, o.amount]);
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [paymentNotice, setPaymentNotice] = useState(null);

  // Upgrade Plan handler via Paystack Payment Gateway
  const handleUpgrade = (selectedPlan) => {
    if (!currentUser) return;
    const amount = selectedPlan === 'business' ? 299 : 99;

    processPaystackSubscription({
      email: currentUser.email || 'customer@agrolink.gh',
      amountGHS: amount,
      planName: selectedPlan,
      onSuccess: async (paymentData) => {
        try {
          await api.post('/subscriptions/upgrade', {
            plan: selectedPlan,
            amountGhs: amount,
            paystackRef: paymentData.reference,
          });
        } catch { /* API offline fallback */ }

        onUpdateProfile?.({
          ...currentUser,
          plan: selectedPlan,
          joinedPremiumDate: paymentData.paidAt || new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric', day: 'numeric' }),
          premiumRenewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', year: 'numeric', day: 'numeric' }),
          lastTransactionRef: paymentData.reference,
          lastPaymentAmount: amount
        });
        setPaymentNotice({
          show: true,
          planName: selectedPlan,
          amount: amount,
          ref: paymentData.reference
        });
      },
      onCancel: () => {
        console.log("Paystack payment cancelled by user.");
      }
    });
  };

  // Switch Plan/Downgrade Handler
  const handleCancelPlan = () => {
    if (window.confirm("Are you sure you want to cancel your Premium Plan? You will lose access to premium insights and tools immediately.")) {
      onUpdateProfile?.({
        ...currentUser,
        plan: 'free',
        premiumRenewalDate: null,
        joinedPremiumDate: null
      });
    }
  };

  // --- ANALYTICS CALCULATIONS ---
  const totalSales = useMemo(() => {
    return orders.reduce((sum, o) => sum + (o.amount || 0), 0);
  }, [orders]);

  const salesCount = orders.length;
  const avgOrderValue = salesCount > 0 ? (totalSales / salesCount).toFixed(2) : '0.00';

  const categoryShare = useMemo(() => {
    const shares = {};
    products.forEach(p => {
      shares[p.category] = (shares[p.category] || 0) + 1;
    });
    return shares;
  }, [products]);

  // SVG Chart Mock Datasets
  const weeklySalesData = [120, 350, 280, 520, 640, 710, 890];
  const weeklyLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const monthlySalesData = [1400, 2200, 1900, 3100, 4200, 4800, 5900];
  const monthlyLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];

  // Best Selling products calculations
  const bestSellers = useMemo(() => {
    return [...products]
      .sort((a, b) => (b.reviews || 0) - (a.reviews || 0))
      .slice(0, 4);
  }, [products]);

  // Customer stats (Business Plan exclusive mock data)
  const customerLocations = [
    { region: 'Greater Accra', percentage: '45%', customers: 84 },
    { region: 'Ashanti Region', percentage: '30%', customers: 56 },
    { region: 'Central Region', percentage: '15%', customers: 28 },
    { region: 'Northern Region', percentage: '10%', customers: 19 }
  ];

  const topCustomers = [
    { name: 'Accra Fresh Market', orders: 18, totalSpend: 'GH₵ 14,200', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80' },
    { name: 'Retail Buyers Co.', orders: 12, totalSpend: 'GH₵ 8,900', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&q=80' },
    { name: 'Kwame Boateng Fresh', orders: 9, totalSpend: 'GH₵ 4,500', avatar: 'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=100&q=80' }
  ];

  // Render Upgrade Portal
  if (!isPremium) {
    return (
      <div className="upgrade-portal-container fade-in">
        <header className="upgrade-header">
          <div className="spark-icon-wrapper"><Sparkles size={32} /></div>
          <h2>Level Up Your Farm Business</h2>
          <p>Subscribe to our premium plans to access custom store designs, analytics dashboards, discounts, and staff tools.</p>
        </header>

        {/* Pricing comparison table */}
        <div className="pricing-grid-container">
          {/* FREE PLAN */}
          <div className="pricing-card free-tier">
            <div className="tier-header">
              <span className="tier-badge">BASIC</span>
              <h3>Free Plan</h3>
              <div className="price-block">
                <span className="currency">GH₵</span>
                <span className="price-value">0</span>
                <span className="period">/mo</span>
              </div>
              <p className="tier-desc">Get started with online agricultural sales.</p>
            </div>
            <div className="tier-features">
              <ul>
                <li><Check size={16} /> 1 Store Creation</li>
                <li><Check size={16} /> Standard Product Upload</li>
                <li><Check size={16} /> Order & Inventory Tracker</li>
                <li><Check size={16} /> Simple Customer Chat</li>
                <li className="disabled"><Lock size={14} /> Custom Themes & Banner</li>
                <li className="disabled"><Lock size={14} /> Advanced SVG Analytics Charts</li>
                <li className="disabled"><Lock size={14} /> Promotions & Flash Sales</li>
                <li className="disabled"><Lock size={14} /> AI Price Recommendation Engine</li>
              </ul>
            </div>
            <button className="tier-btn disabled" disabled>Active Plan</button>
          </div>

          {/* STARTER PLAN */}
          <div className="pricing-card starter-tier popular">
            <div className="popular-ribbon">POPULAR</div>
            <div className="tier-header">
              <span className="tier-badge starter">GROWING</span>
              <h3>Starter Plan</h3>
              <div className="price-block">
                <span className="currency">GH₵</span>
                <span className="price-value">99</span>
                <span className="period">/mo</span>
              </div>
              <p className="tier-desc">Boost discoverability & analyze sales metrics.</p>
            </div>
            <div className="tier-features">
              <ul>
                <li><Check size={16} /> <strong>Featured Products</strong> Badge</li>
                <li><Check size={16} /> <strong>Advanced Analytics</strong> (SVG Charts)</li>
                <li><Check size={16} /> Low Stock <strong>Inventory Alerts</strong></li>
                <li><Check size={16} /> <strong>Promotions & Discount</strong> Codes</li>
                <li><Check size={16} /> Custom Store Logo, Colors & Banners</li>
                <li><Check size={16} /> WhatsApp Business Chat Integration</li>
                <li><Check size={16} /> CSV Report Exports</li>
                <li className="disabled"><Lock size={14} /> Staff Accounts (Multi-user)</li>
              </ul>
            </div>
            <button className="tier-btn starter-btn" onClick={() => handleUpgrade('starter')}>
              Upgrade to Starter <ArrowRight size={16} />
            </button>
          </div>

          {/* BUSINESS PLAN */}
          <div className="pricing-card business-tier">
            <div className="tier-header">
              <span className="tier-badge business">ENTERPRISE</span>
              <h3>Business Plan</h3>
              <div className="price-block">
                <span className="currency">GH₵</span>
                <span className="price-value">299</span>
                <span className="period">/mo</span>
              </div>
              <p className="tier-desc">Complete corporate tools & AI helpers.</p>
            </div>
            <div className="tier-features">
              <ul>
                <li><Check size={16} /> <strong>Everything in Starter Plan</strong></li>
                <li><Check size={16} /> <strong>AI Price Suggestions</strong> Tool</li>
                <li><Check size={16} /> <strong>Staff Account Permissions</strong></li>
                <li><Check size={16} /> <strong>Bulk Order Negotiation</strong> system</li>
                <li><Check size={16} /> Interactive <strong>Harvest Calendar</strong></li>
                <li><Check size={16} /> <strong>Verified & Organic certified</strong> badges</li>
                <li><Check size={16} /> <strong>Priority Support Desk</strong> access</li>
                <li><Check size={16} /> Detailed Customer Loyalty Insights</li>
              </ul>
            </div>
            <button className="tier-btn business-btn" onClick={() => handleUpgrade('business')}>
              Go Business Premium <ArrowRight size={16} />
            </button>
          </div>
        </div>
        {paymentNotice?.show && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}>
            <div style={{
              background: 'var(--bg-card, #ffffff)',
              color: 'var(--text-main, #0f172a)',
              padding: '32px',
              borderRadius: '20px',
              maxWidth: '440px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: '#DCFCE7', color: '#16A34A',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px'
              }}>
                <CheckCircle2 size={36} />
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '8px' }}>Payment Successful!</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted, #64748b)', marginBottom: '20px' }}>
                Your payment of <strong>GH₵ {parseFloat(paymentNotice.amount).toFixed(2)}</strong> via Paystack was confirmed. Your <strong>{paymentNotice.planName.toUpperCase()}</strong> plan is now active!
              </p>
              <div style={{ background: 'var(--bg-tertiary, #f8fafc)', padding: '12px', borderRadius: '10px', marginBottom: '24px', fontSize: '12px', fontFamily: 'monospace' }}>
                Ref: {paymentNotice.ref}
              </div>
              <button
                onClick={() => setPaymentNotice(null)}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: '#16A34A',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '700',
                  fontSize: '15px',
                  cursor: 'pointer'
                }}
              >
                Access Premium Features
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="premium-dashboard-active fade-in">
      {/* Header Info */}
      <header className="premium-dash-header">
        <div className="premium-header-left">
          <div className={`plan-avatar-pill ${isBusiness ? 'business-pill' : 'starter-pill'}`}>
            {isBusiness ? <Award size={24} /> : <Zap size={24} />}
          </div>
          <div>
            <h2 className="premium-welcome-title">AgroLink Premium Panel</h2>
            <p className="premium-welcome-desc">
              Logged in as <span className="premium-badge-text">{currentUser?.name}</span> ({isBusiness ? 'Business Tier' : 'Starter Tier'} Subscriber)
            </p>
          </div>
        </div>
        <div className="premium-header-right">
          <div className="renewal-box">
            <Calendar size={15} />
            <span>Renew Date: {currentUser?.premiumRenewalDate || '30 days from now'}</span>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="premium-tabs-nav">
        <button
          className={`premium-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 size={16} /> Overview & Sales
        </button>
        {isBusiness && (
          <button
            className={`premium-tab-btn ${activeTab === 'insights' ? 'active' : ''}`}
            onClick={() => setActiveTab('insights')}
          >
            <Users size={16} /> Customer Insights
          </button>
        )}
        <button
          className={`premium-tab-btn ${activeTab === 'agronomy' ? 'active' : ''}`}
          onClick={() => setActiveTab('agronomy')}
        >
          <Star size={16} /> Market Index & News
        </button>
        <button
          className={`premium-tab-btn ${activeTab === 'promos' ? 'active' : ''}`}
          onClick={() => setActiveTab('promos')}
        >
          <Percent size={16} /> Promotions
        </button>
        <button
          className={`premium-tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <FileSpreadsheet size={16} /> Download Reports
        </button>
        <button
          className={`premium-tab-btn ${activeTab === 'billing' ? 'active' : ''}`}
          onClick={() => setActiveTab('billing')}
        >
          <ShieldCheck size={16} /> Plan Settings
        </button>
      </nav>

      {/* Tab Body Contents */}
      <div className="premium-tab-body">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="premium-view-fade fade-in">
            {/* Top Stat widgets */}
            <div className="premium-stats-widgets">
              <div className="stat-widget-premium">
                <span className="widget-label">Gross Revenue</span>
                <p className="widget-value">GH₵ {totalSales.toFixed(2)}</p>
                <span className="widget-helper text-success"><TrendingUp size={12} /> Live sales tracking</span>
              </div>
              <div className="stat-widget-premium">
                <span className="widget-label">Average Ticket Size</span>
                <p className="widget-value">GH₵ {avgOrderValue}</p>
                <span className="widget-helper text-muted">Per individual checkout</span>
              </div>
              <div className="stat-widget-premium">
                <span className="widget-label">Active Orders</span>
                <p className="widget-value">{salesCount}</p>
                <span className="widget-helper text-primary">Fulfilled & pending</span>
              </div>
            </div>

            {/* SVG Charts */}
            <div className="premium-charts-section">
              <div className="chart-card-premium">
                <h3 className="chart-card-title">Weekly Sales Trend (GH₵)</h3>
                <SVGLineChart data={weeklySalesData} labels={weeklyLabels} />
              </div>
              <div className="chart-card-premium">
                <h3 className="chart-card-title">Monthly Revenue Scaling (GH₵)</h3>
                <SVGBarChart data={monthlySalesData} labels={monthlyLabels} />
              </div>
            </div>

            {/* Products grid */}
            <div className="best-sellers-card-premium">
              <h3 className="section-subtitle">Best Selling Products</h3>
              <div className="best-sellers-grid">
                {bestSellers.map(p => (
                  <div key={p.id} className="seller-product-item">
                    <img src={p.img} alt={p.name} className="seller-product-img" />
                    <div className="seller-product-info">
                      <h4>{p.name}</h4>
                      <p className="text-muted">{p.category}</p>
                      <div className="seller-rating">
                        <span>★ {p.rating}</span>
                        <span>({p.reviews} reviews)</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CUSTOMER INSIGHTS TAB */}
        {activeTab === 'insights' && isBusiness && (
          <div className="premium-view-fade fade-in">
            <div className="insights-panels-grid">
              {/* Top buyer listing */}
              <div className="insights-panel-card">
                <h3 className="section-subtitle">Top Buyer Accounts</h3>
                <div className="customer-loyalty-list">
                  {topCustomers.map((cust, i) => (
                    <div key={i} className="buyer-loyalty-item">
                      <img src={cust.avatar} alt={cust.name} className="buyer-loyalty-avatar" />
                      <div className="buyer-loyalty-details">
                        <h4>{cust.name}</h4>
                        <p>{cust.orders} complete orders placed</p>
                      </div>
                      <div className="buyer-loyalty-spend">
                        <span>{cust.totalSpend}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Geographic breakdown */}
              <div className="insights-panel-card">
                <h3 className="section-subtitle">Regional Sales Breakdown</h3>
                <div className="geographic-chart-list">
                  {customerLocations.map((loc, idx) => (
                    <div key={idx} className="geo-percentage-item">
                      <div className="geo-row">
                        <span className="geo-name">{loc.region}</span>
                        <span className="geo-value">{loc.percentage} ({loc.customers} buyers)</span>
                      </div>
                      <div className="geo-progress-bar">
                        <div className="geo-progress-fill" style={{ width: loc.percentage }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MARKET INDEX & NEWS TAB */}
        {activeTab === 'agronomy' && (
          <div className="premium-view-fade grid-half fade-in">
            <NewsSearch />
            <PriceList />
          </div>
        )}

        {/* EXPORTS TAB */}
        {activeTab === 'reports' && (
          <div className="premium-view-fade reports-tab fade-in">
            <div className="reports-intro-card">
              <FileSpreadsheet size={48} className="reports-logo-icon" />
              <h3>Spreadsheet Data Exporter</h3>
              <p>Download fully structured Microsoft Excel-compatible CSV documents containing live performance records of your sales, transactions, listings and inventories.</p>
            </div>
            
            <div className="export-options-grid">
              <div className="export-card">
                <h4>Gross Sales Log</h4>
                <p>Date-by-date list of invoice transactions and buyers details.</p>
                <button className="export-action-btn" onClick={() => handleExport('sales')}>
                  Export CSV
                </button>
              </div>

              <div className="export-card">
                <h4>Orders Performance</h4>
                <p>Comprehensive tracking details of fulfilled and rejected products.</p>
                <button className="export-action-btn" onClick={() => handleExport('orders')}>
                  Export CSV
                </button>
              </div>

              <div className="export-card">
                <h4>Inventory Status</h4>
                <p>Live listings data containing pricing indices and stock availability.</p>
                <button className="export-action-btn" onClick={() => handleExport('inventory')}>
                  Export CSV
                </button>
              </div>

              <div className="export-card">
                <h4>Revenue Ledger</h4>
                <p>Aggregated records of all successfully received payments.</p>
                <button className="export-action-btn" onClick={() => handleExport('revenue')}>
                  Export CSV
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PROMOTIONS TAB */}
        {activeTab === 'promos' && (
          <div className="premium-view-fade fade-in">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>

              {/* Create Promo Form */}
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>
                <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '16px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Plus size={18} style={{ color: '#4ADE80' }} /> Create Promotion
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '20px' }}>Apply discounts on your listings as a premium member</p>

                {promoError && (
                  <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', color: '#FCA5A5', fontSize: '13px' }}>
                    {promoError}
                  </div>
                )}

                <form onSubmit={handleAddPromo} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Campaign Title *</label>
                    <input
                      style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '10px 12px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                      placeholder="e.g. Farmers Day Flash Sale"
                      value={promoForm.title}
                      onChange={e => setPromoForm(p => ({ ...p, title: e.target.value }))}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Discount Type</label>
                      <select
                        style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '10px 12px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                        value={promoForm.type}
                        onChange={e => setPromoForm(p => ({ ...p, type: e.target.value }))}
                      >
                        <option value="percent" style={{ background: '#1e293b' }}>Percentage Off (%)</option>
                        <option value="fixed" style={{ background: '#1e293b' }}>Fixed Amount (GH₵)</option>
                        <option value="bogo" style={{ background: '#1e293b' }}>Buy One Get One</option>
                        <option value="flash" style={{ background: '#1e293b' }}>Flash Sale</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Value *</label>
                      <input
                        type="number"
                        style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '10px 12px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                        placeholder="e.g. 15"
                        value={promoForm.value}
                        onChange={e => setPromoForm(p => ({ ...p, value: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Target Product</label>
                    <select
                      style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '10px 12px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                      value={promoForm.productId}
                      onChange={e => setPromoForm(p => ({ ...p, productId: e.target.value }))}
                    >
                      <option value="" style={{ background: '#1e293b' }}>-- All Store Products --</option>
                      {myProducts.map(prod => (
                        <option key={prod.id} value={prod.id} style={{ background: '#1e293b' }}>
                          {prod.name} (GH₵{parseFloat(prod.price || 0).toFixed(2)}/{prod.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Promo Code (Optional)</label>
                    <input
                      style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '10px 12px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                      placeholder="e.g. AGRO20"
                      value={promoForm.code}
                      onChange={e => setPromoForm(p => ({ ...p, code: e.target.value }))}
                    />
                  </div>

                  <button
                    type="submit"
                    style={{ background: 'linear-gradient(135deg, #16A34A, #15803D)', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px 20px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <Plus size={16} /> Launch Promotion
                  </button>
                </form>
              </div>

              {/* Active Promo List */}
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>
                <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '16px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Tag size={18} style={{ color: '#FBBF24' }} /> Active Campaigns
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '20px' }}>Manage, pause, or delete your promotions anytime</p>

                {(currentUser?.promotions || []).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.3)' }}>
                    <Percent size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                    <p style={{ fontSize: '14px' }}>No promotions yet. Create one to get started.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {(currentUser.promotions).map(promo => (
                      <div
                        key={promo.id}
                        style={{
                          background: promo.active ? 'rgba(74,222,128,0.08)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${promo.active ? 'rgba(74,222,128,0.25)' : 'rgba(255,255,255,0.08)'}`,
                          borderRadius: '12px',
                          padding: '14px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          opacity: promo.active ? 1 : 0.6
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ color: '#fff', fontWeight: 700, fontSize: '14px', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {promo.title}
                            {promo.active && <span style={{ background: '#16A34A', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '20px' }}>LIVE</span>}
                          </p>
                          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: '3px 0 0' }}>
                            {promo.type === 'percent' ? `${promo.value}% off` : promo.type === 'fixed' ? `GH₵${promo.value} off` : promo.type.toUpperCase()}
                            {promo.productName && promo.productName !== 'All Store Products' && ` · ${promo.productName}`}
                            {promo.code && ` · Code: ${promo.code}`}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                          <button
                            onClick={() => handleTogglePromo(promo.id)}
                            style={{
                              background: promo.active ? 'rgba(255,255,255,0.1)' : 'rgba(74,222,128,0.2)',
                              color: promo.active ? 'rgba(255,255,255,0.7)' : '#4ADE80',
                              border: 'none',
                              borderRadius: '7px',
                              padding: '6px 12px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            {promo.active ? 'Pause' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDeletePromo(promo.id)}
                            style={{ background: 'rgba(239,68,68,0.15)', color: '#FCA5A5', border: 'none', borderRadius: '7px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            title="Delete promotion"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* BILLING AND SETTINGS TAB */}
        {activeTab === 'billing' && (
          <div className="premium-view-fade billing-tab fade-in">
            <div className="active-subscription-details-card">
              <div className="billing-badge-row">
                <span className="billing-active-badge">ACTIVE</span>
                <h3>Premium Subscription</h3>
              </div>
              <p className="billing-renew-text">
                Your AgroLink <strong>{currentUser?.plan?.toUpperCase()}</strong> subscription will automatically renew on <strong>{currentUser?.premiumRenewalDate || '30 days from now'}</strong>.
              </p>
              
              <div className="billing-audit-summary">
                <div className="audit-item">
                  <span>Enrolled Date</span>
                  <strong>{currentUser?.joinedPremiumDate || 'Today'}</strong>
                </div>
                <div className="audit-item">
                  <span>Subscription Cost</span>
                  <strong>GH₵ {isBusiness ? '299.00' : '99.00'} / month</strong>
                </div>
                <div className="audit-item">
                  <span>Payment Gateway</span>
                  <strong>Paystack (MoMo / Visa / Mastercard)</strong>
                </div>
                {currentUser?.lastTransactionRef && (
                  <div className="audit-item">
                    <span>Transaction Ref</span>
                    <strong style={{ fontFamily: 'monospace', color: '#0EA5E9' }}>{currentUser.lastTransactionRef}</strong>
                  </div>
                )}
              </div>

              <div className="billing-actions-row">
                {isStarter && (
                  <button className="billing-upgrade-btn" onClick={() => handleUpgrade('business')}>
                    Upgrade to Business <Sparkles size={14} />
                  </button>
                )}
                {isBusiness && (
                  <button className="billing-downgrade-btn" onClick={() => handleUpgrade('starter')}>
                    Downgrade to Starter
                  </button>
                )}
                <button className="billing-cancel-btn" onClick={handleCancelPlan}>
                  Cancel Subscription
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Payment Success Confirmation Modal */}
      {paymentNotice?.show && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-card, #ffffff)',
            color: 'var(--text-main, #0f172a)',
            padding: '32px',
            borderRadius: '20px',
            maxWidth: '440px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: '#DCFCE7', color: '#16A34A',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <CheckCircle2 size={36} />
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '8px' }}>Payment Successful!</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted, #64748b)', marginBottom: '20px' }}>
              Your payment of <strong>GH₵ {parseFloat(paymentNotice.amount).toFixed(2)}</strong> via Paystack was confirmed. Your <strong>{paymentNotice.planName.toUpperCase()}</strong> plan is now active!
            </p>
            <div style={{ background: 'var(--bg-tertiary, #f8fafc)', padding: '12px', borderRadius: '10px', marginBottom: '24px', fontSize: '12px', fontFamily: 'monospace' }}>
              Ref: {paymentNotice.ref}
            </div>
            <button
              onClick={() => setPaymentNotice(null)}
              style={{
                width: '100%',
                padding: '14px',
                background: '#16A34A',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '15px',
                cursor: 'pointer'
              }}
            >
              Access Premium Features
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
