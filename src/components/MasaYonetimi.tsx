import React, { useState } from "react";
import MasaSecBirleştir from "./MasaSecBirleştir";
import BirlesikMasaSiparisListesi from "./BirlesikMasaSiparisListesi";

export default function MasaYonetimi() {
  const [selectedTableId, setSelectedTableId] = useState<string>("");

  return (
    <div>
      <MasaSecBirleştir onMerged={() => setSelectedTableId("")} />
      <hr />
      <h3>Birleşik Masanın Siparişleri</h3>
      <input
        placeholder="Bir masa ID girin"
        value={selectedTableId}
        onChange={e => setSelectedTableId(e.target.value)}
        style={{ marginBottom: 8 }}
      />
      <BirlesikMasaSiparisListesi selectedTableId={selectedTableId} />
    </div>
  );
} 