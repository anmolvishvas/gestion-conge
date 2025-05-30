import api from './api';
import { User } from '../types/index';

export const userService = {
    getAll: async (): Promise<User[]> => {
        const response = await api.get('/users');
        return response.data.member || [];
    },

    getById: async (id: number): Promise<User> => {
        const response = await api.get(`/users/${id}`);
        return response.data;
    },

    create: async (user: Omit<User, 'id'>): Promise<User> => {
        const jsonLdData = {
            ...user,
            '@context': '/api/contexts/User',
            '@type': 'User'
        };
        const response = await api.post('/users', jsonLdData);
        return response.data;
    },

    update: async (id: number, user: Partial<User>): Promise<User> => {
        const jsonLdData = {
            ...user,
            '@context': '/api/contexts/User',
            '@type': 'User'
        };
        const response = await api.put(`/users/${id}`, jsonLdData);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/users/${id}`);
    },

    search: async (query: string): Promise<User[]> => {
        const response = await api.get(`/users?firstName=${query}`);
        return response.data.member || [];
    }
}; 