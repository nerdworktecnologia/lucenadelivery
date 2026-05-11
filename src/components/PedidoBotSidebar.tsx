import {
  LayoutDashboard, ShoppingBag, ChefHat, Users, Package, FolderOpen,
  MessageCircle, BarChart3, Settings, LogOut, Zap, Menu as MenuIcon, Monitor, UserPlus, Truck,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole, AppRole } from "@/hooks/useUserRole";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

interface MenuItem {
  title: string;
  url: string;
  icon: React.ElementType;
  roles?: AppRole[]; // if undefined, visible to all authenticated
}

const mainItems: MenuItem[] = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard, roles: ["admin"] },
  { title: "PDV", url: "/admin/pdv", icon: Monitor, roles: ["admin", "pedidos"] },
  { title: "Pedidos", url: "/admin/pedidos", icon: ShoppingBag, roles: ["admin", "pedidos"] },
  { title: "Cozinha (KDS)", url: "/admin/cozinha", icon: ChefHat, roles: ["admin", "cozinha"] },
];

const managementItems: MenuItem[] = [
  { title: "Produtos", url: "/admin/produtos", icon: Package, roles: ["admin"] },
  { title: "Categorias", url: "/admin/categorias", icon: FolderOpen, roles: ["admin"] },
  { title: "Clientes", url: "/admin/clientes", icon: Users, roles: ["admin"] },
  { title: "Entregadores", url: "/admin/entregadores", icon: Truck, roles: ["admin"] },
];

const otherItems: MenuItem[] = [
  { title: "WhatsApp Bot", url: "/admin/whatsapp", icon: MessageCircle, roles: ["admin"] },
  { title: "Relatórios", url: "/admin/relatorios", icon: BarChart3, roles: ["admin"] },
  { title: "Equipe", url: "/admin/equipe", icon: UserPlus, roles: ["admin"] },
  { title: "Configurações", url: "/admin/config", icon: Settings, roles: ["admin"] },
];

function filterByRole(items: MenuItem[], role: AppRole | null): MenuItem[] {
  // If no role found (owner without explicit role), show everything
  if (!role) return items;
  return items.filter((item) => !item.roles || item.roles.includes(role));
}

export function PedidoBotSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut } = useAuth();
  const { role } = useUserRole();

  const renderGroup = (label: string, items: MenuItem[]) => {
    const filtered = filterByRole(items, role);
    if (filtered.length === 0) return null;
    return (
      <SidebarGroup>
        <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-widest">{!collapsed ? label : ""}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {filtered.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <NavLink to={item.url} end={item.url === "/admin"} className="hover:bg-sidebar-accent transition-colors" activeClassName="bg-sidebar-primary/20 text-sidebar-primary font-semibold">
                    <item.icon className="mr-2 h-4 w-4" />
                    {!collapsed && <span>{item.title}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  return (
    <Sidebar collapsible="icon" className="hidden md:flex">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            <div className="flex items-center gap-2.5 py-1">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
                <Zap className="h-4 w-4 text-primary-foreground" />
              </div>
              {!collapsed && (
                <div>
                  <span className="font-bold text-sidebar-foreground text-sm tracking-tight">LucenaDelivery</span>
                  <p className="text-[10px] text-sidebar-foreground/40 -mt-0.5">Comanda, gerencia, entrega</p>
                </div>
              )}
            </div>
          </SidebarGroupLabel>
        </SidebarGroup>
        {renderGroup("Principal", mainItems)}
        {renderGroup("Gestão", managementItems)}
        {renderGroup("Integrações", otherItems)}
      </SidebarContent>
      <SidebarFooter>
        <div className="p-2">
          {!collapsed && !role && (
            <div className="px-2 py-2 mb-2 rounded-lg bg-sidebar-accent/50">
              <p className="text-[10px] text-sidebar-foreground/50 uppercase tracking-wider">Plano</p>
              <p className="text-xs text-sidebar-primary font-semibold">Pro • Ativo</p>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start gap-2 text-sidebar-foreground/50 hover:text-destructive hover:bg-sidebar-accent">
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Sair</span>}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
