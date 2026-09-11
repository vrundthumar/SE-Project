/* ==========================================================================
   GTMS - GOODS TRANSPORT MANAGEMENT SYSTEM
   LocalStorage Data Layer & Seed Initialization
   ========================================================================== */

const STORAGE_KEYS = {
  AUTH: 'gtms_auth',
  VEHICLES: 'gtms_vehicles',
  DRIVERS: 'gtms_drivers',
  TRIPS: 'gtms_trips',
  NOTIFICATIONS: 'gtms_notifications',
  ACTIVITY: 'gtms_activity',
  INITIALIZED: 'gtms_initialized',
  THEME: 'gtms_theme'
};

// Empty default state: the app starts with no stored data.
// LocalStorage Helper API
const Storage = {
  // Initialization Check & Empty Data Setup
  init() {
    const isInitialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (!isInitialized) {
      this.clearAllData();
    }
  },

  // Reset to a blank data state
  clearAllData() {
    localStorage.removeItem(STORAGE_KEYS.AUTH);
    localStorage.removeItem(STORAGE_KEYS.THEME);
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  },

  // Backwards-compatible alias for any existing calls
  resetToDemoData() {
    this.clearAllData();
  },

  // Vehicles CRUD
  getVehicles() {
    const data = localStorage.getItem(STORAGE_KEYS.VEHICLES);
    return data ? JSON.parse(data) : [];
  },

  saveVehicles(vehicles) {
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(vehicles));
  },

  // Drivers CRUD
  getDrivers() {
    const data = localStorage.getItem(STORAGE_KEYS.DRIVERS);
    return data ? JSON.parse(data) : [];
  },

  saveDrivers(drivers) {
    localStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(drivers));
  },

  // Trips CRUD
  getTrips() {
    const data = localStorage.getItem(STORAGE_KEYS.TRIPS);
    return data ? JSON.parse(data) : [];
  },

  saveTrips(trips) {
    localStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(trips));
  },

  // Notifications API
  getNotifications() {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return data ? JSON.parse(data) : [];
  },

  saveNotifications(notifications) {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  },

  addNotification(title, message, type = 'info') {
    const list = this.getNotifications();
    const newNotif = {
      id: 'NOTIF-' + Date.now(),
      title,
      message,
      time: 'Just now',
      read: false,
      type
    };
    list.unshift(newNotif);
    this.saveNotifications(list);
  },

  markNotificationsRead() {
    const list = this.getNotifications().map(n => ({ ...n, read: true }));
    this.saveNotifications(list);
  },

  // Activity Stream API
  getActivities() {
    const data = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
    return data ? JSON.parse(data) : [];
  },

  addActivity(text, icon = 'activity') {
    const list = this.getActivities();
    const newAct = {
      id: 'ACT-' + Date.now(),
      text,
      time: 'Just now',
      icon
    };
    list.unshift(newAct);
    // Keep max 20 activity records
    if (list.length > 20) list.pop();
    localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(list));
  },

  // Auth State
  getAuth() {
    return localStorage.getItem(STORAGE_KEYS.AUTH) === 'true';
  },

  setAuth(status) {
    localStorage.setItem(STORAGE_KEYS.AUTH, status ? 'true' : 'false');
  },

  // Theme Preference
  getTheme() {
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
  },

  setTheme(theme) {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }
};
