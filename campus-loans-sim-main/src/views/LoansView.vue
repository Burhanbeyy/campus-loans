<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { isAuthenticated, currentUser } from '@/stores/useAuth';
import { loans, initLoans, getUserLoans, returnLoan, checkAndMarkOverdue } from '@/stores/useLoans';
import { updateDeviceStatus } from '@/stores/useDevices';

const router = useRouter();

const loading = ref(false);
const error = ref<string | null>(null);
const success = ref<string | null>(null);
const filterStatus = ref('all');

const userLoans = computed(() => {
  const email = currentUser.value?.email;
  if (!email) return [];
  let result = getUserLoans(email);
  if (filterStatus.value !== 'all') {
    result = result.filter(l => l.status === filterStatus.value);
  }
  return result;
});

const counts = computed(() => ({
  all: getUserLoans(currentUser.value?.email || '').length,
  active: getUserLoans(currentUser.value?.email || '').filter(l => l.status === 'active').length,
  returned: getUserLoans(currentUser.value?.email || '').filter(l => l.status === 'returned').length,
  overdue: getUserLoans(currentUser.value?.email || '').filter(l => l.status === 'overdue').length,
}));

function getStatusColor(status: string): string {
  switch (status) {
    case 'active': return '#4caf50';
    case 'returned': return '#9e9e9e';
    case 'overdue': return '#f44336';
    default: return '#757575';
  }
}

function getStatusBg(status: string): string {
  switch (status) {
    case 'active': return '#e8f5e9';
    case 'returned': return '#f5f5f5';
    case 'overdue': return '#ffebee';
    default: return '#f5f5f5';
  }
}

async function handleReturn(loanId: string) {
  error.value = null;
  success.value = null;
  loading.value = true;

  try {
    const result = returnLoan(loanId);
    if (result.success) {
      success.value = 'Device returned successfully!';
      setTimeout(() => success.value = null, 3000);
    } else {
      error.value = result.error || 'Failed to return device.';
    }
  } catch (e) {
    console.error('Return error:', e);
    error.value = 'An unexpected error occurred. Please try again.';
  } finally {
    loading.value = false;
  }
}

function daysRemaining(dueDate: string): number {
  const due = new Date(dueDate);
  const today = new Date();
  const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

onMounted(() => {
  initLoans();
  checkAndMarkOverdue();
});
</script>

<template>
  <div class="loans-page">
    <div class="page-header">
      <div>
        <h1>📋 My Loans</h1>
        <p>Manage your borrowed devices</p>
      </div>
      <button class="btn-primary" @click="router.push('/devices')">
        <span>📱</span> Borrow Device
      </button>
    </div>

    <div v-if="!isAuthenticated" class="auth-prompt">
      <div class="auth-icon">🔐</div>
      <h3>Login Required</h3>
      <p>Please sign in to view your loans.</p>
      <button class="btn-primary" @click="router.push('/login')">Sign In</button>
    </div>

    <template v-else>
      <!-- Filter Tabs -->
      <div class="filter-tabs">
        <button
          v-for="tab in [
            { key: 'all', label: 'All', count: counts.all },
            { key: 'active', label: 'Active', count: counts.active },
            { key: 'returned', label: 'Returned', count: counts.returned },
            { key: 'overdue', label: 'Overdue', count: counts.overdue },
          ]"
          :key="tab.key"
          class="filter-tab"
          :class="{ active: filterStatus === tab.key }"
          @click="filterStatus = tab.key"
        >
          {{ tab.label }}
          <span class="tab-count" :class="tab.key">{{ tab.count }}</span>
        </button>
      </div>

      <!-- Alerts -->
      <div v-if="error" class="alert alert-error">
        <span>⚠️</span> {{ error }}
      </div>
      <div v-if="success" class="alert alert-success">
        <span>✅</span> {{ success }}
      </div>

      <!-- Loans List -->
      <div v-if="userLoans.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <h3>No Loans Found</h3>
        <p>You don't have any {{ filterStatus !== 'all' ? filterStatus : '' }} loans.</p>
        <button class="btn-primary" @click="router.push('/devices')">Browse Devices</button>
      </div>

      <div v-else class="loans-list">
        <div
          v-for="loan in userLoans"
          :key="loan.id"
          class="loan-card"
          :class="loan.status"
        >
          <div class="loan-main">
            <div class="loan-device-section">
              <div class="device-icon">📱</div>
              <div class="device-details">
                <div class="device-name">{{ loan.deviceName }}</div>
                <div class="device-meta">{{ loan.deviceBrand }} • {{ loan.deviceCategory }} • {{ loan.deviceId }}</div>
              </div>
            </div>

            <div class="loan-status-section">
              <span
                class="status-pill"
                :style="{ background: getStatusBg(loan.status), color: getStatusColor(loan.status) }"
              >
                {{ loan.status }}
              </span>
              <div v-if="loan.status === 'active'" class="days-left" :class="{ urgent: daysRemaining(loan.dueDate) <= 1 }">
                {{ daysRemaining(loan.dueDate) }} days left
              </div>
              <div v-if="loan.status === 'overdue'" class="days-left overdue">
                {{ Math.abs(daysRemaining(loan.dueDate)) }} days overdue
              </div>
            </div>
          </div>

          <div class="loan-dates">
            <div class="date-item">
              <span class="date-label">Borrowed</span>
              <span class="date-value">{{ loan.borrowDate }}</span>
            </div>
            <div class="date-item">
              <span class="date-label">Due Date</span>
              <span class="date-value" :class="{ overdue: loan.status === 'overdue' }">{{ loan.dueDate }}</span>
            </div>
            <div class="date-item">
              <span class="date-label">Loan ID</span>
              <span class="date-value id">{{ loan.id }}</span>
            </div>
          </div>

          <div v-if="loan.status === 'active' || loan.status === 'overdue'" class="loan-actions">
            <button
              class="return-btn"
              :disabled="loading"
              @click="handleReturn(loan.id)"
            >
              <span v-if="loading">⏳</span>
              <span v-else>↩️</span>
              {{ loading ? 'Processing...' : 'Return Device' }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.loans-page {
  max-width: 1000px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.btn-primary {
  padding: 12px 24px;
  background: linear-gradient(135deg, #3949ab 0%, #1a237e 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(26, 35, 126, 0.3);
}

/* Auth Prompt */
.auth-prompt {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}

.auth-icon {
  font-size: 4rem;
  margin-bottom: 16px;
}

.auth-prompt h3 {
  color: #2c3e50;
  margin-bottom: 8px;
}

.auth-prompt p {
  color: #666;
  margin-bottom: 20px;
}

/* Filter Tabs */
.filter-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.filter-tab {
  padding: 10px 18px;
  border-radius: 10px;
  border: 2px solid #e0e0e0;
  background: white;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  color: #555;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-tab:hover {
  border-color: #3949ab;
  color: #3949ab;
}

.filter-tab.active {
  background: linear-gradient(135deg, #3949ab 0%, #1a237e 100%);
  color: white;
  border-color: transparent;
}

.tab-count {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 700;
  background: rgba(0,0,0,0.1);
}

.tab-count.active { background: #e8f5e9; color: #2e7d32; }
.tab-count.returned { background: #eeeeee; color: #616161; }
.tab-count.overdue { background: #ffebee; color: #c62828; }

.filter-tab.active .tab-count {
  background: rgba(255,255,255,0.2);
  color: white;
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

/* Loans List */
.loans-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.loan-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  border-left: 5px solid #ccc;
  transition: all 0.2s;
}

.loan-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
}

.loan-card.active { border-left-color: #4caf50; }
.loan-card.returned { border-left-color: #9e9e9e; }
.loan-card.overdue { border-left-color: #f44336; background: #fff8f8; }

.loan-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
}

.loan-device-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.device-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: #e8eaf6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  flex-shrink: 0;
}

.device-name {
  font-size: 1.2rem;
  font-weight: 700;
  color: #2c3e50;
}

.device-meta {
  color: #888;
  font-size: 0.85rem;
  margin-top: 4px;
}

.loan-status-section {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.status-pill {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: capitalize;
}

.days-left {
  font-size: 0.85rem;
  color: #4caf50;
  font-weight: 600;
}

.days-left.urgent {
  color: #ff9800;
}

.days-left.overdue {
  color: #f44336;
}

/* Loan Dates */
.loan-dates {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
  padding: 16px;
  background: #fafafa;
  border-radius: 12px;
  margin-bottom: 16px;
}

.date-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.date-label {
  font-size: 0.8rem;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.date-value {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.95rem;
}

.date-value.id {
  font-family: monospace;
  font-size: 0.85rem;
}

.date-value.overdue {
  color: #f44336;
}

/* Loan Actions */
.loan-actions {
  display: flex;
  justify-content: flex-end;
}

.return-btn {
  padding: 10px 24px;
  background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
}

.return-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(76, 175, 80, 0.3);
}

.return-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
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

/* Responsive */
@media (max-width: 600px) {
  .loan-main {
    flex-direction: column;
  }

  .loan-status-section {
    align-items: flex-start;
  }

  .loan-dates {
    grid-template-columns: 1fr;
  }
}
</style>
