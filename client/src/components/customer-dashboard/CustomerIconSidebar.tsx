import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  History,
  User,
  Wallet,
  Crown,
  Heart,
  ShoppingBag,
  MessageCircle,
  Settings,
  Sparkles,
  Home,
  ChevronRight,
  Check,
  Menu,
  X,
  LogOut,
  UserCircle,
  CreditCard,
  Receipt,
  Gift,
  Star,
  Store,
  CalendarDays,
  ShoppingCart,
  Tag,
  Compass,
  Package,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface SidebarNavItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  isComplete?: boolean;
  isOptional?: boolean;
  badge?: number;
  route?: string; // External route path
}

export interface SidebarSection {
  id: string;
  label: string;
  icon: LucideIcon;
  items: SidebarNavItem[];
  singleItem?: boolean;
}

interface UserInfo {
  firstName?: string;
  lastName?: string;
  email?: string;
  profileImageUrl?: string;
}

interface CustomerIconSidebarProps {
  activeTab: string;
  onNavigate: (tabId: string, route?: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  user?: UserInfo | null;
  onLogout?: () => void;
  upcomingCount?: number;
  cartCount?: number;
}

const customerSidebarSections: SidebarSection[] = [
  {
    id: "appointments",
    label: "Appointments",
    icon: Calendar,
    items: [
      { id: "upcoming", label: "Upcoming", icon: Calendar },
      { id: "history", label: "History", icon: History },
    ],
  },
  {
    id: "explore-section",
    label: "Explore",
    icon: Compass,
    items: [
      { id: "studios", label: "Studios", icon: Store, route: "/" },
      { id: "events", label: "Events", icon: CalendarDays, route: "/events" },
    ],
  },
  {
    id: "shop-section",
    label: "Shop",
    icon: ShoppingBag,
    items: [
      { id: "browse-shop", label: "Browse Products", icon: ShoppingBag, route: "/shop" },
      { id: "cart", label: "Shopping Cart", icon: ShoppingCart, route: "/cart" },
      { id: "orders", label: "My Orders", icon: Package },
    ],
  },
  {
    id: "offers-rewards",
    label: "Offers & Rewards",
    icon: Tag,
    items: [
      { id: "offers", label: "Offers", icon: Tag, route: "/all-offers" },
      { id: "memberships", label: "Memberships", icon: Crown },
      { id: "rewards", label: "Loyalty Points", icon: Gift },
    ],
  },
  {
    id: "payments-section",
    label: "Wallet",
    icon: Wallet,
    items: [
      { id: "payments", label: "Payment History", icon: Receipt },
      { id: "saved-cards", label: "Saved Cards", icon: CreditCard },
    ],
  },
  {
    id: "favorites",
    label: "Favorites",
    icon: Heart,
    singleItem: true,
    items: [{ id: "wishlist", label: "Wishlist" }],
  },
  {
    id: "profile-section",
    label: "Profile",
    icon: User,
    items: [
      { id: "profile", label: "My Profile", icon: User },
      { id: "beauty-profile", label: "Beauty Profile", icon: Sparkles },
      { id: "settings", label: "Settings", icon: Settings },
    ],
  },
  {
    id: "support",
    label: "Support",
    icon: MessageCircle,
    singleItem: true,
    items: [{ id: "support", label: "Help & Support" }],
  },
];

export function CustomerIconSidebar({
  activeTab,
  onNavigate,
  isCollapsed = true,
  onToggleCollapse,
  user,
  onLogout,
  upcomingCount = 0,
  cartCount = 0,
}: CustomerIconSidebarProps) {
  const [openPopover, setOpenPopover] = useState<string | null>(null);

  const sectionsWithBadges = customerSidebarSections.map(section => {
    if (section.id === "appointments" && upcomingCount > 0) {
      return {
        ...section,
        items: section.items.map(item => 
          item.id === "upcoming" ? { ...item, badge: upcomingCount } : item
        ),
      };
    }
    if (section.id === "shop-section" && cartCount > 0) {
      return {
        ...section,
        items: section.items.map(item => 
          item.id === "cart" ? { ...item, badge: cartCount } : item
        ),
      };
    }
    return section;
  });

  const isItemActive = (itemId: string) => activeTab === itemId;
  
  const isSectionActive = (section: SidebarSection) => {
    return section.items.some(item => isItemActive(item.id));
  };

  const handleItemClick = (item: SidebarNavItem) => {
    onNavigate(item.id, item.route);
    setOpenPopover(null);
  };

  return (
    <TooltipProvider delayDuration={100}>
      <aside 
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex items-center justify-center h-16 border-b border-slate-800">
          {isCollapsed ? (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-white font-semibold truncate">Stylemate</span>
            </div>
          )}
        </div>

        <ScrollArea className="flex-1 py-4">
          <nav className="flex flex-col gap-1 px-2">
            {sectionsWithBadges.map((section) => {
              const Icon = section.icon;
              const isActive = isSectionActive(section);
              const hasSingleItem = section.singleItem || section.items.length === 1;

              if (hasSingleItem) {
                const item = section.items[0];
                return (
                  <Tooltip key={section.id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleItemClick(item)}
                        className={cn(
                          "relative flex items-center gap-3 rounded-lg p-3 text-slate-400 transition-all hover:bg-slate-800 hover:text-white",
                          isActive && "bg-slate-800 text-white",
                          !isCollapsed && "justify-start"
                        )}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-violet-500 to-fuchsia-500 rounded-r-full" />
                        )}
                        <Icon className="h-5 w-5 shrink-0" strokeWidth={1.5} />
                        {!isCollapsed && (
                          <span className="text-sm font-medium">{section.label}</span>
                        )}
                        {item.badge && item.badge > 0 && (
                          <Badge 
                            variant="destructive" 
                            className={cn(
                              "h-5 min-w-5 text-xs bg-gradient-to-r from-violet-500 to-fuchsia-500 border-0",
                              isCollapsed ? "absolute -top-1 -right-1" : "ml-auto"
                            )}
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </button>
                    </TooltipTrigger>
                    {isCollapsed && (
                      <TooltipContent side="right" className="bg-slate-800 text-white border-slate-700">
                        {section.label}
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              }

              return (
                <Popover 
                  key={section.id} 
                  open={openPopover === section.id}
                  onOpenChange={(open) => setOpenPopover(open ? section.id : null)}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <PopoverTrigger asChild>
                        <button
                          className={cn(
                            "relative flex items-center gap-3 rounded-lg p-3 text-slate-400 transition-all hover:bg-slate-800 hover:text-white",
                            isActive && "bg-slate-800 text-white",
                            !isCollapsed && "justify-start w-full"
                          )}
                        >
                          {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-violet-500 to-fuchsia-500 rounded-r-full" />
                          )}
                          <Icon className="h-5 w-5 shrink-0" strokeWidth={1.5} />
                          {!isCollapsed && (
                            <>
                              <span className="text-sm font-medium flex-1 text-left">{section.label}</span>
                              <ChevronRight className="h-4 w-4 text-slate-500" />
                            </>
                          )}
                        </button>
                      </PopoverTrigger>
                    </TooltipTrigger>
                    {isCollapsed && openPopover !== section.id && (
                      <TooltipContent side="right" className="bg-slate-800 text-white border-slate-700">
                        {section.label}
                      </TooltipContent>
                    )}
                  </Tooltip>
                  <PopoverContent 
                    side="right" 
                    align="start"
                    className="w-56 p-2 bg-slate-800 border-slate-700"
                    sideOffset={8}
                  >
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 py-1.5 mb-1">
                      {section.label}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {section.items.map((item) => {
                        const ItemIcon = item.icon;
                        const itemActive = isItemActive(item.id);
                        
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleItemClick(item)}
                            className={cn(
                              "flex items-center gap-3 rounded-md px-2 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-700 hover:text-white",
                              itemActive && "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-600 hover:to-fuchsia-600"
                            )}
                          >
                            {ItemIcon && <ItemIcon className="h-4 w-4" strokeWidth={1.5} />}
                            <span className="flex-1 text-left">{item.label}</span>
                            {item.isComplete && (
                              <Check className="h-4 w-4 text-green-400" />
                            )}
                            {item.badge && item.badge > 0 && (
                              <Badge className="h-5 text-xs bg-gradient-to-r from-violet-500 to-fuchsia-500 border-0">
                                {item.badge}
                              </Badge>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              );
            })}
          </nav>
        </ScrollArea>

        <div className="border-t border-slate-800 p-2 space-y-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggleCollapse}
                className="flex items-center justify-center w-full rounded-lg p-2 text-slate-400 transition-all hover:bg-slate-800 hover:text-white"
              >
                {isCollapsed ? (
                  <Menu className="h-5 w-5" strokeWidth={1.5} />
                ) : (
                  <>
                    <X className="h-5 w-5" strokeWidth={1.5} />
                    <span className="ml-2 text-sm">Collapse</span>
                  </>
                )}
              </button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right" className="bg-slate-800 text-white border-slate-700">
                Expand Menu
              </TooltipContent>
            )}
          </Tooltip>

          {user && (
            <div className={cn(
              "rounded-lg bg-slate-800/50 p-2",
              isCollapsed ? "flex flex-col items-center gap-2" : "flex items-center gap-3"
            )}>
              {user.profileImageUrl ? (
                <img 
                  src={user.profileImageUrl} 
                  alt={user.firstName || 'User'} 
                  className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white flex-shrink-0">
                  <span className="text-sm font-medium">
                    {user.firstName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user.firstName || 'User'}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {user.email || ''}
                  </p>
                </div>
              )}
              {onLogout && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={onLogout}
                      className={cn(
                        "flex items-center justify-center rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors",
                        isCollapsed ? "p-2" : "p-1.5"
                      )}
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side={isCollapsed ? "right" : "top"} className="bg-slate-800 text-white border-slate-700">
                    Logout
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}

export default CustomerIconSidebar;
