// ============================================
// Main — Shared storefront functionality
// ============================================

import { getCartCount } from './cart.js';

// --- Mobile Navigation ---
function initMobileNav() {
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  const navOverlay = document.querySelector('.nav-overlay');
  const navClose = document.querySelector('.nav-close');

  if (!navToggle || !navLinks) return;

  function openNav() {
    navLinks.classList.add('active');
    navToggle.classList.add('active');
    navOverlay?.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeNav() {
    navLinks.classList.remove('active');
    navToggle.classList.remove('active');
    navOverlay?.classList.remove('active');
    document.body.style.overflow = '';
  }

  function toggleNav(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (navLinks.classList.contains('active')) {
      closeNav();
    } else {
      openNav();
    }
  }

  navToggle.addEventListener('click', toggleNav);

  // Close button inside the drawer
  navClose?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeNav();
  });

  // Overlay tap closes menu
  navOverlay?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeNav();
  });

  // Escape key closes menu
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeNav();
  });

  // Close nav on link click (mobile)
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeNav);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMobileNav);
} else {
  initMobileNav();
}

// --- Cart Badge ---
export function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  if (!badge) return;
  const count = getCartCount();
  badge.textContent = count;
  badge.setAttribute('data-count', count);
}

// Update badge on page load
updateCartBadge();

// Listen for cart changes (custom event)
window.addEventListener('cart-updated', updateCartBadge);

// --- Scroll Fade-In Animation ---
function initFadeIn() {
  const elements = document.querySelectorAll('.fade-in');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  elements.forEach(el => observer.observe(el));
}

initFadeIn();

// --- Toast Notifications ---
let toastContainer = document.querySelector('.toast-container');

export function showToast(message, type = 'success', duration = 3000) {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(40px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// --- Active Nav Link ---
const currentPath = window.location.pathname;
document.querySelectorAll('.nav-links a').forEach(link => {
  const href = link.getAttribute('href');
  if (href === currentPath || (href !== '/' && currentPath.startsWith(href))) {
    link.classList.add('active');
  } else if (href === '/' && (currentPath === '/' || currentPath === '/index.html')) {
    link.classList.add('active');
  }
});
