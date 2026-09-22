import React, { useState, useMemo, useRef } from 'react';
import { IncomeExpenseItem, PaymentMode, TransactionType, FeePayment, UserRole, ApprovalStatus } from '../types';
import { formatCurrency, formatDate, downloadCSV } from '../utils/helpers';
import { downloadElementAsPdf, triggerPrint } from '../utils/printPdf';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PlusCircle,
  Download,
  Filter,
  Search,
  Receipt,
  Building,
  CreditCard,
  Banknote,
  X,
  CheckCircle2,
  Calendar,
  Layers,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  Lock,
  Check,
  Edit3,
  Trash2,
  AlertTriangle,
  FileText,
  Printer,
  ChevronRight,
  Sparkles,
  Loader2,
} from 'lucide-react';

interface IncomeExpenseProps {
  items: IncomeExpenseItem[];
  approvedPayments: FeePayment[];
  currentRole: UserRole;
  currentStaffName?: string;
  onAddItem: (item: IncomeExpenseItem) => void;
  onUpdateItem?: (item: IncomeExpenseItem) => void;
  onDeleteItem?: (itemId: string) => void;
  onApproveItem?: (itemId: string) => void;
  onRejectItem?: (itemId: string, reason?: string) => void;
  onBatchApproveItems?: (itemIds: string[]) => void;
  onBatchDeleteItems?: (itemIds: string[]) => void;
}

export const IncomeExpense: React.FC<IncomeExpenseProps> = ({
  items,
  approvedPayments,
  currentRole,
  currentStaffName = 'Front Desk Staff',
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onApproveItem,
  onRejectItem,
  onBatchApproveItems,
  onBatchDeleteItems,
}) => {
  const isAdmin = currentRole === 'admin';

  // Search & Filter State
  const [filterType, setFilterType] = useState<string>('ALL');
  const [approvalFilter, setApprovalFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState<TransactionType>('EXPENSE');

  // Edit Item State & Modal
  const [editingItem, setEditingItem] = useState<IncomeExpenseItem | null>(null);
  const [editType, setEditType] = useState<TransactionType>('EXPENSE');
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editDate, setEditDate] = useState('');
  const [editPaymentMode, setEditPaymentMode] = useState<PaymentMode>('upi');
  const [editReferenceId, setEditReferenceId] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState<ApprovalStatus>('APPROVED');
  const [editError, setEditError] = useState('');

  // Delete Confirmation Modal
  const [deletingItem, setDeletingItem] = useState<IncomeExpenseItem | null>(null);

  // Print Voucher Modal
  const [viewingVoucher, setViewingVoucher] = useState<IncomeExpenseItem | null>(null);

  // Selected Items for Batch Actions (Admin)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);

  // Print & PDF References and States
  const ledgerTableRef = useRef<HTMLDivElement>(null);
  const voucherPrintRef = useRef<HTMLDivElement>(null);
  const [isGeneratingLedgerPdf, setIsGeneratingLedgerPdf] = useState(false);
  const [isGeneratingVoucherPdf, setIsGeneratingVoucherPdf] = useState(false);

  const handlePrintLedger = () => {
    triggerPrint();
  };

  const handleDownloadLedgerPdf = async () => {
    if (!ledgerTableRef.current) return;
    setIsGeneratingLedgerPdf(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await downloadElementAsPdf(ledgerTableRef.current, {
        fileName: `DigiTech-Financial-Ledger-${today}.pdf`,
        orientation: 'landscape',
        format: 'a4',
        margin: 8,
      });
    } finally {
      setIsGeneratingLedgerPdf(false);
    }
  };

  const handleDownloadVoucherPdf = async () => {
    if (!voucherPrintRef.current || !viewingVoucher) return;
    setIsGeneratingVoucherPdf(true);
    try {
      const vRef = viewingVoucher.referenceId || viewingVoucher.id;
      await downloadElementAsPdf(voucherPrintRef.current, {
        fileName: `Voucher-${vRef}.pdf`,
        orientation: 'portrait',
        format: 'a4',
        margin: 8,
      });
    } finally {
      setIsGeneratingVoucherPdf(false);
    }
  };

  // Add Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Electricity & Lab Power');
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('upi');
  const [referenceId, setReferenceId] = useState('');
  const [description, setDescription] = useState('');

  const expenseCategories = [
    'Center Rent',
    'Electricity & Lab Power',
    'Faculty & Staff Salaries',
    'Internet & Networking',
    'Hardware & Maintenance',
    'Marketing & Pamphlets',
    'Tea & Pantry Refreshments',
    'Stationery & Certificates',
    'Software & Software Licenses',
    'Miscellaneous Expense',
  ];

  const incomeCategories = [
    'Course Fee Collection',
    'Study Material & Books',
    'Admission Registration Fees',
    'Re-Examination & Certification Fee',
    'Scrap Lab Hardware Sale',
    'Other Direct Income',
  ];

  // All recorded transactions
  const allTransactions: IncomeExpenseItem[] = [...items];

  // Official Approved Totals (Sanctioned by Admin)
  const approvedTransactions = allTransactions.filter(
    (i) => i.approvedStatus === 'APPROVED'
  );

  const pendingItems = allTransactions.filter(
    (i) => i.approvedStatus === 'PENDING_APPROVAL'
  );

  const totalIncome = approvedTransactions
    .filter((i) => i.type === 'INCOME')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = approvedTransactions
    .filter((i) => i.type === 'EXPENSE')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const netSurplus = totalIncome - totalExpense;

  const pendingExpenseSum = pendingItems
    .filter((i) => i.type === 'EXPENSE')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const pendingIncomeSum = pendingItems
    .filter((i) => i.type === 'INCOME')
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Filtered List
  const filteredItems = useMemo(() => {
    return allTransactions.filter((i) => {
      const matchType = filterType === 'ALL' || i.type === filterType;
      const matchApproval =
        approvalFilter === 'ALL' ||
        (approvalFilter === 'PENDING' && i.approvedStatus === 'PENDING_APPROVAL') ||
        (approvalFilter === 'APPROVED' && i.approvedStatus === 'APPROVED') ||
        (approvalFilter === 'REJECTED' && i.approvedStatus === 'REJECTED');

      const matchCategory =
        selectedCategoryFilter === 'ALL' || i.category === selectedCategoryFilter;

      const matchSearch =
        i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (i.referenceId && i.referenceId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        i.recordedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (i.description && i.description.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchType && matchApproval && matchCategory && matchSearch;
    });
  }, [allTransactions, filterType, approvalFilter, selectedCategoryFilter, searchQuery]);

  // Handle Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Date',
      'Type',
      'Category',
      'Title / Particulars',
      'Amount (Rs)',
      'Payment Mode',
      'Voucher / Ref No',
      'Recorded By',
      'Role',
      'Approval Status',
      'Approved By Admin',
      'Approval Date',
      'Notes / Description',
    ];
    const rows = filteredItems.map((t) => [
      t.date,
      t.type,
      `"${t.category}"`,
      `"${t.title.replace(/"/g, '""')}"`,
      t.amount,
      t.paymentMode,
      t.referenceId || '-',
      `"${t.recordedBy}"`,
      t.recordedByRole || 'staff',
      t.approvedStatus,
      t.approvedByAdminName || '-',
      t.approvalDate || '-',
      `"${(t.description || '').replace(/"/g, '""')}"`,
    ]);

    const content = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadCSV('income-expense-ledger.csv', content);
  };

  // Add Item Submit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || amount <= 0) return;

    const newItem: IncomeExpenseItem = {
      id: `ie-${Date.now()}`,
      type: modalType,
      category,
      amount: Number(amount),
      date,
      paymentMode,
      referenceId: referenceId.trim() || undefined,
      title: title.trim(),
      description: description.trim() || undefined,
      recordedBy: currentStaffName || (isAdmin ? 'Director Er. Alok Ranjan' : 'Front Desk Counter'),
      recordedByRole: currentRole,
      approvedStatus: isAdmin ? 'APPROVED' : 'PENDING_APPROVAL',
      approvedByAdminId: isAdmin ? 'admin-01' : undefined,
      approvedByAdminName: isAdmin ? (currentStaffName || 'Director Er. Alok Ranjan') : undefined,
      approvalDate: isAdmin ? `${date} ${new Date().toLocaleTimeString()}` : undefined,
    };

    onAddItem(newItem);
    setShowAddModal(false);

    // Reset
    setTitle('');
    setAmount(0);
    setReferenceId('');
    setDescription('');
  };

  // Open Edit Modal (Admin Protected)
  const handleOpenEditModal = (item: IncomeExpenseItem) => {
    if (!isAdmin) {
      alert('Security Notice: Only Institute Admin / Director has authority to edit income or expense ledger entries.');
      return;
    }
    setEditingItem(item);
    setEditType(item.type);
    setEditTitle(item.title);
    setEditCategory(item.category);
    setEditAmount(item.amount);
    setEditDate(item.date);
    setEditPaymentMode(item.paymentMode);
    setEditReferenceId(item.referenceId || '');
    setEditDescription(item.description || '');
    setEditStatus(item.approvedStatus);
    setEditError('');
  };

  // Save Edited Item
  const handleSaveEditItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Security Notice: Only Institute Admin has permission to save edits to financial ledger.');
      return;
    }

    if (!editingItem) return;
    if (!editTitle.trim()) {
      setEditError('Title / Particulars cannot be empty.');
      return;
    }
    if (editAmount <= 0) {
      setEditError('Amount must be greater than zero.');
      return;
    }

    const updatedItem: IncomeExpenseItem = {
      ...editingItem,
      type: editType,
      title: editTitle.trim(),
      category: editCategory.trim(),
      amount: Number(editAmount),
      date: editDate,
      paymentMode: editPaymentMode,
      referenceId: editReferenceId.trim() || undefined,
      description: editDescription.trim() || undefined,
      approvedStatus: editStatus,
      // If admin changed to approved and it wasn't approved before, stamp admin approval
      approvedByAdminName:
        editStatus === 'APPROVED'
          ? editingItem.approvedByAdminName || currentStaffName || 'Director Er. Alok Ranjan'
          : undefined,
      approvalDate:
        editStatus === 'APPROVED'
          ? editingItem.approvalDate || `${editDate} ${new Date().toLocaleTimeString()}`
          : undefined,
    };

    if (onUpdateItem) {
      onUpdateItem(updatedItem);
    }
    setEditingItem(null);
  };

  // Open Delete Modal (Admin Protected)
  const handleOpenDeleteModal = (item: IncomeExpenseItem) => {
    if (!isAdmin) {
      alert('Security Notice: Only Institute Admin / Director has authority to delete ledger records.');
      return;
    }
    setDeletingItem(item);
  };

  // Confirm Delete Item
  const handleConfirmDelete = () => {
    if (!isAdmin || !deletingItem) {
      alert('Security Notice: Only Institute Admin has authority to delete income and expense vouchers.');
      return;
    }
    if (onDeleteItem) {
      onDeleteItem(deletingItem.id);
    }
    // Remove from selectedIds if selected
    setSelectedIds((prev) => prev.filter((id) => id !== deletingItem.id));
    setDeletingItem(null);
  };

  // Handle Select All / Toggle item
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map((i) => i.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  // Batch Delete
  const handleBatchDelete = () => {
    if (!isAdmin || selectedIds.length === 0) return;
    if (onBatchDeleteItems) {
      onBatchDeleteItems(selectedIds);
    } else if (onDeleteItem) {
      selectedIds.forEach((id) => onDeleteItem(id));
    }
    setSelectedIds([]);
    setShowBatchDeleteConfirm(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Heading */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-indigo-500/20 text-indigo-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-indigo-400/30 uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5" />
                Institute Accounts & Audit
              </span>
              {isAdmin ? (
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Admin Full Rights: Edit & Delete Enabled
                </span>
              ) : (
                <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  Staff Counter Mode (Vouchers Pending Sanction)
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black text-white mt-1.5 tracking-tight">
              Income, Expense & Center Cashflow Ledger
            </h2>
            <p className="text-xs text-indigo-200 mt-1 max-w-2xl">
              Track center operating expenses, direct incomes, utilities, hardware maintenance, and audit financial vouchers.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 no-print flex-wrap">
            <button
              onClick={() => {
                setModalType('EXPENSE');
                setCategory(expenseCategories[0]);
                setShowAddModal(true);
              }}
              className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-md shadow-rose-600/30 flex items-center gap-1.5 cursor-pointer"
            >
              <TrendingDown className="w-4 h-4" />
              Record Expense
            </button>

            <button
              onClick={() => {
                setModalType('INCOME');
                setCategory(incomeCategories[1]);
                setShowAddModal(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-md shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer"
            >
              <TrendingUp className="w-4 h-4" />
              Add Income
            </button>

            <button
              onClick={handleExportCSV}
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-2 rounded-xl transition border border-white/15 flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Download Financial Ledger CSV"
            >
              <Download className="w-3.5 h-3.5 text-indigo-300" />
              CSV
            </button>

            <button
              onClick={handleDownloadLedgerPdf}
              disabled={isGeneratingLedgerPdf}
              className="bg-indigo-600/80 hover:bg-indigo-600 disabled:opacity-50 text-white text-xs font-semibold px-3 py-2 rounded-xl transition border border-indigo-400/30 flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Download High-Resolution PDF of Financial Ledger"
            >
              {isGeneratingLedgerPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  PDF...
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5 text-indigo-200" />
                  Export PDF
                </>
              )}
            </button>

            <button
              onClick={handlePrintLedger}
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-2 rounded-xl transition border border-white/15 flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Print Ledger"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-300" />
              Print
            </button>
          </div>
        </div>
      </div>

      {/* Top Warning Banner for Pending Sanctions */}
      {pendingItems.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-amber-950 uppercase tracking-wider">
                  Admin Sanction Required
                </span>
                <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  {pendingItems.length} Vouchers Pending
                </span>
              </div>
              <p className="text-xs text-amber-900 mt-0.5">
                Institute policy: All income and expenses submitted by staff require Admin approval before reflecting in center balance.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin ? (
              onBatchApproveItems && (
                <button
                  onClick={() => onBatchApproveItems(pendingItems.map((p) => p.id))}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Approve All Pending ({pendingItems.length})
                </button>
              )
            ) : (
              <span className="bg-white/80 text-amber-800 border border-amber-300 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                Staff View (Admin Approval Locked)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Income Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">
              <TrendingUp className="w-4 h-4" />
              Approved Center Income
            </div>
            <div className="text-3xl font-extrabold text-slate-900 font-mono">
              {formatCurrency(totalIncome)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {pendingIncomeSum > 0 ? (
                <span className="text-amber-600 font-semibold">
                  + {formatCurrency(pendingIncomeSum)} pending audit
                </span>
              ) : (
                'Admin-approved fees & collections'
              )}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Expense Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-600 mb-1">
              <TrendingDown className="w-4 h-4" />
              Approved Center Expenses
            </div>
            <div className="text-3xl font-extrabold text-slate-900 font-mono">
              {formatCurrency(totalExpense)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {pendingExpenseSum > 0 ? (
                <span className="text-amber-600 font-semibold">
                  + {formatCurrency(pendingExpenseSum)} pending audit
                </span>
              ) : (
                'Rent, Electricity, Salaries, Hardware'
              )}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        {/* Net Balance / Surplus Card */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-300 mb-1">
              <Layers className="w-4 h-4 text-indigo-400" />
              Approved Cashflow Balance
            </div>
            <div
              className={`text-3xl font-extrabold font-mono ${
                netSurplus >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatCurrency(netSurplus)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {netSurplus >= 0 ? 'Operating in Healthy Surplus' : 'Deficit Alert'}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 text-white flex items-center justify-center">
            <Building className="w-6 h-6 text-indigo-300" />
          </div>
        </div>
      </div>

      {/* Action Header & Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3 no-print">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => {
                setFilterType('ALL');
                setApprovalFilter('ALL');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                filterType === 'ALL' && approvalFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Entries ({allTransactions.length})
            </button>

            <button
              onClick={() => setApprovalFilter('PENDING')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                approvalFilter === 'PENDING'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Pending ({pendingItems.length})
            </button>

            <button
              onClick={() => {
                setFilterType('INCOME');
                setApprovalFilter('ALL');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1 cursor-pointer ${
                filterType === 'INCOME' && approvalFilter === 'ALL'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Income
            </button>

            <button
              onClick={() => {
                setFilterType('EXPENSE');
                setApprovalFilter('ALL');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1 cursor-pointer ${
                filterType === 'EXPENSE' && approvalFilter === 'ALL'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              Expenses
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search category, voucher, particulars, recorded by..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Batch selection info bar for Admin */}
        {isAdmin && selectedIds.length > 0 && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-2.5 flex items-center justify-between text-xs text-indigo-900 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 font-bold">
              <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-md font-mono text-[11px]">
                {selectedIds.length} Selected
              </span>
              <span>Bulk voucher actions for Director / Admin:</span>
            </div>
            <div className="flex items-center gap-2">
              {onBatchApproveItems && (
                <button
                  type="button"
                  onClick={() => onBatchApproveItems(selectedIds)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-lg font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Approve Selected
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowBatchDeleteConfirm(true)}
                className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1 rounded-lg font-bold text-xs transition flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Selected ({selectedIds.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-slate-500 hover:text-slate-700 px-2 py-1 text-xs"
              >
                Deselect All
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Ledger Table */}
      <div
        id="printable-financial-ledger"
        ref={ledgerTableRef}
        className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                {isAdmin && (
                  <th className="py-3 px-3 w-8 text-center">
                    <input
                      type="checkbox"
                      checked={
                        filteredItems.length > 0 && selectedIds.length === filteredItems.length
                      }
                      onChange={handleToggleSelectAll}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      title="Select all filtered entries"
                    />
                  </th>
                )}
                <th className="py-3 px-4">Date / Voucher</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Particulars & Description</th>
                <th className="py-3 px-4">Payment Mode</th>
                <th className="py-3 px-4">Recorded By</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
                <th className="py-3 px-4 text-right">{isAdmin ? 'Admin Actions' : 'Voucher Slip'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 10 : 9} className="py-12 text-center text-slate-400">
                    <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-700 text-sm">No ledger entries found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchQuery
                        ? 'No records match your search criteria. Try clearing search filters.'
                        : 'Record an expense or collection to view financial transactions.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isSelected = selectedIds.includes(item.id);

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isSelected ? 'bg-indigo-50/50' : ''
                      }`}
                    >
                      {isAdmin && (
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(item.id)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                      )}
                      <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                        <div className="font-bold text-slate-900">{formatDate(item.date)}</div>
                        {item.referenceId ? (
                          <div className="text-[10px] text-indigo-700 font-mono font-semibold bg-indigo-50 px-1.5 py-0.2 rounded inline-block mt-0.5 border border-indigo-100">
                            Ref: {item.referenceId}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono">No Ref</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${
                            item.type === 'INCOME'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {item.type === 'INCOME' ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {item.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{item.category}</div>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="text-slate-900 font-semibold">{item.title}</div>
                        {item.description && (
                          <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 uppercase text-[11px] font-bold text-slate-600 whitespace-nowrap">
                        <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                          {item.paymentMode}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium whitespace-nowrap">
                        <div className="font-bold text-slate-800 text-[11px]">{item.recordedBy}</div>
                        {item.recordedByRole && (
                          <span className="text-[10px] text-slate-400 capitalize">
                            Role: {item.recordedByRole}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {item.approvedStatus === 'APPROVED' ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Approved
                          </span>
                        ) : item.approvedStatus === 'PENDING_APPROVAL' ? (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 border border-amber-200 animate-pulse">
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            Pending Audit
                          </span>
                        ) : (
                          <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 border border-rose-200">
                            <X className="w-3 h-3 text-rose-600" />
                            Rejected
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-sm whitespace-nowrap">
                        <span
                          className={item.type === 'INCOME' ? 'text-emerald-700' : 'text-rose-600'}
                        >
                          {item.type === 'INCOME' ? '+' : '-'}
                          {formatCurrency(item.amount)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {isAdmin ? (
                          <div className="flex items-center justify-end gap-1">
                            {/* Sanction buttons if pending */}
                            {item.approvedStatus === 'PENDING_APPROVAL' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => onApproveItem && onApproveItem(item.id)}
                                  title="Approve Voucher"
                                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onRejectItem && onRejectItem(item.id)}
                                  title="Reject Voucher"
                                  className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            {/* View Voucher / Print */}
                            <button
                              type="button"
                              onClick={() => setViewingVoucher(item)}
                              title="View / Print Voucher"
                              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit Button (Admin) */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(item)}
                              title="Edit Income/Expense Entry"
                              className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Button (Admin) */}
                            <button
                              type="button"
                              onClick={() => handleOpenDeleteModal(item)}
                              title="Delete Income/Expense Entry"
                              className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1 text-[11px] text-slate-400">
                            <button
                              type="button"
                              onClick={() => setViewingVoucher(item)}
                              title="View Voucher"
                              className="p-1 text-slate-500 hover:text-indigo-600 rounded"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <Lock className="w-2.5 h-2.5" />
                              View
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* EDIT INCOME / EXPENSE MODAL (ADMIN ONLY)                    */}
      {/* ============================================================ */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Edit {editType === 'INCOME' ? 'Income' : 'Expense'} Voucher
                  </h3>
                  <p className="text-xs text-indigo-200">
                    Admin Panel • Modify particulars, amount, category & sanction status
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEditItem} className="p-6 space-y-4 text-xs">
              {editError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2 font-semibold text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              {/* Type Switcher (Income vs Expense) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Transaction Type *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditType('EXPENSE');
                      if (!expenseCategories.includes(editCategory)) {
                        setEditCategory(expenseCategories[0]);
                      }
                    }}
                    className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition cursor-pointer ${
                      editType === 'EXPENSE'
                        ? 'bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-500/20'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <TrendingDown className="w-4 h-4" />
                    Center Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditType('INCOME');
                      if (!incomeCategories.includes(editCategory)) {
                        setEditCategory(incomeCategories[0]);
                      }
                    }}
                    className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition cursor-pointer ${
                      editType === 'INCOME'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-500/20'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    Direct Income
                  </button>
                </div>
              </div>

              {/* Title / Particulars */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Title / Particulars *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                />
              </div>

              {/* Category & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                  >
                    {(editType === 'EXPENSE' ? expenseCategories : incomeCategories).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="1"
                    value={editAmount || ''}
                    onChange={(e) => setEditAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-black text-sm text-indigo-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                  />
                </div>
              </div>

              {/* Date & Payment Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Payment Mode *
                  </label>
                  <select
                    value={editPaymentMode}
                    onChange={(e) => setEditPaymentMode(e.target.value as PaymentMode)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white uppercase"
                  >
                    <option value="upi">UPI / Online QR</option>
                    <option value="cash">Counter Cash</option>
                    <option value="bank_transfer">Net Banking / NEFT</option>
                    <option value="cheque">Bank Cheque</option>
                    <option value="card">Debit / Credit Card</option>
                  </select>
                </div>
              </div>

              {/* Voucher Reference ID */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Voucher / Invoice / Bill Reference Number
                </label>
                <input
                  type="text"
                  value={editReferenceId}
                  onChange={(e) => setEditReferenceId(e.target.value)}
                  placeholder="e.g. BSES-BILL-9821 or VOUCHER-084"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                />
              </div>

              {/* Approval Status & Audit details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Sanction / Approval Status *
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as ApprovalStatus)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                  >
                    <option value="APPROVED">APPROVED (Active in Balance)</option>
                    <option value="PENDING_APPROVAL">PENDING_APPROVAL (Under Audit)</option>
                    <option value="REJECTED">REJECTED (Declined)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Recorded By (Audit Log)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`${editingItem.recordedBy} (${editingItem.recordedByRole || 'staff'})`}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-100 text-slate-500 font-semibold cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Notes / Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Notes / Audit Remarks
                </label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Audit justification or bill details..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* DELETE CONFIRMATION MODAL (ADMIN ONLY)                      */}
      {/* ============================================================ */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-black text-slate-900">
                Delete {deletingItem.type === 'INCOME' ? 'Income' : 'Expense'} Voucher?
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-semibold">
                {deletingItem.title}
              </p>
            </div>

            {/* Voucher Details Snapshot */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Amount:</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatCurrency(deletingItem.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Category:</span>
                <span className="font-semibold text-slate-800">{deletingItem.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span className="font-mono text-slate-800">{formatDate(deletingItem.date)}</span>
              </div>
              {deletingItem.referenceId && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Reference / Bill:</span>
                  <span className="font-mono text-indigo-700 font-bold">{deletingItem.referenceId}</span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-500 text-center">
              Deleting this entry will adjust the center balance calculation and remove it permanently from the accounts ledger.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="w-full px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="w-full px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-md transition cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* BATCH DELETE CONFIRMATION MODAL (ADMIN ONLY)                */}
      {/* ============================================================ */}
      {showBatchDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-black text-slate-900">
                Delete {selectedIds.length} Selected Entries?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete all {selectedIds.length} selected financial vouchers from the ledger?
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowBatchDeleteConfirm(false)}
                className="w-full px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBatchDelete}
                className="w-full px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-md transition cursor-pointer"
              >
                Delete All {selectedIds.length}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* VIEW / PRINT VOUCHER MODAL                                  */}
      {/* ============================================================ */}
      {viewingVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-6 print:my-0 print:border-none print:shadow-none animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between no-print print:hidden">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-300" />
                <h3 className="text-base font-bold text-white">Financial Voucher Slip</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingVoucher(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div id="printable-voucher" ref={voucherPrintRef} className="p-6 space-y-4 text-xs font-sans bg-white print:p-4">
              {/* Institute Header for Voucher */}
              <div className="text-center border-b border-slate-200 pb-3">
                <div className="text-[10px] uppercase font-extrabold tracking-wider text-indigo-600">
                  DIGITECH COMPUTER INSTITUTE ERP
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  Official Financial Voucher Slip
                </h3>
                <div className="font-mono text-xs text-slate-500 font-bold mt-0.5">
                  Voucher #{viewingVoucher.referenceId || viewingVoucher.id}
                </div>
                <h4 className="text-sm font-bold text-slate-800 mt-1">
                  {viewingVoucher.title}
                </h4>
                <div className="text-xs text-slate-500 font-medium">
                  Category: <strong className="text-slate-700">{viewingVoucher.category}</strong>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Transaction Type:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                      viewingVoucher.type === 'INCOME'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {viewingVoucher.type}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Voucher Amount:</span>
                  <span className="font-mono text-base font-black text-slate-900">
                    {formatCurrency(viewingVoucher.amount)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Transaction Date:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {formatDate(viewingVoucher.date)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Payment Mode:</span>
                  <span className="font-bold text-slate-800 uppercase">
                    {viewingVoucher.paymentMode}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Recorded By:</span>
                  <span className="font-semibold text-slate-800">
                    {viewingVoucher.recordedBy}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Audit Status:</span>
                  <span className="font-bold text-emerald-700">
                    {viewingVoucher.approvedStatus}
                  </span>
                </div>

                {viewingVoucher.approvedByAdminName && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Sanctioned By:</span>
                    <span className="font-semibold text-slate-800">
                      {viewingVoucher.approvedByAdminName}
                    </span>
                  </div>
                )}
              </div>

              {viewingVoucher.description && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Particulars / Notes</div>
                  <p className="text-slate-700 italic">{viewingVoucher.description}</p>
                </div>
              )}

              {/* Signatures */}
              <div className="pt-4 grid grid-cols-2 gap-6 text-center border-t border-slate-100">
                <div className="pt-8 border-t border-slate-300">
                  <span className="text-[11px] font-medium text-slate-500 block">Cashier / Staff Signature</span>
                </div>
                <div className="pt-8 border-t border-slate-300">
                  <span className="text-[11px] font-medium text-slate-500 block">Authorised Director Seal</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 no-print print:hidden">
                <button
                  type="button"
                  onClick={() => setViewingVoucher(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleDownloadVoucherPdf}
                  disabled={isGeneratingVoucherPdf}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  {isGeneratingVoucherPdf ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving PDF...
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5 text-indigo-300" />
                      Save PDF
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => triggerPrint()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Slip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
