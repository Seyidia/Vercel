import React, { useState } from 'react';
import { Plus, Edit, Trash2, Link, Loader, Search, Filter, Package } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
}

interface ProductManagementProps {
  products: Product[];
  onAddProduct: (name: string, price: string, imageUrl: string) => Promise<void>;
  onUpdateProduct: (product: Product, name: string, price: string, imageUrl: string) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  loading: boolean;
}

export default function ProductManagement({ 
  products, 
  onAddProduct, 
  onUpdateProduct, 
  onDeleteProduct, 
  loading 
}: ProductManagementProps) {
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productImageUrl, setProductImageUrl] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !productPrice) return;
    
    await onAddProduct(productName, productPrice, productImageUrl);
    setProductName('');
    setProductPrice('');
    setProductImageUrl('');
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setEditName(product.name);
    setEditPrice(product.price.toString());
    setEditImageUrl(product.image_url);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editName || !editPrice) return;
    
    await onUpdateProduct(editingProduct, editName, editPrice, editImageUrl);
    setEditingProduct(null);
    setEditName('');
    setEditPrice('');
    setEditImageUrl('');
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <Plus className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Ürün Yönetimi</h1>
            <p className="text-slate-600 mt-1">Ürünlerinizi ekleyin, düzenleyin ve yönetin</p>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2">
          <span className="text-blue-700 font-semibold">{products.length} Ürün</span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Add Product Form */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200/50 h-fit sticky top-8">
            <div className="flex items-center space-x-3 mb-8">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                <Plus className="text-white" size={20} />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Yeni Ürün Ekle</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Ürün Adı
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Ürün adını girin"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Fiyat (₺)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="0.00"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Ürün Görseli URL (Opsiyonel)
                </label>
                <div className="relative">
                  <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="url"
                    value={productImageUrl}
                    onChange={(e) => setProductImageUrl(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="https://example.com/image.jpg"
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Boş bırakırsanız varsayılan görsel kullanılacak
                </p>
              </div>
              
              <button
                type="submit"
                disabled={loading || !productName || !productPrice}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-semibold shadow-lg"
              >
                {loading ? <Loader className="animate-spin" size={20} /> : 'Ürün Ekle'}
              </button>
            </form>
          </div>
        </div>

        {/* Product List */}
        <div className="xl:col-span-2 flex flex-col h-full">
          {/* Search and Filter */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200/50 mb-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Ürün ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <button className="p-3 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors">
                <Filter size={20} className="text-slate-600" />
              </button>
            </div>
          </div>

          {/* Products Grid */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/50 flex-1 overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">Ürün Listesi</h2>
            </div>
            
            <div className="p-6 h-full overflow-auto">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader className="animate-spin text-blue-600" size={32} />
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-slate-400 mb-4">
                    <Package size={48} className="mx-auto" />
                  </div>
                  <p className="text-slate-500 text-lg">
                    {searchTerm ? 'Arama kriterinize uygun ürün bulunamadı.' : 'Henüz hiç ürün yok.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="group bg-slate-50 rounded-xl p-6 border border-slate-200 hover:shadow-lg hover:border-blue-300 transition-all duration-200">
                      <div className="flex items-center space-x-4">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-20 h-20 object-cover rounded-xl border-2 border-slate-200 group-hover:border-blue-300 transition-all"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?w=400&h=300&fit=crop';
                          }}
                        />
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-800 text-lg mb-1">{product.name}</h3>
                          <p className="text-blue-600 font-bold text-xl">{product.price.toFixed(2)} ₺</p>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => onDeleteProduct(product.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-6 text-slate-800">Ürünü Düzenle</h3>
            <form onSubmit={handleUpdate} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Ürün Adı
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Fiyat (₺)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Görsel URL
                </label>
                <div className="relative">
                  <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="url"
                    value={editImageUrl}
                    onChange={(e) => setEditImageUrl(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
              
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 px-6 py-3 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors font-semibold"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold"
                >
                  Güncelle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}