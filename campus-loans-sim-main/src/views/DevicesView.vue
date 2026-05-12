<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { devices, initDevices, getDeviceById } from '@/stores/useDevices';
import { isAuthenticated, currentUser } from '@/stores/useAuth';
import { createLoan } from '@/stores/useLoans';
import type { Device } from '@/types';

const router = useRouter();

const searchQuery = ref('');
const selectedCategory = ref('All');
const selectedStatus = ref('All');
const sortBy = ref('name');
const loading = ref(false);
const error = ref<string | null>(null);
const success = ref<string | null>(null);

// Booking modal state
const showBookingModal = ref(false);
const selectedDevice = ref<Device | null>(null);
const borrowDate = ref('');
const returnDate = ref('');
const bookingLoading = ref(false);
const bookingError = ref<string | null>(null);

const categories = computed(() => {
  const cats = new Set(devices.value.map(d => d.category));
  return ['All', ...Array.from(cats).sort()];
});

const filteredDevices = computed(() => {
  let result = devices.value;

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.brand.toLowerCase().includes(q) ||
      d.id.toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q)
    );
  }

  if (selectedCategory.value !== 'All') {
    result = result.filter(d => d.category === selectedCategory.value);
  }

  if (selectedStatus.value !== 'All') {
    result = result.filter(d => d.status === selectedStatus.value.toLowerCase());
  }

  result = [...result].sort((a, b) => {
    if (sortBy.value === 'name') return a.name.localeCompare(b.name);
    if (sortBy.value === 'brand') return a.brand.localeCompare(b.brand);
    if (sortBy.value === 'status') return a.status.localeCompare(b.status);
    return 0;
  });

  return result;
});

const statusCounts = computed(() => ({
  available: devices.value.filter(d => d.status === 'available').length,
  loaned: devices.value.filter(d => d.status === 'loaned').length,
  maintenance: devices.value.filter(d => d.status === 'maintenance').length,
}));

function getStatusColor(status: string): string {
  switch (status) {
    case 'available': return '#4caf50';
    case 'loaned': return '#ff9800';
    case 'maintenance': return '#9e9e9e';
    default: return '#757575';
  }
}

function getStatusBg(status: string): string {
  switch (status) {
    case 'available': return '#e8f5e9';
    case 'loaned': return '#fff3e0';
    case 'maintenance': return '#f5f5f5';
    default: return '#f5f5f5';
  }
}

function openBooking(device: Device) {
  if (!isAuthenticated.value) {
    router.push(`/login?returnTo=${encodeURIComponent('/devices')}`);
    return;
  }
  if (device.status !== 'available') {
    error.value = `This device is currently ${device.status}.`;
    setTimeout(() => error.value = null, 3000);
    return;
  }

  selectedDevice.value = device;
  // Default dates: today + 3 days max
  const today = new Date();
  borrowDate.value = today.toISOString().split('T')[0];
  const maxReturn = new Date(today);
  maxReturn.setDate(maxReturn.getDate() + 3);
  returnDate.value = maxReturn.toISOString().split('T')[0];

  showBookingModal.value = true;
  bookingError.value = null;
}

function closeBooking() {
  showBookingModal.value = false;
  selectedDevice.value = null;
  bookingError.value = null;
}

function handleBooking() {
  bookingError.value = null;
  bookingLoading.value = true;

  try {
    if (!selectedDevice.value) return;

    const result = createLoan(
      selectedDevice.value.id,
      selectedDevice.value.name,
      selectedDevice.value.brand,
      selectedDevice.value.category,
      borrowDate.value,
      returnDate.value
    );

    if (result.success) {
      success.value = `Successfully booked ${selectedDevice.value.name}!`;
      closeBooking();
      setTimeout(() => success.value = null, 4000);
    } else {
      bookingError.value = result.error || 'Booking failed.';
    }
  } catch (e) {
    console.error('Booking error:', e);
    bookingError.value = 'An unexpected error occurred. Please try again.';
  } finally {
    bookingLoading.value = false;
  }
}

function setToday() {
  const today = new Date().toISOString().split('T')[0];
  borrowDate.value = today;
  const max = new Date();
  max.setDate(max.getDate() + 3);
  returnDate.value = max.toISOString().split('T')[0];
}

onMounted(() => {
  initDevices();
  setToday();
});
</script>

<template>
  <div class="devices-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1>📱 Device Catalog</h1>
        <p>Browse and reserve campus equipment</p>
      </div>
      <div class="header-stats">
        <div class="hstat">
          <span class="hstat-dot" style="background:#4caf50;"></span>
          <span>{{ statusCounts.available }} Available</span>
        </div>
        <div class="hstat">
          <span class="hstat-dot" style="background:#ff9800;"></span>
          <span>{{ statusCounts.loaned }} Loaned</span>
        </div>
        <div class="hstat">
          <span class="hstat-dot" style="background:#9e9e9e;"></span>
          <span>{{ statusCounts.maintenance }} Maint.</span>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input
          v-model="searchQuery"
          placeholder="Search by name, brand, ID, or category..."
          type="text"
        />
        <button v-if="searchQuery" class="clear-search" @click="searchQuery = ''">✕</button>
      </div>

      <div class="filter-group">
        <select v-model="selectedCategory" class="filter-select">
          <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
        <select v-model="selectedStatus" class="filter-select">
          <option value="All">All Status</option>
          <option value="Available">Available</option>
          <option value="Loaned">Loaned</option>
          <option value="Maintenance">Maintenance</option>
        </select>
        <select v-model="sortBy" class="filter-select">
          <option value="name">Sort by Name</option>
          <option value="brand">Sort by Brand</option>
          <option value="status">Sort by Status</option>
        </select>
      </div>
    </div>

    <!-- Alerts -->
    <div v-if="error" class="alert alert-error">
      <span>⚠️</span> {{ error }}
    </div>
    <div v-if="success" class="alert alert-success">
      <span>✅</span> {{ success }}
    </div>

    <!-- Devices Grid -->
    <div v-if="filteredDevices.length === 0" class="empty-state">
      <div class="empty-icon">🔍</div>
      <h3>No Devices Found</h3>
      <p>Try adjusting your search or filters.</p>
      <button class="btn-primary" @click="searchQuery = ''; selectedCategory = 'All'; selectedStatus = 'All'">
        Clear Filters
      </button>
    </div>

    <div v-else class="devices-grid">
      <div
        v-for="device in filteredDevices"
        :key="device.id"
        class="device-card"
        :class="device.status"
      >
        <div class="card-header">
          <div class="device-category">{{ device.category }}</div>
          <div
            class="device-status"
            :style="{ background: getStatusBg(device.status), color: getStatusColor(device.status) }"
          >
            {{ device.status }}
          </div>
        </div>

        <div class="device-title">
          <div class="device-name">{{ device.name }}</div>
          <div class="device-id">{{ device.id }}</div>
        </div>

        <div class="device-brand">
          <span class="brand-label">Brand:</span>
          <span class="brand-value">{{ device.brand }}</span>
        </div>

        <p class="device-desc">{{ device.description }}</p>

        <div class="device-specs">
          <span v-for="spec in device.specs" :key="spec" class="spec-tag">{{ spec }}</span>
        </div>

        <button
          class="book-btn"
          :class="{ available: device.status === 'available', disabled: device.status !== 'available' }"
          :disabled="device.status !== 'available'"
          @click="openBooking(device)"
        >
          <span v-if="device.status === 'available'">📅 Reserve Device</span>
          <span v-else-if="device.status === 'loaned'">⏳ Currently Loaned</span>
          <span v-else>🔧 Under Maintenance</span>
        </button>
      </div>
    </div>

    <!-- Booking Modal -->
    <div v-if="showBookingModal" class="modal-overlay" @click.self="closeBooking">
      <div class="modal-card">
        <div class="modal-header">
          <h2>📅 Reserve Device</h2>
          <button class="modal-close" @click="closeBooking">✕</button>
        </div>

        <div v-if="selectedDevice" class="modal-body">
          <div class="modal-device-info">
            <div class="modal-device-name">{{ selectedDevice.name }}</div>
            <div class="modal-device-meta">{{ selectedDevice.brand }} • {{ selectedDevice.id }}</div>
          </div>

          <div v-if="bookingError" class="alert alert-error">
            <span>⚠️</span> {{ bookingError }}
          </div>

          <div class="booking-rules">
            <div class="rule-item">
              <span class="rule-icon">⏱️</span>
              <span>Maximum loan period: <strong>3 days</strong></span>
            </div>
            <div class="rule-item">
              <span class="rule-icon">👤</span>
              <span>Borrowing as: <strong>{{ currentUser?.name }}</strong></span>
            </div>
          </div>

          <div class="form-group">
            <label>Borrow Date</label>
            <input
              v-model="borrowDate"
              type="date"
              :min="new Date().toISOString().split('T')[0]"
              class="date-input"
            />
          </div>

          <div class="form-group">
            <label>Return Date</label>
            <input
              v-model="returnDate"
              type="date"
              :min="borrowDate"
              class="date-input"
            />
            <small class="hint">
              Must be within 3 days of borrow date. Max return: {{ new Date(new Date(borrowDate).getTime() + 3*24*60*60*1000).toISOString().split('T')[0] }}
            </small>
          </div>

          <div class="modal-actions">
            <button class="btn-secondary" @click="closeBooking">Cancel</button>
            <button
              class="btn-primary"
              :disabled="bookingLoading"
              @click="handleBooking"
            >
              <span v-if="bookingLoading" class="spinner"></span>
              <span v-else>Confirm Reservation</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.devices-page {
  max-width: 1400px;
  margin: 0 auto;
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 28px;
  flex-wrap: wrap;
  gap: 16px;
}

.page-header h1 {
  font-size: 1.8rem;
  color: #1a237e;
  margin-bottom: 4px;
}

.page-header p {
  color: #666;
}

.header-stats {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.hstat {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  color: #555;
  background: white;
  padding: 8px 14px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.hstat-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

/* Filters */
.filters-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  align-items: center;
}

.search-box {
  flex: 1;
  min-width: 280px;
  position: relative;
}

.search-box input {
  width: 100%;
  padding: 12px 40px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 1rem;
  background: white;
  transition: all 0.2s;
}

.search-box input:focus {
  outline: none;
  border-color: #3949ab;
  box-shadow: 0 0 0 4px rgba(57, 73, 171, 0.1);
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1rem;
  opacity: 0.5;
}

.clear-search {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #888;
  font-size: 1rem;
  padding: 4px;
}

.filter-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-select {
  padding: 10px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  background: white;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-select:focus {
  outline: none;
  border-color: #3949ab;
}

/* Alerts */
.alert {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  border-radius: 10px;
  margin-bottom: 20px;
  font-size: 0.95rem;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.alert-error {
  background: #ffebee;
  color: #c62828;
  border-left: 4px solid #c62828;
}

.alert-success {
  background: #e8f5e9;
  color: #2e7d32;
  border-left: 4px solid #2e7d32;
}

/* Devices Grid */
.devices-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 24px;
}

.device-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  border: 2px solid transparent;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
}

.device-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(0,0,0,0.1);
}

.device-card.available {
  border-color: #e8f5e9;
}

.device-card.loaned {
  border-color: #fff3e0;
  opacity: 0.85;
}

.device-card.maintenance {
  border-color: #eeeeee;
  opacity: 0.7;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.device-category {
  font-size: 0.8rem;
  font-weight: 700;
  color: #3949ab;
  background: #e8eaf6;
  padding: 4px 12px;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.device-status {
  font-size: 0.8rem;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 20px;
  text-transform: capitalize;
}

.device-title {
  margin-bottom: 12px;
}

.device-name {
  font-size: 1.2rem;
  font-weight: 700;
  color: #2c3e50;
  line-height: 1.3;
}

.device-id {
  font-size: 0.85rem;
  color: #888;
  font-family: monospace;
  margin-top: 4px;
}

.device-brand {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
  font-size: 0.9rem;
}

.brand-label {
  color: #888;
}

.brand-value {
  color: #2c3e50;
  font-weight: 600;
}

.device-desc {
  color: #666;
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 16px;
  flex: 1;
}

.device-specs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 20px;
}

.spec-tag {
  font-size: 0.75rem;
  background: #f5f7fa;
  color: #555;
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: 500;
}

.book-btn {
  width: 100%;
  padding: 14px;
  border-radius: 10px;
  border: none;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.book-btn.available {
  background: linear-gradient(135deg, #3949ab 0%, #1a237e 100%);
  color: white;
}

.book-btn.available:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(26, 35, 126, 0.3);
}

.book-btn.disabled {
  background: #f5f5f5;
  color: #888;
  cursor: not-allowed;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: white;
  border-radius: 16px;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 16px;
}

.empty-state h3 {
  color: #2c3e50;
  margin-bottom: 8px;
}

.empty-state p {
  color: #666;
  margin-bottom: 20px;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
  animation: fadeIn 0.2s;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-card {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  animation: scaleIn 0.2s;
}

@keyframes scaleIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 28px;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  font-size: 1.3rem;
  color: #1a237e;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #888;
  padding: 4px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #f5f5f5;
  color: #333;
}

.modal-body {
  padding: 24px 28px;
}

.modal-device-info {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.modal-device-name {
  font-weight: 700;
  font-size: 1.1rem;
  color: #2c3e50;
}

.modal-device-meta {
  color: #666;
  font-size: 0.9rem;
  margin-top: 4px;
}

.booking-rules {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
  padding: 16px;
  background: #e8eaf6;
  border-radius: 12px;
}

.rule-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
  color: #333;
}

.rule-icon {
  font-size: 1.1rem;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: #2c3e50;
  font-size: 0.9rem;
}

.date-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 1rem;
  font-family: inherit;
  transition: all 0.2s;
}

.date-input:focus {
  outline: none;
  border-color: #3949ab;
  box-shadow: 0 0 0 4px rgba(57, 73, 171, 0.1);
}

.hint {
  display: block;
  color: #888;
  font-size: 0.8rem;
  margin-top: 6px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.modal-actions .btn-primary,
.modal-actions .btn-secondary {
  flex: 1;
  padding: 14px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  font-size: 0.95rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.modal-actions .btn-primary {
  background: linear-gradient(135deg, #3949ab 0%, #1a237e 100%);
  color: white;
}

.modal-actions .btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(26, 35, 126, 0.3);
}

.modal-actions .btn-secondary {
  background: #f5f5f5;
  color: #555;
}

.modal-actions .btn-secondary:hover {
  background: #e0e0e0;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 3px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 768px) {
  .devices-grid {
    grid-template-columns: 1fr;
  }

  .filters-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    min-width: auto;
  }

  .page-header {
    flex-direction: column;
  }

  .modal-actions {
    flex-direction: column;
  }
}
</style>
