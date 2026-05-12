import { ref, computed } from 'vue';
import type { User } from '@/types';

const STORAGE_KEY = 'campus_loans_auth';

const currentUser = ref<User | null>(null);
const isAuthenticated = computed(() => currentUser.value !== null);

// Valid email pattern: anything@campus.edu
// Valid password pattern: starts with capital letter, followed by lowercase letters, then 3 digits, then !
// Example: Student001!  Admin123!
function validateCredentials(email: string, password: string): { valid: boolean; error?: string } {
  const emailRegex = /^[^\s@]+@campus\.edu$/i;
  const passwordRegex = /^[A-Z][a-z]+\d{3}!$/;

  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Email must end with @campus.edu' };
  }
  if (!passwordRegex.test(password)) {
    return { valid: false, error: 'Password must start with capital letter, have lowercase letters, 3 digits, and end with ! (e.g., Student001!)' };
  }
  return { valid: true };
}

function extractNameFromEmail(email: string): string {
  const local = email.split('@')[0];
  // Convert student001 -> Student 001 or john.doe -> John Doe
  if (local.includes('.')) {
    return local.split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  }
  // student001 -> Student 001
  const match = local.match(/^([a-z]+)(\d+)$/i);
  if (match) {
    return match[1].charAt(0).toUpperCase() + match[1].slice(1) + ' ' + match[2];
  }
  return local.charAt(0).toUpperCase() + local.slice(1);
}

export function initAuth(): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      currentUser.value = JSON.parse(stored);
    }
  } catch (e) {
    console.error('Auth init error:', e);
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function login(email: string, password: string): { success: boolean; error?: string } {
  try {
    const validation = validateCredentials(email, password);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const user: User = {
      email: email.toLowerCase(),
      name: extractNameFromEmail(email),
      role: email.toLowerCase().includes('admin') ? 'admin' : 'student',
    };

    currentUser.value = user;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    return { success: true };
  } catch (e) {
    console.error('Login error:', e);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
}

export function logout(): void {
  try {
    currentUser.value = null;
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Logout error:', e);
  }
}

export function getUser(): User | null {
  return currentUser.value;
}

export { isAuthenticated, currentUser };
