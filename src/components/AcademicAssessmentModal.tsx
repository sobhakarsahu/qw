import React, { useState } from 'react';
import { Student, UserRole, InstituteSettings } from '../types';
import { formatDate, calculateCourseEndDate, isCourseDurationEnded } from '../utils/helpers';
import {
  X,
  Award,
  AlertCircle,
  CheckCircle2,
  FileText,
  Clock,
  GraduationCap,
  Calendar,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

interface AcademicAssessmentModalProps {
  student: Student;
  settings: InstituteSettings;
  currentRole: UserRole;
  currentStaffName?: string;
  onClose: () => void;
  onUpdateAcademicStatus: (updatedStudent: Student) => void;
  onOpenFormFillupFee: (student: Student) => void;
}

export const AcademicAssessmentModal: React.FC<AcademicAssessmentModalProps> = ({
  student,
  settings,
  currentRole,
  currentStaffName = 'Academic Coordinator',
  onClose,
  onUpdateAcademicStatus,
  onOpenFormFillupFee,
}) => {
  const durationEnded = isCourseDurationEnded(student.admissionDate, student.courseDuration || '6 Months');
  const courseEndDate = student.courseEndDate || calculateCourseEndDate(student.admissionDate, student.courseDuration || '6 Months');

  const [activeAction, setActiveAction] = useState<'EXAM_STATUS' | 'CERTIFICATE_ISSUE'>(
    student.academicStatus === 'EXAM_PASSED' ? 'CERTIFICATE_ISSUE' : 'EXAM_STATUS'
  );

  // Exam assessment form state
  const [examResult, setExamResult] = useState<'PASS' | 'FAIL'>(
    student.academicStatus === 'EXAM_FAILED_REATTEMPT' ? 'FAIL' : 'PASS'
  );
  const [examPassedDate, setExamPassedDate] = useState<string>(
    student.examPassedDate || new Date().toISOString().split('T')[0]
  );
  const [formFillupReason, setFormFillupReason] = useState<string>(
    student.formFillupReason || 'Semester Theory & Practical Re-attempt Examination'
  );
  const [examRemarks, setExamRemarks] = useState<string>('');

  // Certificate collection form state
  const [certificateNo, setCertificateNo] = useState<string>(
    student.certificateNo || `CERT-${settings.studentIdPrefix || 'SRIIT'}-${new Date().getFullYear()}-${student.rollNo.replace(/[^0-9]/g, '') || '01'}`
  );
  const [certificateDate, setCertificateDate] = useState<string>(
    student.certificateCollectedDate || new Date().toISOString().split('T')[0]
  );

  // Handle Exam Assessment Save
  const handleSaveExamAssessment = (e: React.FormEvent) => {
    e.preventDefault();

    if (examResult === 'PASS') {
      const updated: Student = {
        ...student,
        academicStatus: 'EXAM_PASSED',
        examPassedDate,
        formFillupRequired: false,
        formFillupReason: undefined,
      };
      onUpdateAcademicStatus(updated);
      setActiveAction('CERTIFICATE_ISSUE');
    } else {
      const updated: Student = {
        ...student,
        academicStatus: 'EXAM_FAILED_REATTEMPT',
        formFillupRequired: true,
        formFillupReason,
      };
      onUpdateAcademicStatus(updated);
      onClose();
    }
  };

  // Handle Certificate Issue / Collection Save
  const handleSaveCertificate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certificateNo.trim()) return;

    const updated: Student = {
      ...student,
      academicStatus: 'CERTIFICATE_COLLECTED',
      certificateNo: certificateNo.trim(),
      certificateCollectedDate: certificateDate,
      formFillupRequired: false,
    };
    onUpdateAcademicStatus(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Course Assessment & Certification</h3>
              <p className="text-xs text-slate-300">
                Authorized Staff & Director Academic Evaluation
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

        {/* Student Summary Card */}
        <div className="bg-slate-50 border-b border-slate-200 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black font-mono text-sm text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200">
                  {student.rollNo}
                </span>
                <span className="font-bold text-slate-900 text-sm">{student.name}</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Course: <span className="font-semibold text-slate-800">{student.courseName}</span>
              </p>
            </div>
            <div className="text-right text-xs">
              <div className="text-slate-500">
                Admission Date: <span className="font-semibold text-slate-700">{formatDate(student.admissionDate)}</span>
              </div>
              <div className="mt-0.5">
                {durationEnded ? (
                  <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-700" />
                    Course Duration Ended ({formatDate(courseEndDate)})
                  </span>
                ) : (
                  <span className="bg-emerald-100 text-emerald-800 font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-emerald-600" />
                    Ongoing Course (Ends {formatDate(courseEndDate)})
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Tabs */}
        <div className="flex border-b border-slate-200 bg-white">
          <button
            onClick={() => setActiveAction('EXAM_STATUS')}
            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition flex items-center justify-center gap-2 ${
              activeAction === 'EXAM_STATUS'
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Award className="w-4 h-4" />
            1. Exam Assessment (Clear / Not Pass)
          </button>
          <button
            onClick={() => setActiveAction('CERTIFICATE_ISSUE')}
            disabled={student.academicStatus !== 'EXAM_PASSED' && student.academicStatus !== 'CERTIFICATE_COLLECTED'}
            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition flex items-center justify-center gap-2 ${
              activeAction === 'CERTIFICATE_ISSUE'
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                : student.academicStatus === 'EXAM_PASSED' || student.academicStatus === 'CERTIFICATE_COLLECTED'
                ? 'border-transparent text-slate-500 hover:text-slate-700'
                : 'border-transparent text-slate-300 cursor-not-allowed'
            }`}
          >
            <FileText className="w-4 h-4" />
            2. Certificate Collection Marking
          </button>
        </div>

        {/* Tab 1: Exam Assessment Form */}
        {activeAction === 'EXAM_STATUS' && (
          <form onSubmit={handleSaveExamAssessment} className="p-6 space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-2">
                Mark Student Examination Outcome *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setExamResult('PASS')}
                  className={`p-3.5 rounded-xl border text-left flex items-start gap-2.5 transition cursor-pointer ${
                    examResult === 'PASS'
                      ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-900'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <CheckCircle2
                    className={`w-5 h-5 shrink-0 mt-0.5 ${
                      examResult === 'PASS' ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  />
                  <div>
                    <div className="font-bold text-sm">Exam Cleared (Pass)</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Student passed academic assessment. Enables Certificate Collection marking.
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setExamResult('FAIL')}
                  className={`p-3.5 rounded-xl border text-left flex items-start gap-2.5 transition cursor-pointer ${
                    examResult === 'FAIL'
                      ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/20 text-rose-900'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <AlertCircle
                    className={`w-5 h-5 shrink-0 mt-0.5 ${
                      examResult === 'FAIL' ? 'text-rose-600' : 'text-slate-400'
                    }`}
                  />
                  <div>
                    <div className="font-bold text-sm">Not Pass (Re-attempt)</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Student did not clear exam. Displays Form Fillup option for registration & fee.
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* If Exam Cleared (Pass) */}
            {examResult === 'PASS' && (
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 font-bold">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Student Cleared Exam Successfully</span>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Exam Clearance Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={examPassedDate}
                    onChange={(e) => setExamPassedDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div className="text-[11px] text-emerald-700">
                  ✓ After marking as Pass, you can proceed immediately to issue the Certificate Serial Number and mark Certificate Collection.
                </div>
              </div>
            )}

            {/* If Not Pass -> Form Fillup Option */}
            {examResult === 'FAIL' && (
              <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-rose-800 font-bold">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Form Fillup Option Displayed for Re-attempt</span>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Form Fillup Purpose / Paper Details *
                  </label>
                  <input
                    type="text"
                    required
                    value={formFillupReason}
                    onChange={(e) => setFormFillupReason(e.target.value)}
                    placeholder="e.g. Theory Re-exam & Practical Viva Form Fillup"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>
                <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-rose-200">
                  <div className="text-[11px] text-slate-600">
                    Student will be queued in the <strong>Extra Fees & Form Fillup tab</strong>.
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateAcademicStatus({
                        ...student,
                        academicStatus: 'EXAM_FAILED_REATTEMPT',
                        formFillupRequired: true,
                        formFillupReason,
                      });
                      onOpenFormFillupFee(student);
                      onClose();
                    }}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition shadow-xs flex items-center gap-1 cursor-pointer"
                  >
                    <span>Collect Form Fillup Fee (₹500)</span>
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Evaluation Notes / Evaluator Remarks
              </label>
              <input
                type="text"
                value={examRemarks}
                onChange={(e) => setExamRemarks(e.target.value)}
                placeholder="e.g. Assessment conducted by Er. Alok Ranjan (Score: 84%)"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            {/* Form Footer */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 font-medium text-slate-600 hover:text-slate-900 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl transition shadow-xs cursor-pointer"
              >
                Save Exam Outcome
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Certificate Collection Marking Form */}
        {activeAction === 'CERTIFICATE_ISSUE' && (
          <form onSubmit={handleSaveCertificate} className="p-6 space-y-4 text-xs">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-amber-900">
              <Award className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold">Student Has Cleared Exam!</span>
                <p className="text-[11px] text-amber-800">
                  Mark official Certificate Collection and record Certificate Serial No.
                </p>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Official Certificate Serial Number *
              </label>
              <input
                type="text"
                required
                value={certificateNo}
                onChange={(e) => setCertificateNo(e.target.value)}
                placeholder="e.g. CERT-SRIIT-2026-0014"
                className="w-full px-3 py-2 font-mono font-bold text-indigo-900 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Certificate Collection / Handover Date *
              </label>
              <input
                type="date"
                required
                value={certificateDate}
                onChange={(e) => setCertificateDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-600">
              <div className="text-[11px] space-y-1">
                <div>• Institute: <strong>{settings.name}</strong></div>
                <div>• Trainee: <strong>{student.name}</strong> ({student.rollNo})</div>
                <div>• Program: <strong>{student.courseName}</strong></div>
                <div>• Issued By Authorized Center Head: <strong>{settings.directorName}</strong></div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 font-medium text-slate-600 hover:text-slate-900 transition"
              >
                Close
              </button>
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Mark Certificate Collected
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
