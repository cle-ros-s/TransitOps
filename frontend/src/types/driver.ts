export type DriverStatus = 'available' | 'on_trip' | 'off_duty' | 'suspended';
export type LicenseCategory = 'A' | 'B' | 'C' | 'D' | 'E';

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: LicenseCategory;
  licenseExpiryDate: string;
  contactNumber: string;
  email: string;
  safetyScore: number; // 0-100
  tripCompletionRate: number; // 0-100 percentage
  status: DriverStatus;
  address: string;
  joinDate: string;
  totalTrips: number;
  createdAt: string;
  updatedAt: string;
}
