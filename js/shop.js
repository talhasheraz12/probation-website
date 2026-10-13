import { supabase, formatPrice } from './supabase-config.js';

let allProducts = [];

export async function fetchFeaturedProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .eq('featured', true)
    .limit(4);
    
  if (error) throw error;
  return data;
}

async function loadProducts() {
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  grid.innerHTML = '<div class="loading-spinner" style="margin: 40px auto; display: block; grid-column: 1 / -1;"></div>';
  
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('active', true);
      
    if (error) throw error;
    
    allProducts = data || [];
    
    // Check URL for initial filter category
    const urlParams = new URLSearchParams(window.location.search);
    const initialCategory = urlParams.get('cat') || 'all';
    
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === initialCategory);
    });
    
    renderProducts(initialCategory);
    
  } catch (err) {
    console.error('Error fetching products:', err);
    grid.innerHTML = '<p class="text-error" style="grid-column: 1 / -1; text-align: center;">Failed to load products.</p>';
  }
}

function renderProducts(category = 'all') {
  const grid = document.getElementById('productGrid');
  if (!grid) return;
  
  const filteredProducts = category === 'all' 
    ? allProducts 
    : allProducts.filter(p => p.category === category);
    
  if (filteredProducts.length === 0) {
    grid.innerHTML = '<p class="text-secondary" style="grid-column: 1 / -1; text-align: center;">No products found in this category.</p>';
    return;
  }
  
  grid.innerHTML = filteredProducts.map(product => `
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
}

// Setup filter button listeners
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('productGrid')) {
    loadProducts();
    
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        const category = e.target.dataset.category;
        
        // Update URL without reloading page
        const url = new URL(window.location);
        if (category === 'all') {
          url.searchParams.delete('cat');
        } else {
          url.searchParams.set('cat', category);
        }
        window.history.replaceState({}, '', url);
        
        renderProducts(category);
      });
    });
  }
});
