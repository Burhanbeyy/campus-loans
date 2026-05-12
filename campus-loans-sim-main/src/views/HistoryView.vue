<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { isAuthenticated, currentUser } from '@/stores/useAuth';
import { loans, initLoans, getUserLoans, checkAndMarkOverdue } from '@/stores/useLoans';

const router = useRouter();

const searchQuery = ref('');
const sortBy = ref('date-desc');

const userLoans = computed(() => {
  const email = currentUser.value?.email;
  if (!email) return [];

  let result = getUserLoans(email);

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(l =>
      l.deviceName.toLowerCase().includes(q) ||
      l.deviceBrand.toLowerCase().includes(q) ||
      l.deviceId.toLowerCase().includes(q) ||
      l.deviceCategory.toLowerCase().includes(q)
    );
  }

  result = [...result].sort((a, b) => {
    if (sortBy.value === 'date-desc') return new Date(b.borrowDate).getTime() - new Date(a.borrowDate).getTime();
    if (sortBy.value === 'date-asc') return new Date(a.borrowDate).getTime() - new Date(b.borrowDate).getTime();
    if (sortBy.value === 'name') return a.deviceName.localeCompare(b.deviceName);
    if (sortBy.value === 'status') return a.status.localeCompare(b.status);
    return 0;
  });

  return result;
});

const stats = computed(() => {
  const all = userLoans.value;
  return {
    total: all.length,
    active: all.filter(l => l.status === 'active').length,
    returned: all.filter(l => l.status === 'returned').length,
    overdue: all.filter(l => l.status === 'overdue').length,
  };
});

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

onMounted(() => {
  initLoans();
  checkAndMarkOverdue();
});
</script>

<template>
  <div class="history-page">
    <div class="page-header">
      <div>
        <h1>📜 Loan History</h1>
        <p>Complete record of all your device loans</p>
      </div>
      <div class="stats-row">
        <div class="mini-stat">
          <span class="mini-number">{{ stats.total }}</span>
          <span class="mini-label">Total</span>
        </div>
        <div class="mini-stat">
          <span class="mini-number" style="color:#4caf50;">{{ stats.active }}</span>
          <span class="mini-label">Active</span>
        </div>
        <div class="mini-stat">
          <span class="mini-number" style="color:#9e9e9e;">{{ stats.returned }}</span>
          <span class="mini-label">Returned</span>
        </div>
        <div class="mini-stat">
          <span class="mini-number" style="color:#f44336;">{{ stats.overdue }}</span>
          <span class="mini-label">Overdue</span>
        </div>
      </div>
    </div>

    <div v-if="!isAuthenticated" class="auth-prompt">
      <div class="auth-icon">🔐</div>
      <h3>Login Required</h3>
      <p>Please sign in to view your loan history.</p>
      <button class="btn-primary" @click="router.push('/login')">Sign In</button>
    </div>

    <template v-else>
      <!-- Controls -->
      <div class="controls-bar">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            v-model="searchQuery"
            placeholder="Search history..."
            type="text"
          />
          <button v-if="searchQuery" class="clear-search" @click="searchQuery = ''">✕</button>
        </div>
        <select v-model="sortBy" class="sort-select">
          <option value="date-desc">Newest First</option>
          <option value="date-asc">Oldest First</option>
          <option value="name">Device Name</option>
          <option value="status">Status</option>
        </select>
      </div>

      <!-- History Table -->
      <div v-if="userLoans.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <h3>No History Yet</h3>
        <p>You haven't borrowed any devices.</p>
        <button class="btn-primary" @click="router.push('/devices')">Browse Devices</button>
      </div>

      <div v-else class="history-table-wrapper">
        <table class="history-table">
          <thead>
            <tr>
              <th>Device</th>
              <th>Category</th>
              <th>Borrowed</th>
              <th>Due</th>
              <th>Returned</th>
              <th>Status</th>
              <th>Loan ID</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="loan in userLoans"
              :key="loan.id"
              :class="loan.status"
            >
              <td class="cell-device">
                <div class="device-cell">
                  <div class="device-icon-small">📱</div>
                  <div>
                    <div class="device-cell-name">{{ loan.deviceName }}</div>
                    <div class="device-cell-brand">{{ loan.deviceBrand }}</div>
                  </div>
                </div>
              </td>
              <td class="cell-category">
                <span class="category-tag">{{ loan.deviceCategory }}</span>
              </td>
              <td class="cell-date">{{ loan.borrowDate }}</td>
              <td class="cell-date">{{ loan.dueDate }}</td>
              <td class="cell-date">
                <span v-if="loan.status === 'returned'" class="returned-date">{{ loan.dueDate }}</span>
                <span v-else class="pending">—</span>
              </td>
              <td class="cell-status">
                <span
                  class="status-pill"
                  :style="{ background: getStatusBg(loan.status), color: getStatusColor(loan.status) }"
                >
                  {{ loan.status }}
                </span>
              </td>
              <td class="cell-id">
                <code>{{ loan.id }}</code>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<style scoped>
.history-page {
  max-width: 1200px;
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

.stats-row {
  display: flex;
  gap: 20px;
}

.mini-stat {
  text-align: center;
  background: white;
  padding: 12px 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  min-width: 70px;
}

.mini-number {
  display: block;
  font-size: 1.6rem;
  font-weight: 700;
  color: #2c3e50;
}

.mini-label {
  font-size: 0.8rem;
  color: #888;
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

.btn-primary {
  padding: 12px 24px;
  background: linear-gradient(135deg, #3949ab 0%, #1a237e 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.95rem;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(26, 35, 126, 0.3);
}

/* Controls */
.controls-bar {
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

.sort-select {
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  background: white;
  font-size: 0.95rem;
  cursor: pointer;
  min-width: 160px;
}

.sort-select:focus {
  outline: none;
  border-color: #3949ab;
}

/* History Table */
.history-table-wrapper {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  overflow: hidden;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

.history-table th {
  background: #f8f9fa;
  padding: 16px;
  text-align: left;
  font-weight: 600;
  color: #555;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #e0e0e0;
}

.history-table td {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  vertical-align: middle;
}

.history-table tbody tr {
  transition: background 0.2s;
}

.history-table tbody tr:hover {
  background: #fafafa;
}

.history-table tbody tr.active {
  background: #f8fff8;
}

.history-table tbody tr.overdue {
  background: #fff8f8;
}

.cell-device {
  min-width: 200px;
}

.device-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.device-icon-small {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #e8eaf6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.device-cell-name {
  font-weight: 600;
  color: #2c3e50;
}

.device-cell-brand {
  font-size: 0.8rem;
  color: #888;
  margin-top: 2px;
}

.category-tag {
  font-size: 0.8rem;
  background: #e8eaf6;
  color: #3949ab;
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: 600;
}

.cell-date {
  color: #555;
  font-size: 0.9rem;
  white-space: nowrap;
}

.returned-date {
  color: #4caf50;
  font-weight: 600;
}

.pending {
  color: #bbb;
}

.status-pill {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: capitalize;
  white-space: nowrap;
}

.cell-id code {
  font-family: monospace;
  font-size: 0.8rem;
  background: #f5f5f5;
  padding: 4px 8px;
  border-radius: 6px;
  color: #666;
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
@media (max-width: 900px) {
  .history-table-wrapper {
    overflow-x: auto;
  }

  .history-table {
    min-width: 800px;
  }

  .stats-row {
    width: 100%;
    justify-content: space-between;
  }
}

@media (max-width: 600px) {
  .controls-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    min-width: auto;
  }

  .sort-select {
    width: 100%;
  }
}
</style>
