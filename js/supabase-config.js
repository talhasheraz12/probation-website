// ============================================
// Supabase Configuration & Fallback Engine
// ============================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Replace with your real Supabase project credentials from your Supabase Dashboard
const SUPABASE_URL = 'https://lvxzpglyxhseflafqhfh.supabase.co';       // e.g. https://xyzcompany.supabase.co
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2eHpwZ2x5eGhzZWZsYWZxaGZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4OTI3NDgsImV4cCI6MjEwNzQ2ODc0OH0.-3RgAyeEwtIi0istMZ0hhV0YltxQtHpRL2gm484JBrs'; // your anon/public key

// Site configuration
export const SITE = {
  name: 'Probation',
  currency: 'Rs.',
  currencyCode: 'PKR',
};

export function formatPrice(amount) {
  return `${SITE.currency} ${Number(amount || 0).toLocaleString()}`;
}

// Initial demo catalog using real photography from the brand
const DEFAULT_PRODUCTS = [
  {
    id: 'prod-001',
    name: 'Probation Heavyweight Script Hoodie',
    slug: 'probation-heavyweight-script-hoodie',
    description: 'Heavyweight custom-milled fleece hoodie in heather grey with signature cursive "Probation" script embroidery on chest. Relaxed streetwear fit with double-layered hood and ribbed cuffs.',
    price: 6500,
    compare_price: 7500,
    category: 'hoodie',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    stock: { 'S': 15, 'M': 25, 'L': 30, 'XL': 18, 'XXL': 8 },
    images: [
      '/images/products/hoodie-grey-front.webp',
      '/images/products/hoodie-grey-back.webp',
      '/images/products/hoodie-grey-closeup.webp',
      '/images/products/hoodie-grey-collar.webp',
      '/images/products/hoodie-back-detail.webp'
    ],
    image_url: '/images/products/hoodie-grey-front.webp',
    featured: true,
    active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-002',
    name: 'Probation Wide-Leg Sweatpants',
    slug: 'probation-wide-leg-sweatpants',
    description: 'Relaxed wide-leg heather grey sweatpants with embroidered cursive Probation logo at hip and botanical leaf motif near the bottom hem. Elastic waistband with flat cotton drawstrings.',
    price: 5500,
    compare_price: null,
    category: 'joggers',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    stock: { 'S': 10, 'M': 20, 'L': 25, 'XL': 12, 'XXL': 6 },
    images: [
      '/images/products/joggers-front.webp',
      '/images/products/joggers-side.webp',
      '/images/products/joggers-detail.webp'
    ],
    image_url: '/images/products/joggers-front.webp',
    featured: true,
    active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-003',
    name: 'Probation Signature Tracksuit Set',
    slug: 'probation-signature-tracksuit-set',
    description: 'Complete 2-piece heavyweight heather grey fleece set including the signature script hoodie and wide-leg sweatpants. Engineered for an effortless, premium streetwear silhouette.',
    price: 11000,
    compare_price: 12000,
    category: 'set',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    stock: { 'S': 8, 'M': 15, 'L': 20, 'XL': 10, 'XXL': 4 },
    images: [
      '/images/products/tracksuit-set-front.webp',
      '/images/products/hoodie-grey-front.webp',
      '/images/products/hoodie-grey-back.webp',
      '/images/products/joggers-front.webp'
    ],
    image_url: '/images/products/tracksuit-set-front.webp',
    featured: true,
    active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-004',
    name: 'Probation Statement Back-Print Hoodie',
    slug: 'probation-statement-backprint-hoodie',
    description: 'Statement drop featuring high-density red and weathered black typography: "LOVE\'S GONNA GET YOU KILLED BUT PRIDE\'S GONNA BE THE DEATH OF YOU" across the back panel.',
    price: 6800,
    compare_price: null,
    category: 'hoodie',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    stock: { 'S': 12, 'M': 18, 'L': 22, 'XL': 14, 'XXL': 5 },
    images: [
      '/images/products/hoodie-grey-back.webp',
      '/images/products/hoodie-back-detail.webp',
      '/images/products/hoodie-grey-collar.webp',
      '/images/products/hoodie-grey-front.webp'
    ],
    image_url: '/images/products/hoodie-grey-back.webp',
    featured: true,
    active: true,
    created_at: new Date().toISOString()
  }
];

// Helper for local mock storage
function getLocalData(key, fallback) {
  try {
    const raw = localStorage.getItem(`probation_${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setLocalData(key, data) {
  try {
    localStorage.setItem(`probation_${key}`, JSON.stringify(data));
  } catch (e) {
    console.error('Storage error:', e);
  }
}

// Local mock client for instant offline preview & testing
function createMockClient() {
  if (!localStorage.getItem('probation_products')) {
    setLocalData('products', DEFAULT_PRODUCTS);
  }
  if (!localStorage.getItem('probation_orders')) {
    setLocalData('orders', [
      {
        id: 'ord-1001',
        order_number: 1001,
        customer_name: 'Zayn Ahmed',
        customer_phone: '+92 300 1234567',
        customer_email: 'zayn@example.com',
        shipping_address: 'House 42, Street 8, Phase 5 DHA',
        city: 'Lahore',
        status: 'confirmed',
        subtotal: 11000,
        shipping_fee: 0,
        total: 11000,
        created_at: new Date(Date.now() - 3600000 * 4).toISOString()
      },
      {
        id: 'ord-1002',
        order_number: 1002,
        customer_name: 'Hamza Khan',
        customer_phone: '+92 321 9876543',
        customer_email: 'hamza@example.com',
        shipping_address: 'Apartment 4B, Clifton Block 2',
        city: 'Karachi',
        status: 'pending',
        subtotal: 6500,
        shipping_fee: 0,
        total: 6500,
        created_at: new Date(Date.now() - 3600000 * 2).toISOString()
      }
    ]);
  }
  if (!localStorage.getItem('probation_order_items')) {
    setLocalData('order_items', [
      {
        id: 'item-1',
        order_id: 'ord-1001',
        product_name: 'Probation Signature Tracksuit Set',
        size: 'L',
        quantity: 1,
        unit_price: 11000
      },
      {
        id: 'item-2',
        order_id: 'ord-1002',
        product_name: 'Probation Heavyweight Script Hoodie',
        size: 'M',
        quantity: 1,
        unit_price: 6500
      }
    ]);
  }

  return {
    auth: {
      async getSession() {
        const adminLoggedIn = localStorage.getItem('probation_admin_session') === 'true';
        return {
          data: {
            session: adminLoggedIn ? { user: { email: 'admin@probation.com' } } : null
          }
        };
      },
      async signInWithPassword({ email, password }) {
        if (email && password) {
          localStorage.setItem('probation_admin_session', 'true');
          return { data: { user: { email } }, error: null };
        }
        return { data: null, error: { message: 'Invalid credentials' } };
      },
      async signOut() {
        localStorage.removeItem('probation_admin_session');
        return { error: null };
      }
    },
    from(tableName) {
      let data = [...getLocalData(tableName, [])];
      let queryLimit = null;
      let isSingle = false;

      const builder = {
        select(fields = '*') {
          return builder;
        },
        eq(col, val) {
          data = data.filter(item => item[col] === val);
          return builder;
        },
        neq(col, val) {
          data = data.filter(item => item[col] !== val);
          return builder;
        },
        order(col, { ascending = true } = {}) {
          data.sort((a, b) => {
            if (a[col] < b[col]) return ascending ? -1 : 1;
            if (a[col] > b[col]) return ascending ? 1 : -1;
            return 0;
          });
          return builder;
        },
        limit(num) {
          queryLimit = num;
          return builder;
        },
        single() {
          isSingle = true;
          return builder;
        },
        async then(resolve) {
          let result = data;
          if (queryLimit) result = result.slice(0, queryLimit);
          if (isSingle) {
            resolve({ data: result[0] || null, error: result[0] ? null : { message: 'Not found' } });
          } else {
            resolve({ data: result, error: null });
          }
        },
        async insert(items) {
          const list = Array.isArray(items) ? items : [items];
          const current = getLocalData(tableName, []);
          const inserted = list.map((item, idx) => {
            const newItem = {
              ...item,
              id: item.id || `id-${Date.now()}-${idx}`,
              created_at: item.created_at || new Date().toISOString()
            };
            if (tableName === 'orders' && !newItem.order_number) {
              newItem.order_number = 1000 + current.length + 1;
            }
            if (newItem.images && newItem.images.length > 0 && !newItem.image_url) {
              newItem.image_url = newItem.images[0];
            }
            return newItem;
          });
          setLocalData(tableName, [...inserted, ...current]);
          return {
            data: isSingle ? inserted[0] : inserted,
            error: null,
            select() {
              return {
                single: async () => ({ data: inserted[0], error: null }),
                then: (cb) => cb({ data: inserted, error: null })
              };
            }
          };
        },
        async update(updates) {
          const current = getLocalData(tableName, []);
          const updated = current.map(item => {
            const match = data.some(d => d.id === item.id);
            return match ? { ...item, ...updates } : item;
          });
          setLocalData(tableName, updated);
          return { data: updates, error: null };
        },
        async delete() {
          const current = getLocalData(tableName, []);
          const remaining = current.filter(item => !data.some(d => d.id === item.id));
          setLocalData(tableName, remaining);
          return { error: null };
        }
      };

      return builder;
    },
    storage: {
      from(bucket) {
        return {
          async upload(path, file) {
            return {
              data: { path },
              error: null
            };
          },
          getPublicUrl(path) {
            return {
              data: {
                publicUrl: URL.createObjectURL ? URL.createObjectURL(new Blob()) : '/images/products/hoodie-grey-front.webp'
              }
            };
          }
        };
      }
    }
  };
}

// Check if live Supabase is configured
const isLiveConfigured = SUPABASE_URL && SUPABASE_URL.startsWith('https://') && SUPABASE_URL !== 'YOUR_SUPABASE_URL';

export const supabase = isLiveConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : createMockClient();
