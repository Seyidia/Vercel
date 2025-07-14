import React, { useState } from 'react';
import { Receipt, Trash2, FileText, Loader, X } from 'lucide-react';
import { supabase } from '../utils/supabase';

interface Bill {
  id: string;
  group_id: string;
  table_ids: string[];
  table_numbers: string;
  total_amount: number;
  is_closed: boolean;
  tables?: {
    table_number: string;
    name?: string;
  };
  orders: Array<{
    id: string;
    status: string;
    created_at: string;
    note?: string;
    items: Array<{
      product?: {
        name: string;
        price: number;
      };
      quantity: number;
      price: number;
    }>;
  }>;
}

interface BillManagementProps {
  bills: Bill[];
  loading: boolean;
  onCloseBill: (groupId: string) => Promise<void>;
  onDeleteBill: (groupId: string) => Promise<void>;
  onGenerateReceipt: (bill: Bill) => void;
}

export default function BillManagement({ 
  bills, 
  loading, 
  onCloseBill, 
  onDeleteBill, 
  onGenerateReceipt 
}: BillManagementProps) {
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editAmount, setEditAmount] = useState<string>("");
  const [editLoading, setEditLoading] = useState(false);
  const [mergedTableNames, setMergedTableNames] = useState<{[groupId: string]: string}>({});

  // bills'i group_id'ye göre tekilleştir
  const uniqueBills = bills
    ? Object.values(
        bills.reduce((acc: {[groupId: string]: Bill}, bill) => {
          acc[(bill as any).group_id] = acc[(bill as any).group_id] || bill;
          return acc;
        }, {})
      )
    : [];

  // Masa adı: group_id'ye ait tüm masaların numaralarını birleştir
  async function fetchMergedTableName(groupId: string) {
    if (mergedTableNames[groupId]) return mergedTableNames[groupId];
    const { data: tables } = await supabase
      .from('tables')
      .select('table_number')
      .eq('group_id', groupId);
    const name = tables ? tables.map((t: any) => t.table_number).join('+') : '';
    setMergedTableNames(prev => ({ ...prev, [groupId]: name }));
    return name;
  }

  const handleDeleteAll = () => {
    if (window.confirm(`Tüm hesapları (${uniqueBills.length} adet) tamamen silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz!`)) {
      uniqueBills.forEach((bill: any) => onDeleteBill(bill.group_id));
    }
  };

  const openBillDetails = (bill: Bill) => {
    setSelectedBill(bill);
    setEditAmount(bill.total_amount.toFixed(2));
    setShowModal(true);
  };

  const closeBillDetails = () => {
    setSelectedBill(null);
    setShowModal(false);
    setEditAmount("");
  };

  // Tutarı güncelle
  const handleEditAmount = async () => {
    if (!selectedBill) return;
    setEditLoading(true);
    const newAmount = parseFloat(editAmount.replace(',', '.'));
    if (isNaN(newAmount)) {
      alert('Geçerli bir tutar girin!');
      setEditLoading(false);
      return;
    }
    // group_id ile güncelle
    await supabase
      .from('bills')
      .update({ total_amount: newAmount })
      .eq('group_id', (selectedBill as any).group_id)
      .eq('is_closed', false);
    setEditLoading(false);
    // Modalı kapat ve parent componentten refresh bekle
    closeBillDetails();
    window.location.reload(); // refresh için (isteğe bağlı, daha iyi state yönetimi için parent'ta fetch yapılabilir)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Receipt className="text-teal-600" size={28} />
          <h2 className="text-2xl font-bold text-gray-800">Hesap Yönetimi</h2>
          <span className="bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm font-medium">
            {uniqueBills.length} hesap
          </span>
        </div>
        {uniqueBills.length > 0 && (
          <button
            onClick={handleDeleteAll}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
          >
            <Trash2 size={16} />
            <span>Tümünü Sil ({uniqueBills.length})</span>
          </button>
        )}
      </div>

      {/* Warning */}
      {uniqueBills.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-red-700">
            <span>⚠️</span>
            <span className="font-medium">
              Dikkat: Hesap silme işlemi tüm siparişleri ve hesapları kalıcı olarak silecektir!
            </span>
          </div>
        </div>
      )}

      {/* Bills Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader className="animate-spin text-teal-600" size={32} />
        </div>
      ) : uniqueBills.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Receipt size={48} className="mx-auto" />
          </div>
          <p className="text-gray-500 text-lg">Henüz hiç hesap yok.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {uniqueBills.map((bill: any) => (
            <div
              key={bill.id}
              className={`
                relative bg-white rounded-xl shadow-lg p-6 border-2 cursor-pointer
                transition-all duration-200 hover:shadow-xl hover:-translate-y-1
                ${bill.is_closed 
                  ? 'border-green-300 bg-green-50' 
                  : 'border-teal-300 hover:border-teal-400'
                }
              `}
              onClick={() => openBillDetails(bill)}
            >
              {/* Quick Delete Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`"${bill.tables?.name || `Masa ${bill.tables?.table_number}`}" hesabını silmek istediğinizden emin misiniz?`)) {
                    onDeleteBill(bill.group_id);
                  }
                }}
                className="absolute top-3 right-3 w-8 h-8 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors flex items-center justify-center"
              >
                <Trash2 size={14} />
              </button>

              {/* Bill Content */}
              <div className="text-center">
                <div className="text-3xl mb-2">
                  {bill.is_closed ? '✅' : '🍽️'}
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">
                  {/* Birleşik masa adı */}
                  <AsyncMergedTableName groupId={bill.group_id} fetchMergedTableName={fetchMergedTableName} />
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Grup ID: {bill.group_id}
                </p>
                {bill.is_closed && (
                  <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    Kapatıldı
                  </span>
                )}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-2xl font-bold text-teal-600">
                    {bill.total_amount.toFixed(2)} ₺
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bill Details Modal */}
      {showModal && selectedBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <h3 className="text-xl font-bold text-gray-800">
                  <AsyncMergedTableName groupId={(selectedBill as any).group_id} fetchMergedTableName={fetchMergedTableName} />
                </h3>
                {selectedBill.is_closed && (
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    Kapatıldı
                  </span>
                )}
              </div>
              <button
                onClick={closeBillDetails}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Tutarı düzenle alanı */}
              {!selectedBill.is_closed && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Toplam Tutarı Düzenle</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editAmount}
                      onChange={e => setEditAmount(e.target.value)}
                      className="border rounded px-2 py-1 w-32"
                    />
                    <button
                      onClick={handleEditAmount}
                      disabled={editLoading}
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {editLoading ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                  </div>
                </div>
              )}
              {selectedBill.orders.length > 0 ? (
                <div className="space-y-4">
                  {selectedBill.orders.map((order) => (
                    <div
                      key={order.id}
                      className={`
                        p-4 rounded-lg border
                        ${order.status === 'completed' 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-gray-50 border-gray-200'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-800">
                          Sipariş #{order.id}
                        </span>
                        <span className="text-sm text-gray-600">
                          {new Date(order.created_at).toLocaleTimeString('tr-TR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      {order.note && (
                        <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
                          <span className="text-red-700 font-medium">📝 Not: </span>
                          <span className="text-red-600">{order.note}</span>
                        </div>
                      )}
                      <div className="space-y-1">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{item.product?.name} x{item.quantity}</span>
                            <span className="font-medium">
                              {(item.price * item.quantity).toFixed(2)} ₺
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Bu masada sipariş yok.</p>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap gap-3 p-6 border-t border-gray-200">
              {!selectedBill.is_closed && (
                <button
                  onClick={() => {
                    onCloseBill(selectedBill.group_id);
                    closeBillDetails();
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Hesabı Kapat
                </button>
              )}
              <button
                onClick={() => onGenerateReceipt(selectedBill)}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <FileText size={16} className="inline mr-2" />
                Fiş Yazdır
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// AsyncMergedTableName: group_id'ye göre masa adını async olarak gösteren yardımcı component
function AsyncMergedTableName({ groupId, fetchMergedTableName }: { groupId: string, fetchMergedTableName: (groupId: string) => Promise<string> }) {
  const [name, setName] = React.useState<string>("");
  React.useEffect(() => {
    fetchMergedTableName(groupId).then(setName);
  }, [groupId]);
  return <>{name ? `Masa ${name}` : '...'}</>;
}