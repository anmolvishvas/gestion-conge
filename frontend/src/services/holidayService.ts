import api, { API_URL } from './api';

export interface Holiday {
    id: number;
    name: string;
    date: string;
    description?: string | null;
    isRecurringYearly: boolean;
    createdAt?: string;
}

export interface ApiResponse {
    '@context': string;
    '@id': string;
    '@type': string;
    'totalItems': number;
    'member': Holiday[];
    'view': {
        '@id': string;
        '@type': string;
    };
    'hydra:member': Holiday[];
    'hydra:totalItems': number;
}

export const holidayService = {
    getHolidays: async (): Promise<Holiday[]> => {
        const response = await api.get<ApiResponse>(`/holidays`);
        return response.data['hydra:member'];
    },

    addHoliday: async (holiday: Omit<Holiday, 'id'>): Promise<Holiday> => {
        const response = await api.post<Holiday>(`/holidays`, holiday);
        return response.data;
    },

    deleteHoliday: async (id: number): Promise<void> => {
        await api.delete(`/holidays/${id}`);
    },

    getHolidaysForYear: async (year: number): Promise<Holiday[]> => {
        const response = await api.get<ApiResponse>(`${API_URL}/holidays`, {
            params: {
                'date[before]': `${year + 1}-01-01`,
                'date[after]': `${year}-01-01`
            }
        });
        return response.data['hydra:member'] || [];
    },

    getHolidaysForYearRaw: async (year: number): Promise<ApiResponse> => {
        const response = await api.get<ApiResponse>(`${API_URL}/holidays`, {
            params: {
                'date[before]': `${year + 1}-01-01`,
                'date[after]': `${year}-01-01`
            }
        });
        return response.data;
    }
}; 