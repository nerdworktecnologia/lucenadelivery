import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { OrderStatus } from "@/types/orders";
import { toast } from "sonner";
import { printComanda } from "@/utils/printComanda";

export interface DbOrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  price: number;
  addons: string[];
  notes: string;
}

export interface DbOrder {
  id: string;
  number: number;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  items: DbOrderItem[];
  notes: string;
  total: number;
  payment: string;
  status: OrderStatus;
  created_at: string;
  address: string;
  channel: string;
  delivery_type: string;
  change_for: number | null;
}

type OrderItemRow = Omit<DbOrderItem, "addons"> & { addons: unknown };

interface OrderContextType {
  orders: DbOrder[];
  loading: boolean;
  updateStatus: (orderId: string, status: OrderStatus) => void;
  addOrder: (order: Omit<DbOrder, "id" | "items"> & { items: Omit<DbOrderItem, "id" | "order_id">[] }) => void;
}

const OrderContext = createContext<OrderContextType>({
  orders: [],
  loading: true,
  updateStatus: () => {},
  addOrder: () => {},
});

export const useOrders = () => useContext(OrderContext);

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (!user) { setOrders([]); setLoading(false); return; }
    const { data: ordersData, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) { console.error(error); setLoading(false); return; }

    // Fetch items for all orders
    const orderIds = (ordersData || []).map(o => o.id);
    let itemsData: OrderItemRow[] = [];
    if (orderIds.length > 0) {
      const { data } = await supabase
        .from("order_items")
        .select("*")
        .in("order_id", orderIds);
      itemsData = (data as OrderItemRow[]) || [];
    }

    const mapped: DbOrder[] = (ordersData || []).map(o => ({
      ...o,
      status: o.status as OrderStatus,
      items: itemsData
        .filter(i => i.order_id === o.id)
        .map(i => ({ ...i, addons: Array.isArray(i.addons) ? i.addons : [] })),
    }));

    setOrders(mapped);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `user_id=eq.${user.id}` }, () => {
        fetchOrders();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchOrders]);

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    // Optimistic update
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    const { error } = await supabase.from("orders").update({ status, updated_at: new Date().toISOString() }).eq("id", orderId);
    if (error) {
      toast.error("Erro ao atualizar status");
      fetchOrders();
      return;
    }

    // Read auto-print settings from database
    if (user) {
      const { data: settingsData } = await supabase
        .from("store_settings")
        .select("auto_print_kitchen, auto_print_delivery, print_width")
        .eq("user_id", user.id)
        .maybeSingle();

      const autoPrintKitchen = settingsData ? settingsData.auto_print_kitchen : true;
      const autoPrintDelivery = settingsData ? settingsData.auto_print_delivery : true;
      const printWidth = (settingsData?.print_width as "58mm" | "80mm") || "58mm";

      if (status === "em_preparo" && autoPrintKitchen) {
        const order = orders.find(o => o.id === orderId);
        if (order) {
          printComanda({ ...order, status }, "cozinha", printWidth);
          toast.success(`Comanda #${order.number} enviada para impressão (cozinha)`);
        }
      }

      if (status === "saiu_entrega" && autoPrintDelivery) {
        const order = orders.find(o => o.id === orderId);
        if (order) {
          printComanda({ ...order, status }, "entrega", printWidth);
          toast.success(`Comanda #${order.number} enviada para impressão (entrega)`);
        }
      }
    }
  };

  const addOrder = async (order: Omit<DbOrder, "id" | "items"> & { items: Omit<DbOrderItem, "id" | "order_id">[] }) => {
    if (!user) return;
    const { items, ...orderData } = order;
    const { data, error } = await supabase.from("orders").insert({ ...orderData, user_id: user.id }).select().single();
    if (error || !data) { toast.error("Erro ao criar pedido"); return; }
    if (items.length > 0) {
      await supabase.from("order_items").insert(items.map(i => ({ ...i, order_id: data.id, addons: i.addons })));
    }
    fetchOrders();
  };

  return (
    <OrderContext.Provider value={{ orders, loading, updateStatus, addOrder }}>
      {children}
    </OrderContext.Provider>
  );
};
