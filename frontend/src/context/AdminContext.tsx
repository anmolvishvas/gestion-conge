import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, AdminStats } from '../types/index';
import { useLeaveContext } from './LeaveContext';
import { useUserContext } from './UserContext';
import { format } from 'date-fns';
import { userService } from '../services/userService';
import api, { API_URL } from '../services/api';

interface EmployeeLeaveSummary {
  id: number;
  firstName: string;
  lastName: string;
  leaves: {
    paid: { taken: number; remaining: number; total: number };
    sick: { taken: number; remaining: number; total: number };
    unpaid: { taken: number };
  };
  totalLeaves: {
    taken: number;
    remaining: number;
  };
}

interface AdminContextType {
  users: User[];
  stats: AdminStats;
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUser: (id: number, userData: Partial<User>) => Promise<void>;
  deleteUser: (id: number) => Promise<void>;
  searchUsers: (query: string) => Promise<User[]>;
  getEmployeeLeaveSummary: (year: number) => EmployeeLeaveSummary[];
  getPresentEmployees: (date?: string) => User[];
  getAbsentEmployees: (date?: string) => User[];
  isLoading: boolean;
  refreshLeaveSummary: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdminContext = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdminContext must be used within an AdminProvider');
  }
  return context;
};

interface AdminProviderProps {
  children: ReactNode;
}

const initialStats: AdminStats = {
  totalEmployees: 0,
  activeEmployees: 0,
  pendingLeaves: 0,
  todayAbsent: 0
};

export const AdminProvider = ({ children }: AdminProviderProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<AdminStats>(initialStats);
  const [isLoading, setIsLoading] = useState(true);
  const { leaves } = useLeaveContext();
  const { isLoggedIn, currentUser } = useUserContext();
  
  useEffect(() => {
    if (isLoggedIn && currentUser?.isAdmin) {
      loadUsers();
    } else {
      // Clear users if not logged in or not admin
      setUsers([]);
      setStats(initialStats);
    }
  }, [isLoggedIn, currentUser]);

  useEffect(() => {
    if (users) {
      setStats({
        totalEmployees: users.length,
        activeEmployees: users.filter(user => user.status === 'active').length,
        pendingLeaves: leaves ? leaves.filter(leave => leave.status === 'En attente').length : 0,
        todayAbsent: getAbsentEmployees().length
      });
    }
  }, [users, leaves]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const loadedUsers = await userService.getAll();
      setUsers(loadedUsers || []);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const addUser = async (user: Omit<User, 'id'>) => {
    if (!isLoggedIn || !currentUser?.isAdmin) {
      throw new Error('Unauthorized');
    }
    try {
      const newUser = await userService.create(user);
      setUsers(prevUsers => [...prevUsers, newUser]);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  };
  
  const updateUser = async (id: number, userData: Partial<User>) => {
    if (!isLoggedIn || !currentUser?.isAdmin) {
      throw new Error('Unauthorized');
    }
    try {
      const updatedUser = await userService.update(id, userData);
      setUsers(prevUsers => prevUsers.map(user => 
        user.id === id ? { ...user, ...updatedUser } : user
      ));
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };
  
  const deleteUser = async (id: number) => {
    if (!isLoggedIn || !currentUser?.isAdmin) {
      throw new Error('Unauthorized');
    }
    try {
      await userService.delete(id);
      setUsers(prevUsers => prevUsers.filter(user => user.id !== id));
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };
  
  const searchUsers = async (query: string): Promise<User[]> => {
    if (!isLoggedIn || !currentUser?.isAdmin) {
      throw new Error('Unauthorized');
    }
    try {
      const searchResults = await userService.search(query);
      return searchResults || [];
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  };
  
  const getEmployeeLeaveSummary = (year: number) => {
    if (!users || !isLoggedIn || !currentUser?.isAdmin) return [];
    return users
      .filter(user => user.status === 'active')
      .map(user => {
        const userLeaves = leaves ? leaves.filter(leave => leave.userId === user.id) : [];
        
        const paidLeaveTaken = userLeaves
          .filter(leave => leave.type === 'Congé payé' && leave.status === 'Approuvé')
          .reduce((total, leave) => total + (Number(leave.totalDays) || 0), 0);
          
        const sickLeaveTaken = userLeaves
          .filter(leave => leave.type === 'Congé maladie' && leave.status === 'Approuvé')
          .reduce((total, leave) => total + (Number(leave.totalDays) || 0), 0);
          
        const unpaidLeaveTaken = userLeaves
          .filter(leave => leave.type === 'Congé sans solde' && leave.status === 'Approuvé')
          .reduce((total, leave) => total + (Number(leave.totalDays) || 0), 0);
        
        const paidLeaveRemaining = Math.max(0, user.paidLeaveBalance - paidLeaveTaken);
        const sickLeaveRemaining = Math.max(0, user.sickLeaveBalance - sickLeaveTaken);
        
        const totalTaken = paidLeaveTaken + sickLeaveTaken + unpaidLeaveTaken;
        const totalRemaining = paidLeaveRemaining + sickLeaveRemaining;
        const totalLeaveBalance = user.paidLeaveBalance + user.sickLeaveBalance;
        
        return {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          leaves: {
            paid: {
              taken: paidLeaveTaken,
              remaining: paidLeaveRemaining,
              total: user.paidLeaveBalance
            },
            sick: {
              taken: sickLeaveTaken,
              remaining: sickLeaveRemaining,
              total: user.sickLeaveBalance
            },
            unpaid: {
              taken: unpaidLeaveTaken
            }
          },
          totalLeaves: {
            taken: totalTaken,
            remaining: totalRemaining,
            total: totalLeaveBalance
          }
        };
      });
  };
  
  const getPresentEmployees = (date?: string) => {
    if (!users || !isLoggedIn || !currentUser?.isAdmin) return [];
    const targetDate = date || format(new Date(), 'yyyy-MM-dd');
    
    const activeEmployees = users.filter(user => user.status === 'active');
    
    const employeesOnLeaveToday = leaves
      ? leaves
          .filter(leave => 
            leave.status === 'Approuvé' &&
            new Date(leave.startDate) <= new Date(targetDate) &&
            new Date(leave.endDate) >= new Date(targetDate)
          )
          .map(leave => leave.userId)
      : [];
    
    return activeEmployees.filter(employee => !employeesOnLeaveToday.includes(employee.id));
  };
  
  const getAbsentEmployees = (date?: string) => {
    if (!users || !isLoggedIn || !currentUser?.isAdmin) return [];
    const targetDate = date || format(new Date(), 'yyyy-MM-dd');
    
    const activeEmployees = users.filter(user => user.status === 'active');
    
    const employeesOnLeaveToday = leaves
      ? leaves
          .filter(leave => 
            leave.status === 'Approuvé' &&
            new Date(leave.startDate) <= new Date(targetDate) &&
            new Date(leave.endDate) >= new Date(targetDate)
          )
          .map(leave => leave.userId)
      : [];
    
    return activeEmployees.filter(employee => employeesOnLeaveToday.includes(employee.id));
  };
  
  const refreshLeaveSummary = async () => {
    try {
      setIsLoading(true);
      const updatedUsers = await userService.getAll();
      setUsers(updatedUsers);

      const response = await api.get(`${API_URL}/leave_balances`);
      const leaveBalances = response.data['hydra:member'];

      const activeUsers = updatedUsers.filter(user => user.status === 'active');
      setStats({
        totalEmployees: updatedUsers.length,
        activeEmployees: activeUsers.length,
        pendingLeaves: leaves ? leaves.filter(leave => leave.status === 'En attente').length : 0,
        todayAbsent: getAbsentEmployees().length
      });

      setIsLoading(false);
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des données:', error);
      setIsLoading(false);
    }
  };
  
  const value = {
    users,
    stats,
    addUser,
    updateUser,
    deleteUser,
    searchUsers,
    getEmployeeLeaveSummary,
    getPresentEmployees,
    getAbsentEmployees,
    isLoading,
    refreshLeaveSummary
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};
 