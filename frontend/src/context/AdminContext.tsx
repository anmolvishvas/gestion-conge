import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, AdminStats } from '../types/index';
import { useLeaveContext } from './LeaveContext';
import { useUserContext } from './UserContext';
import { format } from 'date-fns';
import { userService } from '../services/userService';

interface AdminContextType {
  users: User[];
  stats: AdminStats;
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUser: (id: number, userData: Partial<User>) => Promise<void>;
  deleteUser: (id: number) => Promise<void>;
  searchUsers: (query: string) => Promise<User[]>;
  getEmployeeLeaveSummary: () => any[];
  getPresentEmployees: (date?: string) => User[];
  getAbsentEmployees: (date?: string) => User[];
  isLoading: boolean;
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
  const [isLoading, setIsLoading] = useState(false);
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
    // Update stats whenever users or leaves change
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
  
  const getEmployeeLeaveSummary = () => {
    if (!users || !isLoggedIn || !currentUser?.isAdmin) return [];
    return users
      .filter(user => user.status === 'active')
      .map(user => {
        // Filter leaves for this user
        const userLeaves = leaves ? leaves.filter(leave => leave.userId === user.id) : [];
        
        // Calculate taken leave days with type safety
        const paidLeaveTaken = userLeaves
          .filter(leave => leave.type === 'Congé payé' && leave.status === 'Approuvé')
          .reduce((total, leave) => total + (Number(leave.totalDays) || 0), 0);
          
        const sickLeaveTaken = userLeaves
          .filter(leave => leave.type === 'Congé maladie' && leave.status === 'Approuvé')
          .reduce((total, leave) => total + (Number(leave.totalDays) || 0), 0);
          
        const unpaidLeaveTaken = userLeaves
          .filter(leave => leave.type === 'Congé sans solde' && leave.status === 'Approuvé')
          .reduce((total, leave) => total + (Number(leave.totalDays) || 0), 0);
        
        // Calculate remaining leave days
        const paidLeaveRemaining = Math.max(0, user.paidLeaveBalance - paidLeaveTaken);
        const sickLeaveRemaining = Math.max(0, user.sickLeaveBalance - sickLeaveTaken);
        
        // Calculate totals
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
    
    // Get all active employees
    const activeEmployees = users.filter(user => user.status === 'active');
    
    // Get employees who are on approved leave for the target date
    const employeesOnLeaveToday = leaves
      ? leaves
          .filter(leave => 
            leave.status === 'Approuvé' &&
            new Date(leave.startDate) <= new Date(targetDate) &&
            new Date(leave.endDate) >= new Date(targetDate)
          )
          .map(leave => leave.userId)
      : [];
    
    // Return employees who are not on leave for the target date
    return activeEmployees.filter(employee => !employeesOnLeaveToday.includes(employee.id));
  };
  
  const getAbsentEmployees = (date?: string) => {
    if (!users || !isLoggedIn || !currentUser?.isAdmin) return [];
    const targetDate = date || format(new Date(), 'yyyy-MM-dd');
    
    // Get all active employees
    const activeEmployees = users.filter(user => user.status === 'active');
    
    // Get employees who are on approved leave for the target date
    const employeesOnLeaveToday = leaves
      ? leaves
          .filter(leave => 
            leave.status === 'Approuvé' &&
            new Date(leave.startDate) <= new Date(targetDate) &&
            new Date(leave.endDate) >= new Date(targetDate)
          )
          .map(leave => leave.userId)
      : [];
    
    // Return employees who are on leave for the target date
    return activeEmployees.filter(employee => employeesOnLeaveToday.includes(employee.id));
  };
  
  return (
    <AdminContext.Provider
      value={{
        users,
        stats,
        addUser,
        updateUser,
        deleteUser,
        searchUsers,
        getEmployeeLeaveSummary,
        getPresentEmployees,
        getAbsentEmployees,
        isLoading
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};
 