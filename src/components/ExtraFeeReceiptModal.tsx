import React, { useRef, useState } from 'react';
import { ExtraFeePayment, InstituteSettings } from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';
import { downloadElementAsPdf, triggerPrint } from '../utils/printPdf';
import {
  Printer,
  Download,
  Loader2,
  X,
  FileCheck,
  CheckCircle2,
  Calendar,
  CreditCard,
  Building2,
  Phone,
  ShieldCheck,
  Clock,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

interface ExtraFeeReceiptModalProps {
  payment: ExtraFeePayment;
  settings: InstituteSettings;
  onClose: () => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string, reason: string) => void;
  isAdmin?: boolean;
}

export const ExtraFeeReceiptModal: React.FC<ExtraFeeReceiptModalProps> = ({
  payment,
  settings,
  onClose,
  onApprove,
  onReject,
  isAdmin = false,
}) => {
  const printableRef = useRef<HTMLDivElement>(null);
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
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
      const fileName = `ExtraFee-Receipt-${payment.receiptNo}-${studentSlug}.pdf`;
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

  const getCategoryTitle = (cat?: string) => {
    const safeCat = cat || payment.feeType || 'OTHER';
    if (safeCat === 'FORM_FILLUP') return 'Examination Form Fillup Fee Receipt';
    if (safeCat === 'ANNUAL_DAY') return 'Annual Day & Cultural Event Fee Receipt';
    if (safeCat === 'EXAM_FEE') return 'Semester Examination Fee Receipt';
    if (safeCat === 'CERTIFICATE_FEE') return 'Certificate Processing Fee Receipt';
    return 'Auxiliary / Extra Fee Official Receipt';
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden print:shadow-none print:border-none print:w-full">
        {/* Modal Controls (Hidden in Print) */}
        <div className="px-6 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">Extra Fee Official Receipt</h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    payment.approvalStatus === 'APPROVED'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : payment.approvalStatus === 'PENDING_APPROVAL'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {payment.approvalStatus.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">{payment.receiptNo}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Copy Type Selector */}
            <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-[10px] font-medium">
              <button
                type="button"
                onClick={() => setCopyType('STUDENT')}
                className={`px-2 py-1 rounded-md transition ${
                  copyType === 'STUDENT' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => setCopyType('OFFICE')}
                className={`px-2 py-1 rounded-md transition ${
                  copyType === 'OFFICE' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                Office
              </button>
            </div>

            {isAdmin && payment.approvalStatus === 'PENDING_APPROVAL' && onApprove && (
              <button
                onClick={() => {
                  onApprove(payment.id);
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Approve
              </button>
            )}

            {/* Download PDF Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              title="Download high-resolution official PDF receipt"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  PDF...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  PDF
                </>
              )}
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              title="Print receipt or print to PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Audit Status Bar (Hidden in print) */}
        {payment.approvalStatus === 'PENDING_APPROVAL' && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between text-xs text-amber-900 print:hidden">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Provisional Receipt:</strong> Awaiting Director / Admin verification and ledger seal.
              </span>
            </div>
            {isAdmin && onReject && !showRejectBox && (
              <button
                onClick={() => setShowRejectBox(true)}
                className="text-rose-700 hover:text-rose-900 font-bold underline text-[11px] cursor-pointer"
              >
                Reject Voucher
              </button>
            )}
          </div>
        )}

        {payment.approvalStatus === 'APPROVED' && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2 flex items-center gap-2 text-xs text-emerald-900 print:hidden">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Verified & Sealed:</strong> Approved by {payment.approvedByAdminName || settings.directorName}{' '}
              {payment.approvalDate && `on ${payment.approvalDate}`}
            </span>
          </div>
        )}

        {payment.approvalStatus === 'REJECTED' && (
          <div className="bg-rose-50 border-b border-rose-200 px-6 py-2.5 text-xs text-rose-900 print:hidden">
            <div className="flex items-center gap-2 font-bold">
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Voucher Rejected / Cancelled by Admin</span>
            </div>
            {payment.rejectionReason && (
              <p className="text-[11px] text-rose-700 mt-0.5 ml-6">
                Reason: {payment.rejectionReason}
              </p>
            )}
          </div>
        )}

        {/* Reject Dialog Box */}
        {showRejectBox && onReject && (
          <div className="bg-rose-50 border-b border-rose-200 p-4 text-xs print:hidden">
            <div className="flex items-center gap-2 text-rose-800 font-bold mb-1">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Reject this Extra Fee Collection Voucher</span>
            </div>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (e.g. UPI payment not credited or invalid transaction)..."
              rows={2}
              className="w-full p-2 bg-white border border-rose-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setShowRejectBox(false)}
                className="px-3 py-1 text-slate-600 hover:bg-slate-100 rounded text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onReject(payment.id, rejectReason || 'Declined during Admin physical cash/bank audit');
                  setShowRejectBox(false);
                }}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1 rounded text-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        )}

        {/* Printable Receipt Body */}
        <div
          id="printable-extra-fee-receipt"
          ref={printableRef}
          className="p-8 text-slate-800 text-xs print:p-4 relative bg-white"
        >
          {/* Watermark for Rejected or Provisional */}
          {payment.approvalStatus === 'REJECTED' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 opacity-15">
              <span className="text-7xl font-black text-rose-600 uppercase transform -rotate-12 border-4 border-rose-600 p-4 rounded-xl">
                VOID / REJECTED
              </span>
            </div>
          )}

          {payment.approvalStatus === 'PENDING_APPROVAL' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 opacity-10">
              <span className="text-5xl font-black text-amber-600 uppercase transform -rotate-12 border-4 border-amber-600 p-4 rounded-xl text-center leading-tight">
                PROVISIONAL<br />PENDING AUDIT
              </span>
            </div>
          )}

          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-4 text-center relative">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-indigo-900 text-white font-black text-sm flex items-center justify-center">
                {settings.name.charAt(0)}
              </div>
              <h1 className="text-lg font-black tracking-tight text-slate-950 uppercase">
                {settings.name}
              </h1>
            </div>
            <p className="text-[11px] text-slate-600 font-medium">{settings.tagline}</p>
            <div className="text-[10px] text-slate-500 mt-1 flex flex-wrap justify-center gap-x-3">
              <span>Reg: {settings.regNo}</span>
              <span>•</span>
              <span>{settings.isoCertified}</span>
              <span>•</span>
              <span>GST: {settings.gstNo}</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {settings.address}, {settings.city} | Ph: {settings.phone}
            </div>

            {/* Receipt Title Banner & Copy Marker */}
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="inline-block bg-slate-900 text-white font-extrabold text-[11px] uppercase tracking-wider px-3.5 py-1 rounded-full">
                {getCategoryTitle(payment.feeCategory)}
              </span>
              <span className="inline-block bg-indigo-100 text-indigo-900 font-bold text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-indigo-200">
                {copyType === 'STUDENT' ? 'Student Copy' : copyType === 'OFFICE' ? 'Office Copy' : 'Duplicate'}
              </span>
            </div>
          </div>

          {/* Meta Info Bar */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4 font-mono text-[11px]">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-sans font-bold">
                Receipt Number
              </span>
              <span className="font-bold text-slate-900">{payment.receiptNo}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block text-[10px] uppercase font-sans font-bold">
                Date & Time
              </span>
              <span className="font-bold text-slate-900">
                {formatDate(payment.date)} • {payment.time}
              </span>
            </div>
          </div>

          {/* Student Details */}
          <div className="grid grid-cols-2 gap-3 mb-4 pb-3 border-b border-slate-200">
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">
                Student Name
              </span>
              <span className="font-bold text-slate-900 text-sm">{payment.studentName}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 text-[10px] uppercase font-bold block">
                Student ID / Roll No
              </span>
              <span className="font-bold text-indigo-900 font-mono text-xs bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                {payment.studentRollNo}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500 text-[10px] uppercase font-bold block">
                Registered Course
              </span>
              <span className="font-semibold text-slate-800">{payment.courseName}</span>
            </div>
          </div>

          {/* Fee Itemization Table */}
          <table className="w-full text-left mb-4 border border-slate-200">
            <thead className="bg-slate-100 text-slate-700 text-[10px] uppercase">
              <tr>
                <th className="py-2 px-3 border-b border-slate-200">Fee Particulars</th>
                <th className="py-2 px-3 border-b border-slate-200">Event / Session</th>
                <th className="py-2 px-3 border-b border-slate-200 text-right">Amount (INR)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-3 px-3 border-b border-slate-200">
                  <div className="font-bold text-slate-900">{payment.feeTitle || payment.feeTypeName}</div>
                  <div className="text-[10px] text-slate-500">
                    Category: {(payment.feeCategory || payment.feeType || 'OTHER').replace('_', ' ')}
                  </div>
                </td>
                <td className="py-3 px-3 border-b border-slate-200 font-medium text-slate-700">
                  {payment.sessionOrEventYear || payment.academicYear || 'Academic Session 2026-27'}
                </td>
                <td className="py-3 px-3 border-b border-slate-200 text-right font-bold font-mono text-slate-900">
                  {formatCurrency(payment.amount)}
                </td>
              </tr>
              <tr className="bg-slate-50 font-bold">
                <td colSpan={2} className="py-2 px-3 text-right text-slate-700">
                  Total Amount Received:
                </td>
                <td className="py-2 px-3 text-right font-mono text-base text-emerald-800">
                  {formatCurrency(payment.amount)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Payment Mode and Remarks */}
          <div className="grid grid-cols-2 gap-4 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px]">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">
                Payment Mode
              </span>
              <span className="font-bold text-slate-900 uppercase">{payment.paymentMode}</span>
              {payment.transactionRef && (
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                  Ref: {payment.transactionRef}
                </div>
              )}
            </div>
            <div className="text-right">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">
                Collected By
              </span>
              <span className="font-semibold text-slate-800">{payment.collectedByStaffName}</span>
              <div className="mt-0.5">
                {payment.approvalStatus === 'APPROVED' ? (
                  <span className="text-[10px] text-emerald-700 font-bold inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Admin Audited & Sealed
                  </span>
                ) : payment.approvalStatus === 'PENDING_APPROVAL' ? (
                  <span className="text-[10px] text-amber-700 font-bold inline-flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-600" />
                    Pending Admin Audit
                  </span>
                ) : (
                  <span className="text-[10px] text-rose-700 font-bold inline-flex items-center gap-1">
                    <XCircle className="w-3 h-3 text-rose-600" />
                    Voucher Rejected
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Official Audit & Seal Block */}
          {payment.approvalStatus === 'APPROVED' && (
            <div className="mb-4 p-2.5 bg-emerald-50/60 border border-emerald-200 rounded-lg flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5 text-emerald-900 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>
                  Official Authorization: <strong>{payment.approvedByAdminName || `${settings.directorName} (Director)`}</strong>
                </span>
              </div>
              {payment.approvalDate && (
                <span className="text-emerald-800 font-mono">
                  Sealed: {payment.approvalDate}
                </span>
              )}
            </div>
          )}

          {/* Signatures */}
          <div className="pt-6 grid grid-cols-2 gap-6 items-end">
            <div>
              <div className="w-36 border-b border-slate-400 mb-1"></div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                Cashier / Student Signature
              </span>
            </div>
            <div className="text-right">
              <div className="text-xs font-serif italic font-bold text-indigo-950 mb-1">
                {payment.approvedByAdminName || settings.directorName}
              </div>
              <div className="w-40 border-b border-slate-400 mb-1 ml-auto"></div>
              <span className="text-[10px] text-slate-700 font-bold uppercase tracking-wider block">
                {settings.directorTitle}
              </span>
              <span className="text-[9px] text-slate-500">{settings.name}</span>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-6 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-400">
            {payment.approvalStatus === 'APPROVED'
              ? 'This is an official computer-generated institutional receipt, verified and sealed by Institute Administration.'
              : 'This is a provisional receipt. Final enrollment and examination clearance is subject to Director audit.'}
          </div>
        </div>

        {/* Modal Footer (Hidden in print) */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between print:hidden">
          <span className="text-xs text-slate-500">
            Official Copy • Press Print or save as PDF
          </span>
          <div className="flex items-center gap-2">
            {isAdmin && payment.approvalStatus === 'PENDING_APPROVAL' && onApprove && (
              <button
                onClick={() => {
                  onApprove(payment.id);
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve & Seal Voucher
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

