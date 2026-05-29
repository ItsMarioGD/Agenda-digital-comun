import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  CalendarRange, 
  CheckCircle2, 
  Layers, 
  RefreshCw, 
  Wifi, 
  X, 
  AlertTriangle,
  Info 
} from 'lucide-react';
import { User } from 'firebase/auth';

import { AgendaEvent, GoogleCalendar } from './types';
import { initAuth, googleSignIn, logout, getAccessToken } from './lib/firebase';
import { 
  fetchUserCalendars, 
  fetchCalendarEvents, 
  createGoogleEvent, 
  updateGoogleEvent, 
  deleteGoogleEvent 
} from './lib/calendar';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import AgendaCalendar from './components/AgendaCalendar';
import EventModal from './components/EventModal';

const LOCAL_STORAGE_KEY = 'agenda_digital_local_events';

// Web Audio API Synthesizer beep for ambient notification alarms
function playNotificationSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 note
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5 note sweep
    
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch (err) {
    console.warn('Audio play policies prevented sound beep:', err);
  }
}

export default function App() {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Core Data events state
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('primary');
  const [syncOngoing, setSyncOngoing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string>('');

  // UI Flow triggers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<AgendaEvent | null>(null);
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // In-App Toast Notifications state
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [activeToasts, setActiveToasts] = useState<{ id: string; title: string; message: string; color: string }[]>([]);

  // Reference for scanning loop
  const eventsRef = useRef<AgendaEvent[]>([]);
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  // Load initial local storage data
  useEffect(() => {
    const rawEvents = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (rawEvents) {
      try {
        setEvents(JSON.parse(rawEvents));
      } catch (err) {
        console.error('Error parsing local storage events:', err);
      }
    }

    // Identify Notification API support
    if (!('Notification' in window)) {
      setNotificationPermission('unsupported');
    } else {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Sync state to local storage when events change
  useEffect(() => {
    if (events.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(events));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, [events]);

  // Trigger Auth listener on mount
  useEffect(() => {
    const unsubscribe = initAuth(
      async (firebaseUser, cachedToken) => {
        setUser(firebaseUser);
        setAccessToken(cachedToken);
        setNeedsAuth(false);
        // Load cloud elements
        triggerInitialCloudLoad(cachedToken);
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  // Periodic notification scanner
  useEffect(() => {
    const interval = setInterval(() => {
      const currentEvents = eventsRef.current;
      const now = new Date();

      const updatedEvents = currentEvents.map((evt) => {
        // Only trigger for active upcoming events with non-empty notifyBefore triggers
        if (
          evt.notifyBefore !== undefined && 
          evt.notifyBefore !== -1 && 
          !evt.notificationSent
        ) {
          const eventStart = new Date(evt.start);
          const diffInMs = eventStart.getTime() - now.getTime();
          const diffInMins = Math.floor(diffInMs / 60000);

          // If the event starts within the notify period (and hasn't occurred yet)
          if (diffInMins >= 0 && diffInMins <= evt.notifyBefore) {
            triggerNotificationAlert(evt);
            return { ...evt, notificationSent: true };
          }
        }
        return evt;
      });

      // Avoid infinite triggers by keeping reference checks
      const changed = updatedEvents.some((u, i) => u.notificationSent !== currentEvents[i].notificationSent);
      if (changed) {
        setEvents(updatedEvents);
      }
    }, 12000); // scans every 12 seconds
    return () => clearInterval(interval);
  }, []);

  const triggerNotificationAlert = (event: AgendaEvent) => {
    const timeText = event.notifyBefore === 0 
      ? '¡Comienza justo ahora!' 
      : `Comienza en ${event.notifyBefore} minutos`;
    
    const message = `${timeText}${event.location ? ` • Ubicación: ${event.location}` : ''}`;

    // 1. Play auditory cue
    playNotificationSound();

    // 2. Trigger native Notification if allowed
    if (notificationPermission === 'granted') {
      try {
        new Notification(event.title, {
          body: message,
          tag: event.id,
        });
      } catch (e) {
        console.warn('Native notification system failed inside frame:', e);
      }
    }

    // 3. Fallback sliding in-app visual toast
    const newToast = {
      id: `${event.id}-${Date.now()}`,
      title: event.title,
      message,
      color: event.color,
    };
    setActiveToasts(prev => [...prev, newToast]);

    // Self-destruct toast after 7s
    setTimeout(() => {
      setActiveToasts(prev => prev.filter(t => t.id !== newToast.id));
    }, 7000);
  };

  const handleRequestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('Las notificaciones de escritorio no están soportadas por este navegador.');
      return;
    }
    const res = await Notification.requestPermission();
    setNotificationPermission(res);
    if (res === 'granted') {
      playNotificationSound();
      const toast = {
        id: 'permission-granted',
        title: '¡Avisos Habilitados!',
        message: 'Recibirás avisos sonoros y visuales para tus próximos eventos.',
        color: 'emerald',
      };
      setActiveToasts([toast]);
      setTimeout(() => setActiveToasts(p => p.filter(t => t.id !== toast.id)), 4000);
    }
  };

  const triggerInitialCloudLoad = async (token: string) => {
    setSyncOngoing(true);
    try {
      // 1. Fetch calendars
      const userCals = await fetchUserCalendars(token);
      setCalendars(userCals);

      // 2. Pull events from primary
      const cloudEvents = await fetchCalendarEvents(token, 'primary');
      
      // Merge: match local events using googleEventId
      setEvents(prev => {
        const localOnly = prev.filter(e => !e.googleEventId);
        
        // Mark imported cloud events as synced & set their preset color
        const processedCloud = cloudEvents.map(ce => {
          // Check if there is an existing local match to preserve properties
          const match = prev.find(p => p.googleEventId === ce.googleEventId);
          return {
            ...ce,
            color: match?.color || 'sky', // Use sky color for google-pulled events
            notifyBefore: match?.notifyBefore,
            notificationSent: match?.notificationSent,
          };
        });

        return [...localOnly, ...processedCloud];
      });

      setSyncLogs('Sincronización inicial exitosa.');
    } catch (err: any) {
      console.error('Error loading google calendar elements:', err);
      setSyncLogs(`Error de sincronización: ${err.message}`);
    } finally {
      setSyncOngoing(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const authResult = await googleSignIn();
      if (authResult) {
        setUser(authResult.user);
        setAccessToken(authResult.accessToken);
        setNeedsAuth(false);
        triggerInitialCloudLoad(authResult.accessToken);
      }
    } catch (err: any) {
      alert(`No se pudo conectar con Google Calendar: ${err.message}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    const confirmation = window.confirm('¿Deseas revocar el enlace con Google Calendar? Volverás a operar en base local.');
    if (!confirmation) return;

    await logout();
    setUser(null);
    setAccessToken(null);
    setCalendars([]);
    // Reset synced items references to local
    setEvents(prev => prev.map(evt => ({
      ...evt,
      isSynced: false,
      googleEventId: undefined,
    })));
    setSyncLogs('Google Calendar desconectado.');
  };

  const handleSyncAll = async () => {
    if (!accessToken) return;
    setSyncOngoing(true);
    setSyncLogs('Sincronizando...');
    try {
      // 1. Pulled newly updated events from cloud
      const cloudEvents = await fetchCalendarEvents(accessToken, selectedCalendarId);

      // 2. Identify local-only modifications not published yet
      const unpublished = events.filter(e => !e.googleEventId && e.isSynced);
      let publishedCount = 0;

      const updatedEvents = [...events];

      // Publish pending to Google in series safely
      for (const localEvt of unpublished) {
        try {
          const cloudId = await createGoogleEvent(accessToken, localEvt, selectedCalendarId);
          
          // Match index to update
          const idx = updatedEvents.findIndex(u => u.id === localEvt.id);
          if (idx !== -1) {
            updatedEvents[idx] = {
              ...updatedEvents[idx],
              googleEventId: cloudId,
              isSynced: true,
              calendarId: selectedCalendarId,
            };
            publishedCount++;
          }
        } catch (e) {
          console.error(`Failed to publish individual event ${localEvt.title}:`, e);
        }
      }

      // Merge Cloud updates with local
      setEvents(() => {
        // Keep unsynced local events (not flagged for sync)
        const localUnsynced = updatedEvents.filter(e => !e.isSynced);
        
        // Build map of remaining events
        const processedCloud = cloudEvents.map(ce => {
          const localMatch = updatedEvents.find(p => p.googleEventId === ce.googleEventId);
          return {
            ...ce,
            color: localMatch?.color || 'sky', // Use existing color or sky for Google
            notifyBefore: localMatch?.notifyBefore,
            notificationSent: localMatch?.notificationSent,
          };
        });

        return [...localUnsynced, ...processedCloud];
      });

      setSyncLogs(`Proceso completado. ${publishedCount} eventos subidos.`);
      
      playNotificationSound();
    } catch (err: any) {
      console.error('Manual resync failed:', err);
      setSyncLogs(`Fallo al sincronizar: ${err.message}`);
    } finally {
      setSyncOngoing(false);
    }
  };

  // Add/Save/Edit Event handler
  const handleSaveEvent = async (eventForm: Partial<AgendaEvent>) => {
    const isNew = !eventForm.id;
    let finalEvent: AgendaEvent;

    if (isNew) {
      finalEvent = {
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        title: eventForm.title || '(Sin título)',
        description: eventForm.description,
        location: eventForm.location,
        start: eventForm.start || new Date().toISOString(),
        end: eventForm.end || new Date().toISOString(),
        color: eventForm.color || 'emerald',
        isSynced: eventForm.isSynced || false,
        notifyBefore: eventForm.notifyBefore,
        notificationSent: false,
      };

      // Push to Google Calendar dynamically if toggle is on
      if (finalEvent.isSynced && accessToken) {
        setSyncOngoing(true);
        try {
          const gId = await createGoogleEvent(accessToken, finalEvent, selectedCalendarId);
          finalEvent.googleEventId = gId;
          finalEvent.calendarId = selectedCalendarId;
        } catch (err) {
          console.error(err);
          // Allow creating locally but flag warning
          finalEvent.isSynced = false;
          alert('El evento se creó localmente pero no se pudo publicar automáticamente en Google.');
        } finally {
          setSyncOngoing(false);
        }
      }

      setEvents(prev => [...prev, finalEvent]);
    } else {
      // Edit existing
      const existing = events.find(e => e.id === eventForm.id);
      if (!existing) return;

      finalEvent = {
        ...existing,
        title: eventForm.title || existing.title,
        description: eventForm.description !== undefined ? eventForm.description : existing.description,
        location: eventForm.location !== undefined ? eventForm.location : existing.location,
        start: eventForm.start || existing.start,
        end: eventForm.end || existing.end,
        color: eventForm.color || existing.color,
        isSynced: eventForm.isSynced || false,
        notifyBefore: eventForm.notifyBefore,
        // Reset sent flag if start date changes
        notificationSent: eventForm.start !== existing.start ? false : existing.notificationSent,
      };

      // Handle Cloud Google publication sync edits
      if (accessToken) {
        if (finalEvent.isSynced) {
          setSyncOngoing(true);
          try {
            if (existing.googleEventId) {
              // Update existing Google Agenda item
              await updateGoogleEvent(accessToken, existing.googleEventId, finalEvent, existing.calendarId || selectedCalendarId);
              finalEvent.calendarId = existing.calendarId || selectedCalendarId;
            } else {
              // Convert local to cloud item and create
              const gId = await createGoogleEvent(accessToken, finalEvent, selectedCalendarId);
              finalEvent.googleEventId = gId;
              finalEvent.calendarId = selectedCalendarId;
            }
          } catch (err) {
            console.error(err);
            alert('Cambios locales guardados. Falló la actualización automática de Google Calendar.');
          } finally {
            setSyncOngoing(false);
          }
        } else if (existing.googleEventId) {
          // If the sync was turned OFF, we delete it from Google but keep it locally
          const deleteCloud = window.confirm('Desactivaste la sincronización. ¿Deseas también eliminar este evento de tu cuenta de Google Calendar?');
          if (deleteCloud) {
            setSyncOngoing(true);
            try {
              await deleteGoogleEvent(accessToken, existing.googleEventId, existing.calendarId || selectedCalendarId);
              finalEvent.googleEventId = undefined;
              finalEvent.calendarId = undefined;
            } catch (err) {
              console.error(err);
            } finally {
              setSyncOngoing(false);
            }
          }
        }
      }

      setEvents(prev => prev.map(e => e.id === finalEvent.id ? finalEvent : e));
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    const existing = events.find(e => e.id === eventId);
    if (!existing) return;

    // Delete dynamically from Google Calendar if synced & authenticated
    if (existing.googleEventId && accessToken) {
      setSyncOngoing(true);
      try {
        await deleteGoogleEvent(accessToken, existing.googleEventId, existing.calendarId || selectedCalendarId);
      } catch (err) {
        console.error('Failed to remote delete from Google Calendar:', err);
      } finally {
        setSyncOngoing(false);
      }
    }

    setEvents(prev => prev.filter(e => e.id !== eventId));
  };

  const handleOpenAddOnDate = (dateStr: string) => {
    setEventToEdit(null);
    setSelectedDateStr(dateStr);
    setIsModalOpen(true);
  };

  const handleOpenEditEvent = (evt: AgendaEvent) => {
    setEventToEdit(evt);
    setSelectedDateStr(null);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar
        user={user}
        needsAuth={needsAuth}
        isLoggingIn={isLoggingIn}
        onLogin={handleGoogleLogin}
        onLogout={handleGoogleLogout}
        syncOngoing={syncOngoing}
        onManualSync={handleSyncAll}
        notificationPermission={notificationPermission}
        onRequestNotificationPermission={handleRequestNotificationPermission}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6">
        {/* Dynamic Left sidebar details */}
        <Sidebar
          onOpenAddEvent={() => {
            setEventToEdit(null);
            setSelectedDateStr(null);
            setIsModalOpen(true);
          }}
          events={events}
          calendars={calendars}
          selectedCalendarId={selectedCalendarId}
          onSelectCalendar={(id) => {
            setSelectedCalendarId(id);
            if (accessToken) {
              triggerInitialCloudLoad(accessToken);
            }
          }}
          isGoogleAuthenticated={!!user}
          onEditEvent={handleOpenEditEvent}
          onSyncAll={handleSyncAll}
          syncOngoing={syncOngoing}
        />

        {/* Dynamic calendar grid board */}
        <AgendaCalendar
          events={events}
          onSelectDate={handleOpenAddOnDate}
          onEditEvent={handleOpenEditEvent}
          selectedDate={selectedDate}
          onNavigateMonth={(d) => setSelectedDate(d)}
        />
      </main>

      {/* Floating sliding UI alerts section */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-md w-full px-4" id="toasts-portal">
        <AnimatePresence>
          {activeToasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ transform: 'translateY(100%)', opacity: 0, scale: 0.9 }}
              animate={{ translateY: 0, opacity: 1, scale: 1 }}
              exit={{ transform: 'translateY(20px)', opacity: 0 }}
              className="flex items-start gap-3 bg-slate-900 border border-slate-800 text-white rounded-2xl p-4.5 shadow-2xl relative overflow-hidden"
              id={`toast-box-${toast.id}`}
            >
              {/* Vertical Color Strip indicator */}
              <div className={`absolute left-0 top-0 bottom-0 w-2 ${
                toast.color === 'sky' ? 'bg-sky-500' :
                toast.color === 'indigo' ? 'bg-indigo-500' :
                toast.color === 'purple' ? 'bg-purple-500' :
                toast.color === 'rose' ? 'bg-rose-500' :
                toast.color === 'amber' ? 'bg-amber-500' : 'bg-emerald-500'
              }`} />

              <div className="flex-1 pl-1.5 text-left">
                <div className="flex items-center gap-1.5">
                  <Bell className="h-4.5 w-4.5 text-indigo-400 animate-bounce" />
                  <p className="text-sm font-black tracking-tight">{toast.title}</p>
                </div>
                <p className="text-xs text-slate-300 mt-1 font-medium">{toast.message}</p>
              </div>

              <button
                onClick={() => setActiveToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition cursor-pointer"
                id={`btn-close-toast-${toast.id}`}
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Google sync logs warning footer widget */}
      {syncLogs && (
        <div className="bg-slate-900/90 text-slate-300 text-[11px] py-1 border-t border-slate-800/80 px-4 text-center font-mono flex items-center justify-center gap-2" id="sync-logs-banner">
          <Info className="h-3 w-3 text-emerald-500" />
          <span>{syncLogs}</span>
          <button
            onClick={() => setSyncLogs('')}
            className="text-slate-500 hover:text-slate-300 ml-2"
          >
            ×
          </button>
        </div>
      )}

      {/* Event Management Add/Edit Modal details */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        eventToEdit={eventToEdit}
        selectedDateStr={selectedDateStr}
        isGoogleAuthenticated={!!user}
      />
    </div>
  );
}
