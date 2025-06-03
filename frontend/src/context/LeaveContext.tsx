import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Leave, Permission, LeaveFilterType, PermissionFilterType } from '../types';
import { useUserContext } from './UserContext';
import { leaveService } from '../services/leaveService';
import { permissionService } from '../services/permissionService';

interface LeaveContextType {
  leaves: Leave[];
  permissions: Permission[];
  activeLeaveFilter: LeaveFilterType;
  activePermissionFilter: PermissionFilterType;
  filteredLeaves: Leave[];
  filteredPermissions: Permission[];
  setLeaveFilter: (filter: LeaveFilterType) => void;
  setPermissionFilter: (filter: PermissionFilterType) => void;
  addLeave: (leave: Omit<Leave, 'id'>) => Promise<Leave>;
  updateLeave: (id: number, leaveData: Partial<Leave>) => Promise<void>;
  deleteLeave: (id: number) => Promise<void>;
  addPermission: (permission: Omit<Permission, 'id'>) => Promise<Permission>;
  updatePermission: (id: number, permissionData: Partial<Permission>) => Promise<void>;
  deletePermission: (id: number) => Promise<void>;
  getLeaveById: (id: number) => Promise<Leave | undefined>;
  getPermissionById: (id: number) => Promise<Permission | undefined>;
  approveLeaveBatch: (leaveIds: number[]) => Promise<void>;
  approvePermissionBatch: (permissionIds: number[]) => Promise<void>;
  rejectLeaveBatch: (leaveIds: number[]) => Promise<void>;
  rejectPermissionBatch: (permissionIds: number[]) => Promise<void>;
  uploadCertificate: (leaveId: number, file: File) => Promise<void>;
  downloadCertificate: (leaveId: number) => Promise<void>;
  deleteCertificate: (leaveId: number) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  refreshLeaves: () => Promise<void>;
  refreshPermissions: () => Promise<void>;
}

const LeaveContext = createContext<LeaveContextType | undefined>(undefined);

export const useLeaveContext = (): LeaveContextType => {
  const context = useContext(LeaveContext);
  if (!context) {
    throw new Error('useLeaveContext must be used within a LeaveProvider');
  }
  return context;
};

interface LeaveProviderProps {
  children: ReactNode;
}

export const LeaveProvider: React.FC<LeaveProviderProps> = ({ children }) => {
  const { currentUser } = useUserContext();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [activeLeaveFilter, setActiveLeaveFilter] = useState<LeaveFilterType>('all');
  const [activePermissionFilter, setActivePermissionFilter] = useState<PermissionFilterType>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      refreshLeaves();
      refreshPermissions();
    }
  }, [currentUser]);

  const refreshLeaves = async () => {
    if (!currentUser) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const fetchedLeaves = currentUser.isAdmin 
        ? await leaveService.getAll()
        : await leaveService.getUserLeaves(currentUser.id);
      
      setLeaves(fetchedLeaves);
    } catch (err) {
      console.error('Error refreshing leaves:', err);
      setError('Erreur lors du rafraîchissement des congés');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshPermissions = async () => {
    try {
      if (!currentUser) {
        return;
      }

      setIsLoading(true);
      setError(null);
      
      const fetchedPermissions = currentUser.isAdmin
        ? await permissionService.getAll()
        : await permissionService.getUserPermissions(currentUser.id);
        
      if (Array.isArray(fetchedPermissions)) {
        setPermissions(fetchedPermissions);
      } else {
        console.error('Fetched permissions is not an array:', fetchedPermissions);
        setPermissions([]);
      }
    } catch (err) {
      console.error('Error refreshing permissions:', err);
      setError('Erreur lors du rafraîchissement des permissions');
      setPermissions([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const filteredLeaves = leaves.filter(leave => {
    if (!currentUser) return false;

    if (currentUser.isAdmin) {
      if (activeLeaveFilter === 'all') return true;
      else if (activeLeaveFilter === 'pending') return leave.status === 'En attente';
      else if (activeLeaveFilter === 'approved') return leave.status === 'Approuvé';
      else if (activeLeaveFilter === 'rejected') return leave.status === 'Rejeté';
      else if (activeLeaveFilter === 'paid') return leave.type === 'Congé payé';
      else if (activeLeaveFilter === 'sick') return leave.type === 'Congé maladie';
      else if (activeLeaveFilter === 'unpaid') return leave.type === 'Congé sans solde';
    } else {
      if (activeLeaveFilter === 'all') return true;
      else if (activeLeaveFilter === 'pending') return leave.status === 'En attente';
      else if (activeLeaveFilter === 'approved') return leave.status === 'Approuvé';
      else if (activeLeaveFilter === 'rejected') return leave.status === 'Rejeté';
      else if (activeLeaveFilter === 'paid') return leave.type === 'Congé payé';
      else if (activeLeaveFilter === 'sick') return leave.type === 'Congé maladie';
      else if (activeLeaveFilter === 'unpaid') return leave.type === 'Congé sans solde';
    }
    
    return true;
  });
  
  const filteredPermissions = permissions.filter(permission => {
    if (!currentUser) return false;

    if (window.location.pathname === '/admin/pending-approvals') {
      return permission.status === 'En attente';
    }

    if (activePermissionFilter === 'all') return true;
    if (activePermissionFilter === 'pending') return permission.status === 'En attente';
    if (activePermissionFilter === 'approved') return permission.status === 'Approuvé';
    if (activePermissionFilter === 'rejected') return permission.status === 'Rejeté';
    
    return true;
  });
  
  const setLeaveFilter = (filter: LeaveFilterType) => {
    setActiveLeaveFilter(filter);
  };
  
  const setPermissionFilter = (filter: PermissionFilterType) => {
    setActivePermissionFilter(filter);
  };
  
  const addLeave = async (leave: Omit<Leave, 'id'>) => {
    setIsLoading(true);
    setError(null);
    try {
      const newLeave = await leaveService.create(leave);
      setLeaves([...leaves, newLeave]);
      return newLeave;
    } catch (err) {
      setError('Erreur lors de la création du congé');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  const updateLeave = async (id: number, leaveData: Partial<Leave>) => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedLeave = await leaveService.update(id, leaveData);
      setLeaves(leaves.map(leave => 
        leave.id === id ? updatedLeave : leave
      ));
    } catch (err) {
      setError('Erreur lors de la mise à jour du congé');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  const deleteLeave = async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      await leaveService.delete(id);
      setLeaves(leaves.filter(leave => leave.id !== id));
    } catch (err) {
      setError('Erreur lors de la suppression du congé');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  const addPermission = async (permission: Omit<Permission, 'id'>) => {
    setIsLoading(true);
    setError(null);
    try {
      const newPermission = await permissionService.create(permission);
      setPermissions([...permissions, newPermission]);
      return newPermission;
    } catch (err) {
      setError('Erreur lors de la création de la permission');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  const updatePermission = async (id: number, permissionData: Partial<Permission>) => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedPermission = await permissionService.update(id, permissionData);
      setPermissions(permissions.map(permission => 
        permission.id === id ? updatedPermission : permission
      ));
    } catch (err) {
      setError('Erreur lors de la mise à jour de la permission');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  const deletePermission = async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      await permissionService.delete(id);
      setPermissions(permissions.filter(permission => permission.id !== id));
    } catch (err) {
      setError('Erreur lors de la suppression de la permission');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  const getLeaveById = async (id: number) => {
    try {
      return await leaveService.getById(id);
    } catch (err) {
      setError('Erreur lors de la récupération du congé');
      return undefined;
    }
  };
  
  const getPermissionById = async (id: number) => {
    try {
      return await permissionService.getById(id);
    } catch (err) {
      setError('Erreur lors de la récupération de la permission');
      return undefined;
    }
  };
  
  const approveLeaveBatch = async (leaveIds: number[]) => {
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all(leaveIds.map(id => leaveService.approveLeave(id)));
      setLeaves(leaves.map(leave => 
        leave.id && leaveIds.includes(leave.id) ? { ...leave, status: 'Approuvé' } : leave
      ));
    } catch (err) {
      setError('Erreur lors de l\'approbation des congés');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  const approvePermissionBatch = async (permissionIds: number[]) => {
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all(permissionIds.map(id => permissionService.approvePermission(id)));
      setPermissions(permissions.map(permission => 
        permission.id && permissionIds.includes(permission.id) ? { ...permission, status: 'Approuvé' } : permission
      ));
    } catch (err) {
      setError('Erreur lors de l\'approbation des permissions');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  const rejectLeaveBatch = async (leaveIds: number[]) => {
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all(leaveIds.map(id => leaveService.rejectLeave(id)));
      setLeaves(leaves.map(leave => 
        leave.id && leaveIds.includes(leave.id) ? { ...leave, status: 'Rejeté' } : leave
      ));
    } catch (err) {
      setError('Erreur lors du rejet des congés');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  const rejectPermissionBatch = async (permissionIds: number[]) => {
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all(permissionIds.map(id => permissionService.rejectPermission(id)));
      setPermissions(permissions.map(permission => 
        permission.id && permissionIds.includes(permission.id) ? { ...permission, status: 'Rejeté' } : permission
      ));
    } catch (err) {
      setError('Erreur lors du rejet des permissions');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const uploadCertificate = async (leaveId: number, file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const certificatePath = await leaveService.uploadCertificate(leaveId, file);
      setLeaves(leaves.map(leave => 
        leave.id === leaveId ? { ...leave, certificate: certificatePath } : leave
      ));
    } catch (err) {
      setError('Erreur lors de l\'upload du certificat');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const downloadCertificate = async (leaveId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      await leaveService.downloadCertificate(leaveId);
    } catch (err) {
      setError('Erreur lors du téléchargement du certificat');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCertificate = async (leaveId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      await leaveService.deleteCertificate(leaveId);
      setLeaves(leaves.map(leave => 
        leave.id === leaveId ? { ...leave, certificate: null } : leave
      ));
    } catch (err) {
      setError('Erreur lors de la suppression du certificat');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <LeaveContext.Provider value={{
      leaves,
      permissions,
      activeLeaveFilter,
      activePermissionFilter,
      filteredLeaves,
      filteredPermissions,
      setLeaveFilter,
      setPermissionFilter,
      addLeave,
      updateLeave,
      deleteLeave,
      addPermission,
      updatePermission,
      deletePermission,
      getLeaveById,
      getPermissionById,
      approveLeaveBatch,
      approvePermissionBatch,
      rejectLeaveBatch,
      rejectPermissionBatch,
      uploadCertificate,
      downloadCertificate,
      deleteCertificate,
      isLoading,
      error,
      refreshLeaves,
      refreshPermissions
    }}>
      {children}
    </LeaveContext.Provider>
  );
};
 