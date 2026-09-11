/* ==========================================================================
   GTMS - GOODS TRANSPORT MANAGEMENT SYSTEM
   Driver Registration & Management Module
   ========================================================================== */

const Drivers = {
  // Render Drivers Table & Mobile Cards
  render() {
    const drivers = Storage.getDrivers();
    const vehicles = Storage.getVehicles();

    const searchInput = document.getElementById('driver-search');
    const statusFilter = document.getElementById('driver-status-filter');

    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const selectedStatus = statusFilter ? statusFilter.value : 'All';

    // Map vehicles for lookup
    const vehicleMap = {};
    vehicles.forEach(v => { vehicleMap[v.id] = v; });

    // Filter Logic
    const filtered = drivers.filter(d => {
      const matchesSearch = d.name.toLowerCase().includes(searchTerm) ||
                            d.phone.includes(searchTerm) ||
                            d.licenseNumber.toLowerCase().includes(searchTerm) ||
                            d.id.toLowerCase().includes(searchTerm);

      const matchesStatus = selectedStatus === 'All' || d.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });

    const tbody = document.getElementById('drivers-table-body');
    const mobileContainer = document.getElementById('drivers-mobile-cards');
    const emptyState = document.getElementById('drivers-empty-state');

    if (!tbody || !mobileContainer) return;

    if (filtered.length === 0) {
      tbody.innerHTML = '';
      mobileContainer.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    // Desktop Table HTML
    tbody.innerHTML = filtered.map(d => {
      const vehicle = vehicleMap[d.vehicleId];
      const vehicleDisplay = vehicle ? `${vehicle.vehicleNumber} (${vehicle.type})` : '<span class="text-muted">Unassigned</span>';
      const badgeClass = this.getStatusBadgeClass(d.status);

      return `
        <tr>
          <td>
            <span class="cell-primary-text">${d.name}</span>
            <span class="cell-sub-text">${d.id}</span>
          </td>
          <td>${d.phone}</td>
          <td><code>${d.licenseNumber}</code></td>
          <td>${vehicleDisplay}</td>
          <td>
            <span class="badge ${badgeClass}">
              <span class="badge-dot"></span>${d.status}
            </span>
          </td>
          <td>
            <div class="action-buttons">
              <button class="btn-action-icon" onclick="Drivers.viewModal('${d.id}')" title="View Profile">
                <i data-lucide="eye"></i>
              </button>
              <button class="btn-action-icon" onclick="Drivers.editModal('${d.id}')" title="Edit Driver">
                <i data-lucide="edit"></i>
              </button>
              <button class="btn-action-icon delete-btn" onclick="Drivers.deleteModal('${d.id}')" title="Delete Driver">
                <i data-lucide="trash-2"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Mobile Cards HTML
    mobileContainer.innerHTML = filtered.map(d => {
      const vehicle = vehicleMap[d.vehicleId];
      const vehicleDisplay = vehicle ? vehicle.vehicleNumber : 'Unassigned';
      const badgeClass = this.getStatusBadgeClass(d.status);

      return `
        <div class="mobile-data-card">
          <div class="mobile-card-header">
            <div>
              <span class="cell-primary-text">${d.name}</span>
              <span class="cell-sub-text">${d.id} · ${d.phone}</span>
            </div>
            <span class="badge ${badgeClass}">${d.status}</span>
          </div>
          <div class="mobile-card-body">
            <div><strong>License:</strong> <code>${d.licenseNumber}</code></div>
            <div><strong>Assigned Vehicle:</strong> ${vehicleDisplay}</div>
          </div>
          <div class="mobile-card-footer">
            <button class="btn btn-secondary btn-sm" onclick="Drivers.viewModal('${d.id}')">View</button>
            <button class="btn btn-secondary btn-sm" onclick="Drivers.editModal('${d.id}')">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="Drivers.deleteModal('${d.id}')">Delete</button>
          </div>
        </div>
      `;
    }).join('');

    // Re-initialize Lucide Icons
    if (window.lucide) {
      lucide.createIcons();
    }
  },

  getStatusBadgeClass(status) {
    switch (status) {
      case 'Available': return 'badge-available';
      case 'On Trip': return 'badge-ontrip';
      case 'Inactive': return 'badge-danger';
      default: return 'badge-secondary';
    }
  },

  // Open Register Driver Modal
  openRegisterModal() {
    document.getElementById('driver-modal-title').innerText = 'Register Driver';
    document.getElementById('driver-modal-subtitle').innerText = 'Add a new driver to your logistics team.';
    document.getElementById('driver-form').reset();
    document.getElementById('driver-id-input').value = '';

    this.populateVehicleDropdown();
    UI.openModal('driver-modal');
  },

  // Populate vehicle dropdown (unassigned or current assigned)
  populateVehicleDropdown(selectedVehicleId = '') {
    const vehicles = Storage.getVehicles();
    const select = document.getElementById('driver-vehicle-select');
    if (!select) return;

    select.innerHTML = '<option value="">Unassigned</option>';
    vehicles.forEach(v => {
      const isAvailable = v.status === 'Available' || v.id === selectedVehicleId;
      if (isAvailable) {
        const option = document.createElement('option');
        option.value = v.id;
        option.textContent = `${v.vehicleNumber} (${v.type})`;
        if (v.id === selectedVehicleId) option.selected = true;
        select.appendChild(option);
      }
    });
  },

  // Save Driver (Register or Update)
  saveForm(e) {
    e.preventDefault();

    const idInput = document.getElementById('driver-id-input').value;
    const nameInput = document.getElementById('driver-name-input').value.trim();
    const phoneInput = document.getElementById('driver-phone-input').value.trim();
    const licenseInput = document.getElementById('driver-license-input').value.trim().toUpperCase();
    const addressInput = document.getElementById('driver-address-input').value.trim();
    const vehicleInput = document.getElementById('driver-vehicle-select').value || null;
    const statusInput = document.getElementById('driver-status-select').value;

    const errorBox = document.getElementById('driver-form-error');
    if (errorBox) errorBox.innerText = '';

    // Validations
    if (!nameInput) {
      if (errorBox) errorBox.innerText = 'Driver name is required.';
      return;
    }

    // Basic 10-digit phone check
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phoneInput)) {
      if (errorBox) errorBox.innerText = 'Please enter a valid 10-digit mobile number.';
      return;
    }

    if (!licenseInput) {
      if (errorBox) errorBox.innerText = 'Driving license number is required.';
      return;
    }

    if (!addressInput) {
      if (errorBox) errorBox.innerText = 'Driver address is required.';
      return;
    }

    const drivers = Storage.getDrivers();

    // Check duplicate license
    const duplicate = drivers.find(d => d.licenseNumber.toUpperCase() === licenseInput && d.id !== idInput);
    if (duplicate) {
      if (errorBox) errorBox.innerText = 'A driver with this license number already exists.';
      return;
    }

    if (idInput) {
      // Update Existing Driver
      const index = drivers.findIndex(d => d.id === idInput);
      if (index !== -1) {
        drivers[index] = {
          ...drivers[index],
          name: nameInput,
          phone: phoneInput,
          licenseNumber: licenseInput,
          address: addressInput,
          vehicleId: vehicleInput,
          status: statusInput
        };
        Storage.saveDrivers(drivers);
        Storage.addNotification('Driver Updated', `Driver ${nameInput} profile updated.`, 'info');
        Storage.addActivity(`Driver ${nameInput} profile updated`, 'user-check');
        UI.showToast('Driver details updated successfully.', 'success');
      }
    } else {
      // Register New Driver
      const newId = 'DRV-' + String(drivers.length + 101).padStart(3, '0');
      const newDriver = {
        id: newId,
        name: nameInput,
        phone: phoneInput,
        licenseNumber: licenseInput,
        address: addressInput,
        vehicleId: vehicleInput,
        status: statusInput || 'Available',
        createdAt: new Date().toISOString().split('T')[0]
      };
      drivers.push(newDriver);
      Storage.saveDrivers(drivers);
      Storage.addNotification('Driver Registered', `Driver ${nameInput} registered successfully.`, 'success');
      Storage.addActivity(`Driver ${nameInput} registered`, 'user-plus');
      UI.showToast('Driver registered successfully.', 'success');
    }

    UI.closeModal('driver-modal');
    this.render();
    Dashboard.render();
  },

  // View Driver Profile Modal
  viewModal(id) {
    const drivers = Storage.getDrivers();
    const vehicles = Storage.getVehicles();
    const d = drivers.find(item => item.id === id);
    if (!d) return;

    const vehicle = vehicles.find(v => v.id === d.vehicleId);

    const body = document.getElementById('view-detail-body');
    document.getElementById('view-modal-title').innerText = `Driver Profile: ${d.name}`;

    body.innerHTML = `
      <div class="detail-grid">
        <div class="detail-item"><label>Driver ID</label><span>${d.id}</span></div>
        <div class="detail-item"><label>Full Name</label><span>${d.name}</span></div>
        <div class="detail-item"><label>Mobile Phone</label><span>${d.phone}</span></div>
        <div class="detail-item"><label>Driving License</label><span><code>${d.licenseNumber}</code></span></div>
        <div class="detail-item"><label>Assigned Vehicle</label><span>${vehicle ? `${vehicle.vehicleNumber} (${vehicle.type})` : 'Unassigned'}</span></div>
        <div class="detail-item"><label>Availability Status</label><span><span class="badge ${this.getStatusBadgeClass(d.status)}">${d.status}</span></span></div>
        <div class="detail-item" style="grid-column: span 2"><label>Residential Address</label><span>${d.address}</span></div>
        <div class="detail-item"><label>Registration Date</label><span>${d.createdAt}</span></div>
      </div>
    `;

    UI.openModal('view-modal');
  },

  // Edit Driver Modal
  editModal(id) {
    const drivers = Storage.getDrivers();
    const d = drivers.find(item => item.id === id);
    if (!d) return;

    document.getElementById('driver-modal-title').innerText = 'Edit Driver Details';
    document.getElementById('driver-modal-subtitle').innerText = `Modify profile for ${d.name}`;

    document.getElementById('driver-id-input').value = d.id;
    document.getElementById('driver-name-input').value = d.name;
    document.getElementById('driver-phone-input').value = d.phone;
    document.getElementById('driver-license-input').value = d.licenseNumber;
    document.getElementById('driver-address-input').value = d.address;
    document.getElementById('driver-status-select').value = d.status;

    this.populateVehicleDropdown(d.vehicleId || '');
    UI.openModal('driver-modal');
  },

  // Delete Driver Modal with Protection Check
  deleteModal(id) {
    const drivers = Storage.getDrivers();
    const trips = Storage.getTrips();
    const d = drivers.find(item => item.id === id);
    if (!d) return;

    // Protection Check: Check if driver is assigned to active (Scheduled or In Transit) trip
    const activeTrip = trips.find(t => t.driverId === id && (t.status === 'Scheduled' || t.status === 'In Transit'));

    if (activeTrip) {
      UI.openConfirmModal({
        title: 'Cannot Delete Driver',
        message: `Driver ${d.name} is currently assigned to active trip ${activeTrip.id} (${activeTrip.source} → ${activeTrip.destination}). Complete or cancel the trip before deleting this driver.`,
        confirmText: 'Understood',
        isAlertOnly: true
      });
      return;
    }

    UI.openConfirmModal({
      title: 'Delete Driver?',
      message: `Are you sure you want to delete driver ${d.name}? This action cannot be undone.`,
      confirmText: 'Delete Driver',
      isDanger: true,
      onConfirm: () => {
        const updated = drivers.filter(item => item.id !== id);
        Storage.saveDrivers(updated);
        Storage.addNotification('Driver Deleted', `Driver ${d.name} removed from system.`, 'warning');
        Storage.addActivity(`Driver ${d.name} deleted`, 'user-minus');
        UI.showToast('Driver deleted successfully.', 'success');
        this.render();
        Dashboard.render();
      }
    });
  }
};
