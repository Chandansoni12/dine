import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Phone, User, Mail, CheckCircle2, ShieldCheck, UtensilsCrossed, ArrowRight, Lock } from 'lucide-react';
import { RESTAURANT_INFO } from '../../data/seedData';

interface CustomerLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenStaff?: () => void;
}

export const CustomerLoginModal: React.FC<CustomerLoginModalProps> = ({ isOpen, onClose, onOpenStaff }) => {
  const { loginCustomer, currentTable } = useRestaurant();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [rememberDevice, setRememberDevice] = useState(true);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    const cleanEmail = email.trim();

    if (!cleanName || cleanName.length < 2) {
      setError('Please enter your full name (Compulsory)');
      return;
    }

    if (!cleanPhone || cleanPhone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit mobile number (Compulsory)');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setError('Please enter a valid email address (e.g. name@example.com)');
      return;
    }

    const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+91 ${cleanPhone.replace(/^0+/, '')}`;
    loginCustomer(formattedPhone, cleanName, cleanEmail, rememberDevice);
    onClose();
  };

  const handleQuickDemoDiner = (demoName: string, demoPhone: string, demoEmail: string) => {
    setName(demoName);
    setPhone(demoPhone);
    setEmail(demoEmail);
    loginCustomer(demoPhone, demoName, demoEmail, true);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-white sm:bg-slate-950/80 sm:backdrop-blur-md sm:flex sm:items-center sm:justify-center p-0 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="relative w-full sm:max-w-md bg-white sm:rounded-3xl sm:shadow-2xl sm:border sm:border-slate-100 flex flex-col justify-between min-h-[100dvh] sm:min-h-0 sm:max-h-[94vh] overflow-hidden">
        
        {/* Top Header Section (Mobile Screen Top Banner) */}
        <div className="bg-gradient-to-br from-amber-600 via-orange-600 to-amber-700 px-5 pt-6 pb-5 text-white shrink-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-md text-amber-100">
              Table {currentTable} · Dine-In App
            </span>
            {onOpenStaff && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenStaff();
                }}
                className="flex items-center gap-1 text-[11px] font-bold bg-black/30 hover:bg-black/40 text-amber-200 px-2.5 py-1 rounded-full transition-colors"
                title="Switch to Waiter Floor or Admin Studio"
              >
                <Lock className="w-3 h-3 text-amber-300" />
                <span>Staff Portal</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shrink-0 shadow-sm">
              <UtensilsCrossed className="w-6 h-6 text-amber-100" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-white leading-tight">{RESTAURANT_INFO.name}</h2>
              <p className="text-xs text-amber-100/90 mt-0.5">Guest Verification & Digital Menu Access</p>
            </div>
          </div>
        </div>

        {/* Form Body (Optimized for Mobile Height) */}
        <form onSubmit={handleSubmit} className="flex-1 p-5 sm:p-6 flex flex-col justify-between space-y-3.5 overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3">
            {/* 1. Full Name Input (Compulsory) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Full Name <span className="text-rose-600">*</span></span>
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
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
                  required
                />
              </div>
            </div>

            {/* 2. Mobile Number Input (Compulsory) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
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
                  placeholder="10-digit number (e.g. 98765 43210)"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
                  required
                />
              </div>
            </div>

            {/* 3. Email Address Input (Compulsory) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Email Address <span className="text-rose-600">*</span></span>
                <span className="text-[10px] text-rose-600 font-semibold lowercase">compulsory</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="e.g. priya.sharma@gmail.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Remember Device Checkbox */}
            <label className="flex items-center gap-2.5 p-2.5 bg-amber-50/60 rounded-xl border border-amber-200/70 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={e => setRememberDevice(e.target.checked)}
                className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500 shrink-0"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-800">Remember this mobile</span>
                <span className="text-slate-500 text-[11px] block">No login required on your next visit</span>
              </div>
            </label>
          </div>

          {/* Action Buttons & Fast Demos */}
          <div className="space-y-3 pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white text-sm font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Verify & Start Dining →</span>
            </button>

            {/* Fast 1-Tap Demo Diners */}
            <div className="pt-2 border-t border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center mb-1.5">
                Quick 1-Tap Demo Testing
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemoDiner('Amit Verma', '+91 98201 12345', 'amit.verma@example.com')}
                  className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-colors"
                >
                  <div className="font-bold text-xs text-slate-900 truncate">Amit Verma</div>
                  <div className="text-[10px] text-slate-500 truncate">amit@example.com</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoDiner('Neha Kapoor', '+91 97110 54321', 'neha.kapoor@example.com')}
                  className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-colors"
                >
                  <div className="font-bold text-xs text-slate-900 truncate">Neha Kapoor</div>
                  <div className="text-[10px] text-slate-500 truncate">neha@example.com</div>
                </button>
              </div>
            </div>

            {/* Discreet Staff Switcher for Floor Crew */}
            {onOpenStaff && (
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenStaff();
                  }}
                  className="text-[11px] font-semibold text-slate-500 hover:text-amber-800 transition-colors"
                >
                  Restaurant Employee? <span className="underline font-bold text-slate-800">Open Waiter & Admin Portal</span>
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
