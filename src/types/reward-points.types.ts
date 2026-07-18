export interface Branch {
  id: string;
  name: string;
  isActive: boolean;
}

export interface RewardPointsSettings {
  id: string;
  tenantId: string;
  isEnabled: boolean;
  pointEarningRate: number;
  redemptionRate: number;
  minimumRedeemablePoints: number;
  enablePointsExpiry: boolean;
  enableSpecialEventMultiplier: boolean;
  // Points expiry fields
  pointsExpiryDuration: number;
  pointsExpiryPeriod: string;
  // Special event fields
  specialEventMultiplier: number;
  specialEventStartDate: string | null;
  specialEventEndDate: string | null;
  createdAt: string;
  updatedAt: string;
  branches: Branch[];
}

export interface RewardPointsFormData {
  isEnabled: boolean;
  pointEarningRate: number;
  redemptionRate: number;
  minimumRedeemablePoints: number;
  enablePointsExpiry: boolean;
  enableSpecialEventMultiplier: boolean;
  branchIds: string[];
  // Points expiry fields
  pointsExpiryDuration: number;
  pointsExpiryPeriod: 'days' | 'months' | 'years';
  // Special event fields
  specialEventMultiplier: number;
  specialEventStartDate: string;
  specialEventEndDate: string;
}

export interface RewardPointsStats {
  isEnabled: boolean;
  totalBranches: number;
  pointEarningRate: number;
  redemptionRate: number;
  minimumRedeemablePoints: number;
  enablePointsExpiry: boolean;
  enableSpecialEventMultiplier: boolean;
  // Points expiry fields
  pointsExpiryDuration: number;
  pointsExpiryPeriod: string;
  // Special event fields
  specialEventMultiplier: number;
  specialEventStartDate: string | null;
  specialEventEndDate: string | null;
}
