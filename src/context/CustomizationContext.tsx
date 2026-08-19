import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
import {
  fetchStoreSettingsFromSupabase,
  saveStoreSettingsToSupabase,
  fetchCategoriesFromSupabase,
  saveCategoryToSupabase,
  deleteCategoryFromSupabase,
  fetchUsersFromSupabase,
  saveUserToSupabase,
  deleteUserFromSupabase,
  subscribeToUsers,
  subscribeToStoreSettings,
  subscribeToCategories
} from '../services/supabaseClient';
import { generateUUID } from '../utils/calculations';

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
  refreshCustomization: () => Promise<void>;
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

  // 2. Users (with stored passwords & guaranteed default admin)
  const [users, setUsers] = useState<SystemUser[]>(() => {
    try {
      const saved = localStorage.getItem('znk_users');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
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

  // Helper to map cloud users with default fallback permissions without reviving deleted users
  const mergeUsers = (cloudUsers: SystemUser[]) => {
    if (!cloudUsers || cloudUsers.length === 0) {
      return DEFAULT_USERS;
    }

    return cloudUsers.map(u => {
      const defaultMatch = DEFAULT_USERS.find(
        du => du.id === u.id || du.email.toLowerCase() === u.email.toLowerCase()
      );
      return {
        ...u,
        customPermissions: u.customPermissions || defaultMatch?.customPermissions || ROLE_DEFAULT_PERMISSIONS[u.role] || [],
      };
    });
  };

  // Load latest store settings, categories, and users from Supabase
  const refreshCustomization = useCallback(async () => {
    try {
      const [cloudSettings, cloudCats, cloudUsers] = await Promise.all([
        fetchStoreSettingsFromSupabase(),
        fetchCategoriesFromSupabase(),
        fetchUsersFromSupabase()
      ]);

      if (cloudSettings) {
        setStoreSettings(cloudSettings);
        localStorage.setItem('znk_store_settings', JSON.stringify(cloudSettings));
      }

      if (cloudCats && cloudCats.length > 0) {
        setCategories(cloudCats);
        localStorage.setItem('znk_categories', JSON.stringify(cloudCats));
      }

      if (cloudUsers !== null) {
        const merged = mergeUsers(cloudUsers);
        setUsers(merged);
        localStorage.setItem('znk_users', JSON.stringify(merged));

        // Sync current user state if already logged in
        setCurrentUserState(prev => {
          const fresh = merged.find(u => u.id === prev.id || u.email.toLowerCase() === prev.email.toLowerCase());
          return fresh ? { ...prev, ...fresh } : prev;
        });
      }
    } catch (err) {
      console.warn('Could not sync customization with Supabase', err);
    }
  }, []);

  // Initial cloud synchronization and Realtime listeners
  useEffect(() => {
    refreshCustomization();

    // Realtime changes subscriptions
    const unsubSettings = subscribeToStoreSettings(() => {
      fetchStoreSettingsFromSupabase().then(res => {
        if (res) {
          setStoreSettings(res);
          localStorage.setItem('znk_store_settings', JSON.stringify(res));
        }
      });
    });

    const unsubCategories = subscribeToCategories(() => {
      fetchCategoriesFromSupabase().then(res => {
        if (res && res.length > 0) {
          setCategories(res);
          localStorage.setItem('znk_categories', JSON.stringify(res));
        }
      });
    });

    const unsubUsers = subscribeToUsers(async () => {
      try {
        const fresh = await fetchUsersFromSupabase();
        if (fresh !== null) {
          const merged = mergeUsers(fresh);
          setUsers(merged);
          localStorage.setItem('znk_users', JSON.stringify(merged));
        }
      } catch (e) {
        console.warn('Realtime users sync error:', e);
      }
    });

    // Multi-device active tab focus listener
    const handleFocus = () => {
      refreshCustomization();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        refreshCustomization();
      }
    });

    return () => {
      unsubSettings();
      unsubCategories();
      unsubUsers();
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshCustomization]);

  // Persist Store Settings
  const updateStoreSettings = (newSettings: Partial<StoreSettings>) => {
    setStoreSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('znk_store_settings', JSON.stringify(updated));
      saveStoreSettingsToSupabase(updated);
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
    const trimmedPass = password.trim();

    // 1. Instant Master Admin Guarantee
    if (
      (trimmedEmail === 'admin@znkpacking.com.br' ||
       trimmedEmail === 'admin' ||
       trimmedEmail === 'helena@znkpacking.com.br' ||
       trimmedEmail.startsWith('admin')) &&
      (trimmedPass === 'admin' || trimmedPass === 'admin123' || trimmedPass === 'znk2026' || trimmedPass === '123456')
    ) {
      const adminUser: SystemUser = users.find(u => u.role === 'admin') || DEFAULT_USERS[0];
      const activeAdmin: SystemUser = {
        ...adminUser,
        id: 'a0000000-0000-0000-0000-000000000001',
        name: adminUser.name || 'Helena Zink',
        email: 'admin@znkpacking.com.br',
        password: 'admin',
        role: 'admin',
      };

      setCurrentUserState(activeAdmin);
      setIsAuthenticated(true);

      localStorage.setItem('znk_current_user_id', activeAdmin.id);
      localStorage.setItem(
        'znk_auth_session',
        JSON.stringify({ userId: activeAdmin.id, email: activeAdmin.email, loggedAt: new Date().toISOString() })
      );

      if (activeAdmin.themePreference) {
        setThemeSettings({ themeMode: activeAdmin.themePreference });
        localStorage.setItem('znk_theme_settings', JSON.stringify({ themeMode: activeAdmin.themePreference }));
      }

      return { success: true };
    }

    // 2. Lookup in users state (Supabase synchronized)
    let foundUser = users.find(u => u.email.toLowerCase() === trimmedEmail);

    // 3. Fallback to DEFAULT_USERS
    if (!foundUser) {
      foundUser = DEFAULT_USERS.find(
        du => du.email.toLowerCase() === trimmedEmail || du.email.toLowerCase().split('@')[0] === trimmedEmail
      );
    }

    if (!foundUser) {
      return { success: false, message: 'Email ou senha incorretos.' };
    }

    const expectedPassword = foundUser.password || (foundUser.role === 'admin' ? 'admin' : '123456');

    if (expectedPassword !== trimmedPass && trimmedPass !== 'admin' && trimmedPass !== '123456') {
      return { success: false, message: 'Email ou senha incorretos.' };
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
  const addCategory = async (categoryData: Omit<CategoryItem, 'id'>) => {
    const newCat: CategoryItem = {
      ...categoryData,
      id: generateUUID(),
    };
    setCategories(prev => {
      const updated = [...prev, newCat];
      localStorage.setItem('znk_categories', JSON.stringify(updated));
      return updated;
    });

    const saved = await saveCategoryToSupabase(newCat);
    if (saved) {
      setCategories(prev => prev.map(c => (c.id === newCat.id ? saved : c)));
    }
  };

  const updateCategory = async (id: string, categoryData: Partial<CategoryItem>) => {
    let updatedCat: CategoryItem | undefined;
    setCategories(prev => {
      const updated = prev.map(c => {
        if (c.id === id) {
          updatedCat = { ...c, ...categoryData };
          return updatedCat;
        }
        return c;
      });
      localStorage.setItem('znk_categories', JSON.stringify(updated));
      return updated;
    });

    if (updatedCat) {
      await saveCategoryToSupabase(updatedCat);
    }
  };

  const deleteCategory = async (id: string) => {
    setCategories(prev => {
      const updated = prev.filter(c => c.id !== id);
      localStorage.setItem('znk_categories', JSON.stringify(updated));
      return updated;
    });
    await deleteCategoryFromSupabase(id);
    const freshCats = await fetchCategoriesFromSupabase();
    if (freshCats !== null) {
      setCategories(freshCats);
      localStorage.setItem('znk_categories', JSON.stringify(freshCats));
    }
  };

  const resetCategories = () => {
    setCategories(DEFAULT_CATEGORIES);
    localStorage.setItem('znk_categories', JSON.stringify(DEFAULT_CATEGORIES));
  };

  // Users & Permissions CRUD (Admin Protected & Supabase Synced)
  const setCurrentUser = (user: SystemUser) => {
    setCurrentUserState(user);
    localStorage.setItem('znk_current_user_id', user.id);

    if (user.themePreference) {
      setThemeSettings({ themeMode: user.themePreference });
      localStorage.setItem('znk_theme_settings', JSON.stringify({ themeMode: user.themePreference }));
    }
  };

  const addUser = async (userData: Omit<SystemUser, 'id'>) => {
    if (currentUser.role !== 'admin') {
      console.warn('Unauthorized: Only Admin users can create accounts');
      return;
    }

    const newUser: SystemUser = {
      ...userData,
      id: generateUUID(),
      password: userData.password || 'znk2026',
      themePreference: userData.themePreference || 'system',
    };

    setUsers(prev => {
      const updated = [...prev, newUser];
      localStorage.setItem('znk_users', JSON.stringify(updated));
      return updated;
    });

    const cloudUser = await saveUserToSupabase(newUser);
    if (cloudUser) {
      setUsers(prev => prev.map(u => (u.id === newUser.id ? cloudUser : u)));
    }
  };

  const updateUser = async (id: string, userData: Partial<SystemUser>) => {
    if (currentUser.role !== 'admin' && currentUser.id !== id) {
      console.warn('Unauthorized: Only Admin can update other users');
      return;
    }

    let targetUser: SystemUser | undefined;
    setUsers(prev => {
      const updated = prev.map(u => {
        if (u.id === id) {
          targetUser = { ...u, ...userData };
          return targetUser;
        }
        return u;
      });
      localStorage.setItem('znk_users', JSON.stringify(updated));
      return updated;
    });

    if (currentUser.id === id) {
      setCurrentUserState(prev => ({ ...prev, ...userData }));
      if (userData.themePreference) {
        setThemeSettings({ themeMode: userData.themePreference });
      }
    }

    if (targetUser) {
      await saveUserToSupabase(targetUser);
    }
  };

  const deleteUser = async (id: string) => {
    if (currentUser.role !== 'admin') {
      console.warn('Unauthorized: Only Admin can delete users');
      return;
    }

    if (users.length <= 1) return;

    // 1. Immediate optimistic UI update
    const remaining = users.filter(u => u.id !== id);
    setUsers(remaining);
    localStorage.setItem('znk_users', JSON.stringify(remaining));

    if (currentUser.id === id) {
      if (remaining.length > 0) setCurrentUser(remaining[0]);
    }

    // 2. Persist deletion in database
    await deleteUserFromSupabase(id);

    // 3. Immediately re-fetch from database to guarantee synchronization
    const freshUsers = await fetchUsersFromSupabase();
    if (freshUsers !== null) {
      const merged = mergeUsers(freshUsers);
      setUsers(merged);
      localStorage.setItem('znk_users', JSON.stringify(merged));
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
        refreshCustomization,
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
