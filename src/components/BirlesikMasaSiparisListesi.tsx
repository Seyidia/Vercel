import { useEffect, useState } from "react";
import { supabase } from "../utils/supabase";

interface Table {
  id: string;
  table_number: number;
  group_id: string;
}

interface Order {
  id: string;
  table_id: string;
  status: string;
  created_at: string;
  total_amount: number;
}

export default function BirlesikMasaSiparisListesi({ selectedTableId }: { selectedTableId: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [mergedTableName, setMergedTableName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedTableId) return;
    const fetchOrders = async () => {
      setLoading(true);
      // 1. Seçili masanın group_id'sini bul
      const { data: table } = await supabase
        .from("tables")
        .select("group_id")
        .eq("id", selectedTableId)
        .single();

      if (!table) {
        setLoading(false);
        setOrders([]);
        setMergedTableName("");
        return;
      }
      const groupId = table.group_id;

      // 2. O gruptaki tüm masaları bul
      const { data: groupTables } = await supabase
        .from("tables")
        .select("id, table_number, group_id")
        .eq("group_id", groupId);

      const safeGroupTables = groupTables ?? [];

      // 3. O gruptaki masaların id'lerini al
      const tableIds = safeGroupTables.map((t: Table) => t.id);

      // 4. O masalara ait siparişleri çek
      const { data: groupOrders } = await supabase
        .from("orders")
        .select("*")
        .in("table_id", tableIds.length > 0 ? tableIds : ["-1"])
        .order("created_at", { ascending: false });

      setOrders(groupOrders ?? []);

      // 5. Masa adını oluştur
      setMergedTableName(safeGroupTables.map((t: Table) => t.table_number).join("+"));
      setLoading(false);
    };

    fetchOrders();
  }, [selectedTableId]);

  if (!selectedTableId) return <div>Lütfen bir masa seçin.</div>;

  return (
    <div>
      <h2>
        {loading
          ? "Yükleniyor..."
          : `Birleşik Masa: ${mergedTableName || "?"}`}
      </h2>
      <ul>
        {orders.map((order) => (
          <li key={order.id}>
            Sipariş #{order.id} | Tutar: {order.total_amount} ₺ | Durum: {order.status}
          </li>
        ))}
      </ul>
      {orders.length === 0 && !loading && <div>Bu masada sipariş yok.</div>}
    </div>
  );
} 