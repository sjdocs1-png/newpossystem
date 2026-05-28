import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'admin' | 'manager' | 'cashier' | 'waiter' | 'staff';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  pin: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (pin: string) => boolean;
  logout: () => void;
  hasAccess: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default users with roles
const defaultUsers: User[] = [
  { id: '1', name: 'Admin User', role: 'admin', pin: '1234' },
  { id: '2', name: 'Manager', role: 'manager', pin: '2345' },
  { id: '3', name: 'Cashier', role: 'cashier', pin: '3456' },
  { id: '4', name: 'Waiter', role: 'waiter', pin: '4567' },
  { id: '5', name: 'Staff Member', role: 'staff', pin: '5678' },
];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('pos_current_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('pos_current_user');
      }
    }
  }, []);

  const login = (pin: string): boolean => {
    const foundUser = defaultUsers.find(u => u.pin === pin);
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('pos_current_user', JSON.stringify(foundUser));
      
      // Log attendance for staff
      if (foundUser.role === 'staff' || foundUser.role === 'waiter') {
        const attendance = JSON.parse(localStorage.getItem('pos_attendance') || '[]');
        attendance.push({
          userId: foundUser.id,
          userName: foundUser.name,
          checkIn: new Date().toISOString(),
          date: new Date().toDateString()
        });
        localStorage.setItem('pos_attendance', JSON.stringify(attendance));
      }
      
      return true;
    }
    return false;
  };

  const logout = () => {
    // Log checkout for staff
    if (user && (user.role === 'staff' || user.role === 'waiter')) {
      const attendance = JSON.parse(localStorage.getItem('pos_attendance') || '[]');
      const lastRecord = attendance.findLast((a: any) => a.userId === user.id && !a.checkOut);
      if (lastRecord) {
        lastRecord.checkOut = new Date().toISOString();
        localStorage.setItem('pos_attendance', JSON.stringify(attendance));
      }
    }
    
    setUser(null);
    localStorage.removeItem('pos_current_user');
  };

  const hasAccess = (allowedRoles: UserRole[]): boolean => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      logout,
      hasAccess
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
