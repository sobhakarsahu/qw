import React, { useRef, useState } from 'react';
import { FeePayment, InstituteSettings, Student } from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';
import { downloadElementAsPdf, triggerPrint } from '../utils/printPdf';
import {
  Printer,
  CheckCircle2,
  Clock,
  XCircle,
  Download,
  X,
  QrCode,
  ShieldCheck,
  Loader2,
  FileText,
} from 'lucide-react';

interface ReceiptModalProps {
  payment: FeePayment;
  student?: Student;
  settings: InstituteSettings;
  onClose: () => void;
  onApprove?: (paymentId: string) => void;
  isAdmin?: boolean;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  payment,
  student,
  settings,
  onClose,
  onApprove,
  isAdmin = false,
}) => {
  const printableRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [copyType, setCopyType] = useState<'STUDENT' | 'OFFICE' | 'DUPLICATE'>('STUDENT');

  const handlePrint = () => {
    triggerPrint();
  };

  const handleDownloadPdf = async () => {
    if (!printableRef.current) return;
    setIsGeneratingPdf(true);
    try {
      const studentSlug = (payment.studentName || 'Student').replace(/\s+/g, '-');
      const fileName = `Fee-Receipt-${payment.receiptNo}-${studentSlug}.pdf`;
      await downloadElementAsPdf(printableRef.current, {
        fileName,
        orientation: 'portrait',
        format: 'a4',
        margin: 6,
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const isApproved = payment.approvalStatus === 'APPROVED';
  const isPending = payment.approvalStatus === 'PENDING_APPROVAL';
  const isRejected = payment.approvalStatus === 'REJECTED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-8 print:my-0 print:border-none print:shadow-none">
        {/* Top Control Bar (Hidden in Print) */}
        <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              Fee Payment Receipt
            </span>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                isApproved
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : isPending
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              {payment.approvalStatus.replace('_', ' ')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Copy Type Selector */}
            <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-[11px] font-medium">
              <button
                type="button"
                onClick={() => setCopyType('STUDENT')}
                className={`px-2 py-1 rounded-md transition ${
                  copyType === 'STUDENT' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                Student Copy
              </button>
              <button
                type="button"
                onClick={() => setCopyType('OFFICE')}
                className={`px-2 py-1 rounded-md transition ${
                  copyType === 'OFFICE' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                Office Copy
              </button>
              <button
                type="button"
                onClick={() => setCopyType('DUPLICATE')}
                className={`px-2 py-1 rounded-md transition ${
                  copyType === 'DUPLICATE' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                Duplicate
              </button>
            </div>

            {isAdmin && isPending && onApprove && (
              <button
                onClick={() => onApprove(payment.id)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Approve
              </button>
            )}

            {/* Download PDF Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs px-3.5 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Download high-resolution official PDF receipt"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  Save PDF
                </>
              )}
            </button>

            {/* Browser Print Button */}
            <button
              onClick={handlePrint}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3.5 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Print receipt or print to PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Receipt Printable Canvas */}
        <div className="p-6 md:p-8 max-h-[80vh] overflow-y-auto bg-slate-50/50 print:p-0 print:max-h-none print:overflow-visible print:bg-white">
          <div
            id="printable-receipt"
            ref={printableRef}
            className="bg-white border border-slate-300 rounded-xl p-6 sm:p-8 relative shadow-sm text-slate-800 print:shadow-none print:border print:border-slate-300 print:rounded-none"
          >
            {/* Watermark for Pending / Approved */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 select-none overflow-hidden">
              <span className="text-7xl font-extrabold uppercase tracking-widest -rotate-25 text-slate-950">
                {isApproved ? 'DIGITECH VERIFIED' : isPending ? 'PENDING APPROVAL' : 'REJECTED'}
              </span>
            </div>

            {/* Header / Institute Letterhead */}
            <div className="border-b-2 border-indigo-600 pb-5 mb-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded tracking-wide">
                      GOVT. REG: {settings.regNo}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {settings.isoCertified}
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {settings.name}
                  </h1>
                  <p className="text-xs sm:text-sm text-indigo-700 font-semibold mt-0.5">
                    {settings.tagline}
                  </p>
                  <p className="text-xs text-slate-600 mt-1 max-w-md leading-relaxed">
                    {settings.address}, {settings.city}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5 font-mono">
                    Phone: {settings.phone} | Email: {settings.email} | GSTIN: {settings.gstNo}
                  </p>
                </div>

                <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200">
                  <div className="inline-block bg-slate-900 text-white text-xs font-bold px-3 py-1 rounded-sm uppercase tracking-wider mb-2">
                    {copyType === 'STUDENT'
                      ? 'Student Original Copy'
                      : copyType === 'OFFICE'
                      ? 'Institute Office Record'
                      : 'Duplicate Fee Receipt'}
                  </div>
                  <div className="text-xs text-slate-600 font-mono">
                    Receipt No: <span className="font-bold text-slate-900">{payment.receiptNo}</span>
                  </div>
                  <div className="text-xs text-slate-600">
                    Date: <span className="font-medium text-slate-800">{formatDate(payment.date)}</span>
                  </div>
                  <div className="text-xs text-slate-600">
                    Time: <span className="font-medium text-slate-800">{payment.time}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Student & Course Particulars */}
            <div className="bg-slate-50 rounded-lg p-4 mb-6 border border-slate-200 text-xs sm:text-sm grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 gap-x-6">
              <div>
                <span className="text-slate-500 font-medium">Student Name:</span>{' '}
                <span className="font-bold text-slate-900">{payment.studentName}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Roll Number:</span>{' '}
                <span className="font-bold font-mono text-indigo-900">{payment.studentRollNo}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Father's Name:</span>{' '}
                <span className="font-medium text-slate-800">{student?.fatherName || 'Not Specified'}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Biometric ID:</span>{' '}
                <span className="font-mono font-medium text-slate-800">{student?.biometricId || 'BIO-Synced'}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-500 font-medium">Enrolled Course:</span>{' '}
                <span className="font-semibold text-slate-900">{payment.courseName}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Batch Timing:</span>{' '}
                <span className="font-medium text-slate-800">{student?.batchTime || 'Standard Batch'}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Installment Cleared:</span>{' '}
                <span className="font-medium text-indigo-700">
                  {payment.installmentNos.length > 0
                    ? `Installment #${payment.installmentNos.join(', #')}`
                    : 'Course Fee Part Payment'}
                </span>
              </div>
            </div>

            {/* Payment Particulars Table */}
            <table className="w-full text-left border border-slate-200 mb-6 text-xs sm:text-sm">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">S.No.</th>
                  <th className="py-2.5 px-4">Description / Particulars</th>
                  <th className="py-2.5 px-4">Payment Mode</th>
                  <th className="py-2.5 px-4 text-right">Amount Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-3 px-4 font-mono">1.</td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-900">
                      Tuition, Computer Lab Workstation Access & Study Material
                    </div>
                    {payment.transactionRef && (
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        Ref/Txn ID: {payment.transactionRef}
                      </div>
                    )}
                    {payment.remarks && (
                      <div className="text-xs text-slate-500 mt-0.5 italic">
                        Note: {payment.remarks}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 uppercase font-medium text-slate-800 text-xs">
                    {payment.paymentMode}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono text-base">
                    {formatCurrency(payment.amount)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Fee Balance Matrix & QR Code */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-indigo-50/50 p-4 rounded-lg border border-indigo-100 mb-6">
              <div className="sm:col-span-8 space-y-1 text-xs sm:text-sm">
                <div className="flex justify-between max-w-sm">
                  <span className="text-slate-600">Total Course Fee:</span>
                  <span className="font-semibold text-slate-900">
                    {student ? formatCurrency(student.netPayableFee) : '-'}
                  </span>
                </div>
                <div className="flex justify-between max-w-sm">
                  <span className="text-slate-600">Total Fee Paid to Date:</span>
                  <span className="font-semibold text-emerald-700">
                    {student ? formatCurrency(student.paidAmount) : formatCurrency(payment.amount)}
                  </span>
                </div>
                <div className="flex justify-between max-w-sm border-t border-indigo-200 pt-1 font-bold text-sm">
                  <span className="text-indigo-900">Current Balance Remaining:</span>
                  <span className="text-indigo-900 font-mono">
                    {formatCurrency(payment.remainingBalanceAfter)}
                  </span>
                </div>
              </div>

              <div className="sm:col-span-4 flex items-center justify-start sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-indigo-200">
                <div className="p-2 bg-white border border-slate-300 rounded shadow-xs text-center">
                  <QrCode className="w-14 h-14 mx-auto text-slate-800" />
                  <span className="text-[9px] text-slate-500 font-mono block mt-0.5">
                    UPI: {settings.upiId}
                  </span>
                </div>
              </div>
            </div>

            {/* Approval Seal & Signatures */}
            <div className="border-t border-slate-200 pt-5 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
              {/* Collected By Staff */}
              <div className="space-y-1">
                <span className="text-slate-500 block font-medium">Fees Collected By:</span>
                <span className="font-bold text-slate-900 block">{payment.collectedByStaffName}</span>
                <span className="text-[11px] text-slate-500">Accounts & Front Desk Staff</span>
              </div>

              {/* Status / Seal */}
              <div className="text-center flex flex-col items-center justify-center">
                {isApproved ? (
                  <div className="border-2 border-emerald-600 rounded-lg p-2 bg-emerald-50 text-emerald-800 w-full text-center">
                    <div className="flex items-center justify-center gap-1 font-bold uppercase text-[11px] tracking-wider text-emerald-700">
                      <ShieldCheck className="w-4 h-4" />
                      Approved & Verified
                    </div>
                    <div className="text-[10px] text-emerald-900 font-medium mt-0.5">
                      {payment.approvedByAdminName}
                    </div>
                    <div className="text-[9px] text-emerald-600 font-mono">
                      {payment.approvalDate}
                    </div>
                  </div>
                ) : isPending ? (
                  <div className="border-2 border-dashed border-amber-500 rounded-lg p-2 bg-amber-50 text-amber-900 w-full text-center">
                    <div className="flex items-center justify-center gap-1 font-bold uppercase text-[11px] tracking-wider text-amber-700">
                      <Clock className="w-4 h-4" />
                      Provisional Receipt
                    </div>
                    <div className="text-[10px] text-amber-800 mt-0.5">
                      Awaiting Admin Audit Seal
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-rose-500 rounded-lg p-2 bg-rose-50 text-rose-900 w-full text-center">
                    <div className="flex items-center justify-center gap-1 font-bold uppercase text-[11px] tracking-wider text-rose-700">
                      <XCircle className="w-4 h-4" />
                      Payment Rejected
                    </div>
                    <div className="text-[10px] text-rose-800 mt-0.5">
                      {payment.rejectionReason || 'Declined by Admin'}
                    </div>
                  </div>
                )}
              </div>

              {/* Director Seal */}
              <div className="text-left sm:text-right space-y-1">
                <span className="text-slate-500 block font-medium">Authorized Signatory:</span>
                <span className="font-bold text-slate-900 block">{settings.directorName}</span>
                <span className="text-[11px] text-slate-500">{settings.directorTitle}</span>
              </div>
            </div>

            {/* Terms & Footer */}
            <div className="mt-6 pt-3 border-t border-slate-200 text-[10px] text-slate-500 flex flex-col sm:flex-row justify-between gap-1">
              <span>
                * Fee once paid is non-refundable. Biometric punch attendance mandatory for lab sessions.
              </span>
              <span className="font-mono">
                Computer-generated receipt with digital audit log.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
