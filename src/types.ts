export type UserRole = 'admin' | 'staff' | 'student';

export interface WorkPermissions {
  // Navigation Modules Access
  canViewDashboard: boolean;
  canViewFeeCollection: boolean;
  canViewApprovals: boolean;
  canViewStudents: boolean;
  canViewCourses: boolean;
  canViewExtraFees: boolean;
  canViewBiometric: boolean;
  canViewFinances: boolean;
  canViewParentPortal: boolean;
  canViewUserPermissions: boolean;

  // Fee Collection & Counter Operations
  canCollectFees: boolean;
  canApplyDiscountAndCoupons: boolean;
  canUpgradeCourse: boolean;
  canCollectExtraFees: boolean;
  canEditPaymentRecords: boolean;
  canDeletePaymentRecords: boolean;
  canPrintReceipts: boolean;

  // Approvals & Sanctions (Admin Governance)
  canApproveFeePayments: boolean;
  canRejectFeePayments: boolean;
  canBatchApprovePayments: boolean;
  canApproveExtraFees: boolean;

  // Student Admissions & Directory
  canAddStudent: boolean;
  canEditStudent: boolean;
  canDeleteStudent: boolean;
  canImportStudentsCSV: boolean;
  canExportStudents: boolean;
  canPrintIDCards: boolean;
  canIssueScorecards: boolean;
  canSendWhatsAppReminders: boolean;

  // Course Management
  canAddCourse: boolean;
  canEditCourse: boolean;
  canDeleteCourse: boolean;
  canRestoreCourses: boolean;

  // Biometric Attendance Station
  canRecordBiometricPunches: boolean;
  canSyncBiometricDevices: boolean;
  canImportBiometricLogs: boolean;

  // Income, Expenses & Financial Statements
  canViewFinancialStatements: boolean;
  canRecordIncomeExpense: boolean;
  canEditIncomeExpense: boolean;
  canApproveIncomeExpense: boolean;
  canDeleteIncomeExpense: boolean;

  // Institute Master & System Settings
  canEditInstituteSettings: boolean;
  canManageUPIandBank: boolean;
  canManageUserPermissions: boolean;
}

export interface SystemUserAccount {
  id: string;
  loginId: string;
  password?: string;
  name: string;
  role: UserRole;
  roleLabel: string;
  designation: string;
  email: string;
  phone: string;
  department?: string;
  avatarColor?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
  lastLoginAt?: string;
  permissions: WorkPermissions;
  notes?: string;
}

export interface AuthUser {
  id: string;
  loginId: string;
  name: string;
  role: UserRole;
  roleLabel?: string;
  designation?: string;
  email?: string;
  phone?: string;
  studentId?: string;
  rollNo?: string;
  courseName?: string;
  permissions?: WorkPermissions;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  duration: string;
  fee: number;
  description: string;
  category: string;
  isUpgradable?: boolean;
  deletedAt?: string;
  deletedBy?: string;
}

export interface InstallmentPlan {
  installmentNo: number;
  installmentTitle?: string; // 'Admission Fees' for installment 1, '2nd Installment', etc.
  amount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  paidDate?: string;
  receiptId?: string;
}

export interface CourseUpgradeRecord {
  id: string;
  date: string;
  fromCourseId: string;
  fromCourseName: string;
  fromCourseFee: number;
  toCourseId: string;
  toCourseName: string;
  toCourseFee: number;
  carriedPaidAmount: number;
  upgradePaymentAmount: number;
  totalReceivedAfter: number;
  newRestAmount: number;
  processedBy: string;
  receiptNo?: string;
  notes?: string;
}

export interface CouponCode {
  code: string;
  discountType: 'flat' | 'percentage';
  discountValue: number;
  description: string;
  minCourseFee?: number;
}

export interface Student {
  id: string;
  rollNo: string;
  biometricId: string;
  name: string;
  fatherName: string;
  motherName?: string;
  dob?: string; // Date of birth (Optional)
  email: string;
  phone: string;
  parentPhone: string;
  courseId: string;
  courseName: string;
  batchTime: string;
  admissionDate: string;
  courseDuration?: string;
  courseEndDate?: string; // Course duration completion date
  academicStatus?: 'IN_PROGRESS' | 'COURSE_ENDED' | 'EXAM_PASSED' | 'EXAM_FAILED_REATTEMPT' | 'CERTIFICATE_COLLECTED';
  examPassedDate?: string;
  certificateNo?: string;
  certificateCollectedDate?: string;
  formFillupRequired?: boolean;
  formFillupReason?: string;
  formFillupPaid?: boolean;
  formFillupReceiptNo?: string;
  totalFee: number;
  discount: number;
  appliedCoupon?: string;
  netPayableFee: number;
  paidAmount: number;
  pendingAmount: number;
  status: 'active' | 'completed' | 'dropped';
  installments: InstallmentPlan[];
  upgradeHistory?: CourseUpgradeRecord[];
  photoUrl?: string;
  address?: string;
}

export type PaymentMode = 'cash' | 'upi' | 'card' | 'cheque' | 'netbanking' | 'bank_transfer';

export type ApprovalStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

export interface FeePayment {
  id: string;
  receiptNo: string;
  studentId: string;
  studentName: string;
  studentRollNo: string;
  courseName: string;
  amount: number;
  paymentMode: PaymentMode;
  transactionRef?: string;
  date: string;
  time: string;
  collectedByStaffId: string;
  collectedByStaffName: string;
  approvalStatus: ApprovalStatus;
  approvedByAdminId?: string;
  approvedByAdminName?: string;
  approvalDate?: string;
  rejectionReason?: string;
  installmentNos: number[];
  remainingBalanceAfter: number;
  remarks?: string;
}

export type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT' | 'HALF_DAY';
export type VerificationType = 'FINGERPRINT' | 'FACE' | 'RFID' | 'MANUAL';

export interface BiometricAttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentRollNo: string;
  biometricId: string;
  date: string; // YYYY-MM-DD
  punchInTime: string; // HH:MM:SS
  punchOutTime?: string;
  status: AttendanceStatus;
  deviceId: string;
  verificationType: VerificationType;
}

export interface BiometricDevice {
  id: string;
  name: string;
  model: string;
  ipAddress: string;
  port: number;
  status: 'ONLINE' | 'OFFLINE' | 'SYNCING';
  lastSyncTime: string;
  totalLogsToday: number;
}

export type TransactionType = 'INCOME' | 'EXPENSE';

export interface IncomeExpenseItem {
  id: string;
  type: TransactionType;
  category: string;
  amount: number;
  date: string;
  paymentMode: PaymentMode;
  referenceId?: string; // fee receipt id or bill voucher no
  title: string;
  description?: string;
  recordedBy: string;
  recordedByRole?: UserRole;
  approvedStatus: ApprovalStatus;
  approvedByAdminId?: string;
  approvedByAdminName?: string;
  approvalDate?: string;
  rejectionReason?: string;
}

export interface InstituteSettings {
  name: string;
  tagline: string;
  regNo: string;
  isoCertified: string;
  address: string;
  city: string;
  phone: string;
  whatsappSupport: string;
  email: string;
  website: string;
  gstNo: string;
  upiId: string;
  bankName: string;
  accountNo: string;
  ifscCode: string;
  directorName: string;
  directorTitle: string;
  studentIdPrefix?: string; // e.g. 'SRIIT'
  studentIdDigits?: number; // e.g. 4 for 0014
  nextStudentIdNumber?: number; // e.g. 15
}

export interface WhatsAppTemplate {
  id: string;
  title: string;
  template: string;
}

export type ExtraFeeCategory = 'FORM_FILLUP' | 'ANNUAL_DAY' | 'EXAM_FEE' | 'CERTIFICATE_FEE' | 'OTHER';

export interface ExtraFeePayment {
  id: string;
  receiptNo: string;
  studentId: string;
  studentName: string;
  studentRollNo: string;
  courseName: string;
  feeCategory?: ExtraFeeCategory;
  feeType: ExtraFeeCategory;
  feeTitle?: string;
  feeTypeName?: string;
  amount: number;
  paymentMode: PaymentMode;
  transactionRef?: string;
  date: string;
  time: string;
  collectedByStaffId: string;
  collectedByStaffName: string;
  academicYear?: string;
  sessionOrEventYear?: string;
  approvalStatus: ApprovalStatus;
  approvedByAdminId?: string;
  approvedByAdminName?: string;
  approvalDate?: string;
  rejectionReason?: string;
  remarks?: string;
}

