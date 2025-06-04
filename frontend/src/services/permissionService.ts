import type { Permission } from '../types/index';
import api from './api';

const formatPermissionForApi = (permission: Partial<Permission>) => {
  const userIri = permission.userId ? `/api/users/${permission.userId}` : undefined;

  const formattedSlots = permission.replacementSlots?.map(slot => {
    if (!permission.id) {
      return {
        '@type': 'ReplacementSlot',
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        durationMinutes: slot.durationMinutes
      };
    }
    
    return {
      '@type': 'ReplacementSlot',
      ...(slot.id && { '@id': `/api/replacement_slots/${slot.id}` }),
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      durationMinutes: slot.durationMinutes,
      permission: `/api/permissions/${permission.id}`
    };
  });

  const formattedPermission = {
    '@context': '/api/contexts/Permission',
    '@type': 'Permission',
    ...(permission.id && { '@id': `/api/permissions/${permission.id}` }),
    date: permission.date,
    startTime: permission.startTime,
    endTime: permission.endTime,
    durationMinutes: permission.durationMinutes,
    reason: permission.reason,
    ...(userIri && { user: userIri }),
    status: permission.status || 'En attente',
    replacementSlots: formattedSlots || []
  };

  return formattedPermission;
};

const formatPermissionFromApi = (permission: any): Permission => {
  const userId = typeof permission.user === 'string' 
    ? parseInt(permission.user.split('/').pop() || '0', 10)
    : permission.user?.id || 0;

  const replacementSlots = Array.isArray(permission.replacementSlots) 
    ? permission.replacementSlots.map((slot: any) => ({
        id: typeof slot === 'string' 
          ? parseInt(slot.split('/').pop() || '0', 10)
          : slot.id || 0,
        date: typeof slot === 'string' 
          ? ''
          : slot.date.split('T')[0],
        startTime: typeof slot === 'string'
          ? ''
          : slot.startTime.split('T')[1]?.substring(0, 5) || slot.startTime,
        endTime: typeof slot === 'string'
          ? ''
          : slot.endTime.split('T')[1]?.substring(0, 5) || slot.endTime,
        durationMinutes: typeof slot === 'string' ? 0 : slot.durationMinutes
      }))
    : [];

  return {
    id: permission.id,
    userId,
    date: permission.date.split('T')[0],
    startTime: permission.startTime.split('T')[1]?.substring(0, 5) || permission.startTime,
    endTime: permission.endTime.split('T')[1]?.substring(0, 5) || permission.endTime,
    durationMinutes: permission.durationMinutes,
    reason: permission.reason,
    status: permission.status,
    replacementSlots
  };
};

class PermissionService {
  async getAll(): Promise<Permission[]> {
    const response = await api.get(`/permissions`);
    return (response.data.member || []).map(formatPermissionFromApi);
  }

  async getUserPermissions(userId: number): Promise<Permission[]> {
    const response = await api.get(`/permissions?user=/api/users/${userId}`);
    return (response.data.member || []).map(formatPermissionFromApi);
  }

  async getById(id: number): Promise<Permission> {
    const response = await api.get(`/permissions/${id}`);
    return formatPermissionFromApi(response.data);
  }

  async create(permission: Omit<Permission, 'id'>): Promise<Permission> {
    const formattedPermission = formatPermissionForApi(permission);
    const response = await api.post(`/permissions`, formattedPermission);
    return formatPermissionFromApi(response.data);
  }

  async update(id: number, permissionData: Partial<Permission>): Promise<Permission> {
    const currentPermission = await this.getById(id);
    
    const mergedData = {
      ...currentPermission,
      ...permissionData,
      id: id,
      userId: currentPermission.userId,
      replacementSlots: permissionData.replacementSlots || currentPermission.replacementSlots
    };
    
    const formattedPermission = formatPermissionForApi(mergedData);
    const response = await api.put(`/permissions/${id}`, formattedPermission);
    return formatPermissionFromApi(response.data);
  }

  async delete(id: number): Promise<void> {
    await api.delete(`/permissions/${id}`);
  }

  async approvePermission(id: number): Promise<Permission> {
    const currentPermission = await this.getById(id);
    return this.update(id, { 
      ...currentPermission,
      status: 'Approuvé'
    });
  }

  async rejectPermission(id: number): Promise<Permission> {
    const currentPermission = await this.getById(id);
    return this.update(id, { 
      ...currentPermission,
      status: 'Rejeté'
    });
  }
}

export const permissionService = new PermissionService(); 