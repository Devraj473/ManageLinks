/**
 * ManageLinks - Single Page Router
 * Developer: Devraj Chauhan
 * Hash-based routing without full page reload
 */

export class Router {
  constructor(routes = {}) {
    this.routes = routes;
    this.currentRoute = null;
    this.currentParam = null;

    window.addEventListener('hashchange', () => this.handleRoute());
  }

  init() {
    this.handleRoute();
  }

  refresh() {
    const rawHash = window.location.hash.slice(1) || 'dashboard';
    const parts = rawHash.split('/');
    const route = parts[0] || 'dashboard';
    const param = parts[1] || null;

    this.currentRoute = route;
    this.currentParam = param;

    const handler = this.routes[route] || this.routes['dashboard'];
    if (typeof handler === 'function') {
      handler(param);
    }
  }

  navigate(hash) {
    window.location.hash = hash.startsWith('#') ? hash : `#${hash}`;
  }

  handleRoute() {
    const rawHash = window.location.hash.slice(1) || 'dashboard';
    const parts = rawHash.split('/');
    const route = parts[0] || 'dashboard';
    const param = parts[1] || null;

    this.currentRoute = route;
    this.currentParam = param;

    // Update active nav items in sidebar and bottom navigation
    this.updateActiveNav(route);

    // Call route handler
    const handler = this.routes[route] || this.routes['dashboard'];
    if (typeof handler === 'function') {
      handler(param);
    }

    // Scroll content to top
    window.scrollTo({ top: 0, behavior: 'instant' });

    window.dispatchEvent(new CustomEvent('ml-route-changed', {
      detail: { route, param }
    }));
  }

  updateActiveNav(route) {
    // Desktop sidebar
    document.querySelectorAll('#sidebar .nav-link-item').forEach(el => {
      const href = el.getAttribute('href') || '';
      if (href === `#${route}` || (route.startsWith('category') && href === '#categories') || (route.startsWith('folder') && href === '#folders') || (route.startsWith('collection') && href === '#collections')) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    // Mobile bottom nav
    document.querySelectorAll('#mobile-bottom-nav .mobile-nav-item').forEach(el => {
      const href = el.getAttribute('href') || '';
      if (href === `#${route}`) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });
  }
}
