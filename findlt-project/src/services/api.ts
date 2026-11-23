import axios from 'axios';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});


// Attach Authorization Bearer token automatically
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('findlt_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to catch 401 unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token if expired or unauthorized
      if (localStorage.getItem('findlt_token') && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('findlt_token');
        localStorage.removeItem('findlt_user');
      }
    }
    return Promise.reject(error);
  }
);

// Types
export interface UserProfile {
  id: string;
  full_name: string;
  campus_id: string;
  email: string;
  phone?: string;
  department: string;
  course: string;
  semester: string;
  role: 'student' | 'admin' | 'security';
  account_status: 'active' | 'suspended';
  created_at?: string;
  reports_count?: number;
  claims_count?: number;
}

export interface Item {
  id: string;
  user_id?: string;
  item_name: string;
  description: string;
  category: string;
  item_type: 'lost' | 'found';
  brand?: string;
  color?: string;
  image_url?: string;
  report_date: string;
  location: string;
  submitted_to?: string;
  status: 'open' | 'claimed' | 'returned' | 'expired';
  additional_notes?: string;
  created_at: string;
  updated_at: string;
  reporter_name?: string;
  reporter_campus_id?: string;
  reporter_email?: string;
}

export interface Claim {
  id: string;
  item_id: string;
  claimant_id: string;
  ownership_description: string;
  evidence_url?: string;
  status: 'Pending' | 'Under Review' | 'Approved' | 'Rejected' | 'Completed';
  admin_remarks?: string;
  reviewed_by?: string;
  created_at: string;
  updated_at: string;
  item_name?: string;
  item_category?: string;
  item_image?: string;
  item_location?: string;
  item_status?: string;
  claimant_name?: string;
  claimant_campus_id?: string;
  claimant_email?: string;
  claimant_phone?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
}

export interface PublicStats {
  total_items: number;
  successfully_returned: number;
  active_reports: number;
  total_found: number;
  total_lost: number;
}

export interface AdminActivityLog {
  id: string;
  admin_id: string;
  admin_name: string;
  action_type: string;
  target_type: string;
  target_id: string;
  details: string;
  previous_state?: string;
  new_state?: string;
  created_at: string;
}

export interface SystemSettings {
  id: string;
  system_name: string;
  college_name: string;
  security_hotline: string;
  central_office: string;
  contact_email: string;
  operating_hours: string;
  item_retention_days: number;
  auto_approve_claims: boolean;
  updated_at: string;
}

export interface UserDetailsResponse {
  user: UserProfile;
  lost_items: Item[];
  found_items: Item[];
  claims: Claim[];
}

export interface ReturnedItemRecord {
  id: string;
  item_id: string;
  item_name: string;
  category: string;
  image_url?: string;
  location: string;
  claimant_name: string;
  claimant_campus_id: string;
  claimant_email: string;
  verified_by: string;
  handover_date: string;
  notes?: string;
}

// API methods
export const api = {
  // Stats & Categories
  getPublicStats: async (): Promise<PublicStats> => {
    const res = await apiClient.get('/stats/public');
    return res.data;
  },
  getPublicSettings: async (): Promise<SystemSettings> => {
    const res = await apiClient.get('/settings/public');
    return res.data;
  },
  getCategories: async () => {
    const res = await apiClient.get('/categories');
    return res.data;
  },

  // Auth
  register: async (payload: any) => {
    const res = await apiClient.post('/auth/register', payload);
    return res.data;
  },
  login: async (identifier: string, password: string) => {
    const res = await apiClient.post('/auth/login', { identifier, password });
    return res.data;
  },
  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      localStorage.removeItem('findlt_token');
      localStorage.removeItem('findlt_user');
    }
  },
  getMe: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },

  // Items
  getItems: async (params?: Record<string, any>) => {
    const res = await apiClient.get('/items', { params });
    return res.data;
  },
  getItem: async (id: string) => {
    const res = await apiClient.get(`/items/${id}`);
    return res.data;
  },
  reportLost: async (payload: any) => {
    const res = await apiClient.post('/items/lost', payload);
    return res.data;
  },
  reportFound: async (payload: any) => {
    const res = await apiClient.post('/items/found', payload);
    return res.data;
  },
  updateItem: async (id: string, payload: any) => {
    const res = await apiClient.put(`/items/${id}`, payload);
    return res.data;
  },
  deleteItem: async (id: string) => {
    const res = await apiClient.delete(`/items/${id}`);
    return res.data;
  },
  uploadImage: async (file: File): Promise<{ url: string; message: string }> => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await apiClient.post('/items/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },


  // Claims
  submitClaim: async (payload: { item_id: string; ownership_description: string; evidence_url?: string }) => {
    const res = await apiClient.post('/claims', payload);
    return res.data;
  },
  getMyClaims: async () => {
    const res = await apiClient.get('/claims/my');
    return res.data;
  },
  getClaim: async (id: string) => {
    const res = await apiClient.get(`/claims/${id}`);
    return res.data;
  },

  // Student Reports
  getMyReports: async () => {
    const res = await apiClient.get('/my/reports');
    return res.data;
  },

  // Notifications
  getNotifications: async () => {
    const token = localStorage.getItem('findlt_token');
    if (!token) {
      return { notifications: [], unread_count: 0 };
    }
    const res = await apiClient.get('/notifications');
    return res.data;
  },
  markNotificationRead: async (id: string) => {
    const res = await apiClient.put(`/notifications/${id}/read`);
    return res.data;
  },
  markAllNotificationsRead: async () => {
    const res = await apiClient.put('/notifications/read-all');
    return res.data;
  },

  // Admin
  getAdminDashboard: async () => {
    const res = await apiClient.get('/admin/dashboard');
    return res.data;
  },
  getAdminUsers: async () => {
    const res = await apiClient.get('/admin/users');
    return res.data;
  },
  getAdminUserDetails: async (id: string): Promise<UserDetailsResponse> => {
    const res = await apiClient.get(`/admin/users/${id}/details`);
    return res.data;
  },
  updateUserStatus: async (id: string, payload: { status?: string; role?: string }) => {
    const res = await apiClient.put(`/admin/users/${id}/status`, payload);
    return res.data;
  },
  getAdminItems: async () => {
    const res = await apiClient.get('/admin/items');
    return res.data;
  },
  updateItemStatus: async (id: string, status: string) => {
    const res = await apiClient.put(`/admin/items/${id}/status`, { status });
    return res.data;
  },
  updateAdminItem: async (id: string, payload: any) => {
    const res = await apiClient.put(`/admin/items/${id}`, payload);
    return res.data;
  },
  deleteAdminItem: async (id: string) => {
    const res = await apiClient.delete(`/admin/items/${id}`);
    return res.data;
  },
  getAdminClaims: async () => {
    const res = await apiClient.get('/admin/claims');
    return res.data;
  },
  reviewClaim: async (id: string, payload: { status: string; admin_remarks?: string }) => {
    const res = await apiClient.put(`/admin/claims/${id}/review`, payload);
    return res.data;
  },
  recordHandover: async (payload: { item_id: string; claim_id: string; remarks?: string }) => {
    const res = await apiClient.post('/admin/handover', payload);
    return res.data;
  },
  getReturnedItems: async (): Promise<{ returned_items: ReturnedItemRecord[] }> => {
    const res = await apiClient.get('/admin/returned-items');
    return res.data;
  },
  getAdminCategories: async () => {
    const res = await apiClient.get('/admin/categories');
    return res.data;
  },
  addCategory: async (payload: { category_name: string; description?: string }) => {
    const res = await apiClient.post('/admin/categories', payload);
    return res.data;
  },
  updateCategory: async (id: string, payload: { category_name?: string; description?: string; is_active?: boolean }) => {
    const res = await apiClient.put(`/admin/categories/${id}`, payload);
    return res.data;
  },
  getAdminLogs: async (params?: { action?: string; search?: string }): Promise<{ logs: AdminActivityLog[] }> => {
    const res = await apiClient.get('/admin/logs', { params });
    return res.data;
  },
  sendBroadcast: async (payload: { title: string; message: string; notification_type?: string }) => {
    const res = await apiClient.post('/admin/broadcast', payload);
    return res.data;
  },
  sendDirectNotification: async (payload: { user_id: string; title: string; message: string; notification_type?: string }) => {
    const res = await apiClient.post('/admin/notify-user', payload);
    return res.data;
  },
  getAdminSettings: async (): Promise<{ settings: SystemSettings }> => {
    const res = await apiClient.get('/admin/settings');
    return res.data;
  },
  updateAdminSettings: async (payload: Partial<SystemSettings>): Promise<{ message: string; settings: SystemSettings }> => {
    const res = await apiClient.put('/admin/settings', payload);
    return res.data;
  }
};
