import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { StaffRole } from '../../types/restaurant';
import { Lock, X, Bell, LayoutDashboard, ChefHat, Receipt, ShieldCheck } from 'lucide-react';

interface StaffLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialRole?: StaffRole;
}

const ROLE_CONFIG: Record<StaffRole, { title: string; subtitle: string; color: string; pinPlaceholder: string; icon: React.ReactNode; defaultPin: string }> = {
  waiter: {
    title: 'Floor Waiter POS',
    subtitle: 'Verify table presence, confirm orders, attend water calls',
    color: 'amber',
    pinPlaceholder: 'PIN: 1111',
    defaultPin: '1111',
    icon: <Bell className="w-5 h-5 text-amber-400" />,
  },
  manager: {
    title: 'Admin & Manager Studio',
    subtitle: 'Add dishes, edit menu, inspect PostgreSQL database',
    color: 'purple',
    pinPlaceholder: 'PIN: 4444',
    defaultPin: '4444',
    icon: <LayoutDashboard className="w-5 h-5 text-purple-400" />,
  },
  kitchen: {
    title: 'Kitchen Display (KDS)',
    subtitle: 'Cooking queue, prep timers, 86 stock management',
    color: 'indigo',
    pinPlaceholder: 'PIN: 2222',
    defaultPin: '2222',
    icon: <ChefHat className="w-5 h-5 text-indigo-400" />,
  },
  cashier: {
    title: 'Cashier & Billing',
    subtitle: 'Settle checks (UPI/Cash/Card) & award stamp rewards',
    color: 'emerald',
    pinPlaceholder: 'PIN: 3333',
    defaultPin: '3333',
    icon: <Receipt className="w-5 h-5 text-emerald-400" />,
  },
};

export const StaffLoginModal: React.FC<StaffLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialRole = 'waiter',
}) => {
  const { loginStaffWithPin } = useRestaurant();
  const [pin, setPin] = useState('');
  const [selectedRole, setSelectedRole] = useState<StaffRole>(initialRole);
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedRole(initialRole || 'waiter');
      setPin('');
      setErrorMsg('');
    }
  }, [isOpen, initialRole]);

  if (!isOpen) return null;

  const currentConfig = ROLE_CONFIG[selectedRole] || ROLE_CONFIG.waiter;

  const handleKeyClick = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMsg('');

      // Auto-submit on 4th digit for native POS feel
      if (nextPin.length === 4) {
        verifyPin(nextPin, selectedRole);
      }
    }
  };

  const handleClear = () => {
    setPin('');
    setErrorMsg('');
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setErrorMsg('');
  };

  const verifyPin = async (pinToTest: string, roleToTest: StaffRole) => {
    setIsVerifying(true);
    try {
      const result = await loginStaffWithPin(pinToTest, roleToTest);
      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg(result.message);
        setPin('');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleQuickRoleSelect = (role: StaffRole) => {
    setSelectedRole(role);
    setPin('');
    setErrorMsg('');
  };

  const handleAutoFillAndLogin = (role: StaffRole, defaultPin: string) => {
    setSelectedRole(role);
    setPin(defaultPin);
    verifyPin(defaultPin, role);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 text-white shadow-2xl overflow-hidden max-h-[96vh] flex flex-col">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Role Picker Pills (Mobile Native Style) */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 mb-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => handleQuickRoleSelect('waiter')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
              selectedRole === 'waiter'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Waiter</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickRoleSelect('manager')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
              selectedRole === 'manager'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickRoleSelect('kitchen')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
              selectedRole === 'kitchen'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ChefHat className="w-3.5 h-3.5" />
            <span>Kitchen</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickRoleSelect('cashier')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
              selectedRole === 'cashier'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Cashier</span>
          </button>
        </div>

        {/* Selected Role Header */}
        <div className="text-center mb-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center mx-auto mb-2">
            {currentConfig.icon}
          </div>
          <h3 className="text-base font-bold tracking-tight text-white">{currentConfig.title}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{currentConfig.subtitle}</p>
        </div>

        {/* PIN Display Dots */}
        <div className="bg-slate-950 rounded-2xl p-3 border border-slate-800 text-center mb-3">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-1">
            Enter 4-Digit Security PIN
          </span>
          <div className="flex items-center justify-center gap-3 h-7">
            {[0, 1, 2, 3].map(idx => (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full border transition-all ${
                  pin.length > idx
                    ? selectedRole === 'manager'
                      ? 'bg-purple-500 border-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]'
                      : 'bg-amber-400 border-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                    : 'border-slate-700 bg-slate-900'
                }`}
              />
            ))}
          </div>
          {errorMsg && <p className="text-xs text-rose-400 mt-1.5 font-medium">{errorMsg}</p>}
        </div>

        {/* POS Touch Keypad */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyClick(num)}
              className="py-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-xl font-mono text-lg font-bold text-slate-100 transition-colors"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="py-3 bg-slate-800/40 hover:bg-slate-800 text-slate-400 rounded-xl text-xs font-semibold transition-colors"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleKeyClick('0')}
            className="py-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-xl font-mono text-lg font-bold text-slate-100 transition-colors"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="py-3 bg-slate-800/40 hover:bg-slate-800 text-slate-400 rounded-xl text-base font-semibold transition-colors"
          >
            ⌫
          </button>
        </div>

        {/* 1-Tap Quick Demo Credentials Helper */}
        <div className="pt-2.5 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
            <span className="font-medium">1-Tap Fast Demo Sign-In:</span>
            <span className="font-mono text-[10px] text-amber-400">PIN: {currentConfig.defaultPin}</span>
          </div>

          <button
            type="button"
            onClick={() => handleAutoFillAndLogin(selectedRole, currentConfig.defaultPin)}
            className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 ${
              selectedRole === 'manager'
                ? 'bg-purple-600 hover:bg-purple-500 text-white'
                : selectedRole === 'waiter'
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                : selectedRole === 'kitchen'
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Sign In as {currentConfig.title.split(' ')[0]} ({currentConfig.defaultPin})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
