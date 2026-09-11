/* ==========================================================================
   GTMS - GOODS TRANSPORT MANAGEMENT SYSTEM
   Trip Assigning, Monitoring & Status Synchronization Engine
   ========================================================================== */

const Trips = {
  // Render Trips Table & Mobile Cards
  render() {
    const trips = Storage.getTrips();
    const vehicles = Storage.getVehicles();
    const drivers = Storage.getDrivers();

    const searchInput = document.getElementById('trip-search');
    const statusFilter = document.getElementById('trip-status-filter');

    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const selectedStatus = statusFilter ? statusFilter.value : 'All';

    // Map lookups
    const vehicleMap = {};
    vehicles.forEach(v => { vehicleMap[v.id] = v; });

    const driverMap = {};
    drivers.forEach(d => { driverMap[d.id] = d; });

    // Filter Logic
    const filtered = trips.filter(t => {
      const vehicle = vehicleMap[t.vehicleId];
      const driver = driverMap[t.driverId];

      const vehicleNum = vehicle ? vehicle.vehicleNumber.toLowerCase() : '';
      const driverName = driver ? driver.name.toLowerCase() : '';

      const matchesSearch = t.id.toLowerCase().includes(searchTerm) ||
                            t.source.toLowerCase().includes(searchTerm) ||
                            t.destination.toLowerCase().includes(searchTerm) ||
                            t.goods.toLowerCase().includes(searchTerm) ||
                            vehicleNum.includes(searchTerm) ||
                            driverName.includes(searchTerm);

      const matchesStatus = selectedStatus === 'All' || t.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });

    const tbody = document.getElementById('trips-table-body');
    const mobileContainer = document.getElementById('trips-mobile-cards');
    const emptyState = document.getElementById('trips-empty-state');

    if (!tbody || !mobileContainer) return;

    if (filtered.length === 0) {
      tbody.innerHTML = '';
      mobileContainer.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    // Desktop Table HTML
    tbody.innerHTML = filtered.map(t => {
      const vehicle = vehicleMap[t.vehicleId];
      const driver = driverMap[t.driverId];
      const badgeClass = this.getStatusBadgeClass(t.status);
      const formattedDate = this.formatDateDisplay(t.date);

      return `
        <tr>
          <td>
            <span class="cell-primary-text">${t.id}</span>
            <span class="cell-sub-text">${t.goods}</span>
          </td>
          <td>
            <span class="cell-primary-text">${t.source} → ${t.destination}</span>
          </td>
          <td>${t.goods}</td>
          <td>
            <span class="cell-primary-text">${vehicle ? vehicle.vehicleNumber : 'N/A'}</span>
            <span class="cell-sub-text">${vehicle ? vehicle.type : ''}</span>
          </td>
          <td>
            <span class="cell-primary-text">${driver ? driver.name : 'N/A'}</span>
            <span class="cell-sub-text">${driver ? driver.phone : ''}</span>
          </td>
          <td>${formattedDate}</td>
          <td>
            <span class="badge ${badgeClass}">
              <span class="badge-dot"></span>${t.status}
            </span>
          </td>
          <td>
            <div class="action-buttons">
              <button class="btn-action-icon" onclick="Trips.viewModal('${t.id}')" title="View Details">
                <i data-lucide="eye"></i>
              </button>
              <button class="btn-action-icon" onclick="Trips.editModal('${t.id}')" title="Edit Trip">
                <i data-lucide="edit"></i>
              </button>
              <button class="btn-action-icon delete-btn" onclick="Trips.deleteModal('${t.id}')" title="Delete Trip">
                <i data-lucide="trash-2"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Mobile Cards HTML
    mobileContainer.innerHTML = filtered.map(t => {
      const vehicle = vehicleMap[t.vehicleId];
      const driver = driverMap[t.driverId];
      const badgeClass = this.getStatusBadgeClass(t.status);

      return `
        <div class="mobile-data-card">
          <div class="mobile-card-header">
            <div>
              <span class="cell-primary-text">${t.id} · ${t.source} → ${t.destination}</span>
              <span class="cell-sub-text">Goods: ${t.goods}</span>
            </div>
            <span class="badge ${badgeClass}">${t.status}</span>
          </div>
          <div class="mobile-card-body">
            <div><strong>Vehicle:</strong> ${vehicle ? vehicle.vehicleNumber : 'N/A'}</div>
            <div><strong>Driver:</strong> ${driver ? driver.name : 'N/A'}</div>
            <div><strong>Date:</strong> ${this.formatDateDisplay(t.date)}</div>
          </div>
          <div class="mobile-card-footer">
            <button class="btn btn-secondary btn-sm" onclick="Trips.viewModal('${t.id}')">View</button>
            <button class="btn btn-secondary btn-sm" onclick="Trips.editModal('${t.id}')">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="Trips.deleteModal('${t.id}')">Delete</button>
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
      case 'Scheduled': return 'badge-available';
      case 'In Transit': return 'badge-ontrip';
      case 'Delivered': return 'badge-delivered';
      case 'Cancelled': return 'badge-danger';
      default: return 'badge-secondary';
    }
  },

  formatDateDisplay(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${dateObj.getDate()} ${monthNames[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
  },

  // Open Assign Trip Modal
  openAssignModal() {
    document.getElementById('trip-modal-title').innerText = 'Assign New Trip';
    document.getElementById('trip-modal-subtitle').innerText = 'Assign a vehicle and driver to a new transportation trip.';
    document.getElementById('trip-form').reset();
    document.getElementById('trip-id-input').value = '';

    // Default trip date to today
    document.getElementById('trip-date-input').value = new Date().toISOString().split('T')[0];

    this.populateDropdowns();
    UI.openModal('trip-modal');
  },

  // Populate Vehicle and Driver Dropdowns (Filter ONLY Available units)
  populateDropdowns(currentVehicleId = '', currentDriverId = '') {
    const vehicles = Storage.getVehicles();
    const drivers = Storage.getDrivers();

    const vehicleSelect = document.getElementById('trip-vehicle-select');
    const driverSelect = document.getElementById('trip-driver-select');

    if (vehicleSelect) {
      vehicleSelect.innerHTML = '<option value="">Select Available Vehicle</option>';
      vehicles.forEach(v => {
        const isAvailable = v.status === 'Available' || v.id === currentVehicleId;
        if (isAvailable) {
          const opt = document.createElement('option');
          opt.value = v.id;
          opt.textContent = `${v.vehicleNumber} (${v.type} - ${v.capacity})`;
          if (v.id === currentVehicleId) opt.selected = true;
          vehicleSelect.appendChild(opt);
        }
      });
    }

    if (driverSelect) {
      driverSelect.innerHTML = '<option value="">Select Available Driver</option>';
      drivers.forEach(d => {
        const isAvailable = d.status === 'Available' || d.id === currentDriverId;
        if (isAvailable) {
          const opt = document.createElement('option');
          opt.value = d.id;
          opt.textContent = `${d.name} (${d.phone})`;
          if (d.id === currentDriverId) opt.selected = true;
          driverSelect.appendChild(opt);
        }
      });
    }
  },

  // Save Trip & Synchronize Vehicle + Driver Status
  saveForm(e) {
    e.preventDefault();

    const idInput = document.getElementById('trip-id-input').value;
    const sourceInput = document.getElementById('trip-source-input').value.trim();
    const destInput = document.getElementById('trip-dest-input').value.trim();
    const goodsInput = document.getElementById('trip-goods-input').value.trim();
    const vehicleInput = document.getElementById('trip-vehicle-select').value;
    const driverInput = document.getElementById('trip-driver-select').value;
    const dateInput = document.getElementById('trip-date-input').value;
    const statusInput = document.getElementById('trip-status-select').value;

    const errorBox = document.getElementById('trip-form-error');
    if (errorBox) errorBox.innerText = '';

    // Validations
    if (!sourceInput || !destInput) {
      if (errorBox) errorBox.innerText = 'Both source and destination locations are required.';
      return;
    }

    if (sourceInput.toLowerCase() === destInput.toLowerCase()) {
      if (errorBox) errorBox.innerText = 'Source and destination cannot be the same.';
      return;
    }

    if (!goodsInput) {
      if (errorBox) errorBox.innerText = 'Goods description is required.';
      return;
    }

    if (!vehicleInput) {
      if (errorBox) errorBox.innerText = 'Please select an available vehicle.';
      return;
    }

    if (!driverInput) {
      if (errorBox) errorBox.innerText = 'Please select an available driver.';
      return;
    }

    if (!dateInput) {
      if (errorBox) errorBox.innerText = 'Trip date is required.';
      return;
    }

    const trips = Storage.getTrips();
    const vehicles = Storage.getVehicles();
    const drivers = Storage.getDrivers();

    let oldTrip = null;
    if (idInput) {
      oldTrip = trips.find(t => t.id === idInput);
    }

    let tripId = idInput;
    if (!tripId) {
      tripId = 'TRP-' + String(trips.length + 1001);
    }

    const newTrip = {
      id: tripId,
      source: sourceInput,
      destination: destInput,
      goods: goodsInput,
      vehicleId: vehicleInput,
      driverId: driverInput,
      date: dateInput,
      status: statusInput,
      createdAt: oldTrip ? oldTrip.createdAt : new Date().toISOString().split('T')[0]
    };

    // Release old vehicle & driver if changing assignments
    if (oldTrip) {
      if (oldTrip.vehicleId !== vehicleInput) {
        this.updateEntityStatus('vehicle', oldTrip.vehicleId, 'Available', null);
      }
      if (oldTrip.driverId !== driverInput) {
        this.updateEntityStatus('driver', oldTrip.driverId, 'Available', null);
      }
    }

    // Save Trip Record
    if (idInput) {
      const idx = trips.findIndex(t => t.id === idInput);
      if (idx !== -1) trips[idx] = newTrip;
    } else {
      trips.push(newTrip);
    }
    Storage.saveTrips(trips);

    // Synchronize Vehicle and Driver Statuses
    this.syncStatusesForTrip(newTrip);

    if (idInput) {
      Storage.addNotification('Trip Updated', `Trip ${tripId} status set to ${statusInput}.`, 'info');
      Storage.addActivity(`Trip ${tripId} details updated`, 'route');
      UI.showToast('Trip details updated successfully.', 'success');
    } else {
      Storage.addNotification('Trip Assigned', `New trip ${tripId} assigned (${sourceInput} → ${destInput}).`, 'success');
      Storage.addActivity(`Trip ${tripId} assigned (${sourceInput} → ${destInput})`, 'route');
      UI.showToast('Trip assigned successfully.', 'success');
    }

    UI.closeModal('trip-modal');
    this.render();
    Vehicles.render();
    Drivers.render();
    Dashboard.render();
  },

  // Core Status Synchronization Engine
  syncStatusesForTrip(trip) {
    let targetStatus = 'Available';

    if (trip.status === 'In Transit') {
      targetStatus = 'On Trip';
    } else if (trip.status === 'Scheduled') {
      targetStatus = 'On Trip'; // Marked as assigned/on trip
    } else if (trip.status === 'Delivered' || trip.status === 'Cancelled') {
      targetStatus = 'Available';
    }

    this.updateEntityStatus('vehicle', trip.vehicleId, targetStatus, trip.driverId);
    this.updateEntityStatus('driver', trip.driverId, targetStatus, trip.vehicleId);
  },

  updateEntityStatus(entityType, id, status, linkedId) {
    if (!id) return;
    if (entityType === 'vehicle') {
      const vehicles = Storage.getVehicles();
      const idx = vehicles.findIndex(v => v.id === id);
      if (idx !== -1) {
        vehicles[idx].status = status;
        if (linkedId !== undefined) vehicles[idx].driverId = linkedId;
        Storage.saveVehicles(vehicles);
      }
    } else if (entityType === 'driver') {
      const drivers = Storage.getDrivers();
      const idx = drivers.findIndex(d => d.id === id);
      if (idx !== -1) {
        drivers[idx].status = status;
        if (linkedId !== undefined) drivers[idx].vehicleId = linkedId;
        Storage.saveDrivers(drivers);
      }
    }
  },

  // View Trip Modal
  viewModal(id) {
    const trips = Storage.getTrips();
    const vehicles = Storage.getVehicles();
    const drivers = Storage.getDrivers();
    const t = trips.find(item => item.id === id);
    if (!t) return;

    const v = vehicles.find(item => item.id === t.vehicleId);
    const d = drivers.find(item => item.id === t.driverId);

    const body = document.getElementById('view-detail-body');
    document.getElementById('view-modal-title').innerText = `Trip Details: ${t.id}`;

    body.innerHTML = `
      <div class="detail-grid">
        <div class="detail-item"><label>Trip ID</label><span>${t.id}</span></div>
        <div class="detail-item"><label>Trip Status</label><span><span class="badge ${this.getStatusBadgeClass(t.status)}">${t.status}</span></span></div>
        <div class="detail-item"><label>Source Origin</label><span>${t.source}</span></div>
        <div class="detail-item"><label>Destination</label><span>${t.destination}</span></div>
        <div class="detail-item" style="grid-column: span 2"><label>Goods Description</label><span>${t.goods}</span></div>
        <div class="detail-item"><label>Vehicle</label><span>${v ? `${v.vehicleNumber} (${v.type})` : 'N/A'}</span></div>
        <div class="detail-item"><label>Driver</label><span>${d ? `${d.name} (${d.phone})` : 'N/A'}</span></div>
        <div class="detail-item"><label>Scheduled Date</label><span>${this.formatDateDisplay(t.date)}</span></div>
        <div class="detail-item"><label>Created At</label><span>${t.createdAt}</span></div>
      </div>
    `;

    UI.openModal('view-modal');
  },

  // Edit Trip Modal
  editModal(id) {
    const trips = Storage.getTrips();
    const t = trips.find(item => item.id === id);
    if (!t) return;

    document.getElementById('trip-modal-title').innerText = 'Edit Trip Details';
    document.getElementById('trip-modal-subtitle').innerText = `Modify parameters for ${t.id}`;

    document.getElementById('trip-id-input').value = t.id;
    document.getElementById('trip-source-input').value = t.source;
    document.getElementById('trip-dest-input').value = t.destination;
    document.getElementById('trip-goods-input').value = t.goods;
    document.getElementById('trip-date-input').value = t.date;
    document.getElementById('trip-status-select').value = t.status;

    this.populateDropdowns(t.vehicleId, t.driverId);
    UI.openModal('trip-modal');
  },

  // Delete Trip Modal
  deleteModal(id) {
    const trips = Storage.getTrips();
    const t = trips.find(item => item.id === id);
    if (!t) return;

    UI.openConfirmModal({
      title: 'Delete Trip?',
      message: `Are you sure you want to delete trip ${t.id} (${t.source} → ${t.destination})? The assigned vehicle and driver will be released back to Available status.`,
      confirmText: 'Delete Trip',
      isDanger: true,
      onConfirm: () => {
        // Release vehicle and driver
        this.updateEntityStatus('vehicle', t.vehicleId, 'Available', null);
        this.updateEntityStatus('driver', t.driverId, 'Available', null);

        const updated = trips.filter(item => item.id !== id);
        Storage.saveTrips(updated);
        Storage.addNotification('Trip Deleted', `Trip ${t.id} removed.`, 'warning');
        Storage.addActivity(`Trip ${t.id} deleted`, 'trash-2');
        UI.showToast('Trip deleted successfully.', 'success');
        this.render();
        Vehicles.render();
        Drivers.render();
        Dashboard.render();
      }
    });
  }
};
