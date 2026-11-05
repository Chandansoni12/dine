# QR Restaurant Platform: Customer Ordering, Loyalty & Staff Operations

A production-grade QR restaurant platform built with complete security and role separation: guests scan a table QR code for a streamlined mobile dining experience (one-time phone sign-in with device memory, ordering, live status tracking, reviews, and digital stamp wallet), while staff controls (Waiter verification gate, Kitchen KDS, Cashier billing, and Table QR management) remain strictly isolated inside a PIN-protected staff portal.

## User Review & Critical Decisions

> [!IMPORTANT]
> **Strict Separation of Guest & Staff Surfaces**: The customer interface contains **zero staff controls or admin affordances**. Customers see only their table menu, order cart, live order status, loyalty stamps, and review panel. Staff operations are housed in a dedicated staff portal protected by role-based PINs.

- **Customer One-Time Sign-In & Device Memory**: First-time scan prompts for a mobile phone number (with fast instant OTP/confirmation). Upon authentication, the device is automatically remembered via local storage so subsequent visits bypass login and directly restore loyalty stamps and active table orders.
- **Physical Waiter Verification Gate**: Submitting a cart sets the order to `WAITING_FOR_WAITER`. Kitchen chefs never see unverified orders. A waiter must physically confirm table presence from the staff portal before the order reaches the kitchen display.
- **Dedicated Staff Portal**: Accessible through a discreet footer trigger ("Staff Portal") protected by quick PIN authentication (`Waiter: 1111`, `Kitchen: 2222`, `Cashier: 3333`, `Manager: 4444`) or quick switcher for authorized personnel.
- **Culinary Theme**: Authentic culinary menu featuring starters (Paneer Tikka, Veg Spring Roll), mains (Dal Tadka, Paneer Butter Masala), breads (Butter Naan), beverages (Masala Chai, Mango Lassi), and desserts (Gulab Jamun).

---

## 1. Overview & Core Concept

### What It Does
When a diner sits at a table and scans the table QR code, the platform resolves their table context (e.g. Table 08) and welcomes them. If they are a first-time guest, a quick mobile sign-in registers them and marks their device as remembered. The guest browses the menu, customizes portions and spices, and places an order request.

Behind the scenes, floor staff in the protected staff portal receive the incoming request, physically verify that guests are seated at Table 08, and confirm the order. Once confirmed, the kitchen display automatically displays the cooking ticket with prep timers. After the meal, the guest can settle the bill directly or pay the cashier, earning digital loyalty stamps toward complimentary rewards and submitting service feedback.

### Target Personas
- **Dine-In Customer**: Wants a fast, modern mobile menu, clear order status tracking, digital stamp rewards, and no confusing staff UI clutter.
- **Waiter**: Carries a mobile staff terminal to verify pending table requests, prevent fraudulent orders from forwarded QR codes, and confirm dietary requests.
- **Kitchen Chef**: Operates the Kitchen Display System (KDS) showing only confirmed tickets, item modifiers ("Less spicy"), and elapsed prep timers.
- **Cashier**: Collects table payments (Cash, UPI QR, Card), balances receipts, and confirms loyalty stamp credits.

---

## 2. User Experience & Visual Design

### Guest Experience (Customer-Facing App)

```
[ Table QR Scan ] ───► [ One-Time Phone Sign-in ] ───► [ Digital Menu & Item Details ]
         │                     (Device Remembered)                    │
         ▼                                                            ▼
[ Loyalty Wallet & Reviews ] ◄─── [ Order Status Tracker ] ◄─── [ Submit Order Request ]
```

1. **Table QR Landing & Device Detection**:
   - URL includes table context (e.g., `?table=08`).
   - If device is already recognized, immediately opens Table 08 Welcome Screen with restaurant status.
   - If first time, presents a clean 1-time phone sign-in modal (`+91 ••••• ••210`) with automatic device memory toggle.
2. **Interactive Digital Menu**:
   - Category filtering (Starters, Main Course, Breads, Beverages, Desserts) with instant live search.
   - Dietary badges (Veg/Non-Veg indicators, spice levels).
   - Item modal: portion sizes (Regular / Large), add-ons (extra mint dip, extra butter), and cooking notes.
3. **Cart & Order Request**:
   - Clear item breakdown with subtotal, 5% GST, and grand total in ₹ INR (tabular figures).
   - Prominent notice: *"Order request will be confirmed by your waiter at Table 08"*.
   - Tap `Send Order Request` (Order #R1042 generated in state `WAITING_FOR_WAITER`).
4. **Live Order Status Tracker**:
   - Real-time progression: `Waiting for Waiter` → `Accepted & Preparing` → `Ready to Serve` → `Served`.
   - Option to request waiter assistance or bill from table.
5. **Loyalty Wallet & Post-Dining Review**:
   - Visual stamp punch card (e.g., 4 / 6 stamps toward Free Dessert).
   - Review drawer for completed orders with 5-star rating and food quality feedback.

---

### Staff Experience (PIN-Protected Operations Portal)

```
[ Discreet Footer Link ] ───► [ Role PIN Lock ] ───► [ Staff Operations Hub ]
                                                            ├── Waiter Requests Queue
                                                            ├── Kitchen Display (KDS)
                                                            ├── Cashier & Billing Terminal
                                                            └── Owner Hub & QR Generator
```

1. **Staff Portal Lock Screen**:
   - Clean, dark-mode numeric keypad for instant staff entry with fast-switch demo presets (Waiter, Kitchen, Cashier, Owner).
2. **Waiter Requests Screen**:
   - Live badge alert for pending table requests.
   - Table card displaying Table #, item summary, and guest notes.
   - Two actions: `Confirm Table Order` (transfers order to Kitchen queue) or `Reject Request` (with preset reason).
3. **Kitchen Display System (KDS)**:
   - High-contrast, large-format ticket grid displaying only confirmed orders.
   - Color-coded prep timers, strikethrough item checkboxes, and one-tap stage progression (`Start Preparing` → `Mark Ready`).
4. **Cashier & Billing Terminal**:
   - Filter active tables by bill status (`Unpaid` vs `Paid`).
   - Record settlement via Cash, UPI QR code, or Card.
   - Automatically issues digital receipt snapshot and credits loyalty stamp to customer phone number.
5. **Table QR Code Manager**:
   - Grid of restaurant tables (Tables 01–16).
   - Generates scannable QR codes for each table with direct links to the customer menu.

---

### Visual Identity & Theme
- **Customer UI**: Clean, light hospitality aesthetic (`#F8FAFC` background, `#FFFFFF` cards, warm terracotta `#D97706` and emerald `#059669` accents).
- **Staff Operations UI**: Deep slate utilitarian dark mode (`#0F172A` background, `#1E293B` surfaces) optimized for high-contrast restaurant environments and greasy hands.
- **Anti-Slop Discipline**: No arbitrary pill sandwiches, no fake telemetry tickers, and no cluttered status dots. All figures and prices use strict tabular numerals (`font-mono tabular-nums`).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Total Customer Isolation from Staff Controls**
  - *Chosen Approach*: The guest browsing the menu or checking their order has no visible buttons, tabs, or routes leading to staff controls. Staff access is discreetly placed in the page footer with a PIN challenge.
  - *Why*: Guests must never be able to approve their own orders, tamper with kitchen queues, or view other tables' billing data.

- **Decision 2: 1-Time Phone Sign-In with Device Memory (`localStorage`)**
  - *Chosen Approach*: Guests enter their phone number once. The app persists a lightweight session token in `localStorage`.
  - *Why*: Eliminates repetitive OTP prompts during a dining session while maintaining reliable loyalty stamp ledgers tied to the customer's phone number.

- **Decision 3: Server & State Enforcement of the Waiter Gate**
  - *Chosen Approach*: Kitchen queue selector query explicitly filters `orderStatus === 'CONFIRMED' || orderStatus === 'PREPARING'`. Orders in `WAITING_FOR_WAITER` are structurally excluded from kitchen visibility.
  - *Why*: Prevents fake or accidental QR scans from triggering food preparation.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        App Routing & Entrypoint                        │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼                                ▼
       ┌─────────────────────────┐      ┌─────────────────────────┐
       │   Customer Viewport     │      │   Staff Portal (PIN)    │
       │ ├─ Table QR Context     │      │ ├─ Waiter Floor Queue   │
       │ ├─ Fast Phone Sign-In   │      │ ├─ Kitchen Live KDS     │
       │ ├─ Digital Food Menu    │      │ ├─ Cashier Billing Desk │
       │ ├─ Cart & Request       │      │ └─ Owner QR Generator   │
       │ ├─ Live Tracker         │      └────────────┬────────────┘
       │ └─ Loyalty Wallet       │                   │
       └────────────┬────────────┘                   │
                    │                                │
                    └────────────────┬───────────────┘
                                     │
                                     ▼
       ┌─────────────────────────────────────────────────────────┐
       │             Central Restaurant State Engine             │
       │  • Menu Catalog (Starters, Mains, Breads, Drinks)       │
       │  • Active Table Orders & State Transitions              │
       │  • Waiter Approval Verification Audit Log               │
       │  • Cashier Payment Reconciliation                       │
       │  • Customer Loyalty Stamp Ledger                        │
       │  • Persistent Local Storage with Reactive Sync          │
       └─────────────────────────────────────────────────────────┘
```

### Core Entities & State

```typescript
// Customer session & device storage
interface CustomerSession {
  phone: string;
  name?: string;
  rememberDevice: boolean;
  tableNumber: string;
}

// Order with disconnected state machines
interface RestaurantOrder {
  id: string; // e.g. "R1042"
  tableNumber: string; // e.g. "08"
  customerPhone: string;
  items: {
    itemId: string;
    name: string;
    quantity: number;
    portion?: string;
    addOns: string[];
    pricePaise: number;
    notes?: string;
  }[];
  subtotalPaise: number;
  taxPaise: number;
  totalPaise: number;
  orderStatus: 'REQUESTED' | 'WAITING_FOR_WAITER' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'SERVED' | 'REJECTED';
  paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED';
  paymentMethod?: 'CASH' | 'UPI' | 'CARD';
  createdAt: string;
  waiterAction?: { staffId: string; confirmedAt: string; rejectionReason?: string };
  kitchenAction?: { startedAt?: string; readyAt?: string };
  cashierAction?: { cashierId: string; paidAt?: string };
  stampAwarded: boolean;
  review?: { rating: number; comment: string; createdAt: string };
}

// Loyalty stamp wallet
interface CustomerLoyalty {
  phone: string;
  stampsCount: number; // e.g. 4
  threshold: number;   // 6 stamps = Reward
  rewardTitle: string; // "Free Dessert"
  history: { orderId: string; date: string; stampsDelta: number; note: string }[];
}
```

### Interactive State Transitions

1. **Customer QR Scan**: Resolves `table=08`. If session exists in `localStorage`, loads menu. If not, prompts for phone number with "Remember this device" pre-checked.
2. **Customer Order Submission**: Adds items to cart, calculates subtotal + 5% GST, and submits. State becomes `WAITING_FOR_WAITER`.
3. **Waiter Verification**: Waiter views ticket in Staff Portal, checks physical Table 08, and clicks `Confirm Table Order`. Order transitions to `CONFIRMED`.
4. **Kitchen Preparation**: Order appears on Kitchen KDS. Chef clicks `Start Cooking` (`PREPARING`) then `Mark Ready` (`READY`).
5. **Cashier Billing & Loyalty**: Cashier selects Table 08, clicks `Record Payment`, chooses `Cash` / `UPI` / `Card`. Payment updates to `PAID`, order updates to `SERVED`, and customer loyalty account receives 1 stamp (if order is over ₹200).
6. **Customer Review**: Customer views completed order in their tracker and submits a 1-5 star review with feedback notes.
