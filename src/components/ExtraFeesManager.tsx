import React, { useState } from 'react';
import {
  ExtraFeePayment,
  ExtraFeeCategory,
  Student,
  InstituteSettings,
  UserRole,
  PaymentMode,
  ApprovalStatus,
} from '../types';
import {
  formatCurrency,
  formatDate,
  generateExtraFeeReceiptNumber,
} from '../utils/helpers';
import {
  CalendarDays,
  FileCheck2,
  Plus,
  Search,
  Printer,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Tag,
  X,
  Flame,
  Award,
  ShieldCheck,
  Clock,
  XCircle,
  Lock,
  Check,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';
import { ExtraFeeReceiptModal } from './ExtraFeeReceiptModal';

interface ExtraFeesManagerProps {
  extraFeePayments: ExtraFeePayment[];
  students: Student[];
  settings: InstituteSettings;
  currentRole: UserRole;
  currentStaffName?: string;
  onCollectExtraFee?: (payment: ExtraFeePayment) => void;
  onRecordPayment?: (payment: ExtraFeePayment) => void;
  onApproveExtraFee?: (id: string) => void;
  onRejectExtraFee?: (id: string, reason: string) => void;
  onBatchApproveExtraFees?: (ids: string[]) => void;
  preselectedStudent?: Student | null;
  onClearPreselectedStudent?: () => void;
}

export const ExtraFeesManager: React.FC<ExtraFeesManagerProps> = ({
  extraFeePayments,
  students,
  settings,
  currentRole,
  currentStaffName = 'Accounts Staff',
  onCollectExtraFee,
  onRecordPayment,
  onApproveExtraFee,
  onRejectExtraFee,
  onBatchApproveExtraFees,
  preselectedStudent = null,
  onClearPreselectedStudent,
}) => {
  const isAdmin = currentRole === 'admin';
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | ExtraFeeCategory>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ApprovalStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Collect modal states
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    preselectedStudent?.id || students[0]?.id || ''
  );
  const [feeCategory, setFeeCategory] = useState<ExtraFeeCategory>('FORM_FILLUP');
  const [feeTitle, setFeeTitle] = useState('Semester Examination Form Fillup 2026');
  const [amount, setAmount] = useState<number>(500);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [transactionRef, setTransactionRef] = useState('');
  const [sessionOrEventYear, setSessionOrEventYear] = useState('Session 2026-27');
  const [remarks, setRemarks] = useState('');

  // Rejection dialog states
  const [rejectingPaymentId, setRejectingPaymentId] = useState<string | null>(null);
  const [rejectionReasonText, setRejectionReasonText] = useState('');

  // View Receipt Modal
  const [viewReceipt, setViewReceipt] = useState<ExtraFeePayment | null>(null);

  // Filter students who require form fillup
  const pendingFormFillupStudents = students.filter(
    (s) => s.formFillupRequired || s.academicStatus === 'EXAM_FAILED_REATTEMPT'
  );

  // Counts and statistics
  const pendingExtraFees = extraFeePayments.filter((p) => p.approvalStatus === 'PENDING_APPROVAL');
  const approvedExtraFees = extraFeePayments.filter((p) => p.approvalStatus === 'APPROVED');
  const rejectedExtraFees = extraFeePayments.filter((p) => p.approvalStatus === 'REJECTED');

  const totalPendingAmount = pendingExtraFees.reduce((sum, p) => sum + p.amount, 0);

  const totalApprovedFormFillup = approvedExtraFees
    .filter((p) => (p.feeCategory || p.feeType) === 'FORM_FILLUP')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalApprovedAnnualDay = approvedExtraFees
    .filter((p) => (p.feeCategory || p.feeType) === 'ANNUAL_DAY')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalApprovedAllExtraFees = approvedExtraFees.reduce((sum, p) => sum + p.amount, 0);

  // Quick Open Modal with pre-configured settings
  const openCollectModalFor = (cat: ExtraFeeCategory, student?: Student) => {
    setFeeCategory(cat);
    if (cat === 'FORM_FILLUP') {
      setFeeTitle('Semester Examination Form Fillup 2026');
      setAmount(500);
    } else if (cat === 'ANNUAL_DAY') {
      setFeeTitle('Annual Cultural Day & Sports Fest 2026');
      setAmount(1000);
    } else if (cat === 'CERTIFICATE_FEE') {
      setFeeTitle('Certificate & Marksheet Verification Fee');
      setAmount(300);
    } else {
      setFeeTitle('Auxiliary Event Fee');
      setAmount(500);
    }

    if (student) {
      setSelectedStudentId(student.id);
    }
    setShowCollectModal(true);
  };

  // Submit Collect Extra Fee
  const handleCollectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const st = students.find((s) => s.id === selectedStudentId);
    if (!st) return;

    const receiptNo = generateExtraFeeReceiptNumber(feeCategory);
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    // When staff collects, voucher is strictly PENDING_APPROVAL. When Admin collects, it is directly APPROVED.
    const defaultStatus: ApprovalStatus = isAdmin ? 'APPROVED' : 'PENDING_APPROVAL';

    const newPayment: ExtraFeePayment = {
      id: `extra-fee-${Date.now()}`,
      receiptNo,
      studentId: st.id,
      studentName: st.name,
      studentRollNo: st.rollNo,
      courseName: st.courseName,
      feeCategory,
      feeType: feeCategory,
      feeTitle: feeTitle.trim(),
      feeTypeName: feeTitle.trim(),
      amount: Number(amount),
      paymentMode,
      transactionRef: transactionRef.trim() || undefined,
      date: dateStr,
      time: timeStr,
      collectedByStaffId: isAdmin ? 'admin-01' : 'staff-01',
      collectedByStaffName: currentStaffName,
      sessionOrEventYear: sessionOrEventYear.trim() || 'Session 2026-27',
      academicYear: sessionOrEventYear.trim() || '2026',
      approvalStatus: defaultStatus,
      approvedByAdminId: isAdmin ? 'admin-01' : undefined,
      approvedByAdminName: isAdmin ? `${settings.directorName} (Director)` : undefined,
      approvalDate: isAdmin ? `${dateStr} ${timeStr}` : undefined,
      remarks: remarks.trim() || undefined,
    };

    if (onRecordPayment) onRecordPayment(newPayment);
    if (onCollectExtraFee) onCollectExtraFee(newPayment);
    setShowCollectModal(false);
    setViewReceipt(newPayment);

    // Reset form fields
    setTransactionRef('');
    setRemarks('');
    if (onClearPreselectedStudent) {
      onClearPreselectedStudent();
    }
  };

  // Filtered payments
  const filteredPayments = extraFeePayments.filter((p) => {
    const pCategory = p.feeCategory || p.feeType;
    const matchesCategory = categoryFilter === 'ALL' || pCategory === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || p.approvalStatus === statusFilter;
    const query = searchQuery.toLowerCase().trim();
    const title = p.feeTitle || p.feeTypeName || '';
    const matchesSearch =
      !query ||
      p.studentName.toLowerCase().includes(query) ||
      p.studentRollNo.toLowerCase().includes(query) ||
      p.receiptNo.toLowerCase().includes(query) ||
      title.toLowerCase().includes(query) ||
      p.collectedByStaffName.toLowerCase().includes(query);

    return matchesCategory && matchesStatus && matchesSearch;
  });

  const pendingInFiltered = filteredPayments.filter((p) => p.approvalStatus === 'PENDING_APPROVAL');

  // Select all pending in view
  const handleSelectAllPending = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(pendingInFiltered.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExecuteBatchApprove = () => {
    if (selectedIds.length === 0 || !onBatchApproveExtraFees) return;
    onBatchApproveExtraFees(selectedIds);
    setSelectedIds([]);
  };

  return (
    <div className="space-y-6">
      {/* Tab Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                Auxiliary Accounts Desk
              </span>
              <span className="text-slate-400 text-xs">• Form Fillup, Annual Day & Events</span>
            </div>
            <h2 className="text-2xl font-black text-white">
              Extra Fees & Admin Approval Desk
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Counter collections for <strong>Examination Form Fillup Fees</strong>,{' '}
              <strong>Annual Day Delegate Passes</strong>, and special institutional events with mandatory{' '}
              <strong>Director / Admin Verification & Seal</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => openCollectModalFor('FORM_FILLUP')}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3.5 py-2.5 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Collect Form Fillup (₹500)</span>
            </button>
            <button
              onClick={() => openCollectModalFor('ANNUAL_DAY')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <CalendarDays className="w-4 h-4" />
              <span>Collect Annual Day (₹1000)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Staff Authorization Policy Notice (If Staff) */}
      {!isAdmin && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3 text-amber-900 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0 border border-amber-500/30 mt-0.5">
            <Lock className="w-5 h-5 text-amber-700" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-amber-950">
                Staff Authorization Notice: Extra Fee Approval Prohibited
              </h3>
              <span className="bg-amber-200 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                Staff have no right to fees approved
              </span>
            </div>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
              Front desk staff can collect Form Fillup and Annual Day payments and issue provisional receipts. Official ledger sealing, income credit, and exam authorization require review and approval by the Director / Admin.
            </p>
          </div>
        </div>
      )}

      {/* Pending Approvals Callout Banner if Pending Vouchers Exist */}
      {pendingExtraFees.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 via-amber-100/70 to-amber-50 border border-amber-300/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  {pendingExtraFees.length} Extra Fee Collections Awaiting Admin Audit & Seal
                </h3>
                <span className="bg-amber-200 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Pending Approval
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Staff have collected{' '}
                <strong className="font-mono text-amber-900">
                  {formatCurrency(totalPendingAmount)}
                </strong>{' '}
                for Examination Form Fillup & Annual Day requiring Director verification.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isAdmin && onBatchApproveExtraFees && (
              <button
                onClick={() => onBatchApproveExtraFees(pendingExtraFees.map((p) => p.id))}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve All Pending ({pendingExtraFees.length})
              </button>
            )}
            <button
              onClick={() => setStatusFilter('PENDING_APPROVAL')}
              className="w-full sm:w-auto bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              View Queue
            </button>
          </div>
        </div>
      )}

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Form Fillup Fees Card */}
        <div className="bg-white rounded-xl p-4 border border-amber-200 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">
              Approved Form Fillup
            </div>
            <div className="text-xl font-extrabold text-slate-900 font-mono">
              {formatCurrency(totalApprovedFormFillup)}
            </div>
            <div className="text-[10px] text-slate-500">
              {approvedExtraFees.filter((p) => (p.feeCategory || p.feeType) === 'FORM_FILLUP').length} verified entries
            </div>
          </div>
        </div>

        {/* Annual Day Fees Card */}
        <div className="bg-white rounded-xl p-4 border border-indigo-200 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-indigo-800 uppercase tracking-wide">
              Approved Annual Day
            </div>
            <div className="text-xl font-extrabold text-slate-900 font-mono">
              {formatCurrency(totalApprovedAnnualDay)}
            </div>
            <div className="text-[10px] text-slate-500">
              {approvedExtraFees.filter((p) => (p.feeCategory || p.feeType) === 'ANNUAL_DAY').length} delegate passes sealed
            </div>
          </div>
        </div>

        {/* Total Extra Income */}
        <div className="bg-white rounded-xl p-4 border border-emerald-200 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
              Total Approved Income
            </div>
            <div className="text-xl font-extrabold text-emerald-700 font-mono">
              {formatCurrency(totalApprovedAllExtraFees)}
            </div>
            <div className="text-[10px] text-slate-500">
              {approvedExtraFees.length} of {extraFeePayments.length} receipts sealed
            </div>
          </div>
        </div>

        {/* Pending Approval Audit Card */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'PENDING_APPROVAL' ? 'ALL' : 'PENDING_APPROVAL')}
          className="bg-white rounded-xl p-4 border border-rose-200 shadow-xs flex items-center gap-3.5 cursor-pointer hover:border-rose-400 transition"
        >
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wide flex items-center gap-1">
              <span>Pending Admin Audit</span>
              {pendingExtraFees.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              )}
            </div>
            <div className="text-xl font-extrabold text-rose-700 font-mono">
              {formatCurrency(totalPendingAmount)}
            </div>
            <div className="text-[10px] text-slate-500">
              {pendingExtraFees.length} vouchers awaiting review
            </div>
          </div>
        </div>
      </div>

      {/* Pending Form Fillup Notification Alert */}
      {pendingFormFillupStudents.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
              <Flame className="w-4 h-4 text-amber-600" />
              <span>
                Students Requiring Examination Form Fillup ({pendingFormFillupStudents.length})
              </span>
            </div>
            <span className="text-[11px] text-amber-800">
              Marked for Re-attempt / Compartment
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {pendingFormFillupStudents.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-lg p-2.5 border border-amber-200 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="font-mono text-indigo-700">{s.rollNo}</span>
                    <span>{s.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate max-w-[200px]">
                    {s.courseName}
                  </div>
                  {s.formFillupReason && (
                    <div className="text-[10px] text-rose-600 font-medium mt-0.5">
                      {s.formFillupReason}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => openCollectModalFor('FORM_FILLUP', s)}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-2.5 py-1 rounded-md text-[11px] transition shadow-2xs shrink-0 cursor-pointer"
                >
                  Collect Fee
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters and Controls */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3">
        {/* Status Filter Tabs & Batch Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase mr-1">Status:</span>
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setSelectedIds([]);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Records ({extraFeePayments.length})
            </button>
            <button
              onClick={() => {
                setStatusFilter('PENDING_APPROVAL');
                setSelectedIds([]);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'PENDING_APPROVAL'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow-2xs'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pending Audit ({pendingExtraFees.length})</span>
            </button>
            <button
              onClick={() => {
                setStatusFilter('APPROVED');
                setSelectedIds([]);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'APPROVED'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Approved ({approvedExtraFees.length})</span>
            </button>
            <button
              onClick={() => {
                setStatusFilter('REJECTED');
                setSelectedIds([]);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'REJECTED'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Rejected ({rejectedExtraFees.length})</span>
            </button>
          </div>

          {/* Batch Approve Button for Admin */}
          {isAdmin && selectedIds.length > 0 && (
            <button
              onClick={handleExecuteBatchApprove}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Approve Selected ({selectedIds.length})</span>
            </button>
          )}
        </div>

        {/* Category Pills & Search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setCategoryFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                categoryFilter === 'ALL'
                  ? 'bg-indigo-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Categories
            </button>
            <button
              onClick={() => setCategoryFilter('FORM_FILLUP')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                categoryFilter === 'FORM_FILLUP'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Form Fillup Fees</span>
            </button>
            <button
              onClick={() => setCategoryFilter('ANNUAL_DAY')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                categoryFilter === 'ANNUAL_DAY'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Annual Day Fees</span>
            </button>
            <button
              onClick={() => setCategoryFilter('CERTIFICATE_FEE')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                categoryFilter === 'CERTIFICATE_FEE'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Certificate Fees</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search student, roll, receipt, staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Extra Fees Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                {isAdmin && (
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={
                        pendingInFiltered.length > 0 &&
                        selectedIds.length === pendingInFiltered.length
                      }
                      onChange={handleSelectAllPending}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                      title="Select all pending extra fees for batch approval"
                    />
                  </th>
                )}
                <th className="py-3 px-4">Receipt / Date</th>
                <th className="py-3 px-4">Student Details</th>
                <th className="py-3 px-4">Fee Category & Purpose</th>
                <th className="py-3 px-4">Collected By</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Payment Info</th>
                <th className="py-3 px-4 text-center">Approval Status / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="py-12 text-center text-slate-400">
                    <FileCheck2 className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">No extra fee records found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {statusFilter === 'PENDING_APPROVAL'
                        ? 'All Extra Fee collections have been audited and approved by Admin.'
                        : 'Use the action buttons above to record Form Fillup or Annual Day fees.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const isPending = p.approvalStatus === 'PENDING_APPROVAL';
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      {isAdmin && (
                        <td className="py-3.5 px-4">
                          {isPending ? (
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(p.id)}
                              onChange={() => handleToggleSelect(p.id)}
                              className="rounded text-indigo-600 focus:ring-indigo-500"
                            />
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </td>
                      )}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-bold text-indigo-700">{p.receiptNo}</div>
                        <div className="text-[10px] text-slate-400">
                          {formatDate(p.date)} • {p.time}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{p.studentName}</div>
                        <div className="text-[11px] text-indigo-700 font-mono font-semibold">
                          ID: {p.studentRollNo}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[180px]">
                          {p.courseName}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="mb-1">
                          {p.feeCategory === 'FORM_FILLUP' || p.feeType === 'FORM_FILLUP' ? (
                            <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 border border-amber-200">
                              <FileCheck2 className="w-3 h-3 text-amber-700" />
                              Form Fillup
                            </span>
                          ) : p.feeCategory === 'ANNUAL_DAY' || p.feeType === 'ANNUAL_DAY' ? (
                            <span className="bg-indigo-100 text-indigo-900 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 border border-indigo-200">
                              <CalendarDays className="w-3 h-3 text-indigo-700" />
                              Annual Day
                            </span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 border border-emerald-200">
                              <Award className="w-3 h-3 text-emerald-700" />
                              {p.feeCategory || p.feeType}
                            </span>
                          )}
                        </div>
                        <div className="font-semibold text-slate-800">{p.feeTitle || p.feeTypeName}</div>
                        {p.sessionOrEventYear && (
                          <div className="text-[10px] text-slate-500 font-mono">
                            {p.sessionOrEventYear}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        <div className="flex items-center gap-1 font-medium">
                          <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{p.collectedByStaffName}</span>
                        </div>
                        {p.remarks && (
                          <div className="text-[10px] text-slate-500 italic max-w-[160px] truncate mt-0.5" title={p.remarks}>
                            "{p.remarks}"
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="bg-slate-100 text-slate-700 text-[10px] font-mono uppercase px-2 py-0.5 rounded border border-slate-200 block max-w-min mx-auto">
                          {p.paymentMode}
                        </span>
                        {p.transactionRef && (
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5 max-w-[120px] truncate mx-auto" title={p.transactionRef}>
                            {p.transactionRef}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* Receipt Button */}
                          <button
                            onClick={() => setViewReceipt(p)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                            title="Print Official Receipt"
                          >
                            <Printer className="w-3.5 h-3.5 text-slate-600" />
                            <span className="text-[11px]">Receipt</span>
                          </button>

                          {/* Approval Status & Controls */}
                          {p.approvalStatus === 'PENDING_APPROVAL' && (
                            <>
                              {isAdmin ? (
                                <>
                                  <button
                                    onClick={() => onApproveExtraFee && onApproveExtraFee(p.id)}
                                    title="Approve & Seal Extra Fee Voucher"
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Approve</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setRejectingPaymentId(p.id);
                                      setRejectionReasonText('');
                                    }}
                                    title="Reject Voucher"
                                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2 py-1 rounded-md text-[11px] font-medium transition flex items-center gap-1 cursor-pointer"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span>Reject</span>
                                  </button>
                                </>
                              ) : (
                                <span
                                  title="Staff have no right to approve fees. Requires Director authorization."
                                  className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md flex items-center gap-1 shrink-0"
                                >
                                  <Lock className="w-3 h-3 text-amber-600" />
                                  Pending Admin Audit
                                </span>
                              )}
                            </>
                          )}

                          {p.approvalStatus === 'APPROVED' && (
                            <span
                              title={`Approved by ${p.approvedByAdminName || settings.directorName} ${p.approvalDate ? `(${p.approvalDate})` : ''}`}
                              className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Approved
                            </span>
                          )}

                          {p.approvalStatus === 'REJECTED' && (
                            <span
                              title={p.rejectionReason ? `Reason: ${p.rejectionReason}` : 'Rejected by Admin'}
                              className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1"
                            >
                              <XCircle className="w-3 h-3 text-rose-600" />
                              Rejected
                            </span>
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
      </div>

      {/* Collect Extra Fee Modal */}
      {showCollectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-6">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-600 rounded-lg">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Collect Extra / Event Fee</h3>
                  <p className="text-xs text-slate-300">
                    Form Fillup Fees, Annual Day & Special Events
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCollectModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Authorization Notice in Modal */}
            {!isAdmin && (
              <div className="bg-amber-50 px-6 py-2.5 border-b border-amber-200 flex items-center gap-2 text-xs text-amber-900">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Staff Submission:</strong> This payment voucher will require Director / Admin approval to officially clear student status and post to ledger.
                </span>
              </div>
            )}

            <form onSubmit={handleCollectSubmit} className="p-6 space-y-4 text-xs">
              {/* Student Selector */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Select Student / Trainee *
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.rollNo} • {s.name} ({s.courseName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Fee Category */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Fee Category *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFeeCategory('FORM_FILLUP');
                      setFeeTitle('Semester Examination Form Fillup 2026');
                      setAmount(500);
                    }}
                    className={`py-2 px-3 rounded-lg border text-left flex items-center gap-2 transition cursor-pointer ${
                      feeCategory === 'FORM_FILLUP'
                        ? 'bg-amber-50 border-amber-500 text-amber-900 font-bold'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <FileCheck2 className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Form Fillup Fee</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFeeCategory('ANNUAL_DAY');
                      setFeeTitle('Annual Cultural Day & Sports Fest 2026');
                      setAmount(1000);
                    }}
                    className={`py-2 px-3 rounded-lg border text-left flex items-center gap-2 transition cursor-pointer ${
                      feeCategory === 'ANNUAL_DAY'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <CalendarDays className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Annual Day Fee</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFeeCategory('CERTIFICATE_FEE');
                      setFeeTitle('Official Certificate Processing Fee');
                      setAmount(300);
                    }}
                    className={`py-2 px-3 rounded-lg border text-left flex items-center gap-2 transition cursor-pointer ${
                      feeCategory === 'CERTIFICATE_FEE'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <Award className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Certificate Fee</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFeeCategory('OTHER');
                      setFeeTitle('Auxiliary Event & Lab Fee');
                      setAmount(400);
                    }}
                    className={`py-2 px-3 rounded-lg border text-left flex items-center gap-2 transition cursor-pointer ${
                      feeCategory === 'OTHER'
                        ? 'bg-slate-100 border-slate-500 text-slate-900 font-bold'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <Tag className="w-4 h-4 text-slate-600 shrink-0" />
                    <span>Other Extra Fee</span>
                  </button>
                </div>
              </div>

              {/* Fee Title */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Purpose / Particulars Name *
                </label>
                <input
                  type="text"
                  required
                  value={feeTitle}
                  onChange={(e) => setFeeTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Amount and Quick Presets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    min={100}
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 font-mono font-bold text-base text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                  {/* Preset chips */}
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {[300, 500, 750, 1000, 1500].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAmount(preset)}
                        className={`text-[10px] px-2 py-0.5 rounded font-mono transition cursor-pointer ${
                          amount === preset
                            ? 'bg-indigo-600 text-white font-bold'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        ₹{preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Academic Session / Event Year
                  </label>
                  <input
                    type="text"
                    value={sessionOrEventYear}
                    onChange={(e) => setSessionOrEventYear(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Payment Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Payment Mode *</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden uppercase font-semibold"
                  >
                    <option value="cash">Cash Counter</option>
                    <option value="upi">UPI / QR Code</option>
                    <option value="card">Debit / Credit Card</option>
                    <option value="netbanking">Net Banking</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Transaction Ref / UPI ID
                  </label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="e.g. UPI/629810142"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Remarks / Counter Note
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Re-attempt form fillup fee received by staff"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCollectModal(false)}
                  className="px-4 py-2 font-medium text-slate-600 hover:text-slate-900 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isAdmin ? 'Receive Payment & Seal Receipt' : 'Submit for Admin Approval & Issue Slip'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Reason Dialog */}
      {rejectingPaymentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-6 max-w-md w-full">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-base mb-2">
              <AlertTriangle className="w-5 h-5" />
              Reject Extra Fee Collection Voucher
            </div>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              State the reason for rejecting this extra fee voucher. The collection will be invalidated and marked as rejected.
            </p>
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-700 block">
                Audit Reason:
              </label>
              <textarea
                value={rejectionReasonText}
                onChange={(e) => setRejectionReasonText(e.target.value)}
                placeholder="e.g. Cash received short, invalid UPI transaction reference, or student not eligible for re-attempt..."
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                rows={3}
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setRejectingPaymentId(null)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (rejectingPaymentId && onRejectExtraFee) {
                    onRejectExtraFee(
                      rejectingPaymentId,
                      rejectionReasonText || 'Declined during Admin physical cash/bank audit'
                    );
                    setRejectingPaymentId(null);
                  }
                }}
                className="bg-rose-600 hover:bg-rose-500 text-white text-xs px-4 py-1.5 rounded-lg font-semibold transition shadow-xs cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Extra Fee Receipt Modal */}
      {viewReceipt && (
        <ExtraFeeReceiptModal
          payment={viewReceipt}
          settings={settings}
          onClose={() => setViewReceipt(null)}
          onApprove={(id) => {
            if (onApproveExtraFee) onApproveExtraFee(id);
            setViewReceipt((prev) =>
              prev && prev.id === id
                ? {
                    ...prev,
                    approvalStatus: 'APPROVED',
                    approvedByAdminName: `${settings.directorName} (Director)`,
                    approvalDate: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`,
                  }
                : prev
            );
          }}
          onReject={(id, reason) => {
            if (onRejectExtraFee) onRejectExtraFee(id, reason);
            setViewReceipt((prev) =>
              prev && prev.id === id
                ? {
                    ...prev,
                    approvalStatus: 'REJECTED',
                    rejectionReason: reason,
                  }
                : prev
            );
          }}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
};
