import { useState, useRef, useEffect } from 'react'
import { X, Send, User } from 'lucide-react'
import './ChatDrawer.css'

export default function ChatDrawer({ open, onClose, recipientName, recipientEmail, currentUserEmail, messages = [], onSendMessage }) {
    const [inputValue, setInputValue] = useState('')
    const [keyboardHeight, setKeyboardHeight] = useState(0)
    const messagesEndRef = useRef(null)

    const curUserClean = (currentUserEmail || '').toLowerCase().trim()
    const recipClean = (recipientEmail || '').toLowerCase().trim()

    // Filter messages between current user and recipient
    const chatMessages = messages.filter(m => {
        if (!m || !m.senderEmail || !m.recipientEmail) return false
        const s = String(m.senderEmail).toLowerCase().trim()
        const r = String(m.recipientEmail).toLowerCase().trim()
        return (s === curUserClean && r === recipClean) || (s === recipClean && r === curUserClean)
    }).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))

    // Auto-detect recipient avatar from messages if available
    const lastTheirs = [...chatMessages].reverse().find(m => String(m.senderEmail).toLowerCase().trim() === recipClean)
    const displayAvatar = lastTheirs?.senderAvatar

    useEffect(() => {
        if (!window.visualViewport) return

        const handleResize = () => {
            const viewport = window.visualViewport
            const offset = window.innerHeight - viewport.height
            setKeyboardHeight(Math.max(0, offset))
        }

        window.visualViewport.addEventListener('resize', handleResize)
        window.visualViewport.addEventListener('scroll', handleResize)
        handleResize()

        return () => {
            window.visualViewport.removeEventListener('resize', handleResize)
            window.visualViewport.removeEventListener('scroll', handleResize)
        }
    }, [open])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [chatMessages, keyboardHeight])

    const handleSend = (e) => {
        e.preventDefault()
        if (!inputValue.trim()) return

        onSendMessage({
            text: inputValue.trim(),
            recipientEmail: recipientEmail,
            recipientName: recipientName
        })
        setInputValue('')
    }

    if (!open) return null

    return (
        <div className="chat-overlay" onClick={onClose}>
            <div 
                className="chat-drawer" 
                onClick={e => e.stopPropagation()}
                style={{ bottom: `${keyboardHeight}px`, height: keyboardHeight > 0 ? `calc(100% - ${keyboardHeight}px)` : '100dvh' }}
            >
                <div className="chat-drawer__header">
                    <div className="chat-drawer__title-row">
                        <div className="chat-drawer__avatar">
                            {displayAvatar ? (
                                <img src={displayAvatar} alt={recipientName} className="chat-drawer__header-img" />
                            ) : (
                                recipientName?.charAt(0) || 'U'
                            )}
                        </div>
                        <div>
                            <h3 className="chat-drawer__title">{recipientName || 'Member'}</h3>
                            <span className="chat-drawer__status">🟢 Online</span>
                        </div>
                    </div>
                    <button className="chat-drawer__close" onClick={onClose} aria-label="Close chat">
                        <X size={20} />
                    </button>
                </div>

                <div className="chat-drawer__body scroll-y">
                    <div className="chat-drawer__messages">
                        {chatMessages.length === 0 ? (
                            <div className="chat-empty">
                                <p>No messages yet. Send a message to start the conversation!</p>
                            </div>
                        ) : chatMessages.map(msg => (
                            <div
                                key={msg.id}
                                className={`chat-message ${msg.senderEmail === currentUserEmail ? 'chat-message--mine' : 'chat-message--theirs'}`}
                            >
                                {msg.senderEmail !== currentUserEmail && (
                                    <img 
                                        src={msg.senderAvatar || `https://ui-avatars.com/api/?name=${msg.senderName}&background=random`} 
                                        alt={msg.senderName} 
                                        className="chat-message__avatar" 
                                    />
                                )}
                                <div className="chat-message__bubble">
                                    <p>{msg.text}</p>
                                    <span className="chat-message__time">{msg.time}</span>
                                </div>
                                {msg.senderEmail === currentUserEmail && (
                                    <img 
                                        src={msg.senderAvatar || `https://ui-avatars.com/api/?name=${msg.senderName}&background=random`} 
                                        alt={msg.senderName} 
                                        className="chat-message__avatar" 
                                    />
                                )}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                <div className="chat-drawer__footer">
                    <form className="chat-drawer__input-form" onSubmit={handleSend}>
                        <input
                            type="text"
                            className="chat-drawer__input"
                            placeholder={`Message ${recipientName}...`}
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            autoFocus
                        />
                        <button
                            type="submit"
                            className="chat-drawer__send-btn"
                            disabled={!inputValue.trim()}
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
