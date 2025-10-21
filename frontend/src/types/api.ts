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
  owner_username?: string;
  created_at: string;
  updated_at: string;
  fields?: Field[];
}

export interface Field {
  id: number;
  collection_id: number;
  collection_type: "Performance" | "Configuration";
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
  user_id: number;
  key_prefix: string;
  label: string;
  status: 'active' | 'revoked';
  expires_at?: string;
  last_used_at?: string;
  created_at: string;
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

export interface UpdateCollectionRequest {
  name: string;
  description?: string;
}

export interface CreateFieldRequest {
  collection_type: "Performance" | "Configuration";
  field_name: string;
  value_type: 'TEXT_FIXED' | 'NUMBER_FIXED' | 'FLOAT_FIXED' | 'EPOCH_NOW' | 'NUMBER_RANGE' | 'FLOAT_RANGE' | 'INCREMENT' | 'DECREMENT';
  
  // Fixed value fields (optional)
  fixed_value_text?: string;
  fixed_value_number?: number;
  fixed_value_float?: number;
  
  // Range fields (optional)
  range_start_number?: number;
  range_end_number?: number;
  range_start_float?: number;
  range_end_float?: number;
  float_precision?: number;
  
  // Increment/Decrement fields (optional)
  start_number?: number;
  step_number?: number;
  reset_number?: number;
  current_number?: number;
}

export interface CreateAPIKeyRequest {
  label: string;
  expires_at?: string;
  collection_ids?: number[];
}

export interface CreateAPIKeyResponse {
  id: number;
  user_id: number;
  key_prefix: string;
  label: string;
  status: 'active' | 'revoked';
  expires_at?: string;
  last_used_at?: string;
  created_at: string;
  key: string;
}

// User Management Types
export interface UserCreate {
  email: string;
  username: string;
  password: string;
  role: 'Admin' | 'Editor' | 'Viewer';
}

export interface UserUpdate {
  email?: string;
  username?: string;
  role?: 'Admin' | 'Editor' | 'Viewer';
  password?: string;
}

export interface UserProfileUpdate {
  email?: string;
  username?: string;
}

export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
}

// Spike Schedule Types
export interface SpikeScheduleField {
  id?: number;
  original_field_id: number;
  collection_type: "Performance" | "Configuration";
  field_name: string;
  value_type: 'TEXT_FIXED' | 'NUMBER_FIXED' | 'FLOAT_FIXED' | 'EPOCH_NOW' | 'NUMBER_RANGE' | 'FLOAT_RANGE' | 'INCREMENT' | 'DECREMENT';
  is_editable: boolean;  // Only true for numeric performance types
  
  // All possible field values
  fixed_value_text?: string;
  fixed_value_number?: number;
  fixed_value_float?: number;
  range_start_number?: number;
  range_end_number?: number;
  range_start_float?: number;
  range_end_float?: number;
  float_precision?: number;
  start_number?: number;
  step_number?: number;
  reset_number?: number;
  current_number?: number;
}

export interface SpikeSchedule {
  id: number;
  collection_id: number;
  collection_name: string;
  name: string;
  start_datetime: string;
  end_datetime: string;
  status: 'scheduled' | 'active' | 'expired';
  spike_fields: SpikeScheduleField[];
  created_at: string;
  updated_at: string;
}

export interface CreateSpikeScheduleRequest {
  collection_id: number;
  name: string;
  start_datetime: string;
  end_datetime: string;
  spike_fields: Array<{
    original_field_id: number;
    fixed_value_number?: number;
    fixed_value_float?: number;
    range_start_number?: number;
    range_end_number?: number;
    range_start_float?: number;
    range_end_float?: number;
    float_precision?: number;
    start_number?: number;
    step_number?: number;
    reset_number?: number;
  }>;
}

export interface UpdateSpikeScheduleRequest {
  name?: string;
  start_datetime?: string;
  end_datetime?: string;
  spike_fields?: Array<{
    original_field_id: number;
    fixed_value_number?: number;
    fixed_value_float?: number;
    range_start_number?: number;
    range_end_number?: number;
    range_start_float?: number;
    range_end_float?: number;
    float_precision?: number;
    start_number?: number;
    step_number?: number;
    reset_number?: number;
  }>;
}
