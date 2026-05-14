import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { FileDown, Search, Clock, User, Shield, UserCheck, UserMinus, Eye, CheckCircle2, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type UserProfile = {
  id: string;
  user_id: string;
  full_name: string;
  email?: string;
  role?: string;
  roles?: string[];
  company_name?: string;
  created_at: string;
  has_kitchen_access?: boolean;
  has_store_access?: boolean;
};

type SortField = "full_name" | "role" | "created_at";
type SortOrder = "asc" | "desc";

export default function CPUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [permissionFilter, setPermissionFilter] = useState<string>("all");
  
  // Sorting and Pagination states
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // States for Modals
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [newRole, setNewRole] = useState<string>("");
  const [updatingRole, setUpdatingRole] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createFullName, setCreateFullName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createCompanyName, setCreateCompanyName] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRole, setCreateRole] = useState<string>("user");
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("cpanel-manage-users", {
        body: { action: "list", page: 1, perPage: 200 },
      });
      if (error || data?.error) throw new Error((data?.error as string) || error?.message || "Falha ao carregar usuários");

      const list = (data as Array<{ user_id: string; email: string | null; full_name: string | null; company_name: string | null; created_at: string; roles: string[] }>).map((u) => {
        const roles = u.roles || [];
        const hasKitchen = roles.includes("cozinha") || roles.includes("super_admin") || roles.includes("admin");
        const hasStore = roles.includes("super_admin") || roles.includes("admin");
        const primaryRole = roles.includes("super_admin") ? "super_admin" : roles.includes("admin") ? "admin" : roles[0] || "user";
        return {
          id: u.user_id,
          user_id: u.user_id,
          email: u.email || undefined,
          full_name: u.full_name || "Sem nome",
          company_name: u.company_name || undefined,
          created_at: u.created_at,
          roles,
          role: primaryRole,
          has_kitchen_access: hasKitchen,
          has_store_access: hasStore,
        } satisfies UserProfile;
      });

      setUsers(list);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error("Erro ao carregar usuários: " + message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleUpdateRole = async () => {
    if (!selectedUser || !newRole) return;
    
    setUpdatingRole(true);
    try {
      const { data, error } = await supabase.functions.invoke("cpanel-manage-users", {
        body: { action: "set_role", user_id: selectedUser.user_id, role: newRole },
      });
      if (error || data?.error) throw new Error((data?.error as string) || error?.message || "Falha ao atualizar cargo");

      toast.success(`Cargo de ${selectedUser.full_name} atualizado para ${newRole}`);
      setIsRoleModalOpen(false);
      loadUsers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error("Erro ao atualizar cargo: " + message);
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleCreateUser = async () => {
    if (!createEmail || !createPassword) {
      toast.error("Email e senha são obrigatórios");
      return;
    }
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("cpanel-manage-users", {
        body: {
          action: "create",
          email: createEmail,
          password: createPassword,
          full_name: createFullName,
          company_name: createCompanyName,
          role: createRole,
        },
      });
      if (error || data?.error) throw new Error((data?.error as string) || error?.message || "Falha ao criar usuário");

      toast.success("Usuário criado com sucesso");
      setIsCreateOpen(false);
      setCreateFullName("");
      setCreateEmail("");
      setCreateCompanyName("");
      setCreatePassword("");
      setCreateRole("user");
      loadUsers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error("Erro ao criar usuário: " + message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setDeletingUserId(userId);
    try {
      const { data, error } = await supabase.functions.invoke("cpanel-manage-users", {
        body: { action: "delete", user_id: userId },
      });
      if (error || data?.error) throw new Error((data?.error as string) || error?.message || "Falha ao excluir usuário");
      toast.success("Usuário excluído");
      loadUsers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error("Erro ao excluir usuário: " + message);
    } finally {
      setDeletingUserId(null);
    }
  };

  const filteredAndSortedUsers = users
    .filter(u => {
      const matchesSearch = (u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.user_id.includes(search) || u.email?.toLowerCase().includes(search.toLowerCase()));
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      
      let matchesPermission = true;
      if (permissionFilter === "kitchen") matchesPermission = !!u.has_kitchen_access;
      if (permissionFilter === "store") matchesPermission = !!u.has_store_access;
      
      return matchesSearch && matchesRole && matchesPermission;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === "created_at") {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else {
        const valA = (a[sortField] || "").toString().toLowerCase();
        const valB = (b[sortField] || "").toString().toLowerCase();
        comparison = valA.localeCompare(valB);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const totalPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage);
  const currentUsers = filteredAndSortedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "super_admin":
        return <Badge className="bg-purple-600">Super Admin</Badge>;
      case "admin":
        return <Badge className="bg-blue-600">Admin</Badge>;
      case "cozinha":
        return <Badge className="bg-orange-500">Cozinha</Badge>;
      case "user":
        return <Badge variant="secondary">Cliente</Badge>;
      default:
        return <Badge variant="outline">{role || "user"}</Badge>;
    }
  };

  const exportCSV = (onlyFiltered = false) => {
    const list = onlyFiltered ? filteredAndSortedUsers : users;
    const headers = ["ID", "Nome Completo", "Cargo", "Empresa", "Acesso Cozinha", "Acesso Loja", "Criado Em"];
    const rows = list.map(u => [
      u.user_id,
      u.full_name || "Sem nome",
      u.role || "user",
      u.company_name || "N/A",
      u.has_kitchen_access ? "Sim" : "Não",
      u.has_store_access ? "Sim" : "Não",
      format(new Date(u.created_at), "dd/MM/yyyy HH:mm")
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `usuarios_${onlyFiltered ? 'filtrados_' : ''}${new Date().getTime()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Relatório CSV gerado!");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-foreground">👥 Gestão de Usuários</h1>
          <p className="text-sm text-muted-foreground">Controle de acessos, permissões e auditoria</p>
        </div>
        <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setIsCreateOpen(true)} className="gap-2">
              + Novo Usuário
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportCSV(true)} className="gap-2">
              <FileDown className="h-4 w-4" /> Exportar Filtrados
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportCSV(false)}>
              Exportar Tudo
            </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          <div className="relative md:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Nome ou ID..." 
              className="pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setCurrentPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por Cargo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os cargos</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="cozinha">Cozinha</SelectItem>
              <SelectItem value="user">Cliente</SelectItem>
            </SelectContent>
          </Select>
          <Select value={permissionFilter} onValueChange={(v) => { setPermissionFilter(v); setCurrentPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por Permissão" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as permissões</SelectItem>
              <SelectItem value="kitchen">Acesso Cozinha</SelectItem>
              <SelectItem value="store">Acesso Loja</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 p-2 bg-muted/30 rounded-lg">
        <span className="text-xs font-medium text-muted-foreground mr-2">Ordenar por:</span>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => toggleSort("full_name")}
          className={`h-8 text-xs ${sortField === "full_name" ? "bg-background shadow-sm text-primary" : ""}`}
        >
          <ArrowUpDown className="h-3 w-3 mr-1" /> Nome {sortField === "full_name" && (sortOrder === "asc" ? "↑" : "↓")}
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => toggleSort("role")}
          className={`h-8 text-xs ${sortField === "role" ? "bg-background shadow-sm text-primary" : ""}`}
        >
          <ArrowUpDown className="h-3 w-3 mr-1" /> Cargo {sortField === "role" && (sortOrder === "asc" ? "↑" : "↓")}
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => toggleSort("created_at")}
          className={`h-8 text-xs ${sortField === "created_at" ? "bg-background shadow-sm text-primary" : ""}`}
        >
          <ArrowUpDown className="h-3 w-3 mr-1" /> Data {sortField === "created_at" && (sortOrder === "asc" ? "↑" : "↓")}
        </Button>
      </div>

      <div className="grid gap-4">
        {currentUsers.map((user) => (
          <Card key={user.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row md:items-center justify-between p-4 gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{user.full_name || "Sem nome"}</h3>
                    {user.email && <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Shield className="h-3 w-3" /> {getRoleBadge(user.role)}
                      </span>
                      {user.has_kitchen_access && (
                        <Badge variant="outline" className="text-[10px] h-5 border-orange-200 bg-orange-50 text-orange-700">Cozinha</Badge>
                      )}
                      {user.has_store_access && (
                        <Badge variant="outline" className="text-[10px] h-5 border-blue-200 bg-blue-50 text-blue-700">Loja</Badge>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> 
                        {format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 self-end md:self-center">
                  <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={() => {
                    setSelectedUser(user);
                    setIsDetailsOpen(true);
                  }}>
                    <Eye className="h-3.5 w-3.5" /> Detalhes
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={() => {
                    setSelectedUser(user);
                    setNewRole(user.role || "user");
                    setIsRoleModalOpen(true);
                  }}>
                    <UserCheck className="h-3.5 w-3.5" /> Alterar Cargo
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 text-destructive hover:text-destructive"
                    disabled={deletingUserId === user.user_id}
                    onClick={() => handleDeleteUser(user.user_id)}
                  >
                    {deletingUserId === user.user_id ? "Excluindo..." : "Excluir"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
          </Button>
          <span className="text-sm font-medium">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Próxima <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Detalhes do Usuário</DialogTitle>
            <DialogDescription>
              Informações completas e permissões de acesso.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Nome Completo</p>
                  <p className="text-sm font-medium">{selectedUser.full_name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Cargo Atual</p>
                  <div>{getRoleBadge(selectedUser.role)}</div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">ID do Usuário</p>
                  <p className="text-xs font-mono truncate">{selectedUser.user_id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Empresa</p>
                  <p className="text-sm">{selectedUser.company_name || "Não informada"}</p>
                </div>
              </div>
              <div className="pt-4 border-t">
                <h4 className="text-sm font-semibold mb-3">Permissões Ativas</h4>
                <div className="space-y-2">
                   <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <span className="text-sm">Acesso ao Painel da Loja</span>
                      {selectedUser.has_store_access ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <UserMinus className="h-4 w-4 text-muted-foreground" />}
                   </div>
                   <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <span className="text-sm">Acesso ao Painel da Cozinha</span>
                      {selectedUser.has_kitchen_access ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <UserMinus className="h-4 w-4 text-muted-foreground" />}
                   </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Role Change Modal */}
      <Dialog open={isRoleModalOpen} onOpenChange={setIsRoleModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Cargo do Usuário</DialogTitle>
            <DialogDescription>
              Esta ação mudará o nível de acesso de {selectedUser?.full_name}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
             <div className="space-y-2">
                <label className="text-sm font-medium">Selecione o novo cargo</label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="admin">Admin (Lojista)</SelectItem>
                    <SelectItem value="cozinha">Cozinha</SelectItem>
                    <SelectItem value="user">Cliente (User)</SelectItem>
                  </SelectContent>
                </Select>
             </div>
             <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-100">
               Atenção: A mudança de cargo afetará as permissões do usuário imediatamente.
             </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleUpdateRole} disabled={updatingRole}>
              {updatingRole ? "Salvando..." : "Confirmar Alteração"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
            <DialogDescription>
              Cria um usuário no Supabase Auth e define o cargo inicial.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome</label>
              <Input value={createFullName} onChange={(e) => setCreateFullName(e.target.value)} placeholder="Nome completo" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} placeholder="email@dominio.com" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Empresa</label>
              <Input value={createCompanyName} onChange={(e) => setCreateCompanyName(e.target.value)} placeholder="Nome do restaurante/empresa" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Senha</label>
              <Input type="password" value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} placeholder="Senha" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Cargo</label>
              <Select value={createRole} onValueChange={setCreateRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um cargo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin (Lojista)</SelectItem>
                  <SelectItem value="cozinha">Cozinha</SelectItem>
                  <SelectItem value="pedidos">Pedidos</SelectItem>
                  <SelectItem value="entrega">Entrega</SelectItem>
                  <SelectItem value="user">Cliente (User)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateUser} disabled={creating}>
              {creating ? "Criando..." : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
