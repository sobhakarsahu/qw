import React from 'react';
import { UserRole, InstituteSettings, AuthUser } from '../types';
import {
  MonitorCheck,
  Shield,
  User,
  Settings,
  Bell,
  GraduationCap,
  LogOut,
  Lock,
  ShieldCheck,
  UserCheck,
  BookOpen,
  KeyRound,
} from 'lucide-react';

interface HeaderProps {
  currentRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  pendingApprovalsCount: number;
  settings: InstituteSettings;
  onOpenApprovals: () => void;
  onOpenSettings: () => void;
  onOpenParentPortal: () => void;
  currentUser: AuthUser | null;
  onLogout: () => void;
  onOpenCourseManager?: () => void;
  onOpenPermissions?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onChangeRole,
  pendingApprovalsCount,
  settings,
  onOpenApprovals,
  onOpenSettings,
  onOpenParentPortal,
  currentUser,
  onLogout,
  onOpenCourseManager,
  onOpenPermissions,
}) => {
  const isAdmin = currentRole === 'admin';
  const isStaff = currentRole === 'staff';
  const isStudent = currentRole === 'student';

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-40 shadow-md border-b border-slate-800 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand & Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-md shadow-indigo-900/30 shrink-0">
              <MonitorCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-white leading-tight">
                  {settings.name}
                </h1>
                <span className="hidden sm:inline-block bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-400/30 uppercase tracking-wider">
                  ERP v3.4
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-[240px] sm:max-w-md hidden xs:block">
                Biometric Attendance & Two-Tier Fee Collection Desk
              </p>
            </div>
          </div>

          {/* Right Controls: User Profile, Approvals Badge, Settings, Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Approvals Badge */}
            {pendingApprovalsCount > 0 && (
              <button
                onClick={onOpenApprovals}
                className={`relative px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm border ${
                  isAdmin
                    ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
                title={
                  isAdmin
                    ? `${pendingApprovalsCount} staff collections awaiting your approval`
                    : `${pendingApprovalsCount} collections pending Admin audit`
                }
              >
                <Bell className={`w-3.5 h-3.5 ${isAdmin ? 'text-amber-400 animate-bounce' : 'text-slate-400'}`} />
                <span className="hidden sm:inline">
                  {isAdmin ? 'Approvals:' : 'Queue:'}
                </span>
                <span
                  className={`${
                    isAdmin ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-700 text-white font-bold'
                  } px-1.5 py-0.2 rounded text-[10px]`}
                >
                  {pendingApprovalsCount}
                </span>
              </button>
            )}

            {/* Current Logged In User Pill */}
            {currentUser && (
              <div
                className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs ${
                  isAdmin
                    ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-200'
                    : isStaff
                    ? 'bg-slate-800 border-amber-500/40 text-slate-200'
                    : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                    isAdmin
                      ? 'bg-indigo-600 text-white'
                      : isStaff
                      ? 'bg-amber-600 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {isAdmin ? (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  ) : isStaff ? (
                    <UserCheck className="w-3.5 h-3.5" />
                  ) : (
                    <GraduationCap className="w-3.5 h-3.5" />
                  )}
                </div>
                <div className="leading-tight text-left">
                  <div className="font-bold truncate max-w-[130px]">{currentUser.name}</div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    {isAdmin && <span className="text-indigo-400 font-semibold">Director • Approver</span>}
                    {isStaff && (
                      <span className="text-amber-300 font-semibold flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" />
                        Staff (No Approval)
                      </span>
                    )}
                    {isStudent && (
                      <span className="text-emerald-400 font-semibold">
                        Roll: {currentUser.rollNo}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Admin User Permissions Button */}
            {isAdmin && onOpenPermissions && (
              <button
                onClick={onOpenPermissions}
                className="bg-purple-950/70 hover:bg-purple-900 text-purple-200 hover:text-white border border-purple-700/50 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                title="Configure User & Work Permissions"
              >
                <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden sm:inline">Permissions</span>
              </button>
            )}

            {/* Admin Course Master Button */}
            {isAdmin && onOpenCourseManager && (
              <button
                onClick={onOpenCourseManager}
                className="bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 hover:text-white border border-indigo-700/50 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
                title="Manage Courses & Fee Structures (OSCIT, OSCIT-A, OSCIT-A+)"
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Course Master</span>
              </button>
            )}

            {/* Quick Settings Icon */}
            {!isStudent && (
              <button
                onClick={onOpenSettings}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                title="Institute Profile & Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}

            {/* Logout / Switch Account Button */}
            <button
              onClick={onLogout}
              className="bg-slate-800 hover:bg-rose-950/70 hover:text-rose-300 hover:border-rose-500/50 border border-slate-700 text-slate-300 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Sign Out to Login Screen"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-300" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

