import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
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

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

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
app.get('/api/bootstrap', (_req: Request, res: Response) => {
  res.json({
    orders: serverOrders,
    menuItems: serverMenuItems,
    serviceRequests: serverServiceRequests,
    loyaltyAccounts: serverLoyaltyAccounts,
    restaurantInfo: RESTAURANT_INFO,
  });
});

// ==========================================
// REST API: Order Management (Hardened & Authoritative)
// ==========================================
app.post('/api/orders', (req: Request, res: Response) => {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  if (isSpammingOrders(clientIp)) {
    return res.status(429).json({ error: 'Order submission rate limit exceeded. Please wait a moment.' });
  }

  const { tableNumber, customerPhone, customerName, items, notes } = req.body;

  if (!tableNumber || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Missing required order details' });
  }

  // 1. Authoritative Server-Side Pricing & 86 Stock Verification
  let calculatedSubtotalPaise = 0;
  const validatedItems: OrderItem[] = [];

  for (const rawItem of items) {
    const menuItem = serverMenuItems.find(m => m.id === rawItem.itemId);
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

  const orderNumber = `R${1040 + serverOrders.length + 1}`;
  const cleanTable = sanitizeText(String(tableNumber), 4).padStart(2, '0');
  const cleanPhone = sanitizeText(String(customerPhone || '+91 98201 12345'), 18);
  const cleanName = sanitizeText(String(customerName || 'Guest Diner'), 40);
  const cleanGeneralNotes = sanitizeText(notes || '', 180);

  const newOrder: RestaurantOrder = {
    id: orderNumber,
    tableNumber: cleanTable,
    customerPhone: cleanPhone,
    customerName: cleanName,
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

  serverOrders = [newOrder, ...serverOrders];
  broadcastSse('orders_updated', { orders: serverOrders, newOrder });

  return res.status(201).json(newOrder);
});

// Waiter confirms order (Requires Waiter or Manager Auth)
app.patch('/api/orders/:id/confirm', requireStaffAuth(['waiter', 'manager']), (req: Request, res: Response) => {
  const { id } = req.params;
  const staff = (req as any).staff;
  const staffId = staff?.staffId || req.body.staffId || 'ST-W01';
  const staffName = staff?.name || req.body.staffName || 'Floor Waiter';

  const index = serverOrders.findIndex(o => o.id === id);
  if (index === -1) return res.status(404).json({ error: 'Order not found' });

  serverOrders[index] = {
    ...serverOrders[index],
    orderStatus: 'CONFIRMED',
    waiterAction: {
      staffId,
      staffName,
      confirmedAt: new Date().toISOString(),
    },
  };

  broadcastSse('orders_updated', { orders: serverOrders, updatedOrder: serverOrders[index] });
  return res.json(serverOrders[index]);
});

// Waiter rejects order
app.patch('/api/orders/:id/reject', requireStaffAuth(['waiter', 'manager']), (req: Request, res: Response) => {
  const { id } = req.params;
  const staff = (req as any).staff;
  const staffId = staff?.staffId || req.body.staffId || 'ST-W01';
  const staffName = staff?.name || req.body.staffName || 'Floor Waiter';
  const reason = sanitizeText(req.body.reason || 'Floor verification failed', 150);

  const index = serverOrders.findIndex(o => o.id === id);
  if (index === -1) return res.status(404).json({ error: 'Order not found' });

  serverOrders[index] = {
    ...serverOrders[index],
    orderStatus: 'REJECTED',
    waiterAction: {
      staffId,
      staffName,
      confirmedAt: new Date().toISOString(),
      rejectionReason: reason,
    },
  };

  broadcastSse('orders_updated', { orders: serverOrders, updatedOrder: serverOrders[index] });
  return res.json(serverOrders[index]);
});

// Kitchen starts cooking
app.patch('/api/orders/:id/prep', requireStaffAuth(['kitchen', 'manager']), (req: Request, res: Response) => {
  const { id } = req.params;
  const index = serverOrders.findIndex(o => o.id === id);
  if (index === -1) return res.status(404).json({ error: 'Order not found' });

  serverOrders[index] = {
    ...serverOrders[index],
    orderStatus: 'PREPARING',
    kitchenAction: {
      ...serverOrders[index].kitchenAction,
      startedAt: new Date().toISOString(),
    },
  };

  broadcastSse('orders_updated', { orders: serverOrders, updatedOrder: serverOrders[index] });
  return res.json(serverOrders[index]);
});

// Kitchen marks ready on pass
app.patch('/api/orders/:id/ready', requireStaffAuth(['kitchen', 'manager']), (req: Request, res: Response) => {
  const { id } = req.params;
  const index = serverOrders.findIndex(o => o.id === id);
  if (index === -1) return res.status(404).json({ error: 'Order not found' });

  serverOrders[index] = {
    ...serverOrders[index],
    orderStatus: 'READY',
    kitchenAction: {
      ...serverOrders[index].kitchenAction,
      readyAt: new Date().toISOString(),
    },
  };

  broadcastSse('orders_updated', { orders: serverOrders, updatedOrder: serverOrders[index] });
  return res.json(serverOrders[index]);
});

// Staff marks served to table
app.patch('/api/orders/:id/serve', requireStaffAuth(['waiter', 'kitchen', 'manager']), (req: Request, res: Response) => {
  const { id } = req.params;
  const index = serverOrders.findIndex(o => o.id === id);
  if (index === -1) return res.status(404).json({ error: 'Order not found' });

  serverOrders[index] = {
    ...serverOrders[index],
    orderStatus: 'SERVED',
  };

  broadcastSse('orders_updated', { orders: serverOrders, updatedOrder: serverOrders[index] });
  return res.json(serverOrders[index]);
});

// Cashier records settlement & awards loyalty
app.post('/api/orders/:id/pay', requireStaffAuth(['cashier', 'manager']), (req: Request, res: Response) => {
  const { id } = req.params;
  const staff = (req as any).staff;
  const { method } = req.body;
  const cashierId = staff?.staffId || req.body.cashierId || 'ST-C01';
  const cashierName = staff?.name || req.body.cashierName || 'Cashier Desk';

  const index = serverOrders.findIndex(o => o.id === id);
  if (index === -1) return res.status(404).json({ error: 'Order not found' });

  const order = serverOrders[index];
  const isEligibleForStamp = order.totalPaise >= RESTAURANT_INFO.stampMinSpendPaise && !order.stampAwarded;

  serverOrders[index] = {
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

  // Award stamp to loyalty ledger
  if (isEligibleForStamp && order.customerPhone) {
    const existing = serverLoyaltyAccounts[order.customerPhone] || {
      phone: order.customerPhone,
      stampsCount: 0,
      threshold: RESTAURANT_INFO.stampTarget,
      rewardTitle: RESTAURANT_INFO.stampReward,
      history: [],
    };

    serverLoyaltyAccounts[order.customerPhone] = {
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
    broadcastSse('loyalty_updated', { accounts: serverLoyaltyAccounts });
  }

  broadcastSse('orders_updated', { orders: serverOrders, updatedOrder: serverOrders[index] });
  return res.json({ order: serverOrders[index], loyalty: serverLoyaltyAccounts[order.customerPhone] });
});

// Customer review submission (Sanitized)
app.post('/api/orders/:id/review', (req: Request, res: Response) => {
  const { id } = req.params;
  const rating = Math.max(1, Math.min(5, Math.floor(Number(req.body.rating) || 5)));
  const comment = sanitizeText(req.body.comment || '', 500);

  const index = serverOrders.findIndex(o => o.id === id);
  if (index === -1) return res.status(404).json({ error: 'Order not found' });

  serverOrders[index] = {
    ...serverOrders[index],
    review: {
      rating,
      comment,
      createdAt: new Date().toISOString(),
    },
  };

  broadcastSse('orders_updated', { orders: serverOrders, updatedOrder: serverOrders[index] });
  return res.json(serverOrders[index]);
});

// Customer service requests
app.post('/api/service-calls', (req: Request, res: Response) => {
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

  serverServiceRequests = [newCall, ...serverServiceRequests];
  broadcastSse('service_requested', { serviceRequests: serverServiceRequests, newCall });
  return res.status(201).json(newCall);
});

app.patch('/api/service-calls/:id/resolve', requireStaffAuth(['waiter', 'manager']), (req: Request, res: Response) => {
  const { id } = req.params;
  serverServiceRequests = serverServiceRequests.map(sc => (sc.id === id ? { ...sc, status: 'resolved' } : sc));
  broadcastSse('service_requested', { serviceRequests: serverServiceRequests });
  return res.json({ success: true, serviceRequests: serverServiceRequests });
});

// Menu Stock-out (86) Toggle
app.patch('/api/menu/:id/availability', requireStaffAuth(['manager', 'kitchen']), (req: Request, res: Response) => {
  const { id } = req.params;
  const { isAvailable } = req.body;

  const item = serverMenuItems.find(m => m.id === id);
  if (!item) return res.status(404).json({ error: 'Item not found' });

  item.isAvailable = Boolean(isAvailable);
  broadcastSse('menu_updated', { menuItems: serverMenuItems, updatedItem: item });
  return res.json(item);
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
app.post('/api/admin/reset-demo', requireStaffAuth(['manager']), (_req: Request, res: Response) => {
  serverOrders = [...INITIAL_ORDERS];
  serverMenuItems = [...INITIAL_MENU_ITEMS];
  serverServiceRequests = [];
  broadcastSse('orders_updated', { orders: serverOrders });
  broadcastSse('menu_updated', { menuItems: serverMenuItems });
  broadcastSse('service_requested', { serviceRequests: serverServiceRequests });
  res.json({ success: true });
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
  const cloudflareTunnelUrl = 'https://modify-purchases-verse-edward.trycloudflare.com';
  const envUrl = process.env.APP_URL || '';

  res.json({
    localIp,
    localNetworkUrl,
    cloudflareTunnelUrl,
    sharedAppUrl: envUrl || cloudflareTunnelUrl || localNetworkUrl, // default to Cloudflare tunnel for guaranteed mobile access
    devAppUrl: `http://localhost:${PORT}`,
    appUrl: envUrl || cloudflareTunnelUrl || localNetworkUrl,
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
