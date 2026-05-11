import { LayoutDashboard, ShoppingBag, ChefHat, Monitor, Settings } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Início", icon: LayoutDashboard, to: "/admin" },
  { label: "PDV", icon: Monitor, to: "/admin/pdv" },
  { label: "Pedidos", icon: ShoppingBag, to: "/admin/pedidos" },
  { label: "Cozinha", icon: ChefHat, to: "/admin/cozinha" },
  { label: "Config", icon: Settings, to: "/admin/config" },
];

export function MobileBottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const isActive = tab.to === "/admin" ? pathname === "/admin" : pathname.startsWith(tab.to);
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-muted-foreground transition-colors",
                isActive && "text-primary"
              )}
            >
              <tab.icon className={cn("h-5 w-5", isActive && "text-primary")} />
              <span className={cn("text-[10px]", isActive && "font-semibold")}>{tab.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
