/*
  # Seed Initial Data

  1. Sample Data
    - Default categories
    - Sample tables (1-20)
    - Sample products with stock items

  2. Notes
    - This provides initial data for testing the application
    - Categories include common restaurant food types
    - Tables are numbered 1-20 for a typical restaurant setup
*/

-- Insert default categories
INSERT INTO categories (name, description) VALUES
  ('Ana Yemekler', 'Başlıca yemek çeşitleri'),
  ('Başlangıçlar', 'Meze ve başlangıç yemekleri'),
  ('Salatalar', 'Taze salata çeşitleri'),
  ('İçecekler', 'Sıcak ve soğuk içecekler'),
  ('Tatlılar', 'Tatlı çeşitleri')
ON CONFLICT (name) DO NOTHING;

-- Insert sample tables (1-20)
INSERT INTO tables (table_number) 
SELECT generate_series(1, 20)
ON CONFLICT (table_number) DO NOTHING;

-- Insert sample products
DO $$
DECLARE
  ana_yemek_id uuid;
  baslangic_id uuid;
  salata_id uuid;
  icecek_id uuid;
  tatli_id uuid;
BEGIN
  -- Get category IDs
  SELECT id INTO ana_yemek_id FROM categories WHERE name = 'Ana Yemekler';
  SELECT id INTO baslangic_id FROM categories WHERE name = 'Başlangıçlar';
  SELECT id INTO salata_id FROM categories WHERE name = 'Salatalar';
  SELECT id INTO icecek_id FROM categories WHERE name = 'İçecekler';
  SELECT id INTO tatli_id FROM categories WHERE name = 'Tatlılar';

  -- Insert sample products
  INSERT INTO products (name, description, price, image_url, category_id) VALUES
    ('Izgara Köfte', 'Özel baharatlarla hazırlanmış izgara köfte', 45.00, 'https://images.pexels.com/photos/1639562/pexels-photo-1639562.jpeg', ana_yemek_id),
    ('Tavuk Şiş', 'Marine edilmiş tavuk şiş', 42.00, 'https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg', ana_yemek_id),
    ('Karışık Meze', 'Çeşitli mezeler', 35.00, 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg', baslangic_id),
    ('Çoban Salatası', 'Taze sebzelerle hazırlanmış salata', 25.00, 'https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg', salata_id),
    ('Çay', 'Geleneksel Türk çayı', 8.00, 'https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg', icecek_id),
    ('Baklava', 'Geleneksel baklava', 30.00, 'https://images.pexels.com/photos/1639565/pexels-photo-1639565.jpeg', tatli_id)
  ON CONFLICT DO NOTHING;

  -- Insert stock items for each product
  INSERT INTO stock_items (product_id, current_stock, min_stock, max_stock, unit)
  SELECT id, 50, 10, 100, 'adet'
  FROM products
  ON CONFLICT DO NOTHING;
END $$;

-- Siparişlerde hesap istendi mi?
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_bill_requested boolean DEFAULT false;