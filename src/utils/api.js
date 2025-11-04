import axios from 'axios';
import CONFIG from './../constents/config';

const api = axios.create({
	baseURL: CONFIG.API_BASE_URL,
	headers: {
		'Content-Type': 'application/json',
		Accept: 'application/json',
	},
});

// Optional interceptors
api.interceptors.request.use((config) => {
	// Example: add token if needed
	return config;
});
api.interceptors.response.use(
	(response) => response,
	(error) => Promise.reject(error)
);

export default api;
