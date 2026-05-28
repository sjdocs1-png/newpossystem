import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Delete, LogIn, Users, Fingerprint, Loader2, CheckCircle } from 'lucide-react';
import { useHaptic, playClickSound } from '@/hooks/useHaptic';
import { toast } from '@/hooks/use-toast';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';

interface StaffMember {
  id: string;
  name: string;
  pin: string;
  role: string;
  phone: string;
}

type VerificationStep = 'pin' | 'biometric' | 'complete';

export const StaffLoginPage: React.FC = () => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [verificationStep, setVerificationStep] = useState<VerificationStep>('pin');
  const [verifiedStaff, setVerifiedStaff] = useState<StaffMember | null>(null);
  const [biometricStatus, setBiometricStatus] = useState<'pending' | 'success' | 'failed' | 'skipped'>('pending');
  const staffRef = useRef<StaffMember | null>(null);
  
  const navigate = useNavigate();
  const { lightTap, success, error: errorVibrate } = useHaptic();
  const firstButtonRef = useRef<HTMLButtonElement>(null);
  
  const { quickBiometricCheck, isAuthenticating } = useBiometricAuth();

  useEffect(() => {
    firstButtonRef.current?.focus();
  }, []);

  const handlePinInput = (digit: string) => {
    lightTap();
    playClickSound();
    setPin(prev => prev + digit);
    setError('');
  };

  const handleClear = () => {
    lightTap();
    setPin('');
    setError('');
  };

  const handleBackspace = () => {
    lightTap();
    setPin(prev => prev.slice(0, -1));
  };

  const handlePinVerification = () => {
    if (pin.length === 0) {
      setError('Please enter your PIN');
      errorVibrate();
      return;
    }

    const staffList: StaffMember[] = JSON.parse(localStorage.getItem('pos_staff') || '[]');
    const staff = staffList.find(s => s.pin === pin);

    if (staff) {
      staffRef.current = staff;
      setVerifiedStaff(staff);
      setVerificationStep('biometric');
      startBiometricVerification(staff);
    } else {
      errorVibrate();
      setError('Invalid PIN. Please try again.');
      setPin('');
    }
  };

  const startBiometricVerification = async (staff: StaffMember) => {
    setBiometricStatus('pending');
    const result = await quickBiometricCheck();
    
    if (result.success) {
      setBiometricStatus('success');
      success();
      setTimeout(() => {
        completeLogin(staff);
      }, 1000);
    } else {
      setBiometricStatus('skipped');
      // Allow to proceed without biometric
      setTimeout(() => {
        completeLogin(staff);
      }, 1000);
    }
  };

  const completeLogin = (staff: StaffMember) => {
    // Store logged in staff (not checked in yet - they need to check in separately)
    localStorage.setItem('logged_in_staff', JSON.stringify(staff));

    toast({
      title: `Welcome, ${staff.name}!`,
      description: 'Please check in from dashboard.',
    });
    navigate('/staff-dashboard');
  };

  const numpadKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'];

  // PIN Entry View
  if (verificationStep === 'pin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold">Staff Portal</h1>
            <p className="text-muted-foreground mt-2 text-base">Enter your PIN to login</p>
          </div>

          {/* PIN Display */}
          <div className="bg-card rounded-3xl border border-border p-6 mb-4 shadow-lg">
            <div className="flex justify-center mb-6">
              <div className="w-full max-w-xs h-16 rounded-2xl border-2 border-border bg-muted/50 flex items-center justify-center text-3xl font-bold tracking-widest">
                {pin ? '•'.repeat(pin.length) : <span className="text-muted-foreground text-lg">Enter PIN</span>}
              </div>
            </div>

            {error && (
              <p className="text-destructive text-base text-center mb-4 font-medium">{error}</p>
            )}

            {/* Numpad */}
            <div className="grid grid-cols-3 gap-3">
              {numpadKeys.map((key, index) => (
                <button
                  key={key}
                  ref={index === 0 ? firstButtonRef : undefined}
                  onClick={() => {
                    if (key === 'C') handleClear();
                    else if (key === '⌫') handleBackspace();
                    else handlePinInput(key);
                  }}
                  className={`h-16 sm:h-18 rounded-2xl text-2xl font-bold transition-all active:scale-95 touch-manipulation ${
                    key === 'C'
                      ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                      : key === '⌫'
                      ? 'bg-secondary text-foreground hover:bg-muted'
                      : 'bg-secondary text-foreground hover:bg-muted'
                  }`}
                >
                  {key === '⌫' ? <Delete className="w-7 h-7 mx-auto" /> : key}
                </button>
              ))}
            </div>
          </div>

          {/* Login Button */}
          <Button 
            onClick={handlePinVerification}
            className="w-full h-16 text-xl rounded-2xl"
            disabled={pin.length === 0}
          >
            <LogIn className="w-6 h-6 mr-3" />
            Continue
          </Button>

          {/* Back to Home */}
          <Button 
            variant="ghost"
            onClick={() => navigate('/')}
            className="w-full mt-4"
          >
            Back to Home
          </Button>

          {/* Info */}
          <p className="text-center text-sm text-muted-foreground mt-4">
            PIN is set by admin in Staff Management
          </p>
        </div>
      </div>
    );
  }

  // Verification Progress View
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-3xl border border-border p-8 shadow-lg">
          {/* Staff Info */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">{verifiedStaff?.name}</h2>
            <p className="text-muted-foreground capitalize">{verifiedStaff?.role}</p>
          </div>

          {/* Verification Steps */}
          <div className="space-y-4">
            {/* Biometric Step */}
            <div className={`p-4 rounded-2xl border-2 transition-all ${
              verificationStep === 'biometric' 
                ? 'border-primary bg-primary/5' 
                : biometricStatus === 'success' 
                  ? 'border-success bg-success/5'
                  : biometricStatus === 'skipped'
                    ? 'border-warning bg-warning/5'
                    : 'border-border'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  biometricStatus === 'success' 
                    ? 'bg-success/20' 
                    : biometricStatus === 'skipped'
                      ? 'bg-warning/20'
                      : 'bg-primary/20'
                }`}>
                  {isAuthenticating ? (
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  ) : biometricStatus === 'success' ? (
                    <CheckCircle className="w-6 h-6 text-success" />
                  ) : biometricStatus === 'skipped' ? (
                    <Fingerprint className="w-6 h-6 text-warning" />
                  ) : (
                    <Fingerprint className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Biometric Verification</p>
                  <p className="text-sm text-muted-foreground">
                    {isAuthenticating 
                      ? 'Verifying...' 
                      : biometricStatus === 'success'
                        ? 'Verified successfully'
                        : biometricStatus === 'skipped'
                          ? 'Skipped - Not available'
                          : 'Touch sensor or look at camera'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Location will be verified during check-in/check-out
          </p>
        </div>
      </div>
    </div>
  );
};

export default StaffLoginPage;
