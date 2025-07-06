import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState } from '../types';
import { mockUsers } from '../data/mockData';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (user: User) => void;
  updateUsers: (users: User[]) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  });
  const [users, setUsers] = useState<User[]>(mockUsers);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('currentUser');
    const storedUsers = localStorage.getItem('systemUsers');
    
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setAuthState({
        user,
        isAuthenticated: true,
      });
    }
    
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const user = users.find(u => u.email === email && u.password === password && u.isActive);
    
    if (user) {
      const updatedUser = {
        ...user,
        lastLogin: new Date().toISOString(),
      };
      
      // Update user in users array
      const updatedUsers = users.map(u => u.id === user.id ? updatedUser : u);
      setUsers(updatedUsers);
      localStorage.setItem('systemUsers', JSON.stringify(updatedUsers));
      
      setAuthState({
        user: updatedUser,
        isAuthenticated: true,
      });
      
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      return true;
    }
    
    return false;
  };

  const logout = () => {
    setAuthState({
      user: null,
      isAuthenticated: false,
    });
    localStorage.removeItem('currentUser');
  };

  const updateUser = (user: User) => {
    setAuthState(prev => ({
      ...prev,
      user,
    }));
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  const updateUsers = (newUsers: User[]) => {
    setUsers(newUsers);
    localStorage.setItem('systemUsers', JSON.stringify(newUsers));
  };

  return (
    <AuthContext.Provider value={{
      ...authState,
      login,
      logout,
      updateUser,
      updateUsers,
    }}>
      {children}
    </AuthContext.Provider>
  );
};