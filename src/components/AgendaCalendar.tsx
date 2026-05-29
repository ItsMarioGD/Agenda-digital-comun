import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Calendar, Globe } from 'lucide-react';
import { AgendaEvent } from '../types';

interface AgendaCalendarProps {
  events: AgendaEvent[];
  onSelectDate: (dateStr: string) => void;
  onEditEvent: (event: AgendaEvent) => void;
  selectedDate: Date;
  onNavigateMonth: (newDate: Date) => void;
}

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DAYS_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export default function AgendaCalendar({
  events,
  onSelectDate,
  onEditEvent,
  selectedDate,
  onNavigateMonth,
}: AgendaCalendarProps) {
  const [viewMode, setViewMode] = useState<'month' | 'list'>('month');

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();

  // Helper calculations
  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => {
    // 0 = Sunday, 1 = Monday...
    let day = new Date(y, m, 1).getDay();
    // Shift so Lunes (1) is 0, Domingo (0) is 6
    return day === 0 ? 6 : day - 1;
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);

  // Generate calendar cells (blank spaces for offset + actual month dates)
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(year, month, day));
  }

  // Group events by day to render efficiently
  const getEventsForDate = (date: Date) => {
    const compareStr = date.toLocaleDateString('en-CA'); // "YYYY-MM-DD"
    return events.filter((evt) => {
      const evtStartLocal = new Date(evt.start).toLocaleDateString('en-CA');
      return evtStartLocal === compareStr;
    });
  };

  const handlePrevMonth = () => {
    onNavigateMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    onNavigateMonth(new Date(year, month + 1, 1));
  };

  const handleGoToday = () => {
    onNavigateMonth(new Date());
  };

  const getPresetColorClasses = (colorName: string) => {
    switch (colorName) {
      case 'sky':
        return { bg: 'bg-sky-50 text-sky-800 border-sky-200', dot: 'bg-sky-500' };
      case 'indigo':
        return { bg: 'bg-indigo-50 text-indigo-800 border-indigo-200', dot: 'bg-indigo-500' };
      case 'purple':
        return { bg: 'bg-purple-50 text-purple-800 border-purple-200', dot: 'bg-purple-500' };
      case 'rose':
        return { bg: 'bg-rose-50 text-rose-800 border-rose-200', dot: 'bg-rose-500' };
      case 'amber':
        return { bg: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500' };
      default:
        return { bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' };
    }
  };

  const todayStr = new Date().toLocaleDateString('en-CA');

  return (
    <div className="flex-1 flex flex-col bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs" id="agenda-calendar-container">
      
      {/* Calendar Controller Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-5 border-b border-slate-100 gap-4 bg-slate-50/50">
        
        {/* Month Selector */}
        <div className="flex items-center gap-2">
          <h2 className="font-display text-lg sm:text-xl font-extrabold text-slate-800 tracking-tight">
            {MONTHS_ES[month]} {year}
          </h2>
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 transition shadow-2xs cursor-pointer"
              title="Mes Anterior"
              id="btn-prev-month"
            >
              <ChevronLeft className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={handleGoToday}
              className="px-2.5 py-1.5 text-xs font-bold bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-700 transition shadow-2xs cursor-pointer"
              id="btn-go-today"
            >
              Hoy
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 transition shadow-2xs cursor-pointer"
              title="Siguiente Mes"
              id="btn-next-month"
            >
              <ChevronRight className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* View togglers */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200/50">
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
              viewMode === 'month'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            id="btn-view-month"
          >
            <Calendar className="h-3.5 w-3.5" />
            Ver Mes
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
              viewMode === 'list'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            id="btn-view-list"
          >
            <Clock className="h-3.5 w-3.5" />
            Ver Agenda
          </button>
        </div>

      </div>

      {viewMode === 'month' ? (
        <div className="flex-1 flex flex-col p-4">
          {/* Days labels */}
          <div className="grid grid-cols-7 gap-1 text-center font-semibold text-slate-400 text-xs tracking-wider uppercase pb-2">
            {DAYS_ES.map((d) => (
              <div key={d} className="py-1.5">
                {d}
              </div>
            ))}
          </div>

          {/* Month grid days cells */}
          <div className="grid grid-cols-7 gap-1 flex-1 min-h-[460px]" id="calendar-month-grid">
            {cells.map((cell, idx) => {
              if (cell === null) {
                return <div key={`blank-${idx}`} className="bg-slate-50/20 rounded-xl" />;
              }

              const cellDateStr = cell.toLocaleDateString('en-CA');
              const isToday = cellDateStr === todayStr;
              const cellEvents = getEventsForDate(cell);

              return (
                <div
                  key={cellDateStr}
                  onClick={() => onSelectDate(cellDateStr)}
                  className={`group relative flex flex-col min-h-[85px] bg-slate-50/20 hover:bg-slate-50 hover:shadow-2xs border border-slate-100 rounded-xl p-1.5 transition cursor-pointer text-left focus:ring-2 focus:ring-brand-100 ${
                    isToday ? 'bg-slate-50 ring-1 ring-slate-200' : ''
                  }`}
                  id={`cell-date-${cellDateStr}`}
                >
                  {/* Date Badge */}
                  <span
                    className={`inline-flex items-center justify-center h-6 w-6 text-xs font-bold rounded-lg mb-1 ${
                      isToday
                        ? 'bg-slate-900 text-white shadow-md'
                        : 'text-slate-700 group-hover:text-slate-950 font-semibold'
                    }`}
                  >
                    {cell.getDate()}
                  </span>

                  {/* Date Events Container */}
                  <div className="flex-1 space-y-1 overflow-y-auto max-h-[64px]" id={`events-container-${cellDateStr}`}>
                    {cellEvents.slice(0, 3).map((evt) => {
                      const colorStyles = getPresetColorClasses(evt.color);
                      const timeStr = new Date(evt.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                      return (
                        <div
                          key={evt.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditEvent(evt);
                          }}
                          className={`flex items-center gap-1 text-[10px] font-bold py-0.5 px-1.5 rounded-md border truncate transition hover:brightness-95 ${colorStyles.bg}`}
                          title={`${evt.title} (${timeStr})`}
                          id={`event-badge-${evt.id}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${colorStyles.dot} flex-none`} />
                          <span className="truncate flex-1">{evt.title}</span>
                          {evt.isSynced && (
                            <Globe className="h-2.5 w-2.5 text-slate-500 ml-0.5 flex-none" />
                          )}
                        </div>
                      );
                    })}

                    {cellEvents.length > 3 && (
                      <p className="text-[9px] text-slate-500 font-bold pl-1.5">
                        +{cellEvents.length - 3} más
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* List / Agenda Agenda View */
        <div className="flex-1 p-5 overflow-y-auto" id="calendar-agenda-list">
          {events.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center justify-center">
              <Calendar className="h-10 w-10 text-slate-300 mb-2" />
              <p className="text-slate-500 font-medium text-sm">No hay eventos guardados en este mes.</p>
              <button
                onClick={() => onSelectDate(new Date().toLocaleDateString('en-CA'))}
                className="mt-3 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100/55 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition cursor-pointer"
                id="btn-add-initial-event"
              >
                Crear mi primer evento
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {[...events]
                .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
                .map((evt) => {
                  const sDate = new Date(evt.start);
                  const eDate = new Date(evt.end);
                  const colorStyles = getPresetColorClasses(evt.color);

                  return (
                    <div
                      key={evt.id}
                      onClick={() => onEditEvent(evt)}
                      className="flex items-start gap-4 p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition cursor-pointer text-left focus-within:ring-2 focus-within:ring-slate-100"
                      id={`list-item-${evt.id}`}
                    >
                      {/* Left color bar */}
                      <div className={`w-1.5 h-12 rounded-full flex-none ${colorStyles.dot}`} />

                      {/* Content block */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-display font-black text-slate-800 text-sm sm:text-base truncate">
                            {evt.title}
                          </h4>
                          {evt.isSynced && (
                            <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-100 font-mono">
                              <Globe className="h-2.5 w-2.5" /> Google Sync
                            </span>
                          )}
                          {evt.notifyBefore !== undefined && (
                            <span className="inline-flex items-center gap-0.5 rounded-md bg-indigo-50 px-1.5 py-0.5 text-[9px] font-bold text-indigo-700 border border-indigo-100 font-mono">
                              <Clock className="h-2.5 w-2.5" /> Recordatorio
                            </span>
                          )}
                        </div>

                        {evt.description && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {evt.description}
                          </p>
                        )}

                        <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400 font-semibold font-mono">
                          <span>
                            {sDate.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' })}
                            {' • '}
                            {sDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {' - '}
                            {eDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {evt.location && (
                            <span className="truncate max-w-[200px]">
                              📍 {evt.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
