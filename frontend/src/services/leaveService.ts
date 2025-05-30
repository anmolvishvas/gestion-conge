import api, { API_URL } from './api';
import { Leave, Permission, Holiday, HolidayCollection } from '../types';

const formatLeaveForApi = (leave: Partial<Leave>) => {
    // Convertir les dates au format Y-m-d
    const startDate = leave.startDate ? leave.startDate.split('T')[0] : undefined;
    const endDate = leave.endDate ? leave.endDate.split('T')[0] : undefined;

    // Construire l'IRI pour l'utilisateur
    const userIri = leave.userId ? `${API_URL}/users/${leave.userId}` : leave.user?.id ? `${API_URL}/users/${leave.user.id}` : undefined;

    // Ne garder que les champs nécessaires et non-undefined
    return {
        '@context': '/api/contexts/Leave',
        '@type': 'Leave',
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(userIri && { user: userIri }),
        ...(leave.type && { type: leave.type }),
        halfDayOptions: Array.isArray(leave.halfDayOptions) ? leave.halfDayOptions : [],
        status: leave.status || 'En attente',
        ...(leave.reason && { reason: leave.reason }),
        ...(leave.totalDays && { totalDays: leave.totalDays.toString() })
    };
};

const formatLeaveFromApi = (leave: any): Leave => {
    return {
        ...leave,
        // Convertir les dates au format YYYY-MM-DD
        startDate: leave.startDate ? new Date(leave.startDate).toISOString().split('T')[0] : '',
        endDate: leave.endDate ? new Date(leave.endDate).toISOString().split('T')[0] : '',
        totalDays: leave.totalDays?.toString(),
        // S'assurer que halfDayOptions est un tableau
        halfDayOptions: Array.isArray(leave.halfDayOptions) ? leave.halfDayOptions : [],
        // Extraire l'ID de l'utilisateur depuis l'IRI si nécessaire
        userId: typeof leave.user === 'string' ? parseInt(leave.user.split('/').pop()) : leave.user?.id
    };
};

export const leaveService = {
    getAll: async (): Promise<Leave[]> => {
        const response = await api.get(`${API_URL}/leaves`);
        const leaves = response.data['hydra:member'] || response.data.member || [];
        return leaves.map(formatLeaveFromApi);
    },

    getById: async (id: number): Promise<Leave> => {
        const response = await api.get(`${API_URL}/leaves/${id}`);
        return formatLeaveFromApi(response.data);
    },

    create: async (leave: Omit<Leave, 'id'>): Promise<Leave> => {
        const formattedLeave = formatLeaveForApi(leave);
        const response = await api.post(`${API_URL}/leaves`, formattedLeave);
        return formatLeaveFromApi(response.data);
    },

    update: async (id: number, leave: Partial<Leave>): Promise<Leave> => {
        const formattedLeave = formatLeaveForApi(leave);
        const response = await api.put(`${API_URL}/leaves/${id}`, formattedLeave);
        return formatLeaveFromApi(response.data);
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`${API_URL}/leaves/${id}`);
    },

    uploadCertificate: async (id: number, file: File): Promise<string> => {
        if (!file) {
            throw new Error('Aucun fichier fourni');
        }

        const formData = new FormData();
        formData.append('certificate[]', file);

        try {
            const response = await api.post(`${API_URL}/leaves/${id}/certificate`, formData, {
                headers: {
                    'Accept': 'application/json'
                }
            });
            return response.data.certificate;
        } catch (error) {
            console.error('Error uploading file:', error);
            throw error;
        }
    },

    downloadCertificate: async (id: number): Promise<void> => {
        try {
        const response = await api.get(`${API_URL}/leaves/${id}/certificate`, {
            responseType: 'blob'
        });
            
            console.log('Response headers:', response.headers);
        
        // Get the filename from Content-Disposition header
        const contentDisposition = response.headers['content-disposition'];
            console.log('Content-Disposition header:', contentDisposition);
            
            let filename = '';
            
            if (contentDisposition) {
                // Essayer d'abord avec filename*=UTF-8
                const filenameUtf8Match = /filename\*=UTF-8''([^;]*)/i.exec(contentDisposition);
                if (filenameUtf8Match && filenameUtf8Match[1]) {
                    filename = decodeURIComponent(filenameUtf8Match[1]);
                } else {
                    // Sinon essayer avec filename standard
                    const matches = /filename="?([^"]*)"?/i.exec(contentDisposition);
                    if (matches && matches[1]) {
                        filename = matches[1];
                    }
                }
            }
            
            console.log('Extracted filename:', filename);
            
            if (!filename) {
                console.warn('No filename found in Content-Disposition header, using default');
                const leave = await api.get(`${API_URL}/leaves/${id}`);
                filename = leave.data.certificate || `certificat-${id}`;
        }
        
        // Get the correct MIME type from response
        const contentType = response.headers['content-type'] || 'application/octet-stream';
            console.log('Content-Type:', contentType);
        
        // Create a blob with the correct type
        const blob = new Blob([response.data], { type: contentType });
        
        // Create a link element and trigger download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Erreur détaillée lors du téléchargement:', error);
            if (error instanceof Error) {
                throw new Error(`Erreur lors du téléchargement: ${error.message}`);
            }
            throw new Error('Erreur inconnue lors du téléchargement du certificat');
        }
    },

    deleteCertificate: async (id: number): Promise<void> => {
        await api.delete(`${API_URL}/leaves/${id}/certificate`);
    },

    getPendingLeaves: async (): Promise<Leave[]> => {
        const response = await api.get(`${API_URL}/leaves?status=En+attente`);
        return (response.data.member || []).map(formatLeaveFromApi);
    },

    getUserLeaves: async (userId: number): Promise<Leave[]> => {
        const response = await api.get(`${API_URL}/leaves?user=/api/users/${userId}`);
        const leaves = response.data['hydra:member'] || response.data.member || [];
        return leaves.map(formatLeaveFromApi);
    },

    approveLeave: async (id: number): Promise<Leave> => {
        const response = await api.put(`${API_URL}/leaves/${id}/status`, { status: 'Approuvé' });
        return formatLeaveFromApi(response.data);
    },

    rejectLeave: async (id: number): Promise<Leave> => {
        const response = await api.put(`${API_URL}/leaves/${id}/status`, { status: 'Rejeté' });
        return formatLeaveFromApi(response.data);
    },

    getHolidays: async (): Promise<Holiday[]> => {
        try {
            const response = await api.get<HolidayCollection>('/holidays');
            return response.data.member;
        } catch (error) {
            console.error('Error fetching holidays:', error);
            throw error;
        }
    }
}; 