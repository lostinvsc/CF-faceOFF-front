import axios from 'axios';
import type { User, Submission, ApiService } from '../types';

const CF_API_URL = 'https://codeforces.com/api';
const BACKEND_URL = 'http://locahost:3000';
// const BACKEND_URL = 'https://cf-face-off.vercel.app';

// Rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000; // 2 seconds in milliseconds

const waitForRateLimit = async () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();
};

export const api: ApiService = {
  getUser: async (handle: string) => {
    if (!handle) {
      throw new Error('No handle provided');
    }
    await waitForRateLimit();
    try {
      const response = await axios.get(`${CF_API_URL}/user.info`, {
        params: { handles: handle }
      });
      
      if (response.data.status === 'FAILED') {
        throw new Error(`User '${handle}' not found on Codeforces`);
      }
      
      if (!response.data.result || response.data.result.length === 0) {
        throw new Error(`User '${handle}' not found on Codeforces`);
      }
      
      return response.data.result[0];
    } catch (err: any) {
      if (err.response?.status === 400 || err.response?.data?.comment) {
        throw new Error(`User '${handle}' not found on Codeforces`);
      }
      throw err;
    }
  },

  getUserSubmissions: async (handle: string) => {
    if (!handle) {
      throw new Error('No handle provided');
    }
    await waitForRateLimit();
    const response = await axios.get(`${CF_API_URL}/user.status`, {
      params: {
        handle,
        from: 1,
        count: 10000
      }
    });
    
    if (response.data.status === 'FAILED') {
      throw new Error(response.data.comment || 'Failed to fetch user submissions');
    }
    
    return response.data.result || [];
  },

  getRatingHistory: async (handle: string) => {
    if (!handle) {
      throw new Error('No handle provided');
    }
    await waitForRateLimit();
    const response = await axios.get(`${CF_API_URL}/user.rating`, {
      params: { handle }
    });
    
    if (response.data.status === 'FAILED') {
      throw new Error(response.data.comment || 'Failed to fetch rating history');
    }
    
    return response.data.result || [];
  },

  getUsers: async (handles: string[]) => {
    if (!handles || handles.length === 0) {
      throw new Error('No handles provided');
    }

    // Fetch users one by one
    const users = [];
    for (const handle of handles) {
      await waitForRateLimit();
      const response = await axios.get(`${CF_API_URL}/user.info`, {
        params: { handles: handle }
      });
      
      if (response.data.status === 'FAILED') {
        throw new Error(response.data.comment || 'Failed to fetch users data');
      }
      
      if (response.data.result && response.data.result.length > 0) {
        users.push(response.data.result[0]);
      }
    }
    return users;
  },

  getUsersSubmissions: async (handles: string[]) => {
    if (!handles || handles.length === 0) {
      throw new Error('No handles provided');
    }

    const result: { [key: string]: Submission[] } = {};
    
    // Fetch submissions sequentially to respect rate limiting
    for (const handle of handles) {
      await waitForRateLimit();
      const response = await axios.get(`${CF_API_URL}/user.status`, {
        params: {
          handle,
          from: 1,
          count: 10000
        }
      });
      
      if (response.data.status === 'FAILED') {
        throw new Error(response.data.comment || `Failed to fetch submissions for ${handle}`);
      }
      
      result[handle] = response.data.result || [];
    }
    
    return result;
  },

  logVisit: async (action: 'SEARCH' | 'COMPARE', handles: string[], path: string) => {
    try {
      await axios.post(`${BACKEND_URL}/visitors/log`, {
        ipAddress: "::1", 
        action,
        handles,
        userAgent: navigator.userAgent,  // Get User-Agent dynamically
        path,
        timestamp: new Date().toISOString()
      },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      console.error('Failed to log visit:', error);
    }
  },

  getVisitorStats: async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/visitors/stats`);
      return response.data;
    } catch (error) {
      console.error('Failed to get visitor stats:', error);
      throw error;
    }
  }
}; 
