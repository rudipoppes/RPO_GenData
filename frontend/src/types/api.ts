export interface User {
  id: number;
  email: string;
  username: string;
  role: 'Admin' | 'Editor' | 'Viewer';
  created_at: string;
  last_login_at?: string;
}

export interface Collection {
  id: number;
  name: string;
  description?: string;
  owner_id: number;
  created_at: string;
  updated_at: string;
  fields?: Field[];
}

export interface Field {
  id: number;
  name: string;
  field_type: string;
  value_type: 'TEXT_FIXED' | 'NUMBER_FIXED' | 'FLOAT_FIXED' | 'EPOCH_NOW' | 'NUMBER_RANGE' | 'FLOAT_RANGE' | 'INCREMENT' | 'DECREMENT';
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
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  message: string;
}

export interface CreateCollectionRequest {
  name: string;
  description?: string;
}

export interface CreateFieldRequest {
  collection_type: "Performance" | "Configuration";
  field_name: string;
  value_type: 'TEXT_FIXED' | 'NUMBER_FIXED' | 'FLOAT_FIXED' | 'EPOCH_NOW' | 'NUMBER_RANGE' | 'FLOAT_RANGE' | 'INCREMENT' | 'DECREMENT';
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
