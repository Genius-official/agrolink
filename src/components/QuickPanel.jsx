import { X, ShoppingCart, Clock, CheckCircle, Truck, Package, Phone, Tag, Edit3, Trash2, PlusCircle, ImagePlus } from 'lucide-react'
import './QuickPanel.css'

/* ── Static Data Removed ── */


function OrderCard({ order, onUpdateStatus, onChat }) {
    return (
        <div className="qp-order-card">
            <div className="qp-order-card__top">
                <img src={order.buyerAvatar || order.avatar || "https://i.pravatar.cc/40?img=12"} alt={order.buyerName} className="qp-order-card__avatar" />
                <div className="qp-order-card__info">
                    <p className="qp-order-card__customer">{order.buyerName}</p>
                    <p className="qp-order-card__detail">{order.productName || order.product} · #{order.id}</p>
                    <p className="qp-order-card__date">{order.date}</p>
                </div>
                <div className="qp-order-card__right">
                    <p className="qp-order-card__amount">GH₵{(typeof order.amount === 'number' ? order.amount : parseFloat(order.amount || 0)).toFixed(2)}</p>
                    <span
                        className="qp-order-card__status"
                        style={{ 
                            background: order.status === 'pending' ? '#FFF3E0' : '#E8F5E9', 
                            color: order.status === 'pending' ? '#E65100' : '#2E7D32' 
                        }}
                    >
                        {order.status === 'pending' ? <Clock size={14} /> : <CheckCircle size={14} />} {order.status}
                    </span>
                </div>
            </div>
            <div className="qp-order-card__actions">
                <button 
                    className="qp-order-card__btn qp-order-card__btn--outline"
                    onClick={() => onChat?.({ name: order.buyerName, email: order.buyerEmail })}
                >
                    <Phone size={13} /> Chat with Buyer
                </button>
                {order.status === 'pending' && (
                    <button 
                        className="qp-order-card__btn qp-order-card__btn--primary" 
                        onClick={() => onUpdateStatus?.(order.id, 'delivered')}
                    >
                        <CheckCircle size={13} /> Grant Order
                    </button>
                )}
            </div>
        </div>
    )
}

export function OrdersPanel({ open, onClose, orders = [], onUpdateStatus, onChat }) {
    const active = orders.filter(o => o.status === 'pending')
    const completed = orders.filter(o => o.status === 'delivered')

    if (!open) return null
    return (
        <div className="qp-overlay" onClick={onClose}>
            <div className="qp" onClick={e => e.stopPropagation()}>
                <div className="qp__header" style={{ background: '#1565C0' }}>
                    <div className="qp__header-left">
                        <ShoppingCart size={18} />
                        <h3 className="qp__title">My Orders</h3>
                    </div>
                    <button className="qp__close" onClick={onClose}><X size={18} /></button>
                </div>

                <div className="qp__body scroll-y">
                    {/* Active Orders */}
                    <div className="qp__section">
                        <div className="qp__section-header">
                            <span className="qp__section-title">Active Orders</span>
                            <span className="qp__section-count" style={{ background: '#E3F2FD', color: '#1565C0' }}>{active.length}</span>
                        </div>
                        {active.length === 0
                            ? <p className="qp__empty-msg">No active orders</p>
                            : active.map(o => <OrderCard key={o.id} order={o} onUpdateStatus={onUpdateStatus} onChat={onChat} />)
                        }
                    </div>

                    {/* Completed */}
                    <div className="qp__section">
                        <div className="qp__section-header">
                            <span className="qp__section-title">Completed</span>
                            <span className="qp__section-count" style={{ background: '#E8F5E9', color: '#2E7D32' }}>{completed.length}</span>
                        </div>
                        {completed.length === 0
                            ? <p className="qp__empty-msg">No completed orders yet</p>
                            : completed.map(o => <OrderCard key={o.id} order={o} onChat={onChat} />)
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Products Panel ────────────────────────────────────

export function ProductsPanel({ open, onClose, onNavigateToShop, products = [], onDeleteProduct }) {
    if (!open) return null
    return (
        <div className="qp-overlay" onClick={onClose}>
            <div className="qp" onClick={e => e.stopPropagation()}>
                <div className="qp__header" style={{ background: '#558B2F' }}>
                    <div className="qp__header-left">
                        <Tag size={18} />
                        <h3 className="qp__title">My Products</h3>
                    </div>
                    <button className="qp__close" onClick={onClose}><X size={18} /></button>
                </div>

                <div className="qp__body scroll-y">
                    <div className="qp__section">
                        <div className="qp__section-header">
                            <span className="qp__section-title">Listed Products</span>
                            <span className="qp__section-count" style={{ background: '#F1F8E9', color: '#558B2F' }}>{products.length}</span>
                        </div>

                        {products.map(p => {
                            const price = typeof p.price === 'number' ? p.price : parseFloat(p.price || 0)
                            const productImg = p.img || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=120&q=70'
                            
                            return (
                                <div key={p.id} className="qp-product-card">
                                    <img src={productImg} alt={p.name} className="qp-product-card__img" />
                                    <div className="qp-product-card__info">
                                        <p className="qp-product-card__name">{p.name}</p>
                                        <p className="qp-product-card__meta">{p.category} · GH₵{price.toFixed(2)}/{p.unit}</p>
                                        <p className="qp-product-card__stock">{p.stock}</p>
                                    </div>
                                    <div className="qp-product-card__actions">
                                        <button 
                                            className="qp-product-card__btn qp-product-card__btn--edit" 
                                            aria-label="Edit"
                                            onClick={() => { onClose(); onNavigateToShop?.(); }}
                                        >
                                            <Edit3 size={14} />
                                        </button>
                                        <button 
                                            className="qp-product-card__btn qp-product-card__btn--del" 
                                            onClick={() => onDeleteProduct?.(p.id)} 
                                            aria-label="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            )
                        })}

                        {products.length === 0 && (
                            <div className="qp__empty-state">
                                <ImagePlus size={40} color="var(--border-light)" />
                                <p>No products listed yet</p>
                            </div>
                        )}

                        <button className="qp__add-btn" onClick={() => { onClose(); onNavigateToShop?.() }}>
                            <PlusCircle size={16} /> Add New Product
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
