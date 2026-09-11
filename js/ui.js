/* ==========================================================================
   GTMS - GOODS TRANSPORT MANAGEMENT SYSTEM
   UI Controller (SPA Navigation, Modals, Toasts, Dropdowns & Theme)
   ========================================================================== */

const UI = {
  activeView: 'dashboard',
  confirmCallback: null,

  // Initialize UI Event Listeners
  init() {
    this.bindNavigation();
    this.bindDropdowns();
    this.bindTheme();
    this.bindSearchAndFilters();
  },

  // Switch SPA Views
  switchView(viewName) {
    if (!Auth.isAuthenticated() && viewName !== 'login') {
      this.switchView('login');
      return;
    }

    this.activeView = viewName;

    const views = document.querySelectorAll('.page-view');
    views.forEach(v => v.classList.add('hidden'));

    const loginWrapper = document.getElementById('login-view');
    const appLayout = document.getElementById('app-layout');

    if (viewName === 'login') {
      if (loginWrapper) loginWrapper.classList.remove('hidden');
      if (appLayout) appLayout.classList.add('hidden');
      return;
    }

    if (loginWrapper) loginWrapper.classList.add('hidden');
    if (appLayout) appLayout.classList.remove('hidden');

    const targetView = document.getElementById(`view-${viewName}`);
    if (targetView) targetView.classList.remove('hidden');

    // Update Nav Sidebar Links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      if (link.getAttribute('data-view') === viewName) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Update Page Header Titles
    const titleMap = {
      dashboard: { title: 'Dashboard', sub: 'Overview of your transport operations' },
      vehicles: { title: 'Vehicles', sub: 'Manage all vehicles in your transport fleet' },
      drivers: { title: 'Drivers', sub: 'Manage your drivers and their availability' },
      trips: { title: 'Trips', sub: 'Plan, assign and monitor goods transportation trips' }
    };

    const header = titleMap[viewName];
    if (header) {
      const topTitle = document.getElementById('topbar-page-title');
      const topSub = document.getElementById('topbar-page-sub');
      if (topTitle) topTitle.innerText = header.title;
      if (topSub) topSub.innerText = header.sub;
    }

    // Refresh Data Rendering
    if (viewName === 'dashboard') Dashboard.render();
    if (viewName === 'vehicles') Vehicles.render();
    if (viewName === 'drivers') Drivers.render();
    if (viewName === 'trips') Trips.render();

    // Close Mobile Drawer if open
    this.toggleMobileSidebar(false);
  },

  bindNavigation() {
    document.querySelectorAll('[data-view]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const view = item.getAttribute('data-view');
        this.switchView(view);
      });
    });
  },

  // Toggle Mobile Drawer
  toggleMobileSidebar(open) {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    if (open === undefined) {
      sidebar.classList.toggle('mobile-open');
    } else if (open) {
      sidebar.classList.add('mobile-open');
    } else {
      sidebar.classList.remove('mobile-open');
    }
  },

  // Dropdowns (Profile & Notifications)
  bindDropdowns() {
    const profileBtn = document.getElementById('btn-profile');
    const profileMenu = document.getElementById('profile-dropdown-menu');

    const notifBtn = document.getElementById('btn-notifications');
    const notifMenu = document.getElementById('notification-dropdown-menu');

    if (profileBtn && profileMenu) {
      profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (notifMenu) notifMenu.classList.add('hidden');
        profileMenu.classList.toggle('hidden');
      });
    }

    if (notifBtn && notifMenu) {
      notifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (profileMenu) profileMenu.classList.add('hidden');
        notifMenu.classList.toggle('hidden');
        this.renderNotifications();
      });
    }

    // Close dropdowns on outside click
    document.addEventListener('click', () => {
      if (profileMenu) profileMenu.classList.add('hidden');
      if (notifMenu) notifMenu.classList.add('hidden');
    });
  },

  // Render Notifications List
  renderNotifications() {
    const list = Storage.getNotifications();
    const container = document.getElementById('notification-list-container');
    const badge = document.getElementById('notif-badge');

    const unreadCount = list.filter(n => !n.read).length;

    if (badge) {
      if (unreadCount > 0) {
        badge.innerText = unreadCount;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }

    if (!container) return;

    if (list.length === 0) {
      container.innerHTML = '<div class="text-muted text-center" style="padding:1rem;">No notifications.</div>';
      return;
    }

    container.innerHTML = list.map(n => `
      <div class="notification-item ${!n.read ? 'unread' : ''}">
        <div class="notif-text">
          <strong>${n.title}</strong><br>${n.message}
          <div class="notif-time">${n.time}</div>
        </div>
      </div>
    `).join('');
  },

  markAllNotifsRead() {
    Storage.markNotificationsRead();
    this.renderNotifications();
  },

  // Modal Manager
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  },

  // Reusable Confirmation / Alert Modal
  openConfirmModal({ title, message, confirmText = 'Confirm', isDanger = false, isAlertOnly = false, onConfirm }) {
    document.getElementById('confirm-modal-title').innerText = title;
    document.getElementById('confirm-modal-message').innerText = message;

    const confirmBtn = document.getElementById('confirm-modal-action-btn');
    const cancelBtn = document.getElementById('confirm-modal-cancel-btn');

    confirmBtn.innerText = confirmText;

    if (isDanger) {
      confirmBtn.className = 'btn btn-danger';
    } else {
      confirmBtn.className = 'btn btn-primary';
    }

    if (isAlertOnly) {
      cancelBtn.classList.add('hidden');
    } else {
      cancelBtn.classList.remove('hidden');
    }

    this.confirmCallback = onConfirm || null;
    this.openModal('confirm-modal');
  },

  handleConfirmAction() {
    if (this.confirmCallback) {
      this.confirmCallback();
    }
    this.closeModal('confirm-modal');
  },

  // Toast Notification System
  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconName = 'check-circle';
    if (type === 'error') iconName = 'alert-circle';
    if (type === 'warning') iconName = 'alert-triangle';
    if (type === 'info') iconName = 'info';

    toast.innerHTML = `
      <div class="toast-icon"><i data-lucide="${iconName}"></i></div>
      <div class="toast-content">
        <div class="toast-title">${type.toUpperCase()}</div>
        <div class="toast-message">${message}</div>
      </div>
    `;

    container.appendChild(toast);

    if (window.lucide) lucide.createIcons();

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  },

  // Theme Manager
  bindTheme() {
    const currentTheme = Storage.getTheme();
    this.applyTheme(currentTheme);

    const themeBtn = document.getElementById('btn-theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const theme = Storage.getTheme() === 'dark' ? 'light' : 'dark';
        Storage.setTheme(theme);
        this.applyTheme(theme);
      });
    }
  },

  applyTheme(theme) {
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  },

  // Live Search & Filters Auto-Binding
  bindSearchAndFilters() {
    // Vehicles
    const vSearch = document.getElementById('vehicle-search');
    const vStatus = document.getElementById('vehicle-status-filter');
    const vType = document.getElementById('vehicle-type-filter');

    if (vSearch) vSearch.addEventListener('input', () => Vehicles.render());
    if (vStatus) vStatus.addEventListener('change', () => Vehicles.render());
    if (vType) vType.addEventListener('change', () => Vehicles.render());

    // Drivers
    const dSearch = document.getElementById('driver-search');
    const dStatus = document.getElementById('driver-status-filter');

    if (dSearch) dSearch.addEventListener('input', () => Drivers.render());
    if (dStatus) dStatus.addEventListener('change', () => Drivers.render());

    // Trips
    const tSearch = document.getElementById('trip-search');
    const tStatus = document.getElementById('trip-status-filter');

    if (tSearch) tSearch.addEventListener('input', () => Trips.render());
    if (tStatus) tStatus.addEventListener('change', () => Trips.render());
  },

  clearVehicleFilters() {
    document.getElementById('vehicle-search').value = '';
    document.getElementById('vehicle-status-filter').value = 'All';
    document.getElementById('vehicle-type-filter').value = 'All';
    Vehicles.render();
  },

  clearDriverFilters() {
    document.getElementById('driver-search').value = '';
    document.getElementById('driver-status-filter').value = 'All';
    Drivers.render();
  },

  clearTripFilters() {
    document.getElementById('trip-search').value = '';
    document.getElementById('trip-status-filter').value = 'All';
    Trips.render();
  },

  // Trigger Clear Data Modal
  triggerResetDemoModal() {
    this.openConfirmModal({
      title: 'Clear All Data?',
      message: 'This will remove all vehicles, drivers, trips, and activity records from local storage. Are you sure?',
      confirmText: 'Clear Data',
      isDanger: true,
      onConfirm: () => {
        Storage.clearAllData();
        this.showToast('All data cleared.', 'success');
        this.switchView(this.activeView);
      }
    });
  },

  // Trigger Logout Modal
  triggerLogoutModal() {
    this.openConfirmModal({
      title: 'Confirm Logout',
      message: 'Are you sure you want to logout of the Goods Transport Management System?',
      confirmText: 'Logout',
      isDanger: true,
      onConfirm: () => {
        Auth.logout();
        this.switchView('login');
        this.showToast('You have been logged out.', 'info');
      }
    });
  }
};
