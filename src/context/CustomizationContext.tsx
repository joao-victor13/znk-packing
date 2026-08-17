import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  StoreSettings, 
  ThemeSettings, 
  ThemeMode,
  CategoryItem, 
  SystemUser, 
  LayoutSettings, 
  PermissionKey, 
  UserRole 
} from '../types';
import { 
  DEFAULT_STORE_SETTINGS, 
  DEFAULT_THEME_SETTINGS, 
  DEFAULT_CATEGORIES, 
  DEFAULT_USERS, 
  DEFAULT_LAYOUT_SETTINGS, 
  ROLE_DEFAULT_PERMISSIONS
} from '../data/initialCustomization';

interface CustomizationContextType {
  storeSettings: StoreSettings;
  updateStoreSettings: (settings: Partial<StoreSettings>) => void;

  themeSettings: ThemeSettings;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  updateThemeSettings: (settings: Partial<ThemeSettings>) => void;

  categories: CategoryItem[];
  addCategory: (category: Omit<CategoryItem, 'id'>) => void;
  updateCategory: (id: string, category: Partial<CategoryItem>) => void;
  deleteCategory: (id: string) => void;
  resetCategories: () => void;

  users: SystemUser[];
  currentUser: SystemUser;
  setCurrentUser: (user: SystemUser) => void;
  addUser: (user: Omit<SystemUser, 'id'>) => void;
  updateUser: (id: string, user: Partial<SystemUser>) => void;
  deleteUser: (id: string) => void;

  // Authentication State & Actions
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;

  layoutSettings: LayoutSettings;
  updateLayoutSettings: (settings: Partial<LayoutSettings>) => void;

  hasPermission: (permission: PermissionKey) => boolean;
  isAdmin: boolean;
  resetAllCustomizations: () => void;
}

const CustomizationContext = createContext<CustomizationContextType | undefined>(undefined);

export const CustomizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Store Settings
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem('znk_store_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return { ...DEFAULT_STORE_SETTINGS, ...parsed };
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_STORE_SETTINGS;
  });

  // 2. Users (with stored passwords)
  const [users, setUsers] = useState<SystemUser[]>(() => {
    try {
      const saved = localStorage.getItem('znk_users');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge with DEFAULT_USERS to ensure passwords and initial data are present
          return parsed.map((u: SystemUser) => {
            const defaultMatch = DEFAULT_USERS.find(du => du.id === u.id || du.email.toLowerCase() === u.email.toLowerCase());
            return {
              ...u,
              password: u.password || defaultMatch?.password || 'admin',
            };
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_USERS;
  });

  // 3. Current Active User
  const [currentUser, setCurrentUserState] = useState<SystemUser>(() => {
    try {
      const savedId = localStorage.getItem('znk_current_user_id');
      const userList = (() => {
        try {
          const saved = localStorage.getItem('znk_users');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
          }
        } catch {}
        return DEFAULT_USERS;
      })();

      if (savedId) {
        const found = userList.find((u: SystemUser) => u.id === savedId);
        if (found) return found;
      }
      return userList[0] || DEFAULT_USERS[0];
    } catch (e) {
      console.error(e);
      return DEFAULT_USERS[0];
    }
  });

  // 4. Auth State (Persisted session)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const session = localStorage.getItem('znk_auth_session');
      if (session) {
        const parsed = JSON.parse(session);
        return Boolean(parsed && parsed.userId);
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  });

  // 5. Theme Settings
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(() => {
    try {
      const saved = localStorage.getItem('znk_theme_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return { ...DEFAULT_THEME_SETTINGS, ...parsed };
      }
    } catch (e) {
      console.error(e);
    }
    return { themeMode: currentUser?.themePreference || DEFAULT_THEME_SETTINGS.themeMode };
  });

  // 6. Categories
  const [categories, setCategories] = useState<CategoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('znk_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_CATEGORIES;
  });

  // 7. Layout Settings
  const [layoutSettings, setLayoutSettings] = useState<LayoutSettings>(() => {
    try {
      const saved = localStorage.getItem('znk_layout_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return { ...DEFAULT_LAYOUT_SETTINGS, ...parsed };
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_LAYOUT_SETTINGS;
  });

  // Persist Store Settings
  const updateStoreSettings = (newSettings: Partial<StoreSettings>) => {
    setStoreSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('znk_store_settings', JSON.stringify(updated));
      return updated;
    });
  };

  // Set Theme Mode
  const setThemeMode = (mode: ThemeMode) => {
    setThemeSettings({ themeMode: mode });
    localStorage.setItem('znk_theme_settings', JSON.stringify({ themeMode: mode }));

    if (currentUser) {
      const updatedUser = { ...currentUser, themePreference: mode };
      setCurrentUserState(updatedUser);
      setUsers(prev => {
        const updatedList = prev.map(u => (u.id === currentUser.id ? updatedUser : u));
        localStorage.setItem('znk_users', JSON.stringify(updatedList));
        return updatedList;
      });
    }
  };

  const updateThemeSettings = (newSettings: Partial<ThemeSettings>) => {
    if (newSettings.themeMode) {
      setThemeMode(newSettings.themeMode);
    }
  };

  // Dynamic Theme Effect (Claro / Escuro / Sistema)
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      const mode = themeSettings.themeMode || 'system';
      let isDark = false;

      if (mode === 'dark') {
        isDark = true;
      } else if (mode === 'light') {
        isDark = false;
      } else {
        isDark = mediaQuery.matches;
      }

      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();

    const handleChange = () => {
      if (themeSettings.themeMode === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeSettings.themeMode]);

  // LOGIN FUNCTION
  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();
    const foundUser = users.find(u => u.email.toLowerCase() === trimmedEmail);

    if (!foundUser) {
      return { success: false, message: 'Usuário não encontrado. Verifique o email informado.' };
    }

    const expectedPassword = foundUser.password || (foundUser.role === 'admin' ? 'admin' : '123456');

    if (expectedPassword !== password) {
      return { success: false, message: 'Senha incorreta. Tente novamente.' };
    }

    // Success: activate user and session
    setCurrentUserState(foundUser);
    setIsAuthenticated(true);

    localStorage.setItem('znk_current_user_id', foundUser.id);
    localStorage.setItem(
      'znk_auth_session',
      JSON.stringify({ userId: foundUser.id, email: foundUser.email, loggedAt: new Date().toISOString() })
    );

    // Apply user's theme preference if any
    if (foundUser.themePreference) {
      setThemeSettings({ themeMode: foundUser.themePreference });
      localStorage.setItem('znk_theme_settings', JSON.stringify({ themeMode: foundUser.themePreference }));
    }

    return { success: true };
  };

  // LOGOUT FUNCTION
  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('znk_auth_session');
  };

  // Categories CRUD
  const addCategory = (categoryData: Omit<CategoryItem, 'id'>) => {
    const newCat: CategoryItem = {
      ...categoryData,
      id: `cat-${Date.now()}`,
    };
    setCategories(prev => {
      const updated = [...prev, newCat];
      localStorage.setItem('znk_categories', JSON.stringify(updated));
      return updated;
    });
  };

  const updateCategory = (id: string, categoryData: Partial<CategoryItem>) => {
    setCategories(prev => {
      const updated = prev.map(c => (c.id === id ? { ...c, ...categoryData } : c));
      localStorage.setItem('znk_categories', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => {
      const updated = prev.filter(c => c.id !== id);
      localStorage.setItem('znk_categories', JSON.stringify(updated));
      return updated;
    });
  };

  const resetCategories = () => {
    setCategories(DEFAULT_CATEGORIES);
    localStorage.setItem('znk_categories', JSON.stringify(DEFAULT_CATEGORIES));
  };

  // Users & Permissions CRUD (Admin Protected)
  const setCurrentUser = (user: SystemUser) => {
    setCurrentUserState(user);
    localStorage.setItem('znk_current_user_id', user.id);

    if (user.themePreference) {
      setThemeSettings({ themeMode: user.themePreference });
      localStorage.setItem('znk_theme_settings', JSON.stringify({ themeMode: user.themePreference }));
    }
  };

  const addUser = (userData: Omit<SystemUser, 'id'>) => {
    if (currentUser.role !== 'admin') {
      console.warn('Unauthorized: Only Admin users can create accounts');
      return;
    }

    const newUser: SystemUser = {
      ...userData,
      id: `user-${Date.now()}`,
      password: userData.password || 'znk2026',
      themePreference: userData.themePreference || 'system',
    };
    setUsers(prev => {
      const updated = [...prev, newUser];
      localStorage.setItem('znk_users', JSON.stringify(updated));
      return updated;
    });
  };

  const updateUser = (id: string, userData: Partial<SystemUser>) => {
    if (currentUser.role !== 'admin' && currentUser.id !== id) {
      console.warn('Unauthorized: Only Admin can update other users');
      return;
    }

    setUsers(prev => {
      const updated = prev.map(u => (u.id === id ? { ...u, ...userData } : u));
      localStorage.setItem('znk_users', JSON.stringify(updated));
      return updated;
    });
    if (currentUser.id === id) {
      setCurrentUserState(prev => ({ ...prev, ...userData }));
      if (userData.themePreference) {
        setThemeSettings({ themeMode: userData.themePreference });
      }
    }
  };

  const deleteUser = (id: string) => {
    if (currentUser.role !== 'admin') {
      console.warn('Unauthorized: Only Admin can delete users');
      return;
    }

    if (users.length <= 1) return;
    setUsers(prev => {
      const updated = prev.filter(u => u.id !== id);
      localStorage.setItem('znk_users', JSON.stringify(updated));
      return updated;
    });
    if (currentUser.id === id) {
      const remaining = users.filter(u => u.id !== id);
      if (remaining.length > 0) setCurrentUser(remaining[0]);
    }
  };

  // Layout Settings Persist
  const updateLayoutSettings = (newSettings: Partial<LayoutSettings>) => {
    setLayoutSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('znk_layout_settings', JSON.stringify(updated));
      return updated;
    });
  };

  // RBAC Permission Check
  const isAdmin = currentUser?.role === 'admin';

  const hasPermission = (permission: PermissionKey): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;

    // Strict Admin-only for settings and user management
    if (permission === 'settings_manage') return false;

    if (currentUser.customPermissions && currentUser.customPermissions.includes(permission)) {
      return true;
    }
    const defaultPerms = ROLE_DEFAULT_PERMISSIONS[currentUser.role] || [];
    return defaultPerms.includes(permission);
  };

  // Global Reset
  const resetAllCustomizations = () => {
    setStoreSettings(DEFAULT_STORE_SETTINGS);
    setThemeSettings(DEFAULT_THEME_SETTINGS);
    setCategories(DEFAULT_CATEGORIES);
    setUsers(DEFAULT_USERS);
    setCurrentUserState(DEFAULT_USERS[0]);
    setLayoutSettings(DEFAULT_LAYOUT_SETTINGS);

    localStorage.removeItem('znk_store_settings');
    localStorage.removeItem('znk_theme_settings');
    localStorage.removeItem('znk_categories');
    localStorage.removeItem('znk_users');
    localStorage.removeItem('znk_current_user_id');
    localStorage.removeItem('znk_layout_settings');
  };

  return (
    <CustomizationContext.Provider
      value={{
        storeSettings,
        updateStoreSettings,
        themeSettings,
        themeMode: themeSettings.themeMode || 'system',
        setThemeMode,
        updateThemeSettings,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        resetCategories,
        users,
        currentUser,
        setCurrentUser,
        addUser,
        updateUser,
        deleteUser,
        isAuthenticated,
        login,
        logout,
        layoutSettings,
        updateLayoutSettings,
        hasPermission,
        isAdmin,
        resetAllCustomizations,
      }}
    >
      {children}
    </CustomizationContext.Provider>
  );
};

export const useCustomization = (): CustomizationContextType => {
  const context = useContext(CustomizationContext);
  if (!context) {
    throw new Error('useCustomization must be used within a CustomizationProvider');
  }
  return context;
};
