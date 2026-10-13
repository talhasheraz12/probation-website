-- ============================================
-- PROBATION — Clean Seed (3 Products Only, S/M/L)
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Remove previous products and re-seed cleanly
DELETE FROM products;

-- 2. Insert the 3 official Probation products
INSERT INTO products (name, slug, description, price, compare_price, category, sizes, stock, images, image_url, featured, active)
VALUES
(
  'Probation Heavyweight Script Hoodie',
  'probation-heavyweight-script-hoodie',
  '• 100% Heavy-Weight Cotton (380 GSM)
• Oversized Fit
• Embroidered Logo on Hoodie
• DTF Print at The Back
• Kangaroo Pocket
Model Details: The Model is Wearing Size Large; Model Height: 6''1',
  6500.00,
  7500.00,
  'hoodie',
  '["S", "M", "L"]'::jsonb,
  '{"S": 15, "M": 25, "L": 30}'::jsonb,
  ARRAY[
    '/images/products/hoodie-grey-front.webp',
    '/images/products/hoodie-grey-back.webp',
    '/images/products/hoodie-grey-closeup.webp',
    '/images/products/hoodie-grey-collar.webp',
    '/images/products/hoodie-back-detail.webp'
  ],
  '/images/products/hoodie-grey-front.webp',
  true,
  true
),
(
  'Probation Wide-Leg Sweatpants',
  'probation-wide-leg-sweatpants',
  '• 100% Heavy-Weight Cotton (380 GSM)
• Relaxed Wide-Leg Streetwear Fit
• Embroidered Cursive Logo at Hip
• Botanical Leaf Motif Embroidery near Ankle
• Deep Pockets & Elastic Waistband with Flat Drawstrings
Model Details: The Model is Wearing Size Large; Model Height: 6''1',
  5500.00,
  NULL,
  'sweatpants',
  '["S", "M", "L"]'::jsonb,
  '{"S": 10, "M": 20, "L": 25}'::jsonb,
  ARRAY[
    '/images/products/joggers-front.webp',
    '/images/products/joggers-side.webp',
    '/images/products/joggers-detail.webp'
  ],
  '/images/products/joggers-front.webp',
  true,
  true
),
(
  'Probation Signature Tracksuit Set',
  'probation-signature-tracksuit-set',
  'Complete 2-Piece Heavyweight Streetwear Set (Hoodie + Sweatpants)
• 100% Heavy-Weight Cotton (380 GSM)
• Oversized Fit Hoodie with Kangaroo Pocket & DTF Back Print
• Matching Wide-Leg Sweatpants with Embroidered Hip & Ankle Details
Model Details: The Model is Wearing Size Large; Model Height: 6''1',
  11000.00,
  12000.00,
  'set',
  '["S", "M", "L"]'::jsonb,
  '{"S": 8, "M": 15, "L": 20}'::jsonb,
  ARRAY[
    '/images/products/tracksuit-set-front.webp',
    '/images/products/hoodie-grey-front.webp',
    '/images/products/hoodie-grey-back.webp',
    '/images/products/joggers-front.webp'
  ],
  '/images/products/tracksuit-set-front.webp',
  true,
  true
);
