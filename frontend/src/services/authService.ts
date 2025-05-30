import api from './api';
import { User } from '../types/index';

interface LoginResponse {
    user: User;
}

export const authService = {
    login: async (email: string, password: string): Promise<User> => {
        try {
            console.log('Envoi de la requête de connexion:', { email });
            const response = await api.post<LoginResponse>('/login', {
                email,
                password
            });
            console.log('Réponse du serveur:', response.data);
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