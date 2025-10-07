import axios from 'axios';
import type {
  User,
  Collection,
  Field,
  APIKey,
  LoginRequest,
  LoginResponse,
  CreateCollectionRequest,
  CreateFieldRequest,
  CreateAPIKeyRequest,
  CreateAPIKeyResponse
} from '../types/api';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookie-based auth
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (credentials: LoginRequest): Promise<LoginResponse> =>
    api.post('/auth/login', credentials).then(res => res.data),

  logout: (): Promise<{message: string}> =>
    api.post('/auth/logout').then(res => res.data),

  getCurrentUser: (): Promise<User> =>
    api.get('/auth/me').then(res => res.data),
};

export const collectionsApi = {
  list: (): Promise<Collection[]> =>
    api.get('/admin/collections').then(res => res.data),

  get: (id: number): Promise<Collection> =>
    api.get(`/admin/collections/${id}`).then(res => res.data),

  create: (collection: CreateCollectionRequest): Promise<Collection> =>
    api.post('/admin/collections', collection).then(res => res.data),

  update: (id: number, collection: Partial<CreateCollectionRequest>): Promise<Collection> =>
    api.put(`/admin/collections/${id}`, collection).then(res => res.data),

  delete: (id: number): Promise<void> =>
    api.delete(`/admin/collections/${id}`).then(res => res.data),
};

export const fieldsApi = {
  list: (collectionId: number): Promise<Field[]> =>
    api.get(`/admin/collections/${collectionId}/fields`).then(res => res.data),

  create: (collectionId: number, field: CreateFieldRequest): Promise<Field> =>
    api.post(`/admin/collections/${collectionId}/fields`, field).then(res => res.data),

  update: (collectionId: number, fieldId: number, field: Partial<CreateFieldRequest>): Promise<Field> =>
    api.put(`/admin/collections/${collectionId}/fields/${fieldId}`, field).then(res => res.data),

  delete: (collectionId: number, fieldId: number): Promise<void> =>
    api.delete(`/admin/collections/${collectionId}/fields/${fieldId}`).then(res => res.data),
};

export const apiKeysApi = {
  list: (): Promise<APIKey[]> =>
    api.get('/admin/api-keys').then(res => res.data),

  create: (keyData: CreateAPIKeyRequest): Promise<CreateAPIKeyResponse> =>
    api.post('/admin/api-keys', keyData).then(res => res.data),

  update: (id: number, keyData: Partial<CreateAPIKeyRequest>): Promise<APIKey> =>
    api.put(`/admin/api-keys/${id}`, keyData).then(res => res.data),

  revoke: (id: number): Promise<void> =>
    api.put(`/admin/api-keys/${id}/revoke`).then(res => res.data),

  delete: (id: number): Promise<void> =>
    api.delete(`/admin/api-keys/${id}`).then(res => res.data),
};

export default api;
