import { supabase } from '../supabase-config.js';

export let session = null;
export let user = null;

async function checkAuth() {
  const { data } = await supabase.auth.getSession();
  session = data.session;
  user = session?.user || null;

  const isLoginPage = window.location.pathname.endsWith('/admin/') || window.location.pathname.endsWith('/admin/index.html');

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

  const links = document.querySelectorAll('.admin-nav a');
  links.forEach(link => {
    if (window.location.pathname.includes(link.getAttribute('href'))) {
      link.classList.add('active');
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

document.addEventListener('DOMContentLoaded', setupSidebar);
