// ============================================
// Cart — localStorage cart management
// ============================================

const CART_KEY = 'prodation_cart';

/**
 * Get all cart items
 * @returns {Array} cart items
 */
export function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

/**
 * Save cart and dispatch update event
 */
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new CustomEvent('cart-updated'));
}

/**
 * Add item to cart (or increment quantity if same product+size exists)
 * @param {Object} item - { productId, name, slug, image, size, price, quantity }
 */
export function addToCart(item) {
  const cart = getCart();
  const existing = cart.find(i => i.productId === item.productId && i.size === item.size);

  if (existing) {
    existing.quantity += (item.quantity || 1);
  } else {
    cart.push({
      productId: item.productId,
      name: item.name,
      slug: item.slug,
      image: item.image,
      size: item.size,
      price: Number(item.price),
      quantity: item.quantity || 1,
    });
  }

  saveCart(cart);
}

/**
 * Remove a specific item from cart
 */
export function removeFromCart(productId, size) {
  const cart = getCart().filter(i => !(i.productId === productId && i.size === size));
  saveCart(cart);
}

/**
 * Update quantity for a specific item
 */
export function updateQuantity(productId, size, quantity) {
  const cart = getCart();
  const item = cart.find(i => i.productId === productId && i.size === size);
  if (item) {
    item.quantity = Math.max(1, quantity);
  }
  saveCart(cart);
}

/**
 * Get total price of all items in cart
 */
export function getCartTotal() {
  return getCart().reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

/**
 * Get total number of items in cart
 */
export function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Clear all items from cart
 */
export function clearCart() {
  saveCart([]);
}
