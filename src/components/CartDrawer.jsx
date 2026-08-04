import { useState } from 'react'
import { X, Minus, Plus, Trash2, ArrowRight, ShoppingCart, CheckCircle2 } from 'lucide-react'
import './CartDrawer.css'

export default function CartDrawer({ open, onClose, cart, onUpdateQty, onRemove, onClearCart, onCheckout }) {
    const [isSuccess, setIsSuccess] = useState(false)
    const [deliveryDate, setDeliveryDate] = useState('')
    const [deliveryTime, setDeliveryTime] = useState('')
    const subtotal = cart.reduce((acc, item) => acc + (parseFloat(item.price) * item.qty), 0)

    const handleCheckout = () => {
        onCheckout(cart, { deliveryDate, deliveryTime })
        setIsSuccess(true)
    }

    const handleFinish = () => {
        setIsSuccess(false)
        setDeliveryDate('')
        setDeliveryTime('')
        onClearCart()
        onClose()
    }

    if (!open) return null

    return (
        <div className="cart-overlay" onClick={onClose}>
            <div className="cart-drawer" onClick={e => e.stopPropagation()}>
                {isSuccess ? (
                    <div className="cart-drawer__success">
                        <div className="cart-drawer__success-content">
                            <div className="cart-drawer__success-icon">
                                <CheckCircle2 size={64} />
                            </div>
                            <h3 className="cart-drawer__success-title">Order Placed Successfully!</h3>
                            <p className="cart-drawer__success-text">
                                Your order has been sent to the farmers. They will contact you shortly to arrange delivery and payment.
                            </p>
                            <div className="cart-drawer__success-summary">
                                <span>Order Total:</span>
                                <strong>GH₵{subtotal.toFixed(2)}</strong>
                            </div>
                        </div>
                        <div className="cart-drawer__footer">
                            <button className="cart-drawer__finish-btn" onClick={handleFinish}>
                                Return to Market
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="cart-drawer__header">
                            <div className="cart-drawer__title-row">
                                <ShoppingCart size={20} className="cart-drawer__icon" />
                                <h3 className="cart-drawer__title">Your Shopping Cart</h3>
                                <span className="cart-drawer__count">{cart.length} items</span>
                            </div>
                            <button className="cart-drawer__close" onClick={onClose} aria-label="Close cart">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="cart-drawer__body scroll-y">
                            {cart.length === 0 ? (
                                <div className="cart-drawer__empty">
                                    <div className="cart-drawer__empty-icon">
                                        <ShoppingCart size={48} />
                                    </div>
                                    <p className="cart-drawer__empty-text">Your cart is empty</p>
                                    <button className="cart-drawer__shop-btn" onClick={onClose}>
                                        Start Shopping
                                    </button>
                                </div>
                            ) : (
                                <div className="cart-drawer__items">
                                    {cart.map(item => (
                                        <div key={item.id} className="cart-item">
                                            <img src={item.img} alt={item.name} className="cart-item__img" />
                                            <div className="cart-item__info">
                                                <div className="cart-item__header">
                                                    <h4 className="cart-item__name">{item.name}</h4>
                                                    <button
                                                        className="cart-item__remove"
                                                        onClick={() => onRemove(item.id)}
                                                        aria-label="Remove item"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                                <p className="cart-item__farm">{item.farm}</p>
                                                <div className="cart-item__bottom">
                                                    <div className="cart-item__qty-controls">
                                                        <button
                                                            className="cart-item__qty-btn"
                                                            onClick={() => onUpdateQty(item.id, -1)}
                                                            disabled={item.qty <= 1}
                                                        >
                                                            <Minus size={12} />
                                                        </button>
                                                        <span className="cart-item__qty-val">{item.qty}</span>
                                                        <button
                                                            className="cart-item__qty-btn"
                                                            onClick={() => onUpdateQty(item.id, 1)}
                                                        >
                                                            <Plus size={12} />
                                                        </button>
                                                    </div>
                                                    <span className="cart-item__price">
                                                        GH₵{(parseFloat(item.price) * item.qty).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {cart.length > 0 && (
                            <div className="cart-drawer__footer">
                                <div className="cart-delivery-scheduling">
                                    <h4 className="delivery-title">Preferred Delivery Schedule</h4>
                                    <div className="delivery-pickers">
                                        <div className="picker-col">
                                            <label>Preferred Date</label>
                                            <input 
                                                type="date" 
                                                value={deliveryDate} 
                                                onChange={e => setDeliveryDate(e.target.value)} 
                                                required
                                            />
                                        </div>
                                        <div className="picker-col">
                                            <label>Preferred Time</label>
                                            <input 
                                                type="time" 
                                                value={deliveryTime} 
                                                onChange={e => setDeliveryTime(e.target.value)} 
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="cart-drawer__summary">
                                    <div className="cart-drawer__summary-row">
                                        <span>Subtotal</span>
                                        <span>GH₵{subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="cart-drawer__summary-row cart-drawer__summary-row--total">
                                        <span>Total</span>
                                        <span>GH₵{subtotal.toFixed(2)}</span>
                                    </div>
                                </div>
                                <button className="cart-drawer__checkout-btn" onClick={handleCheckout}>
                                    Checkout <ArrowRight size={18} />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
