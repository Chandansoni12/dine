import React, { useState, useMemo } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { MenuItem, CategoryId, OrderItem } from '../../types/restaurant';
import { Search, Flame, Plus, Minus, Sparkles, Filter, ShoppingBag } from 'lucide-react';
import { ItemCustomizationModal } from './ItemCustomizationModal';

const CATEGORIES: { id: CategoryId | 'all'; label: string }[] = [
  { id: 'all', label: 'All Items' },
  { id: 'starters', label: 'Starters' },
  { id: 'mains', label: 'Main Course' },
  { id: 'breads', label: 'Breads & Rice' },
  { id: 'beverages', label: 'Beverages' },
  { id: 'desserts', label: 'Desserts' },
];

interface CustomerMenuProps {
  onOpenCart: () => void;
}

export const CustomerMenu: React.FC<CustomerMenuProps> = ({ onOpenCart }) => {
  const { menuItems, addToCart, cartItems, cartTotalPaise, updateCartQuantity, removeFromCart } = useRestaurant();
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (vegOnly && !item.isVeg) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [menuItems, selectedCategory, vegOnly, searchQuery]);

  const getItemCartQuantity = (itemId: string) => {
    return cartItems
      .filter(c => c.itemId === itemId)
      .reduce((sum, c) => sum + c.quantity, 0);
  };

  const handleDecrement = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = cartItems.findIndex(c => c.itemId === itemId);
    if (idx !== -1) {
      if (cartItems[idx].quantity <= 1) {
        removeFromCart(idx);
      } else {
        updateCartQuantity(idx, cartItems[idx].quantity - 1);
      }
    }
  };

  const handleQuickAdd = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      (item.portionOptions && item.portionOptions.length > 0) ||
      (item.addOns && item.addOns.length > 0)
    ) {
      setCustomizingItem(item);
      return;
    }

    const orderItem: OrderItem = {
      itemId: item.id,
      name: item.name,
      quantity: 1,
      selectedAddOns: [],
      itemPricePaise: item.pricePaise,
      totalPricePaise: item.pricePaise,
    };
    addToCart(orderItem);
  };

  return (
    <div className="pb-32 max-w-5xl mx-auto px-4 pt-4">
      {/* Search and Filters Bar */}
      <div className="mb-3 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search dishes (e.g. Paneer Tikka, Dal)..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-xs transition-colors"
            />
          </div>

          {/* Veg Only Toggle */}
          <button
            onClick={() => setVegOnly(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-semibold shrink-0 transition-colors ${
              vegOnly
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <span className="w-3.5 h-3.5 border border-emerald-600 rounded-xs flex items-center justify-center bg-emerald-50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            </span>
            <span>Pure Veg</span>
          </button>
        </div>
      </div>

      {/* Sticky Category Tabs Strip for Thumb Navigation */}
      <div className="sticky top-[57px] z-30 bg-slate-50/95 backdrop-blur-md py-2 -mx-4 px-4 border-b border-slate-200/60 mb-4 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
        {CATEGORIES.map(cat => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-2 rounded-xl font-medium whitespace-nowrap transition-all shrink-0 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs scale-[1.02]'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Menu Item Cards Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <p className="text-slate-500 text-sm">No items found matching your filter.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setVegOnly(false);
            }}
            className="mt-3 text-xs text-amber-700 font-semibold hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredItems.map(item => {
            const isSoldOut = item.isAvailable === false;
            const inCartCount = getItemCartQuantity(item.id);
            const hasOptions =
              (item.portionOptions && item.portionOptions.length > 0) ||
              (item.addOns && item.addOns.length > 0);

            return (
              <div
                key={item.id}
                onClick={() => !isSoldOut && setCustomizingItem(item)}
                className={`group bg-white rounded-2xl border p-3.5 flex gap-3.5 items-center justify-between shadow-xs transition-all relative ${
                  isSoldOut
                    ? 'opacity-65 border-slate-200 cursor-not-allowed bg-slate-50/50'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-md cursor-pointer'
                }`}
              >
                {/* Left: Info */}
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {/* Veg badge */}
                    <span className="w-3.5 h-3.5 border border-emerald-600 rounded-xs flex items-center justify-center shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    </span>

                    {/* Spice Meter */}
                    {item.spicyLevel !== undefined && item.spicyLevel > 0 && (
                      <span
                        className="flex items-center text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200/80 px-1.5 py-0.2 rounded"
                        title={item.spicyLevel === 1 ? 'Mild Spice' : item.spicyLevel === 2 ? 'Medium Spice' : 'Hot Spice'}
                      >
                        <Flame className="w-2.5 h-2.5 mr-0.5 text-red-500 fill-red-500" />
                        <span>{'🌶️'.repeat(item.spicyLevel)}</span>
                      </span>
                    )}

                    {hasOptions && !isSoldOut && (
                      <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">
                        Customizable
                      </span>
                    )}

                    {isSoldOut && (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                        Sold Out Today
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 group-hover:text-amber-700 transition-colors truncate">
                    {item.name}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="mt-2 flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-slate-900">
                      ₹{(item.pricePaise / 100).toFixed(0)}
                    </span>
                  </div>
                </div>

                {/* Right: Image & Action */}
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center shrink-0 shadow-xs">
                  <img
                    src={item.image}
                    alt={item.name}
                    className={`w-full h-full object-cover transition-transform duration-300 ${
                      isSoldOut ? 'grayscale contrast-75' : 'group-hover:scale-105'
                    }`}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    onError={e => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 -z-1 flex flex-col items-center justify-center text-amber-700/60 p-2 text-center pointer-events-none">
                    <span className="font-bold text-xs uppercase tracking-wider">{item.category}</span>
                  </div>

                  {isSoldOut ? (
                    <span className="absolute bottom-2 right-2 px-2.5 py-1 bg-slate-900/90 text-white rounded-lg text-[10px] font-bold tracking-wider">
                      86'D
                    </span>
                  ) : inCartCount > 0 && (!item.portionOptions?.length && !item.addOns?.length) ? (
                    <div
                      onClick={e => e.stopPropagation()}
                      className="absolute bottom-2 right-2 bg-slate-900 text-white rounded-xl shadow-lg border border-slate-700 flex items-center overflow-hidden text-xs font-bold font-mono"
                    >
                      <button
                        onClick={e => handleDecrement(item.id, e)}
                        className="px-2.5 py-1 hover:bg-slate-800 text-amber-400 active:scale-95 transition-all"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-1 text-white min-w-[18px] text-center text-xs">{inCartCount}</span>
                      <button
                        onClick={e => handleQuickAdd(item, e)}
                        className="px-2.5 py-1 hover:bg-slate-800 text-amber-400 active:scale-95 transition-all"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={e => handleQuickAdd(item, e)}
                      className="absolute bottom-2 right-2 px-3 py-1 bg-white/95 hover:bg-white text-slate-900 rounded-xl text-xs font-bold shadow-md border border-slate-200/80 flex items-center gap-1 active:scale-95 transition-all"
                      aria-label={`Add ${item.name} to order`}
                    >
                      <Plus className="w-3 h-3 text-amber-600" />
                      <span>ADD</span>
                      {inCartCount > 0 && (
                        <span className="ml-0.5 text-[10px] text-amber-600 font-mono">({inCartCount})</span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Customization Modal */}
      <ItemCustomizationModal
        item={customizingItem}
        isOpen={Boolean(customizingItem)}
        onClose={() => setCustomizingItem(null)}
        onAddToCart={addToCart}
      />
    </div>
  );
};
