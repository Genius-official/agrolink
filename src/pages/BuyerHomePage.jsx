import { useState } from 'react'
import { ShoppingBag, Clock, CheckCircle, Package, MessageCircle, Star, ChevronRight, TrendingUp, Bell } from 'lucide-react'
import './BuyerHomePage.css'

/* ── Buyer Dashboard ── */


const statusConfig = {
    delivered:  { label: 'Delivered',  color: '#2E7D32', bg: '#E8F5E9', Icon: CheckCircle },
    pending:    { label: 'Pending',    color: '#E65100', bg: '#FFF3E0', Icon: Clock },
    processing: { label: 'Processing', color: '#1565C0', bg: '#E3F2FD', Icon: Package },
    cancelled:  { label: 'Cancelled',  color: '#B71C1C', bg: '#FFEBEE', Icon: ShoppingBag },
}

const fallbackStatus = { label: 'Unknown', color: '#78909C', bg: '#ECEFF1', Icon: Package }

const tabs = ['All', 'Active', 'Pending', 'History']

export default function BuyerHomePage({ 
    setActivePage, 
    currentUser, 
    orders = [], 
    notifications = [],
    onMarkNotificationsRead,
    onOpenChat,
    onOpenNotif,
    messages = [], 
    onSendMessage,
    onViewFarmerStore
}) {
    const [activeTab, setActiveTab] = useState('All')
    const unreadCount = notifications.filter(n => n && !n.read).length

    const curEmail = (currentUser?.email || '').toLowerCase().trim()
    const userOrders = orders.filter(o => o && o.buyerEmail && o.buyerEmail.toLowerCase().trim() === curEmail)

    const openChatInternal = (order) => {
        onOpenChat({ name: order.farm, email: order.ownerEmail })
    }

    const handleNotifClick = (notif) => {
        if (notif.type === 'message' && notif.chatTarget) {
            onOpenChat(notif.chatTarget)
        }
    }

    const filtered = userOrders.filter(o => {
        if (activeTab === 'All') return true
        if (activeTab === 'Active') return o.status === 'processing'
        if (activeTab === 'Pending') return o.status === 'pending'
        if (activeTab === 'History') return o.status === 'delivered' || o.status === 'cancelled'
        return true
    })

    const total = userOrders.reduce((a, o) => a + (parseFloat(o.amount) || 0), 0)
    const deliveredCount = userOrders.filter(o => o.status === 'delivered').length
    const pendingCount   = userOrders.filter(o => o.status === 'pending' || o.status === 'processing').length

    return (
        <div className="buyer-home">
            {/* Header */}
            <header className="buyer-home__header">
                <div className="buyer-home__header-left">
                    <p className="buyer-home__welcome">Welcome back,</p>
                    <h2 className="buyer-home__name">{firstName} 👋</h2>
                </div>
                <div className="buyer-home__header-right">
                    <button className="buyer-home__notif-btn" onClick={onOpenNotif}>
                        <Bell size={20} />
                        {unreadCount > 0 && <span className="buyer-home__notif-badge">{unreadCount}</span>}
                    </button>
                    <button className="buyer-home__market-btn" onClick={() => setActivePage('market')}>
                        <ShoppingBag size={16} /> Browse Market
                    </button>
                </div>
            </header>

            {/* Stats */}
            <div className="buyer-stats">
                <div className="buyer-stat-card">
                    <div className="buyer-stat-card__icon" style={{ background: '#E3F2FD', color: '#1565C0' }}>
                        <TrendingUp size={20} />
                    </div>
                    <div>
                        <p className="buyer-stat-card__label">Total Spent</p>
                        <p className="buyer-stat-card__value">GH₵{total.toFixed(2)}</p>
                    </div>
                </div>
                <div className="buyer-stat-card">
                    <div className="buyer-stat-card__icon" style={{ background: '#E8F5E9', color: '#2E7D32' }}>
                        <CheckCircle size={20} />
                    </div>
                    <div>
                        <p className="buyer-stat-card__label">Delivered</p>
                        <p className="buyer-stat-card__value">{deliveredCount} Orders</p>
                    </div>
                </div>
                <div className="buyer-stat-card">
                    <div className="buyer-stat-card__icon" style={{ background: '#FFF3E0', color: '#E65100' }}>
                        <Clock size={20} />
                    </div>
                    <div>
                        <p className="buyer-stat-card__label">Pending</p>
                        <p className="buyer-stat-card__value">{pendingCount} Orders</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="buyer-tabs">
                {tabs.map(tab => (
                    <button
                        key={tab}
                        className={`buyer-tab ${activeTab === tab ? 'buyer-tab--active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Orders List */}
            <div className="buyer-orders">
                {filtered.length === 0 ? (
                    <div className="buyer-orders__empty">
                        <ShoppingBag size={48} stroke="#ccc" />
                        <p>No orders in this category</p>
                        <button className="buyer-orders__shop-btn" onClick={() => setActivePage('market')}>
                            Start Shopping <ChevronRight size={16} />
                        </button>
                    </div>
                ) : (
                    filtered.map(order => {
                        const { label, color, bg, Icon: StatusIcon } = statusConfig[order.status] ?? fallbackStatus
                        return (
                            <div key={order.id} className="buyer-order-card">
                                <img src={order.img} alt={order.productName || order.product} className="buyer-order-card__img" />
                                <div className="buyer-order-card__info">
                                    <div className="buyer-order-card__top">
                                        <div>
                                            <h4 className="buyer-order-card__product">{order.productName || order.product}</h4>
                                            <p 
                                                className="buyer-order-card__farm clickable-farm-name"
                                                onClick={() => onViewFarmerStore?.(order.ownerEmail)}
                                                title={`View ${order.farm} storefront`}
                                            >
                                                {order.farm}
                                            </p>
                                        </div>
                                        <span className="buyer-order-card__status" style={{ background: bg, color }}>
                                            <StatusIcon size={12} /> {label}
                                        </span>
                                    </div>
                                    <div className="buyer-order-card__meta">
                                        <span>{order.qty} {order.unit}</span>
                                        <span className="buyer-order-card__price">GH₵{(parseFloat(order.amount) || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="buyer-order-card__footer">
                                        <span className="buyer-order-card__date">{order.date}</span>
                                        <div className="buyer-order-card__actions">
                                            <span className="buyer-order-card__id">{order.id}</span>
                                            <button
                                                className="buyer-order-card__chat-btn"
                                                onClick={() => openChatInternal(order)}
                                                title={`Chat with ${order.farm}`}
                                            >
                                                <MessageCircle size={14} /> Chat
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>


        </div>
    )
}
