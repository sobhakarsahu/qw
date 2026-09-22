import React, { useState } from 'react';
import {
  FeePayment,
  ExtraFeePayment,
  Student,
  InstituteSettings,
  UserRole,
  ApprovalStatus,
  PaymentMode,
} from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  AlertTriangle,
  UserCheck,
  Receipt,
  Search,
  Check,
  Lock,
  FileCheck2,
  CalendarDays,
  Layers,
  Sparkles,
  Edit3,
  Trash2,
  X,
  CreditCard,
  Banknote,
  DollarSign,
} from 'lucide-react';
import { ReceiptModal } from './ReceiptModal';
import { ExtraFeeReceiptModal } from './ExtraFeeReceiptModal';

interface UnifiedApprovalItem {
  id: string;
  sourceType: 'TUITION' | 'EXTRA_FEE';
  receiptNo: string;
  studentId: string;
  studentName: string;
  studentRollNo: string;
  courseName: string;
  amount: number;
  paymentMode: string;
  transactionRef?: string;
  date: string;
  time?: string;
  collectedByStaffName: string;
  approvalStatus: ApprovalStatus;
  approvedByAdminName?: string;
  approvalDate?: string;
  rejectionReason?: string;
  particulars: string;
  rawTuition?: FeePayment;
  rawExtraFee?: ExtraFeePayment;
}

interface FeeApprovalsProps {
  payments: FeePayment[];
  extraFeePayments?: ExtraFeePayment[];
  students: Student[];
  settings: InstituteSettings;
  onApprovePayment: (paymentId: string) => void;
  onRejectPayment: (paymentId: string, reason: string) => void;
  onBatchApprove: (paymentIds: string[]) => void;
  onApproveExtraFee?: (extraFeeId: string) => void;
  onRejectExtraFee?: (extraFeeId: string, reason: string) => void;
  onBatchApproveExtraFees?: (extraFeeIds: string[]) => void;
  onUpdatePayment?: (payment: FeePayment) => void;
  onDeletePayment?: (paymentId: string) => void;
  onUpdateExtraFeePayment?: (payment: ExtraFeePayment) => void;
  onDeleteExtraFeePayment?: (paymentId: string) => void;
  currentRole?: UserRole;
}

export const FeeApprovals: React.FC<FeeApprovalsProps> = ({
  payments,
  extraFeePayments = [],
  students,
  settings,
  onApprovePayment,
  onRejectPayment,
  onBatchApprove,
  onApproveExtraFee,
  onRejectExtraFee,
  onBatchApproveExtraFees,
  onUpdatePayment,
  onDeletePayment,
  onUpdateExtraFeePayment,
  onDeleteExtraFeePayment,
  currentRole = 'admin',
}) => {
  const isAdmin = currentRole === 'admin';
  const [selectedReceipt, setSelectedReceipt] = useState<FeePayment | null>(null);
  const [selectedExtraReceipt, setSelectedExtraReceipt] = useState<ExtraFeePayment | null>(null);

  const [rejectingItem, setRejectingItem] = useState<UnifiedApprovalItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Edit & Delete Collection States
  const [editingItem, setEditingItem] = useState<UnifiedApprovalItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<UnifiedApprovalItem | null>(null);

  // Edit Collection Form State
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editPaymentMode, setEditPaymentMode] = useState<PaymentMode>('cash');
  const [editTransactionRef, setEditTransactionRef] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editCollectedByStaffName, setEditCollectedByStaffName] = useState('');
  const [editParticulars, setEditParticulars] = useState('');
  const [editApprovalStatus, setEditApprovalStatus] = useState<ApprovalStatus>('APPROVED');
  const [editRejectionReason, setEditRejectionReason] = useState('');

  const [categoryDesk, setCategoryDesk] = useState<'ALL' | 'TUITION' | 'EXTRA_FEE'>('ALL');
  const [filterTab, setFilterTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemKeys, setSelectedItemKeys] = useState<string[]>([]); // "TUITION:id" or "EXTRA_FEE:id"

  const handleOpenEditItem = (item: UnifiedApprovalItem) => {
    setEditingItem(item);
    setEditAmount(item.amount);
    setEditPaymentMode(item.paymentMode as PaymentMode);
    setEditTransactionRef(item.transactionRef || '');
    setEditDate(item.date);
    setEditTime(item.time || '10:00 AM');
    setEditCollectedByStaffName(item.collectedByStaffName);
    setEditParticulars(item.particulars);
    setEditApprovalStatus(item.approvalStatus);
    setEditRejectionReason(item.rejectionReason || '');
  };

  const handleSaveEditedItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (editingItem.sourceType === 'TUITION' && editingItem.rawTuition && onUpdatePayment) {
      const updatedPayment: FeePayment = {
        ...editingItem.rawTuition,
        amount: Number(editAmount),
        paymentMode: editPaymentMode,
        transactionRef: editTransactionRef.trim() || undefined,
        date: editDate,
        time: editTime,
        collectedByStaffName: editCollectedByStaffName.trim(),
        remarks: editParticulars.trim(),
        approvalStatus: editApprovalStatus,
        rejectionReason: editApprovalStatus === 'REJECTED' ? editRejectionReason.trim() : undefined,
        approvedByAdminName:
          editApprovalStatus === 'APPROVED'
            ? editingItem.rawTuition.approvedByAdminName || `${settings.directorName} (Director)`
            : undefined,
        approvalDate:
          editApprovalStatus === 'APPROVED'
            ? editingItem.rawTuition.approvalDate || new Date().toISOString().split('T')[0]
            : undefined,
      };
      onUpdatePayment(updatedPayment);
    } else if (
      editingItem.sourceType === 'EXTRA_FEE' &&
      editingItem.rawExtraFee &&
      onUpdateExtraFeePayment
    ) {
      const updatedExtra: ExtraFeePayment = {
        ...editingItem.rawExtraFee,
        amount: Number(editAmount),
        paymentMode: editPaymentMode as any,
        transactionRef: editTransactionRef.trim() || undefined,
        date: editDate,
        time: editTime,
        collectedByStaffName: editCollectedByStaffName.trim(),
        feeTitle: editParticulars.trim(),
        approvalStatus: editApprovalStatus,
        rejectionReason: editApprovalStatus === 'REJECTED' ? editRejectionReason.trim() : undefined,
        approvedByAdminName:
          editApprovalStatus === 'APPROVED'
            ? editingItem.rawExtraFee.approvedByAdminName || `${settings.directorName} (Director)`
            : undefined,
        approvalDate:
          editApprovalStatus === 'APPROVED'
            ? editingItem.rawExtraFee.approvalDate || new Date().toISOString().split('T')[0]
            : undefined,
      };
      onUpdateExtraFeePayment(updatedExtra);
    }

    setEditingItem(null);
  };

  const handleConfirmDeleteItem = () => {
    if (!deletingItem) return;

    if (deletingItem.sourceType === 'TUITION' && onDeletePayment) {
      onDeletePayment(deletingItem.id);
    } else if (deletingItem.sourceType === 'EXTRA_FEE' && onDeleteExtraFeePayment) {
      onDeleteExtraFeePayment(deletingItem.id);
    }

    setDeletingItem(null);
  };

  // Unified items
  const tuitionItems: UnifiedApprovalItem[] = payments.map((p) => ({
    id: p.id,
    sourceType: 'TUITION',
    receiptNo: p.receiptNo,
    studentId: p.studentId,
    studentName: p.studentName,
    studentRollNo: p.studentRollNo,
    courseName: p.courseName,
    amount: p.amount,
    paymentMode: p.paymentMode,
    transactionRef: p.transactionRef,
    date: p.date,
    time: p.time,
    collectedByStaffName: p.collectedByStaffName,
    approvalStatus: p.approvalStatus,
    approvedByAdminName: p.approvedByAdminName,
    approvalDate: p.approvalDate,
    rejectionReason: p.rejectionReason,
    particulars:
      p.remarks ||
      (p.installmentNos && p.installmentNos.length > 0
        ? `Installment #${p.installmentNos.join(', ')}`
        : 'Course Tuition Fee Installment'),
    rawTuition: p,
  }));

  const extraItems: UnifiedApprovalItem[] = extraFeePayments.map((x) => ({
    id: x.id,
    sourceType: 'EXTRA_FEE',
    receiptNo: x.receiptNo,
    studentId: x.studentId,
    studentName: x.studentName,
    studentRollNo: x.studentRollNo,
    courseName: x.courseName,
    amount: x.amount,
    paymentMode: x.paymentMode,
    transactionRef: x.transactionRef,
    date: x.date,
    time: x.time,
    collectedByStaffName: x.collectedByStaffName,
    approvalStatus: x.approvalStatus,
    approvedByAdminName: x.approvedByAdminName,
    approvalDate: x.approvalDate,
    rejectionReason: x.rejectionReason,
    particulars: x.feeTitle || x.feeTypeName || (x.feeType === 'FORM_FILLUP' ? 'Form Fillup Fee' : 'Annual Day Fee'),
    rawExtraFee: x,
  }));

  const allItems = [...tuitionItems, ...extraItems].sort(
    (a, b) => new Date(`${b.date} ${b.time || '00:00'}`).getTime() - new Date(`${a.date} ${a.time || '00:00'}`).getTime()
  );

  // Filter by category desk
  const deskItems =
    categoryDesk === 'ALL'
      ? allItems
      : categoryDesk === 'TUITION'
      ? tuitionItems
      : extraItems;

  const pendingItems = deskItems.filter((i) => i.approvalStatus === 'PENDING_APPROVAL');
  const approvedItems = deskItems.filter((i) => i.approvalStatus === 'APPROVED');
  const rejectedItems = deskItems.filter((i) => i.approvalStatus === 'REJECTED');

  const currentList =
    filterTab === 'pending'
      ? pendingItems
      : filterTab === 'approved'
      ? approvedItems
      : rejectedItems;

  const filteredList = currentList.filter(
    (p) =>
      p.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.studentRollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.receiptNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.collectedByStaffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.particulars.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Summary figures
  const pendingTuitionCount = payments.filter((p) => p.approvalStatus === 'PENDING_APPROVAL').length;
  const pendingTuitionAmount = payments
    .filter((p) => p.approvalStatus === 'PENDING_APPROVAL')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const pendingExtraCount = extraFeePayments.filter((p) => p.approvalStatus === 'PENDING_APPROVAL').length;
  const pendingExtraAmount = extraFeePayments
    .filter((p) => p.approvalStatus === 'PENDING_APPROVAL')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalAllPendingCount = pendingTuitionCount + pendingExtraCount;
  const totalAllPendingAmount = pendingTuitionAmount + pendingExtraAmount;

  // Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedItemKeys(filteredList.map((p) => `${p.sourceType}:${p.id}`));
    } else {
      setSelectedItemKeys([]);
    }
  };

  const handleToggleSelect = (itemKey: string) => {
    setSelectedItemKeys((prev) =>
      prev.includes(itemKey) ? prev.filter((k) => k !== itemKey) : [...prev, itemKey]
    );
  };

  const handleExecuteBatchApprove = () => {
    if (selectedItemKeys.length === 0) return;

    const tuitionIds: string[] = [];
    const extraIds: string[] = [];

    selectedItemKeys.forEach((key) => {
      const [source, id] = key.split(':');
      if (source === 'TUITION') {
        tuitionIds.push(id);
      } else if (source === 'EXTRA_FEE') {
        extraIds.push(id);
      }
    });

    if (tuitionIds.length > 0) {
      onBatchApprove(tuitionIds);
    }
    if (extraIds.length > 0 && onBatchApproveExtraFees) {
      onBatchApproveExtraFees(extraIds);
    }

    setSelectedItemKeys([]);
  };

  const handleSingleApprove = (item: UnifiedApprovalItem) => {
    if (item.sourceType === 'TUITION') {
      onApprovePayment(item.id);
    } else if (item.sourceType === 'EXTRA_FEE' && onApproveExtraFee) {
      onApproveExtraFee(item.id);
    }
  };

  const handleConfirmReject = () => {
    if (!rejectingItem) return;
    const finalReason = rejectReason.trim() || 'Declined during Admin physical cash/bank audit';

    if (rejectingItem.sourceType === 'TUITION') {
      onRejectPayment(rejectingItem.id, finalReason);
    } else if (rejectingItem.sourceType === 'EXTRA_FEE' && onRejectExtraFee) {
      onRejectExtraFee(rejectingItem.id, finalReason);
    }

    setRejectingItem(null);
    setRejectReason('');
  };

  const handleOpenReceipt = (item: UnifiedApprovalItem) => {
    if (item.sourceType === 'TUITION' && item.rawTuition) {
      setSelectedReceipt(item.rawTuition);
    } else if (item.sourceType === 'EXTRA_FEE' && item.rawExtraFee) {
      setSelectedExtraReceipt(item.rawExtraFee);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-indigo-500/30 text-indigo-200 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-indigo-400/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                {isAdmin ? 'Director / Admin Audit & Seal Desk' : 'Staff Collection Audit Log'}
              </span>
              <span className="text-xs text-slate-300">• Tuition & Extra Fees Authorization</span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">
              Fee Collections & Approvals Desk
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              {isAdmin
                ? 'Review counter collections, physical cash in drawer, and bank UPI receipts for both regular tuition fees and extra fees (Form Fillup & Annual Day) before officially sealing vouchers.'
                : 'Track the verification status of fees collected by front desk staff. Staff members can monitor audit progress, but official voucher seal requires Director authorization.'}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15 min-w-[220px]">
            <div className="text-xs text-slate-300 uppercase tracking-wider font-semibold">
              Total Pending Admin Audit
            </div>
            <div className="text-2xl font-extrabold text-amber-300 font-mono mt-0.5">
              {formatCurrency(totalAllPendingAmount)}
            </div>
            <div className="text-xs text-slate-300 mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{totalAllPendingCount} collection vouchers awaiting review</span>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Authorization Notice (If Staff) */}
      {!isAdmin && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3 text-amber-900 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0 border border-amber-500/30 mt-0.5">
            <Lock className="w-5 h-5 text-amber-700" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-amber-950">
                Staff Authorization Notice: Fee Approval Prohibited
              </h3>
              <span className="bg-amber-200 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                Staff have no right to fees approved
              </span>
            </div>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
              Front desk staff can collect tuition payments and extra fees (Form Fillup, Annual Day) and generate provisional receipts. Official ledger sealing, income credit, and exam registration require verification by the Director / Admin.
            </p>
          </div>
        </div>
      )}

      {/* Audit KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pending Card */}
        <div
          onClick={() => {
            setCategoryDesk('ALL');
            setFilterTab('pending');
          }}
          className="bg-white rounded-xl p-4 border border-amber-200 shadow-xs flex items-center gap-3.5 cursor-pointer hover:border-amber-400 transition"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">
              All Pending Collections
            </div>
            <div className="text-xl font-extrabold text-slate-900 font-mono">
              {formatCurrency(totalAllPendingAmount)}
            </div>
            <div className="text-[10px] text-slate-500">
              {totalAllPendingCount} total vouchers awaiting seal
            </div>
          </div>
        </div>

        {/* Pending Tuition Card */}
        <div
          onClick={() => {
            setCategoryDesk('TUITION');
            setFilterTab('pending');
          }}
          className="bg-white rounded-xl p-4 border border-indigo-200 shadow-xs flex items-center gap-3.5 cursor-pointer hover:border-indigo-400 transition"
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-indigo-800 uppercase tracking-wide">
              Pending Tuition Fees
            </div>
            <div className="text-xl font-extrabold text-indigo-900 font-mono">
              {formatCurrency(pendingTuitionAmount)}
            </div>
            <div className="text-[10px] text-slate-500">
              {pendingTuitionCount} installment payments
            </div>
          </div>
        </div>

        {/* Pending Extra Fees Card (Form Fillup & Annual Day) */}
        <div
          onClick={() => {
            setCategoryDesk('EXTRA_FEE');
            setFilterTab('pending');
          }}
          className="bg-white rounded-xl p-4 border border-amber-300 shadow-xs flex items-center gap-3.5 cursor-pointer hover:border-amber-500 transition"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-100/60 border border-amber-300 text-amber-800 flex items-center justify-center shrink-0">
            <FileCheck2 className="w-6 h-6 text-amber-700" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wide flex items-center gap-1">
              <span>Pending Extra Fees</span>
              {pendingExtraCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              )}
            </div>
            <div className="text-xl font-extrabold text-amber-950 font-mono">
              {formatCurrency(pendingExtraAmount)}
            </div>
            <div className="text-[10px] text-slate-600">
              {pendingExtraCount} Form Fillup & Annual Day
            </div>
          </div>
        </div>

        {/* Approved Total Card */}
        <div
          onClick={() => {
            setCategoryDesk('ALL');
            setFilterTab('approved');
          }}
          className="bg-white rounded-xl p-4 border border-emerald-200 shadow-xs flex items-center gap-3.5 cursor-pointer hover:border-emerald-400 transition"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
              Audited & Sealed
            </div>
            <div className="text-xl font-extrabold text-emerald-700 font-mono">
              {formatCurrency(
                payments
                  .filter((p) => p.approvalStatus === 'APPROVED')
                  .reduce((a, b) => a + b.amount, 0) +
                  extraFeePayments
                    .filter((p) => p.approvalStatus === 'APPROVED')
                    .reduce((a, b) => a + b.amount, 0)
              )}
            </div>
            <div className="text-[10px] text-slate-500">
              {payments.filter((p) => p.approvalStatus === 'APPROVED').length +
                extraFeePayments.filter((p) => p.approvalStatus === 'APPROVED').length}{' '}
              collections verified
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Category Controls */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3">
        {/* Category Desk Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase mr-1">Desk View:</span>
            <button
              onClick={() => {
                setCategoryDesk('ALL');
                setSelectedItemKeys([]);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                categoryDesk === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Collections ({allItems.length})</span>
            </button>

            <button
              onClick={() => {
                setCategoryDesk('TUITION');
                setSelectedItemKeys([]);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                categoryDesk === 'TUITION'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Tuition Fees ({tuitionItems.length})</span>
            </button>

            <button
              onClick={() => {
                setCategoryDesk('EXTRA_FEE');
                setSelectedItemKeys([]);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                categoryDesk === 'EXTRA_FEE'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow-2xs'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Extra Fees: Form Fillup & Annual Day ({extraItems.length})</span>
              {pendingExtraCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-amber-300 text-amber-950 text-[10px] font-black rounded-full">
                  {pendingExtraCount}
                </span>
              )}
            </button>
          </div>

          {/* Batch Approve button for Admin */}
          {isAdmin && selectedItemKeys.length > 0 && filterTab === 'pending' && (
            <button
              onClick={handleExecuteBatchApprove}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Approve Selected ({selectedItemKeys.length})</span>
            </button>
          )}
        </div>

        {/* Status Tabs and Search Input */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setFilterTab('pending');
                setSelectedItemKeys([]);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                filterTab === 'pending'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow-2xs'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pending Audit ({pendingItems.length})</span>
            </button>

            <button
              onClick={() => {
                setFilterTab('approved');
                setSelectedItemKeys([]);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                filterTab === 'approved'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Approved & Sealed ({approvedItems.length})</span>
            </button>

            <button
              onClick={() => {
                setFilterTab('rejected');
                setSelectedItemKeys([]);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                filterTab === 'rejected'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Rejected ({rejectedItems.length})</span>
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by student, roll, receipt, particulars..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Approvals Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                {isAdmin && filterTab === 'pending' && (
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={
                        filteredList.length > 0 &&
                        selectedItemKeys.length === filteredList.length
                      }
                      onChange={handleSelectAll}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                )}
                <th className="py-3 px-4">Receipt / Date</th>
                <th className="py-3 px-4">Category & Purpose</th>
                <th className="py-3 px-4">Student Details</th>
                <th className="py-3 px-4">Collected By</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Payment Mode</th>
                <th className="py-3 px-4 text-center">Status / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAdmin && filterTab === 'pending' ? 8 : 7}
                    className="py-12 text-center text-slate-400"
                  >
                    <ShieldCheck className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">No collection records found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {filterTab === 'pending'
                        ? 'All collection vouchers in this queue have been verified and sealed by Admin.'
                        : 'No records match the active filters.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => {
                  const itemKey = `${item.sourceType}:${item.id}`;
                  const isPending = item.approvalStatus === 'PENDING_APPROVAL';

                  return (
                    <tr key={itemKey} className="hover:bg-slate-50 transition-colors">
                      {isAdmin && filterTab === 'pending' && (
                        <td className="py-3.5 px-4">
                          <input
                            type="checkbox"
                            checked={selectedItemKeys.includes(itemKey)}
                            onChange={() => handleToggleSelect(itemKey)}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>
                      )}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-bold text-indigo-700">{item.receiptNo}</div>
                        <div className="text-[10px] text-slate-400">
                          {formatDate(item.date)} {item.time && `• ${item.time}`}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="mb-1">
                          {item.sourceType === 'EXTRA_FEE' ? (
                            <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 border border-amber-200">
                              <FileCheck2 className="w-3 h-3 text-amber-700" />
                              Extra Fee Desk
                            </span>
                          ) : (
                            <span className="bg-indigo-100 text-indigo-900 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 border border-indigo-200">
                              <Receipt className="w-3 h-3 text-indigo-700" />
                              Tuition Installment
                            </span>
                          )}
                        </div>
                        <div className="font-semibold text-slate-900">{item.particulars}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[200px]">
                          {item.courseName}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{item.studentName}</div>
                        <div className="text-[11px] text-indigo-700 font-mono font-semibold">
                          ID: {item.studentRollNo}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        <div className="flex items-center gap-1 font-medium">
                          <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{item.collectedByStaffName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="bg-slate-100 text-slate-700 text-[10px] font-mono uppercase px-2 py-0.5 rounded border border-slate-200 block max-w-min mx-auto">
                          {item.paymentMode}
                        </span>
                        {item.transactionRef && (
                          <div
                            className="text-[10px] text-slate-500 font-mono mt-0.5 max-w-[120px] truncate mx-auto"
                            title={item.transactionRef}
                          >
                            {item.transactionRef}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* View Receipt Button */}
                          <button
                            onClick={() => handleOpenReceipt(item)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                            title="View Official Receipt"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-600" />
                            <span className="text-[11px]">Receipt</span>
                          </button>

                          {/* Admin Rights: Edit and Delete Fee Collections */}
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => handleOpenEditItem(item)}
                                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 p-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                                title="Edit Fee Collection Voucher (Admin Right)"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                                <span className="text-[11px]">Edit</span>
                              </button>

                              <button
                                onClick={() => setDeletingItem(item)}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 p-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                                title="Delete Fee Collection Voucher (Admin Right)"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                <span className="text-[11px]">Delete</span>
                              </button>
                            </>
                          )}

                          {/* Approval Status & Controls */}
                          {item.approvalStatus === 'PENDING_APPROVAL' && (
                            <>
                              {isAdmin ? (
                                <>
                                  <button
                                    onClick={() => handleSingleApprove(item)}
                                    title="Verify & Seal Collection"
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Approve</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setRejectingItem(item);
                                      setRejectReason('');
                                    }}
                                    title="Reject Collection Voucher"
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

                          {item.approvalStatus === 'APPROVED' && (
                            <span
                              title={`Approved by ${item.approvedByAdminName || settings.directorName} ${item.approvalDate ? `(${item.approvalDate})` : ''}`}
                              className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Approved
                            </span>
                          )}

                          {item.approvalStatus === 'REJECTED' && (
                            <span
                              title={item.rejectionReason ? `Reason: ${item.rejectionReason}` : 'Rejected by Admin'}
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

      {/* Reject Reason Dialog */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-6 max-w-md w-full">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-base mb-2">
              <AlertTriangle className="w-5 h-5" />
              Reject Collection Voucher
            </div>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              You are rejecting receipt{' '}
              <strong className="font-mono text-slate-900">{rejectingItem.receiptNo}</strong> for{' '}
              <strong>{rejectingItem.studentName}</strong> ({formatCurrency(rejectingItem.amount)}).
              State the reason for this rejection:
            </p>
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-700 block">
                Audit Reason:
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Physical cash short, bank transaction reference not found, fake voucher..."
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                rows={3}
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => {
                  setRejectingItem(null);
                  setRejectReason('');
                }}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="bg-rose-600 hover:bg-rose-500 text-white text-xs px-4 py-1.5 rounded-lg font-semibold transition shadow-xs cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tuition Receipt Modal */}
      {selectedReceipt && (
        <ReceiptModal
          payment={selectedReceipt}
          student={students.find((s) => s.id === selectedReceipt.studentId) || students[0]}
          settings={settings}
          onClose={() => setSelectedReceipt(null)}
        />
      )}

      {/* Extra Fee Receipt Modal */}
      {selectedExtraReceipt && (
        <ExtraFeeReceiptModal
          payment={selectedExtraReceipt}
          settings={settings}
          onClose={() => setSelectedExtraReceipt(null)}
          onApprove={(id) => {
            if (onApproveExtraFee) onApproveExtraFee(id);
            setSelectedExtraReceipt((prev) =>
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
            setSelectedExtraReceipt((prev) =>
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

      {/* Admin Edit Fee Collection Voucher Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-6">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-600 rounded-lg">
                  <Edit3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Edit Fee Collection Voucher</h3>
                  <p className="text-xs text-slate-300 font-mono">
                    Receipt #{editingItem.receiptNo} • {editingItem.studentName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedItem} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex items-center justify-between text-indigo-900">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    Admin Override: Modify collected amount, payment mode, audit status, and timestamps.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Student Info (Read-only banner) */}
                <div className="sm:col-span-2 bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex justify-between items-center font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Trainee</span>
                    <strong className="text-slate-900 text-xs">{editingItem.studentName} ({editingItem.studentRollNo})</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block text-[10px]">Category</span>
                    <strong className="text-indigo-700 text-xs">{editingItem.sourceType === 'TUITION' ? 'Tuition Fee' : 'Extra / Service Fee'}</strong>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Amount Collected (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editAmount}
                    onChange={(e) => setEditAmount(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Payment Mode */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Payment Mode *
                  </label>
                  <select
                    value={editPaymentMode}
                    onChange={(e) => setEditPaymentMode(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-indigo-500 uppercase"
                  >
                    <option value="cash">Cash (Physical Currency)</option>
                    <option value="upi">UPI / QR Code</option>
                    <option value="card">Debit / Credit Card</option>
                    <option value="netbanking">Net Banking</option>
                    <option value="cheque">Cheque</option>
                    <option value="bank_transfer">Direct Bank Transfer (NEFT/RTGS)</option>
                  </select>
                </div>

                {/* Transaction Ref */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Transaction Ref / Cheque No / UTR
                  </label>
                  <input
                    type="text"
                    value={editTransactionRef}
                    onChange={(e) => setEditTransactionRef(e.target.value)}
                    placeholder="e.g. UPI-99882211, CHQ-556102"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Collected By Staff */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Collected By Staff *
                  </label>
                  <input
                    type="text"
                    required
                    value={editCollectedByStaffName}
                    onChange={(e) => setEditCollectedByStaffName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Collection Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Time */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Collection Time
                  </label>
                  <input
                    type="text"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    placeholder="e.g. 10:30 AM"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Particulars / Remarks */}
                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">
                    Particulars / Installment / Remarks *
                  </label>
                  <input
                    type="text"
                    required
                    value={editParticulars}
                    onChange={(e) => setEditParticulars(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Approval Status */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Audit Status *
                  </label>
                  <select
                    value={editApprovalStatus}
                    onChange={(e) => setEditApprovalStatus(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="APPROVED">APPROVED (Verified by Director)</option>
                    <option value="PENDING_APPROVAL">PENDING APPROVAL (Unverified)</option>
                    <option value="REJECTED">REJECTED (Flagged in Audit)</option>
                  </select>
                </div>

                {/* Rejection Reason if Rejected */}
                {editApprovalStatus === 'REJECTED' && (
                  <div>
                    <label className="font-semibold text-rose-700 block mb-1">
                      Audit Rejection Reason
                    </label>
                    <input
                      type="text"
                      value={editRejectionReason}
                      onChange={(e) => setEditRejectionReason(e.target.value)}
                      placeholder="e.g. Cash shortage, invalid reference"
                      className="w-full p-2.5 bg-rose-50 border border-rose-300 rounded-lg text-rose-900 focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                )}
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg font-bold transition shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Save Collection Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Delete Fee Collection Confirmation Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 max-w-md w-full">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-base mb-2">
              <div className="p-2 bg-rose-100 rounded-lg">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-slate-900 font-extrabold text-base">Delete Fee Collection Voucher</h3>
                <p className="text-xs text-rose-600 font-medium">Receipt #{deletingItem.receiptNo}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 my-4 leading-relaxed">
              Are you sure you want to permanently delete this fee collection voucher of{' '}
              <strong className="text-slate-900 font-mono">{formatCurrency(deletingItem.amount)}</strong> collected from{' '}
              <strong className="text-slate-900">{deletingItem.studentName}</strong>?
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5 text-xs text-slate-700 mb-4 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Receipt No:</span>
                <span className="font-bold text-indigo-700">{deletingItem.receiptNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Student Roll No:</span>
                <span>{deletingItem.studentRollNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Mode:</span>
                <span className="uppercase">{deletingItem.paymentMode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date Collected:</span>
                <span>{formatDate(deletingItem.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Particulars:</span>
                <span>{deletingItem.particulars}</span>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-800 text-[11px] mb-5 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>
                <strong>Admin Notice:</strong> Deleting this voucher will automatically reverse the payment amount from the student's recorded ledger balance and restore their pending fee dues.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteItem}
                className="bg-rose-600 hover:bg-rose-500 text-white text-xs px-4 py-2 rounded-lg font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Confirm Delete Voucher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
