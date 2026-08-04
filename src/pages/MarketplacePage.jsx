import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ShoppingCart, Building2, MapPin, Phone, X, Info, Share2, Heart, MessageCircle, Sparkles, CheckCircle, Award, Calendar, Send, Tag, ArrowRight } from 'lucide-react'
import './MarketplacePage.css'

const categories = ['All', 'Vegetables', 'Grains', 'Fruits', 'Machinery', 'Fertilizers']

function ProductModal({ product, onClose, onAddToCart, onChat, onAddBulkOrder, currentUser, onOpenFarmerStore }) {
    if (!product) return null

    // Look up seller in the localStorage user database
    const usersDB = JSON.parse(localStorage.getItem('agrolink_users') || '[]');
    const seller = usersDB.find(u => u.email === product.ownerEmail);

    const isVerified = seller?.verified || false;
    const isOrganic = seller?.organicCertified || false;
    const hasCustomTheme = seller?.shopTheme || false;
    const whatsappNum = seller?.whatsappNumber || '';

    // Bulk Order form state
    const [showBulkForm, setShowBulkForm] = useState(false);
    const [bulkQty, setBulkQty] = useState('');
    const [bulkPrice, setBulkPrice] = useState('');
    const [bulkComments, setBulkComments] = useState('');
    const [bulkSuccess, setBulkSuccess] = useState(false);

    const handleBulkSubmit = (e) => {
        e.preventDefault();
        if (!bulkQty || !bulkPrice) return;

        const request = {
            id: `BLK-${Date.now().toString().slice(-4)}`,
            buyerName: currentUser?.name || 'Wholesale Buyer',
            buyerEmail: currentUser?.email || 'wholesale@buyer.gh',
            productName: product.name,
            qty: parseInt(bulkQty),
            unit: product.unit,
            targetPrice: parseFloat(bulkPrice),
            status: 'pending',
            comments: bulkComments,
            ownerEmail: product.ownerEmail,
            date: new Date().toISOString().split('T')[0]
        };

        onAddBulkOrder?.(request);
        setBulkSuccess(true);
        setTimeout(() => {
            setBulkSuccess(false);
            setShowBulkForm(false);
            setBulkQty('');
            setBulkPrice('');
            setBulkComments('');
        }, 2000);
    };

    return createPortal(
        <div className="product-modal-overlay" onClick={onClose}>
            <div 
                className="product-modal" 
                onClick={e => e.stopPropagation()}
                style={hasCustomTheme ? { borderColor: seller.shopTheme } : {}}
            >
                {/* Store banner header if customized */}
                {seller?.shopBanner && (
                    <div className="product-modal__banner">
                        <img src={seller.shopBanner} alt="Shop Banner" className="modal-banner-img" />
                    </div>
                )}

                <button className="product-modal__close" onClick={onClose} aria-label="Close modal">
                    <X size={24} />
                </button>
                <div className="product-modal__content">
                    <div className="product-modal__image-side">
                        <img src={product.img} alt={product.name} className="product-modal__img" />
                        <div className="product-modal__controls">
                            <button className="product-modal__action-btn"><Heart size={20} /></button>
                            <button className="product-modal__action-btn"><Share2 size={20} /></button>
                        </div>
                    </div>

                    <div className="product-modal__info-side">
                        <div className="product-modal__header">
                            <div className="modal-badges-row">
                                <span
                                    className="product-modal__badge"
                                    style={{ background: product.badgeColor ?? '#E8F5E9', color: product.badgeTextColor ?? '#2E7D32' }}
                                >
                                    {product.badge}
                                </span>
                                {(product.featured || product.promoted) && (
                                    <span className="badge-featured badge-promoted-glow"><Sparkles size={11} /> ⭐ PROMOTED</span>
                                )}
                                {isVerified && (
                                    <span className="badge-verified"><CheckCircle size={11} /> VERIFIED FARM</span>
                                )}
                                {isOrganic && (
                                    <span className="badge-organic"><Award size={11} /> ORGANIC CERTIFIED</span>
                                )}
                            </div>

                            <h2 className="product-modal__name">{product.name}</h2>
                            <div className="product-modal__rating">
                                <span className="product-modal__stars">★★★★★</span>
                                <span className="product-modal__reviews">({product.reviews ?? 0} reviews)</span>
                            </div>
                        </div>

                        <div className="product-modal__price-row">
                            <span className="product-modal__price" style={hasCustomTheme ? { color: seller.shopTheme } : {}}>
                                GH₵{parseFloat(product.price).toFixed(2)}
                            </span>
                            <span className="product-modal__unit">per {product.unit}</span>
                        </div>

                        <div className="product-modal__description">
                            <h4 className="product-modal__section-title"><Info size={16} /> Description</h4>
                            <p>{product.description || 'No description provided.'}</p>
                            {seller?.shopDesc && (
                                <p className="seller-shop-desc-text"><strong>About Store:</strong> {seller.shopDesc}</p>
                            )}
                        </div>

                        {/* Farmer / Store Front Card */}
                        <div className="product-modal__farmer-card">
                            <h4 className="product-modal__section-title">Farmer / Store details</h4>
                            <div 
                                className="product-modal__farmer-info clickable-farmer-info"
                                onClick={() => {
                                    onOpenFarmerStore?.(product.ownerEmail);
                                    onClose();
                                }}
                                title={`View ${product.farm} storefront`}
                            >
                                <div className="product-modal__farmer-avatar" style={hasCustomTheme ? { background: seller.shopTheme } : {}}>
                                    {seller?.shopLogo ? (
                                        <img src={seller.shopLogo} alt={product.farm} className="product-modal__avatar-img" />
                                    ) : (
                                        product.farm.charAt(0)
                                    )}
                                </div>
                                <div>
                                    <p className="product-modal__farm-name">{product.farm}</p>
                                    <p className="product-modal__location"><MapPin size={12} /> {product.location}</p>
                                    {seller?.shopHours && <p className="store-hours-text">Hours: {seller.shopHours}</p>}
                                </div>
                            </div>
                            <div className="product-modal__farmer-actions">
                                <a href={`tel:${product.phone}`} className="product-modal__contact-btn">
                                    <Phone size={16} /> Call Now
                                </a>
                                <button 
                                    className="product-modal__chat-btn"
                                    onClick={() => onChat?.({ name: product.farm, email: product.ownerEmail })}
                                >
                                    <MessageCircle size={16} /> Chat
                                </button>
                                {whatsappNum && (
                                    <a 
                                        href={`https://wa.me/${whatsappNum.replace(/\s+/g, '')}?text=Hi,%20I'm%20interested%20in%20your%20product:%20${encodeURIComponent(product.name)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="product-modal__whatsapp-btn"
                                    >
                                        <MessageCircle size={16} /> WhatsApp
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Bulk Purchase Negotiation Area */}
                        <div className="bulk-negotiation-toggle-area">
                            <button 
                                className="bulk-toggle-btn"
                                onClick={() => setShowBulkForm(!showBulkForm)}
                            >
                                <Sparkles size={14} /> Wholesale Bulk Requests
                            </button>

                            {showBulkForm && (
                                <div className="bulk-form-container">
                                    {bulkSuccess ? (
                                        <div className="bulk-success-banner">
                                            <CheckCircle size={18} />
                                            <span>Bulk proposal sent successfully to the farmer!</span>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleBulkSubmit} className="bulk-proposal-form">
                                            <h5>Wholesale Negotiations Form</h5>
                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label>Qty Required ({product.unit})</label>
                                                    <input 
                                                        type="number"
                                                        placeholder="e.g. 500"
                                                        value={bulkQty}
                                                        onChange={e => setBulkQty(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>Offered Bid Price (GH₵/{product.unit})</label>
                                                    <input 
                                                        type="number"
                                                        step="0.01"
                                                        placeholder={`e.g. ${(product.price * 0.9).toFixed(2)}`}
                                                        value={bulkPrice}
                                                        onChange={e => setBulkPrice(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="form-group">
                                                <label>Additional Delivery Details/Notes</label>
                                                <textarea 
                                                    placeholder="Requesting shipping to Accra main harbor, etc."
                                                    value={bulkComments}
                                                    onChange={e => setBulkComments(e.target.value)}
                                                />
                                            </div>
                                            <button type="submit" className="bulk-proposal-submit-btn">
                                                Submit Wholesale Proposal
                                            </button>
                                        </form>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Bottom Actions */}
                        <div className="product-modal__bottom-actions">
                            <div className="product-modal__stock-info">
                                <p className="product-modal__stock-status">In Stock</p>
                                <p className="product-modal__stock-count">{product.stock}</p>
                            </div>
                            <button
                                className="product-modal__add-btn"
                                onClick={() => { onAddToCart(product); onClose(); }}
                                style={hasCustomTheme ? { background: seller.shopTheme } : {}}
                            >
                                <ShoppingCart size={20} /> Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    )
}

function FarmerStorefrontModal({ farmerEmail, onClose, products = [], onAddToCart, onChat, currentUser, onSelectProduct }) {
    if (!farmerEmail) return null;

    // Look up seller in the localStorage user database
    const usersDB = JSON.parse(localStorage.getItem('agrolink_users') || '[]');
    const seller = usersDB.find(u => u.email === farmerEmail);

    // Filter products owned by this farmer
    const farmerProducts = products.filter(p => p && p.ownerEmail === farmerEmail);

    // Fallback info if seller is not registered in user DB
    const firstProduct = farmerProducts[0] || {};
    const farmName = seller?.name || seller?.farmName || firstProduct.farm || 'Farmer Storefront';
    const location = seller?.location || firstProduct.location || 'Ashanti Region';
    const phone = seller?.phone || firstProduct.phone || '+233 24 123 4567';
    const email = farmerEmail;
    
    const isVerified = seller?.verified || false;
    const isOrganic = seller?.organicCertified || false;
    const hasCustomTheme = seller?.shopTheme || false;
    const whatsappNum = seller?.whatsappNumber || '';
    const bannerImg = seller?.shopBanner || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80';
    const logoImg = seller?.shopLogo || seller?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(farmName)}&background=random`;
    const shopHours = seller?.shopHours || '8:00 AM - 5:00 PM';
    const bio = seller?.bio || seller?.shopDesc || firstProduct.description || 'Dedicated to cultivating high-quality products with sustainable farming practices.';

    return createPortal(
        <div className="farmer-modal-overlay" onClick={onClose}>
            <div 
                className="farmer-modal" 
                onClick={e => e.stopPropagation()}
                style={hasCustomTheme ? { borderColor: seller.shopTheme } : {}}
            >
                {/* Banner / Cover */}
                <div className="farmer-modal__banner">
                    <img src={bannerImg} alt="Store Banner" className="farmer-modal__banner-img" />
                    <button className="farmer-modal__close" onClick={onClose} aria-label="Close storefront">
                        <X size={24} />
                    </button>
                </div>

                {/* Profile Header Block */}
                <div className="farmer-modal__header">
                    <div className="farmer-modal__avatar-container" style={hasCustomTheme ? { background: seller.shopTheme } : {}}>
                        <img src={logoImg} alt={farmName} className="farmer-modal__avatar-img" />
                    </div>
                    <div className="farmer-modal__title-section">
                        <div className="farmer-modal__title-row">
                            <h2 className="farmer-modal__name">{farmName}</h2>
                            <div className="farmer-modal__badges">
                                {isVerified && <span className="badge-verified"><CheckCircle size={11} /> VERIFIED</span>}
                                {isOrganic && <span className="badge-organic"><Award size={11} /> ORGANIC</span>}
                            </div>
                        </div>
                        <p className="farmer-modal__contact-meta">
                            <span><MapPin size={13} /> {location}</span>
                            <span>•</span>
                            <span>{shopHours}</span>
                        </p>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="farmer-modal__body scroll-y">
                    <div className="farmer-modal__info-grid">
                        <div className="farmer-modal__about">
                            <h4 className="farmer-modal__section-title">About the Farm</h4>
                            <p className="farmer-modal__bio">{bio}</p>
                            
                            <div className="farmer-modal__details-list">
                                <p><strong>Email:</strong> {email}</p>
                                <p><strong>Phone:</strong> {phone}</p>
                            </div>
                        </div>

                        <div className="farmer-modal__actions-card">
                            <h4 className="farmer-modal__section-title">Contact Farmer</h4>
                            <div className="farmer-modal__action-buttons">
                                <a href={`tel:${phone}`} className="farmer-modal__btn farmer-modal__btn--call">
                                    <Phone size={16} /> Call Now
                                </a>
                                <button 
                                    className="farmer-modal__btn farmer-modal__btn--chat"
                                    onClick={() => onChat?.({ name: farmName, email: farmerEmail })}
                                >
                                    <MessageCircle size={16} /> Chat
                                </button>
                                {whatsappNum && (
                                    <a 
                                        href={`https://wa.me/${whatsappNum.replace(/\s+/g, '')}?text=Hi,%20I'm%20interested%20in%20buying%20from%20your%20farm.`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="farmer-modal__btn farmer-modal__btn--whatsapp"
                                    >
                                        <MessageCircle size={16} /> WhatsApp
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Products Grid */}
                    <div className="farmer-modal__products-section">
                        <h3 className="farmer-modal__products-title">Products by this Farm ({farmerProducts.length})</h3>
                        {farmerProducts.length === 0 ? (
                            <p className="farmer-modal__empty-products">This farm doesn't have any products listed in the marketplace currently.</p>
                        ) : (
                            <div className="farmer-modal__products-grid">
                                {farmerProducts.map(p => (
                                    <div 
                                        key={p.id} 
                                        className="farmer-product-card"
                                        onClick={() => {
                                            onSelectProduct?.(p);
                                        }}
                                        title={`View ${p.name} details`}
                                    >
                                        <div className="farmer-product-card__image">
                                            <img src={p.img} alt={p.name} />
                                            <button 
                                                className="farmer-product-card__add"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onAddToCart(p);
                                                }}
                                                title="Add to cart"
                                            >
                                                <ShoppingCart size={14} />
                                            </button>
                                        </div>
                                        <div className="farmer-product-card__info">
                                            <h5 className="farmer-product-card__name">{p.name}</h5>
                                            <div className="farmer-product-card__price-row">
                                                <span className="farmer-product-card__price">GH₵{parseFloat(p.price).toFixed(2)}</span>
                                                <span className="farmer-product-card__unit">/{p.unit}</span>
                                            </div>
                                            <span className="farmer-product-card__stock">{p.stock}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default function MarketplacePage({ 
    products = [], 
    users = [],
    cart = [], 
    onAddToCart, 
    onUpdateCartQty, 
    onRemoveFromCart, 
    onClearCart,
    onCheckout,
    onOpenCart,
    onOpenChat,
    currentUser,
    onAddBulkOrder,
    onIncrementView,
    selectedFarmerEmail,
    onOpenFarmerStore,
    onCloseFarmerStore
}) {
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [activeCategory, setActiveCategory] = useState('All')
    const [searchQuery, setSearchQuery] = useState('')


    // Prioritize Promoted & Featured listings and Real User Created products at the top
    const sortedListings = useMemo(() => {
        return [...products].sort((a, b) => {
            if (!a || !b) return 0;
            // 1. Featured / Promoted items
            const isAPromoted = a.featured || a.promoted ? 1 : 0;
            const isBPromoted = b.featured || b.promoted ? 1 : 0;
            if (isAPromoted !== isBPromoted) return isBPromoted - isAPromoted;

            // 2. Real user-created products vs default static items (id <= 102)
            const aIsRealUser = a._local || typeof a.id === 'string' || Number(a.id) > 1000 || (a.createdAt && !String(a.id).match(/^(1|2|3|4|5|6|10|11|12|13|14|15|16|17|18|19|20|21|22|23|24|25|26|27|101|102)$/));
            const bIsRealUser = b._local || typeof b.id === 'string' || Number(b.id) > 1000 || (b.createdAt && !String(b.id).match(/^(1|2|3|4|5|6|10|11|12|13|14|15|16|17|18|19|20|21|22|23|24|25|26|27|101|102)$/));
            if (aIsRealUser !== bIsRealUser) return bIsRealUser ? 1 : -1;

            // 3. Newest timestamp first
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : (typeof a.id === 'number' ? a.id : 0);
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : (typeof b.id === 'number' ? b.id : 0);
            return timeB - timeA;
        });
    }, [products]);

    const filtered = sortedListings.filter(p => {
        if (!p || !p.name) return false
        const matchesCategory = activeCategory === 'All' || p.category === activeCategory
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesCategory && matchesSearch
    })

    // Gather all active farmer promotions across the platform (100% real-time from active users)
    const activePromotions = useMemo(() => {
        const localUsers = JSON.parse(localStorage.getItem('agrolink_users') || '[]');
        const allUsersMap = new Map();

        // Merge users prop, localStorage users, and currentUser
        [...users, ...localUsers, ...(currentUser ? [currentUser] : [])].forEach(u => {
            if (u && u.email) {
                allUsersMap.set(u.email.toLowerCase().trim(), u);
            }
        });

        const promos = [];
        allUsersMap.forEach(user => {
            if (Array.isArray(user.promotions) && user.promotions.length > 0) {
                user.promotions.forEach(p => {
                    if (p && p.active) {
                        const farmerProducts = products.filter(prod => prod.ownerEmail?.toLowerCase().trim() === user.email.toLowerCase().trim());
                        const matchedProd = farmerProducts.find(prod => String(prod.id) === String(p.productId)) || farmerProducts[0];
                        if (matchedProd && !promos.some(existing => String(existing.id) === String(p.id))) {
                            promos.push({
                                ...p,
                                farmerName: user.name || matchedProd.farm,
                                farmerAvatar: user.avatar,
                                targetProduct: matchedProd
                            });
                        }
                    }
                });
            }
        });

        return promos;
    }, [products, users, currentUser]);

    const [currentPromoIndex, setCurrentPromoIndex] = useState(0);

    // Auto-rotate ticker every 5 seconds if multiple active promos exist
    useEffect(() => {
        if (activePromotions.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentPromoIndex(prev => (prev + 1) % activePromotions.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [activePromotions]);

    // Fetch upcoming harvests from all premium sellers in database
    const upcomingHarvests = useMemo(() => {
        const usersDB = JSON.parse(localStorage.getItem('agrolink_users') || '[]');
        const harvests = [];
        usersDB.forEach(user => {
            if (user.harvests && user.harvests.length > 0) {
                user.harvests.forEach(h => {
                    if (h.status !== 'completed') {
                        harvests.push({ ...h, farmerName: user.name, farmerEmail: user.email });
                    }
                });
            }
        });
        return harvests;
    }, []);

    // Look up seller attributes for display badges
    const getSellerStatus = (email) => {
        if (!email) return { verified: false, organic: false };
        if (email === 'james.asante@agrolink.gh') return { verified: true, organic: true };
        const usersDB = JSON.parse(localStorage.getItem('agrolink_users') || '[]');
        const found = usersDB.find(u => u.email === email);
        return {
            verified: found?.verified || false,
            organic: found?.organicCertified || false
        };
    };

    return (
        <div className="marketplace-page">
            <header className="marketplace-header">
                <h1 className="marketplace-header__title">Marketplace</h1>
                <div className="marketplace-header__center">
                    <input
                        className="marketplace-search"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <button
                    className="marketplace-header__cart"
                    aria-label="Cart"
                    onClick={onOpenCart}
                >
                    <ShoppingCart size={20} />
                    {cart.length > 0 && (
                        <span className="marketplace-header__cart-badge">
                            {cart.reduce((a, i) => a + i.qty, 0)}
                        </span>
                    )}
                </button>
            </header>

            {/* ═══ FLOATING SHOP PROMOS NEWS TICKER ═══ */}
            {activePromotions.length > 0 && (
                <div className="marketplace-floating-promo-bar fade-in">
                    <div className="floating-promo-badge">
                        <span className="pulse-dot" />
                        <Tag size={13} /> PROMO ALERT
                    </div>
                    
                    <div 
                        className="floating-promo-content"
                        onClick={() => {
                            const promo = activePromotions[currentPromoIndex];
                            if (promo && promo.targetProduct) {
                                setSelectedProduct(promo.targetProduct);
                                onIncrementView?.(promo.targetProduct.ownerEmail);
                            }
                        }}
                        title="Click to view promo deal & product details"
                    >
                        <div className="floating-promo-text-wrap">
                            <span className="promo-farm-name">
                                {activePromotions[currentPromoIndex]?.farmerName}:
                            </span>
                            <strong className="promo-title">
                                {activePromotions[currentPromoIndex]?.title}
                            </strong>
                            <span className="promo-value-tag">
                                {activePromotions[currentPromoIndex]?.type === 'percent'
                                    ? `${activePromotions[currentPromoIndex]?.value}% OFF`
                                    : activePromotions[currentPromoIndex]?.type === 'fixed'
                                    ? `GH₵${activePromotions[currentPromoIndex]?.value} OFF`
                                    : 'SPECIAL DEAL'}
                            </span>
                            {activePromotions[currentPromoIndex]?.code && (
                                <span className="promo-code-chip">
                                    Code: <code>{activePromotions[currentPromoIndex]?.code}</code>
                                </span>
                            )}
                            <span className="promo-target-product">
                                on <strong>{activePromotions[currentPromoIndex]?.targetProduct?.name}</strong>
                            </span>
                        </div>
                        
                        <div className="floating-promo-cta">
                            <span>View Deal</span>
                            <ArrowRight size={14} />
                        </div>
                    </div>

                    {activePromotions.length > 1 && (
                        <div className="floating-promo-controls">
                            <span className="promo-counter">{currentPromoIndex + 1}/{activePromotions.length}</span>
                        </div>
                    )}
                </div>
            )}

            <div className="category-chips">
                {categories.map(cat => (
                    <button
                        key={cat}
                        className={`category-chip ${activeCategory === cat ? 'category-chip--active' : ''}`}
                        onClick={() => setActiveCategory(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="products-list">
                {filtered.map(product => {
                    const status = getSellerStatus(product.ownerEmail);
                    const matchingPromo = activePromotions.find(p => String(p.targetProduct?.id) === String(product.id) || String(p.productId) === String(product.id));
                    return (
                        <div
                            key={product.id}
                            className={`product-card ${(product.featured || product.promoted || matchingPromo) ? 'product-card--promoted' : ''}`}
                            onClick={() => {
                                setSelectedProduct(product);
                                onIncrementView?.(product.ownerEmail);
                            }}
                        >
                            <div className="product-card__image-container">
                                <img src={product.img} alt={product.name} className="product-card__img" />
                                <button
                                    className="product-card__quick-add"
                                    onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
                                >
                                    <ShoppingCart size={16} />
                                </button>
                                {matchingPromo ? (
                                    <span className="badge-featured-tag badge-promoted-tag" style={{ background: '#DC2626', color: '#fff' }}>
                                        <Tag size={9} /> {matchingPromo.type === 'percent' ? `${matchingPromo.value}% OFF` : matchingPromo.type === 'fixed' ? `GH₵${matchingPromo.value} OFF` : 'PROMO DEAL'}
                                    </span>
                                ) : (product.featured || product.promoted) ? (
                                    <span className="badge-featured-tag badge-promoted-tag"><Sparkles size={9} /> ⭐ PROMOTED</span>
                                ) : null}
                            </div>
                            <div className="product-card__info">
                                <div className="card-badge-line">
                                    <span
                                        className="product-card__badge"
                                        style={{ background: product.badgeColor ?? '#E8F5E9', color: product.badgeTextColor ?? '#2E7D32' }}
                                    >
                                        {product.badge}
                                    </span>
                                    {status.verified && <span className="mini-badge-verified">✓</span>}
                                    {status.organic && <span className="mini-badge-organic">☘</span>}
                                </div>
                                <h3 className="product-card__name">{product.name}</h3>
                                <div className="product-card__meta">
                                    <span 
                                        className="clickable-farm-name"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onOpenFarmerStore?.(product.ownerEmail);
                                        }}
                                        title={`View ${product.farm} storefront`}
                                    >
                                        <Building2 size={13} /> {product.farm}
                                    </span>
                                    <span><MapPin size={13} /> {product.location}</span>
                                    <span><Phone size={13} /> {product.phone}</span>
                                </div>
                                <div className="product-card__bottom">
                                    <span className="product-card__price">
                                        GH₵{parseFloat(product.price).toFixed(2)}
                                        <span className="product-card__unit">/{product.unit}</span>
                                    </span>
                                    <div className="product-card__rating">
                                        ★ {product.rating ?? '5.0'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Upcoming Harvest Forecast Widget */}
            {upcomingHarvests.length > 0 && (
                <div className="marketplace-harvests-widget">
                    <h3 className="widget-title"><Calendar size={18} /> Upcoming Farm Harvest Schedules</h3>
                    <p className="widget-desc">Pre-order or schedule enquiries directly with farmers for upcoming crop batches.</p>
                    <div className="harvest-widget-grid">
                        {upcomingHarvests.map(h => (
                          <div key={h.id} className="harvest-widget-card">
                              <div className="harvest-widget-header">
                                  <span className="crop-name">{h.crop}</span>
                                  <span className={`h-status status-${h.status}`}>{h.status}</span>
                              </div>
                              <p className="farmer-name">Farm: {h.farmerName}</p>
                              <div className="harvest-dates-row">
                                  <span>Est. Yield: <strong>{h.quantity || 'TBD'}</strong></span>
                                  <span>Harvest: <strong>{h.expectedHarvestDate}</strong></span>
                              </div>
                          </div>
                        ))}
                    </div>
                </div>
            )}

            <ProductModal
                product={selectedProduct}
                onClose={() => setSelectedProduct(null)}
                onAddToCart={onAddToCart}
                onChat={onOpenChat}
                onAddBulkOrder={onAddBulkOrder}
                currentUser={currentUser}
                onOpenFarmerStore={onOpenFarmerStore}
            />

            <FarmerStorefrontModal
                farmerEmail={selectedFarmerEmail}
                onClose={onCloseFarmerStore}
                products={products}
                onAddToCart={onAddToCart}
                onChat={onOpenChat}
                currentUser={currentUser}
                onSelectProduct={(p) => {
                    setSelectedProduct(p);
                    onCloseFarmerStore();
                }}
            />

        </div>
    )
}
