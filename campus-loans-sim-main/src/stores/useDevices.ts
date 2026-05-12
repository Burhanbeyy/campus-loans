import { ref, computed } from 'vue';
import type { Device } from '@/types';

const STORAGE_KEY = 'campus_loans_devices';

const devices = ref<Device[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const seedDevices: Device[] = [
  { id: 'LAP-001', name: 'ThinkPad X1 Carbon', brand: 'Lenovo', category: 'Laptop', description: '14" business ultrabook, i7, 16GB RAM, 512GB SSD', status: 'available', specs: ['Intel i7', '16GB RAM', '512GB SSD', '14" FHD'] },
  { id: 'LAP-002', name: 'MacBook Air M2', brand: 'Apple', category: 'Laptop', description: '13.6" lightweight laptop, M2 chip, 8GB RAM', status: 'available', specs: ['Apple M2', '8GB RAM', '256GB SSD', '13.6" Retina'] },
  { id: 'LAP-003', name: 'Dell XPS 15', brand: 'Dell', category: 'Laptop', description: '15.6" creator laptop, i9, 32GB RAM, 1TB SSD', status: 'loaned', specs: ['Intel i9', '32GB RAM', '1TB SSD', '15.6" OLED'] },
  { id: 'LAP-004', name: 'HP Spectre x360', brand: 'HP', category: 'Laptop', description: '13.5" 2-in-1 convertible, i7, 16GB RAM', status: 'available', specs: ['Intel i7', '16GB RAM', '512GB SSD', 'Touchscreen'] },
  { id: 'TAB-001', name: 'iPad Pro 12.9"', brand: 'Apple', category: 'Tablet', description: '12.9" professional tablet, M2 chip, 256GB', status: 'available', specs: ['Apple M2', '8GB RAM', '256GB', '12.9" XDR'] },
  { id: 'TAB-002', name: 'Surface Pro 9', brand: 'Microsoft', category: 'Tablet', description: '13" 2-in-1 tablet, i7, 16GB RAM, keyboard included', status: 'available', specs: ['Intel i7', '16GB RAM', '512GB SSD', '13" PixelSense'] },
  { id: 'TAB-003', name: 'Galaxy Tab S9 Ultra', brand: 'Samsung', category: 'Tablet', description: '14.6" Android tablet, Snapdragon 8 Gen 2', status: 'maintenance', specs: ['Snapdragon 8', '12GB RAM', '512GB', '14.6" AMOLED'] },
  { id: 'CAM-001', name: 'EOS R50', brand: 'Canon', category: 'Camera', description: 'Mirrorless camera, 24.2MP, 4K video, kit lens', status: 'available', specs: ['24.2MP APS-C', '4K 30fps', 'Dual Pixel AF', 'Wi-Fi'] },
  { id: 'CAM-002', name: 'Alpha ZV-E10', brand: 'Sony', category: 'Camera', description: 'Vlogging camera, 24.2MP, interchangeable lens', status: 'loaned', specs: ['24.2MP APS-C', '4K 30fps', 'Product Showcase', '3-Capsule Mic'] },
  { id: 'CAM-003', name: 'Lumix GH6', brand: 'Panasonic', category: 'Camera', description: 'Professional video camera, 5.7K, unlimited recording', status: 'available', specs: ['25.2MP MFT', '5.7K 60fps', '7.5-stop IBIS', 'ProRes'] },
  { id: 'PRO-001', name: 'Epson EB-L530U', brand: 'Epson', category: 'Projector', description: 'WUXGA laser projector, 5200 lumens, wireless', status: 'available', specs: ['WUXGA', '5200 Lumens', 'Laser 20k hrs', 'Wireless'] },
  { id: 'PRO-002', name: 'ViewSonic PX701-4K', brand: 'ViewSonic', category: 'Projector', description: '4K home theater projector, 3200 lumens, HDR', status: 'available', specs: ['4K UHD', '3200 Lumens', '4.2ms Input', 'HDR'] },
  { id: 'AUD-001', name: 'Zoom H6essential', brand: 'Zoom', category: 'Audio', description: '6-track portable recorder, 32-bit float, XLR inputs', status: 'available', specs: ['6 Tracks', '32-bit Float', 'XLR/TRS', '32GB SD'] },
  { id: 'AUD-002', name: 'Rode NT-USB+', brand: 'Rode', category: 'Audio', description: 'Studio USB microphone, condenser, pop filter included', status: 'loaned', specs: ['Condenser', 'USB-C', '24-bit/48kHz', 'Pop Filter'] },
  { id: 'AUD-003', name: 'Sony WH-1000XM5', brand: 'Sony', category: 'Audio', description: 'Wireless noise cancelling headphones, 30hr battery', status: 'available', specs: ['ANC', '30hr Battery', 'LDAC', 'Multipoint'] },
  { id: 'VR-001', name: 'Meta Quest 3', brand: 'Meta', category: 'VR', description: 'Mixed reality headset, Snapdragon XR2 Gen 2, 128GB', status: 'available', specs: ['Snapdragon XR2', '4K+ Infinite', 'Touch Plus', '128GB'] },
  { id: 'VR-002', name: 'Vision Pro', brand: 'Apple', category: 'VR', description: 'Spatial computing, M2 + R1 chips, 256GB', status: 'maintenance', specs: ['Apple M2+R1', 'Micro-OLED', 'Eye Tracking', '256GB'] },
  { id: 'DRW-001', name: 'Mavic 3 Pro', brand: 'DJI', category: 'Drone', description: 'Professional drone, triple camera, 43min flight', status: 'available', specs: ['4/3 CMOS', '43min Flight', 'O3+ 15km', 'Tri-Camera'] },
  { id: 'DRW-002', name: 'Mini 4 Pro', brand: 'DJI', category: 'Drone', description: 'Lightweight drone, 4K 60fps, 34min flight, <249g', status: 'available', specs: ['4K 60fps', '34min Flight', 'O4 20km', '<249g'] },
  { id: 'GMB-001', name: 'Ronin RS4', brand: 'DJI', category: 'Gimbal', description: 'Camera stabilizer, 3kg payload, auto tuning', status: 'available', specs: ['3kg Payload', 'Auto Tune', 'Bluetooth', '12hr Battery'] },
];

function initDevices(): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      devices.value = JSON.parse(stored);
    } else {
      devices.value = [...seedDevices];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(devices.value));
    }
  } catch (e) {
    console.error('Device init error:', e);
    devices.value = [...seedDevices];
  }
}

function saveDevices(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(devices.value));
  } catch (e) {
    console.error('Device save error:', e);
  }
}

export function getDeviceById(id: string): Device | undefined {
  return devices.value.find(d => d.id === id);
}

export function updateDeviceStatus(id: string, status: Device['status']): boolean {
  try {
    const device = devices.value.find(d => d.id === id);
    if (!device) return false;
    device.status = status;
    saveDevices();
    return true;
  } catch (e) {
    console.error('Update device error:', e);
    return false;
  }
}

export function getAllDevices(): Device[] {
  return devices.value;
}

export function resetDevices(): void {
  devices.value = [...seedDevices];
  saveDevices();
}

export { devices, loading, error, initDevices, saveDevices };
