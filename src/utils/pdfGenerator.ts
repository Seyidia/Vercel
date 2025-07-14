import jsPDF from 'jspdf';
import './DejaVuSans-normal.js';

interface Bill {
  id: string;
  table_id: string;
  total_amount: number;
  tables?: {
    table_number: number;
    name?: string;
  };
  orders: Array<{
    id: string;
    note?: string;
    items: Array<{
      products?: {
        name: string;
        price: number;
      };
      quantity: number;
      price: number;
    }>;
  }>;
}

export const generateReceipt = (bill: Bill) => {
  const doc = new jsPDF();
  
  // Restoran Bilgileri
  const restaurantName = 'GÖNÜL DAĞ ET & KAHVALTI';
  const address = 'Adres: Örnek Mahallesi, Örnek Sokak No:123';
  const phone = 'Tel: 0555 123 45 67';
  const taxNumber = 'Vergi No: 1234567890';
  const website = 'www.gonuldaget.com';
  
  // Header - Restoran Adı
  doc.setFontSize(18);
  doc.setFont('DejaVuSans', 'bold');
  doc.text(restaurantName, 105, 20, { align: 'center' });
  
  // Alt Başlık
  doc.setFontSize(12);
  doc.setFont('DejaVuSans', 'normal');
  doc.text('Et & Kahvaltı Restoranı', 105, 28, { align: 'center' });
  
  // İletişim Bilgileri
  doc.setFontSize(8);
  doc.setFont('DejaVuSans', 'normal');
  doc.text(address, 105, 38, { align: 'center' });
  doc.text(phone, 105, 44, { align: 'center' });
  doc.text(taxNumber, 105, 50, { align: 'center' });
  doc.text(website, 105, 56, { align: 'center' });
  
  // Ayırıcı çizgi
  doc.line(20, 62, 190, 62);
  
  // Fiş Başlığı
  doc.setFontSize(14);
  doc.setFont('DejaVuSans', 'bold');
  doc.text('🍽️ FİŞ', 105, 72, { align: 'center' });
  
  // Tarih ve saat
  doc.setFontSize(10);
  doc.setFont('DejaVuSans', 'normal');
  doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 20, 82);
  doc.text(`Saat: ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`, 20, 88);
  doc.text(`Masa: ${bill.tables?.name || `Masa ${bill.tables?.table_number}`}`, 20, 94);
  doc.text(`Fiş No: ${bill.id.slice(0, 8)}`, 20, 100);
  
  // Ayırıcı çizgi
  doc.line(20, 106, 190, 106);
  
  // Sipariş detayları başlığı
  let yPosition = 116;
  doc.setFontSize(12);
  doc.setFont('DejaVuSans', 'bold');
  doc.text('SİPARİŞ DETAYLARI', 20, yPosition);
  yPosition += 8;
  
  // Ürün başlıkları
  doc.setFontSize(9);
  doc.setFont('DejaVuSans', 'bold');
  doc.text('Ürün', 25, yPosition);
  doc.text('Adet', 120, yPosition);
  doc.text('Fiyat', 150, yPosition);
  doc.text('Toplam', 170, yPosition);
  yPosition += 5;
  
  // Ayırıcı çizgi
  doc.line(20, yPosition, 190, yPosition);
  yPosition += 8;
  
  doc.setFontSize(9);
  doc.setFont('DejaVuSans', 'normal');
  
  bill.orders.forEach(order => {
    // Sipariş notu varsa göster
    if (order.note) {
      doc.setFont('DejaVuSans', 'bold');
      doc.setFontSize(8);
      doc.text(`📝 Not: ${order.note}`, 25, yPosition);
      yPosition += 5;
    }
    
    // Ürünleri listele
    order.items.forEach(item => {
      const productName = item.products?.name || 'Bilinmeyen Ürün';
      const quantity = item.quantity;
      const unitPrice = item.price;
      const totalPrice = item.price * item.quantity;
      
      // Ürün adı (uzunsa kısalt)
      let displayName = productName;
      if (productName.length > 20) {
        displayName = productName.substring(0, 17) + '...';
      }
      
      doc.setFont('DejaVuSans', 'normal');
      doc.text(displayName, 25, yPosition);
      doc.text(quantity.toString(), 120, yPosition);
      doc.text(unitPrice.toFixed(2), 150, yPosition);
      doc.text(totalPrice.toFixed(2), 170, yPosition);
      yPosition += 5;
      
      // Sayfa kontrolü
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
    });
    
    yPosition += 3;
  });
  
  // Ayırıcı çizgi
  doc.line(20, yPosition, 190, yPosition);
  yPosition += 8;
  
  // Toplam
  doc.setFontSize(12);
  doc.setFont('DejaVuSans', 'bold');
  doc.text('TOPLAM:', 150, yPosition);
  doc.text(`${bill.total_amount.toFixed(2)} ₺`, 170, yPosition);
  
  // KDV bilgisi
  yPosition += 8;
  doc.setFontSize(8);
  doc.setFont('DejaVuSans', 'normal');
  const kdvAmount = bill.total_amount * 0.18; // %18 KDV
  doc.text(`KDV (%18):`, 150, yPosition);
  doc.text(`${kdvAmount.toFixed(2)} ₺`, 170, yPosition);
  
  // Genel toplam
  yPosition += 6;
  doc.setFontSize(10);
  doc.setFont('DejaVuSans', 'bold');
  doc.text('GENEL TOPLAM:', 150, yPosition);
  doc.text(`${bill.total_amount.toFixed(2)} ₺`, 170, yPosition);
  
  // Alt bilgiler
  yPosition += 20;
  doc.setFontSize(8);
  doc.setFont('DejaVuSans', 'normal');
  doc.text('💳 Kredi Kartı ile ödeme kabul edilir', 105, yPosition, { align: 'center' });
  yPosition += 5;
  doc.text('📱 Online sipariş: www.gonuldaget.com', 105, yPosition, { align: 'center' });
  yPosition += 5;
  doc.text('🕒 Açık: 07:00 - 23:00', 105, yPosition, { align: 'center' });
  
  // Teşekkür mesajı
  yPosition += 10;
  doc.setFontSize(10);
  doc.setFont('DejaVuSans', 'bold');
  doc.text('🍖 Teşekkür ederiz!', 105, yPosition, { align: 'center' });
  yPosition += 5;
  doc.text('Afiyet olsun!', 105, yPosition, { align: 'center' });
  yPosition += 5;
  doc.text('Tekrar bekleriz!', 105, yPosition, { align: 'center' });
  
  // Alt çizgi
  yPosition += 8;
  doc.line(20, yPosition, 190, yPosition);
  
  // Fiş numarası ve tarih
  yPosition += 5;
  doc.setFontSize(7);
  doc.setFont('DejaVuSans', 'normal');
  doc.text(`Fiş No: ${bill.id}`, 20, yPosition);
  doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR')}`, 105, yPosition, { align: 'center' });
  
  // PDF'i indir
  const fileName = `gonul-dag-et-fiş-${bill.tables?.table_number || 'masa'}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};