<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { isAuthenticated, currentUser, logout } from '@/stores/useAuth';
import { checkAndMarkOverdue } from '@/stores/useLoans';

const router = useRouter();
const route = useRoute();

const mobileMenuOpen = ref(false);

const navLinks = computed(() => [
  { to: '/', label: 'Dashboard', icon: '📊', auth: true },
  { to: '/devices', label: 'Devices', icon: '📱', auth: false },
  { to: '/loans', label: 'My Loans', icon: '📋', auth: true },
  { to: '/history', label: 'History', icon: '📜', auth: true },
]);

const visibleLinks = computed(() => {
  return navLinks.value.filter(link => !link.auth || isAuthenticated.value);
});

function handleLogout() {
  try {
    logout();
    router.push('/login');
  } catch (e) {
    console.error('Logout error:', e);
  }
}

function isActive(path: string): boolean {
  return route.path === path;
}

onMounted(() => {
  checkAndMarkOverdue();
});
</script>

<template>
  <div class="app">
    <!-- Navigation -->
    <nav class="navbar">
      <div class="nav-container">
        <div class="nav-brand">
          <span class="brand-icon">📚</span>
          <span class="brand-text">Campus Loans</span>
        </div>

        <button class="mobile-toggle" @click="mobileMenuOpen = !mobileMenuOpen">
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div class="nav-links" :class="{ open: mobileMenuOpen }">
          <router-link
            v-for="link in visibleLinks"
            :key="link.to"
            :to="link.to"
            class="nav-link"
            :class="{ active: isActive(link.to) }"
            @click="mobileMenuOpen = false"
          >
            <span class="nav-icon">{{ link.icon }}</span>
            <span>{{ link.label }}</span>
          </router-link>

          <div v-if="isAuthenticated" class="user-menu">
            <div class="user-info">
              <span class="user-avatar">{{ currentUser?.name?.charAt(0) || '?' }}</span>
              <span class="user-name">{{ currentUser?.name }}</span>
            </div>
            <button class="logout-btn" @click="handleLogout">
              <span>🚪</span> Logout
            </button>
          </div>

          <router-link v-else to="/login" class="nav-link login-link">
            <span class="nav-icon">🔐</span>
            <span>Login</span>
          </router-link>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="main-content">
      <router-view />
    </main>

    <!-- Footer -->
    <footer class="app-footer">
      <div class="footer-content">
        <span>🏫 Campus Device Loan System</span>
        <span class="footer-sep">|</span>
        <span>Frontend Simulation</span>
        <span class="footer-sep">|</span>
        <span class="footer-local">localhost:5173</span>
      </div>
    </footer>
  </div>
</template>

<style>
/* CSS Reset & Base */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  background: #f5f7fa;
  color: #2c3e50;
  line-height: 1.6;
}

/* Navbar */
.navbar {
  background: linear-gradient(135deg, #1a237e 0%, #283593 50%, #3949ab 100%);
  box-shadow: 0 2px 20px rgba(26, 35, 126, 0.3);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.nav-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  color: white;
  font-weight: 700;
  font-size: 1.3rem;
  text-decoration: none;
}

.brand-icon {
  font-size: 1.5rem;
}

.mobile-toggle {
  display: none;
  flex-direction: column;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
}

.mobile-toggle span {
  width: 24px;
  height: 3px;
  background: white;
  border-radius: 2px;
  transition: 0.3s;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  color: rgba(255,255,255,0.85);
  text-decoration: none;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.nav-link:hover {
  background: rgba(255,255,255,0.1);
  color: white;
}

.nav-link.active {
  background: rgba(255,255,255,0.15);
  color: white;
}

.nav-icon {
  font-size: 1.1rem;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: 16px;
  padding-left: 16px;
  border-left: 1px solid rgba(255,255,255,0.2);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
}

.user-name {
  font-size: 0.9rem;
  font-weight: 500;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  color: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: rgba(255,255,255,0.2);
}

.login-link {
  background: rgba(255,255,255,0.15);
  margin-left: 8px;
}

.login-link:hover {
  background: rgba(255,255,255,0.25);
}

/* Main Content */
.main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px 24px;
  min-height: calc(100vh - 64px - 48px);
}

/* Footer */
.app-footer {
  background: #1a237e;
  color: rgba(255,255,255,0.7);
  padding: 14px 24px;
  font-size: 0.85rem;
}

.footer-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.footer-sep {
  opacity: 0.4;
}

.footer-local {
  font-family: monospace;
  background: rgba(255,255,255,0.1);
  padding: 2px 8px;
  border-radius: 4px;
}

/* Responsive */
@media (max-width: 768px) {
  .mobile-toggle {
    display: flex;
  }

  .nav-links {
    position: fixed;
    top: 64px;
    left: 0;
    right: 0;
    background: linear-gradient(135deg, #1a237e 0%, #283593 100%);
    flex-direction: column;
    padding: 16px;
    gap: 4px;
    transform: translateY(-100%);
    opacity: 0;
    pointer-events: none;
    transition: all 0.3s;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  }

  .nav-links.open {
    transform: translateY(0);
    opacity: 1;
    pointer-events: all;
  }

  .nav-link {
    width: 100%;
    padding: 12px 16px;
  }

  .user-menu {
    flex-direction: column;
    margin-left: 0;
    padding-left: 0;
    border-left: none;
    border-top: 1px solid rgba(255,255,255,0.2);
    padding-top: 12px;
    width: 100%;
  }

  .main-content {
    padding: 20px 16px;
  }
}
</style>
