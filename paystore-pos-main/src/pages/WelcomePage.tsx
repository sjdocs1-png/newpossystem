import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogIn, UserPlus } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import paystoreIcon from '@/assets/paystore-icon.png';

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLocale();

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        {/* Logo */}
        <div className="mb-10">
          <div className="w-24 h-24 rounded-3xl overflow-hidden mx-auto mb-5 shadow-xl ring-2 ring-primary/20">
            <img src={paystoreIcon} alt="PayStore POS" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">{t('welcome.title')}</h1>
          <p className="text-muted-foreground text-sm mt-2">{t('welcome.subtitle')}</p>
        </div>

        {/* Single Login Button */}
        <div className="space-y-3">
          <Button
            onClick={() => navigate('/auth')}
            className="w-full h-14 text-lg rounded-2xl gap-3 shadow-lg shadow-primary/20"
          >
            <LogIn className="w-5 h-5" />
            {t('auth.login')}
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate('/auth?signup=true')}
            className="w-full h-12 rounded-2xl gap-2"
          >
            <UserPlus className="w-5 h-5" />
            {t('auth.createAccount')}
          </Button>
        </div>

        {/* Footer */}
        <p className="mt-10 text-xs text-muted-foreground">
          Email + Password se login karein — role auto-detect hoga
        </p>
      </div>
    </div>
  );
};

export default WelcomePage;
