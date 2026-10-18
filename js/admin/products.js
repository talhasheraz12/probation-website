import { supabase, formatPrice } from '/js/supabase-config.js';

// Utilities
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function generateSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// Scope logic depending on current page elements
const isProductsPage = !!document.getElementById('productsTable');
const isProductEditPage = !!document.getElementById('productForm');

if (isProductsPage) {
  const tableBody = document.getElementById('productsTable');

  async function loadProducts() {
    const { data: products, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    
    if (error) {
      console.error(error);
      return;
    }

    tableBody.innerHTML = '';
    
    products.forEach(product => {
      const tr = document.createElement('tr');
      const imgUrl = product.images && product.images.length > 0 ? product.images[0] : '';
      const stockTotal = Object.values(product.stock || {}).reduce((a, b) => a + Number(b), 0);
      const isSet = product.category === 'set' || (product.slug && product.slug.includes('set'));
      const stockBadge = isSet ? `<br><small style="color:var(--accent);font-size:0.7rem;font-weight:600;">(Auto-synced bundle)</small>` : '';
      
      tr.innerHTML = `
        <td><img src="${imgUrl}" alt="${product.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI1MCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzMzMyIvPjwvc3ZnPg=='" /></td>
        <td>${product.name}</td>
        <td style="text-transform:capitalize">${product.category}</td>
        <td>${formatPrice(product.price)}</td>
        <td>${stockTotal}${stockBadge}</td>
        <td>
          <label class="toggle-switch">
            <input type="checkbox" class="toggle-featured" data-id="${product.id}" ${product.featured ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </td>
        <td>
          <label class="toggle-switch">
            <input type="checkbox" class="toggle-active" data-id="${product.id}" ${product.active ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </td>
        <td>
          <a href="/admin/product-edit.html?id=${product.id}" class="btn btn-sm btn-secondary">Edit</a>
          <button class="btn btn-sm btn-outline delete-product" data-id="${product.id}">Delete</button>
        </td>
      `;
      tableBody.appendChild(tr);
    });
  }

  tableBody.addEventListener('change', async (e) => {
    if (e.target.classList.contains('toggle-featured')) {
      const id = e.target.getAttribute('data-id');
      await supabase.from('products').update({ featured: e.target.checked }).eq('id', id);
    }
    if (e.target.classList.contains('toggle-active')) {
      const id = e.target.getAttribute('data-id');
      await supabase.from('products').update({ active: e.target.checked }).eq('id', id);
    }
  });

  tableBody.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-product')) {
      if (confirm('Are you sure you want to delete this product?')) {
        const id = e.target.getAttribute('data-id');
        await supabase.from('products').delete().eq('id', id);
        loadProducts();
      }
    }
  });

  loadProducts();
}

if (isProductEditPage) {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');
  
  const form = document.getElementById('productForm');
  const nameInput = document.getElementById('name');
  const slugInput = document.getElementById('slug');
  const uploadZone = document.getElementById('imageUploadZone');
  const fileInput = document.getElementById('imageInput');
  const previewGrid = document.getElementById('imagePreviewGrid');
  
  let uploadedImages = [];
  
  if (productId) {
    document.getElementById('pageTitle').textContent = 'Edit Product';
    loadProductForEdit(productId);
  }

  nameInput.addEventListener('input', () => {
    if (!productId || slugInput.value === '') {
      slugInput.value = generateSlug(nameInput.value);
    }
  });

  const categorySelect = document.getElementById('category');
  function updateSetNotice(cat) {
    const isSet = cat === 'set';
    const notice = document.getElementById('setSyncNotice');
    const help = document.getElementById('setSyncHelp');
    if (notice) notice.style.display = isSet ? 'inline-block' : 'none';
    if (help) help.style.display = isSet ? 'block' : 'none';
  }
  categorySelect?.addEventListener('change', () => updateSetNotice(categorySelect.value));

  async function loadProductForEdit(id) {
    const { data: product, error } = await supabase.from('products').select('*').eq('id', id).single();
    if (product) {
      nameInput.value = product.name;
      slugInput.value = product.slug;
      document.getElementById('description').value = product.description;
      document.getElementById('price').value = product.price;
      document.getElementById('compare_price').value = product.compare_price || '';
      document.getElementById('category').value = product.category;
      updateSetNotice(product.category);
      document.getElementById('stockS').value = product.stock?.S || 0;
      document.getElementById('stockM').value = product.stock?.M || 0;
      document.getElementById('stockL').value = product.stock?.L || 0;
      document.getElementById('stockXL').value = product.stock?.XL || 0;
      document.getElementById('stockXXL').value = product.stock?.XXL || 0;
      document.getElementById('featured').checked = product.featured;
      document.getElementById('active').checked = product.active;
      
      if (product.images) {
        uploadedImages = [...product.images];
        renderImagePreviews();
      }
    }
  }

  // Image Upload Logic
  uploadZone.addEventListener('click', () => fileInput.click());
  uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.style.borderColor = 'var(--accent)'; });
  uploadZone.addEventListener('dragleave', e => { e.preventDefault(); uploadZone.style.borderColor = 'var(--border)'; });
  uploadZone.addEventListener('drop', async e => {
    e.preventDefault();
    uploadZone.style.borderColor = 'var(--border)';
    handleFiles(e.dataTransfer.files);
  });
  fileInput.addEventListener('change', e => handleFiles(e.target.files));

  async function handleFiles(files) {
    for (let file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      const { data, error } = await supabase.storage.from('product-images').upload(filePath, file);
      if (error) {
        showToast('Image upload failed', 'error');
        console.error(error);
      } else {
        const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath);
        uploadedImages.push(publicUrl);
        renderImagePreviews();
      }
    }
  }

  function renderImagePreviews() {
    previewGrid.innerHTML = '';
    uploadedImages.forEach((url, index) => {
      const item = document.createElement('div');
      item.className = 'image-preview-item';
      item.innerHTML = `
        <img src="${url}" alt="Preview">
        <button type="button" class="remove-img" data-index="${index}">×</button>
      `;
      previewGrid.appendChild(item);
    });
  }

  previewGrid.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-img')) {
      const index = e.target.getAttribute('data-index');
      uploadedImages.splice(index, 1);
      renderImagePreviews();
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('saveBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    
    let slug = slugInput.value;
    if (!slug) slug = generateSlug(nameInput.value);

    const productData = {
      name: nameInput.value,
      slug: slug,
      description: document.getElementById('description').value,
      price: parseFloat(document.getElementById('price').value),
      compare_price: document.getElementById('compare_price').value ? parseFloat(document.getElementById('compare_price').value) : null,
      category: document.getElementById('category').value,
      stock: {
        S: parseInt(document.getElementById('stockS').value) || 0,
        M: parseInt(document.getElementById('stockM').value) || 0,
        L: parseInt(document.getElementById('stockL').value) || 0,
        XL: parseInt(document.getElementById('stockXL').value) || 0,
        XXL: parseInt(document.getElementById('stockXXL').value) || 0
      },
      featured: document.getElementById('featured').checked,
      active: document.getElementById('active').checked,
      images: uploadedImages,
      image_url: uploadedImages.length > 0 ? uploadedImages[0] : null
    };

    let result;
    if (productId) {
      result = await supabase.from('products').update(productData).eq('id', productId);
    } else {
      result = await supabase.from('products').insert([productData]);
    }

    if (result.error) {
      showToast(result.error.message, 'error');
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Product';
      return;
    }

    // Auto-sync bundle inventory:
    // "if inventory is added in sweatpants it is added to sets quantity too and same with hoodies"
    try {
      const { data: allProds } = await supabase.from('products').select('*');
      if (allProds) {
        const hoodieProd = allProds.find(p => p.category === 'hoodie' || (p.slug && p.slug.includes('hoodie')));
        const sweatpantProd = allProds.find(p => p.category === 'sweatpants' || p.category === 'joggers' || (p.slug && p.slug.includes('sweatpants')));
        const setProd = allProds.find(p => p.category === 'set' || (p.slug && p.slug.includes('set')));

        if (hoodieProd && sweatpantProd && setProd) {
          const category = productData.category;
          if (category === 'hoodie' || category === 'sweatpants' || category === 'joggers') {
            // Updated hoodie or sweatpants -> automatically update set stock to min(hoodie, sweatpants)
            const syncedSetStock = {};
            ['S', 'M', 'L', 'XL', 'XXL'].forEach(sz => {
              const h = Number(hoodieProd.stock?.[sz] || 0);
              const p = Number(sweatpantProd.stock?.[sz] || 0);
              syncedSetStock[sz] = Math.min(h, p);
            });
            await supabase.from('products').update({ stock: syncedSetStock }).eq('id', setProd.id);
          } else if (category === 'set') {
            // Admin directly entered stock for the set -> ensure hoodie and sweatpants have at least that stock
            const newHoodieStock = { ...(hoodieProd.stock || {}) };
            const newSweatpantStock = { ...(sweatpantProd.stock || {}) };
            let hChanged = false;
            let pChanged = false;

            ['S', 'M', 'L', 'XL', 'XXL'].forEach(sz => {
              const desired = Number(productData.stock?.[sz] || 0);
              if (Number(newHoodieStock[sz] || 0) < desired) {
                newHoodieStock[sz] = desired;
                hChanged = true;
              }
              if (Number(newSweatpantStock[sz] || 0) < desired) {
                newSweatpantStock[sz] = desired;
                pChanged = true;
              }
            });

            if (hChanged) {
              await supabase.from('products').update({ stock: newHoodieStock }).eq('id', hoodieProd.id);
            }
            if (pChanged) {
              await supabase.from('products').update({ stock: newSweatpantStock }).eq('id', sweatpantProd.id);
            }
          }
        }
      }
    } catch (syncErr) {
      console.warn('Inventory sync error:', syncErr);
    }

    window.location.href = '/admin/products.html';
  });
}
