import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Phone, MapPin, ShoppingBag, DollarSign, Loader2 } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  order_count: number;
  total_spent: number;
  last_order: string | null;
  preference: string | null;
}

const PBCustomers = () => {
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchCustomers = async () => {
      if (!user) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setCustomers(data);
      }
      setLoading(false);
    };
    fetchCustomers();
  }, [user]);

  const filtered = customers.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-sm text-muted-foreground">{customers.length} clientes cadastrados</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar cliente..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              Nenhum cliente encontrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead className="hidden md:table-cell">Endereço</TableHead>
                  <TableHead className="text-center">Pedidos</TableHead>
                  <TableHead className="text-right">Total Gasto</TableHead>
                  <TableHead className="hidden lg:table-cell">Último Pedido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium text-foreground">{c.name}</TableCell>
                    <TableCell><div className="flex items-center gap-1 text-muted-foreground"><Phone className="h-3.5 w-3.5" />{c.phone}</div></TableCell>
                    <TableCell className="hidden md:table-cell"><div className="flex items-center gap-1 text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{c.address}</div></TableCell>
                    <TableCell className="text-center"><div className="flex items-center justify-center gap-1"><ShoppingBag className="h-3.5 w-3.5 text-primary" />{c.order_count}</div></TableCell>
                    <TableCell className="text-right font-medium text-foreground"><div className="flex items-center justify-end gap-1"><DollarSign className="h-3.5 w-3.5 text-primary" />R$ {Number(c.total_spent).toFixed(2)}</div></TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">{c.last_order ? new Date(c.last_order).toLocaleDateString("pt-BR") : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PBCustomers;
