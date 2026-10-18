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
  
  if (toggleBtn && sidebar && overlay) {
    const toggleSidebar = () => {
      sidebar.classList.toggle('active');
      overlay.classList.toggle('active');
    };
    
    toggleBtn.addEventListener('click', toggleSidebar);
    overlay.addEventListener('click', toggleSidebar);
  }

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
