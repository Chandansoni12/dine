import React, { useState } from 'react';
import { MenuItem, OrderItem } from '../../types/restaurant';
import { X, Plus, Minus, Check, Flame, Sparkles } from 'lucide-react';

interface ItemCustomizationModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (orderItem: OrderItem) => void;
}

export const ItemCustomizationModal: React.FC<ItemCustomizationModalProps> = ({
  item,
  isOpen,
  onClose,
  onAddToCart,
}) => {
  if (!isOpen || !item) return null;

  const [quantity, setQuantity] = useState(1);
  const [selectedPortion, setSelectedPortion] = useState<string>(
    item.portionOptions && item.portionOptions.length > 0 ? item.portionOptions[0].name : ''
  );
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [cookingNotes, setCookingNotes] = useState('');

  // Calculate pricing
  const portionExtra = item.portionOptions?.find(p => p.name === selectedPortion)?.priceDeltaPaise || 0;
  const addOnsExtra = (item.addOns || [])
    .filter(a => selectedAddOns.includes(a.name))
    .reduce((acc, curr) => acc + curr.pricePaise, 0);

  const singleItemPricePaise = item.pricePaise + portionExtra + addOnsExtra;
  const totalPricePaise = singleItemPricePaise * quantity;

  const handleToggleAddOn = (addonName: string) => {
    setSelectedAddOns(prev =>
      prev.includes(addonName) ? prev.filter(name => name !== addonName) : [...prev, addonName]
    );
  };

  const handleAdd = () => {
    const orderItem: OrderItem = {
      itemId: item.id,
      name: item.name,
      quantity,
      selectedPortion: selectedPortion || undefined,
      selectedAddOns,
      itemPricePaise: singleItemPricePaise,
      totalPricePaise,
      notes: cookingNotes.trim() || undefined,
    };
    onAddToCart(orderItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header Bar */}
        <div className="relative h-44 sm:h-52 w-full bg-slate-900 shrink-0">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover opacity-85"
            referrerPolicy="no-referrer"
            onError={e => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
          
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="absolute bottom-3 left-4 right-4 text-white">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-3.5 h-3.5 border border-emerald-500 rounded-sm flex items-center justify-center bg-emerald-950/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                100% Pure Vegetarian
              </span>
              {item.spicyLevel && item.spicyLevel > 0 && (
                <span className="flex items-center gap-0.5 text-xs text-amber-300 ml-2">
                  <Flame className="w-3 h-3 text-red-400 fill-red-400" />
                  <span className="text-[10px] font-semibold">{item.spicyLevel === 3 ? 'Extra Spicy' : 'Mild Spicy'}</span>
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold tracking-tight">{item.name}</h3>
            <p className="text-xs text-slate-300 line-clamp-1 mt-0.5">{item.description}</p>
          </div>
        </div>

        {/* Scrollable Customization Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-slate-800">
          {/* Portions */}
          {item.portionOptions && item.portionOptions.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Choose Portion Size
                </span>
                <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium">
                  Required
                </span>
              </div>
              <div className="space-y-2">
                {item.portionOptions.map(p => {
                  const isSelected = selectedPortion === p.name;
                  return (
                    <label
                      key={p.name}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/50 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="portion"
                          checked={isSelected}
                          onChange={() => setSelectedPortion(p.name)}
                          className="text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-sm font-medium text-slate-800">{p.name}</span>
                      </div>
                      <span className="text-xs font-mono font-semibold text-slate-700">
                        {p.priceDeltaPaise === 0 ? 'Base Price' : `+₹${(p.priceDeltaPaise / 100).toFixed(0)}`}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add-ons */}
          {item.addOns && item.addOns.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Recommended Add-Ons
                </span>
                <span className="text-[11px] text-slate-500">Optional</span>
              </div>
              <div className="space-y-2">
                {item.addOns.map(addon => {
                  const isChecked = selectedAddOns.includes(addon.name);
                  return (
                    <label
                      key={addon.id}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'border-amber-500 bg-amber-50/50'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleAddOn(addon.name)}
                          className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-sm font-medium text-slate-800">{addon.name}</span>
                      </div>
                      <span className="text-xs font-mono font-semibold text-slate-700">
                        +₹{(addon.pricePaise / 100).toFixed(0)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Special Cooking Instructions */}
          <div>
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
              Cooking Notes / Special Request
            </label>
            <input
              type="text"
              value={cookingNotes}
              onChange={e => setCookingNotes(e.target.value)}
              placeholder="e.g. Less spicy, crispy tandoor, no onions"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
            />
          </div>
        </div>

        {/* Footer with Quantity Counter & Add to Order Button */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-4 shrink-0">
          {/* Quantity Controls */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-30 transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-8 text-center text-sm font-mono font-bold text-slate-900">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(q => q + 1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Add to Order Button */}
          <button
            onClick={handleAdd}
            className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold shadow-md transition-all active:scale-[0.98] flex items-center justify-between"
          >
            <span>Add to Order</span>
            <span className="font-mono font-bold text-amber-300">
              ₹{(totalPricePaise / 100).toFixed(0)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
