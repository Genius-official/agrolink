import { X, Package, CheckCircle2, Info, Bell, MessageSquare } from 'lucide-react'
import './NotificationDrawer.css'

export default function NotificationDrawer({ open, onClose, notifications = [], onMarkAllRead, onNotifClick, onOrderAction }) {
    if (!open) return null

    const typeConfig = {
        order: { icon: <Package size={18} />, color: '#E65100', bg: '#FFF3E0' },
        status: { icon: <CheckCircle2 size={18} />, color: '#2E7D32', bg: '#E8F5E9' },
        message: { icon: <MessageSquare size={18} />, color: '#1565C0', bg: '#E3F2FD' },
        info: { icon: <Info size={18} />, color: '#6A1B9A', bg: '#F3E5F5' },
    }

    const unreadCount = notifications.filter(n => !n.read).length

    return (
        <div className="nd-overlay" onClick={onClose}>
            <div className="nd" onClick={e => e.stopPropagation()}>
                <div className="nd__header">
                    <div className="nd__header-left">
                        <Bell size={18} />
                        <h3 className="nd__title">Notifications</h3>
                        {unreadCount > 0 && <span className="nd__count">{unreadCount}</span>}
                    </div>
                    <div className="nd__header-right">
                        {unreadCount > 0 && (
                            <button className="nd__mark-all" onClick={onMarkAllRead}>Mark all read</button>
                        )}
                        <button className="nd__close" onClick={onClose} aria-label="Close">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div className="nd__list scroll-y">
                    {notifications.length === 0 ? (
                        <div className="nd__empty">
                            <Bell size={40} color="var(--border-light)" />
                            <p>No notifications yet</p>
                        </div>
                    ) : notifications.map(notif => {
                        const { icon, color, bg } = typeConfig[notif.type] || typeConfig.info
                        const isClickable = notif.type === 'message' || notif.type === 'order'
                        return (
                            <div 
                                key={notif.id} 
                                className={`nd__item ${!notif.read ? 'nd__item--unread' : ''} ${isClickable ? 'nd__item--clickable' : ''}`}
                                onClick={() => {
                                    if (isClickable) {
                                        onNotifClick?.(notif)
                                        onClose()
                                    }
                                }}
                            >
                                <div className="nd__item-icon" style={{ background: bg, color: color }}>
                                    {icon}
                                </div>
                                <div className="nd__item-body">
                                    <p className="nd__item-title">{notif.title}</p>
                                    <p className="nd__item-msg">{notif.message}</p>
                                    
                                    {notif.type === 'order' && notif.orderId && !notif.read && (
                                        <div className="nd__item-actions">
                                            <button 
                                                className="nd__action-btn nd__action-btn--grant"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    onOrderAction?.(notif.id, notif.orderId, 'grant')
                                                }}
                                            >
                                                Grant
                                            </button>
                                            <button 
                                                className="nd__action-btn nd__action-btn--reject"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    onOrderAction?.(notif.id, notif.orderId, 'reject')
                                                }}
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                    
                                    <span className="nd__item-time">{notif.time}</span>
                                </div>
                                {!notif.read && <div className="nd__item-dot" />}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
