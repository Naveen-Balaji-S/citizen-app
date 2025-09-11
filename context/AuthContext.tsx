import React, { useState, useEffect, createContext, useContext, PropsWithChildren } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

// Define the shape of the context value. We only need the session.
interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
}

// Create the context
const AuthContext = createContext<AuthContextType | null>(null);

// Create the AuthProvider component
export const AuthProvider = ({ children }: PropsWithChildren<{}>) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Check for an existing session on the initial load.
    // This is faster than waiting for the listener to fire.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    // 2. Set up a listener for any future authentication state changes (login, logout, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // 3. Cleanup: Unsubscribe from the listener when the component unmounts
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const value = {
    session,
    isLoading,
  };

  // 4. Don't render the rest of the app until the initial session check is complete.
  // This prevents the UI from flickering between login and home screens.
  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

// Create a custom hook for easy access to the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

