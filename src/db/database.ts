import { Pool } from 'pg';
import {
  MenuItem,
  RestaurantOrder,
  CustomerLoyalty,
  ServiceRequest,
} from '../types/restaurant';
import {
  INITIAL_MENU_ITEMS,
  INITIAL_ORDERS,
  RESTAURANT_INFO,
} from '../data/seedData';

let pool: Pool | null = null;
let isConnected = false;

// In-memory fallback stores when DATABASE_URL is not provided (e.g. offline dev)
let memoryOrders: RestaurantOrder[] = [...INITIAL_ORDERS];
let memoryMenuItems: MenuItem[] = [...INITIAL_MENU_ITEMS];
let memoryServiceRequests: ServiceRequest[] = [];
let memoryLoyaltyAccounts: Record<string, CustomerLoyalty> = {
  '+91 98201 12345': {
    phone: '+91 98201 12345',
    stampsCount: 4,
    threshold: RESTAURANT_INFO.stampTarget,
    rewardTitle: RESTAURANT_INFO.stampReward,
    history: [
      { orderId: 'R1020', date: '2026-10-24', stampsDelta: 1, note: 'Dinner Order (₹540)' },
      { orderId: 'R1025', date: '2026-10-27', stampsDelta: 1, note: 'Lunch Order (₹390)' },
      { orderId: 'R1029', date: '2026-10-31', stampsDelta: 1, note: 'Family Platter (₹820)' },
      { orderId: 'R1030', date: '2026-11-02', stampsDelta: 1, note: 'Bistro Special (₹460)' },
    ],
  },
  '+91 99887 76655': {
    phone: '+91 99887 76655',
    stampsCount: 6,
    threshold: RESTAURANT_INFO.stampTarget,
    rewardTitle: RESTAURANT_INFO.stampReward,
    history: [
      { orderId: 'R1035', date: '2026-11-03', stampsDelta: 1, note: 'Tandoor Delight (₹630)' },
    ],
  },
};

export async function initDatabase(): Promise<boolean> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log('ℹ️ DATABASE_URL not set. Running with resilient in-memory storage.');
    return false;
  }

  try {
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false },
    });

    const client = await pool.connect();
    isConnected = true;
    console.log(' Connected to PostgreSQL database!');

    // Initialize Schema
    await client.query(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        price_paise INTEGER NOT NULL,
        is_veg BOOLEAN NOT NULL DEFAULT true,
        is_available BOOLEAN NOT NULL DEFAULT true,
        spicy_level INTEGER DEFAULT 0,
        image TEXT,
        portion_options JSONB,
        add_ons JSONB
      );

      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        table_number TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        customer_name TEXT,
        items JSONB NOT NULL,
        subtotal_paise INTEGER NOT NULL,
        tax_paise INTEGER NOT NULL,
        total_paise INTEGER NOT NULL,
        order_status TEXT NOT NULL,
        payment_status TEXT NOT NULL,
        payment_method TEXT,
        created_at TEXT NOT NULL,
        waiter_action JSONB,
        kitchen_action JSONB,
        cashier_action JSONB,
        stamp_awarded BOOLEAN DEFAULT false,
        review JSONB
      );

      CREATE TABLE IF NOT EXISTS loyalty_accounts (
        phone TEXT PRIMARY KEY,
        stamps_count INTEGER NOT NULL DEFAULT 0,
        threshold INTEGER NOT NULL DEFAULT 6,
        reward_title TEXT NOT NULL,
        history JSONB NOT NULL DEFAULT '[]'
      );

      CREATE TABLE IF NOT EXISTS service_requests (
        id TEXT PRIMARY KEY,
        table_number TEXT NOT NULL,
        type TEXT NOT NULL,
        requested_at TEXT NOT NULL,
        status TEXT NOT NULL
      );
    `);

    // Seed Menu Items if empty
    const menuCountRes = await client.query('SELECT COUNT(*) FROM menu_items');
    if (parseInt(menuCountRes.rows[0].count, 10) === 0) {
      console.log('Seeding initial restaurant menu into PostgreSQL...');
      for (const item of INITIAL_MENU_ITEMS) {
        await client.query(
          `INSERT INTO menu_items (id, name, category, description, price_paise, is_veg, is_available, spicy_level, image, portion_options, add_ons)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ON CONFLICT (id) DO NOTHING`,
          [
            item.id,
            item.name,
            item.category,
            item.description,
            item.pricePaise,
            item.isVeg,
            item.isAvailable,
            item.spicyLevel || 0,
            item.image,
            JSON.stringify(item.portionOptions || []),
            JSON.stringify(item.addOns || []),
          ]
        );
      }
    }

    // Seed Initial Orders if empty
    const orderCountRes = await client.query('SELECT COUNT(*) FROM orders');
    if (parseInt(orderCountRes.rows[0].count, 10) === 0) {
      console.log('Seeding initial demonstration orders into PostgreSQL...');
      for (const order of INITIAL_ORDERS) {
        await client.query(
          `INSERT INTO orders (id, table_number, customer_phone, customer_name, items, subtotal_paise, tax_paise, total_paise, order_status, payment_status, payment_method, created_at, waiter_action, kitchen_action, cashier_action, stamp_awarded, review)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) ON CONFLICT (id) DO NOTHING`,
          [
            order.id,
            order.tableNumber,
            order.customerPhone,
            order.customerName || 'Guest Diner',
            JSON.stringify(order.items),
            order.subtotalPaise,
            order.taxPaise,
            order.totalPaise,
            order.orderStatus,
            order.paymentStatus,
            order.paymentMethod || null,
            order.createdAt,
            JSON.stringify(order.waiterAction || null),
            JSON.stringify(order.kitchenAction || null),
            JSON.stringify(order.cashierAction || null),
            order.stampAwarded,
            JSON.stringify(order.review || null),
          ]
        );
      }
    }

    client.release();
    return true;
  } catch (error) {
    console.error('⚠️ PostgreSQL Connection Error:', error);
    isConnected = false;
    return false;
  }
}

// -------------------------------------------------------------
// Database Accessors (Transparently handles PostgreSQL & Memory)
// -------------------------------------------------------------

export async function dbGetOrders(): Promise<RestaurantOrder[]> {
  if (pool && isConnected) {
    try {
      const res = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
      return res.rows.map(r => ({
        id: r.id,
        tableNumber: r.table_number,
        customerPhone: r.customer_phone,
        customerName: r.customer_name,
        items: typeof r.items === 'string' ? JSON.parse(r.items) : r.items,
        subtotalPaise: r.subtotal_paise,
        taxPaise: r.tax_paise,
        totalPaise: r.total_paise,
        orderStatus: r.order_status,
        paymentStatus: r.payment_status,
        paymentMethod: r.payment_method,
        createdAt: r.created_at,
        waiterAction: typeof r.waiter_action === 'string' ? JSON.parse(r.waiter_action) : r.waiter_action,
        kitchenAction: typeof r.kitchen_action === 'string' ? JSON.parse(r.kitchen_action) : r.kitchen_action,
        cashierAction: typeof r.cashier_action === 'string' ? JSON.parse(r.cashier_action) : r.cashier_action,
        stampAwarded: r.stamp_awarded,
        review: typeof r.review === 'string' ? JSON.parse(r.review) : r.review,
      }));
    } catch {
      // fallback
    }
  }
  return memoryOrders;
}

export async function dbSaveOrder(order: RestaurantOrder): Promise<void> {
  memoryOrders = [order, ...memoryOrders.filter(o => o.id !== order.id)];
  if (pool && isConnected) {
    try {
      await pool.query(
        `INSERT INTO orders (id, table_number, customer_phone, customer_name, items, subtotal_paise, tax_paise, total_paise, order_status, payment_status, payment_method, created_at, waiter_action, kitchen_action, cashier_action, stamp_awarded, review)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
         ON CONFLICT (id) DO UPDATE SET
           order_status = EXCLUDED.order_status,
           payment_status = EXCLUDED.payment_status,
           payment_method = EXCLUDED.payment_method,
           waiter_action = EXCLUDED.waiter_action,
           kitchen_action = EXCLUDED.kitchen_action,
           cashier_action = EXCLUDED.cashier_action,
           stamp_awarded = EXCLUDED.stamp_awarded,
           review = EXCLUDED.review`,
        [
          order.id,
          order.tableNumber,
          order.customerPhone,
          order.customerName || 'Guest Diner',
          JSON.stringify(order.items),
          order.subtotalPaise,
          order.taxPaise,
          order.totalPaise,
          order.orderStatus,
          order.paymentStatus,
          order.paymentMethod || null,
          order.createdAt,
          JSON.stringify(order.waiterAction || null),
          JSON.stringify(order.kitchenAction || null),
          JSON.stringify(order.cashierAction || null),
          order.stampAwarded,
          JSON.stringify(order.review || null),
        ]
      );
    } catch (err) {
      console.error('dbSaveOrder error:', err);
    }
  }
}

export async function dbGetMenuItems(): Promise<MenuItem[]> {
  if (pool && isConnected) {
    try {
      const res = await pool.query('SELECT * FROM menu_items ORDER BY id ASC');
      if (res.rows.length > 0) {
        return res.rows.map(r => ({
          id: r.id,
          name: r.name,
          category: r.category,
          description: r.description,
          pricePaise: r.price_paise,
          isVeg: r.is_veg,
          isAvailable: r.is_available,
          spicyLevel: r.spicy_level,
          image: r.image,
          portionOptions: typeof r.portion_options === 'string' ? JSON.parse(r.portion_options) : r.portion_options,
          addOns: typeof r.add_ons === 'string' ? JSON.parse(r.add_ons) : r.add_ons,
        }));
      }
    } catch {
      // fallback
    }
  }
  return memoryMenuItems;
}

export async function dbToggleMenuItemAvailability(id: string, isAvailable: boolean): Promise<MenuItem | null> {
  const item = memoryMenuItems.find(m => m.id === id);
  if (item) item.isAvailable = isAvailable;

  if (pool && isConnected) {
    try {
      await pool.query('UPDATE menu_items SET is_available = $1 WHERE id = $2', [isAvailable, id]);
    } catch (err) {
      console.error('dbToggleMenuItemAvailability error:', err);
    }
  }
  return item || null;
}

export async function dbGetLoyaltyAccounts(): Promise<Record<string, CustomerLoyalty>> {
  if (pool && isConnected) {
    try {
      const res = await pool.query('SELECT * FROM loyalty_accounts');
      const map: Record<string, CustomerLoyalty> = {};
      for (const r of res.rows) {
        map[r.phone] = {
          phone: r.phone,
          stampsCount: r.stamps_count,
          threshold: r.threshold,
          rewardTitle: r.reward_title,
          history: typeof r.history === 'string' ? JSON.parse(r.history) : r.history,
        };
      }
      return map;
    } catch {
      // fallback
    }
  }
  return memoryLoyaltyAccounts;
}

export async function dbSaveLoyaltyAccount(account: CustomerLoyalty): Promise<void> {
  memoryLoyaltyAccounts[account.phone] = account;
  if (pool && isConnected) {
    try {
      await pool.query(
        `INSERT INTO loyalty_accounts (phone, stamps_count, threshold, reward_title, history)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (phone) DO UPDATE SET
           stamps_count = EXCLUDED.stamps_count,
           history = EXCLUDED.history`,
        [
          account.phone,
          account.stampsCount,
          account.threshold,
          account.rewardTitle,
          JSON.stringify(account.history),
        ]
      );
    } catch (err) {
      console.error('dbSaveLoyaltyAccount error:', err);
    }
  }
}

export async function dbGetServiceRequests(): Promise<ServiceRequest[]> {
  if (pool && isConnected) {
    try {
      const res = await pool.query('SELECT * FROM service_requests ORDER BY requested_at DESC');
      return res.rows.map(r => ({
        id: r.id,
        tableNumber: r.table_number,
        type: r.type,
        requestedAt: r.requested_at,
        status: r.status,
      }));
    } catch {
      // fallback
    }
  }
  return memoryServiceRequests;
}

export async function dbSaveServiceRequest(req: ServiceRequest): Promise<void> {
  memoryServiceRequests = [req, ...memoryServiceRequests];
  if (pool && isConnected) {
    try {
      await pool.query(
        `INSERT INTO service_requests (id, table_number, type, requested_at, status)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status`,
        [req.id, req.tableNumber, req.type, req.requestedAt, req.status]
      );
    } catch (err) {
      console.error('dbSaveServiceRequest error:', err);
    }
  }
}

export async function dbResolveServiceRequest(id: string): Promise<void> {
  memoryServiceRequests = memoryServiceRequests.map(s => (s.id === id ? { ...s, status: 'resolved' } : s));
  if (pool && isConnected) {
    try {
      await pool.query("UPDATE service_requests SET status = 'resolved' WHERE id = $1", [id]);
    } catch (err) {
      console.error('dbResolveServiceRequest error:', err);
    }
  }
}

export async function dbResetDemo(): Promise<void> {
  memoryOrders = [...INITIAL_ORDERS];
  memoryMenuItems = [...INITIAL_MENU_ITEMS];
  memoryServiceRequests = [];

  if (pool && isConnected) {
    try {
      await pool.query('DELETE FROM orders');
      await pool.query('DELETE FROM service_requests');
      for (const order of INITIAL_ORDERS) {
        await dbSaveOrder(order);
      }
      for (const item of INITIAL_MENU_ITEMS) {
        await pool.query('UPDATE menu_items SET is_available = true WHERE id = $1', [item.id]);
      }
    } catch (err) {
      console.error('dbResetDemo error:', err);
    }
  }
}
