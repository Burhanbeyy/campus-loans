<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { isAuthenticated, currentUser } from '@/stores/useAuth';
import { devices, initDevices } from '@/stores/useDevices';
import { loans, initLoans, getUserLoans, getOverdueLoans } from '@/stores/useLoans';

const router = useRouter();

const stats = computed(() => {
  const userEmail = currentUser.value?.email;
  return {
    totalDevices: devices.value.length,
    availableDevices: devices.value.filter(d => d.status === 'available').length,
    activeLoans: loans.value.filter(l => l.status === 'active').length,
    userLoans: userEmail ? loans.value.filter(l => l.studentEmail === userEmail && l.status === 'active').length : 0,
    overdueCount: getOverdueLoans().length,
  };
});

const recentUserLoans = computed(() => {
  const userEmail = currentUser.value?.email;
  if (!userEmail) return [];
  return loans.value
    .filter(l => l.studentEmail === userEmail)
    .slice(0, 5);
});

const quickDevices = computed(() => {
  return devices.value
    .filter(d => d.status === 'available')
    .slice(0, 4);
});

onMounted(() => {
  initDevices();
  initLoans();
});
</script>

<template>
  <div class="dashboard">
    <!-- Welcome Banner -->
    <div class="welcome-banner">
      <div class="welcome-content">
        <h1>👋 Welcome, {{ currentUser?.name || 'Guest' }}!</h1>
        <p>Manage your device loans and explore available campus equipment.</p>
      </div>
      <div class="welcome-actions">
        <button class="btn-primary" @click="router.push('/devices')">
          <span>📱</span> Browse Devices
        </button>
        <button class="btn-secondary" @click="router.push('/loans')">
          <span>📋</span> My Loans
        </button>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon" style="background: #e3f2fd; color: #1976d2;">📱</div>
        <div class="stat-info">
          <div class="stat-number">{{ stats.totalDevices }}</div>
          <div class="stat-label">Total Devices</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: #e8f5e9; color: #388e3c;">✅</div>
        <div class="stat-info">
          <div class="stat-number">{{ stats.availableDevices }}</div>
          <div class="stat-label">Available Now</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: #fff3e0; color: #f57c00;">📋</div>
        <div class="stat-info">
          <div class="stat-number">{{ stats.activeLoans }}</div>
          <div class="stat-label">Active Loans</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: #fce4ec; color: #c2185b;">📌</div>
        <div class="stat-info">
          <div class="stat-number">{{ stats.userLoans }}</div>
          <div class="stat-label">Your Loans</div>
        </div>
      </div>
      <div v-if="stats.overdueCount > 0" class="stat-card urgent">
        <div class="stat-icon" style="background: #ffebee; color: #d32f2f;">⚠️</div>
        <div class="stat-info">
          <div class="stat-number">{{ stats.overdueCount }}</div>
          <div class="stat-label">Overdue</div>
        </div>
      </div>
    </div>

    <!-- Two Column Layout -->
    <div class="dashboard-columns">
      <!-- Recent Loans -->
      <div class="dashboard-section">
        <div class="section-header">
          <h2>📋 Your Recent Loans</h2>
          <router-link to="/history" class="view-all">View All →</router-link>
        </div>

        <div v-if="!isAuthenticated" class="empty-state">
          <div class="empty-icon">🔐</div>
          <h3>Login Required</h3>
          <p>Sign in to see your loan history.</p>
          <button class="btn-primary" @click="router.push('/login')">Sign In</button>
        </div>

        <div v-else-if="recentUserLoans.length === 0" class="empty-state">
          <div class="empty-icon">📭</div>
          <h3>No Loans Yet</h3>
          <p>You haven't borrowed any devices yet.</p>
          <button class="btn-primary" @click="router.push('/devices')">Browse Devices</button>
        </div>

        <div v-else class="loan-list">
          <div
            v-for="loan in recentUserLoans"
            :key="loan.id"
            class="loan-item"
            :class="loan.status"
          >
            <div class="loan-device">
              <div class="device-name">{{ loan.deviceName }}</div>
              <div class="device-meta">{{ loan.deviceBrand }} • {{ loan.deviceCategory }}</div>
            </div>
            <div class="loan-dates">
              <div class="date-row">
                <span class="date-label">Borrowed:</span>
                <span>{{ loan.borrowDate }}</span>
              </div>
              <div class="date-row">
                <span class="date-label">Due:</span>
                <span :class="{ overdue: loan.status === 'overdue' }">{{ loan.dueDate }}</span>
              </div>
            </div>
            <span class="status-badge" :class="loan.status">{{ loan.status }}</span>
          </div>
        </div>
      </div>

      <!-- Quick Browse -->
      <div class="dashboard-section">
        <div class="section-header">
          <h2>📱 Available Now</h2>
          <router-link to="/devices" class="view-all">Browse All →</router-link>
        </div>

        <div v-if="quickDevices.length === 0" class="empty-state">
          <div class="empty-icon">😔</div>
          <h3>No Devices Available</h3>
          <p>All devices are currently on loan.</p>
        </div>

        <div v-else class="device-mini-grid">
          <div
            v-for="device in quickDevices"
            :key="device.id"
            class="device-mini-card"
            @click="router.push('/devices')"
          >
            <div class="mini-header">
              <span class="mini-category">{{ device.category }}</span>
              <span class="mini-status" :class="device.status">{{ device.status }}</span>
            </div>
            <div class="mini-name">{{ device.name }}</div>
            <div class="mini-brand">{{ device.brand }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
}

/* Welcome Banner */
.welcome-banner {
  background: linear-gradient(135deg, #1a237e 0%, #3949ab 50%, #5c6bc0 100%);
  border-radius: 20px;
  padding: 40px;
  color: white;
  margin-bottom: 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 24px;
}

.welcome-content h1 {
  font-size: 1.8rem;
  margin-bottom: 8px;
}

.welcome-content p {
  opacity: 0.9;
  font-size: 1.05rem;
}

.welcome-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-primary, .btn-secondary {
  padding: 12px 24px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  font-size: 0.95rem;
}

.btn-primary {
  background: white;
  color: #1a237e;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.2);
}

.btn-secondary {
  background: rgba(255,255,255,0.15);
  color: white;
  border: 1px solid rgba(255,255,255,0.3);
}

.btn-secondary:hover {
  background: rgba(255,255,255,0.25);
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-3px);
}

.stat-card.urgent {
  border: 2px solid #ef5350;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 83, 80, 0.2); }
  50% { box-shadow: 0 0 0 8px rgba(239, 83, 80, 0); }
}

.stat-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.stat-number {
  font-size: 1.8rem;
  font-weight: 700;
  color: #2c3e50;
  line-height: 1.2;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
  margin-top: 2px;
}

/* Dashboard Columns */
.dashboard-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.dashboard-section {
  background: white;
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  font-size: 1.2rem;
  color: #2c3e50;
}

.view-all {
  color: #3949ab;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
}

.view-all:hover {
  text-decoration: underline;
}

/* Loan List */
.loan-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.loan-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 12px;
  background: #fafafa;
  border-left: 4px solid #ccc;
  transition: all 0.2s;
}

.loan-item:hover {
  background: #f5f5f5;
}

.loan-item.active { border-left-color: #4caf50; }
.loan-item.returned { border-left-color: #9e9e9e; }
.loan-item.overdue { border-left-color: #f44336; background: #ffebee; }

.loan-device {
  flex: 1;
  min-width: 0;
}

.device-name {
  font-weight: 600;
  color: #2c3e50;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.device-meta {
  font-size: 0.8rem;
  color: #888;
  margin-top: 2px;
}

.loan-dates {
  font-size: 0.8rem;
  color: #666;
  min-width: 140px;
}

.date-row {
  display: flex;
  gap: 6px;
}

.date-label {
  color: #888;
  min-width: 60px;
}

.overdue {
  color: #d32f2f;
  font-weight: 600;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
  flex-shrink: 0;
}

.status-badge.active { background: #e8f5e9; color: #2e7d32; }
.status-badge.returned { background: #eeeeee; color: #616161; }
.status-badge.overdue { background: #ffebee; color: #c62828; }

/* Device Mini Grid */
.device-mini-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.device-mini-card {
  padding: 16px;
  border-radius: 12px;
  background: #fafafa;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.device-mini-card:hover {
  border-color: #3949ab;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(57, 73, 171, 0.15);
}

.mini-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.mini-category {
  font-size: 0.75rem;
  color: #3949ab;
  background: #e8eaf6;
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 600;
}

.mini-status {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}

.mini-status.available { background: #e8f5e9; color: #2e7d32; }

.mini-name {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
  line-height: 1.3;
}

.mini-brand {
  font-size: 0.8rem;
  color: #888;
  margin-top: 4px;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 12px;
}

.empty-state h3 {
  color: #2c3e50;
  margin-bottom: 8px;
}

.empty-state p {
  margin-bottom: 16px;
  font-size: 0.95rem;
}

/* Responsive */
@media (max-width: 900px) {
  .dashboard-columns {
    grid-template-columns: 1fr;
  }

  .welcome-banner {
    flex-direction: column;
    text-align: center;
  }
}

@media (max-width: 600px) {
  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }

  .loan-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
