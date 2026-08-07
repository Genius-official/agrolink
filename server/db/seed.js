/**
 * AgroLink Database Seeder
 * Seeds initial products, demo users, and sample orders on first run.
 * Run with: node db/seed.js
 */

import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { db } from './store.js';

// ─── Demo Users ────────────────────────────────────────────────────────────────

const DEMO_USERS = async () => {
  const adminHash  = await bcrypt.hash('classicgeniusdev', 10);
  const farmerHash = await bcrypt.hash('farmer123', 10);
  const buyerHash  = await bcrypt.hash('buyer123', 10);

  return [
    {
      id: 'dev-admin-001',
      name: 'AgroLink Admin',
      email: 'classicgenius@dev',
      password: adminHash,
      role: 'admin',
      avatar: 'https://ui-avatars.com/api/?name=Dev+Admin&background=1a472a&color=fff',
      joined: 'Jan 2026',
      status: 'active',
      plan: 'business',
      verified: true,
      organicCertified: true,
      bio: 'AgroLink Platform Administrator',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'farmer-001',
      name: 'James Asante',
      email: 'james.asante@agrolink.gh',
      password: farmerHash,
      role: 'farmer',
      avatar: 'https://ui-avatars.com/api/?name=James+Asante&background=3B823E&color=fff',
      joined: 'Jan 2026',
      status: 'active',
      plan: 'business',
      verified: true,
      organicCertified: true,
      bio: 'Cocoa and maize farmer from Ashanti Region.',
      phone: '+233 24 123 4567',
      location: 'Ashanti Region',
      joinedPremiumDate: '2026-01-15',
      premiumRenewalDate: '2026-08-15',
      lastTransactionRef: 'TXN-9011',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'farmer-002',
      name: 'Brent Farms Ltd.',
      email: 'farmer.brent@agrolink.gh',
      password: farmerHash,
      role: 'farmer',
      avatar: 'https://ui-avatars.com/api/?name=Brent+Farms&background=2E7D32&color=fff',
      joined: 'Feb 2026',
      status: 'active',
      plan: 'starter',
      verified: true,
      organicCertified: false,
      phone: '+233 55 987 6543',
      location: 'Northern Region',
      joinedPremiumDate: '2026-02-10',
      premiumRenewalDate: '2026-08-10',
      lastTransactionRef: 'TXN-9012',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'farmer-003',
      name: 'Kwame Agricultural Enterprise',
      email: 'kwame.farms@accra.gh',
      password: farmerHash,
      role: 'farmer',
      avatar: 'https://ui-avatars.com/api/?name=Kwame+Farms&background=1565C0&color=fff',
      joined: 'Feb 2026',
      status: 'active',
      plan: 'starter',
      verified: false,
      organicCertified: false,
      phone: '+233 20 456 7890',
      location: 'Brong-Ahafo Region',
      joinedPremiumDate: '2026-02-17',
      premiumRenewalDate: '2026-08-17',
      lastTransactionRef: 'TXN-9013',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'buyer-001',
      name: 'Accra Fresh Market',
      email: 'accra.fresh@market.gh',
      password: buyerHash,
      role: 'buyer',
      avatar: 'https://ui-avatars.com/api/?name=Accra+Fresh&background=F4C430&color=1C3322',
      joined: 'Feb 2026',
      status: 'active',
      plan: 'business',
      verified: true,
      organicCertified: false,
      phone: '+233 27 321 9876',
      location: 'Greater Accra',
      joinedPremiumDate: '2026-02-20',
      premiumRenewalDate: '2026-08-20',
      lastTransactionRef: 'TXN-9014',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'buyer-002',
      name: 'Retail Buyers Co.',
      email: 'retail@buyers.gh',
      password: buyerHash,
      role: 'buyer',
      avatar: 'https://ui-avatars.com/api/?name=Retail+Buyers&background=7B1FA2&color=fff',
      joined: 'Feb 2026',
      status: 'active',
      plan: 'free',
      verified: false,
      organicCertified: false,
      phone: '+233 30 765 4321',
      location: 'Kumasi, Ashanti',
      createdAt: new Date().toISOString(),
    },
  ];
};

// ─── Products ──────────────────────────────────────────────────────────────────

const PRODUCTS = [
  { id: 1, name: 'Fresh Tomatoes', category: 'Vegetables', farm: 'Greenfield Farm', ownerEmail: 'james.asante@agrolink.gh', location: 'Ashanti Region', phone: '+233 24 123 4567', price: 15.00, unit: 'kg', img: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&q=80', badge: 'VEGETABLES', badgeColor: '#E8F5E9', badgeTextColor: '#2E7D32', description: 'Freshly harvested organic tomatoes from the heart of Ashanti. No chemical pesticides used. Perfect for salads, sauces, and stews.', stock: '500kg available', rating: 4.8, reviews: 124, status: 'active' },
  { id: 2, name: 'Premium Maize', category: 'Grains', farm: 'Sunset Valley Farms', ownerEmail: 'james.asante@agrolink.gh', location: 'Northern Region', phone: '+233 55 987 6543', price: 10.50, unit: 'kg', img: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600&q=80', badge: 'GRAINS', badgeColor: '#FFF3E0', badgeTextColor: '#E65100', description: 'High-quality yellow maize, sun-dried and sorted for purity. Ideal for livestock feed or processing into cornmeal.', stock: '2,000kg available', rating: 4.6, reviews: 89, status: 'active' },
  { id: 3, name: 'Fresh Plantain', category: 'Fruits', farm: 'Golden Acres', ownerEmail: 'james.asante@agrolink.gh', location: 'Brong-Ahafo Region', phone: '+233 20 456 7890', price: 8.00, unit: 'bunch', img: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&q=80', badge: 'FRUITS', badgeColor: '#FFF8E1', badgeTextColor: '#FFB300', description: 'Large, firm green and ripe plantains. Sourced from the best farms in the region. Sweet and versatile.', stock: '150 bunches', rating: 4.9, reviews: 56, status: 'active' },
  { id: 4, name: 'Organic Yam', category: 'Vegetables', farm: 'Volta Ridge Farm', ownerEmail: 'james.asante@agrolink.gh', location: 'Volta Region', phone: '+233 27 321 9876', price: 12.00, unit: 'kg', img: '/images/yam.jpg', badge: 'VEGETABLES', badgeColor: '#E8F5E9', badgeTextColor: '#2E7D32', description: 'Puna yams from the Volta region. Known for their great taste and texture. Harvested weekly.', stock: '800kg available', rating: 4.7, reviews: 42, status: 'active' },
  { id: 5, name: 'Bagged Fertilizer', category: 'Fertilizers', farm: 'AgroSupply Co.', ownerEmail: 'james.asante@agrolink.gh', location: 'Greater Accra', phone: '+233 30 765 4321', price: 250.00, unit: 'bag', img: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80', badge: 'FERTILIZERS', badgeColor: '#F3E5F5', badgeTextColor: '#7B1FA2', description: 'NPK 15-15-15 multi-purpose fertilizer. Promotes healthy growth and high yields for all crop types.', stock: '50 bags available', rating: 4.5, reviews: 30, status: 'active' },
  { id: 6, name: 'Power Tiller', category: 'Machinery', farm: 'AgroTech Solutions', ownerEmail: 'james.asante@agrolink.gh', location: 'Kumasi, Ashanti', phone: '+233 26 555 1111', price: 8500.00, unit: 'unit', img: 'https://images.unsplash.com/photo-1472141521943-95eaa152873e?w=600&q=80', badge: 'MACHINERY', badgeColor: '#E3F2FD', badgeTextColor: '#1565C0', description: 'Versatile 10HP power tiller with multiple attachments. Efficient fuel consumption and easy to maintain.', stock: '3 units available', rating: 5.0, reviews: 15, status: 'active' },
  { id: 10, name: 'Power Tiller 15HP', category: 'Machinery', farm: 'Tractor Hub', ownerEmail: 'james.asante@agrolink.gh', location: 'Upper West', phone: '+233 50 123 4444', price: 8500.00, unit: 'unit', img: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=600&q=80', badge: 'MACHINERY', badgeColor: '#E3F2FD', badgeTextColor: '#1565C0', description: 'Reliable 15HP walk-behind tractor. Perfect for small to medium-scale tilling and transport.', stock: '2 units available', rating: 4.9, reviews: 8, status: 'active' },
  { id: 11, name: 'Liquid Fertilizers', category: 'Fertilizers', farm: 'Nature Growth', ownerEmail: 'james.asante@agrolink.gh', location: 'Bono Region', phone: '+233 55 222 3333', price: 45.00, unit: 'liter', img: 'https://images.unsplash.com/photo-1463123081488-789f998ac9c4?w=600&q=80', badge: 'FERTILIZERS', badgeColor: '#F3E5F5', badgeTextColor: '#7B1FA2', description: 'Organic liquid fertilizer. Fast-acting and easy to apply through irrigation or sprayers.', stock: '100 liters available', rating: 4.6, reviews: 22, status: 'active' },
  { id: 12, name: 'Fresh Ginger', category: 'Vegetables', farm: 'Spice Hills', ownerEmail: 'james.asante@agrolink.gh', location: 'Oti Region', phone: '+233 27 666 5555', price: 25.00, unit: 'kg', img: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&q=80', badge: 'VEGETABLES', badgeColor: '#E8F5E9', badgeTextColor: '#2E7D32', description: 'Pungent and aromatic ginger roots. Perfect for cooking and traditional remedies.', stock: '300kg available', rating: 4.8, reviews: 37, status: 'active' },
  { id: 13, name: 'Rice (Jasmine)', category: 'Grains', farm: 'Riverside Rice', ownerEmail: 'james.asante@agrolink.gh', location: 'Ahafo Region', phone: '+233 54 333 4444', price: 150.00, unit: 'bag', img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80', badge: 'GRAINS', badgeColor: '#FFF3E0', badgeTextColor: '#E65100', description: 'Premium long-grain jasmine rice. Fragrant and delicious. Locally parboiled and polished.', stock: '40 bags available', rating: 4.7, reviews: 51, status: 'active' },
  { id: 14, name: 'Pineapples', category: 'Fruits', farm: 'Tropical Gold', ownerEmail: 'james.asante@agrolink.gh', location: 'Central Region', phone: '+233 24 222 1111', price: 10.00, unit: 'piece', img: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=600&q=80', badge: 'FRUITS', badgeColor: '#FFF8E1', badgeTextColor: '#FFB300', description: 'Large, sweet, and juicy sugar-loaf pineapples. Harvested at peak ripeness.', stock: '200 pieces available', rating: 4.9, reviews: 33, status: 'active' },
  { id: 15, name: 'Knapsack Sprayer', category: 'Machinery', farm: 'Sprayer World', ownerEmail: 'james.asante@agrolink.gh', location: 'Savannah Region', phone: '+233 59 444 3333', price: 350.00, unit: 'unit', img: 'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?w=600&q=80', badge: 'MACHINERY', badgeColor: '#E3F2FD', badgeTextColor: '#1565C0', description: '16-liter manual knapsack sprayer. Ergonomic design and high-pressure nozzle.', stock: '15 units available', rating: 4.5, reviews: 29, status: 'active' },
  { id: 16, name: 'Cassava Tubers', category: 'Vegetables', farm: 'Roots & Shoots', ownerEmail: 'james.asante@agrolink.gh', location: 'Ahafo Region', phone: '+233 24 555 4444', price: 5.50, unit: 'kg', img: '/images/cassava.jpg', badge: 'VEGETABLES', badgeColor: '#E8F5E9', badgeTextColor: '#2E7D32', description: 'High-starch cassava tubers, perfect for fufu or starch processing. Freshly unearthed and cleaned.', stock: '1,200kg available', rating: 4.5, reviews: 67, status: 'active' },
  { id: 17, name: 'Ripe Mangoes', category: 'Fruits', farm: 'Tropical Haven', ownerEmail: 'james.asante@agrolink.gh', location: 'Upper West', phone: '+233 50 123 0000', price: 2.00, unit: 'piece', img: '/images/ripe mangoes.jpg', badge: 'FRUITS', badgeColor: '#FFF8E1', badgeTextColor: '#FFB300', description: 'Large, juicy Kent mangoes. Sweet and fiber-less. Hand-picked at peak ripeness.', stock: '1,000 pieces available', rating: 4.9, reviews: 142, status: 'active' },
  { id: 18, name: 'Sweet Potatoes', category: 'Vegetables', farm: 'Sunrise Farms', ownerEmail: 'james.asante@agrolink.gh', location: 'Central Region', phone: '+233 26 777 8888', price: 6.00, unit: 'kg', img: '/images/sweet potatoes.jpg', badge: 'VEGETABLES', badgeColor: '#E8F5E9', badgeTextColor: '#2E7D32', description: 'Orange-fleshed sweet potatoes, rich in Beta-carotene. Sweet and creamy texture.', stock: '400kg available', rating: 4.7, reviews: 38, status: 'active' },
  { id: 19, name: 'Raw Groundnuts', category: 'Grains', farm: 'Northern Sun', ownerEmail: 'james.asante@agrolink.gh', location: 'Northern Region', phone: '+233 20 111 2222', price: 25.00, unit: 'bag', img: '/images/raw groundnut.jpg', badge: 'GRAINS', badgeColor: '#FFF3E0', badgeTextColor: '#E65100', description: 'Unshelled raw groundnuts. Rich in protein and oil. Perfect for roasting or cooking.', stock: '60 bags available', rating: 4.6, reviews: 52, status: 'active' },
  { id: 20, name: 'Exotic Pawpaw', category: 'Fruits', farm: 'Orchard Bliss', ownerEmail: 'james.asante@agrolink.gh', location: 'Eastern Region', phone: '+233 24 999 0000', price: 15.00, unit: 'piece', img: '/images/pawpaw.jpg', badge: 'FRUITS', badgeColor: '#FFF8E1', badgeTextColor: '#FFB300', description: 'Large, sweet papaya with vibrant orange flesh. Nutritious and refreshing.', stock: '200 pieces available', rating: 4.8, reviews: 29, status: 'active' },
  { id: 21, name: 'Fresh Avocado', category: 'Fruits', farm: 'Hillside Groves', ownerEmail: 'james.asante@agrolink.gh', location: 'Volta Region', phone: '+233 55 444 3333', price: 4.00, unit: 'piece', img: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600&q=80', badge: 'FRUITS', badgeColor: '#FFF8E1', badgeTextColor: '#FFB300', description: 'Creamy Hass avocados. Large size and perfectly ripe for salads or smoothies.', stock: '300 pieces available', rating: 4.9, reviews: 74, status: 'active' },
  { id: 22, name: 'Green Peppers', category: 'Vegetables', farm: 'Unity Farms', ownerEmail: 'james.asante@agrolink.gh', location: 'Central Region', phone: '+233 24 888 2222', price: 20.00, unit: 'kg', img: '/images/green peppers.jpg', badge: 'VEGETABLES', badgeColor: '#E8F5E9', badgeTextColor: '#2E7D32', description: 'Crunchy and flavorful bell peppers. Organically grown and carefully packed.', stock: '200kg available', rating: 4.6, reviews: 28, status: 'active' },
  { id: 23, name: 'Soya Beans', category: 'Grains', farm: 'Savanna Harvest', ownerEmail: 'james.asante@agrolink.gh', location: 'Upper West', phone: '+233 59 111 2222', price: 18.50, unit: 'kg', img: '/images/soya beans.jpg', badge: 'GRAINS', badgeColor: '#FFF3E0', badgeTextColor: '#E65100', description: 'Cleaned and dried soya beans. High protein content, non-GMO certified.', stock: '1,500kg available', rating: 4.8, reviews: 19, status: 'active' },
  { id: 24, name: 'Sweet Oranges', category: 'Fruits', farm: 'Orchard Bliss', ownerEmail: 'james.asante@agrolink.gh', location: 'Eastern Region', phone: '+233 20 777 6666', price: 2.50, unit: 'piece', img: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=600&q=80', badge: 'FRUITS', badgeColor: '#FFF8E1', badgeTextColor: '#FFB300', description: 'Sweet and juicy oranges from the Eastern region. Organic, freshly harvested.', stock: '50 bunches available', rating: 4.8, reviews: 112, status: 'active' },
  { id: 25, name: 'Citrus Oranges', category: 'Fruits', farm: 'Orchard Bliss', ownerEmail: 'james.asante@agrolink.gh', location: 'Eastern Region', phone: '+233 54 999 0000', price: 20.00, unit: 'bag', img: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=600&q=80', badge: 'FRUITS', badgeColor: '#FFF8E1', badgeTextColor: '#FFB300', description: 'Seedless, juicy navel oranges. Very sweet and high in Vitamin C.', stock: '30 bags available', rating: 4.7, reviews: 45, status: 'active' },
  { id: 26, name: 'Snail Farm Starter Kit', category: 'Provisions', farm: 'Eco-Farm Solutions', ownerEmail: 'james.asante@agrolink.gh', location: 'Ahafo Region', phone: '+233 59 111 2222', price: 450.00, unit: 'kit', img: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&q=80', badge: 'PROVISIONS', badgeColor: '#E1F5FE', badgeTextColor: '#01579B', description: 'Complete kit for small-scale snail farming. Includes 10 breeding snails and enclosure.', stock: '5 kits available', rating: 4.4, reviews: 12, status: 'active' },
  { id: 27, name: 'Organic Honey', category: 'Provisions', farm: 'Busy Bees', ownerEmail: 'james.asante@agrolink.gh', location: 'Savannah Region', phone: '+233 20 888 7777', price: 60.00, unit: 'bottle', img: '/images/organic honey.jpg', badge: 'PROVISIONS', badgeColor: '#E1F5FE', badgeTextColor: '#01579B', description: 'Pure, unpasteurized forest honey. No additives. 750ml bottles.', stock: '25 bottles available', rating: 5.0, reviews: 28, status: 'active' },
  { id: 101, name: 'Premium Cocoa Beans', category: 'Grains', farm: 'James Asante', ownerEmail: 'james.asante@agrolink.gh', location: 'Ashanti Region', phone: '+233 24 123 4567', price: 45.00, unit: 'bag', img: '/images/cocoa beans.jpg', badge: 'GRAINS', badgeColor: '#FFF3E0', badgeTextColor: '#E65100', description: 'A-grade sun-dried cocoa beans from my farm in the Ashanti region.', stock: '20 bags available', rating: 5.0, reviews: 12, status: 'active' },
  { id: 102, name: 'Organic Cocoa Pods', category: 'Grains', farm: 'Forest Gold', ownerEmail: 'james.asante@agrolink.gh', location: 'Western North', phone: '+233 24 777 6666', price: 12.00, unit: 'pod', img: '/images/cocoa pods.jpg', badge: 'GRAINS', badgeColor: '#FFF3E0', badgeTextColor: '#E65100', description: 'Freshly harvested large cocoa pods. Sweet white pulp and high-quality beans inside.', stock: '500 pods available', rating: 4.9, reviews: 45, status: 'active' },
];

const now = new Date().toISOString();

const ORDERS = [
  { id: 'ORD-1001', productId: 1, productName: 'Fresh Tomatoes', farm: 'Greenfield Farm', img: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&q=80', buyerName: 'Retail Buyers Co.', buyerEmail: 'retail@buyers.gh', ownerEmail: 'james.asante@agrolink.gh', qty: 30, unit: 'kg', amount: 450.00, status: 'delivered', date: '2026-03-10', deliveryDate: '', deliveryTime: '', createdAt: now },
  { id: 'ORD-1002', productId: 101, productName: 'Premium Cocoa Beans', farm: 'James Asante', img: '/images/cocoa beans.jpg', buyerName: 'Accra Fresh Market', buyerEmail: 'accra.fresh@market.gh', ownerEmail: 'james.asante@agrolink.gh', qty: 20, unit: 'bag', amount: 900.00, status: 'pending', date: '2026-03-11', deliveryDate: '', deliveryTime: '', createdAt: now },
];

const BULK_ORDERS = [
  { id: 'BLK-2001', buyerName: 'Accra Fresh Market', buyerEmail: 'accra.fresh@market.gh', productName: 'Fresh Tomatoes', qty: 200, unit: 'kg', targetPrice: 12.00, status: 'pending', comments: 'Weekly bulk request for wholesale distribution.', ownerEmail: 'james.asante@agrolink.gh', date: '2026-07-20', createdAt: now },
  { id: 'BLK-2002', buyerName: 'Retail Buyers Co.', buyerEmail: 'retail@buyers.gh', productName: 'Premium Maize', qty: 1000, unit: 'kg', targetPrice: 9.50, status: 'accepted', comments: 'Requesting bulk maize supply.', ownerEmail: 'james.asante@agrolink.gh', date: '2026-07-19', createdAt: now },
];

// ─── Run seeder ────────────────────────────────────────────────────────────────

export async function runSeed() {
  console.log('\n🌱 Checking seed data...');

  const users = await DEMO_USERS();

  const [usersSeeded, productsSeeded, ordersSeeded, bulkOrdersSeeded] = await Promise.all([
    db.users.seed(users),
    db.products.seed(PRODUCTS),
    db.orders.seed(ORDERS),
    db.bulkOrders.seed(BULK_ORDERS),
  ]);

  if (!usersSeeded && !productsSeeded) {
    console.log('  ℹ️  Database already seeded, skipping.\n');
  } else {
    console.log('  ✅ Seed complete.\n');
  }
}

// ─── Allow running directly: node db/seed.js ──────────────────────────────────

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runSeed()
    .then(() => { console.log('Seed finished.'); process.exit(0); })
    .catch(err => { console.error('Seed failed:', err); process.exit(1); });
}
