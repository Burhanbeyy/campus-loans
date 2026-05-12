<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();
</script>

<template>
  <div class="not-found">
    <div class="not-found-content">
      <div class="error-code">404</div>
      <div class="error-icon">🚫</div>
      <h1>Page Not Found</h1>
      <p>The page you're looking for doesn't exist or has been moved.</p>
      <div class="actions">
        <button class="btn-primary" @click="router.push('/')">
          <span>🏠</span> Go Home
        </button>
        <button class="btn-secondary" @click="router.push('/devices')">
          <span>📱</span> Browse Devices
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  min-height: calc(100vh - 200px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.not-found-content {
  text-align: center;
  max-width: 500px;
}

.error-code {
  font-size: 8rem;
  font-weight: 800;
  color: #e8eaf6;
  line-height: 1;
  margin-bottom: -20px;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.not-found-content h1 {
  font-size: 1.8rem;
  color: #2c3e50;
  margin-bottom: 12px;
}

.not-found-content p {
  color: #666;
  font-size: 1.05rem;
  margin-bottom: 32px;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: center;
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
  background: linear-gradient(135deg, #3949ab 0%, #1a237e 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(26, 35, 126, 0.3);
}

.btn-secondary {
  background: #f5f5f5;
  color: #555;
}

.btn-secondary:hover {
  background: #e0e0e0;
}
</style>
