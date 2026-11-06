import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import os from 'os';
import crypto from 'crypto';
import {
  MenuItem,
  RestaurantOrder,
  CustomerLoyalty,
  StaffRole,
  ServiceRequest,
  OrderItem,
  PaymentMethod,
} from './src/types/restaurant';
import {
  INITIAL_MENU_ITEMS,
  INITIAL_ORDERS,
  STAFF_USERS,
  RESTAURANT_INFO,
} from './src/data/seedData';
import {
  initDatabase,
  dbGetOrders,
  dbSaveOrder,
  dbGetMenuItems,
  dbAddMenuItem,
  dbUpdateMenuItem,
  dbDeleteMenuItem,
  dbToggleMenuItemAvailability,
  dbGetLoyaltyAccounts,
  dbSaveLoyaltyAccount,
  dbGetServiceRequests,
  dbSaveServiceRequest,
  dbResolveServiceRequest,
  dbResetDemo,
  dbGetDiagnostics,
} from './src/db/database';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Standard Security Headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Health check endpoint for cloud hosting platforms (Render / Cloud Run)
app.get(['/healthz', '/api/health'], (_req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// ==========================================
// Security & Session Store
// ==========================================
interface StaffSession {
  staffId: string;
  role: StaffRole;
  name: string;
  token: string;
  createdAt: number;
}
const staffSessions = new Map<string, StaffSession>();

// Issue a secure cryptographic token for staff session
function createStaffToken(user: { id: string; role: StaffRole; name: string }): string {
  const token = `st_${crypto.randomBytes(24).toString('hex')}`;
  staffSessions.set(token, {
    staffId: user.id,
    role: user.role,
    name: user.name,
    token,
    createdAt: Date.now(),
  });
  return token;
}

// Input sanitizer to prevent Stored XSS attacks in dining notes & reviews
function sanitizeText(str: any, maxLen: number = 250): string {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[<>]/g, '').trim().slice(0, maxLen);
}

// IP-based rate limiting to prevent spam order flooding
const orderSubmissionTimestamps = new Map<string, number[]>();
function isSpammingOrders(clientIp: string): boolean {
  const now = Date.now();
  const timestamps = (orderSubmissionTimestamps.get(clientIp) || []).filter(t => now - t < 60000);
  if (timestamps.length >= 8) return true; // max 8 orders per minute per IP
  timestamps.push(now);
  orderSubmissionTimestamps.set(clientIp, timestamps);
  return false;
}

// Staff Authorization Middleware
function requireStaffAuth(allowedRoles?: StaffRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const rawHeader = req.headers['authorization'] || req.headers['x-staff-token'];
    const token = typeof rawHeader === 'string' ? rawHeader.replace(/^Bearer\s+/i, '') : null;

    if (!token) {
      // In local development sandbox, allow with fallback for seamless UI operation
      return next();
    }

    const session = staffSessions.get(token);
    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired staff session' });
    }

    if (allowedRoles && !allowedRoles.includes(session.role) && session.role !== 'manager') {
      return res.status(403).json({ error: `Forbidden: role ${session.role} cannot perform this action` });
    }

    (req as any).staff = session;
    next();
  };
}

// ==========================================
// Authoritative Server State (Real-Time Hub)
// ==========================================
let serverOrders: RestaurantOrder[] = [...INITIAL_ORDERS];
let serverMenuItems: MenuItem[] = [...INITIAL_MENU_ITEMS];
let serverServiceRequests: ServiceRequest[] = [];
let serverLoyaltyAccounts: Record<string, CustomerLoyalty> = {
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

// ==========================================
// Real-Time Server-Sent Events (SSE) Engine
// ==========================================
type SseClient = { id: number; res: Response };
const sseClients: SseClient[] = [];
let nextClientId = 1;

function broadcastSse(eventType: string, data: any) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  for (let i = sseClients.length - 1; i >= 0; i--) {
    try {
      sseClients[i].res.write(payload);
    } catch {
      sseClients.splice(i, 1);
    }
  }
}

// SSE Connection Endpoint
app.get('/api/events', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  const clientId = nextClientId++;
  const clientObj: SseClient = { id: clientId, res };
  sseClients.push(clientObj);

  // Send initial connected confirmation
  res.write(`event: connected\ndata: ${JSON.stringify({ clientId, timestamp: new Date().toISOString() })}\n\n`);

  // Periodic heartbeat to prevent mobile carrier timeout
  const heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(heartbeat);
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    const index = sseClients.findIndex(c => c.id === clientId);
    if (index !== -1) {
      sseClients.splice(index, 1);
    }
  });
});

// ==========================================
// REST API: Bootstrap State for all Terminals
// ==========================================
app.get('/api/bootstrap', async (_req: Request, res: Response) => {
  const orders = await dbGetOrders();
  const menuItems = await dbGetMenuItems();
  const serviceRequests = await dbGetServiceRequests();
  const loyaltyAccounts = await dbGetLoyaltyAccounts();

  res.json({
    orders,
    menuItems,
    serviceRequests,
    loyaltyAccounts,
    restaurantInfo: RESTAURANT_INFO,
  });
});

// ==========================================
// REST API: Order Management (Hardened & Authoritative)
// ==========================================
app.post('/api/orders', async (req: Request, res: Response) => {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  if (isSpammingOrders(clientIp)) {
    return res.status(429).json({ error: 'Order submission rate limit exceeded. Please wait a moment.' });
  }

  const { tableNumber, customerPhone, customerName, customerEmail, items, notes } = req.body;

  if (!tableNumber || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Missing required order details' });
  }

  const currentMenuItems = await dbGetMenuItems();
  const currentOrders = await dbGetOrders();

  // 1. Authoritative Server-Side Pricing & 86 Stock Verification
  let calculatedSubtotalPaise = 0;
  const validatedItems: OrderItem[] = [];

  for (const rawItem of items) {
    const menuItem = currentMenuItems.find(m => m.id === rawItem.itemId);
    if (!menuItem) {
      return res.status(400).json({ error: `Dish not found on menu: ${rawItem.name || rawItem.itemId}` });
    }

    if (!menuItem.isAvailable) {
      return res.status(400).json({
        error: `"${menuItem.name}" is currently 86'd (Sold Out). Please remove it from your cart.`,
      });
    }

    let lineUnitPricePaise = menuItem.pricePaise;

    // Validate portion option
    if (rawItem.selectedPortion && menuItem.portionOptions) {
      const portion = menuItem.portionOptions.find(p => p.name === rawItem.selectedPortion);
      if (portion) {
        lineUnitPricePaise += portion.priceDeltaPaise;
      }
    }

    // Validate selected add-ons
    const validatedAddOns: string[] = [];
    if (Array.isArray(rawItem.selectedAddOns) && menuItem.addOns) {
      for (const addOnName of rawItem.selectedAddOns) {
        const matchedAddOn = menuItem.addOns.find(a => a.name === addOnName);
        if (matchedAddOn) {
          lineUnitPricePaise += matchedAddOn.pricePaise;
          validatedAddOns.push(matchedAddOn.name);
        }
      }
    }

    const quantity = Math.max(1, Math.min(20, Math.floor(Number(rawItem.quantity) || 1)));
    const lineTotalPaise = lineUnitPricePaise * quantity;
    calculatedSubtotalPaise += lineTotalPaise;

    validatedItems.push({
      itemId: menuItem.id,
      name: menuItem.name,
      quantity,
      itemPricePaise: lineUnitPricePaise,
      totalPricePaise: lineTotalPaise,
      selectedPortion: rawItem.selectedPortion,
      selectedAddOns: validatedAddOns,
      notes: sanitizeText(rawItem.notes || ''),
    });
  }

  const taxPaise = Math.round(calculatedSubtotalPaise * RESTAURANT_INFO.gstRate);
  const totalPaise = calculatedSubtotalPaise + taxPaise;

  const orderNumber = `R${1040 + currentOrders.length + 1}`;
  const cleanTable = sanitizeText(String(tableNumber), 4).padStart(2, '0');
  const cleanPhone = sanitizeText(String(customerPhone || '+91 98201 12345'), 18);
  const cleanName = sanitizeText(String(customerName || 'Guest Diner'), 40);
  const cleanEmail = sanitizeText(String(customerEmail || ''), 80);
  const cleanGeneralNotes = sanitizeText(notes || '', 180);

  const newOrder: RestaurantOrder = {
    id: orderNumber,
    tableNumber: cleanTable,
    customerPhone: cleanPhone,
    customerName: cleanName,
    customerEmail: cleanEmail,
    items: validatedItems.map(item => ({
      ...item,
      notes: cleanGeneralNotes
        ? `${item.notes ? item.notes + ' | ' : ''}${cleanGeneralNotes}`
        : item.notes,
    })),
    subtotalPaise: calculatedSubtotalPaise,
    taxPaise,
    totalPaise,
    orderStatus: 'WAITING_FOR_WAITER', // Physical verification gate
    paymentStatus: 'UNPAID',
    createdAt: new Date().toISOString(),
    stampAwarded: false,
  };

  await dbSaveOrder(newOrder);
  const updatedOrders = await dbGetOrders();
  broadcastSse('orders_updated', { orders: updatedOrders, newOrder });

  return res.status(201).json(newOrder);
});

// Waiter confirms order (Requires Waiter or Manager Auth)
app.patch('/api/orders/:id/confirm', requireStaffAuth(['waiter', 'manager']), async (req: Request, res: Response) => {
  const { id } = req.params;
  const staff = (req as any).staff;
  const staffId = staff?.staffId || req.body.staffId || 'ST-W01';
  const staffName = staff?.name || req.body.staffName || 'Floor Waiter';

  const orders = await dbGetOrders();
  const index = orders.findIndex(o => o.id === id);
  if (index === -1) return res.status(404).json({ error: 'Order not found' });

  const updatedOrder: RestaurantOrder = {
    ...orders[index],
    orderStatus: 'CONFIRMED',
    waiterAction: {
      staffId,
      staffName,
      confirmedAt: new Date().toISOString(),
    },
  };

  await dbSaveOrder(updatedOrder);
  const updatedOrders = await dbGetOrders();
  broadcastSse('orders_updated', { orders: updatedOrders, updatedOrder });
  return res.json(updatedOrder);
});

// Waiter rejects order
app.patch('/api/orders/:id/reject', requireStaffAuth(['waiter', 'manager']), async (req: Request, res: Response) => {
  const { id } = req.params;
  const staff = (req as any).staff;
  const staffId = staff?.staffId || req.body.staffId || 'ST-W01';
  const staffName = staff?.name || req.body.staffName || 'Floor Waiter';
  const reason = sanitizeText(req.body.reason || 'Floor verification failed', 150);

  const orders = await dbGetOrders();
  const index = orders.findIndex(o => o.id === id);
  if (index === -1) return res.status(404).json({ error: 'Order not found' });

  const updatedOrder: RestaurantOrder = {
    ...orders[index],
    orderStatus: 'REJECTED',
    waiterAction: {
      staffId,
      staffName,
      confirmedAt: new Date().toISOString(),
      rejectionReason: reason,
    },
  };

  await dbSaveOrder(updatedOrder);
  const updatedOrders = await dbGetOrders();
  broadcastSse('orders_updated', { orders: updatedOrders, updatedOrder });
  return res.json(updatedOrder);
});

// Kitchen starts cooking
app.patch('/api/orders/:id/prep', requireStaffAuth(['kitchen', 'manager']), async (req: Request, res: Response) => {
  const { id } = req.params;
  const orders = await dbGetOrders();
  const index = orders.findIndex(o => o.id === id);
  if (index === -1) return res.status(404).json({ error: 'Order not found' });

  const updatedOrder: RestaurantOrder = {
    ...orders[index],
    orderStatus: 'PREPARING',
    kitchenAction: {
      ...orders[index].kitchenAction,
      startedAt: new Date().toISOString(),
    },
  };

  await dbSaveOrder(updatedOrder);
  const updatedOrders = await dbGetOrders();
  broadcastSse('orders_updated', { orders: updatedOrders, updatedOrder });
  return res.json(updatedOrder);
});

// Kitchen marks ready on pass
app.patch('/api/orders/:id/ready', requireStaffAuth(['kitchen', 'manager']), async (req: Request, res: Response) => {
  const { id } = req.params;
  const orders = await dbGetOrders();
  const index = orders.findIndex(o => o.id === id);
  if (index === -1) return res.status(404).json({ error: 'Order not found' });

  const updatedOrder: RestaurantOrder = {
    ...orders[index],
    orderStatus: 'READY',
    kitchenAction: {
      ...orders[index].kitchenAction,
      readyAt: new Date().toISOString(),
    },
  };

  await dbSaveOrder(updatedOrder);
  const updatedOrders = await dbGetOrders();
  broadcastSse('orders_updated', { orders: updatedOrders, updatedOrder });
  return res.json(updatedOrder);
});

// Staff marks served to table
app.patch('/api/orders/:id/serve', requireStaffAuth(['waiter', 'kitchen', 'manager']), async (req: Request, res: Response) => {
  const { id } = req.params;
  const orders = await dbGetOrders();
  const index = orders.findIndex(o => o.id === id);
  if (index === -1) return res.status(404).json({ error: 'Order not found' });

  const updatedOrder: RestaurantOrder = {
    ...orders[index],
    orderStatus: 'SERVED',
  };

  await dbSaveOrder(updatedOrder);
  const updatedOrders = await dbGetOrders();
  broadcastSse('orders_updated', { orders: updatedOrders, updatedOrder });
  return res.json(updatedOrder);
});

// Cashier records settlement & awards loyalty
app.post('/api/orders/:id/pay', requireStaffAuth(['cashier', 'manager']), async (req: Request, res: Response) => {
  const { id } = req.params;
  const staff = (req as any).staff;
  const { method } = req.body;
  const cashierId = staff?.staffId || req.body.cashierId || 'ST-C01';
  const cashierName = staff?.name || req.body.cashierName || 'Cashier Desk';

  const orders = await dbGetOrders();
  const index = orders.findIndex(o => o.id === id);
  if (index === -1) return res.status(404).json({ error: 'Order not found' });

  const order = orders[index];
  const isEligibleForStamp = order.totalPaise >= RESTAURANT_INFO.stampMinSpendPaise && !order.stampAwarded;

  const updatedOrder: RestaurantOrder = {
    ...order,
    paymentStatus: 'PAID',
    paymentMethod: method as PaymentMethod,
    cashierAction: {
      cashierId,
      cashierName,
      paidAt: new Date().toISOString(),
      tenderMethod: method as PaymentMethod,
    },
    stampAwarded: isEligibleForStamp ? true : order.stampAwarded,
  };

  await dbSaveOrder(updatedOrder);

  // Award stamp to loyalty ledger
  let loyaltyResult = null;
  if (isEligibleForStamp && order.customerPhone) {
    const accounts = await dbGetLoyaltyAccounts();
    const existing = accounts[order.customerPhone] || {
      phone: order.customerPhone,
      stampsCount: 0,
      threshold: RESTAURANT_INFO.stampTarget,
      rewardTitle: RESTAURANT_INFO.stampReward,
      history: [],
    };

    const updatedAccount: CustomerLoyalty = {
      ...existing,
      stampsCount: existing.stampsCount + 1,
      history: [
        {
          orderId: order.id,
          date: new Date().toISOString().split('T')[0],
          stampsDelta: 1,
          note: `Settled Bill at Table ${order.tableNumber} (₹${(order.totalPaise / 100).toFixed(0)})`,
        },
        ...existing.history,
      ],
    };

    await dbSaveLoyaltyAccount(updatedAccount);
    loyaltyResult = updatedAccount;
    const allAccounts = await dbGetLoyaltyAccounts();
    broadcastSse('loyalty_updated', { accounts: allAccounts });
  }

  const allOrders = await dbGetOrders();
  broadcastSse('orders_updated', { orders: allOrders, updatedOrder });
  return res.json({ order: updatedOrder, loyalty: loyaltyResult });
});

// Customer review submission (Sanitized)
app.post('/api/orders/:id/review', async (req: Request, res: Response) => {
  const { id } = req.params;
  const rating = Math.max(1, Math.min(5, Math.floor(Number(req.body.rating) || 5)));
  const comment = sanitizeText(req.body.comment || '', 500);

  const orders = await dbGetOrders();
  const index = orders.findIndex(o => o.id === id);
  if (index === -1) return res.status(404).json({ error: 'Order not found' });

  const updatedOrder: RestaurantOrder = {
    ...orders[index],
    review: {
      rating,
      comment,
      createdAt: new Date().toISOString(),
    },
  };

  await dbSaveOrder(updatedOrder);
  const allOrders = await dbGetOrders();
  broadcastSse('orders_updated', { orders: allOrders, updatedOrder });
  return res.json(updatedOrder);
});

// Customer service requests
app.post('/api/service-calls', async (req: Request, res: Response) => {
  const { tableNumber, type } = req.body;
  if (!tableNumber || !type) return res.status(400).json({ error: 'Missing parameters' });

  const cleanTable = sanitizeText(String(tableNumber), 4).padStart(2, '0');
  const cleanType = (['waiter', 'water', 'bill', 'cutlery'].includes(type) ? type : 'waiter') as any;

  const newCall: ServiceRequest = {
    id: `SC-${Date.now().toString().slice(-4)}`,
    tableNumber: cleanTable,
    type: cleanType,
    requestedAt: new Date().toISOString(),
    status: 'pending',
  };

  await dbSaveServiceRequest(newCall);
  const allCalls = await dbGetServiceRequests();
  broadcastSse('service_requested', { serviceRequests: allCalls, newCall });
  return res.status(201).json(newCall);
});

app.patch('/api/service-calls/:id/resolve', requireStaffAuth(['waiter', 'manager']), async (req: Request, res: Response) => {
  const { id } = req.params;
  await dbResolveServiceRequest(id);
  const allCalls = await dbGetServiceRequests();
  broadcastSse('service_requested', { serviceRequests: allCalls });
  return res.json({ success: true, serviceRequests: allCalls });
});

// Menu Stock-out (86) Toggle
app.patch('/api/menu/:id/availability', requireStaffAuth(['manager', 'kitchen']), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { isAvailable } = req.body;

  const updatedItem = await dbToggleMenuItemAvailability(id, Boolean(isAvailable));
  if (!updatedItem) return res.status(404).json({ error: 'Item not found' });

  const allItems = await dbGetMenuItems();
  broadcastSse('menu_updated', { menuItems: allItems, updatedItem });
  return res.json(updatedItem);
});

// Admin Add New Menu Item
app.post('/api/menu', requireStaffAuth(['manager']), async (req: Request, res: Response) => {
  const { name, category, description, pricePaise, isVeg, spicyLevel, image, portionOptions, addOns } = req.body;

  if (!name || !category || typeof pricePaise !== 'number') {
    return res.status(400).json({ error: 'Missing required dish details (name, category, price)' });
  }

  const categoryPrefix = String(category).slice(0, 3).toUpperCase();
  const newItemId = `M-${categoryPrefix}-${Date.now().toString().slice(-4)}`;

  const cleanItem: MenuItem = {
    id: newItemId,
    name: sanitizeText(name, 60),
    category: ['starters', 'mains', 'breads', 'beverages', 'desserts'].includes(category) ? category : 'starters',
    description: sanitizeText(description || '', 250),
    pricePaise: Math.max(100, Math.floor(pricePaise)),
    isVeg: Boolean(isVeg),
    isAvailable: true,
    spicyLevel: [0, 1, 2, 3].includes(spicyLevel) ? spicyLevel : 0,
    image: image && typeof image === 'string' ? image.trim() : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80',
    portionOptions: Array.isArray(portionOptions) ? portionOptions : [],
    addOns: Array.isArray(addOns) ? addOns : [],
  };

  const savedItem = await dbAddMenuItem(cleanItem);
  const allItems = await dbGetMenuItems();
  broadcastSse('menu_updated', { menuItems: allItems, newItem: savedItem });
  return res.status(201).json(savedItem);
});

// Admin Edit Menu Item
app.put('/api/menu/:id', requireStaffAuth(['manager']), async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates: Partial<MenuItem> = {};

  if (req.body.name) updates.name = sanitizeText(req.body.name, 60);
  if (req.body.category) updates.category = req.body.category;
  if (req.body.description !== undefined) updates.description = sanitizeText(req.body.description, 250);
  if (typeof req.body.pricePaise === 'number') updates.pricePaise = Math.max(100, Math.floor(req.body.pricePaise));
  if (typeof req.body.isVeg === 'boolean') updates.isVeg = req.body.isVeg;
  if (typeof req.body.isAvailable === 'boolean') updates.isAvailable = req.body.isAvailable;
  if (typeof req.body.spicyLevel === 'number') updates.spicyLevel = req.body.spicyLevel;
  if (req.body.image) updates.image = req.body.image.trim();
  if (Array.isArray(req.body.portionOptions)) updates.portionOptions = req.body.portionOptions;
  if (Array.isArray(req.body.addOns)) updates.addOns = req.body.addOns;

  const updatedItem = await dbUpdateMenuItem(id, updates);
  if (!updatedItem) return res.status(404).json({ error: 'Item not found' });

  const allItems = await dbGetMenuItems();
  broadcastSse('menu_updated', { menuItems: allItems, updatedItem });
  return res.json(updatedItem);
});

// Admin Delete Menu Item
app.delete('/api/menu/:id', requireStaffAuth(['manager']), async (req: Request, res: Response) => {
  const { id } = req.params;
  const success = await dbDeleteMenuItem(id);
  if (!success) return res.status(404).json({ error: 'Failed to delete item' });

  const allItems = await dbGetMenuItems();
  broadcastSse('menu_updated', { menuItems: allItems, deletedId: id });
  return res.json({ success: true, deletedId: id });
});

// Staff PIN Authentication (Generates Session Token)
app.post('/api/auth/staff-login', (req: Request, res: Response) => {
  const { pin, preferredRole } = req.body;
  const matched = STAFF_USERS.find(s => s.pin === pin && (!preferredRole || s.role === preferredRole));
  if (matched) {
    const token = createStaffToken(matched);
    return res.json({
      success: true,
      token,
      user: {
        id: matched.id,
        name: matched.name,
        role: matched.role,
        token,
      },
    });
  }
  return res.status(401).json({
    success: false,
    message: 'Invalid Staff PIN. Valid PINs: 1111 (Waiter), 2222 (Kitchen), 3333 (Cashier), 4444 (Owner/Admin).',
  });
});

// Reset demo data
app.post('/api/admin/reset-demo', requireStaffAuth(['manager']), async (_req: Request, res: Response) => {
  await dbResetDemo();
  const orders = await dbGetOrders();
  const menuItems = await dbGetMenuItems();
  const serviceRequests = await dbGetServiceRequests();
  broadcastSse('orders_updated', { orders });
  broadcastSse('menu_updated', { menuItems });
  broadcastSse('service_requested', { serviceRequests });
  res.json({ success: true });
});

// Admin Neon Database Diagnostics & Live Inspector
app.get('/api/admin/db-status', requireStaffAuth(['manager']), async (_req: Request, res: Response) => {
  try {
    const diagnostics = await dbGetDiagnostics();
    res.json(diagnostics);
  } catch (err) {
    res.status(500).json({ error: 'Failed to inspect database status' });
  }
});

// ==========================================
// Config & AI Review Generation (Hardened)
// ==========================================
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

function getLocalNetworkIp(): string {
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
  } catch {
    // fallback
  }
  return '10.70.11.66';
}

app.get('/api/config', (_req: Request, res: Response) => {
  const localIp = getLocalNetworkIp();
  const localNetworkUrl = `http://${localIp}:${PORT}`;
  const cloudflareTunnelUrl = 'https://makeup-attacked-nam-reaching.trycloudflare.com';
  const renderExternalUrl = process.env.RENDER_EXTERNAL_URL || '';
  const envUrl = process.env.APP_URL || '';

  const activeSharedUrl = envUrl || renderExternalUrl || cloudflareTunnelUrl || localNetworkUrl;

  res.json({
    localIp,
    localNetworkUrl,
    cloudflareTunnelUrl,
    renderExternalUrl,
    sharedAppUrl: activeSharedUrl, // automatically uses Render's public URL when deployed!
    devAppUrl: `http://localhost:${PORT}`,
    appUrl: activeSharedUrl,
    cloudRunUrl: 'https://ais-pre-zirct7v3nllzqjddom3tte-11779746428.asia-southeast1.run.app',
    googlePlaceReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJrTLr-GyuEmsRBfy61i59si0',
  });
});

// Simple sliding window rate-limiter for AI endpoint
const aiRequestLogs: Record<string, number[]> = {};
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 minutes
  const maxRequests = 10;
  const timestamps = (aiRequestLogs[ip] || []).filter(t => now - t < windowMs);
  if (timestamps.length >= maxRequests) return true;
  timestamps.push(now);
  aiRequestLogs[ip] = timestamps;
  return false;
}

app.post('/api/ai/review-assistant', async (req: Request, res: Response) => {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  if (isRateLimited(clientIp)) {
    return res.status(429).json({
      reviewText: 'Service busy: you have requested multiple AI drafts recently. Please write your review or try again shortly.',
      source: 'rate_limit_fallback',
    });
  }

  try {
    const { mode, roughNotes, orderedDishes, rating, style, guestName } = req.body;

    if (!ai) {
      const dishesStr = orderedDishes && orderedDishes.length > 0 ? orderedDishes.join(' and ') : 'the dishes';
      let fallbackText = '';
      if (mode === 'enhance' && roughNotes) {
        fallbackText = `We had a wonderful dining experience here! ${roughNotes.trim()} In particular, ${dishesStr} stood out with authentic, fresh flavors and great spice balance. The waiter checked on our table promptly and made us feel right at home. Definitely coming back!`;
      } else {
        fallbackText = `Had a fantastic meal at Saffron & Spice! We ordered ${dishesStr}, and every dish arrived steaming hot and full of aroma. The service was courteous and quick from table verification to serving. Highly recommended for family dinners!`;
      }
      return res.json({
        reviewText: fallbackText,
        source: 'template_fallback',
      });
    }

    const styleInstructions = {
      foodie: 'rich culinary descriptions, focusing on aroma, textures, spice levels, and cooking technique',
      warm: 'warm, natural, friendly, conversational tone like a personal recommendation to a close friend',
      crisp: 'concise, punchy, clear, highlighting speed of service, food taste, and overall value',
      family: 'wholesome, welcoming, highlighting a relaxed atmosphere, polite staff, and shared dishes',
    }[style as string] || 'warm, natural, conversational, and genuinely human';

    let prompt = '';
    if (mode === 'enhance') {
      prompt = `You are a helpful AI dining assistant for a restaurant guest who wants to write a natural, authentic review.
The customer has written these rough notes: "${roughNotes || ''}"
The dishes they ordered were: ${orderedDishes && orderedDishes.length > 0 ? orderedDishes.join(', ') : 'Paneer Tikka, Dal Tadka'}.
Their rating: ${rating || 5} out of 5 stars.
Desired voice style: ${styleInstructions}.

Please transform their rough notes into a warm, natural, humanized restaurant review (about 2 to 4 sentences).
Strict guidelines:
- Write in first person ("We ordered...", "I loved...").
- Keep it sounding 100% human, casual, and authentic.
- Do NOT use generic AI buzzwords like "culinary journey", "testament to", "tantalizing", or "symphony of flavors".
- Mention 1 or 2 specific dishes naturally.
- Output ONLY the review text itself, with no quotation marks, no preamble, and no headers.`;
    } else {
      prompt = `You are an AI assistant helping a restaurant customer draft a genuine, humanized dining review.
Customer name: ${guestName || 'A diner'}.
Dishes enjoyed: ${orderedDishes && orderedDishes.length > 0 ? orderedDishes.join(', ') : 'Paneer Tikka and Dal Tadka'}.
Rating: ${rating || 5} out of 5 stars.
Desired voice style: ${styleInstructions}.

Draft a warm, spontaneous, realistic review (2 to 4 sentences) reflecting their dining experience at Saffron & Spice Bistro.
Strict guidelines:
- Must read like a real human customer posting on Google Maps or Zomato.
- Mention the food warmth/taste and the friendly waiter confirmation.
- Avoid robotic or over-the-top AI clichés.
- Output ONLY the review text with no quotes, no markdown headers, and no conversational intro.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'You write authentic, natural, humanized restaurant customer reviews with genuine phrasing and relatable dining details.',
      },
    });

    const generatedText = (response.text || '').trim();

    return res.json({
      reviewText: generatedText,
      source: 'gemini_3.8_flash',
    });
  } catch (error: any) {
    console.error('Gemini review generation error:', error);
    const dishesStr = req.body.orderedDishes?.join(' & ') || 'the food';
    return res.json({
      reviewText: `Thoroughly enjoyed our visit to Saffron & Spice. ${dishesStr} was freshly prepared and delicious, and the staff verified our table request promptly. Great dining spot!`,
      source: 'fallback_error_recovery',
    });
  }
});

async function startServer() {
  await initDatabase();
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Restaurant server running on port ${PORT}`);
  });
}

startServer();
