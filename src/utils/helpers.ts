import { Course, FeePayment } from '../types';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

const LAST_VOUCHER_NO_KEY = 'dtc_last_receipt_voucher_no';
const LAST_VOUCHER_DATE_KEY = 'dtc_last_receipt_voucher_date';

/**
 * Gets the last saved receipt voucher number and date from localStorage or existing payment records.
 */
export function getLastReceiptVoucherInfo(existingPayments?: FeePayment[]): {
  lastReceiptNo: string;
  lastDate: string;
} {
  let savedNo = '';
  let savedDate = '';

  try {
    savedNo = localStorage.getItem(LAST_VOUCHER_NO_KEY) || '';
    savedDate = localStorage.getItem(LAST_VOUCHER_DATE_KEY) || '';
  } catch {
    // ignore
  }

  // If not in localStorage, find the latest from existing payment records
  if (!savedNo && existingPayments && existingPayments.length > 0) {
    const sorted = [...existingPayments].sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.time || ''}`).getTime();
      const dateB = new Date(`${b.date} ${b.time || ''}`).getTime();
      if (!isNaN(dateA) && !isNaN(dateB) && dateB !== dateA) {
        return dateB - dateA;
      }
      return b.receiptNo.localeCompare(a.receiptNo);
    });
    savedNo = sorted[0]?.receiptNo || '';
    savedDate = sorted[0]?.date || '';
  }

  if (!savedNo) {
    const year = new Date().getFullYear();
    savedNo = `REC-${year}-0246`;
  }
  if (!savedDate) {
    savedDate = new Date().toISOString().split('T')[0];
  }

  return {
    lastReceiptNo: savedNo,
    lastDate: savedDate,
  };
}

/**
 * Saves the last used receipt voucher number and date into localStorage
 */
export function saveLastReceiptVoucherInfo(receiptNo: string, date: string): void {
  try {
    if (receiptNo && receiptNo.trim()) {
      localStorage.setItem(LAST_VOUCHER_NO_KEY, receiptNo.trim());
    }
    if (date && date.trim()) {
      localStorage.setItem(LAST_VOUCHER_DATE_KEY, date.trim());
    }
  } catch {
    // ignore
  }
}

/**
 * Computes the next sequential receipt voucher number from a given base or existing payments.
 * Examples:
 *   "REC-2026-0246" -> "REC-2026-0247"
 *   "VCH-005" -> "VCH-006"
 *   "VR-1099" -> "VR-1100"
 *   "101" -> "102"
 *   "BOOK-A-99" -> "BOOK-A-100"
 */
export function calculateNextReceiptVoucherNumber(
  lastVoucherNo?: string,
  existingPayments?: FeePayment[]
): string {
  let baseNo = lastVoucherNo?.trim();
  if (!baseNo) {
    const info = getLastReceiptVoucherInfo(existingPayments);
    baseNo = info.lastReceiptNo;
  }

  // Match prefix and trailing number (e.g. REC-2026-0246 -> prefix: "REC-2026-", number: "0246")
  const match = baseNo.match(/^(.*?)(\d+)$/);
  if (match) {
    const prefix = match[1];
    const numStr = match[2];
    const parsed = parseInt(numStr, 10);
    const nextNum = parsed + 1;
    const padded = String(nextNum).padStart(numStr.length, '0');
    return `${prefix}${padded}`;
  }

  // If no trailing number, append -0101
  const year = new Date().getFullYear();
  return `REC-${year}-0101`;
}

export function generateReceiptNumber(existingPayments?: FeePayment[]): string {
  return calculateNextReceiptVoucherNumber(undefined, existingPayments);
}

export function generateStudentRollNo(courseCode: string, sequence: number): string {
  const year = new Date().getFullYear();
  const prefix = courseCode.split('-')[0] || 'DTC';
  const padded = String(sequence).padStart(3, '0');
  return `${prefix}-${year}-${padded}`;
}

/**
 * Calculates the next Student ID based on an institute prefix (e.g. SRIIT)
 * Example requested by user: SRIIT0014 -> Next is automatically SRIIT0015
 */
export function calculateNextStudentId(
  existingRollNos: string[],
  prefix = 'SRIIT',
  digits = 4
): string {
  const cleanPrefix = (prefix || 'SRIIT').toUpperCase().trim();
  let maxNum = 0;

  existingRollNos.forEach((roll) => {
    if (!roll) return;
    const cleanRoll = roll.trim().toUpperCase();
    if (cleanRoll.startsWith(cleanPrefix)) {
      const numPart = cleanRoll.slice(cleanPrefix.length);
      const parsed = parseInt(numPart, 10);
      if (!isNaN(parsed) && parsed > maxNum) {
        maxNum = parsed;
      }
    } else {
      // Check if any numbers exist at the end of the roll number
      const match = cleanRoll.match(/(\d+)$/);
      if (match) {
        const parsed = parseInt(match[1], 10);
        if (!isNaN(parsed) && parsed > maxNum) {
          maxNum = parsed;
        }
      }
    }
  });

  // If no previous matching student or highest is below 13, user gave SRIIT0014 as the baseline example
  const nextNum = maxNum > 0 ? maxNum + 1 : 14;
  return `${cleanPrefix}${String(nextNum).padStart(digits, '0')}`;
}

/**
 * 1st installment fees is called "Admission Fees", subsequent are 2nd, 3rd... up to 8th
 */
export function getInstallmentTitle(installmentNo: number): string {
  if (installmentNo === 1) return 'Admission Fees';
  if (installmentNo === 2) return '2nd Installment';
  if (installmentNo === 3) return '3rd Installment';
  return `${installmentNo}th Installment`;
}

/**
 * Extract duration in months from strings like '2 Months', '6 Months', '12 Months'
 */
export function parseCourseDurationMonths(durationStr = '6 Months'): number {
  const match = durationStr.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 6;
}

/**
 * Calculates course completion date based on admission date + duration
 */
export function calculateCourseEndDate(admissionDate: string, durationStr = '6 Months'): string {
  if (!admissionDate) return '';
  try {
    const months = parseCourseDurationMonths(durationStr);
    const date = new Date(admissionDate);
    if (isNaN(date.getTime())) return '';
    date.setMonth(date.getMonth() + months);
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
}

/**
 * Checks if the student's course duration has finished
 */
export function isCourseDurationEnded(admissionOrEndDate?: string, durationStr?: string): boolean {
  if (!admissionOrEndDate) return false;
  try {
    let endDate: Date;
    if (durationStr) {
      const endDateStr = calculateCourseEndDate(admissionOrEndDate, durationStr);
      if (!endDateStr) return false;
      endDate = new Date(endDateStr);
    } else {
      endDate = new Date(admissionOrEndDate);
    }
    if (isNaN(endDate.getTime())) return false;
    const today = new Date();
    return today.getTime() >= endDate.getTime();
  } catch {
    return false;
  }
}

/**
 * Human friendly duration description
 */
export function getCourseDurationStatus(admissionDate?: string, durationStr = '6 Months'): {
  isEnded: boolean;
  endDateStr: string;
  label: string;
} {
  if (!admissionDate) {
    return {
      isEnded: false,
      endDateStr: '',
      label: 'Ongoing',
    };
  }
  const endDateStr = calculateCourseEndDate(admissionDate, durationStr);
  const isEnded = isCourseDurationEnded(admissionDate, durationStr);
  if (isEnded) {
    return {
      isEnded: true,
      endDateStr,
      label: `Course Duration Ended (${formatDate(endDateStr)})`,
    };
  }
  return {
    isEnded: false,
    endDateStr,
    label: `Ongoing (Ends on ${formatDate(endDateStr)})`,
  };
}

export function generateExtraFeeReceiptNumber(category = 'EXTRA'): string {
  const year = new Date().getFullYear();
  const prefix = category === 'FORM_FILLUP' ? 'FF' : category === 'ANNUAL_DAY' ? 'AD' : 'EX';
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${year}-${random}`;
}


export function downloadCSV(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function createWhatsAppURL(phone: string, message: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${targetPhone}?text=${encodedText}`;
}

export function createSmsURL(phone: string, message: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(message);
  return `sms:${cleanPhone}?body=${encodedText}`;
}

export function isTodayBirthday(dob?: string): boolean {
  if (!dob) return false;
  try {
    const parts = dob.split('-');
    if (parts.length !== 3) return false;
    const dobMonth = parseInt(parts[1], 10);
    const dobDay = parseInt(parts[2], 10);

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();

    return dobMonth === currentMonth && dobDay === currentDay;
  } catch {
    return false;
  }
}

export function formatBirthdayGreeting(
  studentName: string,
  instituteName: string,
  directorName = 'Director'
): string {
  return `🎉 *HAPPY BIRTHDAY ${studentName.toUpperCase()}!* 🎂✨\n\nOn this wonderful day, the entire faculty & management of *${instituteName}* and Director *${directorName}* wish you a very Happy Birthday!\n\nMay this year be filled with academic success, great coding milestones, and high-flying career achievements in IT. Keep up your dedication!\n\nBest Wishes & Blessings,\n*${instituteName}*\nAccounts & Academic Team`;
}

/**
 * Determines whether a course is upgradable.
 * Non-upgradable courses include:
 * - Explicit isUpgradable === false
 * - OCOC courses (such as OCOC Tally Prime)
 */
export function isCourseUpgradable(
  course?: Course | null,
  courseNameOrCode?: string
): boolean {
  if (course && course.isUpgradable === false) return false;
  const name = (course?.name || courseNameOrCode || '').toUpperCase();
  const code = (course?.code || '').toUpperCase();
  if (code.includes('OCOC') || name.includes('OCOC')) return false;
  return true;
}

/**
 * Returns OSCIT hierarchy tier level:
 * 1 = OSCIT (3 Months)
 * 2 = OSCIT A (4 Months)
 * 3 = OSCIT A+ (8 Months, Terminal Master Diploma)
 * 0 = Not in OSCIT progression ladder
 */
export function getOscitTierLevel(codeOrName = ''): number {
  const clean = codeOrName.toUpperCase();
  if (
    clean.includes('OSCIT A+') ||
    clean.includes('OSCIT-A+') ||
    clean.includes('OSCIT A PLUS') ||
    clean.includes('APLUS')
  ) {
    return 3;
  }
  if (clean.includes('OSCIT A') || clean.includes('OSCIT-A')) {
    return 2;
  }
  if (clean.includes('OSCIT')) {
    return 1;
  }
  return 0;
}

/**
 * Filters and returns strictly higher eligible upgrade courses.
 * Rules:
 * 1. Non-upgradable courses (e.g. OCOC Tally Prime) have 0 eligible upgrade targets.
 * 2. If student is in OSCIT A+ (Level 3), it is the terminal master level. Lower tiers (OSCIT A, OSCIT) will NEVER appear.
 * 3. If student is in OSCIT A (Level 2), only higher tier OSCIT A+ (Level 3) appears (OSCIT never appears).
 * 4. If student is in OSCIT (Level 1), higher tiers OSCIT A and OSCIT A+ appear.
 * 5. Target course fee must be strictly greater than current course fee.
 * 6. Non-upgradable standalone courses (like OCOC Tally Prime) cannot be upgraded into via general upgrade path.
 */
export function getEligibleUpgradeCourses(
  currentCourseIdentifier: string, // id, code, or name
  courses: Course[]
): Course[] {
  if (!currentCourseIdentifier) return [];

  const current = courses.find(
    (c) =>
      c.id === currentCourseIdentifier ||
      c.code.toUpperCase() === currentCourseIdentifier.toUpperCase() ||
      c.name.toLowerCase() === currentCourseIdentifier.toLowerCase()
  );

  const currentCode = (current?.code || currentCourseIdentifier).toUpperCase();
  const currentName = (current?.name || currentCourseIdentifier).toUpperCase();
  const currentFee = current?.fee || 0;

  // If current course is non-upgradable (like OCOC Tally Prime)
  if (current && current.isUpgradable === false) return [];
  if (currentCode.includes('OCOC') || currentName.includes('OCOC')) return [];

  const currentOscitLevel = getOscitTierLevel(`${currentCode} ${currentName}`);

  return courses.filter((c) => {
    // Cannot upgrade to same course
    if (current && c.id === current.id) return false;
    if (c.code.toUpperCase() === currentCode) return false;

    // Do not upgrade into standalone non-upgradable courses like OCOC
    if (
      c.isUpgradable === false ||
      c.code.toUpperCase().includes('OCOC') ||
      c.name.toUpperCase().includes('OCOC')
    ) {
      return false;
    }

    const targetCode = c.code.toUpperCase();
    const targetName = c.name.toUpperCase();
    const targetOscitLevel = getOscitTierLevel(`${targetCode} ${targetName}`);

    // If current is in OSCIT series:
    if (currentOscitLevel > 0) {
      if (targetOscitLevel > 0) {
        // Target must be strictly higher tier (e.g. 1 -> 2 or 3; 2 -> 3; 3 -> NONE)
        return targetOscitLevel > currentOscitLevel;
      }
    }

    // Must be strictly higher fee
    return (c.fee || 0) > currentFee;
  });
}

