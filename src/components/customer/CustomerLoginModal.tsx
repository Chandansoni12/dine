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
    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.replace(/\D/g, '').length < 8) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+91 ${cleanPhone}`;
    loginCustomer(formattedPhone, name.trim() || 'Guest Diner', rememberDevice);
    onClose();
  };

  const handleQuickDemoDiner = (demoName: string, demoPhone: string) => {
    setName(demoName);
    setPhone(demoPhone);
    loginCustomer(demoPhone, demoName, true);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header decoration */}
        <div className="bg-gradient-to-br from-amber-600 via-orange-600 to-amber-700 px-6 pt-7 pb-6 text-white text-center">
          <div className="w-14 h-14 mx-auto mb-3 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
            <UtensilsCrossed className="w-7 h-7 text-amber-100" />
          </div>
          <span className="text-xs uppercase font-bold tracking-widest text-amber-200">Table {currentTable} · Dine-In</span>
          <h2 className="text-2xl font-bold tracking-tight mt-1">{RESTAURANT_INFO.name}</h2>
          <p className="text-xs text-amber-100/90 mt-1">One-time mobile sign-in to order & unlock digital stamps</p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Mobile Number
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-400">
                <Phone className="w-4 h-4" />
              </span>
              <input
                type="tel"
                value={phone}
                onChange={e => {
                  setPhone(e.target.value);
                  setError('');
                }}
                placeholder="+91 98765 43210"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
                required
              />
            </div>
            {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Your Name (Optional)
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-400">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Priya"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          {/* Remember Device Checkbox */}
          <label className="flex items-start gap-3 p-3 bg-amber-50/60 rounded-xl border border-amber-100 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberDevice}
              onChange={e => setRememberDevice(e.target.checked)}
              className="mt-0.5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
            />
            <div className="text-xs">
              <span className="font-semibold text-slate-800">Remember this phone on this device</span>
              <p className="text-slate-500 mt-0.5">Stay signed in so you can view order status & stamps without logging in again.</p>
            </div>
          </label>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Continue to Table Menu
          </button>

          {/* Fast Switcher for Demo */}
          <div className="pt-3 border-t border-slate-100">
            <p className="text-[11px] font-medium text-slate-500 text-center mb-2">Or choose a quick demo customer:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoDiner('Amit Verma', '+91 98201 12345')}
                className="p-2 text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs transition-colors"
              >
                <div className="font-semibold text-slate-800 truncate">Amit Verma</div>
                <div className="text-[10px] text-slate-500">4 / 6 Stamps</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoDiner('Neha Kapoor', '+91 97110 54321')}
                className="p-2 text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs transition-colors"
              >
                <div className="font-semibold text-slate-800 truncate">Neha Kapoor</div>
                <div className="text-[10px] text-slate-500">New Guest</div>
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
