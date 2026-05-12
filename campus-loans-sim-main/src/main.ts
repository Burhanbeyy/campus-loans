import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { initAuth } from './stores/useAuth';
import { initDevices } from './stores/useDevices';
import { initLoans } from './stores/useLoans';

function bootstrap() {
  try {
    // Initialize all stores from localStorage
    initAuth();
    initDevices();
    initLoans();

    const app = createApp(App);
    app.use(router);
    app.mount('#app');
  } catch (error) {
    console.error('Failed to bootstrap application:', error);
    const appEl = document.getElementById('app');
    if (appEl) {
      appEl.innerHTML = `
        <div style="
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: system-ui, sans-serif;
          background: #f5f7fa;
        ">
          <div style="
            text-align: center;
            padding: 40px;
            background: white;
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            max-width: 400px;
          ">
            <div style="font-size: 4rem; margin-bottom: 16px;">⚠️</div>
            <h2 style="color: #c62828; margin-bottom: 12px;">Application Error</h2>
            <p style="color: #666; margin-bottom: 20px;">
              Failed to initialize the application. This might be due to corrupted local storage data.
            </p>
            <button onclick="localStorage.clear(); location.reload();" style="
              padding: 12px 24px;
              background: linear-gradient(135deg, #3949ab 0%, #1a237e 100%);
              color: white;
              border: none;
              border-radius: 10px;
              font-weight: 600;
              cursor: pointer;
              font-size: 0.95rem;
            ">
              🔄 Reset & Reload
            </button>
          </div>
        </div>
      `;
    }
  }
}

bootstrap();
