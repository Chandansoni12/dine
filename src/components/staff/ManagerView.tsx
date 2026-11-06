import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { MenuItem, MenuCategory } from '../../types/restaurant';
import { RESTAURANT_TABLES } from '../../data/seedData';
import {
  TrendingUp,
  UtensilsCrossed,
  Clock,
  Award,
  RefreshCw,
  Plus,
  Trash2,
  Edit2,
  Database,
  Search,
  X,
  Sparkles,
} from 'lucide-react';

const PRESET_DISH_IMAGES = [
  { name: 'Paneer Tikka', url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500&auto=format&fit=crop&q=80' },
  { name: 'Biryani Feast', url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80' },
  { name: 'Butter Naan', url: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=500&auto=format&fit=crop&q=80' },
  { name: 'Gulab Jamun', url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=80' },
  { name: 'Masala Chai', url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500&auto=format&fit=crop&q=80' },
  { name: 'Cold Shake', url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=80' },
  { name: 'Crispy Starters', url: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=500&auto=format&fit=crop&q=80' },
  { name: 'Dal Makhani', url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=80' },
];

export const ManagerView: React.FC = () => {
  const {
    orders,
    loyaltyAccounts,
    resetDemoData,
    menuItems,
    toggleMenuItemAvailability,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
  } = useRestaurant();

  // Active Admin View Tab
  const [activeTab, setActiveTab] = useState<'menu' | 'database' | 'overview'>('menu');

  // Menu Search & Filter
  const [menuSearch, setMenuSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Add Dish Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    category: 'mains' as MenuCategory,
    priceRupees: '',
    description: '',
    isVeg: true,
    spicyLevel: 1,
    image: PRESET_DISH_IMAGES[0].url,
  });

  // Edit Dish Modal State
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editPriceRupees, setEditPriceRupees] = useState('');
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState<MenuCategory>('mains');
  const [editIsVeg, setEditIsVeg] = useState(true);
  const [editSpicyLevel, setEditSpicyLevel] = useState(1);
  const [editImage, setEditImage] = useState('');

  // Delete Confirmation State
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  // Live Database Diagnostics State
  const [dbData, setDbData] = useState<any>(null);
  const [isLoadingDb, setIsLoadingDb] = useState(false);

  // High-level KPIs
  const paidOrders = orders.filter(o => o.paymentStatus === 'PAID');
  const totalRevenuePaise = paidOrders.reduce((acc, curr) => acc + curr.totalPaise, 0);
  const activeOrdersCount = orders.filter(
    o => o.orderStatus !== 'SERVED' && o.orderStatus !== 'REJECTED'
  ).length;
  const totalLoyaltyMembers = Object.keys(loyaltyAccounts).length;

  // Fetch Neon Database Diagnostics
  const fetchDbDiagnostics = async () => {
    setIsLoadingDb(true);
    try {
      const res = await fetch('/api/admin/db-status');
      if (res.ok) {
        const data = await res.json();
        setDbData(data);
      }
    } catch (err) {
      console.error('Failed to load db diagnostics:', err);
    } finally {
      setIsLoadingDb(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'database') {
      fetchDbDiagnostics();
    }
  }, [activeTab]);

  // Handle Add Dish Submit
  const handleAddDishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(addForm.priceRupees);
    if (!addForm.name.trim() || isNaN(priceNum) || priceNum <= 0) {
      alert('Please enter a valid dish name and price');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await addMenuItem({
        name: addForm.name.trim(),
        category: addForm.category,
        description: addForm.description.trim() || 'Freshly prepared specialty dish.',
        pricePaise: Math.round(priceNum * 100),
        isVeg: addForm.isVeg,
        isAvailable: true,
        spicyLevel: addForm.spicyLevel,
        image: addForm.image || PRESET_DISH_IMAGES[0].url,
        portionOptions: [],
        addOns: [],
      });

      if (success) {
        setIsAddModalOpen(false);
        setAddForm({
          name: '',
          category: 'mains',
          priceRupees: '',
          description: '',
          isVeg: true,
          spicyLevel: 1,
          image: PRESET_DISH_IMAGES[0].url,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditPriceRupees((item.pricePaise / 100).toString());
    setEditDescription(item.description || '');
    setEditCategory(item.category);
    setEditIsVeg(item.isVeg);
    setEditSpicyLevel(item.spicyLevel || 0);
    setEditImage(item.image || '');
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    const priceNum = parseFloat(editPriceRupees);
    if (!editName.trim() || isNaN(priceNum) || priceNum <= 0) {
      alert('Please enter a valid dish name and price');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await updateMenuItem(editingItem.id, {
        name: editName.trim(),
        category: editCategory,
        pricePaise: Math.round(priceNum * 100),
        description: editDescription.trim(),
        isVeg: editIsVeg,
        spicyLevel: editSpicyLevel,
        image: editImage,
      });

      if (success) {
        setEditingItem(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Item
  const handleConfirmDelete = async (id: string) => {
    await deleteMenuItem(id);
    setDeletingItemId(null);
  };

  // Filtered Menu Items
  const filteredMenuItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(menuSearch.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-5 pb-16">
      {/* Top Admin Header & Navigation Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-black text-white tracking-tight">Admin & Manager Control Hub</h2>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-md">
              Full POS Access
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage live digital menu, verify database records in Neon PostgreSQL, and track dining performance.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab('menu')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'menu'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>Manage Menu ({menuItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'database'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Neon DB Inspector</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Analytics</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MENU MANAGEMENT & ADD DISH                                        */}
      {/* ========================================================================= */}
      {activeTab === 'menu' && (
        <div className="space-y-4">
          {/* Action Bar: Search, Category Filters, and Add Dish CTA */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={menuSearch}
                onChange={e => setMenuSearch(e.target.value)}
                placeholder="Search dish by name or ingredient..."
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs">
              {['all', 'starters', 'mains', 'breads', 'beverages', 'desserts'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg font-semibold capitalize whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Primary Action: Add Dish Button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add New Dish</span>
            </button>
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredMenuItems.map(item => {
              const inStock = item.isAvailable !== false;
              return (
                <div
                  key={item.id}
                  className={`bg-slate-900 border rounded-2xl overflow-hidden transition-all flex flex-col justify-between ${
                    inStock ? 'border-slate-800 hover:border-slate-700' : 'border-rose-900/60 bg-rose-950/10'
                  }`}
                >
                  <div className="p-3.5 flex gap-3">
                    {/* Item Image with Veg/Non-Veg Badge */}
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-800">
                      <img
                        src={item.image}
                        alt={item.name}
                        className={`w-full h-full object-cover transition-transform ${!inStock ? 'opacity-40 grayscale' : ''}`}
                      />
                      <div className="absolute top-1.5 left-1.5 bg-white/95 rounded p-0.5 shadow-sm">
                        <span
                          className={`block w-2.5 h-2.5 rounded-full ${
                            item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-bold text-sm text-white truncate leading-tight">{item.name}</h4>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                        {item.description || 'Prepared fresh on order.'}
                      </p>

                      <div className="flex items-center gap-2 mt-2">
                        <span className="font-mono font-bold text-amber-400 text-sm">
                          ₹{(item.pricePaise / 100).toFixed(0)}
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold capitalize">
                          {item.category}
                        </span>
                        {item.spicyLevel && item.spicyLevel > 0 ? (
                          <span className="text-[10px] text-amber-500 flex items-center">
                            {'🌶️'.repeat(item.spicyLevel)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="px-3.5 py-2.5 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    {/* In Stock / 86 Toggle */}
                    <button
                      onClick={() => toggleMenuItemAvailability(item.id, !inStock)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        inStock
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-rose-500/20 hover:text-rose-300'
                          : 'bg-rose-600 text-white hover:bg-emerald-600'
                      }`}
                      title={inStock ? 'Click to 86 / Mark Sold Out' : 'Click to Restock Dish'}
                    >
                      {inStock ? 'In Stock' : "86'd (Sold Out)"}
                    </button>

                    <div className="flex items-center gap-1.5">
                      {/* Edit Button */}
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        title="Edit Dish Name, Price or Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      {deletingItemId === item.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleConfirmDelete(item.id)}
                            className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setDeletingItemId(null)}
                            className="p-1 text-slate-400 hover:text-white"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingItemId(item.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-400 transition-colors"
                          title="Delete Dish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredMenuItems.length === 0 && (
            <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl">
              <UtensilsCrossed className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-300">No dishes found</p>
              <p className="text-xs text-slate-500 mt-1">Try another category or add a new dish above</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: LIVE NEON DATABASE INSPECTOR                                       */}
      {/* ========================================================================= */}
      {activeTab === 'database' && (
        <div className="space-y-4">
          {/* Database Connection Summary Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white tracking-tight">Neon PostgreSQL Cloud Database</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Live Synced</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    All dine-in orders, digital menu items, and customer stamps are safely persisted in PostgreSQL.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchDbDiagnostics}
                  disabled={isLoadingDb}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDb ? 'animate-spin' : ''}`} />
                  <span>Refresh DB Live Stats</span>
                </button>
              </div>
            </div>

            {/* Neon Cloud Direct Inspector Guide Banner */}
            <div className="p-3.5 bg-purple-950/30 border border-purple-800/40 rounded-xl flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div className="text-xs text-purple-200/90 leading-relaxed">
                <span className="font-bold text-white">How to view data in Neon Cloud Web Console: </span>
                Visit <a href="https://console.neon.tech" target="_blank" rel="noreferrer" className="underline font-bold text-purple-300 hover:text-white">console.neon.tech</a>,
                select your project, and click <strong>"Tables"</strong> on the left panel to browse <code>orders</code>, <code>menu_items</code>, and <code>loyalty_accounts</code> as a spreadsheet. You can also run custom queries in the <strong>"SQL Editor"</strong>!
              </div>
            </div>

            {/* Live Table Counts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">orders table</span>
                <div className="text-2xl font-black font-mono text-amber-400 mt-0.5">
                  {dbData?.tableCounts?.orders ?? orders.length}
                </div>
                <span className="text-[10px] text-slate-500">Live & past records</span>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">menu_items table</span>
                <div className="text-2xl font-black font-mono text-emerald-400 mt-0.5">
                  {dbData?.tableCounts?.menu_items ?? menuItems.length}
                </div>
                <span className="text-[10px] text-slate-500">Active dishes stored</span>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">loyalty_accounts</span>
                <div className="text-2xl font-black font-mono text-indigo-400 mt-0.5">
                  {dbData?.tableCounts?.loyalty_accounts ?? totalLoyaltyMembers}
                </div>
                <span className="text-[10px] text-slate-500">Registered phone wallets</span>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">service_requests</span>
                <div className="text-2xl font-black font-mono text-purple-400 mt-0.5">
                  {dbData?.tableCounts?.service_requests ?? 0}
                </div>
                <span className="text-[10px] text-slate-500">Water / Waiter calls</span>
              </div>
            </div>
          </div>

          {/* Recent Database Orders Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Recent Orders Recorded in Database</span>
                <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                  SELECT * FROM orders ORDER BY created_at DESC
                </span>
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Order ID</th>
                    <th className="py-2.5 px-3">Table</th>
                    <th className="py-2.5 px-3">Guest Name & Phone</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Payment</th>
                    <th className="py-2.5 px-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {(dbData?.recentOrders || orders.slice(0, 8)).map((o: any) => (
                    <tr key={o.id} className="hover:bg-slate-950/60 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-300">{o.id}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-white">T-{o.tableNumber || o.table_number}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-200">{o.customerName || o.customer_name || 'Guest'}</div>
                        <div className="font-mono text-[10px] text-slate-500">{o.customerPhone || o.customer_phone}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                        ₹{(((o.totalPaise || o.total_paise) ?? 0) / 100).toFixed(0)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          (o.orderStatus || o.order_status) === 'SERVED'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : (o.orderStatus || o.order_status) === 'WAITING_FOR_WAITER'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-indigo-500/20 text-indigo-300'
                        }`}>
                          {o.orderStatus || o.order_status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          (o.paymentStatus || o.payment_status) === 'PAID'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {o.paymentStatus || o.payment_status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[10px] text-slate-500">
                        {new Date(o.createdAt || o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ANALYTICS & OVERVIEW                                               */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* KPI Cards Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Today's Settled Revenue</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                ₹{(totalRevenuePaise / 100).toFixed(0)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {paidOrders.length} settled orders in database
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Active Live Orders</span>
                <UtensilsCrossed className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-amber-300">
                {activeOrdersCount}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                In verification / kitchen prep
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Loyalty Stamp Diners</span>
                <Award className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-indigo-300">
                {totalLoyaltyMembers}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Digital wallets tracked
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Avg Waiter Verification</span>
                <Clock className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-purple-300">
                38s
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Floor verification latency
              </div>
            </div>
          </div>

          {/* Tables Live Status Grid */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Table Hall Status (12 Tables)</h3>
                <p className="text-xs text-slate-400">Live floor overview of all dining tables</p>
              </div>
              <button
                onClick={resetDemoData}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Reset demo data to initial state"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Demo Data</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {RESTAURANT_TABLES.map(table => {
                const activeOrder = orders.find(
                  o => o.tableNumber === table.tableNumber && o.orderStatus !== 'SERVED' && o.orderStatus !== 'REJECTED'
                );
                return (
                  <div
                    key={table.id}
                    className={`p-3 rounded-xl border transition-all ${
                      activeOrder
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-slate-800 bg-slate-950/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-black text-sm text-white">T-{table.tableNumber}</span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          activeOrder ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                        }`}
                      />
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">{table.section}</div>
                    <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                      <span className="text-slate-500">{table.capacity} Seats</span>
                      <span className={activeOrder ? 'font-bold text-amber-400' : 'text-emerald-400 font-medium'}>
                        {activeOrder ? activeOrder.orderStatus.toLowerCase() : 'Empty'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD NEW DISH (ADMIN ONLY)                                          */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 text-white shadow-2xl max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Plus className="w-5 h-5 stroke-[3]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Add New Dish to Menu</h3>
                <p className="text-xs text-slate-400">Instantly appears on all customer mobile menus</p>
              </div>
            </div>

            <form onSubmit={handleAddDishSubmit} className="space-y-4">
              {/* Dish Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Dish Name *
                </label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="e.g. Paneer Lababdar"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              {/* Category & Price (₹) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={addForm.category}
                    onChange={e => setAddForm({ ...addForm, category: e.target.value as MenuCategory })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 capitalize"
                  >
                    <option value="starters">Starters</option>
                    <option value="mains">Mains</option>
                    <option value="breads">Breads</option>
                    <option value="beverages">Beverages</option>
                    <option value="desserts">Desserts</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Price (₹ INR) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={addForm.priceRupees}
                    onChange={e => setAddForm({ ...addForm, priceRupees: e.target.value })}
                    placeholder="e.g. 280"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              {/* Food Preference & Spicy Level */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Food Type
                  </label>
                  <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                    <button
                      type="button"
                      onClick={() => setAddForm({ ...addForm, isVeg: true })}
                      className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors ${
                        addForm.isVeg ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-white" />
                      <span>Veg</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddForm({ ...addForm, isVeg: false })}
                      className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors ${
                        !addForm.isVeg ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-white" />
                      <span>Non-Veg</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Spice Level
                  </label>
                  <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                    {[0, 1, 2, 3].map(lvl => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setAddForm({ ...addForm, spicyLevel: lvl })}
                        className={`flex-1 py-1.5 rounded-lg font-bold transition-colors ${
                          addForm.spicyLevel === lvl
                            ? 'bg-amber-500 text-slate-950'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {lvl === 0 ? 'Mild' : '🌶️'.repeat(lvl)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  value={addForm.description}
                  onChange={e => setAddForm({ ...addForm, description: e.target.value })}
                  placeholder="Ingredients, culinary style, allergy notes..."
                  rows={2}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* Preset Image Selector (Quick 1-Tap) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Select Photo Preset (or paste URL below)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_DISH_IMAGES.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAddForm({ ...addForm, image: preset.url })}
                      className={`relative rounded-xl overflow-hidden aspect-video border text-left p-1 transition-all ${
                        addForm.image === preset.url
                          ? 'border-amber-500 ring-2 ring-amber-500/40'
                          : 'border-slate-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-cover rounded-lg" />
                      <span className="absolute bottom-1 left-1 right-1 bg-black/70 text-[9px] text-white px-1 py-0.2 rounded truncate">
                        {preset.name}
                      </span>
                    </button>
                  ))}
                </div>

                <input
                  type="url"
                  value={addForm.image}
                  onChange={e => setAddForm({ ...addForm, image: e.target.value })}
                  placeholder="Custom image URL (optional)"
                  className="w-full mt-2 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-mono text-slate-300 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-sm shadow-md transition-all active:scale-[0.99] disabled:opacity-50"
              >
                {isSubmitting ? 'Adding Dish...' : 'Publish to Digital Menu'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT DISH (ADMIN ONLY)                                             */}
      {/* ========================================================================= */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 text-white shadow-2xl max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setEditingItem(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Edit2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Edit Dish: {editingItem.name}</h3>
                <p className="text-xs text-slate-400">Modify price, availability or ingredients</p>
              </div>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Dish Name *
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={editCategory}
                    onChange={e => setEditCategory(e.target.value as MenuCategory)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500 capitalize"
                  >
                    <option value="starters">Starters</option>
                    <option value="mains">Mains</option>
                    <option value="breads">Breads</option>
                    <option value="beverages">Beverages</option>
                    <option value="desserts">Desserts</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Price (₹ INR) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={editPriceRupees}
                    onChange={e => setEditPriceRupees(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Food Type
                  </label>
                  <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                    <button
                      type="button"
                      onClick={() => setEditIsVeg(true)}
                      className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors ${
                        editIsVeg ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-white" />
                      <span>Veg</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditIsVeg(false)}
                      className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors ${
                        !editIsVeg ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-white" />
                      <span>Non-Veg</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Spice Level
                  </label>
                  <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                    {[0, 1, 2, 3].map(lvl => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setEditSpicyLevel(lvl)}
                        className={`flex-1 py-1.5 rounded-lg font-bold transition-colors ${
                          editSpicyLevel === lvl
                            ? 'bg-purple-600 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {lvl === 0 ? 'Mild' : '🌶️'.repeat(lvl)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-sm shadow-md transition-all active:scale-[0.99] disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
