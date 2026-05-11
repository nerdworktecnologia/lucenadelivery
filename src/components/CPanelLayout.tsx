import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { CPanelSidebar } from "@/components/CPanelSidebar";
import { Outlet } from "react-router-dom";
import Footer from "@/components/Footer";
import { Shield } from "lucide-react";

export default function CPanelLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <CPanelSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-4">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Shield className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium">Super Admin</span>
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto bg-background">
            <Outlet />
            <Footer />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
