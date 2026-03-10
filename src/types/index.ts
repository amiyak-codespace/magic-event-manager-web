export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'organizer' | 'admin';
  avatar: string | null;
  created_at?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
  color: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  short_description: string;
  category_id: number;
  category_name?: string;
  category_slug?: string;
  category_icon?: string;
  category_color?: string;
  organizer_id: string;
  organizer_name?: string;
  organizer_avatar?: string;
  organizer_email?: string;
  banner_url: string | null;
  venue_name: string;
  venue_address: string;
  city: string;
  state: string;
  country: string;
  start_date: string;
  end_date: string;
  registration_deadline: string | null;
  max_attendees: number | null;
  current_attendees: number;
  is_free: boolean;
  price: number;
  currency: string;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  event_started?: boolean;
  event_started_at?: string | null;
  is_recurring?: boolean;
  recurrence_frequency?: 'daily' | 'weekly' | 'monthly' | null;
  recurrence_interval?: number;
  recurrence_end_type?: 'never' | 'on_date' | 'after_count';
  recurrence_end_date?: string | null;
  recurrence_count_limit?: number | null;
  recurrence_generated_count?: number;
  recurrence_parent_id?: string | null;
  last_recurrence_generated_at?: string | null;
  is_private?: boolean;
  is_online: boolean;
  online_link: string | null;
  tags: string | null;
  invite_template?: 'birthday' | 'wedding' | 'corporate' | 'custom' | null;
  likes?: number;
  short_code?: string;
  waitlist_count?: number;
  show_attendees_public?: boolean;
  avg_rating?: number;
  feedback_count?: number;
  created_at: string;
}

export interface RSVP {
  id: string;
  event_id: string;
  user_id: string;
  status: 'going' | 'maybe' | 'not_going';
  ticket_code: string;
  checked_in: boolean;
  title?: string;
  start_date?: string;
  end_date?: string;
  city?: string;
  venue_name?: string;
  banner_url?: string;
  is_online?: boolean;
  online_link?: string;
  category_name?: string;
  category_icon?: string;
}

export interface Attendee {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  status: string;
  ticket_code: string;
  checked_in: boolean;
  checked_in_at: string | null;
  created_at: string;
  phone?: string | null;
  contact_email?: string | null;
  notes?: string | null;
}

export interface Comment {
  id: string;
  content: string;
  parent_id: string | null;
  is_pinned: boolean;
  created_at: string;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  user_role: string;
  replies?: Comment[];
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}
