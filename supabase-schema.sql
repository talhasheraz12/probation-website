-- ============================================
-- PROBATION — Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Create Products Table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  compare_price DECIMAL(10,2),
  category TEXT DEFAULT 'hoodie',
  sizes JSONB DEFAULT '["S","M","L","XL","XXL"]'::jsonb,
  stock JSONB DEFAULT '{"S":10,"M":15,"L":20,"XL":10,"XXL":5}'::jsonb,
  images TEXT[] DEFAULT '{}',
  image_url TEXT,
  featured BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number SERIAL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  city TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'pending',
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_fee DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  size TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 5. Products Policies (Public can view active products, Admin can manage)
CREATE POLICY "Public read products" ON products FOR SELECT USING (active = true);
CREATE POLICY "Admin full products" ON products FOR ALL USING (auth.role() = 'authenticated');

-- 6. Orders Policies (Customers can place orders, Admin can view and manage)
CREATE POLICY "Public insert orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin view orders" ON orders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin update orders" ON orders FOR UPDATE USING (auth.role() = 'authenticated');

-- 7. Order Items Policies (Customers can insert items, Admin can view)
CREATE POLICY "Public insert order_items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin view order_items" ON order_items FOR SELECT USING (auth.role() = 'authenticated');

-- 8. Storage Bucket for Product Images
-- In Supabase Dashboard: Go to Storage -> New Bucket -> Name it "product-images" -> Make it Public!
