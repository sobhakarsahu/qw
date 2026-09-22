import React, { useState, useEffect, useRef } from 'react';
import {
  Student,
  FeePayment,
  ExtraFeePayment,
  InstituteSettings,
  BiometricAttendanceRecord,
  AuthUser,
  UserRole,
} from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';
import { downloadElementAsPdf, triggerPrint } from '../utils/printPdf';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Receipt,
  QrCode,
  Download,
  Printer,
  ShieldCheck,
  Fingerprint,
  Phone,
  MessageSquare,
  HelpCircle,
  Copy,
  Check,
  User,
  GraduationCap,
  Calendar,
  FileCheck2,
  Loader2,
  FileText,
} from 'lucide-react';
import { ReceiptModal } from './ReceiptModal';
import { ExtraFeeReceiptModal } from './ExtraFeeReceiptModal';

interface StudentParentPortalProps {
  students: Student[];
  payments: FeePayment[];
  extraFeePayments?: ExtraFeePayment[];
  attendanceRecords: BiometricAttendanceRecord[];
  settings: InstituteSettings;
  defaultRollNo?: string;
  currentUser?: AuthUser | null;
  currentRole?: UserRole;
}

export const StudentParentPortal: React.FC<StudentParentPortalProps> = ({
  students,
  payments,
  extraFeePayments = [],
  attendanceRecords,
  settings,
  defaultRollNo,
  currentUser,
  currentRole = 'admin',
}) => {
  const isStudentSession = currentRole === 'student' || currentUser?.role === 'student';
  const initialRoll =
    currentUser?.rollNo || defaultRollNo || students[0]?.rollNo || '';
  const [searchKey, setSearchKey] = useState(initialRoll);
  const [selectedReceipt, setSelectedReceipt] = useState<FeePayment | null>(null);
  const [selectedExtraReceipt, setSelectedExtraReceipt] = useState<ExtraFeePayment | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isGeneratingStatementPdf, setIsGeneratingStatementPdf] = useState(false);
  const statementRef = useRef<HTMLDivElement>(null);

  const handleDownloadStatementPdf = async () => {
    if (!statementRef.current || !currentStudent) return;
    setIsGeneratingStatementPdf(true);
    try {
      await downloadElementAsPdf(statementRef.current, {
        fileName: `Fee-Statement-${currentStudent.rollNo}.pdf`,
        orientation: 'portrait',
        format: 'a4',
        margin: 8,
      });
    } finally {
      setIsGeneratingStatementPdf(false);
    }
  };

  useEffect(() => {
    if (defaultRollNo) {
      setSearchKey(defaultRollNo);
    } else if (currentUser?.rollNo) {
      setSearchKey(currentUser.rollNo);
    }
  }, [defaultRollNo, currentUser]);

  // Match student by Roll No or Phone
  const currentStudent = students.find(
    (s) =>
      s.rollNo.toLowerCase() === searchKey.trim().toLowerCase() ||
      s.phone === searchKey.trim() ||
      s.parentPhone === searchKey.trim() ||
      s.id === searchKey.trim()
  );

  const studentPayments = currentStudent
    ? payments.filter((p) => p.studentId === currentStudent.id)
    : [];

  const studentExtraFees = currentStudent
    ? extraFeePayments.filter(
        (x) => x.studentId === currentStudent.id || x.studentRollNo === currentStudent.rollNo
      )
    : [];

  const studentAttendance = currentStudent
    ? attendanceRecords.filter((a) => a.studentId === currentStudent.id)
    : [];

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(settings.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Lookup */}
      <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-indigo-500/20 text-indigo-300 text-xs px-2.5 py-0.5 rounded-full font-bold border border-indigo-400/30 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                Student & Parent Fee Portal
              </span>
              <span className="text-xs text-slate-400">Live Fees & Attendance Verification</span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">
              Parent Fee Checker & Receipt Desk
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Parents and trainees can enter their Roll Number or Registered Phone Number to inspect
              course fee schedules, payment acknowledgments, and biometric attendance records.
            </p>
          </div>

          {/* Quick Demo Student Switcher or Authenticated Student Badge */}
          {!isStudentSession ? (
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/15 text-xs">
              <span className="text-slate-300 font-medium block mb-1.5">
                Quick Select Demo Student:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {students.slice(0, 4).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSearchKey(s.rollNo)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                      currentStudent?.id === s.id
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white/20 text-slate-200 hover:bg-white/30'
                    }`}
                  >
                    {s.name.split(' ')[0]} ({s.rollNo})
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/15 text-xs min-w-[220px]">
              <span className="text-emerald-300 font-bold block mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Authenticated Student Session
              </span>
              <div className="text-slate-200 font-medium">
                Record for <strong>{currentStudent?.name || currentUser?.name}</strong>
              </div>
              <div className="text-slate-400 text-[11px] mt-0.5">
                Roll: <span className="font-mono text-white font-bold">{currentStudent?.rollNo || currentUser?.rollNo}</span>
              </div>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 max-w-2xl flex items-center gap-2">
          <Search className="w-5 h-5 text-indigo-300 shrink-0 ml-1" />
          <input
            type="text"
            placeholder="Enter Student Roll No (e.g. DTC-2026-101) or Registered Mobile Number..."
            value={searchKey}
            onChange={(e) => setSearchKey(e.target.value)}
            className="w-full bg-transparent text-white text-sm placeholder:text-slate-400 focus:outline-hidden font-medium"
          />
          <button
            type="button"
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition shrink-0"
          >
            Search
          </button>
        </div>
      </div>

      {!currentStudent ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
          <User className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="font-bold text-slate-800 text-lg">No Student Selected</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Please enter a valid student Roll Number or Mobile Number above to check fees, receipts,
            and attendance logs.
          </p>
        </div>
      ) : (
        <div id="printable-student-statement" ref={statementRef} className="space-y-6">
          {/* Student Profile & Summary Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-700 to-indigo-500 text-white flex items-center justify-center font-extrabold text-xl shadow-md shrink-0">
                  {currentStudent.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-extrabold text-slate-900">
                      {currentStudent.name}
                    </h3>
                    <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono text-xs font-bold px-2.5 py-0.5 rounded-md">
                      {currentStudent.rollNo}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Father's Name:{' '}
                    <strong className="text-slate-800">{currentStudent.fatherName}</strong> • Phone:{' '}
                    <span className="font-mono">{currentStudent.phone}</span>
                  </p>
                  <p className="text-xs text-indigo-700 font-semibold mt-0.5">
                    Course: {currentStudent.courseName} • Batch: {currentStudent.batchTime}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap no-print">
                <button
                  type="button"
                  onClick={handleDownloadStatementPdf}
                  disabled={isGeneratingStatementPdf}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold px-3 py-2 rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                  title="Download Student Fee Statement as PDF"
                >
                  {isGeneratingStatementPdf ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving PDF...
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      Download Statement PDF
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => triggerPrint()}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-lg transition border border-slate-300 flex items-center gap-1.5 cursor-pointer"
                  title="Print Fee Statement"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  Print Statement
                </button>

                <a
                  href={`https://wa.me/${settings.whatsappSupport}?text=Hello%20${encodeURIComponent(
                    settings.name
                  )}%20Accounts,%20I%20am%20querying%20regarding%20fees%20for%20${encodeURIComponent(
                    currentStudent.name
                  )}%20(Roll:%20${currentStudent.rollNo})`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-lg transition shadow-xs flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  WhatsApp
                </a>
              </div>
            </div>

            {/* Fee Figures 3-Card Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 font-medium block">Total Course Fee</span>
                <span className="text-2xl font-extrabold text-slate-900 font-mono mt-1 block">
                  {formatCurrency(currentStudent.netPayableFee)}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Enrolled on {formatDate(currentStudent.admissionDate)}
                </span>
              </div>

              <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200">
                <span className="text-xs text-emerald-800 font-medium block">
                  Total Fees Deposited
                </span>
                <span className="text-2xl font-extrabold text-emerald-700 font-mono mt-1 block">
                  {formatCurrency(currentStudent.paidAmount)}
                </span>
                <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">
                  Verified with Official Seal
                </span>
              </div>

              <div
                className={`p-4 rounded-xl border ${
                  currentStudent.pendingAmount === 0
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-rose-50/70 border-rose-200'
                }`}
              >
                <span className="text-xs text-slate-600 font-medium block">
                  Balance Remaining to Pay
                </span>
                <span
                  className={`text-2xl font-extrabold font-mono mt-1 block ${
                    currentStudent.pendingAmount === 0 ? 'text-slate-700' : 'text-rose-700'
                  }`}
                >
                  {formatCurrency(currentStudent.pendingAmount)}
                </span>
                <span
                  className={`text-[11px] font-medium mt-0.5 block ${
                    currentStudent.pendingAmount === 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {currentStudent.pendingAmount === 0
                    ? 'All installments cleared!'
                    : 'Upcoming/Pending dues remaining'}
                </span>
              </div>
            </div>
          </div>

          {/* 2-Column Content: Installment Roadmap & Online UPI Payment */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Installment Roadmap */}
            <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
              <h4 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                Fee Installment Schedule & Status
              </h4>

              <div className="space-y-3">
                {currentStudent.installments.map((inst) => {
                  const isPaid = inst.status === 'paid';
                  const isOverdue = inst.status === 'overdue';

                  return (
                    <div
                      key={inst.installmentNo}
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                        isPaid
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : isOverdue
                          ? 'bg-rose-50/50 border-rose-300'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isPaid
                              ? 'bg-emerald-600 text-white'
                              : isOverdue
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          #{inst.installmentNo}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">
                            Installment #{inst.installmentNo}
                          </div>
                          <div className="text-xs text-slate-500">
                            Due Date: <span className="font-medium">{formatDate(inst.dueDate)}</span>
                            {inst.paidDate && (
                              <span className="text-emerald-700 ml-2 font-medium">
                                • Paid on {formatDate(inst.paidDate)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                        <span className="font-mono font-extrabold text-slate-900 text-base">
                          {formatCurrency(inst.amount)}
                        </span>
                        <div>
                          {isPaid ? (
                            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Paid
                            </span>
                          ) : isOverdue ? (
                            <span className="bg-rose-100 text-rose-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Overdue
                            </span>
                          ) : (
                            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              Pending Due
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Payment Receipts Section */}
              <div className="mt-8 pt-6 border-t border-slate-200">
                <h4 className="font-bold text-slate-900 text-base mb-3 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-indigo-600" />
                  Official Course Fee Receipts ({studentPayments.length})
                </h4>

                {studentPayments.length === 0 ? (
                  <div className="text-xs text-slate-400 p-4 bg-slate-50 rounded-xl text-center">
                    No course tuition receipts recorded yet for this student.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                    {studentPayments.map((payment) => (
                      <div
                        key={payment.id}
                        className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 text-xs">
                              {payment.receiptNo}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                payment.approvalStatus === 'APPROVED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : payment.approvalStatus === 'PENDING_APPROVAL'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {payment.approvalStatus.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {formatDate(payment.date)} • Mode:{' '}
                            <span className="uppercase font-semibold text-slate-700">
                              {payment.paymentMode}
                            </span>{' '}
                            • Collected by {payment.collectedByStaffName}
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3">
                          <span className="font-mono font-bold text-slate-900 text-sm">
                            {formatCurrency(payment.amount)}
                          </span>
                          <button
                            onClick={() => setSelectedReceipt(payment)}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            View / Print Receipt
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Extra Fee Receipts Section (Form Fillup & Annual Day) */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <h4 className="font-bold text-slate-900 text-base mb-3 flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-amber-600" />
                  Extra Fee Vouchers & Receipts ({studentExtraFees.length})
                </h4>

                {studentExtraFees.length === 0 ? (
                  <div className="text-xs text-slate-400 p-4 bg-slate-50 rounded-xl text-center">
                    No extra fee receipts (Form Fillup or Annual Day) recorded for this student.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-amber-200 rounded-xl overflow-hidden bg-white">
                    {studentExtraFees.map((extraFee) => (
                      <div
                        key={extraFee.id}
                        className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-amber-50/40 transition"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 text-xs">
                              {extraFee.receiptNo}
                            </span>
                            <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                              {extraFee.feeTitle || extraFee.feeTypeName}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                extraFee.approvalStatus === 'APPROVED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : extraFee.approvalStatus === 'PENDING_APPROVAL'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {extraFee.approvalStatus.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {formatDate(extraFee.date)} • Mode:{' '}
                            <span className="uppercase font-semibold text-slate-700">
                              {extraFee.paymentMode}
                            </span>{' '}
                            • Collected by {extraFee.collectedByStaffName}
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3">
                          <span className="font-mono font-bold text-slate-900 text-sm">
                            {formatCurrency(extraFee.amount)}
                          </span>
                          <button
                            onClick={() => setSelectedExtraReceipt(extraFee)}
                            className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            View / Print Receipt
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Online Payment QR & Biometric Attendance snapshot */}
            <div className="lg:col-span-4 space-y-6">
              {/* Pay Fees Online Card */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs text-center">
                <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Online Fee Clearance
                </span>
                <h4 className="font-bold text-slate-900 text-base mt-2">
                  Scan & Pay Online via UPI
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Google Pay, PhonePe, Paytm, or Mobile Banking
                </p>

                <div className="my-4 p-4 bg-slate-50 border border-slate-200 rounded-xl inline-block shadow-xs">
                  <QrCode className="w-32 h-32 mx-auto text-slate-900" />
                  <span className="text-[10px] text-slate-500 font-mono block mt-1">
                    Verified Institute Account
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-2 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Official UPI ID:</span>
                    <button
                      onClick={handleCopyUpi}
                      className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 text-[11px]"
                    >
                      {copiedUpi ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="font-mono font-bold text-slate-900 bg-white p-2 rounded border border-slate-300 text-center">
                    {settings.upiId}
                  </div>

                  <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-600 space-y-1">
                    <div>
                      <strong>Bank:</strong> {settings.bankName}
                    </div>
                    <div>
                      <strong>A/C No:</strong> {settings.accountNo}
                    </div>
                    <div>
                      <strong>IFSC:</strong> {settings.ifscCode}
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 mt-3 italic leading-relaxed">
                  * After making payment, please send the transaction screenshot to institute
                  accounts on WhatsApp for instant receipt acknowledgment.
                </p>
              </div>

              {/* Biometric Attendance Summary */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Fingerprint className="w-4 h-4 text-emerald-600" />
                    Biometric Attendance
                  </h4>
                  <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Bio ID: #{currentStudent.biometricId}
                  </span>
                </div>

                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Punches Logged:</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {studentAttendance.length} Sessions
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Attendance Ratio:</span>
                    <span className="font-bold text-emerald-700 font-mono">
                      {studentAttendance.length > 0 ? '94% (Eligible for Exam)' : 'Pending sync'}
                    </span>
                  </div>
                  {studentAttendance.length > 0 && (
                    <div className="flex justify-between pt-1 border-t border-slate-200 text-[11px]">
                      <span className="text-slate-500">Latest Punch:</span>
                      <span className="font-semibold text-slate-800">
                        {studentAttendance[0]?.punchInTime} ({studentAttendance[0]?.date})
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-3 text-[10px] text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Verified via Lab Optical Scanner</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official Tuition Receipt Modal */}
      {selectedReceipt && (
        <ReceiptModal
          payment={selectedReceipt}
          student={currentStudent}
          settings={settings}
          onClose={() => setSelectedReceipt(null)}
          isAdmin={false}
        />
      )}

      {/* Official Extra Fee Receipt Modal */}
      {selectedExtraReceipt && (
        <ExtraFeeReceiptModal
          payment={selectedExtraReceipt}
          settings={settings}
          onClose={() => setSelectedExtraReceipt(null)}
          isAdmin={false}
        />
      )}
    </div>
  );
};
