import { GoogleCalendar, AgendaEvent } from '../types';

const API_BASE = 'https://www.googleapis.com/calendar/v3';

// Fetch available calendars for the user
export async function fetchUserCalendars(accessToken: string): Promise<GoogleCalendar[]> {
  const res = await fetch(`${API_BASE}/users/me/calendarList`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  
  if (!res.ok) {
    throw new Error(`Error recuperando calendarios: ${res.statusText}`);
  }
  
  const data = await res.json();
  return (data.items || []).map((item: any) => ({
    id: item.id,
    summary: item.summary,
    description: item.description,
    primary: item.primary || false,
    backgroundColor: item.backgroundColor,
    foregroundColor: item.foregroundColor,
  }));
}

// Fetch events from a specific calendar
export async function fetchCalendarEvents(
  accessToken: string,
  calendarId: string = 'primary',
  timeMin?: string
): Promise<AgendaEvent[]> {
  const url = new URL(`${API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`);
  url.searchParams.append('singleEvents', 'true');
  url.searchParams.append('orderBy', 'startTime');
  if (timeMin) {
    url.searchParams.append('timeMin', timeMin);
  }
  
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  
  if (!res.ok) {
    throw new Error(`Error recuperando eventos de Google: ${res.statusText}`);
  }
  
  const data = await res.json();
  return (data.items || []).map((item: any) => ({
    id: `google-${item.id}`,
    googleEventId: item.id,
    calendarId: calendarId,
    title: item.summary || '(Sin título)',
    description: item.description || '',
    location: item.location || '',
    start: item.start?.dateTime || item.start?.date || '',
    end: item.end?.dateTime || item.end?.date || '',
    color: '#10b981', // Default emerald for Google synced calendar
    isSynced: true,
  }));
}

// Create a new event in Google Calendar
export async function createGoogleEvent(
  accessToken: string,
  event: Partial<AgendaEvent>,
  calendarId: string = 'primary'
): Promise<string> {
  const startObj = event.start?.includes('T')
    ? { dateTime: event.start }
    : { date: event.start };
    
  const endObj = event.end?.includes('T')
    ? { dateTime: event.end }
    : { date: event.end };

  const bodyData: any = {
    summary: event.title,
    description: event.description || '',
    location: event.location || '',
    start: startObj,
    end: endObj,
  };

  const res = await fetch(`${API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bodyData),
  });

  if (!res.ok) {
    const errorData = await res.text();
    console.error('Error creating google event:', errorData);
    throw new Error(`No se pudo crear el evento en Google Calendar: ${res.statusText}`);
  }

  const data = await res.json();
  return data.id; // Returns google event ID
}

// Update an existing event in Google Calendar
export async function updateGoogleEvent(
  accessToken: string,
  googleEventId: string,
  event: Partial<AgendaEvent>,
  calendarId: string = 'primary'
): Promise<void> {
  const startObj = event.start?.includes('T')
    ? { dateTime: event.start }
    : { date: event.start };
    
  const endObj = event.end?.includes('T')
    ? { dateTime: event.end }
    : { date: event.end };

  const bodyData: any = {
    summary: event.title,
    description: event.description || '',
    location: event.location || '',
    start: startObj,
    end: endObj,
  };

  const res = await fetch(`${API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${googleEventId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bodyData),
  });

  if (!res.ok) {
    const errorData = await res.text();
    console.error('Error updating google event:', errorData);
    throw new Error(`No se pudo actualizar el evento en Google Calendar: ${res.statusText}`);
  }
}

// Delete an event in Google Calendar
export async function deleteGoogleEvent(
  accessToken: string,
  googleEventId: string,
  calendarId: string = 'primary'
): Promise<void> {
  const res = await fetch(`${API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${googleEventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    if (res.status === 410 || res.status === 404) {
      // Already deleted or gone
      return;
    }
    const errorData = await res.text();
    console.error('Error deleting google event:', errorData);
    throw new Error(`No se pudo eliminar el evento en Google Calendar: ${res.statusText}`);
  }
}
