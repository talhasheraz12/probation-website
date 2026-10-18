import { supabase } from '../supabase-config.js';

export let session = null;
export let user = null;

async function checkAuth() {
  const { data } = await supabase.auth.getSession();
  session = data.session;
  user = session?.user || null;

  const path = window.location.pathname;
  const isLoginPage = path.endsWith('/admin/') || path.endsWith('/admin/index.html') || path.endsWith('/admin');

  if (!session && !isLoginPage) {
    window.location.href = '/admin/';
    return;
  }
}

function setupSidebar() {
  const toggleBtn = document.querySelector('.admin-toggle');
  const sidebar = document.querySelector('.admin-sidebar');
  const overlay = document.querySelector('.admin-sidebar-overlay');
  const closeBtn = document.querySelector('.admin-sidebar-close');
  
  function openSidebar() {
    sidebar?.classList.add('active');
    overlay?.classList.add('active');
    if (window.innerWidth < 1024) document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    sidebar?.classList.remove('active');
    overlay?.classList.remove('active');
    document.body.style.overflow = '';
  }

  function toggleSidebar(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (sidebar?.classList.contains('active')) {
      closeSidebar();
    } else {
      openSidebar();
    }
  }
  
  toggleBtn?.addEventListener('click', toggleSidebar);
  closeBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeSidebar();
  });
  overlay?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeSidebar();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSidebar();
  });

  const currentPath = window.location.pathname.replace('.html', '');
  const links = document.querySelectorAll('.admin-nav a');
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href && href !== '#') {
      const cleanHref = href.replace('.html', '');
      if (currentPath.endsWith(cleanHref) || currentPath === cleanHref) {
        link.classList.add('active');
      }
    }
    
    if (link.id === 'logoutBtn') {
      link.addEventListener('click', async (e) => {
        e.preventDefault();
        await supabase.auth.signOut();
        window.location.href = '/admin/';
      });
    }
  });
}

await checkAuth();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupSidebar);
} else {
  setupSidebar();
}
