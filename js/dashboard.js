/* ==========================================================================
   GTMS - GOODS TRANSPORT MANAGEMENT SYSTEM
   Dashboard Metrics & Overview Renderer
   ========================================================================== */

const Dashboard = {
  render() {
    this.renderGreeting();
    this.renderMetrics();
    this.renderVehicleAvailability();
    this.renderRecentTrips();
    this.renderRecentActivity();
  },

  // Dynamic Time-based Greeting
  renderGreeting() {
    const hour = new Date().getHours();
    let text = 'Good morning, Owner';
    if (hour >= 12 && hour < 17) {
      text = 'Good afternoon, Owner';
    } else if (hour >= 17) {
      text = 'Good evening, Owner';
    }

    const greetingEl = document.getElementById('dashboard-greeting');
    if (greetingEl) greetingEl.innerText = text;
  },

  // 4 Core Dynamic Metric Cards
  renderMetrics() {
    const vehicles = Storage.getVehicles();
    const drivers = Storage.getDrivers();
    const trips = Storage.getTrips();

    const availableVehicles = vehicles.filter(v => v.status === 'Available').length;
    const availableDrivers = drivers.filter(d => d.status === 'Available').length;
    const scheduledTrips = trips.filter(t => t.status === 'Scheduled').length;
    const activeTrips = trips.filter(t => t.status === 'In Transit').length;

    // Card 1: Total Vehicles
    const statVehicles = document.getElementById('stat-total-vehicles');
    const statVehiclesSub = document.getElementById('stat-total-vehicles-sub');
    if (statVehicles) statVehicles.innerText = vehicles.length;
    if (statVehiclesSub) statVehiclesSub.innerText = `${availableVehicles} available`;

    // Card 2: Total Drivers
    const statDrivers = document.getElementById('stat-total-drivers');
    const statDriversSub = document.getElementById('stat-total-drivers-sub');
    if (statDrivers) statDrivers.innerText = drivers.length;
    if (statDriversSub) statDriversSub.innerText = `${availableDrivers} available`;

    // Card 3: Total Trips
    const statTrips = document.getElementById('stat-total-trips');
    const statTripsSub = document.getElementById('stat-total-trips-sub');
    if (statTrips) statTrips.innerText = trips.length;
    if (statTripsSub) statTripsSub.innerText = `${scheduledTrips} scheduled`;

    // Card 4: Active Trips
    const statActive = document.getElementById('stat-active-trips');
    if (statActive) statActive.innerText = activeTrips;
  },

  // Vehicle Availability Breakdown Card
  renderVehicleAvailability() {
    const vehicles = Storage.getVehicles();
    const total = vehicles.length || 1;

    const availableCount = vehicles.filter(v => v.status === 'Available').length;
    const onTripCount = vehicles.filter(v => v.status === 'On Trip').length;
    const maintCount = vehicles.filter(v => v.status === 'Maintenance').length;

    const availPct = Math.round((availableCount / total) * 100);
    const onTripPct = Math.round((onTripCount / total) * 100);
    const maintPct = Math.round((maintCount / total) * 100);

    const barAvail = document.getElementById('bar-avail');
    const barOnTrip = document.getElementById('bar-ontrip');
    const barMaint = document.getElementById('bar-maint');

    if (barAvail) barAvail.style.width = `${availPct}%`;
    if (barOnTrip) barOnTrip.style.width = `${onTripPct}%`;
    if (barMaint) barMaint.style.width = `${maintPct}%`;

    const countAvail = document.getElementById('count-avail');
    const countOnTrip = document.getElementById('count-ontrip');
    const countMaint = document.getElementById('count-maint');

    if (countAvail) countAvail.innerText = availableCount;
    if (countOnTrip) countOnTrip.innerText = onTripCount;
    if (countMaint) countMaint.innerText = maintCount;
  },

  // Recent 5 Trips Table
  renderRecentTrips() {
    const trips = Storage.getTrips();
    const vehicles = Storage.getVehicles();
    const drivers = Storage.getDrivers();

    const vehicleMap = {};
    vehicles.forEach(v => { vehicleMap[v.id] = v; });

    const driverMap = {};
    drivers.forEach(d => { driverMap[d.id] = d; });

    const recent = trips.slice(-5).reverse();
    const tbody = document.getElementById('recent-trips-tbody');
    if (!tbody) return;

    if (recent.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted" style="padding:2rem;">No trips found.</td></tr>';
      return;
    }

    tbody.innerHTML = recent.map(t => {
      const v = vehicleMap[t.vehicleId];
      const d = driverMap[t.driverId];
      const badgeClass = Trips.getStatusBadgeClass(t.status);
      const formattedDate = Trips.formatDateDisplay(t.date);

      return `
        <tr>
          <td><strong>${t.id}</strong></td>
          <td>${t.source} → ${t.destination}</td>
          <td>${t.goods}</td>
          <td>${v ? v.vehicleNumber : 'N/A'}</td>
          <td>${d ? d.name : 'N/A'}</td>
          <td>${formattedDate}</td>
          <td><span class="badge ${badgeClass}"><span class="badge-dot"></span>${t.status}</span></td>
        </tr>
      `;
    }).join('');
  },

  // Recent 5 Activities
  renderRecentActivity() {
    const activities = Storage.getActivities().slice(0, 5);
    const container = document.getElementById('recent-activity-container');
    if (!container) return;

    if (activities.length === 0) {
      container.innerHTML = '<div class="text-muted text-center" style="padding:1rem;">No recent activities.</div>';
      return;
    }

    container.innerHTML = activities.map(act => `
      <div class="activity-item">
        <div class="activity-icon"><i data-lucide="${act.icon || 'activity'}"></i></div>
        <div class="activity-content">
          <div class="activity-text">${act.text}</div>
          <div class="activity-time">${act.time}</div>
        </div>
      </div>
    `).join('');

    if (window.lucide) {
      lucide.createIcons();
    }
  }
};
