import React, { useState } from 'react';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Edit3, 
  Loader, 
  Package, 
  TrendingDown, 
  TrendingUp,
  Receipt,
  X,
  FileText,
  DollarSign,
  Trash2
} from 'lucide-react';
import { supabase } from '../utils/supabase';

// Push notification gönderme fonksiyonu
const sendPushNotification = async (order: Order) => {
  try {
    // Dinamik garson ID'si - siparişteki waiter_id'yi kullan
    const waiterId = order.waiter_id;
    
    if (!waiterId) {
      console.log('Siparişte garson ID bulunamadı');
      return;
    }

    const { data: waiterData, error: waiterError } = await supabase
      .from('waiters')
      .select('id, push_token, first_name, last_name')
      .eq('id', waiterId)
      .single();
    
    if (waiterError || !waiterData?.push_token) {
      console.log('Garson push token bulunamadı:', waiterData?.first_name, waiterData?.last_name);
      return;
    }

    // Expo push notification gönder
    const message = {
      to: waiterData.push_token,
      sound: 'default',
      title: '🍽️ Sipariş Hazır!',
      body: `${order.tables?.name || `Masa ${order.tables?.table_number}`} siparişi hazır`,
      data: { 
        orderId: order.id,
        tableNumber: order.tables?.table_number,
        screen: 'orderList'
      },
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    console.log('Push notification sonucu:', result);
    
  } catch (error) {
    console.error('Push notification gönderme hatası:', error);
  }
};

interface Order {
  id: string;
  status: string;
  created_at: string;
  table_id: string;
  waiter_id?: string;
  note?: string;
  total_amount: number;
  tables?: {
    table_number: number;
    name?: string;
  };
  order_items?: Array<{
    id: string;
    product_id: string;
    quantity: number;
    price: number;
    products?: {
      name: string;
      price: number;
    };
  }>;
}

interface StockItem {
  id: string;
  product_id: string;
  current_stock: number;
  min_stock: number;
  max_stock: number;
  unit: string;
  last_updated: string;
  products?: {
    name: string;
    price: number;
  };
}

interface OrderTrackingProps {
  orders: Order[];
  stockItems: StockItem[];
  loading: boolean;
  stockLoading: boolean;
  onAddNote: (orderId: string, note: string) => Promise<void>;
  onUpdateStock: (stockItem: StockItem, newStock: number) => Promise<void>;
  onCloseBill: (tableId: string) => Promise<void>;
  onGenerateReceipt: (order: any) => void;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending':
      return <Clock className="text-orange-500" size={20} />;
    case 'preparing':
      return <AlertCircle className="text-teal-500" size={20} />;
    case 'ready':
      return <CheckCircle className="text-green-500" size={20} />;
    case 'completed':
      return <CheckCircle className="text-gray-500" size={20} />;
    default:
      return <Clock className="text-gray-500" size={20} />;
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'pending':
      return 'Bekliyor';
    case 'preparing':
      return 'Hazırlanıyor';
    case 'ready':
      return 'Hazır';
    case 'completed':
      return 'Tamamlandı';
    default:
      return status;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'preparing':
      return 'bg-teal-100 text-teal-800 border-teal-200';
    case 'ready':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'completed':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStockStatusColor = (item: StockItem) => {
  const percentage = (item.current_stock / item.max_stock) * 100;
  if (item.current_stock <= item.min_stock / 2) {
    return 'bg-red-100 border-red-300 text-red-800';
  } else if (item.current_stock <= item.min_stock) {
    return 'bg-yellow-100 border-yellow-300 text-yellow-800';
  } else {
    return 'bg-green-100 border-green-300 text-green-800';
  }
};

const getStockIcon = (item: StockItem) => {
  if (item.current_stock <= item.min_stock / 2) {
    return <TrendingDown className="text-red-500" size={16} />;
  } else if (item.current_stock <= item.min_stock) {
    return <AlertCircle className="text-yellow-500" size={16} />;
  } else {
    return <TrendingUp className="text-green-500" size={16} />;
  }
};

export default function OrderTracking({ 
  orders, 
  stockItems, 
  loading, 
  stockLoading, 
  onAddNote, 
  onUpdateStock, 
  onCloseBill, 
  onGenerateReceipt 
}: OrderTrackingProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'stock'>('orders');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [editingStock, setEditingStock] = useState<StockItem | null>(null);
  const [editAmount, setEditAmount] = useState<string>("");
  const [editLoading, setEditLoading] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [editedPrices, setEditedPrices] = useState<{[key: string]: number}>({});

  const handleAddNote = (orderId: string, currentNote?: string) => {
    const note = prompt('Sipariş notu ekleyin:', currentNote || '');
    if (note !== null) {
      onAddNote(orderId, note);
    }
  };

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setEditAmount(order.total_amount.toFixed(2));
    setShowOrderModal(true);
  };

  const closeOrderDetails = () => {
    setSelectedOrder(null);
    setShowOrderModal(false);
  };

  const calculateOrderTotal = (order: Order) => {
    return (order.order_items || []).reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  };

  const handleCloseBill = async (order: Order) => {
    if (window.confirm(`${order.tables?.name || `Masa ${order.tables?.table_number}`} hesabını kapatmak istediğinizden emin misiniz?`)) {
      await onCloseBill(order.table_id);
    }
  };

  const handleGenerateReceipt = (order: Order) => {
    // Fiş modalını aç ve fiyat düzenleme alanlarını hazırla
    setReceiptOrder(order);
    const initialPrices: {[key: string]: number} = {};
    (order.order_items || []).forEach(item => {
      initialPrices[item.id] = item.price;
    });
    setEditedPrices(initialPrices);
    setShowReceiptModal(true);
  };

  const handlePrintReceipt = () => {
    if (!receiptOrder) return;
    
    // Düzenlenmiş fiyatlarla fiş verisi oluştur
    const billData = {
      id: receiptOrder.id,
      table_id: receiptOrder.table_id,
      total_amount: (receiptOrder.order_items || []).reduce((sum, item) => {
        return sum + (editedPrices[item.id] || item.price) * item.quantity;
      }, 0),
      tables: receiptOrder.tables,
      orders: [{
        id: receiptOrder.id,
        note: receiptOrder.note,
        items: (receiptOrder.order_items || []).map(item => ({
          products: item.products,
          quantity: item.quantity,
          price: editedPrices[item.id] || item.price // Düzenlenmiş fiyatı kullan
        }))
      }]
    };
    
    onGenerateReceipt(billData);
    setShowReceiptModal(false);
    setReceiptOrder(null);
    setEditedPrices({});
  };

  const closeReceiptModal = () => {
    setShowReceiptModal(false);
    setReceiptOrder(null);
    setEditedPrices({});
  };

  const handleUpdateStock = async (item: StockItem, newStock: number) => {
    await onUpdateStock(item, newStock);
  };

  // Tutarı güncelleme fonksiyonu
  const handleEditAmount = async () => {
    if (!selectedOrder) return;
    const password = prompt('Fiyat güncelleme için parolayı girin:');
    if (password !== 'admin123') {
      alert('Parola yanlış!');
      return;
    }
    setEditLoading(true);
    const newAmount = parseFloat(editAmount.replace(',', '.'));
    if (isNaN(newAmount)) {
      alert('Geçerli bir tutar girin!');
      setEditLoading(false);
      return;
    }
    // Supabase'de güncelle
    await supabase
      .from('orders')
      .update({ total_amount: newAmount })
      .eq('id', selectedOrder.id);
    setEditLoading(false);
    // Ekranda güncelle
    setSelectedOrder({ ...selectedOrder, total_amount: newAmount });
    alert('Tutar güncellendi!');
  };

  // Masalara göre siparişleri grupla (group_id bazlı)
  const ordersByTable = orders.reduce((acc, order) => {
    // group_id varsa onu kullan, yoksa table_id kullan
    const tableKey = (order as any).group_id || order.table_id;
    if (!acc[tableKey]) {
      acc[tableKey] = [];
    }
    acc[tableKey].push(order);
    return acc;
  }, {} as Record<string, Order[]>);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-6 py-2 rounded-md font-medium transition-all ${
            activeTab === 'orders'
              ? 'bg-white text-teal-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Sipariş Takibi
        </button>
        <button
          onClick={() => setActiveTab('stock')}
          className={`px-6 py-2 rounded-md font-medium transition-all ${
            activeTab === 'stock'
              ? 'bg-white text-teal-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Stok Takibi
        </button>
      </div>

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div>
          {/* Test Bildirim Butonu */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">🧪 Test Bildirimi</h3>
            <p className="text-blue-600 mb-3">
              Mobil tarafa test bildirimi göndermek için aşağıdaki adımları takip edin:
            </p>
            <div className="text-blue-600 mb-3 text-sm">
              <p>1. Önce garson ekleyin (Garson Yönetimi → Yeni Garson)</p>
              <p>2. Mobil uygulamada garson hesabı ile giriş yapın</p>
              <p>3. Bildirim izinlerini verin</p>
              <p>4. Aşağıdaki butona tıklayın</p>
            </div>
            <button
              onClick={async () => {
                try {
                  // Test siparişi oluştur - mevcut garsonları kontrol et
                  const { data: waiters, error: waitersError } = await supabase
                    .from('waiters')
                    .select('id, first_name, last_name, push_token')
                    .limit(1);
                  
                  if (waitersError || !waiters || waiters.length === 0) {
                    alert('Hiç garson bulunamadı! Önce garson ekleyin.');
                    return;
                  }

                  const testWaiter = waiters[0];
                  
                  if (!testWaiter.push_token) {
                    alert(`Garson ${testWaiter.first_name} ${testWaiter.last_name} için push token bulunamadı. Mobil uygulamada giriş yapın.`);
                    return;
                  }

                  // Test siparişi oluştur
                  const testOrder: Order = {
                    id: 'test-123',
                    status: 'ready',
                    created_at: new Date().toISOString(),
                    table_id: 'test-table',
                    waiter_id: testWaiter.id,
                    total_amount: 0,
                    tables: { table_number: 5, name: 'Test Masa' }
                  };
                  
                  await sendPushNotification(testOrder);
                  alert(`Test bildirimi gönderildi! Garson: ${testWaiter.first_name} ${testWaiter.last_name}`);
                } catch (error: any) {
                  console.error('Test bildirimi hatası:', error);
                  alert('Test bildirimi gönderilemedi: ' + (error?.message || 'Bilinmeyen hata'));
                }
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
               Test Bildirimi Gönder
            </button>
          </div>

          {/* Orders List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader className="animate-spin text-teal-600" size={32} />
            </div>
          ) : Object.keys(ordersByTable).length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Clock size={48} className="mx-auto" />
              </div>
              <p className="text-gray-500 text-lg">Henüz hiç sipariş yok.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(ordersByTable).map(([tableId, tableOrders]) => {
                const latestOrder = tableOrders[0];
                const totalAmount = tableOrders.reduce((sum, order) => sum + calculateOrderTotal(order), 0);
                const hasActiveOrders = tableOrders.some(order => order.status !== 'completed');
                
                return (
                  <div
                    key={tableId}
                    className={`
                      relative bg-white rounded-xl shadow-lg p-6 border-2 cursor-pointer
                      transition-all duration-200 hover:shadow-xl hover:-translate-y-1
                      ${hasActiveOrders 
                        ? 'border-teal-300 hover:border-teal-400' 
                        : 'border-gray-300 bg-gray-50'
                      }
                    `}
                    onClick={() => openOrderDetails(latestOrder)}
                  >
                    {/* Table Header */}
                    <div className="text-center mb-4">
                      <div className="text-3xl mb-2">
                        {hasActiveOrders ? '🍽️' : '✅'}
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 mb-1">
                        {latestOrder.tables?.name || `Masa ${latestOrder.tables?.table_number}`}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {tableOrders.length} sipariş
                      </p>
                    </div>

                    {/* Status */}
                    <div className="flex justify-center mb-4">
                      <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(latestOrder.status)}`}>
                        {getStatusIcon(latestOrder.status)}
                        <span>{getStatusText(latestOrder.status)}</span>
                      </div>
                    </div>

                    {/* Total Amount */}
                    <div className="text-center mb-4 pt-4 border-t border-gray-200">
                      <p className="text-2xl font-bold text-teal-600">
                        {totalAmount.toFixed(2)} ₺
                      </p>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex space-x-2">
                      {hasActiveOrders && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCloseBill(latestOrder);
                          }}
                          className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                        >
                          Hesabı Kapat
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenerateReceipt(latestOrder);
                        }}
                        className="flex-1 border border-teal-300 text-teal-600 px-3 py-2 rounded-lg hover:bg-teal-50 transition-colors text-sm font-medium"
                      >
                        Fiş Çıkar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Stock Tab */}
      {activeTab === 'stock' && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center space-x-2 mb-6">
            <Package className="text-teal-600" size={24} />
            <h2 className="text-2xl font-bold text-gray-800">Stok Takibi</h2>
            <span className="bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm font-medium">
              {stockItems.length} ürün
            </span>
          </div>

          {/* Stock Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="text-green-500" size={20} />
                <span className="font-medium text-green-800">Normal Stok</span>
              </div>
              <p className="text-2xl font-bold text-green-600 mt-2">
                {stockItems.filter(item => item.current_stock > item.min_stock).length}
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="text-yellow-500" size={20} />
                <span className="font-medium text-yellow-800">Düşük Stok</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600 mt-2">
                {stockItems.filter(item => item.current_stock <= item.min_stock && item.current_stock > item.min_stock / 2).length}
              </p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <TrendingDown className="text-red-500" size={20} />
                <span className="font-medium text-red-800">Kritik Stok</span>
              </div>
              <p className="text-2xl font-bold text-red-600 mt-2">
                {stockItems.filter(item => item.current_stock <= item.min_stock / 2).length}
              </p>
            </div>
          </div>

          {/* Stock Items */}
          {stockLoading ? (
            <div className="flex justify-center py-12">
              <Loader className="animate-spin text-teal-600" size={32} />
            </div>
          ) : stockItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Package size={48} className="mx-auto" />
              </div>
              <p className="text-gray-500 text-lg">Henüz stok bilgisi yok.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stockItems.map((item) => (
                <div
                  key={item.id}
                  className={`border rounded-lg p-4 transition-shadow hover:shadow-md ${getStockStatusColor(item)}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-800">{item.products?.name || 'Bilinmeyen Ürün'}</h3>
                    <div className="flex items-center space-x-1">
                      {getStockIcon(item)}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Mevcut Stok:</span>
                      <span className="font-bold">{item.current_stock} {item.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Min. Stok:</span>
                      <span>{item.min_stock} {item.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max. Stok:</span>
                      <span>{item.max_stock} {item.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Birim Fiyat:</span>
                      <span className="font-bold text-teal-600">{item.products?.price?.toFixed(2) || '0.00'} ₺</span>
                    </div>
                  </div>

                  {/* Stock Progress Bar */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          item.current_stock <= item.min_stock / 2 ? 'bg-red-500' :
                          item.current_stock <= item.min_stock ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min((item.current_stock / item.max_stock) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Stock Actions */}
                  <div className="flex space-x-2 mt-3">
                    <button
                      onClick={() => handleUpdateStock(item, item.current_stock + 1)}
                      className="flex-1 bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 transition-colors"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => handleUpdateStock(item, Math.max(0, item.current_stock - 1))}
                      className="flex-1 bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 transition-colors"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => setEditingStock(item)}
                      className="flex-1 border border-teal-300 text-teal-600 px-2 py-1 rounded text-xs hover:bg-teal-50 transition-colors"
                    >
                      Düzenle
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <h3 className="text-xl font-bold text-gray-800">
                  {selectedOrder.tables?.name || `Masa ${selectedOrder.tables?.table_number}`}
                </h3>
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedOrder.status)}`}>
                  {getStatusIcon(selectedOrder.status)}
                  <span>{getStatusText(selectedOrder.status)}</span>
                </div>
              </div>
              <button
                onClick={closeOrderDetails}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="space-y-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-800">
                      Sipariş #{selectedOrder.id}
                    </span>
                    <span className="text-sm text-gray-600">
                      {new Date(selectedOrder.created_at).toLocaleString('tr-TR')}
                    </span>
                  </div>
                  
                  {selectedOrder.note && (
                    <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
                      <span className="text-red-700 font-medium">📝 Not: </span>
                      <span className="text-red-600">{selectedOrder.note}</span>
                    </div>
                  )}
                  
                  <div className="space-y-1">
                    {(selectedOrder.order_items || []).map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.products?.name} x{item.quantity}</span>
                        <span className="font-medium">
                          {(item.price * item.quantity).toFixed(2)} ₺
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <div className="flex justify-between font-bold">
                      <span>Toplam:</span>
                      <span className="text-teal-600">
                        {calculateOrderTotal(selectedOrder).toFixed(2)} ₺
                      </span>
                    </div>
                  </div>
                </div>
                {/* Tutarı güncelleme alanı */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Toplam Tutarı Düzenle (Parola Gerekli)</label>
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
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => handleAddNote(selectedOrder.id, selectedOrder.note)}
                className="border border-teal-300 text-teal-600 px-4 py-2 rounded-lg hover:bg-teal-50 transition-colors flex items-center space-x-2"
              >
                <Edit3 size={16} />
                <span>{selectedOrder.note ? 'Notu Düzenle' : 'Not Ekle'}</span>
              </button>
              
              <button
                onClick={() => {
                  handleGenerateReceipt(selectedOrder);
                  closeOrderDetails();
                }}
                className="border border-teal-300 text-teal-600 px-4 py-2 rounded-lg hover:bg-teal-50 transition-colors flex items-center space-x-2"
              >
                <FileText size={16} />
                <span>Fiş Çıkar</span>
              </button>
              
              {selectedOrder.status === 'preparing' && (
                <button
                  onClick={async () => {
                    try {
                      // Sipariş durumunu "ready" yap
                      await supabase
                        .from('orders')
                        .update({ status: 'ready' })
                        .eq('id', selectedOrder.id);
                      
                      // Mobil tarafa bildirim gönder
                      await sendPushNotification(selectedOrder);
                      
                      alert('Sipariş hazır olarak işaretlendi ve garsona bildirim gönderildi!');
                      closeOrderDetails();
                      // Siparişleri yenile
                      window.location.reload();
                    } catch (error) {
                      console.error('Hata:', error);
                      alert('Bir hata oluştu!');
                    }
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <CheckCircle size={16} />
                  <span>Hazır</span>
                </button>
              )}
              
              {selectedOrder.status !== 'completed' && (
                <button
                  onClick={() => {
                    handleCloseBill(selectedOrder);
                    closeOrderDetails();
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <Receipt size={16} />
                  <span>Hesabı Kapat</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stock Edit Modal */}
      {editingStock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Stok Düzenle: {editingStock.products?.name}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mevcut Stok
                </label>
                <input
                  type="number"
                  value={editingStock.current_stock}
                  onChange={(e) => setEditingStock({
                    ...editingStock,
                    current_stock: parseInt(e.target.value) || 0
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Stok
                </label>
                <input
                  type="number"
                  value={editingStock.min_stock}
                  onChange={(e) => setEditingStock({
                    ...editingStock,
                    min_stock: parseInt(e.target.value) || 0
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maksimum Stok
                </label>
                <input
                  type="number"
                  value={editingStock.max_stock}
                  onChange={(e) => setEditingStock({
                    ...editingStock,
                    max_stock: parseInt(e.target.value) || 0
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setEditingStock(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={() => {
                    handleUpdateStock(editingStock, editingStock.current_stock);
                    setEditingStock(null);
                  }}
                  className="flex-1 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fiş Düzenleme Modal */}
      {showReceiptModal && receiptOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">
                {receiptOrder.tables?.name || `Masa ${receiptOrder.tables?.table_number}`}
              </h3>
              <button
                onClick={closeReceiptModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-800">
                      Sipariş #{receiptOrder.id}
                    </span>
                    <span className="text-sm text-gray-600">
                      {new Date(receiptOrder.created_at).toLocaleString('tr-TR')}
                    </span>
                  </div>
                  
                  {receiptOrder.note && (
                    <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
                      <span className="text-red-700 font-medium">📝 Not: </span>
                      <span className="text-red-600">{receiptOrder.note}</span>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <div className="text-xs text-gray-600 mb-2">
                      💡 Ürün fiyatlarını düzenleyebilirsiniz. Değişiklikler sadece fiş çıktısında görünür.
                    </div>
                    {(receiptOrder.order_items || []).map((item, index) => (
                      <div key={item.id} className="flex items-center justify-between p-2 bg-white rounded border">
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">{item.products?.name}</div>
                          <div className="text-sm text-gray-600">Adet: {item.quantity}</div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <div className="text-xs text-gray-500">Birim Fiyat</div>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={editedPrices[item.id] || item.price}
                              onChange={(e) => setEditedPrices({
                                ...editedPrices,
                                [item.id]: parseFloat(e.target.value) || 0
                              })}
                              className="w-20 border rounded px-2 py-1 text-right text-sm"
                            />
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500">Toplam</div>
                            <div className="font-bold text-teal-600">
                              {((editedPrices[item.id] || item.price) * item.quantity).toFixed(2)} ₺
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <div className="flex justify-between font-bold">
                      <span>Toplam:</span>
                      <span className="text-teal-600">
                        {(receiptOrder.order_items || []).reduce((sum, item) => {
                          return sum + (editedPrices[item.id] || item.price) * item.quantity;
                        }, 0).toFixed(2)} ₺
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 p-6 border-t border-gray-200">
              <button
                onClick={closeReceiptModal}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handlePrintReceipt}
                className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors flex items-center space-x-2"
              >
                <Receipt size={16} />
                <span>Fişi Yazdır</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}