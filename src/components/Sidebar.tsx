import React from 'react';
import { Plus, Bell, RefreshCw, Layers, CalendarRange, MapPin, CheckCircle2 } from 'lucide-react';
import { AgendaEvent, GoogleCalendar } from '../types';

interface SidebarProps {
  onOpenAddEvent: () => void;
  events: AgendaEvent[];
  calendars: GoogleCalendar[];
  selectedCalendarId: string;
  onSelectCalendar: (calendarId: string) => void;
  isGoogleAuthenticated: boolean;
  onEditEvent: (event: AgendaEvent) => void;
  onSyncAll: () => void;
  syncOngoing: boolean;
}

export default function Sidebar({
  onOpenAddEvent,
  events,
  calendars,
  selectedCalendarId,
  onSelectCalendar,
  isGoogleAuthenticated,
  onEditEvent,
  onSyncAll,
  syncOngoing,
}: SidebarProps) {
  
  // Format stats
  const totalEvents = events.length;
  const syncedEvents = events.filter(e => e.isSynced).length;
  const withReminders = events.filter(e => e.notifyBefore !== undefined && e.notifyBefore !== -1).length;

  // Get upcoming events (sorted by start date, limited to next 4)
  const upcomingEvents = [...events]
    .filter(e => new Date(e.start) >= new Date())
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 4);

  const getPresetColorBadge = (color: string) => {
    switch (color) {
      case 'sky': return 'bg-sky-500';
      case 'indigo': return 'bg-indigo-500';
      case 'purple': return 'bg-purple-500';
      case 'rose': return 'bg-rose-500';
      case 'amber': return 'bg-amber-500';
      default: return 'bg-emerald-500';
    }
  };

  return (
    <aside className="w-full lg:w-80 flex flex-col gap-6" id="app-sidebar">
      
      {/* Quick Add Button */}
      <button
        onClick={onOpenAddEvent}
        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3.5 px-4 font-display font-bold text-white hover:bg-slate-800 shadow-lg hover:shadow-slate-950/20 active:scale-[0.98] transition cursor-pointer"
        id="btn-sidebar-add-event"
      >
        <Plus className="h-5 w-5" />
        Agregar Evento
      </button>

      {/* Sync Status / Google integration overview card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <h4 className="font-display font-bold text-slate-800 mb-3 text-sm flex items-center gap-2">
          <Layers className="h-4 w-4 text-slate-400" />
          Estado de Sincronización
        </h4>
        
        {isGoogleAuthenticated ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Eventos en Agenda:</span>
              <span className="font-bold text-slate-800">{totalEvents}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Sincronizados en Nube:</span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {syncedEvents} ({totalEvents > 0 ? Math.round((syncedEvents / totalEvents) * 100) : 0}%)
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Notificaciones Programadas:</span>
              <span className="font-bold text-slate-800 flex items-center gap-1">
                <Bell className="h-3 w-3 text-indigo-500" />
                {withReminders}
              </span>
            </div>

            <button
              onClick={onSyncAll}
              disabled={syncOngoing}
              className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100/50 py-2.5 transition disabled:opacity-50 cursor-pointer"
              id="sidebar-btn-sync"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncOngoing ? 'animate-spin' : ''}`} />
              Forzar Resincronización
            </button>
          </div>
        ) : (
          <div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Inicia sesión con Google usando el botón superior para habilitar la sincronización directa con tu cuenta de Google Calendar y guardar todo en la nube de forma segura.
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-600 font-semibold bg-amber-50 border border-amber-100 p-2.5 rounded-xl">
              <Bell className="h-3.5 w-3.5 flex-none" />
              <span>Modo Local (Sin sincronización viva)</span>
            </div>
          </div>
        )}
      </div>

      {/* Calendars Select Selector (Only active if logged in) */}
      {isGoogleAuthenticated && calendars.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h4 className="font-display font-bold text-slate-800 mb-3 text-sm flex items-center gap-2">
            <CalendarRange className="h-4 w-4 text-slate-400" />
            Filtrar Calendario Google
          </h4>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1" id="calendar-filter-list">
            <button
              onClick={() => onSelectCalendar('primary')}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold combo flex items-center justify-between transition cursor-pointer ${
                selectedCalendarId === 'primary' 
                  ? 'bg-slate-100 text-slate-900 border-l-4 border-slate-900' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>Calendario Principal</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            </button>
            {calendars.filter(c => !c.primary).map(cal => (
              <button
                key={cal.id}
                onClick={() => onSelectCalendar(cal.id)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                  selectedCalendarId === cal.id 
                    ? 'bg-slate-100 text-slate-900 border-l-4 border-[#0369a1]' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="truncate">{cal.summary}</span>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cal.backgroundColor || '#0ea5e9' }}></span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Events Mini-board */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex-1 flex flex-col justify-between min-h-[240px]">
        <div>
          <h4 className="font-display font-bold text-slate-800 mb-4 text-sm flex items-center gap-2">
            <CalendarRange className="h-4 w-4 text-slate-400" />
            Próximos Compromisos
          </h4>

          {upcomingEvents.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-xs text-slate-400 font-medium">No hay eventos próximos en tu agenda.</p>
            </div>
          ) : (
            <div className="space-y-3" id="sidebar-upcoming-events-list">
              {upcomingEvents.map((evt) => {
                const startDate = new Date(evt.start);
                const isToday = startDate.toDateString() === new Date().toDateString();
                const timeString = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const dateString = startDate.toLocaleDateString([], { day: 'numeric', month: 'short' });

                return (
                  <div
                    key={evt.id}
                    onClick={() => onEditEvent(evt)}
                    className="flex gap-3 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition cursor-pointer text-left focus-within:ring-2 focus-within:ring-brand-100"
                    id={`upcoming-item-${evt.id}`}
                  >
                    {/* Time pill */}
                    <div className="flex flex-col items-center justify-center p-1 px-2.5 bg-slate-50 border border-slate-100 rounded-lg text-center h-12 w-12 flex-none">
                      <span className="font-mono text-[9px] uppercase text-slate-400 font-bold leading-none">
                        {isToday ? 'HOY' : dateString.split(' ')[1]}
                      </span>
                      <span className="font-display text-sm font-bold text-slate-700 leading-none mt-1">
                        {isToday ? '★' : dateString.split(' ')[0]}
                      </span>
                    </div>

                    {/* Metadata */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${getPresetColorBadge(evt.color)}`} />
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {evt.title}
                        </p>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium mt-1 truncate">
                        {timeString} {evt.location ? `• ${evt.location}` : ''}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <p className="font-mono text-[9px] text-slate-400 text-center leading-none mt-4">
          Agenda Digital local actualizable en vivo
        </p>
      </div>

    </aside>
  );
}
