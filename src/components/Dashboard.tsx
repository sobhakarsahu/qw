import React, { useState } from 'react';
import {
  Student,
  FeePayment,
  ExtraFeePayment,
  BiometricAttendanceRecord,
  IncomeExpenseItem,
  InstituteSettings,
  UserRole,
} from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';
import {
  DollarSign,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Fingerprint,
  TrendingUp,
  Banknote,
  ShieldCheck,
  UserPlus,
  MessageSquare,
  Eye,
  Printer,
  Calendar,
  ArrowUpRight,
  Receipt,
  Building,
  QrCode,
  FileCheck2,
  BookOpen,
  KeyRound,
} from 'lucide-react';
import { ReceiptModal } from './ReceiptModal';
import { WhatsAppReminderModal } from './WhatsAppReminderModal';

interface DashboardProps {
  students: Student[];
  payments: FeePayment[];
  extraFeePayments?: ExtraFeePayment[];
  attendanceRecords: BiometricAttendanceRecord[];
  incomeExpenseItems: IncomeExpenseItem[];
  settings: InstituteSettings;
  currentRole: UserRole;
  onOpenCollectModal: () => void;
  onOpenApprovalsTab: () => void;
  onOpenStudentsTab: () => void;
  onOpenBiometricTab: () => void;
  onOpenCoursesTab?: () => void;
  onOpenFinancesTab?: () => void;
  onOpenPermissionsTab?: () => void;
  onApprovePayment: (paymentId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  students,
  payments,
  extraFeePayments = [],
  attendanceRecords,
  incomeExpenseItems,
  settings,
  currentRole,
  onOpenCollectModal,
  onOpenApprovalsTab,
  onOpenStudentsTab,
  onOpenBiometricTab,
  onOpenCoursesTab,
  onOpenFinancesTab,
  onOpenPermissionsTab,
  onApprovePayment,
}) => {
  const [selectedReceipt, setSelectedReceipt] = useState<FeePayment | null>(null);
  const [whatsAppStudent, setWhatsAppStudent] = useState<Student | null>(null);

  // Financial calculations
  const totalCommittedFees = students.reduce((acc, s) => acc + s.netPayableFee, 0);
  const totalApprovedTuitionFees = payments
    .filter((p) => p.approvalStatus === 'APPROVED')
    .reduce((acc, p) => acc + p.amount, 0);

  const totalApprovedExtraFees = extraFeePayments
    .filter((p) => p.approvalStatus === 'APPROVED')
    .reduce((acc, p) => acc + p.amount, 0);

  const totalApprovedFees = totalApprovedTuitionFees + totalApprovedExtraFees;

  const pendingApprovalPayments = payments.filter((p) => p.approvalStatus === 'PENDING_APPROVAL');
  const pendingExtraFeePayments = extraFeePayments.filter((p) => p.approvalStatus === 'PENDING_APPROVAL');

  const totalPendingApprovalCount = pendingApprovalPayments.length + pendingExtraFeePayments.length;
  const totalPendingApprovalAmount =
    pendingApprovalPayments.reduce((acc, p) => acc + p.amount, 0) +
    pendingExtraFeePayments.reduce((acc, p) => acc + p.amount, 0);

  const totalOutstandingDues = students.reduce((acc, s) => acc + s.pendingAmount, 0);

  // Today's Date
  const todayStr = new Date().toISOString().split('T')[0];
  const todayPunches = attendanceRecords.filter((a) => a.date === todayStr);
  const attendanceRatio =
    students.length > 0 ? Math.round((todayPunches.length / students.length) * 100) : 0;

  // Overdue students
  const overdueStudents = students.filter(
    (s) => s.pendingAmount > 0 && s.installments.some((i) => i.status === 'overdue')
  );

  // Payment mode split
  const cashPayments = payments
    .filter((p) => p.paymentMode === 'cash' && p.approvalStatus === 'APPROVED')
    .reduce((acc, p) => acc + p.amount, 0);

  const upiPayments = payments
    .filter((p) => p.paymentMode === 'upi' && p.approvalStatus === 'APPROVED')
    .reduce((acc, p) => acc + p.amount, 0);

  const otherPayments = totalApprovedFees - (cashPayments + upiPayments);

  return (
    <div className="space-y-6">
      {/* Pending Approvals Notice Banner if Admin or Staff */}
      {totalPendingApprovalCount > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-slate-950 rounded-xl font-bold shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                {totalPendingApprovalCount} Collections Awaiting Admin Verification & Seal
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Front desk staff collected{' '}
                <strong className="font-mono text-amber-800">
                  {formatCurrency(totalPendingApprovalAmount)}
                </strong>{' '}
                ({pendingApprovalPayments.length} tuition + {pendingExtraFeePayments.length} Form Fillup / Annual Day extra fees) requiring Director authorization.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenApprovalsTab}
            className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            {currentRole === 'admin' ? 'Open Approvals Desk' : 'View Collection Queue'}
          </button>
        </div>
      )}

      {/* Main KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Approved Revenue */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Verified Collections
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold font-mono text-slate-900">
              {formatCurrency(totalApprovedFees)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <span className="text-emerald-700 font-semibold">
                {Math.round((totalApprovedFees / (totalCommittedFees || 1)) * 100)}%
              </span>
              <span>of total committed revenue</span>
            </div>
          </div>
        </div>

        {/* Pending Approval */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Pending Admin Audit
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold font-mono text-amber-800">
              {formatCurrency(totalPendingApprovalAmount)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {pendingApprovalPayments.length} collection vouchers in queue
            </div>
          </div>
        </div>

        {/* Pending Student Dues */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
              Outstanding Dues
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold font-mono text-rose-800">
              {formatCurrency(totalOutstandingDues)}
            </div>
            <div className="text-[11px] text-rose-600 mt-1 font-medium">
              {overdueStudents.length} students with overdue notice
            </div>
          </div>
        </div>

        {/* Biometric Attendance Today */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
              Biometric Punch Today
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Fingerprint className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold font-mono text-indigo-900">
              {todayPunches.length} / {students.length}
            </div>
            <div className="text-[11px] text-indigo-700 mt-1 font-semibold">
              {attendanceRatio}% student presence ratio
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Station Strip */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-600 rounded-lg">
            <Receipt className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">Counter Quick Actions</h4>
            <p className="text-xs text-slate-400">Common desk workflows</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenCollectModal}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition shadow-xs flex items-center gap-1.5"
          >
            <Banknote className="w-4 h-4" />
            Collect Student Fee
          </button>
          <button
            onClick={onOpenApprovalsTab}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2 rounded-lg transition border border-slate-700 flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            Review Approvals ({pendingApprovalPayments.length})
          </button>
          <button
            onClick={onOpenBiometricTab}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2 rounded-lg transition border border-slate-700 flex items-center gap-1.5"
          >
            <Fingerprint className="w-4 h-4 text-emerald-400" />
            Biometric Punch Station
          </button>
          <button
            onClick={onOpenStudentsTab}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2 rounded-lg transition border border-slate-700 flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-indigo-400" />
            Enroll Student
          </button>
          {onOpenCoursesTab && (
            <button
              onClick={onOpenCoursesTab}
              className="bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition border border-indigo-500/30 flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-indigo-400" />
              Course Catalog & Fees
            </button>
          )}
          {onOpenFinancesTab && (
            <button
              onClick={onOpenFinancesTab}
              className="bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition border border-emerald-500/30 flex items-center gap-1.5 cursor-pointer"
            >
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Income & Expenses
            </button>
          )}
          {onOpenPermissionsTab && currentRole === 'admin' && (
            <button
              onClick={onOpenPermissionsTab}
              className="bg-purple-950/80 hover:bg-purple-900 text-purple-200 hover:text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition border border-purple-600/40 flex items-center gap-1.5 cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-purple-400" />
              User & Work Permissions
            </button>
          )}
        </div>
      </div>

      {/* 2-Column Split: Recent Fee Collections & Overdue Student Notices */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Collections (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Recent Fee Collection Vouchers
              </h3>
              <p className="text-xs text-slate-500">
                Staff recorded collections & Admin verification logs
              </p>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              {payments.length} total receipts
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Receipt</th>
                  <th className="py-2.5 px-4">Student</th>
                  <th className="py-2.5 px-4">Staff Collector</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                  <th className="py-2.5 px-4 text-center">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.slice(0, 6).map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono">
                      <div className="font-bold text-slate-900">{payment.receiptNo}</div>
                      <div className="text-[10px] text-slate-500">{formatDate(payment.date)}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{payment.studentName}</div>
                      <div className="text-[10px] text-indigo-700 font-mono">
                        {payment.studentRollNo}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <div className="font-medium truncate max-w-[120px]">
                        {payment.collectedByStaffName}
                      </div>
                      <div className="uppercase text-[9px] text-slate-400 font-bold">
                        {payment.paymentMode}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          payment.approvalStatus === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : payment.approvalStatus === 'PENDING_APPROVAL'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {payment.approvalStatus === 'APPROVED'
                          ? 'Approved'
                          : payment.approvalStatus === 'PENDING_APPROVAL'
                          ? 'Pending'
                          : 'Rejected'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedReceipt(payment)}
                        className="text-slate-500 hover:text-indigo-600 p-1"
                        title="View Official Receipt"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Overdue Students & WhatsApp Reminder trigger (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Overdue Installment Alerts
                </h3>
                <p className="text-xs text-slate-500">
                  Send 1-click personalized WhatsApp reminder
                </p>
              </div>
              <span className="bg-rose-50 text-rose-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {overdueStudents.length} Overdue
              </span>
            </div>

            <div className="p-4 space-y-3">
              {overdueStudents.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-1.5" />
                  <p className="font-semibold text-slate-700 text-xs">All installments on track</p>
                  <p className="text-[11px] text-slate-400">No student is currently overdue.</p>
                </div>
              ) : (
                overdueStudents.map((student) => {
                  const overdueInst = student.installments.find((i) => i.status === 'overdue');
                  return (
                    <div
                      key={student.id}
                      className="bg-rose-50/40 border border-rose-200/80 rounded-xl p-3 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{student.name}</div>
                        <div className="text-slate-500 font-mono text-[11px]">
                          Roll: {student.rollNo} • Due:{' '}
                          <strong className="text-rose-700 font-bold">
                            {formatCurrency(overdueInst?.amount || student.pendingAmount)}
                          </strong>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          DueDate: {overdueInst?.dueDate || 'Passed'} • Ph: {student.phone}
                        </div>
                      </div>

                      <button
                        onClick={() => setWhatsAppStudent(student)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg transition shadow-xs flex items-center gap-1.5 shrink-0"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        WhatsApp
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Payment Method Distribution */}
          <div className="p-4 bg-slate-50 border-t border-slate-200">
            <div className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
              Approved Fee Collections by Mode
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Cash Counter</span>
                <span className="font-mono font-bold text-slate-900 text-xs mt-0.5 block">
                  {formatCurrency(cashPayments)}
                </span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block">UPI / QR</span>
                <span className="font-mono font-bold text-indigo-700 text-xs mt-0.5 block">
                  {formatCurrency(upiPayments)}
                </span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block">NetBank / Card</span>
                <span className="font-mono font-bold text-slate-700 text-xs mt-0.5 block">
                  {formatCurrency(otherPayments)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Official Receipt Modal */}
      {selectedReceipt && (
        <ReceiptModal
          payment={selectedReceipt}
          student={students.find((s) => s.id === selectedReceipt.studentId)}
          settings={settings}
          onClose={() => setSelectedReceipt(null)}
          onApprove={(id) => {
            onApprovePayment(id);
            setSelectedReceipt(null);
          }}
          isAdmin={currentRole === 'admin'}
        />
      )}

      {/* WhatsApp Modal */}
      {whatsAppStudent && (
        <WhatsAppReminderModal
          student={whatsAppStudent}
          settings={settings}
          onClose={() => setWhatsAppStudent(null)}
        />
      )}
    </div>
  );
};
