import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User } from '../types/index';
import { authService } from '../services/authService';

interface UserContextType {
  isLoggedIn: boolean;
  isAdmin: boolean;
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUserContext = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  
  // Effect to handle initial session restoration
  useEffect(() => {
    const restoreSession = () => {
      try {
        console.log('Tentative de restauration de session...');
        const storedUser = sessionStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          console.log('Utilisateur restauré:', user);
          setCurrentUser(user);
          setIsLoggedIn(true);
          setIsAdmin(user.isAdmin || false);
          console.log('Session restaurée - États:', { isLoggedIn: true, isAdmin: user.isAdmin || false });
        }
      } catch (error) {
        console.error('Erreur lors de la restauration de session:', error);
        sessionStorage.removeItem('user');
        setCurrentUser(null);
        setIsLoggedIn(false);
        setIsAdmin(false);
      }
    };

    restoreSession();
  }, []);

  // Effect to handle storage events for cross-tab synchronization
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'user') {
        if (event.newValue) {
          try {
            const user = JSON.parse(event.newValue);
            console.log('Changement de stockage détecté - Nouvel utilisateur:', user);
            setCurrentUser(user);
            setIsLoggedIn(true);
            setIsAdmin(user.isAdmin || false);
          } catch (error) {
            console.error('Erreur lors du parsing des données utilisateur:', error);
            setCurrentUser(null);
            setIsLoggedIn(false);
            setIsAdmin(false);
          }
        } else {
          setCurrentUser(null);
          setIsLoggedIn(false);
          setIsAdmin(false);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  const login = async (email: string, password: string): Promise<void> => {
    try {
      console.log('Tentative de connexion avec:', { email });
      const user = await authService.login(email, password);
      console.log('Réponse de connexion:', user);
      setCurrentUser(user);
      setIsLoggedIn(true);
      setIsAdmin(user.isAdmin || false);
      console.log('États après connexion:', { isLoggedIn: true, isAdmin: user.isAdmin || false });
      sessionStorage.setItem('user', JSON.stringify(user));
    } catch (error: any) {
      console.error('Erreur lors de la connexion:', error);
      throw new Error(error.message);
    }
  };
  
  const logout = () => {
    console.log('Déconnexion...');
    setCurrentUser(null);
    setIsLoggedIn(false);
    setIsAdmin(false);
    sessionStorage.removeItem('user');
  };
  
  return (
    <UserContext.Provider
      value={{
        isLoggedIn,
        isAdmin,
        currentUser,
        login,
        logout
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
 