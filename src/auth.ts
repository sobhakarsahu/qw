import { AuthUser, Student, UserRole, SystemUserAccount } from './types';
import { ALL_ADMIN_PERMISSIONS, DEFAULT_STAFF_PERMISSIONS, DEFAULT_STUDENT_PERMISSIONS } from './utils/permissions';

export interface SystemCredentialInfo {
  role: UserRole;
  roleLabel: string;
  loginId: string;
  password: string;
  name: string;
  designation: string;
  description: string;
  permissions: string[];
}

export const PRESET_CREDENTIALS: SystemCredentialInfo[] = [
  {
    role: 'admin',
    roleLabel: 'Institute Director / Super Admin',
    loginId: 'admin@digitech.edu',
    password: 'admin@123',
    name: 'Dr. Rajesh Verma',
    designation: 'Director & Chief Administrator',
    description: 'Full administrative rights with exclusive authority to audit & approve fees, configure UPI, and access financial statements.',
    permissions: [
      'Exclusive Fee Approval & Rejection Authority',
      'Batch Approval & Ledger Posting',
      'Institute Banking & UPI VPA Management',
      'Full Student Admission & Fee Ledger Control',
      'Operating Income & Expense Financial Management',
      'Granular User & Work Permissions Configuration',
    ],
  },
  {
    role: 'staff',
    roleLabel: 'Accounts & Front Desk Staff',
    loginId: 'staff@digitech.edu',
    password: 'staff@123',
    name: 'Sunil Sharma',
    designation: 'Accounts Counter & Admissions Desk',
    description: 'Front-desk operations. Can collect fees, register students, and operate biometric station. STRICTLY RESTRICTED: No right to approve fees unless granted.',
    permissions: [
      'Collect Student Fees & Generate Provisional Receipts',
      'New Student Admission & Installment Scheduling',
      'Biometric Terminal Punch Station & Attendance Sync',
      'Send WhatsApp Overdue Fee Reminders',
      'Record Daily Center Operating Expenses',
    ],
  },
  {
    role: 'student',
    roleLabel: 'Student & Parent Portal',
    loginId: 'DTC-2026-101',
    password: 'student@123',
    name: 'Rahul Sharma',
    designation: 'Student (Roll: DTC-2026-101)',
    description: 'Personal student fee ledger, installment due schedules, official receipt downloads, and biometric attendance records.',
    permissions: [
      'View Personal Course Fee & Installment Schedule',
      'Download Official Payment Receipts & Vouchers',
      'Scan Institute UPI QR to Clear Fees Online',
      'Inspect Biometric Punch Logs & Attendance Ratio',
      'Contact Center Accounts via 1-Click WhatsApp',
    ],
  },
];

export function authenticateUser(
  inputLoginId: string,
  inputPass: string,
  students: Student[],
  systemUsers?: SystemUserAccount[]
): { success: boolean; user?: AuthUser; message?: string } {
  const cleanId = inputLoginId.trim().toLowerCase();
  const cleanPass = inputPass.trim();

  if (!cleanId || !cleanPass) {
    return { success: false, message: 'Please enter both Login ID and Password.' };
  }

  // 1. Check Configured System Users (if available)
  if (systemUsers && systemUsers.length > 0) {
    const matchedSystemUser = systemUsers.find(
      (u) =>
        u.loginId.toLowerCase() === cleanId ||
        u.email.toLowerCase() === cleanId ||
        u.id.toLowerCase() === cleanId
    );

    if (matchedSystemUser) {
      if (matchedSystemUser.status === 'INACTIVE' || matchedSystemUser.status === 'SUSPENDED') {
        return {
          success: false,
          message: `This account is currently ${matchedSystemUser.status.toLowerCase()}. Please contact Institute Administrator.`,
        };
      }

      const expectedPass = matchedSystemUser.password || (matchedSystemUser.role === 'admin' ? 'admin@123' : 'staff@123');
      if (cleanPass === expectedPass) {
        return {
          success: true,
          user: {
            id: matchedSystemUser.id,
            loginId: matchedSystemUser.loginId,
            name: matchedSystemUser.name,
            role: matchedSystemUser.role,
            designation: matchedSystemUser.designation,
            email: matchedSystemUser.email,
            phone: matchedSystemUser.phone,
            permissions: matchedSystemUser.permissions,
          },
        };
      } else {
        return {
          success: false,
          message: `Incorrect password for ${matchedSystemUser.name}.`,
        };
      }
    }
  }

  // 2. Fallback check for Default Admin Credentials
  if (
    (cleanId === 'admin@digitech.edu' || cleanId === 'admin' || cleanId === 'director') &&
    cleanPass === 'admin@123'
  ) {
    return {
      success: true,
      user: {
        id: 'user-admin-01',
        loginId: 'admin@digitech.edu',
        name: 'Dr. Rajesh Verma',
        role: 'admin',
        designation: 'Director & Chief Administrator',
        email: 'director@digitechacademy.edu',
        phone: '+91 98765 43210',
        permissions: ALL_ADMIN_PERMISSIONS,
      },
    };
  }

  // 3. Fallback check for Default Staff Credentials
  if (
    (cleanId === 'staff@digitech.edu' || cleanId === 'staff' || cleanId === 'accountant') &&
    cleanPass === 'staff@123'
  ) {
    return {
      success: true,
      user: {
        id: 'user-staff-01',
        loginId: 'staff@digitech.edu',
        name: 'Sunil Sharma',
        role: 'staff',
        designation: 'Senior Accounts Officer',
        email: 'accounts@digitechacademy.edu',
        phone: '+91 98765 43211',
        permissions: DEFAULT_STAFF_PERMISSIONS,
      },
    };
  }

  // 4. Check Student Credentials (matches rollNo or email or phone or id)
  const matchedStudent = students.find(
    (s) =>
      s.rollNo.toLowerCase() === cleanId ||
      s.email.toLowerCase() === cleanId ||
      s.phone.toLowerCase() === cleanId ||
      s.id.toLowerCase() === cleanId
  );

  if (matchedStudent) {
    // Accepts 'student@123' or student's rollNo as default password
    if (cleanPass === 'student@123' || cleanPass === matchedStudent.rollNo || cleanPass === 'password') {
      return {
        success: true,
        user: {
          id: matchedStudent.id,
          loginId: matchedStudent.rollNo,
          name: matchedStudent.name,
          role: 'student',
          designation: `Student • Roll No: ${matchedStudent.rollNo}`,
          email: matchedStudent.email,
          phone: matchedStudent.phone,
          studentId: matchedStudent.id,
          rollNo: matchedStudent.rollNo,
          courseName: matchedStudent.courseName,
          permissions: DEFAULT_STUDENT_PERMISSIONS,
        },
      };
    } else {
      return { success: false, message: 'Incorrect password for student account. Default is "student@123"' };
    }
  }

  // Check if they tried admin/staff with wrong password
  if (cleanId.includes('admin') || cleanId.includes('director')) {
    return { success: false, message: 'Invalid Admin password. Provided default: "admin@123"' };
  }

  if (cleanId.includes('staff') || cleanId.includes('accountant') || cleanId.includes('pooja') || cleanId.includes('amit')) {
    return { success: false, message: 'Invalid Staff password. Provided default: "staff@123"' };
  }

  return {
    success: false,
    message: 'User ID not recognized. Check the system users or credentials provided below.',
  };
}

