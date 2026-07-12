export type MaintenanceStatus = 'active' | 'completed';
export type ServiceType = 'oil_change' | 'tire_replacement' | 'brake_service' | 'engine_repair' | 'body_repair' | 'electrical' | 'ac_service' | 'general_service' | 'inspection';

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  serviceType: ServiceType;
  description: string;
  estimatedCost: number;
  actualCost?: number;
  scheduledDate: string;
  completedDate?: string;
  status: MaintenanceStatus;
  technician?: string;
  workshopName?: string;
  createdAt: string;
  updatedAt: string;
}
