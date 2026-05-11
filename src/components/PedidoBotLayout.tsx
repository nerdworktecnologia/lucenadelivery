import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { PedidoBotSidebar } from "@/components/PedidoBotSidebar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Outlet, Link } from "react-router-dom";
import Footer from "@/components/Footer";
import { OrderProvider } from "@/contexts/OrderContext";
import { Bell, Search, ExternalLink, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOrders } from "@/contexts/OrderContext";
import { useKitchenSound } from "@/hooks/useKitchenSound";

function HeaderContent() {
  const { orders } = useOrders();
  const newOrders = orders.filter((o) => o.status === "novo").length;
  useKitchenSound();

  return (
    <header className="h-14 flex items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-4 gap-4">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="hidden md:flex" />
        <div className="hidden md:flex relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Buscar pedidos, clientes..." className="pl-8 h-8 w-64 text-sm bg-secondary/50" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link to="/cardapio" target="_blank">
          <Button variant="outline" size="sm" className="hidden sm:flex gap-1.5 h-8 text-xs">
            <ExternalLink className="h-3 w-3" />
            Ver Cardápio
          </Button>
        </Link>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          {newOrders > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground rounded-full text-[10px] flex items-center justify-center font-bold animate-pulse">
              {newOrders}
            </span>
          )}
        </Button>
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-4 w-4 text-primary" />
        </div>
      </div>
    </header>
  );
}

export default function PedidoBotLayout() {
  return (
    <OrderProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <PedidoBotSidebar />
          <div className="flex-1 flex flex-col">
            <HeaderContent />
            <main className="flex-1 p-2 sm:p-4 md:p-6 pb-16 md:pb-6 overflow-auto bg-background">
              <Outlet />
              <Footer />
            </main>
            <MobileBottomNav />
          </div>
        </div>
      </SidebarProvider>
    </OrderProvider>
  );
}
