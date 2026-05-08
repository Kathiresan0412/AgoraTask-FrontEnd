import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('agoratask_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 responses globally — clear auth state
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('agoratask_token');
        localStorage.removeItem('agoratask_user');
      }
    }
    return Promise.reject(error);
  }
);

// --- Auth API ---

export interface LoginPayload {
  email: string;
  password: string;
  role?: 'customer' | 'provider' | 'admin';
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: 'customer' | 'provider';
}

export interface GoogleLoginPayload {
  credential: string;
  role?: 'customer' | 'provider';
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    profileImage: string;
  };
}

export interface ServiceTypeDto {
  id: string;
  parent_id: string | null;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  image_url?: string | null;
  imageUrl?: string | null;
  color: string | null;
  active: boolean;
  sort_order: number;
  created_at?: string;
}

export interface ServiceTypePayload {
  parent_id?: string | null;
  slug?: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  active?: boolean;
  sort_order?: number;
}

export interface AdminProviderDto {
  id: string;
  userId: string;
  businessName: string;
  category: string;
  location: string;
  status: 'pending' | 'active' | 'rejected';
  createdAt: string;
  ownerName: string;
  email: string;
  phone: string;
  profileImage: string;
  isActive: boolean;
}

export interface AdminProviderFilters {
  search?: string;
  status?: string;
  category?: string;
  location?: string;
}

export interface AdminLogFilters {
  search?: string;
  success?: string;
  action?: string;
  entityType?: string;
  from?: string;
  to?: string;
}

export interface AdminServiceDto {
  id: string;
  providerId: string;
  title: string;
  description: string | null;
  basePrice: number | null;
  priceType: 'fixed' | 'hourly' | 'quote';
  durationMins: number | null;
  serviceArea: string[];
  images: string[];
  status: 'draft' | 'active' | 'paused' | 'pending_review' | 'rejected';
  createdAt: string;
  updatedAt?: string;
  provider: {
    name: string;
    email: string;
    profileImage: string;
  };
  serviceTypes: ServiceTypeDto[];
}

export interface MessageDto {
  id: string;
  conversationId: string;
  fromUserId: string;
  toUserId: string;
  from: string;
  fromName: string;
  to: string;
  toName: string;
  text: string;
  timestamp: string;
  read: boolean;
}

export interface ConversationDto {
  id: string;
  participantIds: string[];
  participants: string[];
  participantNames: string[];
  messages: MessageDto[];
}

export interface ProviderServiceDto {
  id: string;
  title: string;
  description: string | null;
  base_price: number | null;
  price_type: 'fixed' | 'hourly' | 'quote';
  duration_mins: number | null;
  service_area: string[] | null;
  images: string[] | null;
  status: 'draft' | 'active' | 'paused' | 'pending_review' | 'rejected';
  created_at: string;
  updated_at?: string;
  service_types: ServiceTypeDto[];
}

export interface ProviderServicePayload {
  title: string;
  description?: string;
  base_price?: number | null;
  price_type?: 'fixed' | 'hourly' | 'quote';
  duration_mins?: number | null;
  service_area?: string[];
  images?: string[];
  status?: 'draft' | 'active' | 'paused' | 'pending_review' | 'rejected';
  service_type_ids: string[];
}

export interface PublicServiceDto {
  id: string;
  title: string;
  description: string | null;
  basePrice: number | null;
  priceType: 'fixed' | 'hourly' | 'quote';
  durationMins: number | null;
  serviceArea: string[];
  location: string;
  images: string[];
  status: string;
  createdAt: string;
  provider: {
    id: string;
    name: string;
    slug: string;
    email: string;
    profileImage: string;
  };
  serviceTypes: ServiceTypeDto[];
  categories: string[];
}

export interface PublicProviderDto {
  id: string;
  userId: string;
  slug: string;
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  description: string;
  category: string;
  location: string;
  status: string;
  profileImage: string;
  coverImage: string;
  services: PublicServiceDto[];
  serviceCategories: string[];
}

export interface PublicServiceFilters {
  country?: 'lk' | 'ca';
  category?: string;
  provinceId?: string;
  districtId?: string;
  cityId?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ReviewDto {
  id: string;
  bookingId: string | null;
  providerServiceId: string | null;
  providerId: string | null;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerProfileImage: string;
  isForSystem: boolean;
  rating: number;
  comment: string;
  status: 'pending' | 'visible' | 'hidden' | 'deleted';
  createdAt: string;
  updatedAt: string;
  isMine?: boolean;
}

export interface ReviewPayload {
  providerId?: string;
  providerServiceId?: string;
  bookingId?: string | null;
  rating: number;
  comment?: string;
}

export interface ReviewTarget {
  providerId?: string;
  providerServiceId?: string;
}

export interface AdminReviewDto {
  id: string;
  bookingId: string | null;
  providerServiceId: string | null;
  providerId: string | null;
  customerId: string | null;
  customerName: string;
  customerEmail: string;
  providerName: string;
  providerEmail: string;
  serviceTitle: string;
  isForSystem: boolean;
  rating: number;
  comment: string;
  status: 'pending' | 'visible' | 'hidden' | 'deleted';
  createdAt: string;
  updatedAt: string;
}

export interface AdminLoginHistoryDto {
  id: string;
  userId: string | null;
  email: string;
  success: boolean;
  failureReason: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
    role: string;
  } | null;
}

export interface AdminActivityLogDto {
  id: string;
  actorId: string | null;
  actorName: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

export interface BookingDto {
  id: string;
  serviceId: string | null;
  providerServiceId: string | null;
  customerId: string;
  providerId: string;
  customerName: string;
  providerName: string;
  serviceTitle: string;
  scheduledTime: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';
  amount: number | null;
  createdAt: string;
}

export interface BookingPayload {
  providerServiceId: string;
  scheduledTime: string;
}

export const authApi = {
  login: (data: LoginPayload) =>
    api.post<AuthResponse>('/auth/login', data),

  register: (data: RegisterPayload) =>
    api.post<AuthResponse>('/auth/register', data),

  googleLogin: (data: GoogleLoginPayload) =>
    api.post<AuthResponse>('/auth/google', data),

  getMe: () =>
    api.get<AuthResponse['user']>('/auth/me'),
};

export const serviceTypeApi = {
  list: () =>
    api.get<ServiceTypeDto[]>('/service-types'),

  create: (data: ServiceTypePayload) =>
    api.post<ServiceTypeDto>('/service-types', data),

  update: (id: string, data: Partial<ServiceTypePayload>) =>
    api.put<ServiceTypeDto>(`/service-types/${id}`, data),

  updateStatus: (id: string, active: boolean) =>
    api.patch<ServiceTypeDto>(`/service-types/${id}/status`, { active }),

  delete: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`/service-types/${id}`),
};

export const adminApi = {
  listServices: () =>
    api.get<AdminServiceDto[]>('/admin/services'),

  approveService: (id: string) =>
    api.post<{ success: boolean; message: string }>(`/admin/services/${id}/approve`),

  rejectService: (id: string) =>
    api.post<{ success: boolean; message: string }>(`/admin/services/${id}/reject`),

  listProviders: (filters: AdminProviderFilters = {}) =>
    api.get<AdminProviderDto[]>('/admin/providers', { params: filters }),

  listReviews: (status = 'all') =>
    api.get<AdminReviewDto[]>('/admin/reviews', { params: { status } }),

  listLoginHistory: (filters: AdminLogFilters = {}) =>
    api.get<AdminLoginHistoryDto[]>('/admin/login-history', { params: filters }),

  listActivityLogs: (filters: AdminLogFilters = {}) =>
    api.get<AdminActivityLogDto[]>('/admin/activity-logs', { params: filters }),

  updateReviewStatus: (id: string, status: AdminReviewDto['status']) =>
    api.patch<AdminReviewDto>(`/admin/reviews/${id}/status`, { status }),

  approveProvider: (id: string) =>
    api.post<{ success: boolean; message: string }>(`/admin/providers/${id}/approve`),

  rejectProvider: (id: string) =>
    api.post<{ success: boolean; message: string }>(`/admin/providers/${id}/reject`),
};

export const messageApi = {
  listConversations: () =>
    api.get<ConversationDto[]>('/messages/conversations'),

  getMessages: (conversationId: string) =>
    api.get<MessageDto[]>(`/messages/conversations/${conversationId}`),

  send: (data: { toUserId?: string; toEmail?: string; text: string }) =>
    api.post<MessageDto>('/messages', data),

  update: (messageId: string, text: string) =>
    api.put<MessageDto>(`/messages/${messageId}`, { text }),

  delete: (messageId: string) =>
    api.delete<{ success: boolean }>(`/messages/${messageId}`),

  markRead: (conversationId: string) =>
    api.patch<{ success: boolean }>(`/messages/conversations/${conversationId}/read`),
};

export const providerApi = {
  listServices: () =>
    api.get<ProviderServiceDto[]>('/provider/services'),

  createService: (data: ProviderServicePayload) =>
    api.post<ProviderServiceDto>('/provider/services', data),

  updateService: (id: string, data: ProviderServicePayload) =>
    api.put<ProviderServiceDto>(`/provider/services/${id}`, data),

  deleteService: (id: string) =>
    api.delete<{ success: boolean }>(`/provider/services/${id}`),
};

export const bookingApi = {
  listMine: () =>
    api.get<BookingDto[]>('/bookings/my'),

  create: (data: BookingPayload) =>
    api.post<BookingDto>('/bookings', data),

  cancel: (id: string) =>
    api.post<BookingDto>(`/bookings/${id}/cancel`),

  accept: (id: string) =>
    api.post<BookingDto>(`/bookings/${id}/accept`),

  decline: (id: string) =>
    api.post<BookingDto>(`/bookings/${id}/decline`),
};

export const publicServiceApi = {
  list: (filters: PublicServiceFilters = {}) =>
    api.get<PaginatedResponse<PublicServiceDto>>('/v1/services', { params: filters }),

  getProvider: (slug: string) =>
    api.get<PublicProviderDto>(`/v1/services/providers/${slug}`),

  getService: (slug: string) =>
    api.get<PublicServiceDto>(`/v1/services/${slug}`),
};

export const reviewApi = {
  list: (target: ReviewTarget) =>
    api.get<ReviewDto[]>('/v1/reviews', { params: target }),

  listProvider: (providerId: string) =>
    api.get<ReviewDto[]>(`/v1/reviews/providers/${providerId}`),

  listService: (providerServiceId: string) =>
    api.get<ReviewDto[]>(`/v1/reviews/services/${providerServiceId}`),

  listSystem: () =>
    api.get<ReviewDto[]>('/v1/reviews/system'),

  getMine: (target: ReviewTarget) =>
    api.get<ReviewDto | null>('/v1/reviews/my', { params: target }),

  getMySystem: () =>
    api.get<ReviewDto | null>('/v1/reviews/system/my'),

  create: (data: ReviewPayload) =>
    api.post<ReviewDto>('/v1/reviews', data),

  createForProvider: (providerId: string, data: Omit<ReviewPayload, 'providerId' | 'providerServiceId'>) =>
    api.post<ReviewDto>(`/v1/reviews/providers/${providerId}`, data),

  createForService: (providerServiceId: string, data: Omit<ReviewPayload, 'providerId' | 'providerServiceId'>) =>
    api.post<ReviewDto>(`/v1/reviews/services/${providerServiceId}`, data),

  createForSystem: (data: Omit<ReviewPayload, 'providerId' | 'providerServiceId' | 'bookingId'>) =>
    api.post<ReviewDto>('/v1/reviews/system', data),

  update: (reviewId: string, data: Partial<Pick<ReviewPayload, 'rating' | 'comment'>>) =>
    api.put<ReviewDto>(`/v1/reviews/${reviewId}`, data),

  delete: (reviewId: string) =>
    api.delete<{ success: boolean }>(`/v1/reviews/${reviewId}`),
};

export default api;
