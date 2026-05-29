export interface AgendaEvent {
  id: string;
  title: string;
  description?: string;
  start: string; // ISO DateTime string
  end: string; // ISO DateTime string
  location?: string;
  color: string; // Tailwind color class or hex
  isSynced: boolean;
  googleEventId?: string;
  calendarId?: string;
  notifyBefore?: number; // Minutes before event, e.g., 5, 10, 15, 30, 0 (on time), or null (disabled)
  notificationSent?: boolean;
}

export interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  backgroundColor?: string;
  foregroundColor?: string;
}

export interface SyncStats {
  pulled: number;
  pushed: number;
  failed: number;
}
