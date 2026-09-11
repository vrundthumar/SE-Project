/* ==========================================================================
   GTMS - GOODS TRANSPORT MANAGEMENT SYSTEM
   Vehicle Registration & Management Module
   ========================================================================== */

const Vehicles = {
  // Render Vehicles Table & Mobile Cards
  render() {
    const vehicles = Storage.getVehicles();
    const drivers = Storage.getDrivers();
    const trips = Storage.getTrips();

    const searchInput = document.getElementById('vehicle-search');
    const statusFilter = document.getElementById('vehicle-status-filter');
    const typeFilter = document.getElementById('vehicle-type-filter');

    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const selectedStatus = statusFilter ? statusFilter.value : 'All';
    const selectedType = typeFilter ? typeFilter.value : 'All';

    // Map drivers for lookup
    const driverMap = {};
    drivers.forEach(d => { driverMap[d.id] = d; });

    // Filter Logic
    const filtered = vehicles.filter(v => {
      const driverObj = driverMap[v.driverId];
      const driverName = driverObj ? driverObj.name.toLowerCase() : 'unassigned';

      const matchesSearch = v.vehicleNumber.toLowerCase().includes(searchTerm) ||
                            v.type.toLowerCase().includes(searchTerm) ||
                            driverName.includes(searchTerm) ||
                            v.id.toLowerCase().includes(searchTerm);

      const matchesStatus = selectedStatus === 'All' || v.status === selectedStatus;
      const matchesType = selectedType === 'All' || v.type === selectedType;

      return matchesSearch && matchesStatus && matchesType;
    });

    const tbody = document.getElementById('vehicles-table-body');
    const mobileContainer = document.getElementById('vehicles-mobile-cards');
    const emptyState = document.getElementById('vehicles-empty-state');

    if (!tbody || !mobileContainer) return;

    if (filtered.length === 0) {
      tbody.innerHTML = '';
      mobileContainer.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    // Desktop Table HTML
    tbody.innerHTML = filtered.map(v => {
      const driver = driverMap[v.driverId];
      const driverDisplay = driver ? driver.name : '<span class="text-muted">Unassigned</span>';
      const badgeClass = this.getStatusBadgeClass(v.status);

      return `
        <tr>
          <td>
            <span class="cell-primary-text">${v.vehicleNumber}</span>
            <span class="cell-sub-text">${v.id}</span>
          </td>
          <td>${v.type}</td>
          <td>${v.capacity}</td>
          <td>${driverDisplay}</td>
          <td>
            <span class="badge ${badgeClass}">
              <span class="badge-dot"></span>${v.status}
            </span>
          </td>
          <td>
            <div class="action-buttons">
              <button class="btn-action-icon" onclick="Vehicles.viewModal('${v.id}')" title="View Details">
                <i data-lucide="eye"></i>
              </button>
              <button class="btn-action-icon" onclick="Vehicles.editModal('${v.id}')" title="Edit Vehicle">
                <i data-lucide="edit"></i>
              </button>
              <button class="btn-action-icon delete-btn" onclick="Vehicles.deleteModal('${v.id}')" title="Delete Vehicle">
                <i data-lucide="trash-2"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Mobile Cards HTML
    mobileContainer.innerHTML = filtered.map(v => {
      const driver = driverMap[v.driverId];
      const driverDisplay = driver ? driver.name : 'Unassigned';
      const badgeClass = this.getStatusBadgeClass(v.status);

      return `
        <div class="mobile-data-card">
          <div class="mobile-card-header">
            <div>
              <span class="cell-primary-text">${v.vehicleNumber}</span>
              <span class="cell-sub-text">${v.id} · ${v.type}</span>
            </div>
            <span class="badge ${badgeClass}">${v.status}</span>
          </div>
          <div class="mobile-card-body">
            <div><strong>Capacity:</strong> ${v.capacity}</div>
            <div><strong>Driver:</strong> ${driverDisplay}</div>
          </div>
          <div class="mobile-card-footer">
            <button class="btn btn-secondary btn-sm" onclick="Vehicles.viewModal('${v.id}')">View</button>
            <button class="btn btn-secondary btn-sm" onclick="Vehicles.editModal('${v.id}')">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="Vehicles.deleteModal('${v.id}')">Delete</button>
          </div>
        </div>
      `;
    }).join('');

    // Re-initialize Lucide Icons for dynamic content
    if (window.lucide) {
      lucide.createIcons();
    }
  },

  getStatusBadgeClass(status) {
    switch (status) {
      case 'Available': return 'badge-available';
      case 'On Trip': return 'badge-ontrip';
      case 'Maintenance': return 'badge-warning';
      default: return 'badge-secondary';
    }
  },

  // Open Register Modal
  openRegisterModal() {
    document.getElementById('vehicle-modal-title').innerText = 'Register Vehicle';
    document.getElementById('vehicle-modal-subtitle').innerText = 'Add a new vehicle to your transport fleet.';
    document.getElementById('vehicle-form').reset();
    document.getElementById('vehicle-id-input').value = '';

    this.populateDriverDropdown();
    UI.openModal('vehicle-modal');
  },

  // Populate driver dropdown (only unassigned or current assigned)
  populateDriverDropdown(selectedDriverId = '') {
    const drivers = Storage.getDrivers();
    const select = document.getElementById('vehicle-driver-select');
    if (!select) return;

    select.innerHTML = '<option value="">Unassigned</option>';
    drivers.forEach(d => {
      const isAvailable = d.status === 'Available' || d.id === selectedDriverId;
      if (isAvailable) {
        const option = document.createElement('option');
        option.value = d.id;
        option.textContent = `${d.name} (${d.phone})`;
        if (d.id === selectedDriverId) option.selected = true;
        select.appendChild(option);
      }
    });
  },

  // Save Vehicle (Register or Update)
  saveForm(e) {
    e.preventDefault();

    const idInput = document.getElementById('vehicle-id-input').value;
    const numberInput = document.getElementById('vehicle-number-input').value.trim().toUpperCase();
    const typeInput = document.getElementById('vehicle-type-select').value;
    const capacityInput = document.getElementById('vehicle-capacity-select').value;
    const driverInput = document.getElementById('vehicle-driver-select').value || null;
    const statusInput = document.getElementById('vehicle-status-select').value;

    const errorBox = document.getElementById('vehicle-form-error');
    if (errorBox) errorBox.innerText = '';

    // Form Validations
    if (!numberInput) {
      if (errorBox) errorBox.innerText = 'Vehicle registration number is required.';
      return;
    }
    if (!typeInput) {
      if (errorBox) errorBox.innerText = 'Please select a vehicle type.';
      return;
    }
    if (!capacityInput) {
      if (errorBox) errorBox.innerText = 'Please select capacity.';
      return;
    }

    const vehicles = Storage.getVehicles();

    // Check duplicate vehicle number (excluding current editing vehicle)
    const duplicate = vehicles.find(v => v.vehicleNumber.toUpperCase() === numberInput && v.id !== idInput);
    if (duplicate) {
      if (errorBox) errorBox.innerText = 'A vehicle with this registration number already exists.';
      return;
    }

    if (idInput) {
      // Update Existing Record
      const index = vehicles.findIndex(v => v.id === idInput);
      if (index !== -1) {
        vehicles[index] = {
          ...vehicles[index],
          vehicleNumber: numberInput,
          type: typeInput,
          capacity: capacityInput,
          driverId: driverInput,
          status: statusInput
        };
        Storage.saveVehicles(vehicles);
        Storage.addNotification('Vehicle Updated', `Vehicle ${numberInput} details updated.`, 'info');
        Storage.addActivity(`Vehicle ${numberInput} details updated`, 'truck');
        UI.showToast('Vehicle details updated successfully.', 'success');
      }
    } else {
      // Create New Record
      const newId = 'VEH-' + String(vehicles.length + 101).padStart(3, '0');
      const newVehicle = {
        id: newId,
        vehicleNumber: numberInput,
        type: typeInput,
        capacity: capacityInput,
        driverId: driverInput,
        status: statusInput || 'Available',
        registrationDate: new Date().toISOString().split('T')[0]
      };
      vehicles.push(newVehicle);
      Storage.saveVehicles(vehicles);
      Storage.addNotification('Vehicle Registered', `Vehicle ${numberInput} added to fleet.`, 'success');
      Storage.addActivity(`Vehicle ${numberInput} registered`, 'truck');
      UI.showToast('Vehicle registered successfully.', 'success');
    }

    UI.closeModal('vehicle-modal');
    this.render();
    Dashboard.render();
  },

  // View Vehicle Modal
  viewModal(id) {
    const vehicles = Storage.getVehicles();
    const drivers = Storage.getDrivers();
    const v = vehicles.find(item => item.id === id);
    if (!v) return;

    const driver = drivers.find(d => d.id === v.driverId);

    const body = document.getElementById('view-detail-body');
    document.getElementById('view-modal-title').innerText = `Vehicle: ${v.vehicleNumber}`;

    body.innerHTML = `
      <div class="detail-grid">
        <div class="detail-item"><label>Vehicle ID</label><span>${v.id}</span></div>
        <div class="detail-item"><label>Registration Number</label><span>${v.vehicleNumber}</span></div>
        <div class="detail-item"><label>Vehicle Type</label><span>${v.type}</span></div>
        <div class="detail-item"><label>Capacity</label><span>${v.capacity}</span></div>
        <div class="detail-item"><label>Assigned Driver</label><span>${driver ? driver.name : 'Unassigned'}</span></div>
        <div class="detail-item"><label>Current Status</label><span><span class="badge ${this.getStatusBadgeClass(v.status)}">${v.status}</span></span></div>
        <div class="detail-item"><label>Registration Date</label><span>${v.registrationDate}</span></div>
      </div>
    `;

    UI.openModal('view-modal');
  },

  // Edit Vehicle Modal
  editModal(id) {
    const vehicles = Storage.getVehicles();
    const v = vehicles.find(item => item.id === id);
    if (!v) return;

    document.getElementById('vehicle-modal-title').innerText = 'Edit Vehicle';
    document.getElementById('vehicle-modal-subtitle').innerText = `Modify details for ${v.vehicleNumber}`;

    document.getElementById('vehicle-id-input').value = v.id;
    document.getElementById('vehicle-number-input').value = v.vehicleNumber;
    document.getElementById('vehicle-type-select').value = v.type;
    document.getElementById('vehicle-capacity-select').value = v.capacity;
    document.getElementById('vehicle-status-select').value = v.status;

    this.populateDriverDropdown(v.driverId || '');
    UI.openModal('vehicle-modal');
  },

  // Delete Vehicle Modal with Protection Check
  deleteModal(id) {
    const vehicles = Storage.getVehicles();
    const trips = Storage.getTrips();
    const v = vehicles.find(item => item.id === id);
    if (!v) return;

    // Protection Check: Check if vehicle is assigned to active (Scheduled or In Transit) trip
    const activeTrip = trips.find(t => t.vehicleId === id && (t.status === 'Scheduled' || t.status === 'In Transit'));

    if (activeTrip) {
      UI.openConfirmModal({
        title: 'Cannot Delete Vehicle',
        message: `Vehicle ${v.vehicleNumber} is currently assigned to active trip ${activeTrip.id} (${activeTrip.source} → ${activeTrip.destination}). Please complete or cancel the trip before deleting this vehicle.`,
        confirmText: 'Understood',
        isAlertOnly: true
      });
      return;
    }

    UI.openConfirmModal({
      title: 'Delete Vehicle?',
      message: `Are you sure you want to delete vehicle ${v.vehicleNumber}? This action cannot be undone.`,
      confirmText: 'Delete Vehicle',
      isDanger: true,
      onConfirm: () => {
        const updated = vehicles.filter(item => item.id !== id);
        Storage.saveVehicles(updated);
        Storage.addNotification('Vehicle Deleted', `Vehicle ${v.vehicleNumber} deleted from fleet.`, 'warning');
        Storage.addActivity(`Vehicle ${v.vehicleNumber} deleted`, 'trash-2');
        UI.showToast('Vehicle deleted successfully.', 'success');
        this.render();
        Dashboard.render();
      }
    });
  }
};
