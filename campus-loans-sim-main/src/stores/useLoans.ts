import { ref, computed } from 'vue';
import type { Loan } from '@/types';
import { currentUser } from './useAuth';
import { updateDeviceStatus } from './useDevices';

const STORAGE_KEY = 'campus_loans_loans';

const loans = ref<Loan[]>([]);

function initLoans(): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      loans.value = JSON.parse(stored);
    }
  } catch (e) {
    console.error('Loans init error:', e);
    loans.value = [];
  }
}

function saveLoans(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loans.value));
  } catch (e) {
    console.error('Loans save error:', e);
  }
}

function generateLoanId(): string {
  return 'LN-' + Date.now().toString(36).toUpperCase();
}

export function createLoan(
  deviceId: string,
  deviceName: string,
  deviceBrand: string,
  deviceCategory: string,
  borrowDate: string,
  returnDate: string
): { success: boolean; error?: string; loan?: Loan } {
  try {
    const user = currentUser.value;
    if (!user) {
      return { success: false, error: 'You must be logged in to borrow a device.' };
    }

    // Validate 3-day max rule
    const borrow = new Date(borrowDate);
    const ret = new Date(returnDate);
    const diffTime = ret.getTime() - borrow.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 3) {
      return { success: false, error: 'Maximum loan period is 3 days. Please select a return date within 3 days of borrowing.' };
    }

    if (diffDays < 1) {
      return { success: false, error: 'Return date must be at least 1 day after borrow date.' };
    }

    // Check if user already has this device on loan
    const existing = loans.value.find(
      l => l.deviceId === deviceId && l.studentEmail === user.email && l.status === 'active'
    );
    if (existing) {
      return { success: false, error: 'You already have this device on loan. Return it first to borrow again.' };
    }

    const loan: Loan = {
      id: generateLoanId(),
      deviceId,
      deviceName,
      deviceBrand,
      deviceCategory,
      studentEmail: user.email,
      studentName: user.name,
      borrowDate,
      returnDate,
      dueDate: returnDate,
      status: 'active',
    };

    loans.value.unshift(loan);
    updateDeviceStatus(deviceId, 'loaned');
    saveLoans();

    return { success: true, loan };
  } catch (e) {
    console.error('Create loan error:', e);
    return { success: false, error: 'Failed to create loan. Please try again.' };
  }
}

export function returnLoan(loanId: string): { success: boolean; error?: string } {
  try {
    const loan = loans.value.find(l => l.id === loanId);
    if (!loan) {
      return { success: false, error: 'Loan not found.' };
    }

    loan.status = 'returned';
    updateDeviceStatus(loan.deviceId, 'available');
    saveLoans();

    return { success: true };
  } catch (e) {
    console.error('Return loan error:', e);
    return { success: false, error: 'Failed to return device. Please try again.' };
  }
}

export function getUserLoans(email?: string): Loan[] {
  const target = email || currentUser.value?.email;
  if (!target) return [];
  return loans.value.filter(l => l.studentEmail === target);
}

export function getAllLoans(): Loan[] {
  return loans.value;
}

export function getActiveLoans(): Loan[] {
  return loans.value.filter(l => l.status === 'active');
}

export function getOverdueLoans(): Loan[] {
  const today = new Date().toISOString().split('T')[0];
  return loans.value.filter(l => l.status === 'active' && l.dueDate < today);
}

export function checkAndMarkOverdue(): void {
  const today = new Date().toISOString().split('T')[0];
  let changed = false;
  for (const loan of loans.value) {
    if (loan.status === 'active' && loan.dueDate < today) {
      loan.status = 'overdue';
      changed = true;
    }
  }
  if (changed) saveLoans();
}

export function resetLoans(): void {
  loans.value = [];
  saveLoans();
}

export { loans, initLoans };
