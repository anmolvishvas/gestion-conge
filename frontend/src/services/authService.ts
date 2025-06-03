import api from './api';
import { User } from '../types/index';

interface LoginResponse {
    user: User;
}

export const authService = {
    login: async (email: string, password: string): Promise<User> => {
        try {
            const response = await api.post<LoginResponse>('/login', {
                email,
                password
            });
            return response.data.user;
        } catch (error: any) {
            console.error('Erreur de connexion:', error);
            if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            throw new Error('Une erreur est survenue lors de la connexion');
        }
    }
}; 