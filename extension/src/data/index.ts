// API Client Entry Point
// Exports the active API client implementation

// v2 Supabase client (default for Tabia v2)
export * from './supabaseClient';

// v1 Spring Boot client (kept for reference, unused)
// export * from './apiClient';

// Re-export shared types
export * from '../types/dto';
