import React, { useState, useEffect } from 'react';
import {
  UserRole,
  Student,
  Course,
  CouponCode,
  FeePayment,
  BiometricAttendanceRecord,
  BiometricDevice,
  IncomeExpenseItem,
  InstituteSettings,
  AuthUser,
  ExtraFeePayment,
  ApprovalStatus,
  SystemUserAccount,
  WorkPermissions,
} from './types';
import {
  INITIAL_STUDENTS,
  INITIAL_COURSES,
  INITIAL_COUPONS,
  INITIAL_FEE_PAYMENTS,
  INITIAL_BIOMETRIC_DEVICES,
  INITIAL_BIOMETRIC_LOGS,
  INITIAL_INCOME_EXPENSE,
  INITIAL_INSTITUTE_SETTINGS,
  INITIAL_EXTRA_FEE_PAYMENTS,
} from './mockData';
import { DEFAULT_SYSTEM_USERS } from './utils/permissions';
import { saveLastReceiptVoucherInfo } from './utils/helpers';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { FeeApprovals } from './components/FeeApprovals';
import { FeeCollectionPage } from './components/FeeCollectionPage';
import { FeeCollectionModal } from './components/FeeCollectionModal';
import { CourseManagerModal } from './components/CourseManagerModal';
import { StudentManager } from './components/StudentManager';
import { ExtraFeesManager } from './components/ExtraFeesManager';
import { BiometricAttendance } from './components/BiometricAttendance';
import { IncomeExpense } from './components/IncomeExpense';
import { StudentParentPortal } from './components/StudentParentPortal';
import { InstituteSettingsModal } from './components/InstituteSettingsModal';
import { ReceiptModal } from './components/ReceiptModal';
import { CourseListPanel } from './components/CourseListPanel';
import { UserPermissionsManager } from './components/UserPermissionsManager';
import { Login } from './components/Login';
import {
  LayoutDashboard,
  Banknote,
  ShieldCheck,
  Users,
  Fingerprint,
  TrendingUp,
  GraduationCap,
  Eye,
  Plus,
  CreditCard,
  BookOpen,
  Receipt,
  FileCheck,
  KeyRound,
} from 'lucide-react';

export default function App() {
  // Authentication session state
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('dtc_auth_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  // Role state derived from session
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const savedUser = localStorage.getItem('dtc_auth_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        if (u?.role) return u.role;
      } catch {}
    }
    return (localStorage.getItem('dtc_role') as UserRole) || 'admin';
  });

  const [activeTab, setActiveTab] = useState<string>(() => {
    return localStorage.getItem('dtc_tab') || 'dashboard';
  });

  const [settings, setSettings] = useState<InstituteSettings>(() => {
    const saved = localStorage.getItem('dtc_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (
          !parsed.name ||
          parsed.name === 'Apex DigiTech Computer Academy' ||
          parsed.name === 'DigiTech Computer Institute'
        ) {
          return { ...parsed, name: 'Computer Institute ERP System' };
        }
        return parsed;
      } catch {}
    }
    return INITIAL_INSTITUTE_SETTINGS;
  });

  const [courses, setCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem('dtc_courses');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {}
    }
    return INITIAL_COURSES;
  });

  const [deletedCourses, setDeletedCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem('dtc_deleted_courses');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    // If OSCIT is missing from active courses, pre-seed it in deletedCourses for easy 1-click restore
    const activeSaved = localStorage.getItem('dtc_courses');
    if (activeSaved) {
      try {
        const activeList: Course[] = JSON.parse(activeSaved);
        const hasOscit = activeList.some((c) => c.code.toUpperCase() === 'OSCIT' || c.id === 'c-oscit');
        if (!hasOscit) {
          return [
            {
              id: 'c-oscit',
              code: 'OSCIT',
              name: 'OSCIT (Odisha State Certificate in Information Technology)',
              duration: '3 Months',
              fee: 4000,
              category: 'Certificate',
              description: 'Computer Fundamentals, Windows 11, MS Word, Excel, PowerPoint, Internet & Typing',
              deletedAt: new Date().toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              }),
              deletedBy: 'Admin',
            },
          ];
        }
      } catch {}
    }
    return [];
  });

  const [coupons, setCoupons] = useState<CouponCode[]>(() => {
    const saved = localStorage.getItem('dtc_coupons');
    return saved ? JSON.parse(saved) : INITIAL_COUPONS;
  });

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('dtc_students');
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  });

  const [payments, setPayments] = useState<FeePayment[]>(() => {
    const saved = localStorage.getItem('dtc_payments');
    return saved ? JSON.parse(saved) : INITIAL_FEE_PAYMENTS;
  });

  const [attendanceRecords, setAttendanceRecords] = useState<BiometricAttendanceRecord[]>(() => {
    const saved = localStorage.getItem('dtc_attendance');
    return saved ? JSON.parse(saved) : INITIAL_BIOMETRIC_LOGS;
  });

  const [devices, setDevices] = useState<BiometricDevice[]>(() => {
    const saved = localStorage.getItem('dtc_devices');
    return saved ? JSON.parse(saved) : INITIAL_BIOMETRIC_DEVICES;
  });

  const [incomeExpenseItems, setIncomeExpenseItems] = useState<IncomeExpenseItem[]>(() => {
    const saved = localStorage.getItem('dtc_income_expense');
    return saved ? JSON.parse(saved) : INITIAL_INCOME_EXPENSE;
  });

  const [extraFeePayments, setExtraFeePayments] = useState<ExtraFeePayment[]>(() => {
    const saved = localStorage.getItem('dtc_extra_fee_payments');
    return saved ? JSON.parse(saved) : INITIAL_EXTRA_FEE_PAYMENTS;
  });

  const [systemUsers, setSystemUsers] = useState<SystemUserAccount[]>(() => {
    const saved = localStorage.getItem('dtc_system_users');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {}
    }
    return DEFAULT_SYSTEM_USERS;
  });

  // Modal states
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [collectPreselectedStudentId, setCollectPreselectedStudentId] = useState<string | undefined>(undefined);
  const [preselectedStudentForExtraFee, setPreselectedStudentForExtraFee] = useState<Student | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showCourseManagerModal, setShowCourseManagerModal] = useState(false);
  const [viewReceiptPayment, setViewReceiptPayment] = useState<FeePayment | null>(null);
  const [portalTargetRollNo, setPortalTargetRollNo] = useState<string | undefined>(() => {
    const savedUser = localStorage.getItem('dtc_auth_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        if (u?.rollNo) return u.rollNo;
      } catch {}
    }
    return undefined;
  });

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('dtc_role', currentRole);
  }, [currentRole]);

  useEffect(() => {
    localStorage.setItem('dtc_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('dtc_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('dtc_courses', JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem('dtc_deleted_courses', JSON.stringify(deletedCourses));
  }, [deletedCourses]);

  useEffect(() => {
    localStorage.setItem('dtc_coupons', JSON.stringify(coupons));
  }, [coupons]);

  useEffect(() => {
    localStorage.setItem('dtc_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('dtc_payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('dtc_extra_fee_payments', JSON.stringify(extraFeePayments));
  }, [extraFeePayments]);

  useEffect(() => {
    localStorage.setItem('dtc_attendance', JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  useEffect(() => {
    localStorage.setItem('dtc_devices', JSON.stringify(devices));
  }, [devices]);

  useEffect(() => {
    localStorage.setItem('dtc_income_expense', JSON.stringify(incomeExpenseItems));
  }, [incomeExpenseItems]);

  useEffect(() => {
    localStorage.setItem('dtc_system_users', JSON.stringify(systemUsers));
  }, [systemUsers]);

  // System User & Work Permissions Handlers
  const handleAddUser = (newUser: SystemUserAccount) => {
    setSystemUsers((prev) => [newUser, ...prev]);
  };

  const handleUpdateUser = (updatedUser: SystemUserAccount) => {
    setSystemUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
    );
    // If currently logged-in user is updated, immediately sync session & permissions
    if (currentUser && currentUser.id === updatedUser.id) {
      const refreshedUser: AuthUser = {
        ...currentUser,
        name: updatedUser.name,
        role: updatedUser.role,
        roleLabel: updatedUser.roleLabel,
        email: updatedUser.email,
        phone: updatedUser.phone,
        permissions: updatedUser.permissions,
      };
      setCurrentUser(refreshedUser);
      localStorage.setItem('dtc_auth_user', JSON.stringify(refreshedUser));
    }
  };

  const handleDeleteUser = (userId: string) => {
    setSystemUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleResetUserPassword = (userId: string, newPass: string) => {
    setSystemUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, password: newPass } : u))
    );
  };

  // Handle Login authentication
  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    setCurrentRole(user.role);
    localStorage.setItem('dtc_auth_user', JSON.stringify(user));
    localStorage.setItem('dtc_role', user.role);

    if (user.role === 'student') {
      setActiveTab('portal');
      setPortalTargetRollNo(user.rollNo);
    } else {
      if (activeTab === 'portal') {
        setActiveTab('dashboard');
      }
    }
  };

  // Handle Logout / Switch
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('dtc_auth_user');
    setPortalTargetRollNo(undefined);
  };

  // When role is changed to student, automatically switch to portal tab
  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    if (role === 'student') {
      setActiveTab('portal');
    } else if (activeTab === 'portal') {
      setActiveTab('dashboard');
    }
  };

  // If not logged in, show full Role Login Portal
  if (!currentUser) {
    return (
      <Login
        settings={settings}
        students={students}
        systemUsers={systemUsers}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // Pending Approvals Count (Combines tuition installments and extra fees)
  const pendingApprovalsCount =
    payments.filter((p) => p.approvalStatus === 'PENDING_APPROVAL').length +
    extraFeePayments.filter((x) => x.approvalStatus === 'PENDING_APPROVAL').length;

  // Fee collection handler
  const handlePaymentRecorded = (newPayment: FeePayment) => {
    // Save last voucher number and date for sequential continuity
    saveLastReceiptVoucherInfo(newPayment.receiptNo, newPayment.date);

    const preparedPayment: FeePayment = {
      ...newPayment,
      collectedByStaffId: currentUser?.id || newPayment.collectedByStaffId,
      collectedByStaffName:
        currentUser?.role === 'staff'
          ? `${currentUser.name} (Counter)`
          : newPayment.collectedByStaffName,
    };

    // Add payment
    setPayments((prev) => [preparedPayment, ...prev]);

    // Update student paid and pending amounts & installment status
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === newPayment.studentId) {
          const newPaid = s.paidAmount + newPayment.amount;
          const newPending = Math.max(0, s.netPayableFee - newPaid);

          // Update installment statuses
          const updatedInstallments = s.installments.map((inst) => {
            if (newPayment.installmentNos.includes(inst.installmentNo)) {
              return {
                ...inst,
                status: 'paid' as const,
                paidDate: newPayment.date,
                receiptId: newPayment.receiptNo,
              };
            }
            return inst;
          });

          return {
            ...s,
            paidAmount: newPaid,
            pendingAmount: newPending,
            installments: updatedInstallments,
          };
        }
        return s;
      })
    );

    // If payment was recorded directly by Admin, immediately post to Income ledger
    if (preparedPayment.approvalStatus === 'APPROVED') {
      const newIncomeItem: IncomeExpenseItem = {
        id: `ie-fee-${Date.now()}`,
        type: 'INCOME',
        category: 'Course Fee Collection',
        amount: preparedPayment.amount,
        date: preparedPayment.date,
        paymentMode: preparedPayment.paymentMode,
        referenceId: preparedPayment.receiptNo,
        title: `Fee Collection - ${preparedPayment.studentName} (${preparedPayment.courseName})`,
        recordedBy: preparedPayment.collectedByStaffName,
        approvedStatus: 'APPROVED',
      };
      setIncomeExpenseItems((prev) => [newIncomeItem, ...prev]);
    }

    setShowCollectModal(false);
    setCollectPreselectedStudentId(undefined);
    // Show newly created receipt
    setViewReceiptPayment(preparedPayment);
  };

  // Admin Approve payment - strictly restricted to Admin (Staff have NO right)
  const handleApprovePayment = (paymentId: string) => {
    if (currentRole !== 'admin') {
      alert('Security Restriction: Staff have NO right to approve fees. Only Institute Admin / Director can approve collections.');
      return;
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    let approvedTarget: FeePayment | undefined;

    setPayments((prev) =>
      prev.map((p) => {
        if (p.id === paymentId) {
          approvedTarget = {
            ...p,
            approvalStatus: 'APPROVED',
            approvedByAdminId: currentUser?.id || 'admin-01',
            approvedByAdminName: currentUser?.name || `${settings.directorName} (Director)`,
            approvalDate: `${dateStr} ${timeStr}`,
          };
          return approvedTarget;
        }
        return p;
      })
    );

    // Add to approved income ledger
    if (approvedTarget) {
      const newIncomeItem: IncomeExpenseItem = {
        id: `ie-fee-approved-${Date.now()}`,
        type: 'INCOME',
        category: 'Course Fee Collection',
        amount: (approvedTarget as FeePayment).amount,
        date: (approvedTarget as FeePayment).date,
        paymentMode: (approvedTarget as FeePayment).paymentMode,
        referenceId: (approvedTarget as FeePayment).receiptNo,
        title: `Fee Collection (Admin Approved) - ${(approvedTarget as FeePayment).studentName}`,
        recordedBy: (approvedTarget as FeePayment).collectedByStaffName,
        approvedStatus: 'APPROVED',
      };
      setIncomeExpenseItems((prev) => [newIncomeItem, ...prev]);
    }
  };

  // Admin Batch Approve - strictly restricted to Admin
  const handleBatchApprove = (paymentIds: string[]) => {
    if (currentRole !== 'admin') {
      alert('Security Restriction: Staff have NO right to approve fees. Only Institute Admin / Director can approve collections.');
      return;
    }
    paymentIds.forEach((id) => handleApprovePayment(id));
  };

  // Admin Reject payment - strictly restricted to Admin
  const handleRejectPayment = (paymentId: string, reason: string) => {
    if (currentRole !== 'admin') {
      alert('Security Restriction: Staff have NO right to reject or approve fees. Only Institute Admin / Director can audit collections.');
      return;
    }

    setPayments((prev) =>
      prev.map((p) => {
        if (p.id === paymentId) {
          // Revert student's paid fee
          setStudents((stuPrev) =>
            stuPrev.map((s) => {
              if (s.id === p.studentId) {
                const restoredPaid = Math.max(0, s.paidAmount - p.amount);
                const restoredPending = s.netPayableFee - restoredPaid;
                return {
                  ...s,
                  paidAmount: restoredPaid,
                  pendingAmount: restoredPending,
                };
              }
              return s;
            })
          );

          return {
            ...p,
            approvalStatus: 'REJECTED',
            rejectionReason: reason,
            approvedByAdminId: currentUser?.id || 'admin-01',
            approvedByAdminName: currentUser?.name || `${settings.directorName} (Director)`,
          };
        }
        return p;
      })
    );
  };

  // Add Student
  const handleAddStudent = (newStudent: Student) => {
    setStudents((prev) => [newStudent, ...prev]);
  };

  // Import Students
  const handleImportStudents = (newStudents: Student[]) => {
    setStudents((prev) => [...newStudents, ...prev]);
  };

  // Biometric punch added
  const handleAddPunchRecord = (record: BiometricAttendanceRecord) => {
    setAttendanceRecords((prev) => [record, ...prev]);
  };

  // Biometric device synced
  const handleSyncDevice = (deviceId: string) => {
    setDevices((prev) =>
      prev.map((d) => {
        if (d.id === deviceId) {
          return {
            ...d,
            lastSyncTime: 'Just now (Synced)',
            totalLogsToday: d.totalLogsToday + Math.floor(Math.random() * 3) + 1,
          };
        }
        return d;
      })
    );
  };

  // Import biometric punches
  const handleImportPunches = (newRecords: BiometricAttendanceRecord[]) => {
    setAttendanceRecords((prev) => [...newRecords, ...prev]);
  };

  // Add income / expense item
  const handleAddIncomeExpenseItem = (newItem: IncomeExpenseItem) => {
    setIncomeExpenseItems((prev) => [newItem, ...prev]);
  };

  // Admin Approve income/expense item - strictly restricted to Admin
  const handleApproveIncomeExpense = (itemId: string) => {
    if (currentRole !== 'admin') {
      alert('Security Restriction: Staff have NO right to approve financial vouchers. Only Institute Admin / Director can approve income and expenses.');
      return;
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    setIncomeExpenseItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              approvedStatus: 'APPROVED',
              approvedByAdminId: currentUser?.id || 'admin-01',
              approvedByAdminName: currentUser?.name || `${settings.directorName} (Director)`,
              approvalDate: `${dateStr} ${timeStr}`,
            }
          : item
      )
    );
  };

  // Admin Reject income/expense item - strictly restricted to Admin
  const handleRejectIncomeExpense = (itemId: string) => {
    if (currentRole !== 'admin') {
      alert('Security Restriction: Staff have NO right to reject or approve financial vouchers. Only Institute Admin / Director can audit.');
      return;
    }

    setIncomeExpenseItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              approvedStatus: 'REJECTED',
              approvedByAdminId: currentUser?.id || 'admin-01',
              approvedByAdminName: currentUser?.name || `${settings.directorName} (Director)`,
            }
          : item
      )
    );
  };

  // Admin Batch Approve income/expense items
  const handleBatchApproveIncomeExpense = (itemIds: string[]) => {
    if (currentRole !== 'admin') return;
    itemIds.forEach((id) => handleApproveIncomeExpense(id));
  };

  // Admin Edit / Update income/expense item
  const handleUpdateIncomeExpenseItem = (updatedItem: IncomeExpenseItem) => {
    if (currentRole !== 'admin') {
      alert('Security Restriction: Only Institute Admin / Director has authority to edit income and expense vouchers.');
      return;
    }
    setIncomeExpenseItems((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );
  };

  // Admin Delete income/expense item
  const handleDeleteIncomeExpenseItem = (itemId: string) => {
    if (currentRole !== 'admin') {
      alert('Security Restriction: Only Institute Admin / Director has authority to delete income and expense vouchers.');
      return;
    }
    setIncomeExpenseItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  // Admin Batch Delete income/expense items
  const handleBatchDeleteIncomeExpense = (itemIds: string[]) => {
    if (currentRole !== 'admin') return;
    setIncomeExpenseItems((prev) => prev.filter((item) => !itemIds.includes(item.id)));
  };

  // Course Management CRUD & Restore Functions
  const handleAddCourse = (newCourse: Course) => {
    if (currentRole !== 'admin') {
      alert('Security Restriction: Only Institute Admin / Director has authority to add new courses.');
      return;
    }
    // If course with matching code was in deletedCourses, remove it from recycle bin
    setDeletedCourses((prev) =>
      prev.filter((c) => c.code.toUpperCase() !== newCourse.code.toUpperCase() && c.id !== newCourse.id)
    );
    setCourses((prev) => [...prev, newCourse]);
  };

  const handleUpdateCourse = (updatedCourse: Course) => {
    if (currentRole !== 'admin') {
      alert('Security Restriction: Only Institute Admin / Director has authority to modify courses.');
      return;
    }
    setCourses((prev) =>
      prev.map((c) => (c.id === updatedCourse.id ? updatedCourse : c))
    );
  };

  const handleDeleteCourse = (courseId: string) => {
    if (currentRole !== 'admin') {
      alert('Security Restriction: Only Institute Admin / Director has authority to delete courses.');
      return;
    }
    const target = courses.find((c) => c.id === courseId);
    if (!target) return;

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const deletedItem: Course = {
      ...target,
      deletedAt: dateStr,
      deletedBy: currentUser?.name || `${settings.directorName} (Director)`,
    };

    setDeletedCourses((prev) => [deletedItem, ...prev.filter((c) => c.id !== courseId)]);
    setCourses((prev) => prev.filter((c) => c.id !== courseId));
  };

  const handleRestoreCourse = (courseId: string) => {
    if (currentRole !== 'admin') {
      alert('Security Restriction: Only Institute Admin / Director has authority to restore deleted courses.');
      return;
    }
    const target = deletedCourses.find((c) => c.id === courseId);
    if (!target) return;

    const { deletedAt, deletedBy, ...cleanCourse } = target;

    setDeletedCourses((prev) => prev.filter((c) => c.id !== courseId));
    setCourses((prev) => {
      const exists = prev.some((c) => c.id === cleanCourse.id || c.code.toUpperCase() === cleanCourse.code.toUpperCase());
      if (exists) {
        return prev.map((c) => (c.code.toUpperCase() === cleanCourse.code.toUpperCase() ? cleanCourse : c));
      }
      return [...prev, cleanCourse];
    });
  };

  const handleRestoreDefaultCourses = () => {
    if (currentRole !== 'admin') {
      alert('Security Restriction: Only Institute Admin / Director has authority to restore default courses.');
      return;
    }

    const standardOscit3M: Course = {
      id: 'c-oscit',
      code: 'OSCIT',
      name: 'OSCIT (Odisha State Certificate in Information Technology)',
      duration: '3 Months',
      fee: 4000,
      category: 'Certificate',
      description: 'Computer Fundamentals, Windows 11, MS Word, Excel, PowerPoint, Internet & Typing',
    };

    setCourses((prev) => {
      const currentCodes = new Set(prev.map((c) => c.code.toUpperCase()));
      const toAdd: Course[] = [];

      if (!currentCodes.has('OSCIT')) {
        toAdd.push(standardOscit3M);
      }

      INITIAL_COURSES.forEach((initCourse) => {
        const item = initCourse.code === 'OSCIT' ? standardOscit3M : initCourse;
        if (!currentCodes.has(item.code.toUpperCase()) && !toAdd.some((a) => a.code.toUpperCase() === item.code.toUpperCase())) {
          toAdd.push(item);
        }
      });

      return [...prev, ...toAdd];
    });

    setDeletedCourses((prev) =>
      prev.filter(
        (c) =>
          c.code.toUpperCase() !== 'OSCIT' &&
          !INITIAL_COURSES.some((ic) => ic.code.toUpperCase() === c.code.toUpperCase())
      )
    );
  };

  const handlePurgeDeletedCourse = (courseId: string) => {
    if (currentRole !== 'admin') {
      alert('Security Restriction: Only Institute Admin / Director has authority to permanently purge courses.');
      return;
    }
    setDeletedCourses((prev) => prev.filter((c) => c.id !== courseId));
  };

  const handleClearRecycleBin = () => {
    if (currentRole !== 'admin') {
      alert('Security Restriction: Only Institute Admin / Director has authority to empty the course recycle bin.');
      return;
    }
    setDeletedCourses([]);
  };

  // Handle Course Upgrade (OSCIT -> OSCIT A -> OSCIT A+)
  const handleUpgradeStudent = (updatedStudent: Student, paymentRecord?: FeePayment) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s))
    );

    if (paymentRecord) {
      const preparedPayment: FeePayment = {
        ...paymentRecord,
        collectedByStaffId: currentUser?.id || paymentRecord.collectedByStaffId,
        collectedByStaffName:
          currentUser?.role === 'staff'
            ? `${currentUser.name} (Counter)`
            : paymentRecord.collectedByStaffName,
      };
      setPayments((prev) => [preparedPayment, ...prev]);

      if (preparedPayment.approvalStatus === 'APPROVED') {
        const newIncomeItem: IncomeExpenseItem = {
          id: `ie-fee-${Date.now()}`,
          type: 'INCOME',
          category: 'Course Fee Collection',
          amount: preparedPayment.amount,
          date: preparedPayment.date,
          paymentMode: preparedPayment.paymentMode,
          referenceId: preparedPayment.receiptNo,
          title: `Course Upgrade Fee - ${preparedPayment.studentName} (${preparedPayment.courseName})`,
          recordedBy: preparedPayment.collectedByStaffName,
          approvedStatus: 'APPROVED',
        };
        setIncomeExpenseItems((prev) => [newIncomeItem, ...prev]);
      }
      setViewReceiptPayment(preparedPayment);
    }
  };

  // Student Update Handler (for Academic assessment, certificates, exam status, and admin edits)
  const handleUpdateStudent = (updatedStudent: Student) => {
    if (currentRole !== 'admin') {
      alert('Security Restriction: Only Institute Admin / Director has authority to modify student admission records.');
      return;
    }
    setStudents((prev) =>
      prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s))
    );
  };

  // Student Delete Handler - strictly restricted to Admin
  const handleDeleteStudent = (studentId: string) => {
    if (currentRole !== 'admin') {
      alert('Security Restriction: Only Institute Admin / Director has authority to delete student admission records.');
      return;
    }
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
  };

  // Admin Edit / Update Fee Payment - strictly restricted to Admin
  const handleUpdatePayment = (updatedPayment: FeePayment) => {
    if (currentRole !== 'admin') {
      alert('Security Restriction: Only Institute Admin / Director has authority to edit fee collection records.');
      return;
    }

    const previousPayment = payments.find((p) => p.id === updatedPayment.id);
    const prevAmount = previousPayment?.amount || 0;
    const diff = updatedPayment.amount - prevAmount;

    setPayments((prev) =>
      prev.map((p) => (p.id === updatedPayment.id ? updatedPayment : p))
    );

    // Adjust student's paidAmount and pendingAmount if amount changed
    if (diff !== 0) {
      setStudents((stuPrev) =>
        stuPrev.map((s) => {
          if (s.id === updatedPayment.studentId) {
            const newPaid = Math.max(0, s.paidAmount + diff);
            const newPending = Math.max(0, s.netPayableFee - newPaid);
            return {
              ...s,
              paidAmount: newPaid,
              pendingAmount: newPending,
            };
          }
          return s;
        })
      );
    }

    // Also update matching income expense entry if exists
    setIncomeExpenseItems((iePrev) =>
      iePrev.map((item) => {
        if (item.referenceId === updatedPayment.receiptNo) {
          return {
            ...item,
            amount: updatedPayment.amount,
            date: updatedPayment.date,
            paymentMode: updatedPayment.paymentMode,
            recordedBy: updatedPayment.collectedByStaffName,
            approvedStatus: updatedPayment.approvalStatus,
          };
        }
        return item;
      })
    );
  };

  // Admin Delete Fee Payment - strictly restricted to Admin
  const handleDeletePayment = (paymentId: string) => {
    if (currentRole !== 'admin') {
      alert('Security Restriction: Only Institute Admin / Director has authority to delete fee collection records.');
      return;
    }

    const targetPayment = payments.find((p) => p.id === paymentId);
    if (!targetPayment) return;

    // Deduct paid amount from student and restore pending fee
    setStudents((stuPrev) =>
      stuPrev.map((s) => {
        if (s.id === targetPayment.studentId) {
          const restoredPaid = Math.max(0, s.paidAmount - targetPayment.amount);
          const restoredPending = Math.max(0, s.netPayableFee - restoredPaid);
          return {
            ...s,
            paidAmount: restoredPaid,
            pendingAmount: restoredPending,
          };
        }
        return s;
      })
    );

    // Remove payment from list
    setPayments((prev) => prev.filter((p) => p.id !== paymentId));

    // Remove associated income ledger item
    setIncomeExpenseItems((iePrev) =>
      iePrev.filter((item) => item.referenceId !== targetPayment.receiptNo)
    );
  };

  // Admin Edit / Update Extra Fee Payment - strictly restricted to Admin
  const handleUpdateExtraFeePayment = (updatedPayment: ExtraFeePayment) => {
    if (currentRole !== 'admin') {
      alert('Security Restriction: Only Institute Admin / Director has authority to edit extra fee collection records.');
      return;
    }
    setExtraFeePayments((prev) =>
      prev.map((p) => (p.id === updatedPayment.id ? updatedPayment : p))
    );

    setIncomeExpenseItems((iePrev) =>
      iePrev.map((item) => {
        if (item.referenceId === updatedPayment.receiptNo) {
          return {
            ...item,
            amount: updatedPayment.amount,
            date: updatedPayment.date,
            paymentMode: updatedPayment.paymentMode,
            recordedBy: updatedPayment.collectedByStaffName,
            approvedStatus: updatedPayment.approvalStatus,
          };
        }
        return item;
      })
    );
  };

  // Admin Delete Extra Fee Payment - strictly restricted to Admin
  const handleDeleteExtraFeePayment = (extraFeeId: string) => {
    if (currentRole !== 'admin') {
      alert('Security Restriction: Only Institute Admin / Director has authority to delete extra fee collection records.');
      return;
    }

    const target = extraFeePayments.find((p) => p.id === extraFeeId);
    if (!target) return;

    setExtraFeePayments((prev) => prev.filter((p) => p.id !== extraFeeId));

    setIncomeExpenseItems((iePrev) =>
      iePrev.filter((item) => item.referenceId !== target.receiptNo)
    );
  };

  // Handle Recording Extra Fees (Form Fillup Fees, Annual Day Fees)
  const handleRecordExtraFeePayment = (newPayment: ExtraFeePayment) => {
    const isStaff = (currentUser?.role || currentRole) === 'staff';
    const initialStatus: ApprovalStatus = isStaff ? 'PENDING_APPROVAL' : 'APPROVED';

    const preparedPayment: ExtraFeePayment = {
      ...newPayment,
      approvalStatus: initialStatus,
      collectedByStaffId: currentUser?.id || newPayment.collectedByStaffId,
      collectedByStaffName: isStaff
        ? `${currentUser?.name || 'Staff'} (Counter)`
        : newPayment.collectedByStaffName,
      approvedByAdminId: !isStaff ? (currentUser?.id || 'admin-01') : undefined,
      approvedByAdminName: !isStaff ? (currentUser?.name || `${settings.directorName} (Director)`) : undefined,
      approvalDate: !isStaff ? `${newPayment.date} ${newPayment.time || ''}` : undefined,
    };

    setExtraFeePayments((prev) => [preparedPayment, ...prev]);

    // If Admin recorded directly, immediately update student record for Form Fillup
    if (!isStaff && (newPayment.feeType === 'FORM_FILLUP' || newPayment.feeCategory === 'FORM_FILLUP')) {
      setStudents((prev) =>
        prev.map((s) => {
          if (s.id === newPayment.studentId || s.rollNo === newPayment.studentRollNo) {
            return {
              ...s,
              formFillupRequired: false,
              formFillupPaid: true,
              formFillupFeeAmount: newPayment.amount,
              formFillupReceiptNo: newPayment.receiptNo,
              academicStatus: 'COURSE_ENDED',
            };
          }
          return s;
        })
      );
    }

    // Automatically record as institute income (tagged with approvalStatus)
    const newIncomeItem: IncomeExpenseItem = {
      id: `ie-extra-${Date.now()}`,
      type: 'INCOME',
      category:
        newPayment.feeType === 'FORM_FILLUP' || newPayment.feeCategory === 'FORM_FILLUP'
          ? 'Exam Form Fillup Fees'
          : newPayment.feeCategory === 'ANNUAL_DAY' || newPayment.feeType === 'ANNUAL_DAY'
          ? 'Annual Day & Event Registration'
          : 'Auxiliary & Event Fees',
      amount: newPayment.amount,
      date: newPayment.date,
      paymentMode: newPayment.paymentMode,
      referenceId: newPayment.receiptNo,
      title: `${newPayment.feeTitle || newPayment.feeTypeName} - ${newPayment.studentName} (${newPayment.studentRollNo})`,
      recordedBy: preparedPayment.collectedByStaffName,
      approvedStatus: initialStatus,
    };
    setIncomeExpenseItems((prev) => [newIncomeItem, ...prev]);
  };

  // Admin Approve Extra Fee Payment - strictly restricted to Admin
  const handleApproveExtraFee = (extraFeeId: string) => {
    if (currentRole !== 'admin') {
      alert('Security Restriction: Staff have NO right to approve extra fees. Only Institute Admin / Director can approve vouchers.');
      return;
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    let approvedTarget: ExtraFeePayment | undefined;

    setExtraFeePayments((prev) =>
      prev.map((p) => {
        if (p.id === extraFeeId) {
          approvedTarget = {
            ...p,
            approvalStatus: 'APPROVED',
            approvedByAdminId: currentUser?.id || 'admin-01',
            approvedByAdminName: currentUser?.name || `${settings.directorName} (Director)`,
            approvalDate: `${dateStr} ${timeStr}`,
          };
          return approvedTarget;
        }
        return p;
      })
    );

    if (approvedTarget) {
      const target = approvedTarget as ExtraFeePayment;
      // If Form Fillup, update student status so they are cleared for re-attempt
      if (target.feeCategory === 'FORM_FILLUP' || target.feeType === 'FORM_FILLUP') {
        setStudents((stuPrev) =>
          stuPrev.map((s) => {
            if (s.id === target.studentId || s.rollNo === target.studentRollNo) {
              return {
                ...s,
                formFillupRequired: false,
                formFillupPaid: true,
                formFillupFeeAmount: target.amount,
                formFillupReceiptNo: target.receiptNo,
                academicStatus: 'COURSE_ENDED',
              };
            }
            return s;
          })
        );
      }

      // Record in verified income ledger
      const newIncomeItem: IncomeExpenseItem = {
        id: `ie-extra-approved-${Date.now()}`,
        type: 'INCOME',
        category:
          target.feeType === 'FORM_FILLUP' || target.feeCategory === 'FORM_FILLUP'
            ? 'Exam Form Fillup Fees'
            : target.feeCategory === 'ANNUAL_DAY' || target.feeType === 'ANNUAL_DAY'
            ? 'Annual Day & Event Registration'
            : 'Auxiliary & Event Fees',
        amount: target.amount,
        date: target.date,
        paymentMode: target.paymentMode,
        referenceId: target.receiptNo,
        title: `Extra Fee (Admin Approved) - ${target.feeTitle || target.feeTypeName} - ${target.studentName}`,
        recordedBy: target.collectedByStaffName,
        approvedStatus: 'APPROVED',
        approvedByAdminId: currentUser?.id || 'admin-01',
        approvedByAdminName: currentUser?.name || `${settings.directorName} (Director)`,
        approvalDate: `${dateStr} ${timeStr}`,
      };
      setIncomeExpenseItems((prev) => [newIncomeItem, ...prev]);
    }
  };

  // Admin Reject Extra Fee Payment - strictly restricted to Admin
  const handleRejectExtraFee = (extraFeeId: string, reason: string) => {
    if (currentRole !== 'admin') {
      alert('Security Restriction: Staff have NO right to reject or audit extra fees. Only Institute Admin / Director can audit.');
      return;
    }

    setExtraFeePayments((prev) =>
      prev.map((p) => {
        if (p.id === extraFeeId) {
          // If this was Form Fillup, ensure student formFillupPaid is false
          if (p.feeCategory === 'FORM_FILLUP' || p.feeType === 'FORM_FILLUP') {
            setStudents((stuPrev) =>
              stuPrev.map((s) => {
                if (s.id === p.studentId || s.rollNo === p.studentRollNo) {
                  return {
                    ...s,
                    formFillupPaid: false,
                    formFillupRequired: true,
                  };
                }
                return s;
              })
            );
          }

          return {
            ...p,
            approvalStatus: 'REJECTED',
            rejectionReason: reason,
            approvedByAdminId: currentUser?.id || 'admin-01',
            approvedByAdminName: currentUser?.name || `${settings.directorName} (Director)`,
          };
        }
        return p;
      })
    );
  };

  // Admin Batch Approve Extra Fees
  const handleBatchApproveExtraFees = (extraFeeIds: string[]) => {
    if (currentRole !== 'admin') {
      alert('Security Restriction: Staff have NO right to approve extra fees. Only Institute Admin / Director can approve vouchers.');
      return;
    }
    extraFeeIds.forEach((id) => handleApproveExtraFee(id));
  };

  // Tab definitions
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, role: ['admin', 'staff'] },
    {
      id: 'fee-collection',
      label: 'Fees Collection Desk',
      icon: CreditCard,
      role: ['admin', 'staff'],
    },
    {
      id: 'approvals',
      label: currentRole === 'staff' ? 'Collection Status' : 'Fee Approvals',
      icon: ShieldCheck,
      badge: pendingApprovalsCount,
      role: ['admin', 'staff'],
    },
    { id: 'students', label: 'Students & Admissions', icon: Users, role: ['admin', 'staff'] },
    {
      id: 'courses',
      label: 'Course Catalog & Fees',
      icon: BookOpen,
      role: ['admin', 'staff'],
    },
    {
      id: 'extra-fees',
      label: 'Extra Fees (Form Fillup & Annual Day)',
      icon: Receipt,
      role: ['admin', 'staff'],
    },
    { id: 'biometric', label: 'Biometric Attendance', icon: Fingerprint, role: ['admin', 'staff'] },
    { id: 'finances', label: 'Income & Expenses', icon: TrendingUp, role: ['admin', 'staff'] },
    {
      id: 'permissions',
      label: 'User & Work Permissions',
      icon: KeyRound,
      role: ['admin'],
    },
    {
      id: 'portal',
      label: currentRole === 'student' ? 'My Fee Ledger' : 'Parent & Student Portal',
      icon: GraduationCap,
      role: ['admin', 'staff', 'student'],
    },
  ];

  // Filter tabs based on role and specific staff permissions if defined
  const visibleTabs = tabs.filter((t) => {
    if (!t.role.includes(currentRole)) return false;

    // Granular permission checks for staff users
    if (currentRole === 'staff' && currentUser?.permissions) {
      if (t.id === 'fee-collection' && currentUser.permissions.canCollectFees === false) return false;
      if (t.id === 'approvals' && currentUser.permissions.canViewApprovals === false) return false;
      if (t.id === 'students' && currentUser.permissions.canViewStudents === false) return false;
      if (t.id === 'courses' && currentUser.permissions.canViewCourses === false) return false;
      if (t.id === 'extra-fees' && currentUser.permissions.canViewExtraFees === false) return false;
      if (t.id === 'biometric' && currentUser.permissions.canViewBiometric === false) return false;
      if (t.id === 'finances' && currentUser.permissions.canViewFinances === false) return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 font-sans">
      {/* Global Header */}
      <Header
        currentRole={currentRole}
        onChangeRole={handleRoleChange}
        pendingApprovalsCount={pendingApprovalsCount}
        settings={settings}
        onOpenApprovals={() => setActiveTab('approvals')}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenParentPortal={() => {
          handleRoleChange('student');
        }}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenCourseManager={() => setActiveTab('courses')}
        onOpenPermissions={() => setActiveTab('permissions')}
      />

      {/* Main Navigation Tab Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-xs no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between overflow-x-auto no-scrollbar py-2">
            <nav className="flex space-x-1.5 min-w-max">
              {visibleTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span
                        className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-white text-indigo-900'
                            : 'bg-amber-500 text-slate-950 animate-pulse'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {currentRole !== 'student' && (
              <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-slate-200">
                <button
                  onClick={() => {
                    setCollectPreselectedStudentId(undefined);
                    setShowCollectModal(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5"
                >
                  <Banknote className="w-4 h-4" />
                  Collect Fee
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            students={students}
            payments={payments}
            extraFeePayments={extraFeePayments}
            attendanceRecords={attendanceRecords}
            incomeExpenseItems={incomeExpenseItems}
            settings={settings}
            currentRole={currentRole}
            onOpenCollectModal={() => {
              setCollectPreselectedStudentId(undefined);
              setShowCollectModal(true);
            }}
            onOpenApprovalsTab={() => setActiveTab('approvals')}
            onOpenStudentsTab={() => setActiveTab('students')}
            onOpenBiometricTab={() => setActiveTab('biometric')}
            onOpenCoursesTab={() => setActiveTab('courses')}
            onOpenFinancesTab={() => setActiveTab('finances')}
            onOpenPermissionsTab={() => setActiveTab('permissions')}
            onApprovePayment={handleApprovePayment}
          />
        )}

        {activeTab === 'fee-collection' && (
          <FeeCollectionPage
            students={students}
            courses={courses}
            coupons={coupons}
            settings={settings}
            currentRole={currentRole}
            currentStaffName={currentUser?.name}
            payments={payments}
            onCollectPayment={(payment) => {
              handlePaymentRecorded(payment);
            }}
            onUpgradeStudent={handleUpgradeStudent}
            onOpenReceiptModal={(payment) => setViewReceiptPayment(payment)}
          />
        )}

        {activeTab === 'approvals' && (
          <FeeApprovals
            payments={payments}
            extraFeePayments={extraFeePayments}
            students={students}
            settings={settings}
            onApprovePayment={handleApprovePayment}
            onRejectPayment={handleRejectPayment}
            onBatchApprove={handleBatchApprove}
            onApproveExtraFee={handleApproveExtraFee}
            onRejectExtraFee={handleRejectExtraFee}
            onBatchApproveExtraFees={handleBatchApproveExtraFees}
            onUpdatePayment={handleUpdatePayment}
            onDeletePayment={handleDeletePayment}
            onUpdateExtraFeePayment={handleUpdateExtraFeePayment}
            onDeleteExtraFeePayment={handleDeleteExtraFeePayment}
            currentRole={currentRole}
          />
        )}

        {activeTab === 'students' && (
          <StudentManager
            students={students}
            courses={courses}
            settings={settings}
            currentRole={currentRole}
            currentStaffName={currentUser?.name}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
            onImportStudents={handleImportStudents}
            onUpgradeStudent={handleUpgradeStudent}
            onOpenFormFillupFee={(student) => {
              setPreselectedStudentForExtraFee(student);
              setActiveTab('extra-fees');
            }}
            onOpenCollectModal={(id) => {
              setCollectPreselectedStudentId(id);
              setShowCollectModal(true);
            }}
            onSelectStudentProfile={(s) => {
              setPortalTargetRollNo(s.rollNo);
              setActiveTab('portal');
            }}
          />
        )}

        {activeTab === 'courses' && (
          <CourseListPanel
            courses={courses}
            deletedCourses={deletedCourses}
            students={students}
            settings={settings}
            currentRole={currentRole}
            currentStaffName={currentUser?.name}
            onAddCourse={handleAddCourse}
            onUpdateCourse={handleUpdateCourse}
            onDeleteCourse={handleDeleteCourse}
            onRestoreCourse={handleRestoreCourse}
            onRestoreDefaultCourses={handleRestoreDefaultCourses}
            onPurgeDeletedCourse={handlePurgeDeletedCourse}
            onClearRecycleBin={handleClearRecycleBin}
            onSelectStudentProfile={(s) => {
              setPortalTargetRollNo(s.rollNo);
              setActiveTab('portal');
            }}
          />
        )}

        {activeTab === 'extra-fees' && (
          <ExtraFeesManager
            students={students}
            extraFeePayments={extraFeePayments}
            settings={settings}
            currentRole={currentRole}
            currentStaffName={currentUser?.name}
            onRecordPayment={handleRecordExtraFeePayment}
            onApproveExtraFee={handleApproveExtraFee}
            onRejectExtraFee={handleRejectExtraFee}
            onBatchApproveExtraFees={handleBatchApproveExtraFees}
            preselectedStudent={preselectedStudentForExtraFee}
            onClearPreselectedStudent={() => setPreselectedStudentForExtraFee(null)}
          />
        )}

        {activeTab === 'biometric' && (
          <BiometricAttendance
            students={students}
            records={attendanceRecords}
            devices={devices}
            onAddPunchRecord={handleAddPunchRecord}
            onSyncDevice={handleSyncDevice}
            onImportPunches={handleImportPunches}
          />
        )}

        {activeTab === 'finances' && (
          <IncomeExpense
            items={incomeExpenseItems}
            approvedPayments={payments.filter((p) => p.approvalStatus === 'APPROVED')}
            currentRole={currentRole}
            currentStaffName={currentUser?.name}
            onAddItem={handleAddIncomeExpenseItem}
            onUpdateItem={handleUpdateIncomeExpenseItem}
            onDeleteItem={handleDeleteIncomeExpenseItem}
            onApproveItem={handleApproveIncomeExpense}
            onRejectItem={handleRejectIncomeExpense}
            onBatchApproveItems={handleBatchApproveIncomeExpense}
            onBatchDeleteItems={handleBatchDeleteIncomeExpense}
          />
        )}

        {activeTab === 'permissions' && (
          <UserPermissionsManager
            users={systemUsers}
            settings={settings}
            currentRole={currentRole}
            currentUser={currentUser}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            onResetUserPassword={handleResetUserPassword}
          />
        )}

        {activeTab === 'portal' && (
          <StudentParentPortal
            students={students}
            payments={payments}
            extraFeePayments={extraFeePayments}
            attendanceRecords={attendanceRecords}
            settings={settings}
            defaultRollNo={portalTargetRollNo}
            currentUser={currentUser}
            currentRole={currentRole}
          />
        )}
      </main>

      {/* Collect Fee Modal */}
      {showCollectModal && (
        <FeeCollectionModal
          students={students}
          settings={settings}
          currentRole={currentRole}
          payments={payments}
          preselectedStudentId={collectPreselectedStudentId}
          onClose={() => setShowCollectModal(false)}
          onPaymentRecorded={handlePaymentRecorded}
        />
      )}

      {/* Course Manager Modal */}
      {showCourseManagerModal && (
        <CourseManagerModal
          courses={courses}
          currentRole={currentRole}
          onClose={() => setShowCourseManagerModal(false)}
          onAddCourse={handleAddCourse}
          onUpdateCourse={handleUpdateCourse}
          onDeleteCourse={handleDeleteCourse}
        />
      )}

      {/* View Official Receipt Modal */}
      {viewReceiptPayment && (
        <ReceiptModal
          payment={viewReceiptPayment}
          student={students.find((s) => s.id === viewReceiptPayment.studentId)}
          settings={settings}
          onClose={() => setViewReceiptPayment(null)}
          onApprove={(id) => {
            handleApprovePayment(id);
            setViewReceiptPayment(null);
          }}
          isAdmin={currentRole === 'admin'}
        />
      )}

      {/* Institute Settings Modal */}
      {showSettingsModal && (
        <InstituteSettingsModal
          settings={settings}
          onSave={setSettings}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>{settings.name}</strong> • {settings.regNo} • {settings.isoCertified}
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            Biometric Hardware Gateway • Two-Tier Admin Fee Audit Active
          </div>
        </div>
      </footer>
    </div>
  );
}
