import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, MapPin, AlignLeft, Bell, Trash2, Check, RefreshCw } from 'lucide-react';
import { AgendaEvent } from '../types';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Partial<AgendaEvent>) => void;
  onDelete?: (eventId: string) => void;
  eventToEdit: AgendaEvent | null;
  selectedDateStr: string | null; // e.g. "2026-05-29"
  isGoogleAuthenticated: boolean;
}

const PRESET_COLORS = [
  { name: 'Emeralda', class: 'emerald', hex: '#10b981', bg: 'bg-emerald-500', text: 'text-emerald-700', border: 'border-emerald-200' },
  { name: 'Océano', class: 'sky', hex: '#0ea5e9', bg: 'bg-sky-500', text: 'text-sky-700', border: 'border-sky-200' },
  { name: 'Gindigo', class: 'indigo', hex: '#6366f1', bg: 'bg-indigo-500', text: 'text-indigo-700', border: 'border-indigo-200' },
  { name: 'Púrpura', class: 'purple', hex: '#a855f7', bg: 'bg-purple-500', text: 'text-purple-700', border: 'border-purple-200' },
  { name: 'Amapola', class: 'rose', hex: '#f43f5e', bg: 'bg-rose-500', text: 'text-rose-700', border: 'border-rose-200' },
  { name: 'Ámbar', class: 'amber', hex: '#f59e0b', bg: 'bg-amber-500', text: 'text-amber-700', border: 'border-amber-200' },
];

const NOTIFY_OPTIONS = [
  { value: -1, label: 'Sin recordatorio' },
  { value: 0, label: 'Al comenzar el evento' },
  { value: 5, label: '5 minutos antes' },
  { value: 10, label: '10 minutos antes' },
  { value: 15, label: '15 minutos antes' },
  { value: 30, label: '30 minutos antes' },
  { value: 60, label: '1 hora antes' },
];

export default function EventModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  eventToEdit,
  selectedDateStr,
  isGoogleAuthenticated,
}: EventModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDateStr, setStartDateStr] = useState('');
  const [startTimeStr, setStartTimeStr] = useState('');
  const [endDateStr, setEndDateStr] = useState('');
  const [endTimeStr, setEndTimeStr] = useState('');
  const [selectedColor, setSelectedColor] = useState('emerald');
  const [syncGoogle, setSyncGoogle] = useState(false);
  const [notifyBefore, setNotifyBefore] = useState<number>(-1);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (eventToEdit) {
        setTitle(eventToEdit.title);
        setDescription(eventToEdit.description || '');
        setLocation(eventToEdit.location || '');
        
        // Parse dates
        const startDt = new Date(eventToEdit.start);
        const endDt = new Date(eventToEdit.end);
        
        // Format ISO with local timezone adjustment
        const formatYMD = (d: Date) => d.toLocaleDateString('en-CA'); // "YYYY-MM-DD"
        const formatHM = (d: Date) => {
          const h = String(d.getHours()).padStart(2, '0');
          const m = String(d.getMinutes()).padStart(2, '0');
          return `${h}:${m}`;
        };
        
        setStartDateStr(formatYMD(startDt));
        setStartTimeStr(formatHM(startDt));
        setEndDateStr(formatYMD(endDt));
        setEndTimeStr(formatHM(endDt));
        setSelectedColor(eventToEdit.color || 'emerald');
        setSyncGoogle(eventToEdit.isSynced || false);
        setNotifyBefore(eventToEdit.notifyBefore !== undefined ? eventToEdit.notifyBefore : -1);
      } else {
        // Setup default times
        const datePart = selectedDateStr || new Date().toLocaleDateString('en-CA');
        setStartDateStr(datePart);
        setEndDateStr(datePart);
        
        const now = new Date();
        const startH = String((now.getHours() + 1) % 24).padStart(2, '0');
        const endH = String((now.getHours() + 2) % 24).padStart(2, '0');
        
        setStartTimeStr(`${startH}:00`);
        setEndTimeStr(`${endH}:00`);
        setTitle('');
        setDescription('');
        setLocation('');
        setSelectedColor('emerald');
        setSyncGoogle(isGoogleAuthenticated); // Auto-toggle sync to Google if authenticated
        setNotifyBefore(15); // Standard 15 mins before
      }
      setErrorMsg('');
    }
  }, [isOpen, eventToEdit, selectedDateStr, isGoogleAuthenticated]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('El título del evento es requerido.');
      return;
    }

    const startDateTime = new Date(`${startDateStr}T${startTimeStr}`);
    const endDateTime = new Date(`${endDateStr}T${endTimeStr}`);

    if (isNaN(startDateTime.getTime())) {
      setErrorMsg('Fecha u hora de inicio inválida.');
      return;
    }

    if (isNaN(endDateTime.getTime())) {
      setErrorMsg('Fecha u hora de término inválida.');
      return;
    }

    if (endDateTime <= startDateTime) {
      setErrorMsg('La fecha de término debe ser posterior a la fecha de inicio.');
      return;
    }

    onSave({
      id: eventToEdit?.id,
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      start: startDateTime.toISOString(),
      end: endDateTime.toISOString(),
      color: selectedColor,
      isSynced: syncGoogle && isGoogleAuthenticated,
      googleEventId: eventToEdit?.googleEventId,
      notifyBefore: notifyBefore === -1 ? undefined : notifyBefore,
    });
    onClose();
  }

  function handleDeleteClick() {
    if (eventToEdit && eventToEdit.id && onDelete) {
      const confirmed = window.confirm(
        `¿Estás seguro de que deseas eliminar el evento "${title}"? Esta acción no se puede deshacer.`
      );
      if (confirmed) {
        onDelete(eventToEdit.id);
        onClose();
      }
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          {/* Modal content */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-display text-xl font-bold text-slate-800">
                {eventToEdit ? 'Editar Evento' : 'Crear Nuevo Evento'}
              </h3>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                id="btn-close-modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Event Title */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Título del Evento
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Calendar className="h-5 w-5" />
                  </span>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej. Reunión de proyecto, Cena de Cumpleaños..."
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition"
                    id="input-title"
                  />
                </div>
              </div>

              {/* Start & End DateTime */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Fecha de Inicio
                  </label>
                  <input
                    type="date"
                    value={startDateStr}
                    onChange={(e) => setStartDateStr(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition"
                    id="input-start-date"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Hora de Inicio
                  </label>
                  <input
                    type="time"
                    value={startTimeStr}
                    onChange={(e) => setStartTimeStr(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition"
                    id="input-start-time"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Fecha de Fin
                  </label>
                  <input
                    type="date"
                    value={endDateStr}
                    onChange={(e) => setEndDateStr(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition"
                    id="input-end-date"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Hora de Fin
                  </label>
                  <input
                    type="time"
                    value={endTimeStr}
                    onChange={(e) => setEndTimeStr(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition"
                    id="input-end-time"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Ubicación
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Agregar ubicación o enlace de reunión"
                    className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-4 text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition"
                    id="input-location"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Descripción
                </label>
                <div className="relative">
                  <span className="absolute top-3 left-3 text-slate-400">
                    <AlignLeft className="h-4 w-4" />
                  </span>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detalles sobre el evento..."
                    rows={2}
                    className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-4 text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition resize-none"
                    id="input-description"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Notification Settings */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                    <Bell className="h-3.5 w-3.5 text-slate-400" />
                    Recordatorio
                  </label>
                  <select
                    value={notifyBefore}
                    onChange={(e) => setNotifyBefore(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 bg-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition"
                    id="select-notify"
                  >
                    {NOTIFY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Color Preset Pick */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Visualización (Color)
                  </label>
                  <div className="flex gap-2 flex-wrap items-center pt-0.5" id="color-selectors">
                    {PRESET_COLORS.map((col) => (
                      <button
                        type="button"
                        key={col.class}
                        onClick={() => setSelectedColor(col.class)}
                        className={`h-6 w-6 rounded-full ${col.bg} border-2 relative cursor-pointer hover:scale-110 transition flex items-center justify-center ${
                          selectedColor === col.class ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-white'
                        }`}
                        title={col.name}
                      >
                        {selectedColor === col.class && (
                          <Check className="h-3.5 w-3.5 text-white stroke-[3px]" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Google Sync Option */}
              {isGoogleAuthenticated && (
                <div className="flex items-center justify-between p-3.5 bg-brand-50/60 rounded-xl border border-brand-100">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5 text-brand-600 animate-pulse" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Sincronizar con Google Calendar
                      </p>
                      <p className="text-xs text-slate-500">
                        Publicar cambios automáticamente en la nube.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={syncGoogle}
                      onChange={(e) => setSyncGoogle(e.target.checked)}
                      className="sr-only peer"
                      id="toggle-sync-google"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
                  </label>
                </div>
              )}

              {errorMsg && (
                <p id="modal-error-message" className="text-sm text-rose-600 bg-rose-50 border border-rose-100 p-2.5 rounded-xl font-medium">
                  {errorMsg}
                </p>
              )}

              {/* Form Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                {eventToEdit && onDelete ? (
                  <button
                    type="button"
                    onClick={handleDeleteClick}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                    id="btn-delete-event"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                    Eliminar
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                    id="btn-cancel-modal"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-md cursor-pointer transition flex items-center gap-1.5"
                    id="btn-save-event"
                  >
                    {eventToEdit ? 'Guardar Cambios' : 'Crear Evento'}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
