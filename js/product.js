import { supabase, formatPrice } from './supabase-config.js';
import { addToCart } from './cart.js';
import { showToast } from './main.js';

let currentProduct = null;
let selectedSize = null;

async function loadProduct() {
  const urlParams = new URLSearchParams(window.location.search);
  const identifier = urlParams.get('slug') || urlParams.get('id');
  const container = document.getElementById('productDetailContainer');
  
  if (!identifier) {
    container.innerHTML = '<p class="text-error" style="grid-column: 1 / -1; text-align: center;">Product not found.</p>';
    return;
  }
  
  try {
    let { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', identifier)
      .single();
      
    if (!data) {
      const res = await supabase
        .from('products')
        .select('*')
        .eq('id', identifier)
        .single();
      data = res.data;
      error = res.error;
    }
    
    if (error || !data) throw error || new Error('Product not found');
    
    currentProduct = data;
    document.title = `${data.name} - Probation`;
    
    renderProductDetail(data, container);
    loadRelatedProducts(data.category, data.id);
    
  } catch (err) {
    console.error('Error fetching product:', err);
    container.innerHTML = '<p class="text-error" style="grid-column: 1 / -1; text-align: center;">Failed to load product details.</p>';
  }
}

function renderProductDetail(product, container) {
  // Ensure product.sizes and product.stock are arrays/objects if they exist, or fallback
  const sizes = product.sizes || ['S', 'M', 'L', 'XL'];
  const stock = product.stock || {};
  
  // Also handle extra images if they exist in DB (assuming an array, or fallback to single)
  const images = product.images && product.images.length > 0 ? product.images : [product.image_url];
  
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
        ${product.description || 'Premium quality streetwear.'}
      </div>
      
      <div id="sizeSelector" class="size-selector">
        <div class="form-label">SIZE</div>
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
    </div>
  `;
  
  setupInteractions(images);
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
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .eq('category', category)
      .neq('id', currentId)
      .limit(4);
      
    if (error) throw error;
    
    if (!data || data.length === 0) {
      grid.parentElement.style.display = 'none'; // hide section if no related
      return;
    }
    
    grid.innerHTML = data.map(product => `
      <div class="product-card fade-in visible">
        <div class="product-card-img">
          <a href="/product.html?slug=${product.slug}">
            <img src="${product.image_url}" alt="${product.name}" loading="lazy">
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

document.addEventListener('DOMContentLoaded', loadProduct);
