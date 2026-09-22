import React, { useState } from 'react';
import { Student, Course, UserRole, CourseUpgradeRecord } from '../types';
import {
  formatCurrency,
  getEligibleUpgradeCourses,
  isCourseUpgradable,
  getOscitTierLevel,
} from '../utils/helpers';
import {
  X,
  Sparkles,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Calculator,
  ShieldCheck,
  Calendar,
  Layers,
  FileText,
  AlertCircle,
  Lock,
} from 'lucide-react';

interface CourseUpgradeModalProps {
  student: Student;
  courses: Course[];
  currentRole: UserRole;
  currentStaffName?: string;
  onClose: () => void;
  onConfirmUpgrade: (updatedStudent: Student) => void;
}

export const CourseUpgradeModal: React.FC<CourseUpgradeModalProps> = ({
  student,
  courses,
  currentRole,
  currentStaffName = 'Front Desk Staff',
  onClose,
  onConfirmUpgrade,
}) => {
  // Filter eligible courses strictly higher in progression
  // Specifically:
  // - If student is in OSCIT A+, OSCIT A or OSCIT will NEVER appear
  // - If student is in OSCIT A, only OSCIT A+ or higher diploma appears
  // - If student is in non-upgradable course (e.g. OCOC Tally Prime), eligibleCourses is empty
  const eligibleCourses = getEligibleUpgradeCourses(
    student.courseId || student.courseName,
    courses
  );

  const isCurrentOscitAplus =
    getOscitTierLevel(`${student.courseId} ${student.courseName}`) === 3;
  const isCurrentNonUpgradable =
    !isCourseUpgradable(
      courses.find((c) => c.id === student.courseId),
      student.courseName
    );

  // Preferred defaults: if currently OSCIT, suggest OSCIT A; if OSCIT A, suggest OSCIT A+
  const defaultTarget = (() => {
    if (eligibleCourses.length === 0) return '';
    const oscitA = eligibleCourses.find(
      (c) => c.code === 'OSCIT-A' || c.name.includes('OSCIT A')
    );
    const oscitAplus = eligibleCourses.find(
      (c) =>
        c.code === 'OSCIT-A+' ||
        c.name.includes('OSCIT A+') ||
        c.code.includes('APLUS')
    );

    const currentTier = getOscitTierLevel(student.courseName);
    if (currentTier === 1) {
      return oscitA?.id || oscitAplus?.id || eligibleCourses[0]?.id;
    }
    if (currentTier === 2) {
      return oscitAplus?.id || eligibleCourses[0]?.id;
    }
    return eligibleCourses[0]?.id;
  })();

  const [targetCourseId, setTargetCourseId] = useState<string>(defaultTarget || '');
  const [splitInstallments, setSplitInstallments] = useState<number>(2);
  const [upgradeNotes, setUpgradeNotes] = useState('');

  const targetCourse = eligibleCourses.find((c) => c.id === targetCourseId);

  // Math variables: 100% carry-forward of previous payments
  const currentTotalFee = student.totalFee;
  const carriedPaidAmount = student.paidAmount; // Total amount already received from student
  const newCourseFee = targetCourse?.fee || 0;
  const newRestAmount = Math.max(0, newCourseFee - carriedPaidAmount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCourse) return;

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    // Build new installment schedule for remaining rest amount
    const newInstallments = [];
    if (newRestAmount > 0) {
      const parts = Math.max(1, splitInstallments);
      const perInst = Math.round(newRestAmount / parts);
      for (let i = 1; i <= parts; i++) {
        const d = new Date();
        d.setMonth(d.getMonth() + i);
        newInstallments.push({
          installmentNo: i,
          amount: i === parts ? newRestAmount - perInst * (parts - 1) : perInst,
          dueDate: d.toISOString().split('T')[0],
          status: 'pending' as const,
        });
      }
    }

    const upgradeLog: CourseUpgradeRecord = {
      id: `upg-${Date.now()}`,
      date: dateStr,
      fromCourseId: student.courseId,
      fromCourseName: student.courseName,
      fromCourseFee: currentTotalFee,
      toCourseId: targetCourse.id,
      toCourseName: targetCourse.name,
      toCourseFee: newCourseFee,
      carriedPaidAmount,
      upgradePaymentAmount: 0,
      totalReceivedAfter: carriedPaidAmount,
      newRestAmount,
      processedBy: currentStaffName,
      notes: upgradeNotes.trim() || undefined,
    };

    const updatedStudent: Student = {
      ...student,
      courseId: targetCourse.id,
      courseName: targetCourse.name,
      totalFee: newCourseFee,
      discount: 0,
      netPayableFee: newCourseFee,
      paidAmount: carriedPaidAmount,
      pendingAmount: newRestAmount,
      installments: newInstallments,
      upgradeHistory: [upgradeLog, ...(student.upgradeHistory || [])],
    };

    onConfirmUpgrade(updatedStudent);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-indigo-200 w-full max-w-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 text-white p-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Student Course Upgrade System
              </div>
              <h2 className="text-xl font-black text-white">{student.name}</h2>
              <p className="text-xs text-indigo-200">
                Roll No: <span className="font-mono font-semibold">{student.rollNo}</span> • Current Course:{' '}
                <span className="text-amber-300 font-bold">{student.courseName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If no eligible upgrade courses are available (e.g. OSCIT A+ terminal master or OCOC Tally Prime non-upgradable) */}
        {eligibleCourses.length === 0 ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
              {isCurrentNonUpgradable ? (
                <Lock className="w-8 h-8" />
              ) : isCurrentOscitAplus ? (
                <ShieldCheck className="w-8 h-8 text-purple-600" />
              ) : (
                <AlertCircle className="w-8 h-8" />
              )}
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-800">
                {isCurrentOscitAplus
                  ? 'Master Tier Achieved (OSCIT A+)'
                  : isCurrentNonUpgradable
                  ? 'Non-Upgradable Course'
                  : 'No Higher Upgrade Options Available'}
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto mt-1.5 leading-relaxed">
                {isCurrentOscitAplus
                  ? 'This student is enrolled in OSCIT A+ (Professional Master Diploma), the highest master tier in the OSCIT sequence. Downgrading to OSCIT A or OSCIT is strictly prohibited.'
                  : isCurrentNonUpgradable
                  ? 'This student is enrolled in a standalone specialized certification (OCOC Tally Prime) which is marked as not upgradable.'
                  : 'There are no higher tier courses in the active catalog eligible for upgrade from the current course.'}
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
              >
                Close Desk
              </button>
            </div>
          </div>
        ) : (
          /* Upgrade Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Upgrade Path Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Select Upgrade Target Course
                </label>
                <span className="text-[11px] text-indigo-700 font-medium bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                  {eligibleCourses.length} strictly higher tier{eligibleCourses.length > 1 ? 's' : ''} available
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {eligibleCourses.map((c) => {
                  const isSelected = targetCourseId === c.id;
                  const isOscitSeries = c.code.includes('OSCIT');
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setTargetCourseId(c.id)}
                      className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-indigo-900 font-mono">
                            {c.code}
                          </span>
                          {isOscitSeries && (
                            <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                              Next Tier Upgrade
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-bold text-slate-800 mt-1 line-clamp-2">
                          {c.name}
                        </div>
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 font-medium">{c.duration}</span>
                        <span className="text-xs font-extrabold text-slate-900 font-mono">
                          {formatCurrency(c.fee)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mathematical Financial Breakdown */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-inner border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
                  <Calculator className="w-4 h-4 text-indigo-400" />
                  Course Upgrade Fee Reconciliation Formula
                </div>
                <span className="text-[11px] bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full font-mono border border-indigo-400/30">
                  100% Carry-Forward Math
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">New Course Total Fee</div>
                  <div className="text-lg font-mono font-black text-white mt-0.5">
                    {formatCurrency(newCourseFee)}
                  </div>
                  <div className="text-[10px] text-indigo-300 truncate">{targetCourse?.name}</div>
                </div>

                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <div className="text-[10px] text-emerald-400 uppercase font-semibold">Already Paid (Carried)</div>
                  <div className="text-lg font-mono font-black text-emerald-400 mt-0.5">
                    {formatCurrency(carriedPaidAmount)}
                  </div>
                  <div className="text-[10px] text-slate-400">Preserved from past receipts</div>
                </div>

                <div className="bg-indigo-600/30 rounded-xl p-3 border border-indigo-500/40">
                  <div className="text-[10px] text-indigo-200 uppercase font-bold">New Remaining Due (Rest)</div>
                  <div className="text-lg font-mono font-black text-amber-300 mt-0.5">
                    {formatCurrency(newRestAmount)}
                  </div>
                  <div className="text-[10px] text-indigo-200 font-semibold">Payable via collection desk</div>
                </div>
              </div>

              {/* Visual Equation */}
              <div className="bg-black/30 rounded-xl p-3 font-mono text-[11px] text-slate-300 flex flex-wrap items-center gap-2 justify-center">
                <span>New Fee ({formatCurrency(newCourseFee)})</span>
                <span className="text-slate-500">-</span>
                <span className="text-emerald-400">Already Paid ({formatCurrency(carriedPaidAmount)})</span>
                <span className="text-slate-500">=</span>
                <span className="text-amber-300 font-bold">Rest Due: {formatCurrency(newRestAmount)}</span>
              </div>
            </div>

            {/* Remaining Rest Installment Schedule Selector */}
            {newRestAmount > 0 && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                      Split Remaining Balance ({formatCurrency(newRestAmount)})
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Configure future installment schedule for remaining course balance
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setSplitInstallments(num)}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                          splitInstallments === num
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {num} {num === 1 ? 'Inst.' : 'Inst.'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Installment breakdown preview */}
                <div className="pt-2 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {Array.from({ length: splitInstallments }).map((_, idx) => {
                    const parts = splitInstallments;
                    const perInst = Math.round(newRestAmount / parts);
                    const amount = idx === parts - 1 ? newRestAmount - perInst * (parts - 1) : perInst;
                    const d = new Date();
                    d.setMonth(d.getMonth() + idx + 1);

                    return (
                      <div
                        key={idx}
                        className="bg-white p-2.5 rounded-lg border border-slate-200 font-mono text-[11px]"
                      >
                        <div className="text-[10px] text-slate-500 font-semibold uppercase">
                          Installment #{idx + 1}
                        </div>
                        <div className="font-bold text-indigo-900 mt-0.5">{formatCurrency(amount)}</div>
                        <div className="text-[10px] text-slate-400">
                          Due: {d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Upgrade Notes / Remarks (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                Upgrade Remarks / Office Notes (Optional)
              </label>
              <input
                type="text"
                value={upgradeNotes}
                onChange={(e) => setUpgradeNotes(e.target.value)}
                placeholder="e.g. Student requested upgrade after completing basic module"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!targetCourse}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirm Course Upgrade to {targetCourse?.code}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};


