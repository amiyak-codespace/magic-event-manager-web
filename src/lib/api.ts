import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

let redirectingToLogin = false;

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      const onPublicJoinPage = window.location.pathname.startsWith('/join/');
      const onLoginPage = window.location.pathname === '/login';
      if (!onPublicJoinPage && !onLoginPage && !redirectingToLogin) {
        redirectingToLogin = true;
        window.location.replace('/login');
      }
    }
    return Promise.reject(err);
  }
);

export default api;

export const authApi = {
  register: (data: {
    name: string; email: string; password: string; role?: string;
    terms_accepted?: boolean; privacy_accepted?: boolean; consent_version?: string;
  }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  acceptConsent: (data?: { consent_version?: string }) =>
    api.post('/auth/consent', {
      terms_accepted: true,
      privacy_accepted: true,
      consent_version: data?.consent_version || '2026-03',
    }),
  updateProfile: (data: { name: string; avatar?: string; bio?: string; phone?: string; location?: string }) =>
    api.put('/auth/me', data),
};

export const eventsApi = {
  list: (params?: Record<string, string | number>) => api.get('/events', { params }),
  trending: () => api.get('/events/trending'),
  categories: () => api.get('/events/categories'),
  get: (id: string) => api.get(`/events/${id}`),
  mine: () => api.get('/events/mine'),
  create: (data: Record<string, unknown>) => api.post('/events', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/events/${id}`, data),
  delete: (id: string) => api.delete(`/events/${id}`),
  like: (id: string) => api.post(`/events/${id}/like`),
  myStatus: (id: string) => api.get(`/events/${id}/my-status`),
  goingAttendees: (id: string, limit = 20, offset = 0) => api.get(`/events/${id}/going?limit=${limit}&offset=${offset}`),
  rsvp: (id: string, status: string, phone?: string, contact_email?: string, notes?: string) => api.post(`/events/${id}/rsvp`, { status, phone, contact_email, notes }),
  joinMeeting: (id: string, join_code: string) => api.post(`/events/${id}/join`, { join_code }),
  attendees: (id: string) => api.get(`/events/${id}/attendees`),
  checkIn: (id: string, ticket_code: string) =>
    api.post(`/events/${id}/checkin`, { ticket_code }),
  startEvent: (id: string) => api.post(`/events/${id}/start`),
  stopEvent: (id: string) => api.post(`/events/${id}/stop`),
  cloneEvent: (id: string, data?: Record<string, unknown>) => api.post(`/events/${id}/clone`, data || {}),
  updateRecurrence: (id: string, data: Record<string, unknown>) => api.patch(`/events/${id}/recurrence`, data),
  changeStatus: (id: string, status: string) =>
    api.patch(`/events/${id}/status`, { status }),
  joinWaitlist: (id: string) => api.post(`/events/${id}/waitlist`),
  leaveWaitlist: (id: string) => api.delete(`/events/${id}/waitlist`),
  waitlistPosition: (id: string) => api.get(`/events/${id}/waitlist/position`),
  sendInvites: (id: string, emails: string[], custom_message?: string) =>
    api.post(`/events/${id}/invite`, { emails, custom_message }),
  comments: (id: string) => api.get(`/events/${id}/comments`),
  addComment: (id: string, content: string, parent_id?: string) =>
    api.post(`/events/${id}/comments`, { content, parent_id }),
  deleteComment: (eventId: string, commentId: string) =>
    api.delete(`/events/${eventId}/comments/${commentId}`),
  pinComment: (eventId: string, commentId: string) =>
    api.patch(`/events/${eventId}/comments/${commentId}/pin`),
};

export const rsvpApi = {
  mine: () => api.get('/rsvps/mine'),
};

export const notificationsApi = {
  list: () => api.get('/notifications'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/all/read'),
};

export const invitationsApi = {
  create: (data: { event_id: string; template?: string; custom_message?: string }) =>
    api.post('/invitations', data),
  get: (token: string) => api.get(`/invitations/${token}`),
};

export const aiApi = {
  chat: (message: string, context?: string) =>
    api.post('/ai/chat', { message, context }),
  generateEvent: (description: string, target_language?: string) =>
    api.post('/ai/generate-event', { description, target_language }),
  generateInviteCreative: (payload: {
    template: 'birthday' | 'wedding' | 'corporate' | 'custom';
    title: string;
    short_description?: string;
    description?: string;
    city?: string;
    start_date?: string;
    color_palette?: string[];
  }) => api.post('/ai/generate-invite-creative', payload),
};

export const mediaApi = {
  uploadCoverPhoto: (file: File) => {
    const formData = new FormData();
    formData.append('cover', file);
    return api.post('/media/cover', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const billingApi = {
  publicPlans: () => api.get('/billing/plans/public'),
  myPlan: () => api.get('/billing/plans/me'),
  createOrder: (plan_code: string) => api.post('/billing/checkout/order', { plan_code }),
  verifyOrder: (data: {
    local_order_id: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature?: string;
  }) => api.post('/billing/checkout/verify', data),
  adminPlans: () => api.get('/billing/plans'),
  adminCreatePlan: (data: Record<string, unknown>) => api.post('/billing/plans', data),
  adminUpdatePlan: (id: string, data: Record<string, unknown>) => api.patch(`/billing/plans/${id}`, data),
  adminUsers: (q?: string) => api.get(`/billing/users${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  adminUpdateUser: (id: string, data: Record<string, unknown>) => api.patch(`/billing/users/${id}`, data),
};

export const campaignApi = {
  list: () => api.get('/campaigns'),
  complianceCheck: (id: string) => api.get(`/campaigns/${id}/compliance-check`),
  send: (id: string) => api.post(`/campaigns/${id}/send`, {}),
  testSend: (id: string, payload: { email?: string; phone?: string; message?: string }) => api.post(`/campaigns/${id}/test-send`, payload),
  delete: (id: string) => api.delete(`/campaigns/${id}`),
  getServiceState: () => api.get('/campaigns/service-state'),
  setServiceState: (disabled: boolean) => api.patch('/campaigns/service-state', { disabled }),
};
