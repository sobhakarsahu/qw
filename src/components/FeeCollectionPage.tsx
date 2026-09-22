import React, { useState, useMemo } from 'react';
import {
  Student,
  Course,
  FeePayment,
  InstituteSettings,
  UserRole,
  PaymentMode,
  CouponCode,
} from '../types';
import {
  formatCurrency,
  formatDate,
  generateReceiptNumber,
  calculateNextReceiptVoucherNumber,
  getLastReceiptVoucherInfo,
  saveLastReceiptVoucherInfo,
  createWhatsAppURL,
  isTodayBirthday,
} from '../utils/helpers';
import {
  Receipt,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  Tag,
  CreditCard,
  MessageCircle,
  Cake,
  ArrowRight,
  Sparkles,
  Download,
  Percent,
  Check,
  UserCheck,
  FileText,
  DollarSign,
  ShieldCheck,
  ChevronRight,
  Phone,
  Calendar,
  History,
  Hash,
} from 'lucide-react';
import { CourseUpgradeModal } from './CourseUpgradeModal';
import { BirthdayGreetingModal } from './BirthdayGreetingModal';

interface FeeCollectionPageProps {
  students: Student[];
  courses: Course[];
  coupons: CouponCode[];
  settings: InstituteSettings;
  currentRole: UserRole;
  currentStaffName?: string;
  payments?: FeePayment[];
  onCollectPayment: (payment: FeePayment, updatedStudent: Student) => void;
  onUpgradeStudent: (updatedStudent: Student, paymentRecord?: FeePayment) => void;
  onApplyDiscountToStudent?: (studentId: string, discount: number, couponCode?: string) => void;
  onOpenReceiptModal?: (payment: FeePayment) => void;
}

export const FeeCollectionPage: React.FC<FeeCollectionPageProps> = ({
  students,
  courses,
  coupons,
  settings,
  currentRole,
  currentStaffName = 'Fee Counter Staff',
  payments,
  onCollectPayment,
  onUpgradeStudent,
  onApplyDiscountToStudent,
  onOpenReceiptModal,
}) => {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'due' | 'overdue' | 'paid' | 'oscit'>('due');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [batchFilter, setBatchFilter] = useState<string>('all');

  // Selected Student for Quick Collection Modal
  const [collectingStudent, setCollectingStudent] = useState<Student | null>(null);
  const [upgradingStudent, setUpgradingStudent] = useState<Student | null>(null);
  const [birthdayStudent, setBirthdayStudent] = useState<Student | null>(null);

  // Fee Collection Form State
  const [amountToPay, setAmountToPay] = useState<number>(0);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<PaymentMode>('cash');
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentRemarks, setPaymentRemarks] = useState('');

  // Receipt Voucher Number & Date Management
  const [receiptVoucherNo, setReceiptVoucherNo] = useState<string>('');
  const [receiptVoucherDate, setReceiptVoucherDate] = useState<string>('');
  const [lastVoucherInfo, setLastVoucherInfo] = useState<{ lastReceiptNo: string; lastDate: string }>({
    lastReceiptNo: '',
    lastDate: '',
  });

  // Discount & Coupon State in Collection
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponCode | null>(null);
  const [manualDiscount, setManualDiscount] = useState<number>(0);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Pagination for large student volume
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Filtered Students List
  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return students.filter((stu) => {
      // Search matches
      const matchesSearch =
        !q ||
        stu.name.toLowerCase().includes(q) ||
        stu.rollNo.toLowerCase().includes(q) ||
        stu.biometricId.includes(q) ||
        stu.phone.includes(q) ||
        stu.parentPhone.includes(q) ||
        stu.fatherName.toLowerCase().includes(q) ||
        stu.courseName.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // Status filters
      if (statusFilter === 'due' && stu.pendingAmount <= 0) return false;
      if (statusFilter === 'paid' && stu.pendingAmount > 0) return false;
      if (statusFilter === 'oscit' && !stu.courseName.toLowerCase().includes('oscit')) return false;
      if (statusFilter === 'overdue') {
        const hasOverdue = stu.installments.some((inst) => inst.status === 'overdue');
        if (!hasOverdue) return false;
      }

      // Course filter
      if (courseFilter !== 'all' && stu.courseId !== courseFilter) return false;

      return true;
    });
  }, [students, searchQuery, statusFilter, courseFilter]);

  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalDueAll = students.reduce((sum, s) => sum + s.pendingAmount, 0);
    const totalPaidAll = students.reduce((sum, s) => sum + s.paidAmount, 0);
    const overdueStudentsCount = students.filter((s) =>
      s.installments.some((i) => i.status === 'overdue')
    ).length;
    const birthdayStudentsCount = students.filter((s) => isTodayBirthday(s.dob)).length;
    return { totalDueAll, totalPaidAll, overdueStudentsCount, birthdayStudentsCount };
  }, [students]);

  // Handle open collection modal
  const handleOpenCollection = (stu: Student) => {
    setCollectingStudent(stu);
    // Find earliest pending installment or entire pending amount
    const firstPending = stu.installments.find((i) => i.status !== 'paid');
    setAmountToPay(firstPending ? firstPending.amount : stu.pendingAmount);
    setSelectedPaymentMode('cash');
    setTransactionRef('');
    setPaymentRemarks('');
    setCouponCodeInput('');
    setAppliedCoupon(null);
    setManualDiscount(0);
    setCouponError(null);

    // Initialize Voucher Number & Date with maintained last entry
    const info = getLastReceiptVoucherInfo(payments);
    setLastVoucherInfo(info);
    const nextNo = calculateNextReceiptVoucherNumber(info.lastReceiptNo, payments);
    setReceiptVoucherNo(nextNo);
    setReceiptVoucherDate(info.lastDate || new Date().toISOString().split('T')[0]);
  };

  // Apply Coupon Logic
  const handleApplyCoupon = () => {
    if (!couponCodeInput.trim() || !collectingStudent) return;
    const codeUpper = couponCodeInput.trim().toUpperCase();
    const found = coupons.find((c) => c.code.toUpperCase() === codeUpper);

    if (!found) {
      setCouponError('Invalid coupon code. Try OSCIT500, DIWALI1000, or EARLYBIRD');
      setAppliedCoupon(null);
      return;
    }

    if (found.minCourseFee && collectingStudent.totalFee < found.minCourseFee) {
      setCouponError(`This coupon requires a minimum course fee of ${formatCurrency(found.minCourseFee)}`);
      setAppliedCoupon(null);
      return;
    }

    setAppliedCoupon(found);
    setCouponError(null);
  };

  // Calculate discount amount
  const calculatedDiscount = useMemo(() => {
    if (!collectingStudent) return 0;
    let disc = 0;
    if (appliedCoupon) {
      if (appliedCoupon.discountType === 'flat') {
        disc += appliedCoupon.discountValue;
      } else {
        disc += Math.round((collectingStudent.totalFee * appliedCoupon.discountValue) / 100);
      }
    }
    if (manualDiscount > 0) {
      disc += manualDiscount;
    }
    return Math.min(disc, collectingStudent.pendingAmount);
  }, [appliedCoupon, manualDiscount, collectingStudent]);

  // Submit Fee Collection
  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectingStudent) return;

    if (amountToPay <= 0 && calculatedDiscount <= 0) {
      alert('Please enter a valid payment amount or discount.');
      return;
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const isAdmin = currentRole === 'admin';

    const effectiveVoucherNo = receiptVoucherNo.trim() || generateReceiptNumber(payments);
    const effectiveVoucherDate = receiptVoucherDate.trim() || dateStr;

    // Save and maintain for next entry
    saveLastReceiptVoucherInfo(effectiveVoucherNo, effectiveVoucherDate);

    // Update student's financial balance
    const effectiveDiscount = (collectingStudent.discount || 0) + calculatedDiscount;
    const newPaidAmount = collectingStudent.paidAmount + amountToPay;
    const newPendingAmount = Math.max(
      0,
      collectingStudent.totalFee - effectiveDiscount - newPaidAmount
    );

    // Update installments
    let remainingAmountToCover = amountToPay;
    const updatedInstallments = collectingStudent.installments.map((inst) => {
      if (inst.status === 'paid') return inst;
      if (remainingAmountToCover >= inst.amount) {
        remainingAmountToCover -= inst.amount;
        return {
          ...inst,
          status: 'paid' as const,
          paidDate: effectiveVoucherDate,
          receiptId: effectiveVoucherNo,
        };
      }
      return inst;
    });

    const paymentRecord: FeePayment = {
      id: `pay-${Date.now()}`,
      receiptNo: effectiveVoucherNo,
      studentId: collectingStudent.id,
      studentName: collectingStudent.name,
      studentRollNo: collectingStudent.rollNo,
      courseName: collectingStudent.courseName,
      amount: amountToPay,
      paymentMode: selectedPaymentMode,
      transactionRef: transactionRef.trim() || undefined,
      date: effectiveVoucherDate,
      time: timeStr,
      collectedByStaffId: currentRole === 'admin' ? 'admin-01' : 'staff-01',
      collectedByStaffName: currentStaffName,
      approvalStatus: isAdmin ? 'APPROVED' : 'PENDING_APPROVAL',
      approvedByAdminId: isAdmin ? 'admin-01' : undefined,
      approvedByAdminName: isAdmin ? currentStaffName : undefined,
      approvalDate: isAdmin ? `${effectiveVoucherDate} ${timeStr}` : undefined,
      installmentNos: [1],
      remainingBalanceAfter: newPendingAmount,
      remarks:
        calculatedDiscount > 0
          ? `${paymentRemarks ? paymentRemarks + ' | ' : ''}Discount applied: ₹${calculatedDiscount} (${appliedCoupon?.code || 'Manual Discount'})`
          : paymentRemarks || undefined,
    };

    const updatedStudent: Student = {
      ...collectingStudent,
      discount: effectiveDiscount,
      appliedCoupon: appliedCoupon ? appliedCoupon.code : collectingStudent.appliedCoupon,
      netPayableFee: collectingStudent.totalFee - effectiveDiscount,
      paidAmount: newPaidAmount,
      pendingAmount: newPendingAmount,
      installments: updatedInstallments,
    };

    onCollectPayment(paymentRecord, updatedStudent);
    setCollectingStudent(null);

    // Prompt receipt opening
    if (onOpenReceiptModal) {
      onOpenReceiptModal(paymentRecord);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Metric Strip */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-indigo-900/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-300">
              <Receipt className="w-4 h-4 text-indigo-400" />
              High-Capacity Fee Counter & Installment Collection Desk
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight mt-1">
              Fee Collection & Course Upgrade Desk
            </h1>
            <p className="text-xs text-indigo-200 mt-0.5">
              Rapid student search, instant discount vouchers, OSCIT course upgrades, and WhatsApp receipts
            </p>
          </div>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <div className="text-[10px] uppercase font-bold text-rose-300">Total Dues Pending</div>
              <div className="text-lg font-black font-mono text-rose-200 mt-0.5">
                {formatCurrency(metrics.totalDueAll)}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <div className="text-[10px] uppercase font-bold text-emerald-300">Total Fee Collected</div>
              <div className="text-lg font-black font-mono text-emerald-200 mt-0.5">
                {formatCurrency(metrics.totalPaidAll)}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <div className="text-[10px] uppercase font-bold text-amber-300">Overdue Installments</div>
              <div className="text-lg font-black font-mono text-amber-200 mt-0.5">
                {metrics.overdueStudentsCount} Students
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <div className="text-[10px] uppercase font-bold text-pink-300">Today's Birthdays</div>
              <div className="text-lg font-black font-mono text-pink-200 mt-0.5 flex items-center gap-1.5">
                🎂 {metrics.birthdayStudentsCount}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Birthday Banner If Any Birthdays Today */}
      {metrics.birthdayStudentsCount > 0 && (
        <div className="bg-gradient-to-r from-pink-50 via-rose-50 to-amber-50 border border-pink-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500 text-white flex items-center justify-center text-xl shadow-xs">
              🎂
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-pink-900 uppercase tracking-wider">
                  Today's Student Birthdays!
                </span>
                <span className="bg-pink-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {metrics.birthdayStudentsCount} Celebrating Today
                </span>
              </div>
              <p className="text-xs text-pink-800 mt-0.5">
                Send festive birthday greetings on WhatsApp and SMS directly from the academy!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {students
              .filter((s) => isTodayBirthday(s.dob))
              .map((bStu) => (
                <button
                  key={bStu.id}
                  onClick={() => setBirthdayStudent(bStu)}
                  className="bg-white hover:bg-pink-50 text-pink-700 border border-pink-300 text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  <Cake className="w-3.5 h-3.5 text-pink-600" />
                  Wish {bStu.name.split(' ')[0]}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Search & Fast Filtering Desk */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Main Fast Search Bar */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Instant Search: Student Name, Roll No, Phone, Biometric ID, Father's Name, Course..."
              className="w-full pl-11 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden transition font-medium"
            />
          </div>

          {/* Quick Filter Status Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => {
                setStatusFilter('due');
                setCurrentPage(1);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                statusFilter === 'due'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              Pending Dues Only
            </button>

            <button
              onClick={() => {
                setStatusFilter('overdue');
                setCurrentPage(1);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                statusFilter === 'overdue'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Overdue Installments
            </button>

            <button
              onClick={() => {
                setStatusFilter('oscit');
                setCurrentPage(1);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                statusFilter === 'oscit'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              OSCIT Upgrade Path
            </button>

            <button
              onClick={() => {
                setStatusFilter('all');
                setCurrentPage(1);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                statusFilter === 'all'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Students ({students.length})
            </button>

            <button
              onClick={() => {
                setStatusFilter('paid');
                setCurrentPage(1);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                statusFilter === 'paid'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Fully Paid
            </button>
          </div>
        </div>

        {/* Secondary Course Dropdown Filter */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-700">Filter by Course:</span>
            <select
              value={courseFilter}
              onChange={(e) => {
                setCourseFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs py-1 px-2.5 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Courses ({courses.length})</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            Showing <strong>{filteredStudents.length}</strong> matching students • Page{' '}
            <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
          </div>
        </div>
      </div>

      {/* Large-Volume Student Fee Roster Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Student Details</th>
                <th className="py-3.5 px-4">Enrolled Course</th>
                <th className="py-3.5 px-4 text-right">Total Fee</th>
                <th className="py-3.5 px-4 text-right">Paid Amount</th>
                <th className="py-3.5 px-4 text-right">Balance Due</th>
                <th className="py-3.5 px-4 text-center">Status / Next Due</th>
                <th className="py-3.5 px-4 text-right">Desk Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No students matched the selected search criteria.
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((stu) => {
                  const hasOverdue = stu.installments.some((i) => i.status === 'overdue');
                  const nextInstallment = stu.installments.find((i) => i.status !== 'paid');
                  const isOscit = stu.courseName.toLowerCase().includes('oscit');
                  const isBirthday = isTodayBirthday(stu.dob);

                  return (
                    <tr
                      key={stu.id}
                      className={`hover:bg-indigo-50/30 transition-colors ${
                        isBirthday ? 'bg-pink-50/30' : ''
                      }`}
                    >
                      {/* Student Details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center text-xs shrink-0 border border-indigo-200">
                            {stu.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-slate-900">{stu.name}</span>
                              {isBirthday && (
                                <button
                                  type="button"
                                  onClick={() => setBirthdayStudent(stu)}
                                  title="Birthday Today! Click to wish"
                                  className="text-pink-600 animate-bounce"
                                >
                                  🎂
                                </button>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span className="font-mono font-semibold text-slate-700">
                                {stu.rollNo}
                              </span>
                              <span>•</span>
                              <span>Bio #{stu.biometricId}</span>
                              <span>•</span>
                              <span className="text-slate-600">{stu.phone}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Course */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 line-clamp-1">{stu.courseName}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{stu.batchTime}</span>
                          {isOscit && (
                            <span className="text-[9px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded">
                              OSCIT Upgrade
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Total Fee */}
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-800">
                        {formatCurrency(stu.totalFee)}
                        {stu.discount > 0 && (
                          <div className="text-[10px] text-emerald-600 font-sans">
                            -₹{stu.discount} discount
                          </div>
                        )}
                      </td>

                      {/* Paid Amount */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">
                        {formatCurrency(stu.paidAmount)}
                      </td>

                      {/* Balance Due */}
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`font-mono font-black text-sm ${
                            stu.pendingAmount > 0 ? 'text-rose-600' : 'text-slate-400'
                          }`}
                        >
                          {formatCurrency(stu.pendingAmount)}
                        </span>
                      </td>

                      {/* Status / Installment */}
                      <td className="py-3.5 px-4 text-center">
                        {stu.pendingAmount === 0 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> Fully Paid
                          </span>
                        ) : hasOverdue ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-rose-100 text-rose-800 px-2.5 py-1 rounded-full animate-pulse">
                            <AlertCircle className="w-3 h-3" /> Overdue Due
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full">
                            <Clock className="w-3 h-3" /> Due {formatDate(nextInstallment?.dueDate || '')}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Collect Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenCollection(stu)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-xs transition flex items-center gap-1"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            Collect Fee
                          </button>

                          {/* Course Upgrade Option */}
                          <button
                            type="button"
                            onClick={() => setUpgradingStudent(stu)}
                            title="Upgrade Course (OSCIT / OSCIT A / OSCIT A+)"
                            className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs px-2.5 py-1.5 rounded-lg transition flex items-center gap-1"
                          >
                            <TrendingUp className="w-3.5 h-3.5 text-amber-700" />
                            Upgrade
                          </button>

                          {/* WhatsApp Reminder if due */}
                          {stu.pendingAmount > 0 && (
                            <a
                              href={createWhatsAppURL(
                                stu.phone,
                                `Dear ${stu.name}, friendly fee installment reminder for ${stu.courseName} from ${settings.name}. Pending: ₹${stu.pendingAmount}.`
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Send WhatsApp Due Reminder"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg border border-emerald-200 transition"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          )}

                          {/* Birthday Wish Button */}
                          {isBirthday && (
                            <button
                              type="button"
                              onClick={() => setBirthdayStudent(stu)}
                              title="Send Birthday Greeting"
                              className="p-1.5 text-pink-600 hover:bg-pink-50 rounded-lg border border-pink-200 transition"
                            >
                              <Cake className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div>
              Showing page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> (
              {filteredStudents.length} total students)
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 font-semibold disabled:opacity-40 hover:bg-slate-100"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setCurrentPage(num)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                    currentPage === num
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 font-semibold disabled:opacity-40 hover:bg-slate-100"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Collect Fee Modal with Coupon & Discount Engine */}
      {collectingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-indigo-200 w-full max-w-xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-5 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                    Fee Collection Counter
                  </div>
                  <h3 className="text-lg font-black text-white">{collectingStudent.name}</h3>
                  <p className="text-xs text-indigo-200">
                    Roll No: <span className="font-mono font-semibold">{collectingStudent.rollNo}</span> •{' '}
                    {collectingStudent.courseName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCollectingStudent(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitPayment} className="p-6 space-y-4">
              {/* Financial Snapshot */}
              <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Total Fee</div>
                  <div className="font-mono font-bold text-slate-800 text-sm">
                    {formatCurrency(collectingStudent.totalFee)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Already Paid</div>
                  <div className="font-mono font-bold text-emerald-600 text-sm">
                    {formatCurrency(collectingStudent.paidAmount)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-rose-600 uppercase font-bold">Total Due</div>
                  <div className="font-mono font-black text-rose-600 text-sm">
                    {formatCurrency(collectingStudent.pendingAmount)}
                  </div>
                </div>
              </div>

              {/* Coupon Code & Discount Engine */}
              <div className="bg-indigo-50/60 rounded-xl p-4 border border-indigo-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-indigo-600" />
                    Apply Discount / Coupon Code
                  </label>
                  <span className="text-[10px] text-indigo-700 font-semibold">
                    Available: OSCIT500, DIWALI1000, EARLYBIRD
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value)}
                    placeholder="Enter coupon code (e.g. OSCIT500)"
                    className="flex-1 px-3 py-1.5 text-xs border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono font-bold uppercase bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition"
                  >
                    Apply
                  </button>
                </div>

                {couponError && (
                  <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {couponError}
                  </p>
                )}

                {appliedCoupon && (
                  <div className="flex items-center justify-between text-xs bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg p-2 font-semibold">
                    <span className="flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Coupon {appliedCoupon.code} applied: -{appliedCoupon.discountType === 'flat' ? `₹${appliedCoupon.discountValue}` : `${appliedCoupon.discountValue}%`}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedCoupon(null);
                        setCouponCodeInput('');
                      }}
                      className="text-[10px] text-rose-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {/* Manual Flat Discount for Admin/Staff */}
                <div className="pt-2 border-t border-indigo-100 flex items-center justify-between">
                  <span className="text-xs text-slate-600">Manual Concession (₹):</span>
                  <input
                    type="number"
                    min="0"
                    max={collectingStudent.pendingAmount}
                    value={manualDiscount || ''}
                    onChange={(e) => setManualDiscount(Number(e.target.value))}
                    placeholder="0"
                    className="w-28 px-2 py-1 text-xs border border-slate-300 rounded-lg text-right font-mono font-bold bg-white"
                  />
                </div>
              </div>

              {/* Receipt Voucher Number & Date (Maintained Sequentially) */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-indigo-600" />
                    Receipt Voucher Details
                  </label>
                  {lastVoucherInfo.lastReceiptNo && (
                    <div className="text-[11px] text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                      <History className="w-3 h-3 text-indigo-500" />
                      <span>Last Entry: <strong className="font-mono text-slate-900">#{lastVoucherInfo.lastReceiptNo}</strong> ({formatDate(lastVoucherInfo.lastDate)})</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Voucher Number */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Voucher Number *
                      </label>
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <button
                          type="button"
                          onClick={() => {
                            const nextVal = calculateNextReceiptVoucherNumber(receiptVoucherNo || lastVoucherInfo.lastReceiptNo, payments);
                            setReceiptVoucherNo(nextVal);
                          }}
                          className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline"
                        >
                          +1 Next
                        </button>
                        <span className="text-slate-300">•</span>
                        <button
                          type="button"
                          onClick={() => {
                            const gen = calculateNextReceiptVoucherNumber(undefined, payments);
                            setReceiptVoucherNo(gen);
                          }}
                          className="text-slate-500 hover:text-slate-800"
                        >
                          Auto Next
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      required
                      value={receiptVoucherNo}
                      onChange={(e) => setReceiptVoucherNo(e.target.value.toUpperCase())}
                      placeholder="e.g. REC-2026-0247"
                      className="w-full px-3 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Voucher number is maintained and incremented for the next collection.
                    </p>
                  </div>

                  {/* Voucher Date */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        Voucher Date *
                      </label>
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setReceiptVoucherDate(new Date().toISOString().split('T')[0])}
                          className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline"
                        >
                          Today
                        </button>
                        {lastVoucherInfo.lastDate && lastVoucherInfo.lastDate !== receiptVoucherDate && (
                          <>
                            <span className="text-slate-300">•</span>
                            <button
                              type="button"
                              onClick={() => setReceiptVoucherDate(lastVoucherInfo.lastDate)}
                              className="text-slate-500 hover:text-slate-800"
                            >
                              Keep Last ({lastVoucherInfo.lastDate})
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <input
                      type="date"
                      required
                      value={receiptVoucherDate}
                      onChange={(e) => setReceiptVoucherDate(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Date is retained for continuous entry of receipts.
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Amount Being Paid (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max={collectingStudent.pendingAmount - calculatedDiscount}
                    value={amountToPay || ''}
                    onChange={(e) => setAmountToPay(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono font-black text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Payment Mode *
                  </label>
                  <select
                    value={selectedPaymentMode}
                    onChange={(e) => setSelectedPaymentMode(e.target.value as PaymentMode)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
                  >
                    <option value="cash">Cash (Counter Desk)</option>
                    <option value="upi">UPI / QR Code (GPay, PhonePe, Paytm)</option>
                    <option value="card">Debit / Credit Card</option>
                    <option value="netbanking">Net Banking / NEFT</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    UTR / Cheque / Transaction Ref (Optional)
                  </label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="e.g. UPI/629081234456 or Cheque #0045"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Receipt Remarks / Notes
                  </label>
                  <input
                    type="text"
                    value={paymentRemarks}
                    onChange={(e) => setPaymentRemarks(e.target.value)}
                    placeholder="e.g. Cleared installment 2, examination eligibility sanctioned"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Live Remaining Balance Calculation */}
              <div className="bg-slate-900 text-white rounded-xl p-3.5 flex items-center justify-between text-xs">
                <div>
                  <div className="text-[10px] text-slate-400">Balance Remaining After Transaction:</div>
                  <div className="text-base font-mono font-black text-amber-300">
                    {formatCurrency(
                      Math.max(
                        0,
                        collectingStudent.pendingAmount - calculatedDiscount - amountToPay
                      )
                    )}
                  </div>
                </div>
                <div className="text-right text-[11px] text-indigo-300">
                  {currentRole === 'staff' ? (
                    <span className="text-amber-300 font-bold">
                      Pending Admin Audit Approval
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-bold">
                      Direct Admin Approved
                    </span>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCollectingStudent(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Generate Receipt & Collect ₹{amountToPay}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Course Upgrade Modal */}
      {upgradingStudent && (
        <CourseUpgradeModal
          student={upgradingStudent}
          courses={courses}
          currentRole={currentRole}
          currentStaffName={currentStaffName}
          onClose={() => setUpgradingStudent(null)}
          onConfirmUpgrade={(updatedStudent: Student) => {
            onUpgradeStudent(updatedStudent);
            setUpgradingStudent(null);
          }}
        />
      )}

      {/* Birthday Greeting Modal */}
      {birthdayStudent && (
        <BirthdayGreetingModal
          student={birthdayStudent}
          settings={settings}
          onClose={() => setBirthdayStudent(null)}
        />
      )}
    </div>
  );
};
