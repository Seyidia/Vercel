import { useEffect, useState } from "react";
import { supabase } from "../utils/supabase";
import { v4 as uuidv4 } from "uuid";

interface Table {
  id: string;
  table_number: number;
  group_id: string;
}

export default function MasaSecBirleştir({ onMerged }: { onMerged?: () => void }) {
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Masaları çek
  const fetchTables = async () => {
    const { data, error } = await supabase.from("tables").select("*").order("table_number");
    if (!error) setTables(data);
  };

  useEffect(() => {
    fetchTables();
  }, []);

  // Masa seçimi
  const handleTableSelect = (tableId: string) => {
    setSelectedTableIds((prev) =>
      prev.includes(tableId)
        ? prev.filter((id) => id !== tableId)
        : [...prev, tableId]
    );
  };

  // Masaları birleştir
  const handleMergeTables = async () => {
    if (selectedTableIds.length < 2) {
      alert("En az iki masa seçmelisiniz!");
      return;
    }
    setLoading(true);
    const newGroupId = uuidv4();
    const { error } = await supabase
      .from("tables")
      .update({ group_id: newGroupId })
      .in("id", selectedTableIds);
    setLoading(false);
    if (error) {
      alert("Birleştirme hatası: " + error.message);
    } else {
      setSelectedTableIds([]);
      fetchTables();
      onMerged && onMerged();
    }
  };

  return (
    <div>
      <h2>Masa Seç ve Birleştir</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {tables.map((table) => (
          <button
            key={table.id}
            onClick={() => handleTableSelect(table.id)}
            style={{
              background: selectedTableIds.includes(table.id) ? "#aaf" : "#fff",
              border: "1px solid #888",
              padding: 10,
              minWidth: 60,
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Masa {table.table_number}
            <br />
            <small>
              Grup: {table.group_id === table.id ? "Tek" : "Birleşik"}
            </small>
          </button>
        ))}
      </div>
      <button
        onClick={handleMergeTables}
        disabled={loading || selectedTableIds.length < 2}
        style={{ marginTop: 16, padding: "8px 24px" }}
      >
        {loading ? "Birleştiriliyor..." : "Masaları Birleştir"}
      </button>
    </div>
  );
} 