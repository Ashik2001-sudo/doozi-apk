// Layout Component Types and Interfaces

// Branch Types
export interface Branch {
  id: string;
  name: string;
  isMainBranch: boolean;
  isActive: boolean;
}

// User Types (already in dashboard.types, but reexporting for layout)
export interface LayoutUser {
  name: string;
  email: string;
  profilePhoto?: string;
  role?: string;
}

// Tenant Types (layout specific)
export interface LayoutTenant {
  name?: string;
  domain?: string;
  company?: string;
  adminLogoUrl?: string | null;
  subscription?: {
    id: string;
    planName: string;
    startDate: string;
    endDate: string;
    status: string;
    isTrial: boolean;
    trialEndsAt?: string;
    price: number;
  };
}

// Header Types
export interface HeaderProps {
  title?: string;
  user: LayoutUser | null;
  tenant: LayoutTenant | null;
  onLogout: () => void;
  onProfileClick: () => void;
  sidebarCollapsed?: boolean;
  onBranchChange?: (branch: Branch) => void;
  theme?: 'dark' | 'light';
  onThemeToggle?: () => void;
  onMenuClick?: () => void;
}

export interface SubscriptionInfo {
  daysLeft: number;
  hoursLeft: number;
  minutesLeft: number;
  secondsLeft: number;
  isExpired: boolean;
  isExpiringSoon: boolean;
  planName: string;
  endDate: string;
}

// Sidebar Types
export interface SidebarProps {
  user: LayoutUser | null;
  tenant: LayoutTenant | null;
  onLogout: () => void;
  onProfileClick?: () => void;
  onBranchesClick?: () => void;
  verificationStatus?: { status: string } | null;
  onCollapseChange?: (collapsed: boolean) => void;
  mobileOpen?: boolean;
  onMobileToggle?: () => void;
}

export interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>; // Lucide icon component
  description: string;
  hasSubmenu?: boolean;
  submenu?: MenuItem[];
  /** Optional explicit route (legacy menu config); navigation uses id via getRouteForSection when omitted */
  href?: string;
}

// Verification Status
export interface VerificationStatus {
  status: 'verified' | 'pending' | 'rejected';
}

