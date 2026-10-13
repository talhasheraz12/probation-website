-- ============================================
-- PROBATION — Seed Initial Products & Inventory
-- Run this in your Supabase SQL Editor
-- ============================================

INSERT INTO products (name, slug, description, price, compare_price, category, sizes, stock, images, image_url, featured, active)
VALUES
(
  'Probation Heavyweight Script Hoodie',
  'probation-heavyweight-script-hoodie',
  'Heavyweight custom-milled fleece hoodie in heather grey with signature cursive "Probation" script embroidery on chest. Relaxed streetwear fit with double-layered hood and ribbed cuffs.',
  6500.00,
  7500.00,
  'hoodie',
  '["S", "M", "L", "XL", "XXL"]'::jsonb,
  '{"S": 15, "M": 25, "L": 30, "XL": 18, "XXL": 8}'::jsonb,
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
  'Relaxed wide-leg heather grey sweatpants with embroidered cursive Probation logo at hip and botanical leaf motif near the bottom hem. Elastic waistband with flat cotton drawstrings.',
  5500.00,
  NULL,
  'joggers',
  '["S", "M", "L", "XL", "XXL"]'::jsonb,
  '{"S": 10, "M": 20, "L": 25, "XL": 12, "XXL": 6}'::jsonb,
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
  'Complete 2-piece heavyweight heather grey fleece set including the signature script hoodie and wide-leg sweatpants. Engineered for an effortless, premium streetwear silhouette.',
  11000.00,
  12000.00,
  'set',
  '["S", "M", "L", "XL", "XXL"]'::jsonb,
  '{"S": 8, "M": 15, "L": 20, "XL": 10, "XXL": 4}'::jsonb,
  ARRAY[
    '/images/products/tracksuit-set-front.webp',
    '/images/products/hoodie-grey-front.webp',
    '/images/products/hoodie-grey-back.webp',
    '/images/products/joggers-front.webp'
  ],
  '/images/products/tracksuit-set-front.webp',
  true,
  true
),
(
  'Probation Statement Back-Print Hoodie',
  'probation-statement-backprint-hoodie',
  'Statement drop featuring high-density red and weathered black typography: "LOVE''S GONNA GET YOU KILLED BUT PRIDE''S GONNA BE THE DEATH OF YOU" across the back panel.',
  6800.00,
  NULL,
  'hoodie',
  '["S", "M", "L", "XL", "XXL"]'::jsonb,
  '{"S": 12, "M": 18, "L": 22, "XL": 14, "XXL": 5}'::jsonb,
  ARRAY[
    '/images/products/hoodie-grey-back.webp',
    '/images/products/hoodie-back-detail.webp',
    '/images/products/hoodie-grey-collar.webp',
    '/images/products/hoodie-grey-front.webp'
  ],
  '/images/products/hoodie-grey-back.webp',
  true,
  true
)
ON CONFLICT (slug) DO NOTHING;
