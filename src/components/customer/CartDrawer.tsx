import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { X, Trash2, Plus, Minus, AlertCircle, Send, ShieldAlert, Utensils } from 'lucide-react';
import { RESTAURANT_INFO } from '../../data/seedData';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSubmitted: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  onOrderSubmitted,
}) => {
  const {
    currentTable,
    customerSession,
    cartItems,
    cartSubtotalPaise,
    cartTaxPaise,
    cartTotalPaise,
    updateCartQuantity,
    removeFromCart,
    submitOrderRequest,
  } = useRestaurant();

  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmitRequest = async () => {
    setIsSubmitting(true);
    try {
      const createdOrder = await submitOrderRequest(specialInstructions);
      setIsSubmitting(false);
      if (createdOrder) {
        onClose();
        onOrderSubmitted();
      }
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white h-[94vh] sm:h-full rounded-t-3xl sm:rounded-none flex flex-col shadow-2xl overflow-hidden">
        {/* Mobile drag bar */}
        <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mt-2 sm:hidden shrink-0" />

        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-slate-900">Your Order Request</h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                Table {currentTable}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Guest: {customerSession?.name || customerSession?.phone || 'Guest'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Blueprint Key Decision Notice */}
        <div className="bg-amber-50 border-b border-amber-200 p-3.5 flex gap-2.5 items-start">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <span className="font-bold">Important Dine-In Gate: </span>
            Submitting sends a <span className="font-bold underline">REQUEST</span>. A floor waiter will physically visit Table {currentTable} to confirm your order before it reaches the kitchen.
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {cartItems.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400">
              <Utensils className="w-10 h-10 mb-2 stroke-1 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">Your cart is empty</p>
              <p className="text-xs text-slate-400 mt-1">Add some delicious dishes from the menu to build your request.</p>
            </div>
          ) : (
            cartItems.map((item, index) => (
              <div
                key={`${item.itemId}-${index}`}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate">{item.name}</h4>
                  
                  {item.selectedPortion && (
                    <p className="text-[11px] text-amber-700 font-medium">
                      Portion: {item.selectedPortion}
                    </p>
                  )}

                  {item.selectedAddOns.length > 0 && (
                    <p className="text-[11px] text-slate-500">
                      Add-ons: {item.selectedAddOns.join(', ')}
                    </p>
                  )}

                  {item.notes && (
                    <p className="text-[11px] italic text-slate-500 mt-0.5">
                      Note: "{item.notes}"
                    </p>
                  )}

                  <div className="mt-2 font-mono font-bold text-xs text-slate-800">
                    ₹{(item.totalPricePaise / 100).toFixed(0)}
                  </div>
                </div>

                {/* Quantity Adjustment Controls (Touch-optimized) */}
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1 shrink-0 shadow-xs">
                  <button
                    onClick={() => updateCartQuantity(index, item.quantity - 1)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-700 bg-slate-50 hover:bg-slate-200 active:scale-95 transition-all"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center text-xs font-mono font-bold text-slate-900">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateCartQuantity(index, item.quantity + 1)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-700 bg-slate-50 hover:bg-slate-200 active:scale-95 transition-all"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => removeFromCart(index)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:scale-95 transition-all ml-0.5"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}

          {cartItems.length > 0 && (
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Any dietary instructions for the table?
              </label>
              <textarea
                value={specialInstructions}
                onChange={e => setSpecialInstructions(e.target.value)}
                placeholder="e.g. Please bring extra plates and glasses first"
                rows={2}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
              />
            </div>
          )}
        </div>

        {/* Footer Calculation & Submit */}
        {cartItems.length > 0 && (
          <div className="p-5 bg-slate-50 border-t border-slate-200 space-y-3">
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-mono font-medium">₹{(cartSubtotalPaise / 100).toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST Tax (5%)</span>
                <span className="font-mono font-medium">₹{(cartTaxPaise / 100).toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-1.5 border-t border-slate-200">
                <span>Estimated Total</span>
                <span className="font-mono text-base text-amber-700">₹{(cartTotalPaise / 100).toFixed(0)}</span>
              </div>
            </div>

            <div className="bg-amber-100/60 rounded-lg p-2 text-center text-[11px] font-semibold text-amber-900 border border-amber-200">
              STATUS: NOT CONFIRMED (Pending Waiter Check)
            </div>

            <button
              onClick={handleSubmitRequest}
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4 text-amber-400" />
              <span>{isSubmitting ? 'Sending Request...' : 'SEND ORDER REQUEST'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
