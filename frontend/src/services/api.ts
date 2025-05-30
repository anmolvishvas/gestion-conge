import axios from 'axios';

export const API_URL = 'https://localhost:8000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/ld+json',
        'Accept': 'application/ld+json'
    },
    withCredentials: true
});

// Add request interceptor to handle JSON-LD format
api.interceptors.request.use((config) => {
    // Pour les requêtes multipart/form-data, ne pas définir de Content-Type
    if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
        return config;
    }

    // Pour les autres requêtes, utiliser application/ld+json
    if (['POST', 'PUT', 'PATCH'].includes(config.method?.toUpperCase() || '')) {
        config.headers['Content-Type'] = 'application/ld+json';
    }
    return config;
});

// Add response interceptor to handle JSON-LD format
api.interceptors.response.use(
    (response) => {
        // If the response has @context, it's JSON-LD format
        if (response.data && response.data['@context']) {
            // You might want to transform the data here if needed
            return response;
        }
        return response;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api; 