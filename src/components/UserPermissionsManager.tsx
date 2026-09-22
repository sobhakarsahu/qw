import React, { useState, useMemo } from 'react';
import {
  SystemUserAccount,
  WorkPermissions,
  UserRole,
  InstituteSettings,
  AuthUser,
} from '../types';
import {
  PERMISSION_CATEGORIES,
  PERMISSION_LABELS,
  PERMISSION_PRESETS,
  ALL_ADMIN_PERMISSIONS,
  DEFAULT_STAFF_PERMISSIONS,
  countActivePermissions,
} from '../utils/permissions';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Users,
  UserCheck,
  UserPlus,
  UserX,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sliders,
  CreditCard,
  BookOpen,
  Fingerprint,
  TrendingUp,
  GraduationCap,
  Search,
  Filter,
  Download,
  Sparkles,
  Lock,
  Unlock,
  Check,
  X,
  Eye,
  EyeOff,
  Trash2,
  Edit3,
  Save,
  HelpCircle,
  Building,
  Mail,
  Phone,
  Clock,
  Layers,
  FileCheck,
} from 'lucide-react';

interface UserPermissionsManagerProps {
  users: SystemUserAccount[];
  settings: InstituteSettings;
  currentRole: UserRole;
  currentUser: AuthUser | null;
  onAddUser: (user: SystemUserAccount) => void;
  onUpdateUser: (user: SystemUserAccount) => void;
  onDeleteUser: (userId: string) => void;
  onResetUserPassword: (userId: string, newPass: string) => void;
}

export const UserPermissionsManager: React.FC<UserPermissionsManagerProps> = ({
  users,
  settings,
  currentRole,
  currentUser,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onResetUserPassword,
}) => {
  const isAdmin = currentRole === 'admin';

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'>('ALL');
  const [activeView, setActiveView] = useState<'CARDS' | 'MATRIX' | 'POLICIES'>('CARDS');

  // Modals & Editing state
  const [editingUser, setEditingUser] = useState<SystemUserAccount | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [resetPassModalUser, setResetPassModalUser] = useState<SystemUserAccount | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [showPasswordInModal, setShowPasswordInModal] = useState(false);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<SystemUserAccount | null>(null);

  // New User Form State
  const [newUserForm, setNewUserForm] = useState<Partial<SystemUserAccount>>({
    name: '',
    loginId: '',
    password: 'staff@123',
    role: 'staff',
    roleLabel: 'Accounts & Front Desk Staff',
    designation: 'Accounts Counter Staff',
    department: 'Accounts & Admissions',
    email: '',
    phone: '',
    status: 'ACTIVE',
    notes: '',
    permissions: { ...DEFAULT_STAFF_PERMISSIONS },
  });

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.loginId.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.toLowerCase().includes(q) ||
        u.designation.toLowerCase().includes(q) ||
        (u.department && u.department.toLowerCase().includes(q));

      const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchStatus = statusFilter === 'ALL' || u.status === statusFilter;

      return matchQuery && matchRole && matchStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.status === 'ACTIVE').length;
    const admins = users.filter((u) => u.role === 'admin').length;
    const staff = users.filter((u) => u.role === 'staff').length;
    return { total, active, admins, staff };
  }, [users]);

  // Export Matrix CSV
  const handleExportCSV = () => {
    const allPermissionKeys = Object.keys(PERMISSION_LABELS) as (keyof WorkPermissions)[];
    const headers = ['User ID', 'Name', 'Role', 'Designation', 'Login ID', 'Email', 'Phone', 'Status', ...allPermissionKeys];

    const rows = users.map((u) => {
      const permValues = allPermissionKeys.map((k) => (u.permissions[k] ? 'YES' : 'NO'));
      return [
        `"${u.id}"`,
        `"${u.name}"`,
        `"${u.role}"`,
        `"${u.designation}"`,
        `"${u.loginId}"`,
        `"${u.email}"`,
        `"${u.phone}"`,
        `"${u.status}"`,
        ...permValues,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `institute-user-permissions-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open Edit Modal
  const handleOpenEdit = (user: SystemUserAccount) => {
    if (!isAdmin) {
      alert('Security Notice: Only Institute Director / Super Admin has authority to configure user work permissions.');
      return;
    }
    setEditingUser(JSON.parse(JSON.stringify(user)));
    setShowPasswordInModal(false);
  };

  // Apply Preset to Editing User
  const handleApplyPresetToEditing = (preset: (typeof PERMISSION_PRESETS)[0]) => {
    if (!editingUser) return;
    setEditingUser({
      ...editingUser,
      role: preset.role,
      roleLabel: preset.name,
      permissions: {
        ...(preset.role === 'admin' ? ALL_ADMIN_PERMISSIONS : DEFAULT_STAFF_PERMISSIONS),
        ...preset.permissions,
      },
    });
  };

  // Apply Preset to New User Form
  const handleApplyPresetToNewForm = (preset: (typeof PERMISSION_PRESETS)[0]) => {
    setNewUserForm((prev) => ({
      ...prev,
      role: preset.role,
      roleLabel: preset.name,
      designation: preset.name,
      permissions: {
        ...(preset.role === 'admin' ? ALL_ADMIN_PERMISSIONS : DEFAULT_STAFF_PERMISSIONS),
        ...preset.permissions,
      },
    }));
  };

  // Toggle Single Permission on Editing User
  const handleToggleEditingPermission = (key: keyof WorkPermissions) => {
    if (!editingUser) return;
    setEditingUser({
      ...editingUser,
      permissions: {
        ...editingUser.permissions,
        [key]: !editingUser.permissions[key],
      },
    });
  };

  // Toggle All Permissions in a Category for Editing User
  const handleToggleCategoryAll = (keys: (keyof WorkPermissions)[], enable: boolean) => {
    if (!editingUser) return;
    const updated = { ...editingUser.permissions };
    keys.forEach((k) => {
      updated[k] = enable;
    });
    setEditingUser({
      ...editingUser,
      permissions: updated,
    });
  };

  // Save Edited User
  const handleSaveEditedUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editingUser.name.trim() || !editingUser.loginId.trim()) {
      alert('Please fill in user full name and login ID.');
      return;
    }
    onUpdateUser(editingUser);
    setEditingUser(null);
  };

  // Save New User
  const handleSaveNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.name?.trim() || !newUserForm.loginId?.trim()) {
      alert('Please enter user full name and login ID.');
      return;
    }

    // Check duplicate login ID
    if (users.some((u) => u.loginId.toLowerCase() === newUserForm.loginId?.toLowerCase().trim())) {
      alert(`Login ID "${newUserForm.loginId}" already exists. Please choose a unique login ID.`);
      return;
    }

    const createdUser: SystemUserAccount = {
      id: `user-${Date.now()}`,
      loginId: newUserForm.loginId.trim(),
      password: newUserForm.password || 'staff@123',
      name: newUserForm.name.trim(),
      role: newUserForm.role || 'staff',
      roleLabel: newUserForm.roleLabel || 'Staff Member',
      designation: newUserForm.designation || 'Staff',
      department: newUserForm.department || 'General',
      email: newUserForm.email?.trim() || '',
      phone: newUserForm.phone?.trim() || '',
      avatarColor: 'from-blue-600 to-indigo-700',
      status: newUserForm.status || 'ACTIVE',
      createdAt: new Date().toISOString().split('T')[0],
      notes: newUserForm.notes || '',
      permissions: (newUserForm.permissions as WorkPermissions) || { ...DEFAULT_STAFF_PERMISSIONS },
    };

    onAddUser(createdUser);
    setIsAddModalOpen(false);
    setNewUserForm({
      name: '',
      loginId: '',
      password: 'staff@123',
      role: 'staff',
      roleLabel: 'Accounts & Front Desk Staff',
      designation: 'Accounts Counter Staff',
      department: 'Accounts & Admissions',
      email: '',
      phone: '',
      status: 'ACTIVE',
      notes: '',
      permissions: { ...DEFAULT_STAFF_PERMISSIONS },
    });
  };

  // Quick Inline Matrix Toggle
  const handleInlineMatrixToggle = (userId: string, key: keyof WorkPermissions) => {
    if (!isAdmin) {
      alert('Security Notice: Only Institute Director has authority to modify work permissions.');
      return;
    }
    const target = users.find((u) => u.id === userId);
    if (!target) return;

    const updatedUser: SystemUserAccount = {
      ...target,
      permissions: {
        ...target.permissions,
        [key]: !target.permissions[key],
      },
    };
    onUpdateUser(updatedUser);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Center Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-indigo-900/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-300">
              <KeyRound className="w-4 h-4 text-indigo-400" />
              Centralized Access Control & Staff Work Permissions
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight mt-1 flex items-center gap-2.5">
              User Accounts & Work Permissions Hub
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                Director Governance Active
              </span>
            </h1>
            <p className="text-xs text-indigo-200/90 mt-1 max-w-2xl">
              Configure fine-grained work permissions, counter fee collection rights, admin approval sanctions, student admission capabilities, and module visibility for every staff member at one centralized place.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              onClick={handleExportCSV}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Export complete permissions matrix as CSV"
            >
              <Download className="w-4 h-4 text-slate-400" />
              Export Matrix CSV
            </button>

            {isAdmin && (
              <button
                onClick={() => {
                  setNewUserForm({
                    name: '',
                    loginId: '',
                    password: 'staff@123',
                    role: 'staff',
                    roleLabel: 'Accounts & Front Desk Staff',
                    designation: 'Accounts Counter Staff',
                    department: 'Accounts & Admissions',
                    email: '',
                    phone: '',
                    status: 'ACTIVE',
                    notes: '',
                    permissions: { ...DEFAULT_STAFF_PERMISSIONS },
                  });
                  setIsAddModalOpen(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                Add System User / Staff
              </button>
            )}
          </div>
        </div>

        {/* Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-indigo-900/60">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-[11px] text-indigo-300 font-medium">Total System Users</div>
            <div className="text-xl font-black text-white mt-0.5">{metrics.total}</div>
            <div className="text-[10px] text-emerald-400 mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> {metrics.active} Active Accounts
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-[11px] text-indigo-300 font-medium">Administrators & Directors</div>
            <div className="text-xl font-black text-indigo-300 mt-0.5">{metrics.admins}</div>
            <div className="text-[10px] text-indigo-200 mt-0.5">Full Sanction & Master Rights</div>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-[11px] text-indigo-300 font-medium">Staff & Counter Operators</div>
            <div className="text-xl font-black text-emerald-300 mt-0.5">{metrics.staff}</div>
            <div className="text-[10px] text-emerald-300/80 mt-0.5">Customized Work Permissions</div>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-[11px] text-indigo-300 font-medium">Security Enforcement</div>
            <div className="text-sm font-black text-amber-300 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-amber-400" /> Two-Tier Auth
            </div>
            <div className="text-[10px] text-amber-200/80 mt-0.5">Staff Collect • Admin Approves</div>
          </div>
        </div>
      </div>

      {/* View Switcher & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* View Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setActiveView('CARDS')}
            className={`flex-1 md:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeView === 'CARDS'
                ? 'bg-white text-indigo-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            User Cards Directory ({filteredUsers.length})
          </button>
          <button
            onClick={() => setActiveView('MATRIX')}
            className={`flex-1 md:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeView === 'MATRIX'
                ? 'bg-white text-indigo-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Full Permissions Matrix Grid
          </button>
          <button
            onClick={() => setActiveView('POLICIES')}
            className={`flex-1 md:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeView === 'POLICIES'
                ? 'bg-white text-indigo-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Role Policy Presets
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search user, name, email, role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 font-medium focus:bg-white focus:outline-hidden cursor-pointer"
          >
            <option value="ALL">All Roles</option>
            <option value="admin">Administrators</option>
            <option value="staff">Staff Members</option>
            <option value="student">Student Portal</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 font-medium focus:bg-white focus:outline-hidden cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: USER CARDS DIRECTORY */}
      {/* ========================================================================= */}
      {activeView === 'CARDS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredUsers.map((user) => {
            const { active, total } = countActivePermissions(user.permissions);
            const isUserAdmin = user.role === 'admin';
            const permPercent = Math.round((active / total) * 100);

            return (
              <div
                key={user.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col overflow-hidden group"
              >
                {/* User Card Header */}
                <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                        user.avatarColor || (isUserAdmin ? 'from-indigo-600 to-violet-700' : 'from-emerald-600 to-teal-700')
                      } text-white font-black text-base flex items-center justify-center shadow-sm shrink-0`}
                    >
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-slate-900 leading-snug">{user.name}</h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            user.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : user.status === 'SUSPENDED'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {user.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{user.designation}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            isUserAdmin
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {user.role === 'admin' ? '🛡️ Super Admin' : '👤 Staff Operator'}
                        </span>
                        {user.department && (
                          <span className="text-[10px] text-slate-400">• {user.department}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => handleOpenEdit(user)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                      title="Edit Account & Permissions"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Account Details & Credentials Strip */}
                <div className="px-5 py-3 bg-slate-50/70 text-xs border-b border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-[11px] text-slate-400">Login ID:</span>
                    <span className="font-mono font-semibold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                      {user.loginId}
                    </span>
                  </div>
                  {user.email && (
                    <div className="flex items-center justify-between text-slate-600 text-[11px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> Email:
                      </span>
                      <span className="truncate max-w-[180px]">{user.email}</span>
                    </div>
                  )}
                  {user.phone && (
                    <div className="flex items-center justify-between text-slate-600 text-[11px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> Phone:
                      </span>
                      <span>{user.phone}</span>
                    </div>
                  )}
                  {user.lastLoginAt && (
                    <div className="flex items-center justify-between text-slate-500 text-[10px] pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" /> Last Active:
                      </span>
                      <span>{user.lastLoginAt}</span>
                    </div>
                  )}
                </div>

                {/* Active Work Permissions Progress & Highlights */}
                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-slate-700 flex items-center gap-1">
                        <Sliders className="w-3.5 h-3.5 text-indigo-500" /> Work Permissions
                      </span>
                      <span className="font-mono text-xs font-bold text-indigo-600">
                        {active} / {total} ({permPercent}%)
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          permPercent === 100
                            ? 'bg-indigo-600'
                            : permPercent > 50
                            ? 'bg-emerald-500'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${permPercent}%` }}
                      />
                    </div>

                    {/* Quick Feature Badges */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {user.permissions.canCollectFees && (
                        <span className="text-[10px] font-medium bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                          <CreditCard className="w-2.5 h-2.5" /> Fee Collection
                        </span>
                      )}
                      {user.permissions.canApproveFeePayments ? (
                        <span className="text-[10px] font-medium bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200 flex items-center gap-1">
                          <ShieldCheck className="w-2.5 h-2.5" /> Fee Approvals
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium bg-slate-100 text-slate-400 px-2 py-0.5 rounded border border-slate-200">
                          No Fee Approval
                        </span>
                      )}
                      {user.permissions.canAddStudent && (
                        <span className="text-[10px] font-medium bg-sky-50 text-sky-700 px-2 py-0.5 rounded border border-sky-200 flex items-center gap-1">
                          <Users className="w-2.5 h-2.5" /> Admissions
                        </span>
                      )}
                      {user.permissions.canRecordBiometricPunches && (
                        <span className="text-[10px] font-medium bg-teal-50 text-teal-700 px-2 py-0.5 rounded border border-teal-200 flex items-center gap-1">
                          <Fingerprint className="w-2.5 h-2.5" /> Biometrics
                        </span>
                      )}
                      {user.permissions.canRecordIncomeExpense && (
                        <span className="text-[10px] font-medium bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                          <TrendingUp className="w-2.5 h-2.5" /> Expenses
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Footer Actions */}
                  {isAdmin && (
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
                      <button
                        onClick={() => {
                          setResetPassModalUser(user);
                          setNewPasswordInput('');
                        }}
                        className="text-[11px] text-slate-600 hover:text-indigo-600 font-semibold flex items-center gap-1 py-1 px-2 rounded hover:bg-slate-100 transition cursor-pointer"
                      >
                        <Lock className="w-3 h-3 text-slate-400" /> Reset Password
                      </button>

                      <button
                        onClick={() => handleOpenEdit(user)}
                        className="bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <Sliders className="w-3 h-3" /> Set Permissions
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: FULL PERMISSIONS MATRIX (INTERACTIVE GRID) */}
      {/* ========================================================================= */}
      {activeView === 'MATRIX' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-sm">Interactive Permissions & Role Matrix</h3>
            </div>
            <p className="text-xs text-slate-300">
              {isAdmin
                ? 'Click any checkbox to immediately toggle privileges in real-time.'
                : 'View-only mode. Only Institute Director can modify access rules.'}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                  <th className="py-3 px-4 font-bold sticky left-0 bg-slate-100 z-10 min-w-[280px]">
                    Work Modules & Granular Operations
                  </th>
                  {filteredUsers.map((u) => (
                    <th key={u.id} className="py-3 px-3 font-bold text-center min-w-[140px]">
                      <div className="font-bold text-slate-900 text-xs truncate max-w-[130px] mx-auto">
                        {u.name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-normal">
                        {u.role === 'admin' ? '🛡️ Admin' : '👤 Staff'} • {u.loginId}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {PERMISSION_CATEGORIES.map((category) => (
                  <React.Fragment key={category.id}>
                    {/* Category Header Row */}
                    <tr className="bg-indigo-50/50 font-bold text-indigo-950 border-t-2 border-indigo-100">
                      <td colSpan={filteredUsers.length + 1} className="py-2.5 px-4">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="w-2 h-2 rounded-full bg-indigo-600" />
                          <span className="uppercase tracking-wider">{category.title}</span>
                          <span className="text-[10px] text-slate-500 font-normal italic">
                            ({category.description})
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* Individual Permission Rows */}
                    {category.keys.map((permKey) => {
                      const meta = PERMISSION_LABELS[permKey];
                      return (
                        <tr key={permKey} className="hover:bg-slate-50 transition group">
                          <td className="py-2 px-4 sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-100">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-900">{meta?.label || permKey}</span>
                              {meta?.isHighRisk && (
                                <span className="text-[9px] bg-rose-50 text-rose-700 font-bold px-1.5 py-0.2 rounded border border-rose-200">
                                  HIGH RISK
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500">{meta?.desc}</p>
                          </td>

                          {filteredUsers.map((u) => {
                            const isAllowed = u.permissions[permKey] || false;
                            return (
                              <td key={u.id} className="py-2 px-3 text-center">
                                <button
                                  type="button"
                                  disabled={!isAdmin}
                                  onClick={() => handleInlineMatrixToggle(u.id, permKey)}
                                  className={`p-1.5 rounded-lg transition inline-flex items-center justify-center ${
                                    isAllowed
                                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                      : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                  } ${isAdmin ? 'cursor-pointer hover:scale-110' : 'cursor-not-allowed opacity-80'}`}
                                  title={
                                    isAdmin
                                      ? `Click to ${isAllowed ? 'Revoke' : 'Grant'} ${meta?.label} for ${u.name}`
                                      : 'Admin authority required to edit'
                                  }
                                >
                                  {isAllowed ? (
                                    <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                                  ) : (
                                    <X className="w-4 h-4 text-slate-300" />
                                  )}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: ROLE POLICIES & PRESETS */}
      {/* ========================================================================= */}
      {activeView === 'POLICIES' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                Standard Institute Role Templates & Presets
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Quickly apply standardized permission packages to staff or create custom roles tailored to your institute workflow.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {PERMISSION_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-indigo-300 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${preset.badgeColor}`}>
                        {preset.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono uppercase">
                        {preset.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">{preset.description}</p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">
                      {preset.role === 'admin' ? 'All Privileges' : 'Specialized Scope'}
                    </span>
                    <button
                      onClick={() => {
                        setNewUserForm({
                          name: '',
                          loginId: '',
                          password: 'staff@123',
                          role: preset.role,
                          roleLabel: preset.name,
                          designation: preset.name,
                          department: 'General',
                          status: 'ACTIVE',
                          permissions: {
                            ...(preset.role === 'admin' ? ALL_ADMIN_PERMISSIONS : DEFAULT_STAFF_PERMISSIONS),
                            ...preset.permissions,
                          },
                        });
                        setIsAddModalOpen(true);
                      }}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Create User from Preset
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Institute Governance Policies Card */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl p-6 text-white border border-indigo-900/60 shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-base text-white">Institute Security & Financial Governance Rules</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-amber-400" /> 1. Two-Tier Fee Collection Rule
                </div>
                <p className="text-xs text-indigo-100/80 mt-1.5 leading-relaxed">
                  Front-desk staff can record payments and generate provisional receipts. Official ledger sealing, income credit, and exam registration require Director review and sanction.
                </p>
              </div>

              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-400" /> 2. Expense Voucher Sanction
                </div>
                <p className="text-xs text-indigo-100/80 mt-1.5 leading-relaxed">
                  Staff may record daily center operating expenditures (hardware, utilities, stationery). Vouchers remain in pending queue until approved by Admin before impacting net center balance.
                </p>
              </div>

              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                  <Fingerprint className="w-4 h-4 text-sky-400" /> 3. Biometric Device Authorization
                </div>
                <p className="text-xs text-indigo-100/80 mt-1.5 leading-relaxed">
                  Terminal synchronization pulls tamper-resistant punch logs from LAN machines. Only authorized biometric operators and directors can perform manual punch overrides.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT USER & WORK PERMISSIONS MODAL */}
      {/* ========================================================================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                  {editingUser.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Edit User & Work Permissions</h3>
                  <p className="text-xs text-indigo-200">
                    {editingUser.name} • {editingUser.designation} ({editingUser.loginId})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setEditingUser(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Presets Bar */}
            <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center gap-2 overflow-x-auto shrink-0">
              <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Apply Role Preset:
              </span>
              {PERMISSION_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPresetToEditing(preset)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border whitespace-nowrap transition cursor-pointer ${preset.badgeColor} hover:opacity-80`}
                >
                  {preset.name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  const allDisabled = Object.keys(PERMISSION_LABELS).reduce((acc, k) => {
                    acc[k as keyof WorkPermissions] = false;
                    return acc;
                  }, {} as WorkPermissions);
                  setEditingUser({ ...editingUser, permissions: allDisabled });
                }}
                className="text-[11px] font-semibold px-2 py-1 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-200 whitespace-nowrap transition cursor-pointer"
              >
                Revoke All
              </button>
            </div>

            {/* Modal Body with Scroll */}
            <form onSubmit={handleSaveEditedUser} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Profile & Credentials Section */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-indigo-600" /> User Profile & Account Authentication
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={editingUser.name}
                      onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Login ID *</label>
                    <input
                      type="text"
                      required
                      value={editingUser.loginId}
                      onChange={(e) => setEditingUser({ ...editingUser, loginId: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">System Role</label>
                    <select
                      value={editingUser.role}
                      onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="admin">Administrator (Super Admin)</option>
                      <option value="staff">Staff Member</option>
                      <option value="student">Student Portal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
                    <input
                      type="text"
                      value={editingUser.designation}
                      onChange={(e) => setEditingUser({ ...editingUser, designation: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                    <input
                      type="text"
                      value={editingUser.department || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g. Accounts / Admissions"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Account Status</label>
                    <select
                      value={editingUser.status}
                      onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as any })}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 cursor-pointer font-bold"
                    >
                      <option value="ACTIVE" className="text-emerald-600">ACTIVE</option>
                      <option value="INACTIVE" className="text-slate-600">INACTIVE</option>
                      <option value="SUSPENDED" className="text-rose-600">SUSPENDED</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={editingUser.email}
                      onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={editingUser.phone}
                      onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                    <div className="relative">
                      <input
                        type={showPasswordInModal ? 'text' : 'password'}
                        value={editingUser.password || 'staff@123'}
                        onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                        className="w-full px-3 py-2 pr-8 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswordInModal(!showPasswordInModal)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {showPasswordInModal ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Granular Work Permissions Categories */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-indigo-600" /> Granular Work & Action Permissions
                  </h4>
                  <div className="text-xs text-slate-500">
                    Checked actions are permitted for this user.
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {PERMISSION_CATEGORIES.map((category) => {
                    const allEnabled = category.keys.every((k) => editingUser.permissions[k]);
                    return (
                      <div
                        key={category.id}
                        className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3"
                      >
                        {/* Category Header */}
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <div>
                            <h5 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-indigo-600" />
                              {category.title}
                            </h5>
                            <p className="text-[10px] text-slate-500">{category.description}</p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleCategoryAll(category.keys, !allEnabled)}
                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded cursor-pointer transition shrink-0"
                          >
                            {allEnabled ? 'Disable All' : 'Enable All'}
                          </button>
                        </div>

                        {/* Permission Items */}
                        <div className="space-y-2">
                          {category.keys.map((permKey) => {
                            const isChecked = editingUser.permissions[permKey] || false;
                            const meta = PERMISSION_LABELS[permKey];

                            return (
                              <label
                                key={permKey}
                                className={`flex items-start gap-2.5 p-2 rounded-xl transition cursor-pointer ${
                                  isChecked ? 'bg-indigo-50/40 border border-indigo-100' : 'bg-slate-50/50 border border-transparent hover:bg-slate-100/60'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleEditingPermission(permKey)}
                                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                />
                                <div className="flex-1 text-xs">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`font-semibold ${isChecked ? 'text-indigo-950' : 'text-slate-700'}`}>
                                      {meta?.label || permKey}
                                    </span>
                                    {meta?.isHighRisk && (
                                      <span className="text-[9px] font-bold px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded border border-rose-200">
                                        Director Authority
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-slate-500 mt-0.5">{meta?.desc}</p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3 sticky bottom-0 bg-white py-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2">
                  {editingUser.id !== 'user-admin-01' && (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmUser(editingUser)}
                      className="px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete User
                    </button>
                  )}

                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/30 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" /> Save User & Permissions
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD NEW USER MODAL */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-bold text-base text-white">Add New System User / Staff Member</h3>
                  <p className="text-xs text-indigo-200">
                    Create login credentials and assign initial work permissions.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Presets Strip */}
            <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center gap-2 overflow-x-auto shrink-0">
              <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">
                Start with Preset:
              </span>
              {PERMISSION_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPresetToNewForm(preset)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border whitespace-nowrap transition cursor-pointer ${preset.badgeColor} hover:opacity-80`}
                >
                  {preset.name}
                </button>
              ))}
            </div>

            <form onSubmit={handleSaveNewUser} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Sharma"
                    value={newUserForm.name || ''}
                    onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Login ID (Username) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ramesh@digitech.edu or ramesh"
                    value={newUserForm.loginId || ''}
                    onChange={(e) => setNewUserForm({ ...newUserForm, loginId: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Password *</label>
                  <input
                    type="text"
                    required
                    value={newUserForm.password || 'staff@123'}
                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role Type</label>
                  <select
                    value={newUserForm.role || 'staff'}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="staff">Staff Operator</option>
                    <option value="admin">Administrator / Director</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. Front Desk Counter Officer"
                    value={newUserForm.designation || ''}
                    onChange={(e) => setNewUserForm({ ...newUserForm, designation: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Admissions & Accounts"
                    value={newUserForm.department || ''}
                    onChange={(e) => setNewUserForm({ ...newUserForm, department: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="e.g. ramesh@digitechacademy.edu"
                    value={newUserForm.email || ''}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 98765 00000"
                    value={newUserForm.phone || ''}
                    onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Work Permissions Preview info */}
              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex items-start gap-2.5 text-xs text-indigo-950">
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Initial Work Permissions:</span>
                  <p className="text-[11px] text-indigo-800 mt-0.5">
                    User will be created with the active preset permissions. You can customize fine-grained work rules at any time via the user card.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" /> Create User Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RESET PASSWORD MODAL */}
      {/* ========================================================================= */}
      {resetPassModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 my-auto animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Lock className="w-4 h-4 text-indigo-600" />
                Reset User Password
              </div>
              <button
                onClick={() => setResetPassModalUser(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Set a new login password for <strong>{resetPassModalUser.name}</strong> ({resetPassModalUser.loginId}).
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
              <input
                type="text"
                required
                placeholder="Enter new password (e.g. staff@123)"
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setResetPassModalUser(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!newPasswordInput.trim()) {
                    alert('Please enter a valid password.');
                    return;
                  }
                  onResetUserPassword(resetPassModalUser.id, newPasswordInput.trim());
                  setResetPassModalUser(null);
                  alert(`Password for ${resetPassModalUser.name} updated successfully.`);
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg cursor-pointer shadow-xs"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE USER CONFIRM MODAL */}
      {/* ========================================================================= */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 my-auto animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center gap-2.5 text-rose-600 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              Confirm User Deletion
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to permanently delete user account <strong>{deleteConfirmUser.name}</strong> ({deleteConfirmUser.loginId})?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteUser(deleteConfirmUser.id);
                  setDeleteConfirmUser(null);
                  setEditingUser(null);
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg cursor-pointer shadow-xs"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
