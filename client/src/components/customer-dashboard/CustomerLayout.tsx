import { ReactNode, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useQuery } from "@tanstack/react-query";
import { CustomerIconSidebar } from "./CustomerIconSidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface CustomerLayoutProps {
  children: ReactNode;
  activeTab?: string;
}

export function CustomerLayout({ children, activeTab = "home" }: CustomerLayoutProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const [, navigate] = useLocation();
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: appointmentsData } = useQuery<{ upcoming: any[] }>({
    queryKey: ["/api/customer/appointments"],
    enabled: isAuthenticated,
  });

  const upcomingCount = appointmentsData?.upcoming?.length || 0;

  const handleNavigate = (tabId: string, route?: string) => {
    if (route) {
      navigate(route);
    } else {
      navigate(`/customer/dashboard?tab=${tabId}`);
    }
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  const sidebarWidth = sidebarCollapsed ? "64px" : "256px";

  if (isMobile) {
    return (
      <div className="min-h-screen">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="fixed top-20 left-4 z-50 bg-slate-900 text-white hover:bg-slate-800 shadow-lg"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-slate-900 border-slate-800">
            <CustomerIconSidebar
              activeTab={activeTab}
              onNavigate={handleNavigate}
              isCollapsed={false}
              onToggleCollapse={() => setMobileMenuOpen(false)}
              user={user ? {
                firstName: user.firstName || undefined,
                lastName: user.lastName || undefined,
                email: user.email || undefined,
                profileImageUrl: user.profileImageUrl || undefined,
              } : null}
              onLogout={handleLogout}
              upcomingCount={upcomingCount}
              cartCount={itemCount}
            />
          </SheetContent>
        </Sheet>
        <main>{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <CustomerIconSidebar
        activeTab={activeTab}
        onNavigate={handleNavigate}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        user={user ? {
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          email: user.email || undefined,
          profileImageUrl: user.profileImageUrl || undefined,
        } : null}
        onLogout={handleLogout}
        upcomingCount={upcomingCount}
        cartCount={itemCount}
      />
      <main 
        className={cn(
          "flex-1 transition-all duration-300",
        )}
        style={{ marginLeft: sidebarWidth }}
      >
        {children}
      </main>
    </div>
  );
}

export default CustomerLayout;
