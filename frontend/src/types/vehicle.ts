export type VehicleStatus = 'available' | 'on_trip' | 'in_shop' | 'retired';
export type VehicleType = 'van' | 'truck' | 'mini' | 'bus' | 'trailer';

export interface VehicleDocument {
  id: string;
  type: 'insurance' | 'permit' | 'registration' | 'pollution';
  name: string;
  expiryDate: string;
  uploadedAt: string;
  fileUrl?: string;
}

export interface Vehicle {
  id: string;
  registrationNumber: string;
  name: string;
  type: VehicleType;
  maxLoadCapacity: number; // kg
  odometer: number; // km
  acquisitionCost: number;
  revenue: number;
  status: VehicleStatus;
  region: string;
  make: string;
  model: string;
  year: number;
  color: string;
  fuelType: 'diesel' | 'petrol' | 'cng' | 'electric';
  documents: VehicleDocument[];
  createdAt: string;
  updatedAt: string;
}
