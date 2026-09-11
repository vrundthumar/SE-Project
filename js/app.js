/* ==========================================================================
   GTMS - GOODS TRANSPORT MANAGEMENT SYSTEM
   Main Application Entry Point & Bootstrapper
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Storage & Seed Data
  Storage.init();

  // 2. Initialize UI Controllers & Event Bindings
  UI.init();

  // 3. Bind Login Form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const user = document.getElementById('login-username').value;
      const pass = document.getElementById('login-password').value;
      const errBox = document.getElementById('login-error');

      if (errBox) errBox.innerText = '';

      const res = Auth.login(user, pass);
      if (res.success) {
        UI.switchView('dashboard');
        UI.showToast('Welcome back, Owner!', 'success');
      } else {
        if (errBox) errBox.innerText = res.message;
        UI.showToast(res.message, 'error');
      }
    });
  }

  // Password Visibility Toggle
  const togglePwdBtn = document.getElementById('btn-toggle-pwd');
  const pwdInput = document.getElementById('login-password');
  if (togglePwdBtn && pwdInput) {
    togglePwdBtn.addEventListener('click', () => {
      const isPassword = pwdInput.getAttribute('type') === 'password';
      pwdInput.setAttribute('type', isPassword ? 'text' : 'password');
      togglePwdBtn.innerHTML = isPassword ? '<i data-lucide="eye-off"></i>' : '<i data-lucide="eye"></i>';
      if (window.lucide) lucide.createIcons();
    });
  }

  // 4. Bind Module Forms
  const vehicleForm = document.getElementById('vehicle-form');
  if (vehicleForm) {
    vehicleForm.addEventListener('submit', (e) => Vehicles.saveForm(e));
  }

  const driverForm = document.getElementById('driver-form');
  if (driverForm) {
    driverForm.addEventListener('submit', (e) => Drivers.saveForm(e));
  }

  const tripForm = document.getElementById('trip-form');
  if (tripForm) {
    tripForm.addEventListener('submit', (e) => Trips.saveForm(e));
  }

  // 5. Initial Auth Check & View Routing
  if (Auth.isAuthenticated()) {
    UI.switchView('dashboard');
  } else {
    UI.switchView('login');
  }

  // 6. Global Icon Render
  if (window.lucide) {
    lucide.createIcons();
  }
});

// Helper for Demo Credentials Auto-Fill
function fillDemoCredentials() {
  document.getElementById('login-username').value = 'owner';
  document.getElementById('login-password').value = 'owner123';
}
