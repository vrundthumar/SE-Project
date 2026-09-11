/* ==========================================================================
   GTMS - GOODS TRANSPORT MANAGEMENT SYSTEM
   Authentication Module (Owner Login & Auth Guards)
   ========================================================================== */

const Auth = {
  // Validate credentials & initiate session
  login(username, password) {
    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      return { success: false, message: 'Please enter both username and password.' };
    }

    if (cleanUser === 'owner' && cleanPass === 'owner123') {
      Storage.setAuth(true);
      Storage.addActivity('Owner logged into GTMS dashboard', 'log-in');
      return { success: true };
    } else {
      return { success: false, message: 'Invalid username or password.' };
    }
  },

  // Terminate session
  logout() {
    Storage.setAuth(false);
    Storage.addActivity('Owner logged out', 'log-out');
  },

  // Check auth state
  isAuthenticated() {
    return Storage.getAuth();
  }
};
