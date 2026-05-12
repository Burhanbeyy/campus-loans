export interface Device {
  id: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  status: 'available' | 'loaned' | 'maintenance';
  image?: string;
  specs: string[];
}

export interface Loan {
  id: string;
  deviceId: string;
  deviceName: string;
  deviceBrand: string;
  deviceCategory: string;
  studentEmail: string;
  studentName: string;
  borrowDate: string;
  returnDate: string;
  dueDate: string;
  status: 'active' | 'returned' | 'overdue';
  notes?: string;
}

export interface User {
  email: string;
  name: string;
  role: 'student' | 'admin';
}
