import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { Student, InstituteSettings } from '../types';
import { formatDate, calculateCourseEndDate } from '../utils/helpers';
import { downloadElementAsPdf, triggerPrint } from '../utils/printPdf';
import {
  X,
  Printer,
  QrCode,
  ShieldCheck,
  Calendar,
  Clock,
  Phone,
  User,
  GraduationCap,
  Sparkles,
  Download,
  Loader2,
} from 'lucide-react';

interface StudentIDCardModalProps {
  student: Student;
  settings: InstituteSettings;
  onClose: () => void;
  isNewlyRegistered?: boolean;
}

export const StudentIDCardModal: React.FC<StudentIDCardModalProps> = ({
  student,
  settings,
  onClose,
  isNewlyRegistered = false,
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const courseEndDate = student.courseEndDate || calculateCourseEndDate(student.admissionDate, student.courseDuration || '6 Months');

  useEffect(() => {
    // Generate QR Code data payload for security verification
    const qrPayload = JSON.stringify({
      institute: settings.name,
      regNo: settings.regNo,
      studentId: student.rollNo,
      name: student.name,
      course: student.courseName,
      batch: student.batchTime,
      admitted: student.admissionDate,
      validTill: courseEndDate,
      phone: student.phone,
      verificationStatus: 'AUTHENTICATED_STUDENT',
    });

    QRCode.toDataURL(
      qrPayload,
      {
        width: 180,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      },
      (err, url) => {
        if (!err && url) {
          setQrCodeDataUrl(url);
        }
      }
    );
  }, [student, settings, courseEndDate]);

  const handlePrint = () => {
    triggerPrint();
  };

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    setIsGeneratingPdf(true);
    try {
      const studentSlug = (student.name || 'Student').replace(/\s+/g, '-');
      const fileName = `ID-Card-${student.rollNo}-${studentSlug}.pdf`;
      await downloadElementAsPdf(printRef.current, {
        fileName,
        orientation: 'portrait',
        format: 'a4',
        margin: 12,
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden print:shadow-none print:border-none print:w-full">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Student Identity Card</h3>
              <p className="text-xs text-slate-400">Roll No & QR Code Enabled Verification</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Download PDF Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              title="Download high-resolution official ID Card PDF"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  PDF...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  Save PDF
                </>
              )}
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              title="Print ID Card"
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

        {/* Newly registered notification banner */}
        {isNewlyRegistered && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 flex items-center justify-between print:hidden">
            <div className="flex items-center gap-2 text-emerald-800 text-xs font-medium">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Registration completed successfully! Official Student ID Card generated.</span>
            </div>
            <span className="bg-emerald-200 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
              Ready to Issue
            </span>
          </div>
        )}

        {/* ID Card Display Container */}
        <div className="p-6 bg-slate-100 flex flex-col items-center justify-center print:p-0 print:bg-white">
          <div
            ref={printRef}
            id="student-id-card"
            className="w-full max-w-[480px] bg-white rounded-xl shadow-lg border border-slate-300 overflow-hidden relative print:shadow-none print:border-2 print:border-slate-800"
            style={{ minHeight: '290px' }}
          >
            {/* ID Card Header Bar */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-3.5 text-center relative border-b-2 border-amber-400">
              <div className="flex items-center justify-center gap-2 mb-0.5">
                <div className="w-6 h-6 rounded-md bg-amber-400 text-slate-900 font-extrabold text-xs flex items-center justify-center shadow-xs">
                  {settings.name.charAt(0)}
                </div>
                <h2 className="font-extrabold text-sm tracking-wide uppercase text-white leading-tight">
                  {settings.name}
                </h2>
              </div>
              <p className="text-[10px] text-amber-300 font-medium tracking-wide">
                {settings.tagline}
              </p>
              <div className="flex items-center justify-center gap-3 text-[9px] text-slate-300 mt-0.5">
                <span>Reg: {settings.regNo}</span>
                <span>•</span>
                <span>{settings.isoCertified}</span>
              </div>
            </div>

            {/* Sub-header stripe */}
            <div className="bg-amber-400 text-slate-950 text-[10px] font-bold uppercase tracking-widest text-center py-0.5">
              Official Student Identity Card • Valid 2026-2027
            </div>

            {/* Card Body */}
            <div className="p-4 grid grid-cols-12 gap-3.5">
              {/* Left Column: Photo & QR Code */}
              <div className="col-span-4 flex flex-col items-center justify-between border-r border-slate-200 pr-3">
                {/* Photo box */}
                <div className="w-24 h-28 rounded-lg border-2 border-indigo-200 bg-slate-100 overflow-hidden flex flex-col items-center justify-center shadow-xs relative">
                  {student.photoUrl ? (
                    <img
                      src={student.photoUrl}
                      alt={student.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-indigo-50 to-slate-200 text-slate-400">
                      <User className="w-10 h-10 text-indigo-300" />
                      <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider mt-1">
                        PHOTO
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-0 inset-x-0 bg-indigo-900/80 text-[8px] text-indigo-100 text-center py-0.5 font-semibold">
                    STUDENT
                  </div>
                </div>

                {/* QR Code Section */}
                <div className="mt-2 text-center flex flex-col items-center">
                  <div className="p-1 bg-white border border-slate-300 rounded-md shadow-2xs">
                    {qrCodeDataUrl ? (
                      <img
                        src={qrCodeDataUrl}
                        alt={`QR Code for ${student.rollNo}`}
                        className="w-16 h-16"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-slate-100 flex items-center justify-center">
                        <QrCode className="w-8 h-8 text-slate-400" />
                      </div>
                    )}
                  </div>
                  <span className="text-[8px] text-slate-500 font-mono font-bold mt-0.5">
                    SCAN TO VERIFY
                  </span>
                </div>
              </div>

              {/* Right Column: Student Details */}
              <div className="col-span-8 flex flex-col justify-between pl-1">
                <div>
                  {/* Roll Number / Student ID badge */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-500">
                      Student ID No:
                    </span>
                    <span className="bg-indigo-900 text-amber-300 font-mono font-black text-xs px-2.5 py-0.5 rounded-md border border-indigo-700 shadow-2xs">
                      {student.rollNo}
                    </span>
                  </div>

                  {/* Student Name */}
                  <div className="mb-2">
                    <h3 className="font-extrabold text-slate-900 text-sm leading-snug">
                      {student.name}
                    </h3>
                    <p className="text-[11px] text-slate-600 font-medium">
                      S/D of: <span className="font-semibold text-slate-800">{student.fatherName}</span>
                    </p>
                  </div>

                  {/* Course & Timing Table */}
                  <div className="space-y-1 text-[11px] text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <div className="flex items-start gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-900">{student.courseName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-slate-600">
                      <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>Batch: {student.batchTime}</span>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-slate-600">
                      <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>Contact: +91 {student.phone}</span>
                    </div>

                    {student.dob && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-600">
                        <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>DOB: {formatDate(student.dob)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Validity and Signatures footer */}
                <div className="mt-3 pt-2 border-t border-slate-200 flex items-end justify-between">
                  <div className="text-[9px] text-slate-600">
                    <div>
                      Admitted: <span className="font-bold text-slate-800">{formatDate(student.admissionDate)}</span>
                    </div>
                    <div>
                      Valid Till:{' '}
                      <span className="font-bold text-indigo-900">
                        {formatDate(courseEndDate)}
                      </span>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="font-serif italic font-bold text-xs text-indigo-950 border-b border-slate-400 pb-0.5 px-2">
                      {settings.directorName.split(' ')[0]}
                    </div>
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter block mt-0.5">
                      Director Sign / Seal
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Contact Strip */}
            <div className="bg-slate-900 text-slate-300 text-[8px] py-1 px-3 flex items-center justify-between border-t border-slate-800">
              <span className="truncate max-w-[280px]">{settings.address}, {settings.city}</span>
              <span>Ph: {settings.phone}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="text-xs text-slate-500">
            Card Format: CR-80 Standard • QR code contains tamper-proof student record
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
            >
              Close
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download PDF
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print ID Card
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
