import api, { API_URL } from './api';

interface LeaveBalance {
    id: number;
    year: number;
    initialPaidLeave: number;
    initialSickLeave: number;
    remainingPaidLeave: number;
    remainingSickLeave: number;
    carriedOverFromPreviousYear: number;
    carriedOverToNextYear: number;
    user: string;
}

const formatLeaveBalanceForApi = (leaveBalance: Partial<LeaveBalance>) => {
    const userIri = typeof leaveBalance.user === 'number' 
        ? `/api/users/${leaveBalance.user}` 
        : leaveBalance.user;

    const formattedData: any = {
        '@context': '/api/contexts/LeaveBalance',
        '@type': 'LeaveBalance'
    };

    if (leaveBalance.year !== undefined) formattedData.year = leaveBalance.year;
    if (leaveBalance.initialPaidLeave !== undefined) formattedData.initialPaidLeave = leaveBalance.initialPaidLeave;
    if (leaveBalance.initialSickLeave !== undefined) formattedData.initialSickLeave = leaveBalance.initialSickLeave;
    if (leaveBalance.remainingPaidLeave !== undefined) formattedData.remainingPaidLeave = leaveBalance.remainingPaidLeave;
    if (leaveBalance.remainingSickLeave !== undefined) formattedData.remainingSickLeave = leaveBalance.remainingSickLeave;
    if (leaveBalance.carriedOverFromPreviousYear !== undefined) formattedData.carriedOverFromPreviousYear = leaveBalance.carriedOverFromPreviousYear;
    if (leaveBalance.carriedOverToNextYear !== undefined) formattedData.carriedOverToNextYear = leaveBalance.carriedOverToNextYear;
    if (userIri) formattedData.user = userIri;

    return formattedData;
};

const formatLeaveBalanceFromApi = (leaveBalance: any): LeaveBalance => {
    return {
        ...leaveBalance,
        user: typeof leaveBalance.user === 'string' ? leaveBalance.user : `/api/users/${leaveBalance.user}`
    };
};

export const leaveBalanceService = {
    getUserBalance: async (userId: number, year: number): Promise<LeaveBalance | null> => {
        try {
            const response = await api.get(`${API_URL}/leave_balances?user=/api/users/${userId}&year=${year}`);
            
            const members = response.data['hydra:member'] || response.data.member;
            
            if (!Array.isArray(members)) {
                console.error('Members is not an array:', members);
                return null;
            }

            const balance = members.find((item: LeaveBalance) => {
                if (!item || !item.user) return false;
                const userIdFromUrl = parseInt(item.user.split('/').pop() || '0');
                return userIdFromUrl === userId && item.year === year;
            });

            return balance ? formatLeaveBalanceFromApi(balance) : null;
        } catch (error) {
            console.error('Error fetching user balance:', error);
            return null;
        }
    },

    updateLeaveBalance: async (balanceId: number, data: Partial<LeaveBalance>): Promise<LeaveBalance> => {
        try {
            const currentBalance = await api.get(`${API_URL}/leave_balances/${balanceId}`);
            
            const response = await api.put(`${API_URL}/leave_balances/${balanceId}`, 
                formatLeaveBalanceForApi({
                    ...data,
                    user: currentBalance.data.user,
                    year: currentBalance.data.year 
                })
            );
            return formatLeaveBalanceFromApi(response.data);
        } catch (error) {
            console.error('Error updating leave balance:', error);
            throw error;
        }
    },

    carryOverLeaves: async (userId: number, fromYear: number, daysToCarryOver: number): Promise<void> => {
        try {
            const currentYearBalance = await leaveBalanceService.getUserBalance(userId, fromYear);
            
            if (!currentYearBalance) {
                throw new Error(`No leave balance found for user ${userId} in year ${fromYear}`);
            }

            const nextYear = fromYear + 1;
            let nextYearBalance = await leaveBalanceService.getUserBalance(userId, nextYear);

            await leaveBalanceService.updateLeaveBalance(currentYearBalance.id, {
                carriedOverToNextYear: daysToCarryOver,
                user: `/api/users/${userId}`
            });

            if (nextYearBalance) {
                await leaveBalanceService.updateLeaveBalance(nextYearBalance.id, {
                    carriedOverFromPreviousYear: daysToCarryOver,
                    user: `/api/users/${userId}`
                });
            } else {
                console.error(`No leave balance found for user ${userId} in year ${nextYear}`);
            }

        } catch (error) {
            console.error('Error carrying over leaves:', error);
            throw error;
        }
    }
}; 