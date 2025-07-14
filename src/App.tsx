import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ProductManagement from './components/ProductManagement';
import WaiterManagement from './components/WaiterManagement';
import OrderTracking from './components/OrderTracking';
import BillManagement from './components/BillManagement';
import RevenueReport from './components/RevenueReport';
import Notification from './components/Notification';
import { supabase, handleApiError, logDebug } from './utils/supabase';
import { generateReceipt } from './utils/pdfGenerator';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url: string;
  category_id?: string;
  is_active: boolean;
  created_at: string;
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

interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
}

interface NotificationState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

export default function App() {
  const [currentView, setCurrentView] = useState('products');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Product states
  const [products, setProducts] = useState<Product[]>([]);
  const [productLoading, setProductLoading] = useState(false);
  
  // Stock states
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [stockLoading, setStockLoading] = useState(false);
  
  // Order states
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  
  // Bill states
  const [bills, setBills] = useState<Bill[]>([]);
  const [billsLoading, setBillsLoading] = useState(false);
  
  // Revenue states
  const [dailyRevenue, setDailyRevenue] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [revenueLoading, setRevenueLoading] = useState(false);
  
  // Waiter states
  const [waiterLoading, setWaiterLoading] = useState(false);
  
  // Notification state
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: '',
    severity: 'success'
  });

  const showNotification = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setNotification({ open: true, message, severity });
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  // Fetch functions
  const fetchProducts = async () => {
    setProductLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setProducts(data || []);
      logDebug('Fetched Products:', data);
    } catch (error) {
      handleApiError(error, setNotification, 'Ürünler çekilemedi');
    } finally {
      setProductLoading(false);
    }
  };

  const fetchStockItems = async () => {
    setStockLoading(true);
    try {
      // First get stock items
      const { data: stockData, error: stockError } = await supabase
        .from('stock_items')
        .select('*')
        .order('last_updated', { ascending: false });
      
      if (stockError) throw stockError;

      // Then get products separately and merge
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, price');
      
      if (productsError) throw productsError;

      // Merge the data
      const mergedData = (stockData || []).map(stock => {
        const product = (productsData || []).find(p => p.id === stock.product_id);
        return {
          ...stock,
          products: product ? { name: product.name, price: product.price } : undefined
        };
      });

      setStockItems(mergedData);
      logDebug('Fetched Stock Items:', mergedData);
    } catch (error) {
      handleApiError(error, setNotification, 'Stok bilgileri çekilemedi');
    } finally {
      setStockLoading(false);
    }
  };

  const fetchOrders = async () => {
    logDebug('fetchOrders çağrıldı', new Date().toLocaleTimeString());
    setOrdersLoading(true);
    try {
      // Get orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*, waiters(id, first_name, last_name)')
        .order('created_at', { ascending: false });
      
      if (ordersError) throw ordersError;

      // Get tables
      const { data: tablesData, error: tablesError } = await supabase
        .from('tables')
        .select('*');
      
      if (tablesError) throw tablesError;

      // Get order items
      const { data: orderItemsData, error: orderItemsError } = await supabase
        .from('order_items')
        .select('*');
      
      if (orderItemsError) throw orderItemsError;

      // Get products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, price');
      
      if (productsError) throw productsError;

      // Merge all data
      const mergedOrders = (ordersData || []).map(order => {
        const table = (tablesData || []).find(t => t.id === order.table_id);
        const orderItems = (orderItemsData || []).filter(item => item.order_id === order.id);
        
        const itemsWithProducts = orderItems.map(item => {
          const product = (productsData || []).find(p => p.id === item.product_id);
          return {
            ...item,
            products: product ? { name: product.name, price: product.price } : undefined
          };
        });

        return {
          ...order,
          tables: table ? { table_number: table.table_number, name: table.name } : undefined,
          order_items: itemsWithProducts
        };
      });

      setOrders(mergedOrders);
      logDebug('Fetched Orders:', mergedOrders);
    } catch (error) {
      handleApiError(error, setNotification, 'Siparişler çekilemedi');
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchBills = async () => {
    logDebug('fetchBills çağrıldı', new Date().toLocaleTimeString());
    setBillsLoading(true);
    try {
      // Aktif masaları çek
      const { data: activeTables, error: tablesError } = await supabase
        .from('tables')
        .select('*')
        .not('name', 'is', null);
      if (tablesError) throw tablesError;

      // Tüm siparişleri çek
      const { data: allOrders, error: ordersError } = await supabase
        .from('orders')
        .select('*');
      if (ordersError) throw ordersError;

      // Tüm order_items
      const { data: allOrderItems, error: orderItemsError } = await supabase
        .from('order_items')
        .select('*');
      if (orderItemsError) throw orderItemsError;

      // Ürünler
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, price');
      if (productsError) throw productsError;

      // group_id bazlı masaları grupla
      const tablesByGroup: { [groupId: string]: any[] } = {};
      (activeTables || []).forEach(table => {
        if (!table.group_id) return;
        if (!tablesByGroup[table.group_id]) tablesByGroup[table.group_id] = [];
        tablesByGroup[table.group_id].push(table);
      });

      // Her group_id için tek bill oluştur
      const billsData = Object.entries(tablesByGroup).map(([groupId, tables]) => {
        // Bu gruptaki tüm masaların siparişlerini topla
        const groupOrders = (allOrders || []).filter(order => tables.some(t => t.id === order.table_id) && order.is_bill_requested === true && order.status !== 'completed');
        const ordersWithItems = groupOrders.map(order => {
          const orderItems = (allOrderItems || []).filter(item => item.order_id === order.id);
          const itemsWithProducts = orderItems.map(item => {
            const product = (productsData || []).find(p => p.id === item.product_id);
            return {
              product: product ? { name: product.name, price: product.price } : undefined,
              quantity: item.quantity,
              price: item.price
            };
          });
          return {
            id: order.id,
            status: order.status,
            created_at: order.created_at,
            note: order.note,
            items: itemsWithProducts
          };
        });
        const totalAmount = ordersWithItems.reduce((sum, order) => {
          return sum + order.items.reduce((orderSum, item) => orderSum + (item.price * item.quantity), 0);
        }, 0);
        // Birleşik masa numaralarını string olarak hazırla
        const tableNumbers = (tables as any[]).map(t => t.table_number).sort((a, b) => a - b).join('+');
        return {
          id: groupId,
          group_id: groupId,
          table_ids: (tables as any[]).map(t => t.id),
          table_numbers: tableNumbers,
          total_amount: totalAmount,
          is_closed: false,
          tables: { table_number: tableNumbers, name: undefined },
          orders: ordersWithItems
        };
      }).filter(bill => bill.orders.length > 0);

      setBills(billsData);
      logDebug('Fetched Bills:', billsData);
    } catch (error) {
      handleApiError(error, setNotification, 'Hesaplar çekilemedi');
    } finally {
      setBillsLoading(false);
    }
  };

  const fetchRevenueReport = async () => {
    logDebug('fetchRevenueReport çağrıldı', new Date().toLocaleTimeString());
    setRevenueLoading(true);
    try {
      // Today's revenue
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const { data: todayOrders, error: todayError } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'completed')
        .gte('created_at', startOfDay.toISOString())
        .lt('created_at', endOfDay.toISOString());

      if (todayError) throw todayError;

      // Get order items for today's orders
      const todayOrderIds = (todayOrders || []).map(order => order.id);
      const { data: todayOrderItems, error: todayItemsError } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', todayOrderIds);

      if (todayItemsError) throw todayItemsError;

      const todayRevenue = (todayOrderItems || []).reduce((sum, item) => {
        return sum + (item.price * item.quantity);
      }, 0);

      setDailyRevenue(todayRevenue);

      // This month's revenue
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

      const { data: monthOrders, error: monthError } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'completed')
        .gte('created_at', startOfMonth.toISOString())
        .lt('created_at', endOfMonth.toISOString());

      if (monthError) throw monthError;

      // Get order items for this month's orders
      const monthOrderIds = (monthOrders || []).map(order => order.id);
      const { data: monthOrderItems, error: monthItemsError } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', monthOrderIds);

      if (monthItemsError) throw monthItemsError;

      // Get products for top products calculation
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, price');
      
      if (productsError) throw productsError;

      const monthRevenue = (monthOrderItems || []).reduce((sum, item) => {
        return sum + (item.price * item.quantity);
      }, 0);

      setMonthlyRevenue(monthRevenue);

      // Top selling products
      const productSales: { [key: string]: { name: string; quantity: number; revenue: number } } = {};
      (monthOrderItems || []).forEach((item) => {
        const product = (productsData || []).find(p => p.id === item.product_id);
        const productName = product?.name || 'Bilinmeyen Ürün';
        if (!productSales[productName]) {
          productSales[productName] = { name: productName, quantity: 0, revenue: 0 };
        }
        productSales[productName].quantity += item.quantity;
        productSales[productName].revenue += (item.price * item.quantity);
      });

      const topProductsList = Object.values(productSales)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      setTopProducts(topProductsList);

    } catch (error) {
      handleApiError(error, setNotification, 'Gelir raporu çekilemedi');
    } finally {
      setRevenueLoading(false);
    }
  };

  // Action handlers
  const handleAddProduct = async (name: string, price: string, imageUrl: string) => {
    if (!name || !price) {
      showNotification('Ürün adı ve fiyat alanları zorunludur!', 'warning');
      return;
    }

    // Use default image if no URL provided
    const finalImageUrl = imageUrl.trim() || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?w=400&h=300&fit=crop';
    
    setProductLoading(true);
    try {
      const { error: insertError } = await supabase
        .from('products')
        .insert([{
          name,
          price: parseFloat(price),
          image_url: finalImageUrl
        }]);
      
      if (insertError) throw insertError;
      
      showNotification('Ürün başarıyla eklendi!', 'success');
      fetchProducts();
    } catch (error) {
      handleApiError(error, setNotification, 'Ürün eklenemedi');
    } finally {
      setProductLoading(false);
    }
  };

  const handleUpdateProduct = async (product: Product, name: string, price: string, imageUrl: string) => {
    if (!name || !price) {
      showNotification('Ürün adı ve fiyat alanları zorunludur!', 'warning');
      return;
    }
    
    setProductLoading(true);
    try {
      const finalImageUrl = imageUrl.trim() || product.image_url;

      const { error: updateError } = await supabase
        .from('products')
        .update({
          name,
          price: parseFloat(price),
          image_url: finalImageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', product.id);

      if (updateError) throw updateError;

      showNotification('Ürün başarıyla güncellendi!', 'success');
      fetchProducts();
    } catch (error) {
      handleApiError(error, setNotification, 'Ürün güncellenemedi');
    } finally {
      setProductLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Bu ürünü silmek istediğinizden emin misiniz?')) return;
    setProductLoading(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', productId);
      if (error) throw error;
      // İlişkili stok kaydını da pasif yap
      await supabase
        .from('stock_items')
        .update({ current_stock: 0, min_stock: 0, max_stock: 0, unit: 'pasif', last_updated: new Date().toISOString() })
        .eq('product_id', productId);
      showNotification('Ürün ve ilişkili stok kaydı başarıyla pasif yapıldı!', 'success');
      fetchProducts();
    } catch (error) {
      handleApiError(error, setNotification, 'Ürün silinemedi');
    } finally {
      setProductLoading(false);
    }
  };

  const handleUpdateStock = async (stockItem: StockItem, newStock: number) => {
    try {
      const { error } = await supabase
        .from('stock_items')
        .update({
          current_stock: newStock,
          last_updated: new Date().toISOString()
        })
        .eq('id', stockItem.id);
      
      if (error) throw error;
      
      showNotification('Stok başarıyla güncellendi!', 'success');
      fetchStockItems();
    } catch (error) {
      handleApiError(error, setNotification, 'Stok güncellenemedi');
    }
  };

  const handleAddWaiter = async (email: string, password: string, firstName: string, lastName: string) => {
    if (!email || !password || !firstName || !lastName) {
      showNotification('Tüm alanları doldurun!', 'warning');
      return;
    }
    
    setWaiterLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password
      });
      
      if (authError) throw authError;

      const { error: waiterError } = await supabase
        .from('waiters')
        .insert([{
          auth_user_id: authData.user?.id,
          first_name: firstName,
          last_name: lastName
        }]);
      
      if (waiterError) throw waiterError;

      showNotification('Garson başarıyla oluşturuldu!', 'success');
    } catch (error) {
      handleApiError(error, setNotification, 'Garson oluşturulamadı');
    } finally {
      setWaiterLoading(false);
    }
  };

  const handleAddOrderNote = async (orderId: string, note: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          note,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
      
      if (error) throw error;
      
      showNotification('Sipariş notu eklendi!', 'success');
      fetchOrders();
    } catch (error) {
      handleApiError(error, setNotification, 'Not eklenemedi');
    }
  };

  const handleCloseBill = async (tableId: string) => {
    try {
      // Önce ilgili masanın aktif siparişlerini çek
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id')
        .eq('table_id', tableId)
        .in('status', ['pending', 'preparing', 'ready']);
      if (ordersError) throw ordersError;
      // Her sipariş için order_items'ı çekip stokları geri ekle
      for (const order of orders || []) {
        const { data: orderItems, error: orderItemsError } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', order.id);
        if (orderItemsError) throw orderItemsError;
        for (const item of orderItems || []) {
          const stockItem = stockItems.find(s => s.product_id === item.product_id);
          if (stockItem) {
            const newStock = stockItem.current_stock + item.quantity;
            await supabase
              .from('stock_items')
              .update({ current_stock: newStock, last_updated: new Date().toISOString() })
              .eq('id', stockItem.id);
          }
        }
      }
      // Sonra siparişleri kapat
      const { error: orderError } = await supabase
        .from('orders')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('table_id', tableId)
        .in('status', ['pending', 'preparing', 'ready']);
      if (orderError) throw orderError;
      const { error: tableError } = await supabase
        .from('tables')
        .update({ name: null })
        .eq('id', tableId);
      if (tableError) throw tableError;
      showNotification('Hesap başarıyla kapatıldı ve stoklar geri eklendi!', 'success');
      fetchBills();
      fetchOrders();
      fetchRevenueReport();
    } catch (error) {
      handleApiError(error, setNotification, 'Hesap kapatılamadı');
    }
  };

  const handleDeleteBill = async (tableId: string) => {
    try {
      const { error: tableError } = await supabase
        .from('tables')
        .update({ name: null })
        .eq('id', tableId);
      
      if (tableError) throw tableError;
      
      showNotification('Hesap silindi. Siparişler ve gelir raporları korunuyor.', 'success');
      fetchBills();
      fetchOrders();
      fetchRevenueReport();
    } catch (error) {
      handleApiError(error, setNotification, 'Hesap silinemedi');
    }
  };

  // Yeni sipariş ve otomatik stok düşme fonksiyonu
  const handleAddOrder = async (orderData: {
    table_id: string;
    waiter_id?: string;
    note?: string;
    order_items: Array<{ product_id: string; quantity: number; price: number; }>;
  }) => {
    try {
      // Mevcut garsonları kontrol et
      const { data: waiters, error: waitersError } = await supabase
        .from('waiters')
        .select('id, first_name, last_name')
        .limit(1);
      
      if (waitersError || !waiters || waiters.length === 0) {
        showNotification('Hiç garson bulunamadı! Önce garson ekleyin.', 'error');
        return;
      }

      const waiterId = waiters[0].id;
      console.log('Kullanılan garson ID:', waiterId, 'Garson:', waiters[0].first_name, waiters[0].last_name);

      // Stok kontrolü
      for (const item of orderData.order_items) {
        const stockItem = stockItems.find(s => s.product_id === item.product_id);
        if (!stockItem || stockItem.current_stock < item.quantity) {
          showNotification(`${stockItem?.products?.name || 'Ürün'} için yeterli stok yok! (Stok: ${stockItem?.current_stock || 0})`, 'error');
          return;
        }
      }
      // 1. Siparişi ekle
      const { data: orderInsertData, error: orderInsertError } = await supabase
        .from('orders')
        .insert([{
          table_id: orderData.table_id,
          waiter_id: waiterId, // Dinamik garson ID'si
          note: orderData.note || '',
          status: 'pending',
          total_amount: orderData.order_items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          created_at: new Date().toISOString(),
        }])
        .select();
      if (orderInsertError) throw orderInsertError;
      const orderId = orderInsertData[0].id;

      // 2. Sipariş kalemlerini ekle
      const orderItemsToInsert = orderData.order_items.map(item => ({
        order_id: orderId,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
      }));
      const { error: orderItemsError } = await supabase
        .from('order_items')
        .insert(orderItemsToInsert);
      if (orderItemsError) throw orderItemsError;

      // 3. Stokları güncelle (stoktan düş)
      for (const item of orderData.order_items) {
        // İlgili stok kaydını bul
        const stockItem = stockItems.find(s => s.product_id === item.product_id);
        if (stockItem) {
          const newStock = Math.max(0, stockItem.current_stock - item.quantity);
          await supabase
            .from('stock_items')
            .update({ current_stock: newStock, last_updated: new Date().toISOString() })
            .eq('id', stockItem.id);
        }
      }

      showNotification('Sipariş başarıyla eklendi ve stoklar güncellendi!', 'success');
      fetchOrders();
      fetchStockItems();
    } catch (error) {
      handleApiError(error, setNotification, 'Sipariş eklenemedi veya stok güncellenemedi');
    }
  };

  // Initial data fetch and polling
  useEffect(() => {
    fetchProducts();
    fetchStockItems();
    fetchOrders();
    fetchBills();
    fetchRevenueReport();

    // Polling for real-time updates (every 10 seconds)
    const interval = setInterval(() => {
      console.log('Polling tetiklendi', new Date().toLocaleTimeString());
      fetchOrders();
      fetchBills();
      fetchRevenueReport();
      fetchStockItems();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const renderCurrentView = () => {
    switch (currentView) {
      case 'products':
        return (
          <ProductManagement
            products={products}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            loading={productLoading}
          />
        );
      case 'waiters':
        return (
          <WaiterManagement
            onAddWaiter={handleAddWaiter}
            loading={waiterLoading}
          />
        );
      case 'orders':
        return (
          <OrderTracking
            orders={orders}
            stockItems={stockItems}
            loading={ordersLoading}
            stockLoading={stockLoading}
            onAddNote={handleAddOrderNote}
            onUpdateStock={handleUpdateStock}
            onCloseBill={handleCloseBill}
            onGenerateReceipt={generateReceipt}
          />
        );
      case 'bills':
        return (
          <BillManagement
            bills={bills}
            loading={billsLoading}
            onCloseBill={handleCloseBill}
            onDeleteBill={handleDeleteBill}
            onGenerateReceipt={generateReceipt}
          />
        );
      case 'reports':
        return (
          <RevenueReport
            dailyRevenue={dailyRevenue}
            monthlyRevenue={monthlyRevenue}
            topProducts={topProducts}
            loading={revenueLoading}
          />
        );
      default:
        return <div>Sayfa bulunamadı</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="flex h-screen">
        <Sidebar
          currentView={currentView}
          setCurrentView={setCurrentView}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        
        <div className="flex-1 lg:ml-72 flex flex-col h-full">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          
          <main className="flex-1 overflow-auto">
            <div className="h-full p-8">
              {renderCurrentView()}
            </div>
          </main>
        </div>
      </div>

      <Notification
        message={notification.message}
        type={notification.severity}
        isVisible={notification.open}
        onClose={closeNotification}
      />
    </div>
  );
}