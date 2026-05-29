import React, { useState } from 'react';
import { Calendar, CheckCircle2, AlertTriangle, LogOut, RefreshCw, Bell, BellOff } from 'lucide-react';
import { User } from 'firebase/auth';

interface NavbarProps {
  user: User | null;
  needsAuth: boolean;
  isLoggingIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
  syncOngoing: boolean;
  onManualSync?: () => void;
  notificationPermission: NotificationPermission | 'unsupported';
  onRequestNotificationPermission: () => void;
}

export default function Navbar({
  user,
  needsAuth,
  isLoggingIn,
  onLogin,
  onLogout,
  syncOngoing,
  onManualSync,
  notificationPermission,
  onRequestNotificationPermission,
}: NavbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md" id="app-navbar">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo/Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 shadow-lg text-white">
            <Calendar className="h-5.5 w-5.5" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
              Agenda Digital
            </h1>
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#059669] font-semibold">
              Calendario Inteligente
            </span>
          </div>
        </div>

        {/* Action Controls & Authentication Status */}
        <div className="flex items-center gap-2 sm:gap-4">
          
          {/* Notification Permission Indicator */}
          <button
            onClick={onRequestNotificationPermission}
            className={`rounded-xl p-2.5 transition flex items-center justify-center border text-sm font-medium cursor-pointer ${
              notificationPermission === 'granted'
                ? 'bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100'
                : notificationPermission === 'denied'
                ? 'bg-rose-50 border-rose-100 text-rose-700 hover:bg-rose-100'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title={
              notificationPermission === 'granted'
                ? 'Notificaciones del sistema permitidas'
                : notificationPermission === 'denied'
                ? 'Notificaciones del sistema bloqueadas'
                : 'Habilitar notificaciones en tiempo real'
            }
            id="btn-notification-permission"
          >
            {notificationPermission === 'granted' ? (
              <>
                <Bell className="h-4.5 w-4.5" />
                <span className="hidden md:inline ml-1.5 text-xs">Avisos Activos</span>
              </>
            ) : (
              <>
                <BellOff className="h-4.5 w-4.5" />
                <span className="hidden md:inline ml-1.5 text-xs">Activar Avisos</span>
              </>
            )}
          </button>

          {/* Sync Button (Only if authenticated) */}
          {user && onManualSync && (
            <button
              onClick={onManualSync}
              disabled={syncOngoing}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition cursor-pointer"
              id="btn-manual-sync"
            >
              <RefreshCw className={`h-4 w-4 text-emerald-600 ${syncOngoing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sincronizar</span>
            </button>
          )}

          {/* Authentication Block */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 pr-3 text-left hover:bg-slate-50 transition cursor-pointer"
                id="btn-profile-dropdown"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Usuario'}
                    className="h-8 w-8 rounded-lg object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-sm font-bold text-emerald-800 uppercase">
                    {user.displayName?.charAt(0) || user.email?.charAt(0) || '?'}
                  </div>
                )}
                <div className="hidden max-w-[120px] md:block text-xs">
                  <p className="truncate font-semibold text-slate-800 leading-none">
                    {user.displayName || 'Mi Perfil'}
                  </p>
                  <p className="truncate font-mono text-[9px] text-emerald-600 leading-none mt-1 flex items-center gap-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                    Google Activo
                  </p>
                </div>
              </button>

              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div
                    className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl border border-slate-100 bg-white p-2 shadow-2xl ring-1 ring-black/5 z-20"
                    id="profile-dropdown-content"
                  >
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-700 truncate">
                        {user.displayName || 'Usuario Google'}
                      </p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {user.email}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onLogout();
                      }}
                      className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition cursor-pointer"
                      id="btn-logout"
                    >
                      <LogOut className="h-4.5 w-4.5" />
                      Desconectar Google
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={onLogin}
              disabled={isLoggingIn}
              className="gsi-material-button text-sm font-semibold cursor-pointer py-1 scale-95"
              id="google-login-btn"
            >
              <div className="gsi-material-button-state"></div>
              <div className="gsi-material-button-content-wrapper p-0.5">
                <div className="gsi-material-button-icon">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: "block" }}>
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                </div>
                <span className="gsi-material-button-contents" style={{ paddingLeft: '10px', fontSize: '13px' }}>
                  {isLoggingIn ? 'Conectando...' : 'Conectar Google'}
                </span>
              </div>
            </button>
          )}

        </div>

      </div>

      {/* Styled Sign In Button classes for standard Google look */}
      <style>{`
        .gsi-material-button {
          -moz-user-select: none;
          -webkit-user-select: none;
          -ms-user-select: none;
          -webkit-appearance: none;
          background-color: #f2f2f2;
          border: none;
          border-radius: 12px;
          box-sizing: border-box;
          color: #1f1f1f;
          cursor: pointer;
          font-family: inherit;
          height: 40px;
          letter-spacing: 0.25px;
          outline: none;
          overflow: hidden;
          padding: 0 12px;
          position: relative;
          text-align: center;
          transition: background-color .218s, border-color .218s, box-shadow .218s;
          vertical-align: middle;
          white-space: nowrap;
          width: auto;
          min-width: min-content;
        }
        .gsi-material-button .gsi-material-button-icon {
          height: 20px;
          min-width: 20px;
          width: 20px;
        }
        .gsi-material-button .gsi-material-button-content-wrapper {
          align-items: center;
          display: flex;
          flex-direction: row;
          flex-wrap: nowrap;
          height: 100%;
          justify-content: space-between;
          position: relative;
          width: 100%;
        }
        .gsi-material-button .gsi-material-button-contents {
          flex-grow: 1;
          font-family: inherit;
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          vertical-align: middle;
        }
        .gsi-material-button .gsi-material-button-state {
          transition: opacity .218s;
          opacity: 0;
          background-color: #303030;
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        }
        .gsi-material-button:hover {
          box-shadow: 0 1px 2px 0 rgba(60,64,67,.30), 0 1px 3px 1px rgba(60,64,67,.15);
          background-color: #e6e6e6;
        }
        .gsi-material-button:focus {
          border: 2px solid #000;
          background-color: #f2f2f2;
        }
        .gsi-material-button:active {
          background-color: #d1d1d1;
        }
      `}</style>
    </header>
  );
}
