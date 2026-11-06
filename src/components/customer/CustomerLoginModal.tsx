import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Phone, User, CheckCircle2, ShieldCheck, UtensilsCrossed } from 'lucide-react';
import { RESTAURANT_INFO } from '../../data/seedData';

interface CustomerLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomerLoginModal: React.FC<CustomerLoginModalProps> = ({ isOpen, onClose }) => {
  const { loginCustomer, currentTable } = useRestaurant();
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [rememberDevice, setRememberDevice] = useState(true);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    const cleanName = name.trim();

    if (!cleanPhone || cleanPhone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit mobile number (Compulsory)');
      return;
    }

    if (!cleanName || cleanName.length < 2) {
      setError('Please enter your full name (Compulsory for table seating)');
      return;
    }

    const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+91 ${cleanPhone.replace(/^0+/, '')}`;
    loginCustomer(formattedPhone, cleanName, rememberDevice);
    onClose();
  };

  const handleQuickDemoDiner = (demoName: string, demoPhone: string) => {
    setName(demoName);
    setPhone(demoPhone);
    loginCustomer(demoPhone, demoName, true);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header decoration */}
        <div className="bg-gradient-to-br from-amber-600 via-orange-600 to-amber-700 px-6 pt-6 pb-5 text-white text-center shrink-0">
          <div className="w-12 h-12 mx-auto mb-2.5 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
            <UtensilsCrossed className="w-6 h-6 text-amber-100" />
          </div>
          <span className="text-[11px] uppercase font-bold tracking-widest text-amber-200">Table {currentTable} · Dine-In Verification</span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight mt-0.5">{RESTAURANT_INFO.name}</h2>
          <p className="text-xs text-amber-100/90 mt-1">Both Name & Mobile are required to order and track your table</p>
        </div>

        {/* Form Body - Scrollable on small screens */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Full Name Input (Compulsory) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Your Full Name <span className="text-rose-600">*</span></span>
              <span className="text-[10px] text-rose-600 font-semibold lowercase">compulsory</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-400">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={name}
                onChange={e => {
                  setName(e.target.value);
                  setError('');
                }}
                placeholder="e.g. Priya Sharma"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
                required
              />
            </div>
          </div>

          {/* Mobile Number Input (Compulsory) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Mobile Number <span className="text-rose-600">*</span></span>
              <span className="text-[10px] text-rose-600 font-semibold lowercase">compulsory</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-400">
                <Phone className="w-4 h-4" />
              </span>
              <input
                type="tel"
                value={phone}
                onChange={e => {
                  setPhone(e.target.value);
                  setError('');
                }}
                placeholder="10-digit mobile (e.g. 98765 43210)"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
                required
              />
            </div>
          </div>

          {/* Remember Device Checkbox */}
          <label className="flex items-start gap-3 p-3 bg-amber-50/70 rounded-xl border border-amber-200/80 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberDevice}
              onChange={e => setRememberDevice(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500 shrink-0"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-900">Remember this device</span>
              <p className="text-slate-600 mt-0.5 text-[11px] leading-relaxed">
                Stay signed in so you can track orders & stamps across visits without signing in again.
              </p>
            </div>
          </label>

          <button
            type="submit"
            className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Verify & Enter Table Menu</span>
          </button>

          {/* Fast Switcher for Demo */}
          <div className="pt-3 border-t border-slate-100">
            <p className="text-[11px] font-medium text-slate-500 text-center mb-2">Or 1-tap demo test diner:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoDiner('Amit Verma', '+91 98201 12345')}
                className="p-2.5 text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs transition-colors"
              >
                <div className="font-bold text-slate-900 truncate">Amit Verma</div>
                <div className="text-[10px] text-slate-500">4 / 6 Stamps (Regular)</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoDiner('Neha Kapoor', '+91 97110 54321')}
                className="p-2.5 text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs transition-colors"
              >
                <div className="font-bold text-slate-900 truncate">Neha Kapoor</div>
                <div className="text-[10px] text-slate-500">First-time Guest</div>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Secure Dine-In Verification · Table {currentTable}</span>
          </div>
        </form>
      </div>
    </div>
  );
};
