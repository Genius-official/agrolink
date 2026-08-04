import { useState } from 'react'
import { CheckCircle, ImagePlus, X, Trash2, Package, PlusCircle, LayoutGrid, Sparkles, Lock, Store, Calendar, Users, Percent, HelpCircle, AlertCircle, RefreshCw, Send, Phone } from 'lucide-react'
import './MyShopPage.css'

const categories = ['Vegetables', 'Grains', 'Fruits', 'Machinery', 'Fertilizers', 'Livestock', 'Processed Foods']
const units = ['kg', 'bag', 'bunch', 'crate', 'tonne', 'piece', 'litre']

const defaultForm = { name: '', category: 'Vegetables', price: '', unit: 'kg', stock: '', description: '', img: '' }

export default function MyShopPage({ 
  products = [], 
  allProducts = [], 
  onAddProduct, 
  onUpdateProduct, 
  onDeleteProduct, 
  currentUser, 
  onUpdateProfile, 
  bulkOrders = [], 
  onUpdateBulkOrder 
}) {
  const userListings = products;
  const [activeTab, setActiveTab] = useState('inventory') // 'inventory', 'add', 'store', 'promotions', 'harvest', 'staff', 'bulk'
  const [editingProduct, setEditingProduct] = useState(null)
  const [form, setForm] = useState(defaultForm)
  const [success, setSuccess] = useState(false)

  // Low stock threshold config
  const thresholdValue = currentUser?.lowStockThreshold ?? 10
  const [thresholdInput, setThresholdInput] = useState(thresholdValue)

  // Promotion input states
  const [promoForm, setPromoForm] = useState({ title: '', type: 'percent', value: '', code: '', productId: '', active: true })
  // Harvest input states
  const [harvestForm, setHarvestForm] = useState({ crop: '', plantingDate: '', expectedHarvestDate: '', quantity: '', status: 'planting' })
  // Staff input states
  const [staffForm, setStaffForm] = useState({ name: '', role: 'Sales Assistant', permissions: ['view_inventory'] })

  // Lock checker helper
  const userPlan = currentUser?.plan || 'free';
  const getTabStatus = (tabId) => {
    if (tabId === 'inventory' || tabId === 'add') return 'unlocked';
    if (tabId === 'store' || tabId === 'promotions') {
      return (userPlan === 'starter' || userPlan === 'business') ? 'unlocked' : 'locked_starter';
    }
    // harvest, staff, bulk
    return userPlan === 'business' ? 'unlocked' : 'locked_business';
  };

  const handleSaveThreshold = () => {
    onUpdateProfile?.({ ...currentUser, lowStockThreshold: parseInt(thresholdInput) || 10 });
    alert("Low stock threshold updated!");
  };

  // AI Price Suggestion logic
  const aiSuggestedPrice = () => {
    if (!form.category) return null;
    const matchingProducts = allProducts.filter(p => p.category === form.category);
    if (matchingProducts.length === 0) return null;
    const avg = matchingProducts.reduce((sum, p) => sum + parseFloat(p.price || 0), 0) / matchingProducts.length;
    // Suggest standard price, slightly rounded
    return avg.toFixed(2);
  };

  const applyAISuggestion = () => {
    const sug = aiSuggestedPrice();
    if (sug) {
      setForm(prev => ({ ...prev, price: sug }));
    }
  };

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name || !form.price || !form.stock) return

    if (editingProduct) {
      onUpdateProduct({ ...editingProduct, ...form })
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setEditingProduct(null)
        setActiveTab('inventory')
      }, 1500)
    } else {
      onAddProduct(form)
      setForm(defaultForm)
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setActiveTab('inventory')
      }, 2000)
    }
  }

  const startEdit = (product) => {
    setEditingProduct(product)
    setForm({
      name: product.name,
      category: product.category,
      price: product.price,
      unit: product.unit,
      stock: parseFloat(product.stock),
      description: product.description || '',
      img: product.img || ''
    })
    setActiveTab('add')
  }

  const cancelEdit = () => {
    setEditingProduct(null)
    setForm(defaultForm)
    setActiveTab('inventory')
  }

  // --- SUBMIT COMPONENT STATES ---
  // Store customized preferences
  const [storeCustom, setStoreCustom] = useState({
    shopLogo: currentUser?.shopLogo || '',
    shopBanner: currentUser?.shopBanner || '',
    shopDesc: currentUser?.shopDesc || '',
    shopTheme: currentUser?.shopTheme || '#3B823E',
    whatsappNumber: currentUser?.whatsappNumber || '',
    shopHours: currentUser?.shopHours || '8:00 AM - 6:00 PM',
    shopSocials: currentUser?.shopSocials || { facebook: '', instagram: '' }
  });

  const handleSaveStoreSettings = (e) => {
    e.preventDefault();
    onUpdateProfile?.({ ...currentUser, ...storeCustom });
    alert("Store settings saved successfully!");
  };

  // Promo actions
  const handleAddPromo = (e) => {
    e.preventDefault();
    if (!promoForm.title || !promoForm.value) return;
    const currentPromos = currentUser?.promotions || [];
    const selectedProd = userListings.find(p => String(p.id) === String(promoForm.productId));
    const newPromo = {
      ...promoForm,
      id: Date.now(),
      productName: selectedProd?.name || 'All Store Products',
      farmName: currentUser?.name || 'Farm Store'
    };
    const updated = [newPromo, ...currentPromos];
    onUpdateProfile?.({ ...currentUser, promotions: updated });
    setPromoForm({ title: '', type: 'percent', value: '', code: '', productId: '', active: true });
  };

  const handleTogglePromo = (id) => {
    const currentPromos = currentUser?.promotions || [];
    const updated = currentPromos.map(p => String(p.id) === String(id) ? { ...p, active: !p.active } : p);
    onUpdateProfile?.({ ...currentUser, promotions: updated });
  };

  const handleDeletePromo = (id) => {
    const currentPromos = currentUser?.promotions || [];
    const updated = currentPromos.filter(p => String(p.id) !== String(id));
    onUpdateProfile?.({ ...currentUser, promotions: updated });
  };

  // Harvest actions
  const handleAddHarvest = (e) => {
    e.preventDefault();
    if (!harvestForm.crop || !harvestForm.plantingDate) return;
    const currentHarvests = currentUser?.harvests || [];
    const updated = [{ ...harvestForm, id: Date.now() }, ...currentHarvests];
    onUpdateProfile?.({ ...currentUser, harvests: updated });
    setHarvestForm({ crop: '', plantingDate: '', expectedHarvestDate: '', quantity: '', status: 'planting' });
  };

  const handleUpdateHarvestStatus = (id, newStatus) => {
    const currentHarvests = currentUser?.harvests || [];
    const updated = currentHarvests.map(h => h.id === id ? { ...h, status: newStatus } : h);
    onUpdateProfile?.({ ...currentUser, harvests: updated });
  };

  const handleDeleteHarvest = (id) => {
    const currentHarvests = currentUser?.harvests || [];
    const updated = currentHarvests.filter(h => h.id !== id);
    onUpdateProfile?.({ ...currentUser, harvests: updated });
  };

  // Staff actions
  const handleAddStaff = (e) => {
    e.preventDefault();
    if (!staffForm.name) return;
    const currentStaff = currentUser?.staff || [];
    const updated = [{ ...staffForm, id: Date.now() }, ...currentStaff];
    onUpdateProfile?.({ ...currentUser, staff: updated });
    setStaffForm({ name: '', role: 'Sales Assistant', permissions: ['view_inventory'] });
  };

  const handleDeleteStaff = (id) => {
    const currentStaff = currentUser?.staff || [];
    const updated = currentStaff.filter(s => s.id !== id);
    onUpdateProfile?.({ ...currentUser, staff: updated });
  };

  // Check which products are low in stock
  const lowStockListings = products.filter(p => {
    const val = parseFloat(p.stock);
    return !isNaN(val) && val <= thresholdValue;
  });

  // Render Lock/Upgrade Alert Screen
  const renderLockScreen = (requiredPlan) => {
    return (
      <div className="myshop-lock-screen fade-in">
        <div className="lock-icon-box"><Lock size={40} /></div>
        <h3>Premium Feature Locked</h3>
        <p>
          Store personalization, WhatsApp links, discounts, calendar schedules, staff files, and bulk negotiations require a <strong>{requiredPlan.toUpperCase()} Plan</strong>.
        </p>
        <button 
          className="btn-primary upgrade-jump-btn"
          onClick={() => { window.location.hash = '#premium'; }}
        >
          <Sparkles size={16} /> View Upgrade Options
        </button>
      </div>
    );
  };

  const currentTabStatus = getTabStatus(activeTab);

  return (
    <div className="myshop-page">
      <header className="myshop-header">
        <div className="myshop-header__top">
          <h1 className="myshop-header__title">My Shop</h1>
          
          {/* Main Sub Navigation Tabs */}
          <div className="myshop-tabs">
            <button
              className={`myshop-tab ${activeTab === 'inventory' ? 'myshop-tab--active' : ''}`}
              onClick={() => setActiveTab('inventory')}
            >
              <Package size={18} /> Inventory
            </button>
            <button
              className={`myshop-tab ${activeTab === 'add' ? 'myshop-tab--active' : ''}`}
              onClick={() => {
                if (activeTab === 'inventory') {
                  setEditingProduct(null)
                  setForm(defaultForm)
                }
                setActiveTab('add')
              }}
            >
              <PlusCircle size={18} /> {editingProduct ? 'Edit Details' : 'Add Item'}
            </button>
            <button
              className={`myshop-tab ${activeTab === 'store' ? 'myshop-tab--active' : ''}`}
              onClick={() => setActiveTab('store')}
            >
              <Store size={18} /> Store settings
            </button>
            <button
              className={`myshop-tab ${activeTab === 'promotions' ? 'myshop-tab--active' : ''}`}
              onClick={() => setActiveTab('promotions')}
            >
              <Percent size={18} /> Promos
            </button>
            <button
              className={`myshop-tab ${activeTab === 'harvest' ? 'myshop-tab--active' : ''}`}
              onClick={() => setActiveTab('harvest')}
            >
              <Calendar size={18} /> Harvests
            </button>
            <button
              className={`myshop-tab ${activeTab === 'staff' ? 'myshop-tab--active' : ''}`}
              onClick={() => setActiveTab('staff')}
            >
              <Users size={18} /> Staff
            </button>
            <button
              className={`myshop-tab ${activeTab === 'bulk' ? 'myshop-tab--active' : ''}`}
              onClick={() => setActiveTab('bulk')}
            >
              <CheckCircle size={18} /> Bulk Requests
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="myshop-body">
        
        {/* Render Lock screen overlay if needed */}
        {currentTabStatus !== 'unlocked' ? (
          renderLockScreen(currentTabStatus === 'locked_starter' ? 'Starter' : 'Business')
        ) : (
          <>
            {/* INVENTORY TAB */}
            {activeTab === 'inventory' && (
              <div className="inventory-view fade-in">
                {/* Low Stock Warning Alert banner */}
                {lowStockListings.length > 0 && (
                  <div className="low-stock-alert-banner">
                    <div className="alert-content">
                      <AlertCircle size={20} />
                      <span>
                        <strong>Inventory Notice:</strong> You have {lowStockListings.length} product(s) running low on stock (under {thresholdValue} units).
                      </span>
                    </div>
                  </div>
                )}

                <div className="inventory-header">
                  <h3 className="inventory-header__title">Active Listings ({userListings.length})</h3>
                  
                  {/* Threshold Settings config */}
                  <div className="threshold-config-box">
                    <label>Alert Threshold:</label>
                    <input 
                      type="number" 
                      value={thresholdInput} 
                      onChange={e => setThresholdInput(e.target.value)}
                    />
                    <button className="btn-secondary btn-sm" onClick={handleSaveThreshold}>Save</button>
                  </div>
                </div>

                {userListings.length > 0 ? (
                  <div className="listings-grid">
                    {userListings.map(item => {
                      const isLowStock = parseFloat(item.stock) <= thresholdValue;
                      return (
                        <div key={item.id} className={`listing-item ${isLowStock ? 'listing-item--alert' : ''}`}>
                          <div className="listing-item__img-box">
                            <img src={item.img} alt={item.name} className="listing-item__img" />
                            {item.featured && <span className="featured-badge-overlay"><Sparkles size={11} /> FEATURED</span>}
                          </div>
                          <div className="listing-item__info">
                            <div className="listing-item__top-row">
                              <p className="listing-item__name">{item.name}</p>
                              <span className="listing-item__category">{item.category}</span>
                            </div>
                            <div className="listing-item__price-info">
                              <span className="listing-item__price">GH₵{parseFloat(item.price).toFixed(2)}</span>
                              <span className="listing-item__unit">/{item.unit}</span>
                            </div>
                            <p className={`listing-item__stock ${isLowStock ? 'stock-low' : ''}`}>
                              {item.stock} {isLowStock && '(Low Stock!)'}
                            </p>
                          </div>
                          <div className="listing-item__actions">
                            <button className="listing-item__edit" onClick={() => startEdit(item)}>
                              Edit
                            </button>
                            <button
                              className="listing-item__remove"
                              onClick={() => onDeleteProduct(item.id)}
                              aria-label="Remove"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-listings">
                    <div className="empty-listings__icon"><LayoutGrid size={48} /></div>
                    <p>You haven't listed any products yet.</p>
                    <button className="btn-secondary" onClick={() => setActiveTab('add')}>
                      Start Selling Today
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ADD PRODUCT TAB */}
            {activeTab === 'add' && (
              <div className="add-product-view fade-in">
                <div className="myshop-form-card">
                  <div className="myshop-form-card__top">
                    <h3 className="myshop-form-card__heading">
                      {editingProduct ? 'Edit Product Details' : 'Product Details'}
                    </h3>
                    <p className="myshop-form-card__sub">
                      {editingProduct ? 'Update the information for your listing' : 'Complete the information below to list your item'}
                    </p>
                  </div>

                  {success ? (
                    <div className="myshop-success-message fade-in">
                      <div className="myshop-success-icon"><CheckCircle size={48} color="#059669" /></div>
                      <h4>{editingProduct ? 'Product Updated Successfully' : 'Product Added Successfully!'}</h4>
                      <p>Redirecting to your inventory...</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="myshop-form">
                      <div className="form-group">
                        <label className="input-label">Product Name</label>
                        <input
                          className="input-field"
                          placeholder="e.g. Fresh Tomatoes"
                          value={form.name}
                          onChange={e => handleChange('name', e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="input-label">Category</label>
                        <select
                          className="input-field"
                          value={form.category}
                          onChange={e => handleChange('category', e.target.value)}
                        >
                          {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="input-label">Product Image</label>
                        <div className="myshop-image-upload-area">
                          {!form.img ? (
                            <label className="myshop-image-upload-label">
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="myshop-image-file-input"
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      handleChange('img', reader.result);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                              <div className="myshop-upload-placeholder">
                                <ImagePlus size={32} color="var(--text-muted)" />
                                <p><span>Click to upload</span> or drag and drop</p>
                                <span className="myshop-upload-hint">SVG, PNG, JPG or GIF (max. 5MB)</span>
                              </div>
                            </label>
                          ) : (
                            <div className="myshop-image-preview-container">
                              <img src={form.img} alt="Product Preview" className="myshop-uploaded-img" />
                              <button 
                                type="button" 
                                className="myshop-remove-img"
                                onClick={() => handleChange('img', '')}
                              >
                                <X size={16} /> Remove
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* AI Price suggestions (Business Plan only) */}
                      {userPlan === 'business' && aiSuggestedPrice() && (
                        <div className="ai-price-helper">
                          <Sparkles size={16} className="text-purple" />
                          <span>AI Competitive Price Suggestion: <strong>GH₵ {aiSuggestedPrice()}</strong> per {form.unit}</span>
                          <button type="button" className="btn-apply-ai" onClick={applyAISuggestion}>Apply Price</button>
                        </div>
                      )}

                      <div className="form-row">
                        <div className="form-group form-group--flex">
                          <label className="input-label">Price (GH₵)</label>
                          <input
                            className="input-field"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={form.price}
                            onChange={e => handleChange('price', e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group form-group--flex">
                          <label className="input-label">Unit</label>
                          <select
                            className="input-field"
                            value={form.unit}
                            onChange={e => handleChange('unit', e.target.value)}
                          >
                            {units.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="input-label">Available Stock (Quantity)</label>
                        <input
                          className="input-field"
                          type="number"
                          min="0"
                          placeholder="e.g. 50"
                          value={form.stock}
                          onChange={e => handleChange('stock', e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="input-label">Description (optional)</label>
                        <textarea
                          className="input-field input-field--textarea"
                          placeholder="Describe your product quality, origin, etc."
                          rows={4}
                          value={form.description}
                          onChange={e => handleChange('description', e.target.value)}
                        />
                      </div>

                      {/* Featured product toggle (Starter & Business) */}
                      {(userPlan === 'starter' || userPlan === 'business') && (
                        <div className="featured-toggle-row">
                          <label className="toggle-label-checkbox">
                            <input 
                              type="checkbox"
                              checked={form.featured || false}
                              onChange={e => handleChange('featured', e.target.checked)}
                            />
                            <span>Mark as <strong>Featured Product</strong> (Pushes to top of search results and homepage)</span>
                          </label>
                        </div>
                      )}

                      <div className="form-actions">
                        <button type="button" className="btn-ghost" onClick={cancelEdit}>
                          Cancel
                        </button>
                        <button type="submit" className="btn-primary myshop-submit">
                          <CheckCircle size={18} /> {editingProduct ? 'Save Changes' : 'List Product Now'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* STORE CONFIG TAB */}
            {activeTab === 'store' && (
              <div className="store-config-view fade-in">
                <div className="myshop-form-card">
                  <h3 className="myshop-form-card__heading">Customize Store Front</h3>
                  <p className="myshop-form-card__sub">Personalize how buyers see your profile in the Marketplace</p>
                  
                  <form onSubmit={handleSaveStoreSettings} className="myshop-form">
                    <div className="form-row">
                      <div className="form-group form-group--flex">
                        <label className="input-label">Store Logo URL</label>
                        <input 
                          className="input-field"
                          value={storeCustom.shopLogo}
                          onChange={e => setStoreCustom(prev => ({ ...prev, shopLogo: e.target.value }))}
                          placeholder="https://example.com/logo.jpg"
                        />
                      </div>
                      <div className="form-group form-group--flex">
                        <label className="input-label">Store Theme Color</label>
                        <input 
                          type="color"
                          className="input-field input-color-picker"
                          value={storeCustom.shopTheme}
                          onChange={e => setStoreCustom(prev => ({ ...prev, shopTheme: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="input-label">Cover Banner Image URL</label>
                      <input 
                        className="input-field"
                        value={storeCustom.shopBanner}
                        onChange={e => setStoreCustom(prev => ({ ...prev, shopBanner: e.target.value }))}
                        placeholder="https://example.com/banner.jpg"
                      />
                    </div>

                    <div className="form-group">
                      <label className="input-label">Store Description</label>
                      <textarea 
                        className="input-field input-field--textarea"
                        value={storeCustom.shopDesc}
                        onChange={e => setStoreCustom(prev => ({ ...prev, shopDesc: e.target.value }))}
                        placeholder="Welcome to our premium farm store!"
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group form-group--flex">
                        <label className="input-label">WhatsApp Number</label>
                        <input 
                          className="input-field"
                          value={storeCustom.whatsappNumber}
                          onChange={e => setStoreCustom(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                          placeholder="e.g. +233241234567"
                        />
                      </div>
                      <div className="form-group form-group--flex">
                        <label className="input-label">Business Hours</label>
                        <input 
                          className="input-field"
                          value={storeCustom.shopHours}
                          onChange={e => setStoreCustom(prev => ({ ...prev, shopHours: e.target.value }))}
                          placeholder="e.g. 8:00 AM - 6:00 PM"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group form-group--flex">
                        <label className="input-label">Facebook Profile Link</label>
                        <input 
                          className="input-field"
                          value={storeCustom.shopSocials.facebook}
                          onChange={e => setStoreCustom(prev => ({ 
                            ...prev, 
                            shopSocials: { ...prev.shopSocials, facebook: e.target.value } 
                          }))}
                          placeholder="https://facebook.com/myfarm"
                        />
                      </div>
                      <div className="form-group form-group--flex">
                        <label className="input-label">Instagram Handle</label>
                        <input 
                          className="input-field"
                          value={storeCustom.shopSocials.instagram}
                          onChange={e => setStoreCustom(prev => ({ 
                            ...prev, 
                            shopSocials: { ...prev.shopSocials, instagram: e.target.value } 
                          }))}
                          placeholder="@myfarm_gh"
                        />
                      </div>
                    </div>

                    <button type="submit" className="btn-primary">Save Store Customization</button>
                  </form>
                </div>
              </div>
            )}

            {/* PROMOTIONS TAB */}
            {activeTab === 'promotions' && (
              <div className="promotions-view fade-in">
                <div className="myshop-grid-layout">
                  {/* Create promo form */}
                  <div className="myshop-form-card">
                    <h3 className="myshop-form-card__heading">Create Promotional Discount</h3>
                    <p className="myshop-form-card__sub">Apply percentage or fixed discounts on your listings</p>
                    
                    <form onSubmit={handleAddPromo} className="myshop-form">
                      <div className="form-group">
                        <label className="input-label">Promotion Campaign Title</label>
                        <input 
                          className="input-field"
                          placeholder="e.g. Farmers Day Sale"
                          value={promoForm.title}
                          onChange={e => setPromoForm(prev => ({ ...prev, title: e.target.value }))}
                          required
                        />
                      </div>

                      <div className="form-row">
                        <div className="form-group form-group--flex">
                          <label className="input-label">Discount Type</label>
                          <select 
                            className="input-field"
                            value={promoForm.type}
                            onChange={e => setPromoForm(prev => ({ ...prev, type: e.target.value }))}
                          >
                            <option value="percent">Percentage Off (%)</option>
                            <option value="fixed">Fixed Amount Off (GH₵)</option>
                            <option value="bogo">Buy One Get One (BOGO)</option>
                            <option value="flash">Flash Sale</option>
                          </select>
                        </div>

                        <div className="form-group form-group--flex">
                          <label className="input-label">Discount Value</label>
                          <input 
                            type="number"
                            className="input-field"
                            placeholder="e.g. 15"
                            value={promoForm.value}
                            onChange={e => setPromoForm(prev => ({ ...prev, value: e.target.value }))}
                            required
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="input-label">Target Product on Sale</label>
                        <select 
                          className="input-field"
                          value={promoForm.productId}
                          onChange={e => setPromoForm(prev => ({ ...prev, productId: e.target.value }))}
                        >
                          <option value="">-- Select Specific Product --</option>
                          {userListings.map(prod => (
                            <option key={prod.id} value={prod.id}>
                              {prod.name} (GH₵ {parseFloat(prod.price || 0).toFixed(2)} / {prod.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="input-label">Promo Code (Optional)</label>
                        <input 
                          className="input-field"
                          placeholder="e.g. AGRO15"
                          value={promoForm.code}
                          onChange={e => setPromoForm(prev => ({ ...prev, code: e.target.value }))}
                        />
                      </div>

                      <button type="submit" className="btn-primary">Add Promo Campaign</button>
                    </form>
                  </div>

                  {/* Active promo list */}
                  <div className="promos-list-card">
                    <h3 className="section-subtitle">Active Discount Campaigns</h3>
                    <div className="promos-container-vertical">
                      {(currentUser?.promotions || []).length > 0 ? (
                        currentUser.promotions.map(p => (
                          <div key={p.id} className={`promo-item-card ${p.active ? '' : 'promo-inactive'}`}>
                            <div className="promo-item-info">
                              <h4>{p.title}</h4>
                              <p className="promo-details">
                                {p.type.toUpperCase()}: {p.type === 'percent' ? `${p.value}% Off` : `GH₵${p.value} Off`}
                                {p.code && ` (Code: ${p.code})`}
                              </p>
                            </div>
                            <div className="promo-item-actions">
                              <button 
                                className={`btn-status-toggle ${p.active ? 'active' : ''}`}
                                onClick={() => handleTogglePromo(p.id)}
                              >
                                {p.active ? 'Pause' : 'Activate'}
                              </button>
                              <button className="btn-delete-item" onClick={() => handleDeletePromo(p.id)}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="empty-helper-text">No active promotions created. Add one above.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* HARVEST CALENDAR TAB */}
            {activeTab === 'harvest' && (
              <div className="harvest-view fade-in">
                <div className="myshop-grid-layout">
                  {/* Log Harvest Form */}
                  <div className="myshop-form-card">
                    <h3 className="myshop-form-card__heading">Schedule Harvest Entry</h3>
                    <p className="myshop-form-card__sub">Publish upcoming harvest details to buyers</p>
                    
                    <form onSubmit={handleAddHarvest} className="myshop-form">
                      <div className="form-group">
                        <label className="input-label">Crop Name</label>
                        <input 
                          className="input-field"
                          placeholder="e.g. Yellow Maize"
                          value={harvestForm.crop}
                          onChange={e => setHarvestForm(prev => ({ ...prev, crop: e.target.value }))}
                          required
                        />
                      </div>

                      <div className="form-row">
                        <div className="form-group form-group--flex">
                          <label className="input-label">Planting Date</label>
                          <input 
                            type="date"
                            className="input-field"
                            value={harvestForm.plantingDate}
                            onChange={e => setHarvestForm(prev => ({ ...prev, plantingDate: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="form-group form-group--flex">
                          <label className="input-label">Expected Harvest</label>
                          <input 
                            type="date"
                            className="input-field"
                            value={harvestForm.expectedHarvestDate}
                            onChange={e => setHarvestForm(prev => ({ ...prev, expectedHarvestDate: e.target.value }))}
                            required
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group form-group--flex">
                          <label className="input-label">Est. Quantity</label>
                          <input 
                            className="input-field"
                            placeholder="e.g. 500 bags"
                            value={harvestForm.quantity}
                            onChange={e => setHarvestForm(prev => ({ ...prev, quantity: e.target.value }))}
                          />
                        </div>
                        <div className="form-group form-group--flex">
                          <label className="input-label">Status</label>
                          <select 
                            className="input-field"
                            value={harvestForm.status}
                            onChange={e => setHarvestForm(prev => ({ ...prev, status: e.target.value }))}
                          >
                            <option value="planting">Growing/Planting</option>
                            <option value="maturing">Maturing</option>
                            <option value="harvesting">Harvesting Now</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                      </div>

                      <button type="submit" className="btn-primary">Add Harvest Schedule</button>
                    </form>
                  </div>

                  {/* Harvest Calendar timeline */}
                  <div className="promos-list-card">
                    <h3 className="section-subtitle">Upcoming Harvest Forecast</h3>
                    <div className="harvest-calendar-timeline">
                      {(currentUser?.harvests || []).length > 0 ? (
                        currentUser.harvests.map(h => (
                          <div key={h.id} className="harvest-timeline-item">
                            <div className="harvest-timeline-badge">
                              <Calendar size={14} />
                            </div>
                            <div className="harvest-timeline-details">
                              <h4>{h.crop}</h4>
                              <p className="harvest-dates">
                                Planted: {h.plantingDate} | Harvest: <strong>{h.expectedHarvestDate}</strong>
                              </p>
                              <p className="harvest-yield">Est. Yield: {h.quantity || 'TBD'}</p>
                              <div className="harvest-status-row">
                                <span className={`harvest-status-indicator status-${h.status}`}>
                                  {h.status.toUpperCase()}
                                </span>
                                <div className="status-quick-actions">
                                  <button onClick={() => handleUpdateHarvestStatus(h.id, 'harvesting')}>Harvest</button>
                                  <button onClick={() => handleUpdateHarvestStatus(h.id, 'completed')}>Done</button>
                                </div>
                              </div>
                            </div>
                            <button className="btn-delete-harvest" onClick={() => handleDeleteHarvest(h.id)}>
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="empty-helper-text">No harvests logged yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STAFF ACCOUNTS TAB */}
            {activeTab === 'staff' && (
              <div className="staff-view fade-in">
                <div className="myshop-grid-layout">
                  {/* Create staff form */}
                  <div className="myshop-form-card">
                    <h3 className="myshop-form-card__heading">Register Staff Account</h3>
                    <p className="myshop-form-card__sub">Assign store managers, sales clerks, or inventory team</p>
                    
                    <form onSubmit={handleAddStaff} className="myshop-form">
                      <div className="form-group">
                        <label className="input-label">Staff Member Name</label>
                        <input 
                          className="input-field"
                          placeholder="e.g. Sarah Koomson"
                          value={staffForm.name}
                          onChange={e => setStaffForm(prev => ({ ...prev, name: e.target.value }))}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="input-label">Access Role</label>
                        <select 
                          className="input-field"
                          value={staffForm.role}
                          onChange={e => {
                            const roleSelected = e.target.value;
                            let perms = [];
                            if (roleSelected === 'Store Manager') perms = ['edit_inventory', 'manage_orders', 'chat_customers', 'manage_promos'];
                            if (roleSelected === 'Sales Assistant') perms = ['view_inventory', 'chat_customers'];
                            if (roleSelected === 'Inventory Manager') perms = ['edit_inventory', 'view_inventory'];
                            
                            setStaffForm(prev => ({ ...prev, role: roleSelected, permissions: perms }));
                          }}
                        >
                          <option value="Store Manager">Store Manager</option>
                          <option value="Sales Assistant">Sales Assistant</option>
                          <option value="Inventory Manager">Inventory Manager</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="input-label">Assigned Permissions</label>
                        <div className="permissions-pills-list">
                          {staffForm.permissions.map(p => (
                            <span key={p} className="permission-pill-tag">
                              {p.replace('_', ' ').toUpperCase()}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button type="submit" className="btn-primary">Add Staff Member</button>
                    </form>
                  </div>

                  {/* Staff Listing */}
                  <div className="promos-list-card">
                    <h3 className="section-subtitle">Staff Roster</h3>
                    <div className="staff-roster-list">
                      {(currentUser?.staff || []).length > 0 ? (
                        currentUser.staff.map(s => (
                          <div key={s.id} className="staff-item-card">
                            <div className="staff-avatar-placeholder">
                              {s.name.charAt(0)}
                            </div>
                            <div className="staff-member-details">
                              <h4>{s.name}</h4>
                              <p className="staff-role-badge">{s.role}</p>
                              <div className="staff-perms-row">
                                {s.permissions.map(p => (
                                  <span key={p} className="staff-mini-perm">{p.split('_')[0]}</span>
                                ))}
                              </div>
                            </div>
                            <button className="btn-delete-staff" onClick={() => handleDeleteStaff(s.id)}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="empty-helper-text">No staff accounts registered. Add one above.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* BULK DISPATCH TAB */}
            {activeTab === 'bulk' && (
              <div className="bulk-dispatch-view fade-in">
                <div className="bulk-enquiries-container">
                  <h3 className="section-subtitle">Bulk Wholesale Enquiries</h3>
                  <p className="section-subtitle-sub">Manage purchase inquiries, bids, and logistics schedules from corporate buyers.</p>
                  
                  <div className="bulk-requests-list">
                    {bulkOrders.length > 0 ? (
                      bulkOrders.map(b => (
                        <div key={b.id} className="bulk-request-card">
                          <div className="bulk-card-header">
                            <span className={`bulk-status-badge status-${b.status}`}>
                              {b.status.toUpperCase()}
                            </span>
                            <span className="bulk-date">{b.date || 'Today'}</span>
                          </div>

                          <div className="bulk-body-details">
                            <div className="bulk-col">
                              <span className="label">Product Requested</span>
                              <strong>{b.productName}</strong>
                            </div>
                            <div className="bulk-col">
                              <span className="label">Quantity</span>
                              <strong>{b.qty} {b.unit}</strong>
                            </div>
                            <div className="bulk-col">
                              <span className="label">Offered Price</span>
                              <strong>GH₵ {b.targetPrice.toFixed(2)}</strong>
                            </div>
                            <div className="bulk-col">
                              <span className="label">Total Bidding</span>
                              <strong>GH₵ {(b.qty * b.targetPrice).toLocaleString()}</strong>
                            </div>
                          </div>

                          <div className="buyer-contact-row">
                            <span className="buyer-name">{b.buyerName} ({b.buyerEmail})</span>
                            {b.comments && <p className="buyer-memo">" {b.comments} "</p>}
                          </div>

                          {b.status === 'pending' && (
                            <div className="bulk-card-actions">
                              <button 
                                className="btn-accept" 
                                onClick={() => onUpdateBulkOrder?.(b.id, 'accepted', 'Approved by farmer.')}
                              >
                                Accept Offer
                              </button>
                              <button 
                                className="btn-negotiate" 
                                onClick={() => {
                                  const offer = prompt("Enter your counter-offer price per unit (GH₵):");
                                  if (offer) {
                                    onUpdateBulkOrder?.(b.id, 'negotiating', `Farmer counter-offered GH₵ ${parseFloat(offer).toFixed(2)}.`);
                                  }
                                }}
                              >
                                Counter/Negotiate
                              </button>
                              <button 
                                className="btn-reject" 
                                onClick={() => onUpdateBulkOrder?.(b.id, 'rejected', 'Rejected by farmer.')}
                              >
                                Reject
                              </button>
                            </div>
                          )}

                          {b.status !== 'pending' && b.comments && (
                            <div className="negotiation-comments-box">
                              <span>Logs:</span> {b.comments}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="empty-listings">
                        <div className="empty-listings__icon"><CheckCircle size={48} /></div>
                        <p>No bulk request inquiries received yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  )
}
