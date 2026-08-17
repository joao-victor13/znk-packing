import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  StoreSettings, 
  ThemeSettings, 
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
  ROLE_DEFAULT_PERMISSIONS,
  THEME_PALETTES
} from '../data/initialCustomization';

interface CustomizationContextType {
  storeSettings: StoreSettings;
  updateStoreSettings: (settings: Partial<StoreSettings>) => void;

  themeSettings: ThemeSettings;
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

  layoutSettings: LayoutSettings;
  updateLayoutSettings: (settings: Partial<LayoutSettings>) => void;

  hasPermission: (permission: PermissionKey) => boolean;
  resetAllCustomizations: () => void;
}

const CustomizationContext = createContext<CustomizationContextType | undefined>(undefined);

export const CustomizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Store Settings
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

  // Theme Settings
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
    return DEFAULT_THEME_SETTINGS;
  });

  // Categories
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

  // Users
  const [users, setUsers] = useState<SystemUser[]>(() => {
    try {
      const saved = localStorage.getItem('znk_users');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_USERS;
  });

  // Current Active User
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

  // Layout Settings
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

  // Persist Theme Settings & Inject CSS Variables / Font Families into document root
  const updateThemeSettings = (newSettings: Partial<ThemeSettings>) => {
    setThemeSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('znk_theme_settings', JSON.stringify(updated));
      return updated;
    });
  };

  // Dynamic CSS injector for Theme & Fonts
  useEffect(() => {
    const root = document.documentElement;
    const palette = (THEME_PALETTES as any)[themeSettings.preset] || THEME_PALETTES.terracotta_champagne;

    const hexToRgb = (hex: string): string => {
      let clean = hex.replace('#', '');
      if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
      const num = parseInt(clean, 16);
      return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
    };

    // Apply color palette variables (Hex and RGB channels for opacity support)
    root.style.setProperty('--color-primary', palette.primary);
    root.style.setProperty('--color-primary-rgb', hexToRgb(palette.primary));
    root.style.setProperty('--color-primary-hover', palette.primaryHover);
    root.style.setProperty('--color-primary-hover-rgb', hexToRgb(palette.primaryHover));
    root.style.setProperty('--color-primary-light', palette.primaryLight || '#FAF6F0');
    root.style.setProperty('--color-primary-light-rgb', hexToRgb(palette.primaryLight || '#FAF6F0'));
    root.style.setProperty('--color-primary-subtle', palette.primarySubtle || '#F4EBE1');
    root.style.setProperty('--color-primary-subtle-rgb', hexToRgb(palette.primarySubtle || '#F4EBE1'));
    root.style.setProperty('--color-primary-border', palette.primaryBorder || palette.border);
    root.style.setProperty('--color-primary-border-rgb', hexToRgb(palette.primaryBorder || palette.border));
    root.style.setProperty('--color-primary-text', palette.primaryText || palette.primary);
    root.style.setProperty('--color-primary-text-rgb', hexToRgb(palette.primaryText || palette.primary));

    root.style.setProperty('--color-bg-light', palette.bgLight);
    root.style.setProperty('--color-card-bg', palette.cardBg || '#FFFFFF');
    root.style.setProperty('--color-border', palette.border);
    root.style.setProperty('--color-text', palette.text);
    root.style.setProperty('--color-text-muted', palette.textMuted || '#736B63');

    // Apply fonts variables
    root.style.setProperty('--font-family-body', `"${themeSettings.fontFamily}", sans-serif`);
    root.style.setProperty('--font-family-heading', `"${themeSettings.headingFont}", Georgia, serif`);
    document.body.style.fontFamily = `"${themeSettings.fontFamily}", sans-serif`;

    // Apply dark mode class to document if needed
    if (themeSettings.isDarkMode || themeSettings.preset === 'dark_studio') {
      root.classList.add('dark-theme');
    } else {
      root.classList.remove('dark-theme');
    }
  }, [themeSettings]);

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

  // Users & Permissions CRUD
  const setCurrentUser = (user: SystemUser) => {
    setCurrentUserState(user);
    localStorage.setItem('znk_current_user_id', user.id);
  };

  const addUser = (userData: Omit<SystemUser, 'id'>) => {
    const newUser: SystemUser = {
      ...userData,
      id: `user-${Date.now()}`,
    };
    setUsers(prev => {
      const updated = [...prev, newUser];
      localStorage.setItem('znk_users', JSON.stringify(updated));
      return updated;
    });
  };

  const updateUser = (id: string, userData: Partial<SystemUser>) => {
    setUsers(prev => {
      const updated = prev.map(u => (u.id === id ? { ...u, ...userData } : u));
      localStorage.setItem('znk_users', JSON.stringify(updated));
      return updated;
    });
    if (currentUser.id === id) {
      setCurrentUserState(prev => ({ ...prev, ...userData }));
    }
  };

  const deleteUser = (id: string) => {
    if (users.length <= 1) return;
    setUsers(prev => {
      const updated = prev.filter(u => u.id !== id);
      localStorage.setItem('znk_users', JSON.stringify(updated));
      return updated;
    });
    if (currentUser.id === id) {
      setCurrentUserState(users[0]);
    }
  };

  // Layout Settings
  const updateLayoutSettings = (newSettings: Partial<LayoutSettings>) => {
    setLayoutSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('znk_layout_settings', JSON.stringify(updated));
      return updated;
    });
  };

  // Permission Checker based on Role & Custom Overrides
  const hasPermission = (permission: PermissionKey): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;

    // Check custom overrides if defined
    if (currentUser.customPermissions && currentUser.customPermissions.includes(permission)) {
      return true;
    }

    const defaultRolePerms = ROLE_DEFAULT_PERMISSIONS[currentUser.role] || [];
    return defaultRolePerms.includes(permission);
  };

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
        layoutSettings,
        updateLayoutSettings,
        hasPermission,
        resetAllCustomizations,
      }}
    >
      {children}
    </CustomizationContext.Provider>
  );
};

export const useCustomization = () => {
  const context = useContext(CustomizationContext);
  if (!context) {
    throw new Error('useCustomization must be used within a CustomizationProvider');
  }
  return context;
};
