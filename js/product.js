import { supabase, formatPrice } from './supabase-config.js';
import { addToCart } from './cart.js';
import { showToast } from './main.js';

let currentProduct = null;
let selectedSize = null;

async function loadProduct() {
  const urlParams = new URLSearchParams(window.location.search);
  const rawIdentifier = urlParams.get('slug') || urlParams.get('id');
  const container = document.getElementById('productDetailContainer');
  
  if (!container) return;

  if (!rawIdentifier) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
        <p class="text-error" style="font-size: 1.1rem; margin-bottom: 16px;">Product not found.</p>
        <a href="/shop.html" class="btn btn-outline">Back to Shop</a>
      </div>
    `;
    return;
  }

  const identifier = decodeURIComponent(rawIdentifier).trim();
  
  try {
    // 1. Try querying by slug first
    let product = null;
    const { data: bySlug, error: slugError } = await supabase
      .from('products')
      .select('*')
      .eq('slug', identifier)
      .maybeSingle();

    if (slugError) {
      console.warn('Slug query error:', slugError);
    }

    if (bySlug) {
      product = bySlug;
    } else {
      // 2. Fallback: try querying by id (UUID)
      const { data: byId, error: idError } = await supabase
        .from('products')
        .select('*')
        .eq('id', identifier)
        .maybeSingle();

      if (idError) {
        console.warn('ID query error:', idError);
      }
      if (byId) {
        product = byId;
      }
    }
    
    if (!product) {
      throw new Error(`Product "${identifier}" could not be found.`);
    }
    
    currentProduct = product;
    document.title = `${product.name} - Probation`;
    
    renderProductDetail(product, container);
    loadRelatedProducts(product.category, product.id);
    
  } catch (err) {
    console.error('Error fetching product:', err);
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
        <p class="text-error" style="font-size: 1.1rem; margin-bottom: 16px;">Failed to load product details.</p>
        <p class="text-secondary" style="font-size: 0.9rem; margin-bottom: 24px;">${err.message || 'Please check your connection and try again.'}</p>
        <a href="/shop.html" class="btn btn-primary">Browse All Products</a>
      </div>
    `;
  }
}

function renderProductDetail(product, container) {
  // Limit sizes to S, M, L
  const allowedSizes = ['S', 'M', 'L'];
  let rawSizes = product.sizes;
  if (typeof rawSizes === 'string') {
    try { rawSizes = JSON.parse(rawSizes); } catch (e) { rawSizes = allowedSizes; }
  }
  const sizes = (Array.isArray(rawSizes) ? rawSizes : allowedSizes).filter(s => allowedSizes.includes(s));
  
  let stock = product.stock;
  if (typeof stock === 'string') {
    try { stock = JSON.parse(stock); } catch (e) { stock = {}; }
  }
  if (!stock || typeof stock !== 'object') stock = {};
  
  // Robust image array fallback
  let images = [];
  if (Array.isArray(product.images) && product.images.length > 0) {
    images = product.images.filter(Boolean);
  } else if (typeof product.images === 'string') {
    try {
      const parsed = JSON.parse(product.images);
      if (Array.isArray(parsed)) images = parsed.filter(Boolean);
    } catch(e) {}
  }
  if (images.length === 0 && product.image_url) {
    images = [product.image_url];
  }
  if (images.length === 0) {
    images = ['/images/hero/hero-main.webp'];
  }
  
  const sizeHtml = sizes.map(size => {
    const isOutOfStock = stock[size] === 0;
    return `<button class="size-option ${isOutOfStock ? 'out-of-stock' : ''}" data-size="${size}" ${isOutOfStock ? 'disabled' : ''}>${size}</button>`;
  }).join('');
  
  const thumbnailsHtml = images.length > 1 ? `
    <div id="thumbStrip" class="product-gallery-thumbs">
      ${images.map((img, i) => `
        <button class="${i === 0 ? 'active' : ''}" data-index="${i}">
          <img src="${img}" alt="${product.name} thumbnail ${i+1}">
        </button>
      `).join('')}
    </div>
  ` : '';

  const galleryControlsHtml = images.length > 1 ? `
    <div class="gallery-dots">
      ${images.map((_, i) => `<span class="gallery-dot ${i === 0 ? 'active' : ''}"></span>`).join('')}
    </div>
    <div class="gallery-counter-badge" id="galleryCounter">1 / ${images.length}</div>
    <button type="button" class="gallery-nav-btn prev" id="galleryPrev" aria-label="Previous image">&#8249;</button>
    <button type="button" class="gallery-nav-btn next" id="galleryNext" aria-label="Next image">&#8250;</button>
  ` : '';

  const isSweatpants = product.category === 'sweatpants' || product.category === 'joggers';
  const isSet = product.category === 'set';

  let specsListHtml = `
    <ul class="product-specs-list">
      <li>100% Heavy-Weight Cotton (380 GSM)</li>
      <li>Oversized Fit</li>
      <li>Embroidered Logo on Hoodie</li>
      <li>DTF Print at The Back</li>
      <li>Kangaroo Pocket</li>
    </ul>
    <div class="model-details-badge">
      <strong>Model Details:</strong> The Model is Wearing Size Large; Model Height: 6'1
    </div>
  `;

  if (isSweatpants) {
    specsListHtml = `
      <ul class="product-specs-list">
        <li>100% Heavy-Weight Cotton (380 GSM)</li>
        <li>Relaxed Wide-Leg Streetwear Fit</li>
        <li>Embroidered Cursive Logo at Hip</li>
        <li>Botanical Leaf Motif Embroidery near Ankle</li>
        <li>Deep Pockets & Elastic Waistband with Flat Drawstrings</li>
      </ul>
      <div class="model-details-badge">
        <strong>Model Details:</strong> The Model is Wearing Size Large; Model Height: 6'1
      </div>
    `;
  } else if (isSet) {
    specsListHtml = `
      <p style="font-weight: 600; color: #fff; margin-bottom: 8px;">Complete 2-Piece Heavyweight Streetwear Set (Hoodie + Sweatpants)</p>
      <ul class="product-specs-list">
        <li>100% Heavy-Weight Cotton (380 GSM)</li>
        <li>Oversized Fit Hoodie with DTF Back Print & Kangaroo Pocket</li>
        <li>Matching Wide-Leg Sweatpants with Embroidered Hip & Ankle Details</li>
      </ul>
      <div class="model-details-badge">
        <strong>Model Details:</strong> The Model is Wearing Size Large; Model Height: 6'1
      </div>
    `;
  }

  container.innerHTML = `
    <div class="product-gallery fade-in visible">
      <div id="mainImage" class="product-gallery-main">
        <img src="${images[0]}" alt="${product.name}">
        ${galleryControlsHtml}
      </div>
      ${thumbnailsHtml}
    </div>
    
    <div class="product-info fade-in visible" style="transition-delay: 0.1s">
      <h1 id="productName">${product.name}</h1>
      <div id="productPrice" class="product-price">
        ${formatPrice(product.price)}
        ${product.compare_price ? `<span class="compare">${formatPrice(product.compare_price)}</span>` : ''}
      </div>
      
      <div id="productDescription" class="product-description">
        ${specsListHtml}
      </div>
      
      <div id="sizeSelector" class="size-selector" style="margin-top: 24px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <div class="form-label" style="margin-bottom:0;">SELECT SIZE</div>
          <a href="#sizeGuideSection" class="size-guide-btn-link">Size Guide 📏</a>
        </div>
        <div class="size-options">
          ${sizeHtml}
        </div>
      </div>
      
      <div class="form-label" style="margin-top: 20px;">QUANTITY</div>
      <div class="quantity-selector">
        <button id="qtyDec">-</button>
        <input type="number" id="qtyInput" value="1" min="1" max="10">
        <button id="qtyInc">+</button>
      </div>
      
      <div class="add-to-cart-row">
        <button id="addToCartBtn" class="btn btn-primary btn-full btn-lg">ADD TO CART</button>
      </div>
      <button id="buyNowBtn" class="btn btn-secondary btn-full btn-lg">BUY NOW</button>

      <div class="exclusivity-notice">
        <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <div>
          <strong>Limited Drop Notice</strong>
          When one design sells out, it never comes back in stock.
        </div>
      </div>
    </div>

    ${renderSizeGuide(product.category)}
  `;
  
  setupInteractions(images);
}

function renderSizeGuide(category) {
  const isSweatpants = category === 'sweatpants' || category === 'joggers';
  const isSet = category === 'set';

  const hoodieTable = `
    <div style="margin-bottom: ${isSet ? '28px' : '0'};">
      <h4 style="margin-bottom: 12px; font-size: 0.95rem; color: var(--accent); letter-spacing: 0.08em;">HOODIE SIZE GUIDE</h4>
      <div class="size-table-container">
        <table class="size-table">
          <thead>
            <tr>
              <th>SIZE</th>
              <th>CHEST (A)</th>
              <th>LENGTH (B)</th>
              <th>SHOULDER (C)</th>
              <th>SLEEVE LENGTH (D)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="size-col">S</td>
              <td>23" (58.4 cm)</td>
              <td>27" (68.6 cm)</td>
              <td>21" (53.3 cm)</td>
              <td>33" (83.8 cm)</td>
            </tr>
            <tr>
              <td class="size-col">M</td>
              <td>24" (61.0 cm)</td>
              <td>28" (71.1 cm)</td>
              <td>22" (55.9 cm)</td>
              <td>34" (86.4 cm)</td>
            </tr>
            <tr>
              <td class="size-col">L</td>
              <td>25" (63.5 cm)</td>
              <td>29" (73.7 cm)</td>
              <td>23" (58.4 cm)</td>
              <td>35" (88.9 cm)</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="size-guide-note">All measurements in inches (cm in brackets). Sleeve length is measured from centre back.</p>
    </div>
  `;

  const sweatpantsTable = `
    <div>
      <h4 style="margin-bottom: 12px; font-size: 0.95rem; color: var(--accent); letter-spacing: 0.08em;">SWEATPANTS SIZE GUIDE</h4>
      <div class="size-table-container">
        <table class="size-table">
          <thead>
            <tr>
              <th>SIZE</th>
              <th>WAIST (A)</th>
              <th>HIP (B)</th>
              <th>THIGH (C)</th>
              <th>LEG OPENING (D)</th>
              <th>LENGTH (E)</th>
              <th>FRONT RISE (F)</th>
              <th>BACK RISE (G)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="size-col">S</td>
              <td>27" (68.6 cm)</td>
              <td>36" (91.4 cm)</td>
              <td>22" (55.9 cm)</td>
              <td>8.5" (21.6 cm)</td>
              <td>38" (96.5 cm)</td>
              <td>12" (30.5 cm)</td>
              <td>15.5" (39.4 cm)</td>
            </tr>
            <tr>
              <td class="size-col">M</td>
              <td>29" (73.7 cm)</td>
              <td>38" (96.5 cm)</td>
              <td>24" (61.0 cm)</td>
              <td>9" (22.9 cm)</td>
              <td>40" (101.6 cm)</td>
              <td>12.5" (31.8 cm)</td>
              <td>16" (40.6 cm)</td>
            </tr>
            <tr>
              <td class="size-col">L</td>
              <td>31" (78.7 cm)</td>
              <td>40" (101.6 cm)</td>
              <td>26" (66.0 cm)</td>
              <td>9.5" (24.1 cm)</td>
              <td>42" (106.7 cm)</td>
              <td>13" (33.0 cm)</td>
              <td>16.5" (41.9 cm)</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="size-guide-note">All measurements in inches (cm in brackets). F = front rise, G = back rise.</p>
    </div>
  `;

  let diagramSrc = '/images/size-charts/hoodie-size-guide.webp';
  if (isSweatpants) {
    diagramSrc = '/images/size-charts/sweatpants-size-guide.webp';
  } else if (isSet) {
    diagramSrc = '/images/size-charts/full-size-guide.webp';
  }

  return `
    <section class="size-guide-section" id="sizeGuideSection">
      <div class="size-guide-header">
        <h3>
          <svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21.3 15.3l-6.6-6.6a2 2 0 0 0-2.8 0L2.7 17.9a2 2 0 0 0 0 2.8l3.6 3.6a2 2 0 0 0 2.8 0l9.2-9.2a2 2 0 0 0 0-2.8z"/>
            <path d="M6.5 13.5l1.5 1.5M10.5 9.5l1.5 1.5M14.5 5.5l1.5 1.5"/>
          </svg>
          Size Guide & Measurements
        </h3>
        <span class="text-secondary" style="font-size:0.8rem">Official Probation Streetwear Sizing</span>
      </div>
      <div class="size-guide-grid">
        <div>
          ${isSet ? hoodieTable + sweatpantsTable : (isSweatpants ? sweatpantsTable : hoodieTable)}
        </div>
        <div class="size-guide-image">
          <img src="${diagramSrc}" alt="Size Guide Diagram" loading="lazy">
        </div>
      </div>
    </section>
  `;
}

function setupInteractions(images) {
  let currentIndex = 0;

  function updateActiveImage(newIndex) {
    if (newIndex < 0) newIndex = images.length - 1;
    if (newIndex >= images.length) newIndex = 0;
    currentIndex = newIndex;

    const mainImg = document.querySelector('#mainImage img');
    if (mainImg) {
      mainImg.style.opacity = '0.35';
      mainImg.src = images[currentIndex];
      setTimeout(() => { mainImg.style.opacity = '1'; }, 80);
    }

    const counter = document.getElementById('galleryCounter');
    if (counter) counter.textContent = `${currentIndex + 1} / ${images.length}`;

    const dots = document.querySelectorAll('.gallery-dot');
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentIndex);
    });

    const thumbBtns = document.querySelectorAll('#thumbStrip button');
    thumbBtns.forEach((btn, i) => {
      btn.classList.toggle('active', i === currentIndex);
      if (i === currentIndex) {
        btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    });
  }

  if (images.length > 1) {
    // Thumbnails
    const thumbBtns = document.querySelectorAll('#thumbStrip button');
    thumbBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        updateActiveImage(parseInt(btn.dataset.index, 10));
      });
    });

    // Arrow controls
    document.getElementById('galleryPrev')?.addEventListener('click', (e) => {
      e.stopPropagation();
      updateActiveImage(currentIndex - 1);
    });
    document.getElementById('galleryNext')?.addEventListener('click', (e) => {
      e.stopPropagation();
      updateActiveImage(currentIndex + 1);
    });

    // Touch Swipe gesture support on mobile
    const mainGallery = document.getElementById('mainImage');
    if (mainGallery) {
      let touchStartX = 0;
      let touchStartY = 0;
      let isSwiping = false;

      mainGallery.addEventListener('touchstart', (e) => {
        if (!e.changedTouches || e.changedTouches.length === 0) return;
        touchStartX = e.changedTouches[0].clientX;
        touchStartY = e.changedTouches[0].clientY;
        isSwiping = true;
      }, { passive: true });

      mainGallery.addEventListener('touchmove', (e) => {
        if (!isSwiping || !e.changedTouches || e.changedTouches.length === 0) return;
        const currentX = e.changedTouches[0].clientX;
        const currentY = e.changedTouches[0].clientY;
        const diffX = Math.abs(currentX - touchStartX);
        const diffY = Math.abs(currentY - touchStartY);

        // Lock vertical scrolling if swiping horizontally
        if (diffX > diffY && diffX > 10) {
          if (e.cancelable) e.preventDefault();
        }
      }, { passive: false });

      mainGallery.addEventListener('touchend', (e) => {
        if (!isSwiping || !e.changedTouches || e.changedTouches.length === 0) return;
        isSwiping = false;
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;

        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;

        // Minimum swipe distance of 35px, predominantly horizontal
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 35) {
          if (deltaX < 0) {
            updateActiveImage(currentIndex + 1); // Swiped left -> Next photo
          } else {
            updateActiveImage(currentIndex - 1); // Swiped right -> Previous photo
          }
        }
      }, { passive: true });
    }
  }
  
  // Size selection
  const sizeBtns = document.querySelectorAll('.size-option:not(.out-of-stock)');
  sizeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sizeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedSize = btn.dataset.size;
    });
  });
  
  // Quantity
  const qtyInput = document.getElementById('qtyInput');
  document.getElementById('qtyDec').addEventListener('click', () => {
    if (qtyInput.value > 1) qtyInput.value--;
  });
  document.getElementById('qtyInc').addEventListener('click', () => {
    if (qtyInput.value < 10) qtyInput.value++;
  });
  qtyInput.addEventListener('change', () => {
    if (qtyInput.value < 1) qtyInput.value = 1;
    if (qtyInput.value > 10) qtyInput.value = 10;
  });
  
  // Add to cart
  document.getElementById('addToCartBtn').addEventListener('click', () => handleAddToCart(false));
  document.getElementById('buyNowBtn').addEventListener('click', () => handleAddToCart(true));
}

function handleAddToCart(redirect) {
  if (!selectedSize) {
    showToast('Please select a size', 'error');
    return;
  }
  
  const qty = parseInt(document.getElementById('qtyInput').value) || 1;
  
  addToCart({
    productId: currentProduct.id,
    name: currentProduct.name,
    slug: currentProduct.slug,
    image: (currentProduct.images && currentProduct.images[0]) || currentProduct.image_url || '/images/hero/hero-main.webp',
    size: selectedSize,
    price: currentProduct.price,
    quantity: qty
  });
  
  if (redirect) {
    window.location.href = '/checkout.html';
  } else {
    showToast('Added to cart!');
  }
}

async function loadRelatedProducts(category, currentId) {
  const grid = document.getElementById('relatedProducts');
  if (!grid) return;
  
  try {
    // First try: same category, excluding current product
    let { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .eq('category', category)
      .neq('id', currentId)
      .limit(4);
      
    if (error) throw error;
    
    // Fallback: if no same-category results, show any other active products
    if (!data || data.length === 0) {
      const res = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .neq('id', currentId)
        .limit(4);
      if (res.error) throw res.error;
      data = res.data || [];
    }
    
    if (!data || data.length === 0) {
      if (grid.parentElement) grid.parentElement.style.display = 'none';
      return;
    }
    
    grid.innerHTML = data.map(product => `
      <div class="product-card fade-in visible">
        <div class="product-card-img">
          <a href="/product.html?slug=${product.slug}">
            <img src="${(product.images && product.images[0]) || product.image_url || '/images/hero/hero-main.webp'}" alt="${product.name}" loading="lazy">
          </a>
          ${product.compare_price ? '<span class="product-card-badge">Sale</span>' : ''}
        </div>
        <div class="product-card-body">
          <div class="product-card-name">
            <a href="/product.html?slug=${product.slug}">${product.name}</a>
          </div>
          <div class="product-card-price">
            ${formatPrice(product.price)}
            ${product.compare_price ? `<span class="compare">${formatPrice(product.compare_price)}</span>` : ''}
          </div>
        </div>
      </div>
    `).join('');
    
  } catch (err) {
    console.error('Error fetching related products:', err);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadProduct);
} else {
  loadProduct();
}
