import React, { useState, useEffect } from 'react';
import { Student, PaymentMode, InstituteSettings, FeePayment, UserRole } from '../types';
import {
  formatCurrency,
  formatDate,
  generateReceiptNumber,
  calculateNextReceiptVoucherNumber,
  getLastReceiptVoucherInfo,
  saveLastReceiptVoucherInfo,
} from '../utils/helpers';
import {
  X,
  Search,
  CreditCard,
  QrCode,
  Banknote,
  Building,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Check,
  Receipt,
  Calendar,
  History,
} from 'lucide-react';

interface FeeCollectionModalProps {
  students: Student[];
  settings: InstituteSettings;
  currentRole: UserRole;
  payments?: FeePayment[];
  preselectedStudentId?: string;
  onClose: () => void;
  onPaymentRecorded: (payment: FeePayment) => void;
}

export const FeeCollectionModal: React.FC<FeeCollectionModalProps> = ({
  students,
  settings,
  currentRole,
  payments,
  preselectedStudentId,
  onClose,
  onPaymentRecorded,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(preselectedStudentId || '');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [transactionRef, setTransactionRef] = useState('');
  const [remarks, setRemarks] = useState('');
  const [selectedInstallments, setSelectedInstallments] = useState<number[]>([]);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Receipt Voucher Number & Date Management
  const [receiptVoucherNo, setReceiptVoucherNo] = useState<string>('');
  const [receiptVoucherDate, setReceiptVoucherDate] = useState<string>('');
  const [lastVoucherInfo, setLastVoucherInfo] = useState<{ lastReceiptNo: string; lastDate: string }>({
    lastReceiptNo: '',
    lastDate: '',
  });

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  // Initialize Voucher Number & Date on mount
  useEffect(() => {
    const info = getLastReceiptVoucherInfo(payments);
    setLastVoucherInfo(info);
    const nextNo = calculateNextReceiptVoucherNumber(info.lastReceiptNo, payments);
    setReceiptVoucherNo(nextNo);
    setReceiptVoucherDate(info.lastDate || new Date().toISOString().split('T')[0]);
  }, [payments]);

  // Auto-populate pending installment and amount when student is picked
  useEffect(() => {
    if (selectedStudent) {
      const pendingInst = selectedStudent.installments.find(
        (i) => i.status === 'pending' || i.status === 'overdue'
      );
      if (pendingInst) {
        setAmount(pendingInst.amount);
        setSelectedInstallments([pendingInst.installmentNo]);
      } else if (selectedStudent.pendingAmount > 0) {
        setAmount(selectedStudent.pendingAmount);
      } else {
        setAmount(0);
      }
    }
  }, [selectedStudentId]);

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone.includes(searchQuery)
  );

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(settings.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || amount <= 0) return;

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    const effectiveVoucherNo = receiptVoucherNo.trim() || generateReceiptNumber(payments);
    const effectiveVoucherDate = receiptVoucherDate.trim() || dateStr;

    // Save and maintain for next entry
    saveLastReceiptVoucherInfo(effectiveVoucherNo, effectiveVoucherDate);

    const remainingBalanceAfter = Math.max(0, selectedStudent.pendingAmount - amount);

    const isDirectAdmin = currentRole === 'admin';

    const newPayment: FeePayment = {
      id: `rec-${Date.now()}`,
      receiptNo: effectiveVoucherNo,
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      studentRollNo: selectedStudent.rollNo,
      courseName: selectedStudent.courseName,
      amount: Number(amount),
      paymentMode,
      transactionRef: transactionRef.trim() || undefined,
      date: effectiveVoucherDate,
      time: timeStr,
      collectedByStaffId: isDirectAdmin ? 'admin-01' : 'staff-01',
      collectedByStaffName: isDirectAdmin
        ? `${settings.directorName} (Director)`
        : 'Pooja Verma (Accountant)',
      approvalStatus: isDirectAdmin ? 'APPROVED' : 'PENDING_APPROVAL',
      approvedByAdminId: isDirectAdmin ? 'admin-01' : undefined,
      approvedByAdminName: isDirectAdmin ? `${settings.directorName} (Director)` : undefined,
      approvalDate: isDirectAdmin ? `${effectiveVoucherDate} ${timeStr}` : undefined,
      installmentNos: selectedInstallments.length > 0 ? selectedInstallments : [1],
      remainingBalanceAfter,
      remarks: remarks.trim() || undefined,
    };

    onPaymentRecorded(newPayment);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Banknote className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Collect Student Fee</h3>
              <p className="text-xs text-slate-300">
                Front Desk Counter • {settings.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Step 1: Student Selection */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              1. Select Student
            </label>
            {!selectedStudent ? (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by student name, roll number, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div className="border border-slate-200 rounded-lg max-h-40 overflow-y-auto divide-y divide-slate-100 bg-white">
                  {filteredStudents.length === 0 ? (
                    <div className="p-3 text-xs text-slate-400 text-center">
                      No matching student found
                    </div>
                  ) : (
                    filteredStudents.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => setSelectedStudentId(s.id)}
                        className="p-2.5 hover:bg-indigo-50 cursor-pointer flex items-center justify-between transition-colors text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{s.name}</div>
                          <div className="text-slate-500">
                            {s.courseName} • Roll:{' '}
                            <span className="font-mono text-indigo-700">{s.rollNo}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold text-slate-900">
                            {formatCurrency(s.pendingAmount)} due
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Paid: {formatCurrency(s.paidAmount)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{selectedStudent.name}</span>
                    <span className="bg-indigo-600 text-white font-mono text-[10px] px-2 py-0.5 rounded font-bold">
                      {selectedStudent.rollNo}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    {selectedStudent.courseName} • Batch: {selectedStudent.batchTime}
                  </div>
                  <div className="text-xs text-slate-600 mt-1 flex items-center gap-3">
                    <span>
                      Total Fee:{' '}
                      <strong className="text-slate-900">
                        {formatCurrency(selectedStudent.netPayableFee)}
                      </strong>
                    </span>
                    <span>
                      Paid:{' '}
                      <strong className="text-emerald-700">
                        {formatCurrency(selectedStudent.paidAmount)}
                      </strong>
                    </span>
                    <span>
                      Due Balance:{' '}
                      <strong className="text-indigo-900 font-mono">
                        {formatCurrency(selectedStudent.pendingAmount)}
                      </strong>
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedStudentId('')}
                  className="text-xs text-indigo-700 hover:text-indigo-900 underline font-medium px-2 py-1"
                >
                  Change
                </button>
              </div>
            )}
          </div>

          {selectedStudent && (
            <>
              {/* Installment breakdown selector */}
              {selectedStudent.installments.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                    Installment Allocation
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {selectedStudent.installments.map((inst) => {
                      const isSelected = selectedInstallments.includes(inst.installmentNo);
                      const isPaid = inst.status === 'paid';
                      return (
                        <div
                          key={inst.installmentNo}
                          onClick={() => {
                            if (isPaid) return;
                            if (isSelected) {
                              setSelectedInstallments(
                                selectedInstallments.filter((no) => no !== inst.installmentNo)
                              );
                            } else {
                              setSelectedInstallments([...selectedInstallments, inst.installmentNo]);
                            }
                          }}
                          className={`p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                            isPaid
                              ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                              : isSelected
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                              : 'bg-white border-slate-200 hover:border-indigo-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold">
                              {inst.installmentTitle || (inst.installmentNo === 1 ? 'Admission Fees' : `Installment #${inst.installmentNo}`)}
                            </span>
                            {isPaid && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 rounded">
                                Paid
                              </span>
                            )}
                          </div>
                          <div className="font-mono font-bold mt-1">
                            {formatCurrency(inst.amount)}
                          </div>
                          <div
                            className={`text-[10px] mt-0.5 ${
                              isSelected ? 'text-indigo-100' : 'text-slate-500'
                            }`}
                          >
                            Due: {inst.dueDate}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Amount to collect */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  2. Collection Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2 text-slate-500 font-bold text-base">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={selectedStudent.pendingAmount}
                    value={amount || ''}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2 text-base font-bold font-mono bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    placeholder="Enter fee amount"
                    required
                  />
                </div>
                {amount > 0 && (
                  <div className="text-[11px] text-slate-500 mt-1 flex justify-between font-mono">
                    <span>
                      Balance remaining after payment:{' '}
                      <strong className="text-slate-800">
                        {formatCurrency(Math.max(0, selectedStudent.pendingAmount - amount))}
                      </strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Receipt Voucher Number & Date (Maintained for next entry) */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-indigo-600" />
                    3. Receipt Voucher Details
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
                        Voucher / Receipt No *
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
                      Maintained and auto-incremented for your next voucher entry.
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
                      Retained across entries for continuous session recording.
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Mode Selection */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  4. Payment Mode
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'cash', label: 'Cash Counter', icon: Banknote },
                    { id: 'upi', label: 'UPI / QR Code', icon: QrCode },
                    { id: 'card', label: 'Debit/Credit Card', icon: CreditCard },
                    { id: 'bank_transfer', label: 'Net Banking / Cheque', icon: Building },
                  ].map((mode) => {
                    const Icon = mode.icon;
                    const isCurrent = paymentMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setPaymentMode(mode.id as PaymentMode)}
                        className={`p-2.5 rounded-lg border text-xs font-medium flex flex-col items-center justify-center gap-1.5 transition ${
                          isCurrent
                            ? 'bg-indigo-50 border-indigo-600 text-indigo-900 ring-2 ring-indigo-500'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 ${isCurrent ? 'text-indigo-600' : 'text-slate-500'}`}
                        />
                        <span>{mode.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* UPI QR & Details Display if UPI selected */}
              {paymentMode === 'upi' && (
                <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-3 flex flex-col sm:flex-row items-center gap-4 text-xs">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-xs text-center">
                    <QrCode className="w-16 h-16 mx-auto text-slate-800" />
                    <span className="text-[9px] text-slate-500 block font-mono mt-0.5">
                      Institute Counter QR
                    </span>
                  </div>
                  <div className="space-y-1.5 flex-1 w-full text-left">
                    <div className="font-bold text-slate-900">Institute Official UPI Account:</div>
                    <div className="flex items-center gap-2">
                      <span className="bg-white px-2.5 py-1 rounded border border-slate-300 font-mono font-bold text-indigo-900 text-xs">
                        {settings.upiId}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyUpi}
                        className="text-indigo-600 hover:text-indigo-800 p-1 flex items-center gap-1 text-[11px]"
                      >
                        {copiedUpi ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy UPI</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Scan via Google Pay, PhonePe, Paytm, or BHIM. Enter transaction reference
                      below.
                    </p>
                  </div>
                </div>
              )}

              {/* Transaction Ref & Remarks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Transaction / UTR / Cheque Ref:
                  </label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder={
                      paymentMode === 'cash'
                        ? 'e.g. Counter Cashbox #1'
                        : 'e.g. UPI/408923891 or Cheque #8812'
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Collector Remarks / Notes:
                  </label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="e.g. Cleared installment before exam..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Workflow Notice */}
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  currentRole === 'staff'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}
              >
                {currentRole === 'staff' ? (
                  <>
                    <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">Staff Collection Workflow:</strong> This fee
                      collection voucher will be marked as{' '}
                      <span className="font-bold underline">Pending Admin Approval</span>. Once
                      Admin verifies the cash in counter or bank credit, it will be sealed into the
                      permanent ledger.
                    </div>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">Admin Direct Receipt:</strong> As Institute
                      Director / Admin, this receipt will be immediately{' '}
                      <span className="font-bold underline">Approved & Sealed</span> into the
                      official revenue ledger.
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedStudent || amount <= 0}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold px-5 py-2 rounded-lg transition shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Generate & Record Fee Receipt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
