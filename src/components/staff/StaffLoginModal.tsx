import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { StaffRole } from '../../types/restaurant';
import { Shield, KeyRound, UserCheck, Lock, X } from 'lucide-react';
import { STAFF_USERS } from '../../data/seedData';

interface StaffLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialRole?: StaffRole;
}

export const StaffLoginModal: React.FC<StaffLoginModalProps> = ({ isOpen, onClose, onSuccess, initialRole = 'waiter' }) => {
  const { loginStaffWithPin } = useRestaurant();
  const [pin, setPin] = useState('');
  const [selectedRole, setSelectedRole] = useState<StaffRole>(initialRole);
  const [errorMsg, setErrorMsg] = useState('');

  // Update selected role whenever modal opens with a specific role
  React.useEffect(() => {
    if (isOpen && initialRole) {
      setSelectedRole(initialRole);
      setPin('');
      setErrorMsg('');
    }
  }, [isOpen, initialRole]);

  if (!isOpen) return null;

  const handleKeyClick = (digit: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + digit);
      setErrorMsg('');
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

  const handleVerify = async () => {
    const result = await loginStaffWithPin(pin, selectedRole);
    if (result.success) {
      onSuccess();
      onClose();
    } else {
      setErrorMsg(result.message);
      setPin('');
    }
  };

  // Quick 1-click login for easy testing
  const handleQuickRoleSelect = async (role: StaffRole, rolePin: string) => {
    setSelectedRole(role);
    setPin(rolePin);
    const result = await loginStaffWithPin(rolePin, role);
    if (result.success) {
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Lock Icon */}
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
          <Lock className="w-6 h-6" />
        </div>

        <div className="text-center mb-5">
          <h3 className="text-lg font-bold tracking-tight">Staff Operations Portal</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Restricted access for floor waiters, kitchen staff, and cashiers
          </p>
        </div>

        {/* PIN display */}
        <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 text-center mb-4">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-1">
            Enter 4-Digit Staff PIN
          </span>
          <div className="flex items-center justify-center gap-3 h-8">
            {[0, 1, 2, 3].map(idx => (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full border transition-all ${
                  pin.length > idx
                    ? 'bg-amber-400 border-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                    : 'border-slate-700 bg-slate-900'
                }`}
              />
            ))}
          </div>
          {errorMsg && <p className="text-xs text-rose-400 mt-2">{errorMsg}</p>}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyClick(num)}
              className="py-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-xl font-mono text-base font-bold text-slate-100 transition-colors"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="py-3 bg-slate-800/50 hover:bg-slate-800 text-slate-400 rounded-xl text-xs font-semibold transition-colors"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleKeyClick('0')}
            className="py-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-xl font-mono text-base font-bold text-slate-100 transition-colors"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="py-3 bg-slate-800/50 hover:bg-slate-800 text-slate-400 rounded-xl text-xs font-semibold transition-colors"
          >
            ⌫
          </button>
        </div>

        {/* Verify Button */}
        <button
          type="button"
          onClick={handleVerify}
          disabled={pin.length < 4}
          className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-slate-950 rounded-xl font-bold text-sm shadow-md transition-all active:scale-[0.99] mb-4"
        >
          Authenticate PIN
        </button>

        {/* Fast Switcher for Demo testing */}
        <div className="pt-3 border-t border-slate-800/80">
          <div className="text-[11px] text-slate-400 text-center mb-2 font-medium">
            Demo 1-Tap Role Sign-In:
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickRoleSelect('waiter', '1111')}
              className="p-2 text-left bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors"
            >
              <div className="font-bold text-amber-300">Waiter Desk</div>
              <div className="text-[10px] text-slate-400">PIN: 1111 (Floor)</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickRoleSelect('kitchen', '2222')}
              className="p-2 text-left bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors"
            >
              <div className="font-bold text-indigo-300">Kitchen KDS</div>
              <div className="text-[10px] text-slate-400">PIN: 2222 (Chefs)</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickRoleSelect('cashier', '3333')}
              className="p-2 text-left bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors"
            >
              <div className="font-bold text-emerald-300">Cashier Billing</div>
              <div className="text-[10px] text-slate-400">PIN: 3333 (Counter)</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickRoleSelect('manager', '4444')}
              className="p-2 text-left bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors"
            >
              <div className="font-bold text-purple-300">Manager Hub</div>
              <div className="text-[10px] text-slate-400">PIN: 4444 (QR Gen)</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
