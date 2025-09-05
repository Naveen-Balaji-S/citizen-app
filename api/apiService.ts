// src/api/apiService.ts
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../config/apiConfig';

// This is our central function for making authenticated API requests.
export const authenticatedFetch = async (endpoint: string, options: RequestInit = {}) => {
  // 1. Get the user's token from secure storage.
  const token = await SecureStore.getItemAsync('user_token');

  if (!token) {
    // If there's no token, the user is not logged in.
    // In a real app, you might navigate them back to the login screen here.
    throw new Error('User is not authenticated');
  }

  // 2. Prepare the request headers.
  const headers = {
    ...options.headers,
    // Add the Authorization header with the Bearer token.
    'Authorization': `Bearer ${token}`,
  };

  // 3. Make the fetch request with the URL and the enhanced options.
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'An API error occurred');
  }

  return response.json(); // Return the JSON data from the response
};