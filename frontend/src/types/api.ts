export interface User {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Collection {
  id: number;
  name: string;
  owner_id: number;
  created_at: string;
  updated_at: string;
  fields?: Field[];
}

export interface Field {
  id: number;
  collection_id: number;
  collection_type: 'Performance' | 'Configuration';
  field_name: string;
  value_type: 'TEXT_FIXED' | 'NUMBER_FIXED' | 'FLOAT_FIXED' | 'EPOCH_NOW' | 'NUMBER_RANGE' | 'FLOAT_RANGE' | 'INCREMENT' | 'DECREMENT';
  
  // Fixed value fields
  fixed_value_text?: string;
  fixed_value_number?: number;
  fixed_value_float?: number;
  
  // Range fields
  range_start_number?: number;
  range_end_number?: number;
  range_start_float?: number;
  range_end_float?: number;
  float_precision?: number;
  
  // Increment/Decrement fields
  start_number?: number;
  step_number?: number;
  reset_number?: number;
  current_number?: number;
  
  created_at: string;
  updated_at: string;
}

export interface APIKey {
  id: number;
  key_name: string;
  key_hash: string;
  owner_id: number;
  is_active: boolean;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCollectionRequest {
  name: string;
}

export interface UpdateCollectionRequest {
  name?: string;
}

export interface CreateFieldRequest {
  collection_type: 'Performance' | 'Configuration';
  field_name: string;
  value_type: 'TEXT_FIXED' | 'NUMBER_FIXED' | 'FLOAT_FIXED' | 'EPOCH_NOW' | 'NUMBER_RANGE' | 'FLOAT_RANGE' | 'INCREMENT' | 'DECREMENT';
  
  // Fixed value fields
  fixed_value_text?: string;
  fixed_value_number?: number;
  fixed_value_float?: number;
  
  // Range fields
  range_start_number?: number;
  range_end_number?: number;
  range_start_float?: number;
  range_end_float?: number;
  float_precision?: number;
  
  // Increment/Decrement fields
  start_number?: number;
  step_number?: number;
  reset_number?: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

// Utility type for API responses
export interface APIResponse<T> {
  data: T;
  message?: string;
}

export interface CreateAPIKeyRequest {
  name: string;
  scopes: string[];
  expires_at?: string;
}

export interface CreateAPIKeyResponse {
  id: number;
  key_name: string;
  api_key: string; // The actual key value, only returned on creation
  expires_at?: string;
}
