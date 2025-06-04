// Remove the explicit exports at the top and start with type definitions
export type LeaveType = 'Congé payé' | 'Congé maladie' | 'Congé sans solde';
export type LeaveStatus = 'En attente' | 'Approuvé' | 'Rejeté';
export type HalfDayType = 'FULL' | 'AM' | 'PM' | 'NONE';
export type LeaveFilterType = 'all' | 'pending' | 'approved' | 'rejected' | 'paid' | 'sick' | 'unpaid';
export type PermissionFilterType = 'all' | 'pending' | 'approved' | 'rejected';

export interface HalfDayOption {
    date: string;
    type: HalfDayType;
}

export interface LeaveBalance {
    id: number;
    year: number;
    initialPaidLeave: number;
    initialSickLeave: number;
    remainingPaidLeave: number;
    remainingSickLeave: number;
    carriedOverFromPreviousYear: number;
    carriedOverToNextYear: number;
}

export interface User {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    trigram: string;
    password: string;
    status: 'active' | 'inactive';
    isAdmin: boolean;
    paidLeaveBalance: number;
    sickLeaveBalance: number;
    startDate: string;
    endDate: string | null;
    leaveBalances: LeaveBalance[];
}

export interface ReplacementSlot {
    id?: number;
    date: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    permission?: number | Permission;
}

export interface Permission {
    id?: number;
    userId?: number;
    user?: User;
    date: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    reason: string;
    status: LeaveStatus;
    replacementSlots: ReplacementSlot[];
}

export interface Leave {
    id?: number;
    user?: User;
    userId?: number;
    type: LeaveType;
    startDate: string;
    endDate: string;
    halfDayOptions: HalfDayOption[];
    status: LeaveStatus;
    reason: string;
    certificate: string | null;
    totalDays: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface AdminStats {
    totalEmployees: number;
    activeEmployees: number;
    pendingLeaves: number;
    todayAbsent: number;
}

export interface Holiday {
  "@id": string;
  "@type": string;
  id: number;
  name: string;
  date: string;
  isRecurringYearly: boolean;
  createdAt: string;
}

export interface HolidayCollection {
  "@context": string;
  "@id": string;
  "@type": string;
  totalItems: number;
  member: Holiday[];
} 