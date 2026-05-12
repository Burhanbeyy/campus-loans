<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { login } from '@/stores/useAuth';

const route = useRoute();
const router = useRouter();

const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref<string | null>(null);
const showPassword = ref(false);

async function handleLogin() {
  error.value = null;
  loading.value = true;

  try {
    const result = login(email.value.trim(), password.value.trim());
    if (result.success) {
      const returnTo = route.query.returnTo as string || '/';
      router.push(returnTo);
    } else {
      error.value = result.error || 'Login failed. Please check your credentials.';
    }
  } catch (e) {
    console.error('Login error:', e);
    error.value = 'An unexpected error occurred. Please try again.';
  } finally {
    loading.value = false;
  }
}

function fillDemo() {
  email.value = 'student001@campus.edu';
  password.value = 'Student001!';
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <div class="login-icon">🔐</div>
        <h1>Welcome Back</h1>
        <p>Sign in to borrow campus devices</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div v-if="error" class="error-alert">
          <span class="error-icon">⚠️</span>
          <span>{{ error }}</span>
        </div>

        <div class="form-group">
          <label for="email">Email Address</label>
          <div class="input-wrapper">
            <span class="input-icon">📧</span>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="yourname@campus.edu"
              required
              :disabled="loading"
            />
          </div>
          <small class="hint">Must end with @campus.edu</small>
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <div class="input-wrapper">
            <span class="input-icon">🔑</span>
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Password"
              required
              :disabled="loading"
            />
            <button
              type="button"
              class="toggle-password"
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? '🙈' : '👁️' }}
            </button>
          </div>
          <small class="hint">Format: Capital + lowercase + 3 digits + ! (e.g., Student001!)</small>
        </div>

        <button type="submit" class="login-btn" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          <span v-else>Sign In</span>
        </button>
      </form>

      <div class="login-footer">
        <button class="demo-btn" @click="fillDemo">
          📝 Auto-fill Demo Credentials
        </button>
        <p class="guest-link">
          <router-link to="/devices">Continue as guest →</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: calc(100vh - 200px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.login-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(26, 35, 126, 0.15);
  width: 100%;
  max-width: 440px;
  padding: 40px;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-icon {
  font-size: 3rem;
  margin-bottom: 12px;
}

.login-header h1 {
  font-size: 1.75rem;
  color: #1a237e;
  margin-bottom: 8px;
}

.login-header p {
  color: #666;
  font-size: 1rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.error-alert {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #ffebee;
  color: #c62828;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 0.9rem;
  border-left: 4px solid #c62828;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 14px;
  font-size: 1rem;
  opacity: 0.6;
}

.input-wrapper input {
  width: 100%;
  padding: 12px 12px 12px 44px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.2s;
  background: #fafafa;
}

.input-wrapper input:focus {
  outline: none;
  border-color: #3949ab;
  background: white;
  box-shadow: 0 0 0 4px rgba(57, 73, 171, 0.1);
}

.toggle-password {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  padding: 4px;
}

.hint {
  color: #888;
  font-size: 0.8rem;
}

.login-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #3949ab 0%, #1a237e 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 8px;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(26, 35, 126, 0.3);
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.login-footer {
  margin-top: 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.demo-btn {
  width: 100%;
  padding: 10px;
  background: #f5f7fa;
  border: 2px dashed #c5cae9;
  color: #3949ab;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
}

.demo-btn:hover {
  background: #e8eaf6;
  border-color: #3949ab;
}

.guest-link a {
  color: #3949ab;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.95rem;
}

.guest-link a:hover {
  text-decoration: underline;
}

@media (max-width: 480px) {
  .login-card {
    padding: 28px 20px;
  }
}
</style>
