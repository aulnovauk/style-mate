import { useState } from "react";
import { Link, useLocation } from "wouter";
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
  Home,
  CalendarDays,
  Receipt,
  Tag,
  SmilePlus,
  ShoppingBag,
  UserSquare,
  Ticket,
  BarChart3,
  Megaphone,
  Settings,
  ChevronRight,
  Check,
  Menu,
  X,
  LogOut,
  UserCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface SidebarNavItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  isComplete?: boolean;
  isOptional?: boolean;
  badge?: number;
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
}

interface BusinessIconSidebarProps {
  sections: SidebarSection[];
  activeTab: string;
  onNavigate: (tabId: string) => void;
  salonName?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  user?: UserInfo | null;
  onLogout?: () => void;
}

export function BusinessIconSidebar({
  sections,
  activeTab,
  onNavigate,
  salonName,
  isCollapsed = true,
  onToggleCollapse,
  user,
  onLogout,
}: BusinessIconSidebarProps) {
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const [location] = useLocation();

  const isItemActive = (itemId: string) => activeTab === itemId;
  
  const isSectionActive = (section: SidebarSection) => {
    return section.items.some(item => isItemActive(item.id));
  };

  const handleItemClick = (itemId: string) => {
    onNavigate(itemId);
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
              <span className="text-white font-semibold truncate">{salonName || 'Stylemate'}</span>
            </div>
          )}
        </div>

        <ScrollArea className="flex-1 py-4">
          <nav className="flex flex-col gap-1 px-2">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = isSectionActive(section);
              const hasSingleItem = section.singleItem || section.items.length === 1;

              if (hasSingleItem) {
                const item = section.items[0];
                return (
                  <Tooltip key={section.id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleItemClick(item.id)}
                        className={cn(
                          "relative flex items-center gap-3 rounded-lg p-3 text-slate-400 transition-all hover:bg-slate-800 hover:text-white",
                          isActive && "bg-slate-800 text-white",
                          !isCollapsed && "justify-start"
                        )}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-violet-500 rounded-r-full" />
                        )}
                        <Icon className="h-5 w-5 shrink-0" strokeWidth={1.5} />
                        {!isCollapsed && (
                          <span className="text-sm font-medium">{section.label}</span>
                        )}
                        {item.badge && item.badge > 0 && (
                          <Badge 
                            variant="destructive" 
                            className={cn(
                              "h-5 min-w-5 text-xs",
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
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-violet-500 rounded-r-full" />
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
                            onClick={() => handleItemClick(item.id)}
                            className={cn(
                              "flex items-center gap-3 rounded-md px-2 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-700 hover:text-white",
                              itemActive && "bg-violet-600 text-white hover:bg-violet-600"
                            )}
                          >
                            {ItemIcon && <ItemIcon className="h-4 w-4" strokeWidth={1.5} />}
                            <span className="flex-1 text-left">{item.label}</span>
                            {item.isComplete && (
                              <Check className="h-4 w-4 text-green-400" />
                            )}
                            {item.isOptional && !item.isComplete && (
                              <span className="text-xs text-slate-500">Optional</span>
                            )}
                            {item.badge && item.badge > 0 && (
                              <Badge variant="destructive" className="h-5 text-xs">
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

        {/* User section with logout */}
        <div className="border-t border-slate-800 p-2 space-y-2">
          {/* Expand/Collapse toggle */}
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

          {/* User info and logout */}
          {user && (
            <div className={cn(
              "rounded-lg bg-slate-800/50 p-2",
              isCollapsed ? "flex flex-col items-center gap-2" : "flex items-center gap-3"
            )}>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white flex-shrink-0">
                <UserCircle className="h-5 w-5" />
              </div>
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

export const defaultSidebarSections: SidebarSection[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: Home,
    singleItem: true,
    items: [{ id: "overview", label: "Dashboard" }],
  },
  {
    id: "calendar",
    label: "Calendar",
    icon: CalendarDays,
    singleItem: true,
    items: [{ id: "calendar", label: "Booking Calendar" }],
  },
  {
    id: "frontdesk",
    label: "Front Desk",
    icon: Receipt,
    singleItem: true,
    items: [{ id: "frontdesk", label: "Front Desk" }],
  },
  {
    id: "services",
    label: "Services",
    icon: Tag,
    items: [
      { id: "services", label: "Services & Pricing" },
      { id: "packages", label: "Packages & Combos" },
      { id: "memberships", label: "Membership Plans" },
    ],
  },
  {
    id: "clients",
    label: "Clients",
    icon: SmilePlus,
    items: [
      { id: "client-profiles", label: "Client Profiles" },
      { id: "customer-import", label: "Import Customers" },
    ],
  },
  {
    id: "shop",
    label: "Shop",
    icon: ShoppingBag,
    items: [
      { id: "beauty-catalog", label: "Product Catalog" },
      { id: "inventory", label: "Inventory" },
    ],
  },
  {
    id: "team",
    label: "Team",
    icon: UserSquare,
    items: [
      { id: "staff", label: "Staff Management" },
      { id: "payroll-overview", label: "Payroll" },
      { id: "commissions", label: "Commissions" },
    ],
  },
  {
    id: "events",
    label: "Events",
    icon: Ticket,
    items: [
      { id: "events-dashboard", label: "Event Dashboard" },
      { id: "create-event", label: "Create Event" },
      { id: "draft-events", label: "Draft Events" },
      { id: "past-events", label: "Past Events" },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    icon: BarChart3,
    items: [
      { id: "analytics", label: "Analytics" },
      { id: "ml-analytics", label: "ML Predictions" },
      { id: "financials", label: "Financial Reports" },
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    icon: Megaphone,
    items: [
      { id: "offers", label: "Offers & Promotions" },
      { id: "campaigns", label: "Campaigns" },
      { id: "communications", label: "Customer Comms" },
      { id: "chat-inbox", label: "Chat Inbox" },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    items: [
      { id: "business-info", label: "Business Info" },
      { id: "location-contact", label: "Location & Contact" },
      { id: "resources", label: "Resources & Equipment" },
      { id: "booking-settings", label: "Booking Settings" },
      { id: "payment-setup", label: "Payment Setup" },
      { id: "media", label: "Media Gallery" },
      { id: "publish", label: "Publish Business" },
      { id: "shop-admins", label: "Shop Admins" },
    ],
  },
];
