import { useState, useEffect, useCallback, useRef } from 'react'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import BuyerHomePage from './pages/BuyerHomePage'
import MarketplacePage from './pages/MarketplacePage'
import MyShopPage from './pages/MyShopPage'
import PremiumDashboard from './pages/PremiumDashboard'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import ProfilePage from './pages/ProfilePage'
import AdminDashboard from './pages/AdminDashboard'
import CartDrawer from './components/CartDrawer'
import ChatDrawer from './components/ChatDrawer'
import NotificationDrawer from './components/NotificationDrawer'
import { OrdersPanel, ProductsPanel } from './components/QuickPanel'
import { api, apiFetchMe, apiLogout, tokenStorage } from './utils/api'
import { connectSocket, disconnectSocket } from './utils/socket'
import { INITIAL_PRODUCTS } from './utils/defaultProducts'
import { INITIAL_USERS } from './utils/defaultUsers'
import { MessageSquare, X } from 'lucide-react'
import './App.css'

function App() {
  // ─── Navigation ────────────────────────────────────────────────────────────

  const getInitialPage = () => {
    const hash = window.location.hash.replace('#', '')
    if (hash) return hash
    return 'landing'
  }

  const [activePage, setActivePageState] = useState(getInitialPage)

  const setActivePage = (page) => {
    if (window.location.hash !== `#${page}`) {
      window.location.hash = page
    }
  }

  useEffect(() => {
    const handleHashChange = () => {
      const page = window.location.hash.replace('#', '')
      setActivePageState(page)
    }
    window.addEventListener('hashchange', handleHashChange)
    if (!window.location.hash && activePage) {
      window.location.hash = `#${activePage}`
    }
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // ─── Auth state ────────────────────────────────────────────────────────────

  const [currentUser, setCurrentUser] = useState(null)
  const [userRole, setUserRole] = useState('farmer')
  const [authInitialized, setAuthInitialized] = useState(false)

  // On mount: restore session from localStorage (works without backend)
  useEffect(() => {
    async function restoreSession() {
      // 1. Try localStorage session first (fast, no server needed)
      const savedSession = localStorage.getItem('agrolink_session')
      if (savedSession) {
        try {
          const user = JSON.parse(savedSession)
          if (user && user.email) {
            setCurrentUser(user)
            setUserRole(user.role || 'farmer')
            const currentHash = window.location.hash.replace('#', '')
            if (!currentHash || currentHash === 'landing' || currentHash === 'auth') {
              setActivePage(user.role === 'admin' ? 'admin' : user.role === 'buyer' ? 'buyerhome' : 'home')
            }
            setAuthInitialized(true)
            return
          }
        } catch { /* ignore */ }
      }
      // 2. Try JWT token from API (optional, server might not be running)
      try {
        const user = await apiFetchMe()
        if (user) {
          setCurrentUser(user)
          setUserRole(user.role)
          localStorage.setItem('agrolink_session', JSON.stringify(user))
          const currentHash = window.location.hash.replace('#', '')
          if (!currentHash || currentHash === 'landing' || currentHash === 'auth') {
            setActivePage(user.role === 'admin' ? 'admin' : user.role === 'buyer' ? 'buyerhome' : 'home')
          }
        }
      } catch { /* server not running, stay on landing */ }
      setAuthInitialized(true)
    }
    restoreSession()
  }, [])

  // ─── Products: merge INITIAL_PRODUCTS with localStorage farmer additions ──────
  const getMergedProducts = () => {
    try {
      const localProds = JSON.parse(localStorage.getItem('agrolink_products') || '[]')
      if (!Array.isArray(localProds) || localProds.length === 0) return INITIAL_PRODUCTS
      // Merge: local farmer products take priority, initial products fill the rest
      const localIds = new Set(localProds.map(p => String(p.id)))
      const baseProds = INITIAL_PRODUCTS.filter(p => !localIds.has(String(p.id)))
      return [...localProds, ...baseProds]
    } catch {
      return INITIAL_PRODUCTS
    }
  }

  // ─── Users: merge INITIAL_USERS with localStorage registered users ────────────
  const getMergedUsers = () => {
    try {
      const localUsers = JSON.parse(localStorage.getItem('agrolink_users') || '[]')
      const deletedEmails = new Set(JSON.parse(localStorage.getItem('agrolink_deleted_users') || '[]'))
      if (!Array.isArray(localUsers) || localUsers.length === 0) {
        return INITIAL_USERS.filter(u => !deletedEmails.has(u.email))
      }
      const localEmails = new Set(localUsers.map(u => u.email))
      const baseUsers = INITIAL_USERS.filter(u => !localEmails.has(u.email) && !deletedEmails.has(u.email))
      return [...localUsers.filter(u => !deletedEmails.has(u.email)), ...baseUsers]
    } catch {
      return INITIAL_USERS
    }
  }

  // ─── App data state ────────────────────────────────────────────────────────
  const [products, setProducts] = useState(() => getMergedProducts())
  const [orders, setOrders] = useState([])
  const [notifications, setNotifications] = useState([])
  const [messages, setMessages] = useState([])
  const [bulkOrders, setBulkOrders] = useState([])
  const [users, setUsers] = useState(() => getMergedUsers())
  const [viewCounts, setViewCounts] = useState({})

  // Track IDs of products we posted locally so we can skip our own socket broadcast
  const ownPostedProductIds = useRef(new Set())

  // Cart stays local
  const [cart, setCart] = useState([])

  // Re-sync products from localStorage whenever window gets focus (farmer adds items in another tab)
  useEffect(() => {
    const handleFocus = () => setProducts(getMergedProducts())
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  // ─── Optional: try to sync with API server if it happens to be running ──────
  const [activeMessageToast, setActiveMessageToast] = useState(null)

  // ─── Real-time API product sync: initial + auto-poll every 4 seconds ──────
  useEffect(() => {
    async function syncProducts() {
      try {
        const res = await api.get('/products')
        const items = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
        if (Array.isArray(items) && items.length > 0) {
          setProducts(prev => {
            const apiIds = new Set(items.map(p => String(p.id)))
            const apiKeys = new Set(items.map(p => `${(p.ownerEmail || '').toLowerCase().trim()}:${(p.name || '').toLowerCase().trim()}`))

            // Keep local-only (_local) products not yet saved to server AND not matching a server product
            const localOnly = prev.filter(p => p._local && !apiIds.has(String(p.id)) && !apiKeys.has(`${(p.ownerEmail || '').toLowerCase().trim()}:${(p.name || '').toLowerCase().trim()}`))

            items.forEach(p => ownPostedProductIds.current.delete(String(p.id)))
            return [...localOnly, ...items]
          })
        }
      } catch { /* server offline, ignore */ }
    }

    syncProducts()
    const interval = setInterval(syncProducts, 4000)
    return () => clearInterval(interval)
  }, [])

  // Fetch message history from API server when user logs in + auto-poll every 3s
  useEffect(() => {
    if (!currentUser?.email) return
    const userEmail = currentUser.email.toLowerCase().trim()

    async function fetchMessageHistory() {
      try {
        const res = await api.get(`/messages?email=${encodeURIComponent(userEmail)}`)
        const items = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
        if (Array.isArray(items)) {
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => String(m.id)))
            const newItems = items.filter(m => !existingIds.has(String(m.id)))
            return newItems.length > 0 ? [...prev, ...newItems] : prev
          })
        }
      } catch { /* ignore if offline */ }
    }

    fetchMessageHistory()
    const msgInterval = setInterval(fetchMessageHistory, 3000)
    return () => clearInterval(msgInterval)
  }, [currentUser?.email])

  // Fetch notifications from API server when user logs in + auto-poll every 3s
  useEffect(() => {
    if (!currentUser?.email) return
    const userEmail = currentUser.email.toLowerCase().trim()

    async function fetchNotifications() {
      try {
        const res = await api.get(`/notifications?email=${encodeURIComponent(userEmail)}`)
        const items = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
        if (Array.isArray(items)) {
          setNotifications(prev => {
            // Build a map of locally-known read state so we don't lose it on re-fetch
            const localReadMap = new Map(prev.map(n => [String(n.id), n.read]))
            // Merge server items: respect local read=true override (mark-all-read should stick)
            const merged = items.map(n => ({
              ...n,
              read: localReadMap.get(String(n.id)) === true ? true : n.read
            }))
            // Add any local-only notifications (e.g. socket message notifs) not in server response
            const serverIds = new Set(merged.map(n => String(n.id)))
            const localOnly = prev.filter(n => !serverIds.has(String(n.id)))
            return [...localOnly, ...merged].sort((a, b) =>
              new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
            )
          })
        }
      } catch { /* ignore if offline */ }
    }

    fetchNotifications()
    const notifInterval = setInterval(fetchNotifications, 3000)
    return () => clearInterval(notifInterval)
  }, [currentUser?.email])

  // Fetch orders from API server when user logs in + auto-poll every 3s
  useEffect(() => {
    if (!currentUser?.email) return
    const userEmail = currentUser.email.toLowerCase().trim()
    const role = currentUser.role || 'farmer'

    async function fetchOrders() {
      try {
        const res = await api.get(`/orders?email=${encodeURIComponent(userEmail)}&role=${role}`)
        const items = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
        if (Array.isArray(items)) {
          setOrders(items)
        }
      } catch { /* ignore if offline */ }
    }

    fetchOrders()
    const orderInterval = setInterval(fetchOrders, 3000)
    return () => clearInterval(orderInterval)
  }, [currentUser?.email, currentUser?.role])

  // Users sync with localStorage on user changes
  useEffect(() => {
    setUsers(getMergedUsers())
  }, [currentUser?.email])

  // Real-time user list sync from backend database
  useEffect(() => {
    async function syncUsersFromAPI() {
      try {
        const res = await api.get('/users')
        const serverUsers = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
        if (Array.isArray(serverUsers) && serverUsers.length > 0) {
          setUsers(prev => {
            const deletedEmails = new Set(JSON.parse(localStorage.getItem('agrolink_deleted_users') || '[]'))
            const validServerUsers = serverUsers.filter(u => u.email && !deletedEmails.has(u.email.toLowerCase().trim()))
            const serverEmails = new Set(validServerUsers.map(u => u.email.toLowerCase().trim()))

            // Keep local-only users not on the server yet & sync them to server DB
            const localOnly = prev.filter(u => u.email && !serverEmails.has(u.email.toLowerCase().trim()) && !deletedEmails.has(u.email.toLowerCase().trim()))
            localOnly.forEach(lu => {
              if (lu.email) {
                api.patch(`/users/${lu.id || 'user-' + Date.now()}`, lu).catch(() => {})
              }
            })

            return [...validServerUsers, ...localOnly]
          })
        }
      } catch { /* server offline — keep local/seed users */ }
    }

    syncUsersFromAPI()
    const userInterval = setInterval(syncUsersFromAPI, 4000)
    return () => clearInterval(userInterval)
  }, [])

  const currentUserRef = useRef(currentUser)
  useEffect(() => {
    currentUserRef.current = currentUser
  }, [currentUser])

  // ─── Socket.io real-time sync (connect for all users) ───────────────────────

  useEffect(() => {
    const activeEmail = currentUser?.email ? currentUser.email.toLowerCase().trim() : 'guest'

    connectSocket(activeEmail, {
      onMessage: (msg) => {
        if (!msg) return
        setMessages(prev => {
          if (prev.find(m => String(m.id) === String(msg.id))) return prev
          return [...prev, msg]
        })

        const user = currentUserRef.current
        const curEmail = user?.email ? user.email.toLowerCase().trim() : ''
        const msgRecipient = msg.recipientEmail ? String(msg.recipientEmail).toLowerCase().trim() : ''
        const msgSender = msg.senderEmail ? String(msg.senderEmail).toLowerCase().trim() : ''

        if (curEmail && msgRecipient === curEmail && msgSender !== curEmail) {
          const newNotif = {
            id: `notif-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            recipientEmail: curEmail,
            title: `New message from ${msg.senderName || 'Member'}`,
            message: msg.text,
            time: 'Just now',
            read: false,
            type: 'message',
            chatTarget: { name: msg.senderName || 'Member', email: msgSender },
            createdAt: new Date().toISOString()
          }
          setNotifications(prev => [newNotif, ...prev.filter(n => String(n.id) !== String(newNotif.id))])
          setActiveMessageToast({ name: msg.senderName || 'Member', email: msgSender, text: msg.text })
        }
      },
      onNotification: (notif) => {
        if (!notif) return
        const user = currentUserRef.current
        const curEmail = user?.email ? user.email.toLowerCase().trim() : ''
        const notifRecipient = notif.recipientEmail ? String(notif.recipientEmail).toLowerCase().trim() : ''
        if (!curEmail || notifRecipient === curEmail) {
          setNotifications(prev => {
            if (prev.find(n => String(n.id) === String(notif.id))) return prev
            return [notif, ...prev]
          })
        }
      },
      onOrderUpdate: ({ orderId, status }) =>
        setOrders(prev => prev.map(o =>
          String(o.id) === String(orderId) ? { ...o, status } : o
        )),
      onProductCreated: (prod) => setProducts(prev => {
        if (!prod) return prev
        // Skip if this is our own product we just posted (avoid double-add)
        if (ownPostedProductIds.current.has(String(prod.id))) {
          ownPostedProductIds.current.delete(String(prod.id))
          return prev
        }
        // Skip if already in list (e.g. from polling)
        if (prev.find(p => String(p.id) === String(prod.id))) return prev
        return [prod, ...prev]
      }),
      onProductUpdated: (prod) => setProducts(prev =>
        prev.map(p => String(p.id) === String(prod.id) ? { ...p, ...prod } : p)
      ),
      onProductDeleted: ({ id }) => setProducts(prev =>
        prev.filter(p => String(p.id) !== String(id))
      ),
    })

    return () => disconnectSocket()
  }, [currentUser?.email])

  // ─── Dark mode ─────────────────────────────────────────────────────────────

  const [isDarkMode, setIsDarkMode] = useState(
    () => localStorage.getItem('agrolink_dark_mode') === 'true'
  )

  useEffect(() => {
    document.body.classList.toggle('dark-mode', isDarkMode)
    localStorage.setItem('agrolink_dark_mode', isDarkMode)
  }, [isDarkMode])

  const handleToggleDarkMode = () => setIsDarkMode(prev => !prev)

  // ─── Drawer states ─────────────────────────────────────────────────────────

  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [chatTarget, setChatTarget] = useState(null)
  const [selectedFarmerEmail, setSelectedFarmerEmail] = useState(null)
  const [isOrdersOpen, setIsOrdersOpen] = useState(false)
  const [isProductsOpen, setIsProductsOpen] = useState(false)

  const handleOpenCart = () => setIsCartOpen(true)
  const handleCloseCart = () => setIsCartOpen(false)
  const handleOpenChat = (target) => { setChatTarget(target); setIsChatOpen(true) }
  const handleCloseChat = () => { setIsChatOpen(false); setChatTarget(null) }
  const handleOpenNotif = () => setIsNotifOpen(true)
  const handleCloseNotif = () => setIsNotifOpen(false)
  const handleOpenOrders = () => setIsOrdersOpen(true)
  const handleCloseOrders = () => setIsOrdersOpen(false)
  const handleOpenProducts = () => setIsProductsOpen(true)
  const handleCloseProducts = () => setIsProductsOpen(false)

  const handleNotifClick = (notif) => {
    if (notif.type === 'message' && notif.chatTarget) {
      handleOpenChat(notif.chatTarget)
    }
  }

  // ─── Auth handler ──────────────────────────────────────────────────────────

  const handleLogin = (user) => {
    setCurrentUser(user)
    setUserRole(user.role)
    // Save session to localStorage so it persists without backend
    localStorage.setItem('agrolink_session', JSON.stringify(user))
    setProducts(getMergedProducts())
    setUsers(getMergedUsers())
    setActivePage(user.role === 'admin' ? 'admin' : user.role === 'buyer' ? 'buyerhome' : 'home')
  }

  const handleLogout = () => {
    apiLogout()
    localStorage.removeItem('agrolink_session')
    disconnectSocket()
    setCurrentUser(null)
    setUserRole('farmer')
    // Restore default products (don't clear them!)
    setProducts(getMergedProducts())
    setOrders([])
    setNotifications([])
    setMessages([])
    setBulkOrders([])
    setCart([])
    setActivePage('landing')
  }

  // ─── Cart handlers (local state only) ─────────────────────────────────────

  const addToCart = (product) => {
    setCart(prev => {
      const exists = prev.find(i => i.id === product.id)
      if (exists) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { ...product, qty: 1 }]
    })
  }

  const updateCartQty = (productId, delta) => {
    setCart(prev => prev.map(item =>
      item.id === productId ? { ...item, qty: Math.max(1, item.qty + delta) } : item
    ))
  }

  const removeFromCart = (productId) => setCart(prev => prev.filter(i => i.id !== productId))
  const clearCart = () => setCart([])

  // ─── Product handlers ──────────────────────────────────────────────────────

  const BADGE_STYLES = {
    Vegetables: { badgeColor: '#E8F5E9', badgeTextColor: '#2E7D32' },
    Fruits: { badgeColor: '#FFF8E1', badgeTextColor: '#FFB300' },
    Grains: { badgeColor: '#FFF3E0', badgeTextColor: '#E65100' },
    Fertilizers: { badgeColor: '#F3E5F5', badgeTextColor: '#7B1FA2' },
    Machinery: { badgeColor: '#E3F2FD', badgeTextColor: '#1565C0' },
    Provisions: { badgeColor: '#E1F5FE', badgeTextColor: '#01579B' },
  }

  const handleAddProduct = async (newProduct) => {
    const categoryStyle = BADGE_STYLES[newProduct.category] || BADGE_STYLES.Vegetables
    const localProduct = {
      id: Date.now(),
      name: newProduct.name?.trim() || 'Untitled Product',
      category: newProduct.category || 'Vegetables',
      farm: currentUser?.name || 'My Farm',
      ownerEmail: currentUser?.email?.toLowerCase()?.trim() || 'james.asante@agrolink.gh',
      sellerAvatar: currentUser?.avatar || null,
      location: currentUser?.location || 'Ashanti Region',
      phone: currentUser?.phone || '',
      price: parseFloat(newProduct.price) || 0,
      unit: newProduct.unit || 'kg',
      img: newProduct.img || 'https://images.unsplash.com/photo-1594911772125-07fc7a2d8d9f?w=600&q=80',
      badge: (newProduct.category || 'VEGETABLES').toUpperCase(),
      badgeColor: categoryStyle.badgeColor,
      badgeTextColor: categoryStyle.badgeTextColor,
      description: newProduct.description || '',
      stock: newProduct.stock ? `${newProduct.stock} ${newProduct.unit || 'kg'} available` : 'In stock',
      rating: 5.0,
      reviews: 0,
      status: 'active',
      _local: true,
      createdAt: new Date().toISOString()
    }

    // 1. Instantly show in local UI (MyShop + Marketplace)
    setProducts(prev => [localProduct, ...prev])

    // Save to localStorage array as local fallback
    try {
      const existingLocal = JSON.parse(localStorage.getItem('agrolink_products') || '[]')
      localStorage.setItem('agrolink_products', JSON.stringify([localProduct, ...existingLocal]))
    } catch { /* ignore */ }

    // 2. Persist to API backend if available
    try {
      const res = await api.post('/products', newProduct)
      const saved = res?.data ?? res
      if (saved && saved.id) {
        // Register server ID so the incoming socket broadcast is ignored (we already have it)
        ownPostedProductIds.current.add(String(saved.id))

        // Replace local placeholder with real server product
        setProducts(prev => prev.map(p => (p.id === localProduct.id || (p._local && p.ownerEmail === localProduct.ownerEmail && p.name === localProduct.name)) ? { ...saved, _local: false } : p))

        // Also update localStorage so localProduct is replaced with saved product
        try {
          const localProds = JSON.parse(localStorage.getItem('agrolink_products') || '[]')
          const updatedLocal = localProds.map(p => (p.id === localProduct.id || (p._local && p.ownerEmail === localProduct.ownerEmail && p.name === localProduct.name)) ? { ...saved, _local: false } : p)
          localStorage.setItem('agrolink_products', JSON.stringify(updatedLocal))
        } catch { /* ignore */ }
      }
    } catch (err) {
      console.warn('API save fallback (kept in state):', err.message)
    }
  }

  const handleUpdateProduct = async (updatedProduct) => {
    // 1. Instantly update local UI
    setProducts(prev => prev.map(p => String(p.id) === String(updatedProduct.id) ? { ...p, ...updatedProduct } : p))

    // Save to localStorage so edits (like featured status) survive page refresh
    try {
      const existingLocal = JSON.parse(localStorage.getItem('agrolink_products') || '[]')
      const updatedLocal = existingLocal.map(p => String(p.id) === String(updatedProduct.id) ? { ...p, ...updatedProduct } : p)
      localStorage.setItem('agrolink_products', JSON.stringify(updatedLocal))
    } catch { /* ignore */ }

    // 2. Persist to API backend
    try {
      const res = await api.patch(`/products/${updatedProduct.id}`, updatedProduct)
      if (res?.data) {
        setProducts(prev => prev.map(p => String(p.id) === String(updatedProduct.id) ? res.data : p))
      }
    } catch (err) {
      console.warn('API update fallback:', err.message)
    }
  }

  const handleDeleteProduct = async (productId, skipConfirm = false) => {
    if (!skipConfirm) {
      const confirmed = window.confirm("Are you sure you want to delete this product? This action cannot be undone.")
      if (!confirmed) return false
    }

    // 1. Instantly remove from local UI
    setProducts(prev => prev.filter(p => String(p.id) !== String(productId)))

    // 2. Remove from localStorage so it doesn't resurface on window focus / refresh
    try {
      const existingLocal = JSON.parse(localStorage.getItem('agrolink_products') || '[]')
      const filtered = existingLocal.filter(p => String(p.id) !== String(productId))
      localStorage.setItem('agrolink_products', JSON.stringify(filtered))
    } catch { /* ignore */ }

    // 3. Remove from API backend
    try {
      await api.del(`/products/${productId}`)
    } catch (err) {
      console.warn('API delete fallback:', err.message)
    }
    return true
  }

  const handleDeleteUser = async (userEmail, userId) => {
    if (!userEmail) return
    const cleanEmail = userEmail.toLowerCase().trim()

    // 1. Store deleted email in localStorage so seed user won't resurface
    try {
      const deletedEmails = JSON.parse(localStorage.getItem('agrolink_deleted_users') || '[]')
      if (!deletedEmails.includes(cleanEmail)) {
        deletedEmails.push(cleanEmail)
        localStorage.setItem('agrolink_deleted_users', JSON.stringify(deletedEmails))
      }
      const localUsers = JSON.parse(localStorage.getItem('agrolink_users') || '[]')
      const filteredUsers = localUsers.filter(u => u.email?.toLowerCase()?.trim() !== cleanEmail)
      localStorage.setItem('agrolink_users', JSON.stringify(filteredUsers))
    } catch { /* ignore */ }

    // 2. Remove user from users state
    setUsers(prev => prev.filter(u => u.email?.toLowerCase()?.trim() !== cleanEmail))

    // 3. Delete all products belonging to this user
    const ownedProductIds = products
      .filter(p => p.ownerEmail?.toLowerCase()?.trim() === cleanEmail)
      .map(p => p.id)

    setProducts(prev => prev.filter(p => p.ownerEmail?.toLowerCase()?.trim() !== cleanEmail))

    try {
      const existingLocalProds = JSON.parse(localStorage.getItem('agrolink_products') || '[]')
      const filteredProds = existingLocalProds.filter(p => p.ownerEmail?.toLowerCase()?.trim() !== cleanEmail)
      localStorage.setItem('agrolink_products', JSON.stringify(filteredProds))
    } catch { /* ignore */ }

    for (const pid of ownedProductIds) {
      api.del(`/products/${pid}`).catch(() => { })
    }

    if (userId) {
      api.del(`/users/${userId}`).catch(() => { })
    }
  }

  // ─── Order handlers ────────────────────────────────────────────────────────

  const handleCheckout = async (cartItems, deliveryDetails = {}) => {
    try {
      const res = await api.post('/orders', { items: cartItems, deliveryDetails })
      setOrders(prev => [...(res.data || []), ...prev])
      clearCart()
    } catch (err) {
      console.error('Checkout failed:', err.message)
    }
  }

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await api.patch(`/orders/${orderId}/status`, { status: newStatus })
      setOrders(prev => prev.map(o =>
        String(o.id) === String(orderId) ? { ...o, status: newStatus } : o
      ))
      return true
    } catch (err) {
      console.error('Update order status failed:', err.message)
      return false
    }
  }

  const handleOrderAction = async (notificationId, orderId, action) => {
    const status = action === 'grant' ? 'delivered' : 'cancelled'
    const success = await handleUpdateOrderStatus(orderId, status)
    if (success) {
      setNotifications(prev => prev.map(n =>
        String(n.id) === String(notificationId)
          ? { ...n, read: true, type: 'status', message: `Order ${action === 'grant' ? 'granted' : 'rejected'} successfully.` }
          : n
      ))
    }
  }

  // ─── Profile handler ───────────────────────────────────────────────────────

  const handleUpdateProfile = async (updatedProfile) => {
    if (!currentUser || !updatedProfile) return
    const merged = { ...currentUser, ...updatedProfile }

    // 1. Instantly update UI state
    setCurrentUser(merged)

    // 2. Update users list in App state
    setUsers(prev => prev.map(u =>
      u.email?.toLowerCase().trim() === currentUser.email?.toLowerCase().trim()
        ? { ...u, ...updatedProfile }
        : u
    ))

    // 3. Update localStorage session and users storage
    try {
      localStorage.setItem('agrolink_session', JSON.stringify(merged))
      const localUsers = JSON.parse(localStorage.getItem('agrolink_users') || '[]')
      const idx = localUsers.findIndex(u => u.email?.toLowerCase().trim() === currentUser.email?.toLowerCase().trim())
      if (idx >= 0) {
        localUsers[idx] = { ...localUsers[idx], ...updatedProfile }
      } else {
        localUsers.push(merged)
      }
      localStorage.setItem('agrolink_users', JSON.stringify(localUsers))
    } catch { /* ignore */ }

    // 4. Cascade name/avatar updates to owned products and sent messages
    if (updatedProfile.name || updatedProfile.avatar) {
      const curEmail = currentUser.email?.toLowerCase().trim()
      setProducts(prev => prev.map(p =>
        p.ownerEmail?.toLowerCase().trim() === curEmail
          ? { ...p, farm: updatedProfile.name || p.farm, sellerAvatar: updatedProfile.avatar || p.sellerAvatar }
          : p
      ))
      setMessages(prev => prev.map(m =>
        m.senderEmail?.toLowerCase().trim() === curEmail
          ? { ...m, senderName: updatedProfile.name || m.senderName, senderAvatar: updatedProfile.avatar || m.senderAvatar }
          : m
      ))
    }

    // 5. Persist to API backend in real-time
    try {
      const userId = currentUser.id || `user-${Date.now()}`
      const res = await api.patch(`/users/${userId}`, { ...updatedProfile, email: currentUser.email })
      if (res?.data) {
        const serverUpdated = res.data
        setCurrentUser(prev => ({ ...prev, ...serverUpdated }))
        localStorage.setItem('agrolink_session', JSON.stringify({ ...merged, ...serverUpdated }))
      }
    } catch (err) {
      console.warn('API update profile fallback (saved to local state):', err.message)
    }
  }

  // ─── Message handler ───────────────────────────────────────────────────────

  const handleSendMessage = async (msgData) => {
    if (!currentUser?.email || !msgData?.recipientEmail) return
    const senderEmailClean = currentUser.email.toLowerCase().trim()
    const recipientEmailClean = msgData.recipientEmail.toLowerCase().trim()

    const timestamp = Date.now()
    const tempMsg = {
      id: `msg-${timestamp}-${Math.random().toString(36).slice(2)}`,
      senderEmail: senderEmailClean,
      senderName: currentUser?.name || 'Me',
      senderAvatar: currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'User')}&background=random`,
      recipientEmail: recipientEmailClean,
      text: msgData.text?.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp,
      createdAt: new Date().toISOString(),
    }

    // 1. Optimistic UI update so sender sees message immediately
    setMessages(prev => {
      if (prev.some(m => String(m.id) === String(tempMsg.id))) return prev
      return [...prev, tempMsg]
    })

    // 2. Persist to API
    try {
      const res = await api.post('/messages', {
        senderEmail: senderEmailClean,
        senderName: currentUser?.name || 'User',
        recipientEmail: recipientEmailClean,
        text: msgData.text
      })
      const savedMsg = res?.data ?? res
      if (savedMsg && savedMsg.id) {
        setMessages(prev => prev.map(m => m.id === tempMsg.id ? savedMsg : m))
      }
    } catch (err) {
      console.warn('API send message fallback (kept in state):', err.message)
    }
  }

  // ─── View count handler ────────────────────────────────────────────────────

  const handleIncrementView = (email) => {
    if (!email) return
    api.post(`/products/${email}/view`).catch(() => { })
    setViewCounts(prev => ({ ...prev, [email]: (prev[email] || 0) + 1 }))
  }

  // ─── Notification helpers ──────────────────────────────────────────────────

  const handleMarkNotificationsRead = async () => {
    // Optimistic update first — immediately mark all as read in local state
    setNotifications(prev => prev.map(n =>
      n.recipientEmail === currentUser?.email ? { ...n, read: true } : n
    ))
    // Then sync to server (pass email in body for optionalAuth routes)
    try {
      await api.patch('/notifications/read-all', { email: currentUser?.email })
    } catch (err) {
      console.warn('Mark notifications read (server sync failed, local state already updated):', err.message)
    }
  }

  // ─── Bulk order handlers ───────────────────────────────────────────────────

  const handleAddBulkOrder = async (req) => {
    try {
      const res = await api.post('/bulk-orders', req)
      setBulkOrders(prev => [res.data, ...prev])
    } catch (err) {
      console.error('Add bulk order failed:', err.message)
    }
  }

  const handleUpdateBulkOrder = async (id, status, comments) => {
    try {
      const res = await api.patch(`/bulk-orders/${id}`, { status, comments })
      setBulkOrders(prev => prev.map(o => o.id === id ? res.data : o))
    } catch (err) {
      console.error('Update bulk order failed:', err.message)
    }
  }

  // ─── Auth view for toggling login/signup ───────────────────────────────────

  const [authView, setAuthView] = useState('login')

  // ─── Page renderer ─────────────────────────────────────────────────────────

  const userProducts = (currentUser?.role === 'admin' || currentUser?.email === 'classicgenius@dev')
    ? products
    : products.filter(p => p && (p.ownerEmail === currentUser?.email || (!currentUser?.email && p.ownerEmail === 'james.asante@agrolink.gh')))
  const userOrders = orders.filter(o => {
    if (!o) return false
    const product = products.find(p => p && String(p.id) === String(o.productId))
    return product && product.ownerEmail === currentUser?.email
  })
  const userNotifications = notifications.filter(n => n && n.recipientEmail === currentUser?.email)

  const renderPage = () => {
    switch (activePage) {
      case 'buyerhome': return (
        <BuyerHomePage
          setActivePage={setActivePage}
          currentUser={currentUser}
          orders={orders}
          notifications={userNotifications}
          onMarkNotificationsRead={handleMarkNotificationsRead}
          onOpenChat={handleOpenChat}
          onOpenNotif={handleOpenNotif}
          messages={messages}
          onSendMessage={handleSendMessage}
          onViewFarmerStore={(email) => {
            setSelectedFarmerEmail(email)
            setActivePage('market')
          }}
        />
      )
      case 'home': return (
        <HomePage
          setActivePage={setActivePage}
          userRole={userRole}
          currentUser={currentUser}
          products={userProducts}
          orders={userOrders}
          notifications={userNotifications}
          onDeleteProduct={handleDeleteProduct}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onMarkNotificationsRead={handleMarkNotificationsRead}
          onOpenChat={handleOpenChat}
          onOpenNotif={handleOpenNotif}
          onOpenOrders={handleOpenOrders}
          onOpenProducts={handleOpenProducts}
          messages={messages}
          onSendMessage={handleSendMessage}
          viewCount={viewCounts[currentUser?.email] || 0}
        />
      )
      case 'market': return (
        <MarketplacePage
          products={products}
          users={users}
          cart={cart}
          onAddToCart={addToCart}
          onUpdateCartQty={updateCartQty}
          onRemoveFromCart={removeFromCart}
          onClearCart={clearCart}
          onCheckout={handleCheckout}
          onOpenCart={handleOpenCart}
          onOpenChat={handleOpenChat}
          onIncrementView={handleIncrementView}
          currentUser={currentUser}
          messages={messages}
          onSendMessage={handleSendMessage}
          onAddBulkOrder={handleAddBulkOrder}
          selectedFarmerEmail={selectedFarmerEmail}
          onOpenFarmerStore={setSelectedFarmerEmail}
          onCloseFarmerStore={() => setSelectedFarmerEmail(null)}
        />
      )
      case 'myshop': return (
        <MyShopPage
          products={userProducts}
          allProducts={products}
          onAddProduct={handleAddProduct}
          onUpdateProduct={handleUpdateProduct}
          onDeleteProduct={handleDeleteProduct}
          currentUser={currentUser}
          onUpdateProfile={handleUpdateProfile}
          bulkOrders={bulkOrders.filter(o => o.ownerEmail === currentUser?.email)}
          onUpdateBulkOrder={handleUpdateBulkOrder}
        />
      )
      case 'profile': return (
        <ProfilePage
          userRole={userRole}
          currentUser={currentUser}
          isDarkMode={isDarkMode}
          onToggleDarkMode={handleToggleDarkMode}
          onUpdateProfile={handleUpdateProfile}
          setActivePage={setActivePage}
          onLogout={handleLogout}
        />
      )
      case 'landing': return (
        <LandingPage
          onLoginClick={() => { setAuthView('login'); setActivePage('auth') }}
          onSignupClick={() => { setAuthView('signup'); setActivePage('auth') }}
        />
      )
      case 'premium': return (
        <PremiumDashboard
          currentUser={currentUser}
          products={products}
          orders={orders}
          onUpdateProfile={handleUpdateProfile}
          onAddToCart={addToCart}
          onUpdateCartQty={updateCartQty}
          onRemoveFromCart={removeFromCart}
          onClearCart={clearCart}
          onCheckout={handleCheckout}
          onOpenChat={handleOpenChat}
          onOpenNotif={handleOpenNotif}
          messages={messages}
          onSendMessage={handleSendMessage}
        />
      )
      case 'admin': return (
        <AdminDashboard
          currentUser={currentUser}
          users={users}
          setUsers={setUsers}
          products={products}
          setProducts={setProducts}
          orders={orders}
          bulkOrders={bulkOrders}
          setBulkOrders={setBulkOrders}
          setActivePage={setActivePage}
          onDeleteUser={handleDeleteUser}
          onUpdateProduct={handleUpdateProduct}
          onDeleteProduct={handleDeleteProduct}
        />
      )
      case 'auth': return (
        <AuthPage
          initialView={authView}
          onLogin={handleLogin}
        />
      )
      default: return <LandingPage onLoginClick={() => { setAuthView('login'); setActivePage('auth') }} onSignupClick={() => { setAuthView('signup'); setActivePage('auth') }} />
    }
  }

  // Don't render until we know if the user is logged in (avoids flash)
  if (!authInitialized) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 40, height: 40, border: '3px solid var(--primary-green)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading AgroLink...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <>
      <Layout activePage={activePage} setActivePage={setActivePage} userRole={userRole} currentUser={currentUser}>
        {renderPage()}
      </Layout>

      {/* Global Drawers rendered at root for perfect stacking context */}
      <CartDrawer
        open={isCartOpen}
        onClose={handleCloseCart}
        cart={cart}
        onUpdateQty={updateCartQty}
        onRemove={removeFromCart}
        onClearCart={clearCart}
        onCheckout={handleCheckout}
      />

      <ChatDrawer
        open={isChatOpen}
        onClose={handleCloseChat}
        recipientName={chatTarget?.name}
        recipientEmail={chatTarget?.email}
        currentUserEmail={currentUser?.email}
        messages={messages}
        onSendMessage={handleSendMessage}
      />

      <NotificationDrawer
        open={isNotifOpen}
        onClose={handleCloseNotif}
        notifications={userNotifications}
        onMarkAllRead={handleMarkNotificationsRead}
        onNotifClick={handleNotifClick}
        onOrderAction={handleOrderAction}
      />

      {/* Quick Panels for Farmer Overview */}
      <OrdersPanel
        open={isOrdersOpen}
        onClose={handleCloseOrders}
        orders={userOrders}
        onUpdateStatus={handleUpdateOrderStatus}
        onChat={handleOpenChat}
      />

      <ProductsPanel
        open={isProductsOpen}
        onClose={handleCloseProducts}
        products={userProducts}
        onDeleteProduct={handleDeleteProduct}
        onNavigateToShop={() => setActivePage('myshop')}
      />

      {/* Floating Chat Toast Notification */}
      {activeMessageToast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 99999,
          background: 'var(--card-bg, #ffffff)',
          border: '1.5px solid var(--primary-green, #2E7D32)',
          boxShadow: '0 12px 30px rgba(0,0,0,0.18)',
          borderRadius: '14px',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          maxWidth: '380px',
        }}>
          <div style={{ background: '#E3F2FD', color: '#1565C0', padding: '10px', borderRadius: '50%', display: 'flex', flexShrink: 0 }}>
            <MessageSquare size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontWeight: '700', fontSize: '14px', color: 'var(--text, #111)' }}>
              New message from {activeMessageToast.name}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-muted, #666)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              "{activeMessageToast.text}"
            </p>
          </div>
          <button
            onClick={() => {
              handleOpenChat({ name: activeMessageToast.name, email: activeMessageToast.email });
              setActiveMessageToast(null);
            }}
            style={{
              background: 'var(--primary-green, #2E7D32)',
              color: '#fff',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Reply
          </button>
          <button
            onClick={() => setActiveMessageToast(null)}
            style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '4px' }}
            aria-label="Dismiss toast"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </>
  )
}

export default App
