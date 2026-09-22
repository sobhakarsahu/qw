import React, { useState } from 'react';
import { AuthUser, InstituteSettings, Student, UserRole, SystemUserAccount } from '../types';
import { authenticateUser, PRESET_CREDENTIALS } from '../auth';
import {
  ShieldCheck,
  UserCheck,
  GraduationCap,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  MonitorCheck,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  QrCode,
  School,
  Users,
} from 'lucide-react';

interface LoginProps {
  settings: InstituteSettings;
  students: Student[];
  systemUsers?: SystemUserAccount[];
  onLoginSuccess: (user: AuthUser) => void;
}

export const Login: React.FC<LoginProps> = ({ settings, students, systemUsers, onLoginSuccess }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [loginId, setLoginId] = useState('admin@digitech.edu');
  const [password, setPassword] = useState('admin@123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRoleTabChange = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMessage(null);
    if (role === 'admin') {
      setLoginId('admin@digitech.edu');
      setPassword('admin@123');
    } else if (role === 'staff') {
      setLoginId('staff@digitech.edu');
      setPassword('staff@123');
    } else {
      setLoginId('DTC-2026-101');
      setPassword('student@123');
    }
  };

  const handleQuickFill = (presetLoginId: string, presetPass: string, role: UserRole) => {
    setSelectedRole(role);
    setLoginId(presetLoginId);
    setPassword(presetPass);
    setErrorMessage(null);

    // Auto submit for fast frictionless demo
    const result = authenticateUser(presetLoginId, presetPass, students, systemUsers);
    if (result.success && result.user) {
      onLoginSuccess(result.user);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    setTimeout(() => {
      const result = authenticateUser(loginId, password, students, systemUsers);
      setIsSubmitting(false);

      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMessage(result.message || 'Authentication failed. Please check ID and password.');
      }
    }, 200);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background Decorative Accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Branding */}
      <header className="px-6 py-5 border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md relative z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <MonitorCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg text-white tracking-tight leading-tight">
                {settings.name}
              </h1>
              <p className="text-xs text-slate-400">
                ERP Management & Fees Portal • {settings.isoCertified}
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-mono bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
            <School className="w-3.5 h-3.5 text-indigo-400" />
            <span>Govt Reg: {settings.regNo}</span>
          </div>
        </div>
      </header>

      {/* Main Login Body */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-center relative z-10">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Sign-in Card */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
              <div className="mb-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 mb-3">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                  Secure Role-Based Portal Access
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">Sign In to Account</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Select your institute role and enter the registered credentials.
                </p>
              </div>

              {/* Role Selection Tabs */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-xl mb-6">
                <button
                  type="button"
                  onClick={() => handleRoleTabChange('admin')}
                  className={`py-2 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    selectedRole === 'admin'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleTabChange('staff')}
                  className={`py-2 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    selectedRole === 'staff'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Staff</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleTabChange('student')}
                  className={`py-2 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    selectedRole === 'student'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Student</span>
                </button>
              </div>

              {/* Role Context Hint */}
              <div className="mb-5 p-3 rounded-xl text-xs flex items-start gap-2.5 border bg-slate-950/60 border-slate-800">
                {selectedRole === 'admin' && (
                  <>
                    <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-indigo-300">Director / Admin Portal:</span>
                      <p className="text-slate-400 mt-0.5">
                        Has exclusive authority to approve collected fees, audit income/expenses, and manage institute master settings.
                      </p>
                    </div>
                  </>
                )}
                {selectedRole === 'staff' && (
                  <>
                    <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-300">Staff Counter Desk (Policy Enforced):</span>
                      <p className="text-slate-400 mt-0.5">
                        Collects student fees & issues provisional receipts.{' '}
                        <strong className="text-amber-200">Staff have no right to approve fees</strong>; approval requires Director audit.
                      </p>
                    </div>
                  </>
                )}
                {selectedRole === 'student' && (
                  <>
                    <GraduationCap className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-emerald-300">Student & Parent Portal:</span>
                      <p className="text-slate-400 mt-0.5">
                        Check fee balances, upcoming installments, verified receipts, and biometric punch times.
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Form Fields */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {selectedRole === 'student' ? 'Student Roll Number or Email' : 'Login ID / Email'}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={loginId}
                      onChange={(e) => setLoginId(e.target.value)}
                      placeholder={
                        selectedRole === 'admin'
                          ? 'admin@digitech.edu'
                          : selectedRole === 'staff'
                          ? 'staff@digitech.edu'
                          : 'e.g. DTC-2026-101'
                      }
                      className="w-full bg-slate-950/90 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Account Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950/90 border border-slate-700/80 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 transition"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-sm text-white transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer ${
                    selectedRole === 'student'
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30'
                      : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/30'
                  }`}
                >
                  {isSubmitting ? (
                    <span>Verifying Credentials...</span>
                  ) : (
                    <>
                      <span>Sign In as {selectedRole.toUpperCase()}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Provided Credentials Directory */}
          <div className="lg:col-span-6 flex flex-col justify-center space-y-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-7 backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/30">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Provided Login Credentials</h3>
                    <p className="text-xs text-slate-400">Pre-configured institute user accounts</p>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  1-Click Ready
                </span>
              </div>

              <div className="space-y-3">
                {PRESET_CREDENTIALS.map((cred) => {
                  const isCurrentRole = selectedRole === cred.role;
                  return (
                    <div
                      key={cred.role}
                      className={`p-4 rounded-2xl border transition-all ${
                        isCurrentRole
                          ? 'bg-slate-800/80 border-indigo-500/50 ring-1 ring-indigo-500/30'
                          : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold ${
                              cred.role === 'admin'
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                : cred.role === 'staff'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {cred.role === 'admin' && <ShieldCheck className="w-4 h-4" />}
                            {cred.role === 'staff' && <UserCheck className="w-4 h-4" />}
                            {cred.role === 'student' && <GraduationCap className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">{cred.roleLabel}</span>
                              {cred.role === 'staff' && (
                                <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold px-1.5 py-0.2 rounded">
                                  No Fee Approval
                                </span>
                              )}
                              {cred.role === 'admin' && (
                                <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold px-1.5 py-0.2 rounded">
                                  Approver
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400">{cred.name}</div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleQuickFill(cred.loginId, cred.password, cred.role)}
                          className="bg-slate-800 hover:bg-indigo-600 hover:text-white text-indigo-300 border border-indigo-500/30 hover:border-transparent text-xs font-semibold px-3 py-1.5 rounded-lg transition shrink-0 flex items-center gap-1 cursor-pointer"
                          title={`Auto fill and sign in as ${cred.role}`}
                        >
                          <span>Auto Login</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-xs font-mono">
                        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                          <span className="text-slate-500 text-[10px] block">LOGIN ID</span>
                          <span className="text-slate-200 font-bold">{cred.loginId}</span>
                        </div>
                        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                          <span className="text-slate-500 text-[10px] block">PASSWORD</span>
                          <span className="text-amber-300 font-bold">{cred.password}</span>
                        </div>
                      </div>

                      <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px] text-slate-400">
                        {cred.permissions.map((perm, idx) => (
                          <span
                            key={idx}
                            className={`px-2 py-0.5 rounded-md ${
                              perm.includes('No Authority') || perm.includes('❌')
                                ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {perm}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Note on other staff & students */}
              {systemUsers && systemUsers.filter((u) => u.role === 'staff' && u.loginId !== 'staff@digitech.edu').length > 0 && (
                <div className="mt-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400">
                  <span className="text-slate-300 font-semibold block mb-1">
                    👥 Other Configured Staff Accounts:
                  </span>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {systemUsers
                      .filter((u) => u.role === 'staff' && u.loginId !== 'staff@digitech.edu')
                      .map((staffUser) => (
                        <button
                          key={staffUser.id}
                          type="button"
                          onClick={() => handleQuickFill(staffUser.loginId, staffUser.password || 'staff@123', 'staff')}
                          className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 px-2.5 py-1 rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <UserCheck className="w-3 h-3 text-emerald-400" />
                          <span>{staffUser.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">({staffUser.loginId})</span>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              <div className="mt-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400">
                <span className="text-slate-300 font-semibold block mb-1">
                  💡 Additional Student Login Accounts:
                </span>
                Any registered student can log in using their Roll Number (e.g.{' '}
                <button
                  type="button"
                  onClick={() => handleQuickFill('DTC-2026-102', 'student@123', 'student')}
                  className="text-indigo-400 font-mono hover:underline font-bold"
                >
                  DTC-2026-102
                </button>
                ,{' '}
                <button
                  type="button"
                  onClick={() => handleQuickFill('DTC-2026-103', 'student@123', 'student')}
                  className="text-indigo-400 font-mono hover:underline font-bold"
                >
                  DTC-2026-103
                </button>
                ,{' '}
                <button
                  type="button"
                  onClick={() => handleQuickFill('DTC-2026-104', 'student@123', 'student')}
                  className="text-indigo-400 font-mono hover:underline font-bold"
                >
                  DTC-2026-104
                </button>
                ) with password <code className="text-amber-300">student@123</code>.
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-slate-800/80 bg-slate-900/40 text-center text-xs text-slate-500">
        <p>
          {settings.name} Fee ERP • Two-Tier Staff Collection & Admin Authorization Architecture •
          ISO 9001:2015 Verified
        </p>
      </footer>
    </div>
  );
};
