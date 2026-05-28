import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { Button } from '@/components/ui/button';
import { Delete, LogIn, Users, Lock } from 'lucide-react';
import { useHaptic, playClickSound } from '@/hooks/useHaptic';
import { cn } from '@/lib/utils';

export const LoginPage: React.FC = () => {
  const { t } = useLocale();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const { login } = useSupabaseAuth();
  const navigate = useNavigate();
  const { lightTap, success, error: errorVibrate } = useHaptic();
  const firstButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { firstButtonRef.current?.focus(); }, []);

  const handlePinInput = (digit: string) => {
    if (pin.length < 4) { lightTap(); playClickSound(); setPin(prev => prev + digit); setError(''); }
  };

  const handleClear = () => { lightTap(); setPin(''); setError(''); };
  const handleBackspace = () => { lightTap(); setPin(prev => prev.slice(0, -1)); };

  const handleLogin = async () => {
    if (pin.length !== 4) { setError(t('auth.enterPin')); errorVibrate(); return; }
    errorVibrate(); setError(t('validation.invalidFormat')); navigate('/auth');
  };

  const numpadKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t('app.name')}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t('auth.enterPin')}</p>
        </div>

        {/* PIN Display */}
        <div className="bg-card rounded-3xl border border-border p-6 mb-4">
          <div className="flex justify-center gap-3 mb-6">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  'w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-2xl font-bold transition-all',
                  pin.length > i ? 'border-primary bg-primary/10 scale-105' : 'border-border'
                )}
              >
                {pin.length > i ? '•' : ''}
              </div>
            ))}
          </div>

          {error && <p className="text-destructive text-sm text-center mb-4 font-medium">{error}</p>}

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-2.5">
            {numpadKeys.map((key, index) => (
              <button
                key={key}
                ref={index === 0 ? firstButtonRef : undefined}
                onClick={() => { if (key === 'C') handleClear(); else if (key === '⌫') handleBackspace(); else handlePinInput(key); }}
                className={cn(
                  'h-14 rounded-2xl text-xl font-bold transition-all active:scale-95 touch-manipulation',
                  key === 'C' ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-foreground hover:bg-muted'
                )}
              >
                {key === '⌫' ? <Delete className="w-6 h-6 mx-auto" /> : key}
              </button>
            ))}
          </div>
        </div>

        {/* Login Button */}
        <Button onClick={handleLogin} className="w-full h-14 text-lg rounded-2xl touch-manipulation" disabled={pin.length !== 4}>
          <LogIn className="w-5 h-5 mr-2" /> {t('auth.login')}
        </Button>

        {/* Staff Login */}
        <Button variant="outline" onClick={() => navigate('/staff-login')} className="w-full h-12 mt-3 rounded-2xl">
          <Users className="w-5 h-5 mr-2" /> {t('auth.staffLogin')}
        </Button>

        {/* Demo PINs */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground mb-2">Demo PINs:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <span className="px-3 py-2 bg-card border border-border rounded-xl">{t('staff.admin')}: 1234</span>
            <span className="px-3 py-2 bg-card border border-border rounded-xl">{t('staff.manager')}: 2345</span>
            <span className="px-3 py-2 bg-card border border-border rounded-xl">{t('staff.cashier')}: 3456</span>
            <span className="px-3 py-2 bg-card border border-border rounded-xl">{t('nav.staff')}: 5678</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
