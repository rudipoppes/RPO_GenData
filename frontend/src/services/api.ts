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
  CreateAPIKeyResponse,
  UserCreate,
  UserUpdate,
  UserProfileUpdate,
  PasswordChangeRequest
} from '../types/api';
import { SessionExpiredError, isAuthenticationError } from './errors';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookie-based auth
});

// Global session expiry handler - will be set by AuthContext
let globalSessionExpiredHandler: (() => void) | null = null;

export const setSessionExpiredHandler = (handler: () => void) => {
  globalSessionExpiredHandler = handler;
};

// Response interceptor for handling session expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isAuthenticationError(error)) {
      // Trigger session expired modal if handler is available
      if (globalSessionExpiredHandler) {
        globalSessionExpiredHandler();
      }
      return Promise.reject(new SessionExpiredError('Your session has expired'));
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
    api.patch(`/admin/collections/${id}`, collection).then(res => res.data),

  delete: (id: number): Promise<void> =>
    api.delete(`/admin/collections/${id}`).then(res => res.data),

  bulkDelete: (ids: number[]): Promise<void> =>
    api({ method: 'DELETE', url: '/admin/collections/bulk', data: { collection_ids: ids } }).then(res => res.data),

  copy: (id: number, request: { count: number }) =>
    api.post(`/admin/collections/${id}/copy`, request).then(res => res.data),
};

export const fieldsApi = {
  list: (collectionId: number): Promise<Field[]> =>
    api.get(`/admin/collections/${collectionId}/fields`).then(res => res.data),

  create: (collectionId: number, field: CreateFieldRequest): Promise<Field> =>
    api.post(`/admin/collections/${collectionId}/fields`, field).then(res => res.data),

  update: (_collectionId: number, fieldId: number, field: Partial<CreateFieldRequest>): Promise<Field> =>
    api.patch(`/admin/fields/${fieldId}`, field).then(res => res.data),

  delete: (_collectionId: number, fieldId: number): Promise<void> =>
    api.delete(`/admin/fields/${fieldId}`).then(res => res.data),
};

export const apiKeysApi = {
  list: (): Promise<APIKey[]> =>
    api.get('/admin/api-keys').then(res => res.data),

  create: (keyData: CreateAPIKeyRequest): Promise<CreateAPIKeyResponse> =>
    api.post('/admin/api-keys', keyData).then(res => res.data),

  update: (id: number, keyData: Partial<CreateAPIKeyRequest>): Promise<APIKey> =>
    api.put(`/admin/api-keys/${id}`, keyData).then(res => res.data),

  revoke: (id: number): Promise<void> =>
    api.post(`/admin/api-keys/${id}/revoke`).then(res => res.data),

  delete: (id: number): Promise<void> =>
    api.delete(`/admin/api-keys/${id}`).then(res => res.data),

  getAllowedCollections: (id: number): Promise<any[]> =>
    api.get(`/admin/api-keys/${id}/allowed-collections`).then(res => res.data),

  edit: (id: number, keyData: Partial<CreateAPIKeyRequest>): Promise<APIKey> =>
    api.put(`/admin/api-keys/${id}/edit`, keyData).then(res => res.data),
};

export default api;

export const adminApiService = {
  getDashboardStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },
};

export const apiService = authApi;

// User Management API
export const usersApi = {
  // Admin-only endpoints
  list: (): Promise<User[]> =>
    api.get('/admin/users').then(res => res.data),

  create: (userData: UserCreate): Promise<User> =>
    api.post('/admin/users', userData).then(res => res.data),

  get: (id: number): Promise<User> =>
    api.get(`/admin/users/${id}`).then(res => res.data),

  update: (id: number, userData: UserUpdate): Promise<User> =>
    api.patch(`/admin/users/${id}`, userData).then(res => res.data),

  delete: (id: number): Promise<void> =>
    api.delete(`/admin/users/${id}`).then(res => res.data),

  // Self-service endpoints
  getProfile: (): Promise<User> =>
    api.get('/admin/profile').then(res => res.data),

  updateProfile: (profileData: UserProfileUpdate): Promise<User> =>
    api.patch('/admin/profile', profileData).then(res => res.data),

  changePassword: (passwordData: PasswordChangeRequest): Promise<void> =>
    api.post('/admin/change-password', passwordData).then(res => res.data),
};
