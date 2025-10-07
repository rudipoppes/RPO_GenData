export interface User {
  id: number;
  username: string;
  role: 'admin' | 'user';
  created_at: string;
}

export interface Collection {
  id: number;
  name: string;
  description?: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export interface Field {
  id: number;
  name: string;
  field_type: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'uuid';
  value_type: 'fixed' | 'range' | 'list' | 'pattern' | 'epoch' | 'increment' | 'decrement';
  value_config: Record<string, any>;
  collection_id: number;
  created_at: string;
  updated_at: string;
}

export interface APIKey {
  id: number;
  name: string;
  key_prefix: string;
  scopes: string[];
  allowed_collections: number[];
  is_active: boolean;
  user_id: number;
  created_at: string;
  updated_at: string;
  expires_at?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface CreateCollectionRequest {
  name: string;
  description?: string;
}

export interface CreateFieldRequest {
  name: string;
  field_type: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'uuid';
  value_type: 'fixed' | 'range' | 'list' | 'pattern' | 'epoch' | 'increment' | 'decrement';
  value_config: Record<string, any>;
}

export interface CreateAPIKeyRequest {
  name: string;
  scopes: string[];
  allowed_collections: number[];
  expires_at?: string;
}

export interface CreateAPIKeyResponse {
  id: number;
  name: string;
  key: string;
  scopes: string[];
  allowed_collections: number[];
  expires_at?: string;
}
