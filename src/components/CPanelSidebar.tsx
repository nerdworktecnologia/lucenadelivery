import { Link, useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";
import { LayoutDashboard, Building2, CreditCard, MessageSquare, LogOut, Users, History } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const menuItems = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/cpanel" },
  { title: "Clientes / Lojas", icon: Building2, path: "/cpanel/empresas" },
  { title: "Usuários", icon: Users, path: "/cpanel/usuarios" },
  { title: "Auditoria", icon: History, path: "/cpanel/auditoria" },
  { title: "Planos", icon: CreditCard, path: "/cpanel/planos" },
  { title: "Comunicação", icon: MessageSquare, path: "/cpanel/comunicacao" },
];

export function CPanelSidebar() {
  const location = useLocation();
  const { signOut } = useAuth();

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center text-lg">
            🍽️
          </div>
          <div>
            <p className="font-bold text-sidebar-foreground text-sm font-['Space_Grotesk']">LucenaDelivery</p>
            <p className="text-[11px] text-sidebar-foreground/60">Gestão de Assinantes</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.path}
                    tooltip={item.title}
                  >
                    <Link to={item.path}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => signOut()} tooltip="Sair">
                  <LogOut className="h-4 w-4" />
                  <span>Sair</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
