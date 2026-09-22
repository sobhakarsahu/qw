import React, { useState, useMemo } from 'react';
import { Student, Course, InstituteSettings, UserRole } from '../types';
import {
  formatCurrency,
  formatDate,
  downloadCSV,
  generateStudentRollNo,
  calculateNextStudentId,
  calculateCourseEndDate,
  getInstallmentTitle,
  isCourseDurationEnded,
  isTodayBirthday,
} from '../utils/helpers';
import {
  UserPlus,
  Upload,
  Download,
  Search,
  Filter,
  MessageSquare,
  Banknote,
  Receipt,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Phone,
  Fingerprint,
  FileSpreadsheet,
  X,
  Plus,
  Cake,
  TrendingUp,
  Sparkles,
  ContactRound,
  Award,
  GraduationCap,
  FileText,
  QrCode,
  CheckCircle,
  Edit3,
  Trash2,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { WhatsAppReminderModal } from './WhatsAppReminderModal';
import { BirthdayGreetingModal } from './BirthdayGreetingModal';
import { CourseUpgradeModal } from './CourseUpgradeModal';
import { StudentIDCardModal } from './StudentIDCardModal';
import { AcademicAssessmentModal } from './AcademicAssessmentModal';

interface StudentManagerProps {
  students: Student[];
  courses: Course[];
  settings: InstituteSettings;
  currentRole: UserRole;
  currentStaffName?: string;
  onAddStudent: (student: Student) => void;
  onUpdateStudent?: (updatedStudent: Student) => void;
  onDeleteStudent?: (studentId: string) => void;
  onImportStudents: (newStudents: Student[]) => void;
  onOpenCollectModal: (studentId: string) => void;
  onUpgradeStudent?: (updatedStudent: Student) => void;
  onSelectStudentProfile?: (student: Student) => void;
  onOpenFormFillupFee?: (student: Student) => void;
}

export const StudentManager: React.FC<StudentManagerProps> = ({
  students,
  courses,
  settings,
  currentRole,
  currentStaffName = 'Front Desk Staff',
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onImportStudents,
  onOpenCollectModal,
  onUpgradeStudent,
  onSelectStudentProfile,
  onOpenFormFillupFee,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('ALL');
  const [feeStatusFilter, setFeeStatusFilter] = useState('ALL');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [whatsAppStudent, setWhatsAppStudent] = useState<Student | null>(null);
  const [birthdayStudent, setBirthdayStudent] = useState<Student | null>(null);
  const [upgradingStudent, setUpgradingStudent] = useState<Student | null>(null);
  const [selectedStudentForIDCard, setSelectedStudentForIDCard] = useState<Student | null>(null);
  const [isNewlyRegisteredCard, setIsNewlyRegisteredCard] = useState(false);
  const [assessingStudent, setAssessingStudent] = useState<Student | null>(null);
  const [importCsvText, setImportCsvText] = useState('');

  // Admin Edit & Delete Modal States
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);

  // Edit Student Form State
  const [editRollNo, setEditRollNo] = useState('');
  const [editBiometricId, setEditBiometricId] = useState('');
  const [editName, setEditName] = useState('');
  const [editFatherName, setEditFatherName] = useState('');
  const [editMotherName, setEditMotherName] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editParentPhone, setEditParentPhone] = useState('');
  const [editCourseId, setEditCourseId] = useState('');
  const [editBatchTime, setEditBatchTime] = useState('');
  const [editAdmissionDate, setEditAdmissionDate] = useState('');
  const [editTotalFee, setEditTotalFee] = useState<number>(0);
  const [editDiscount, setEditDiscount] = useState<number>(0);
  const [editAcademicStatus, setEditAcademicStatus] = useState<Student['academicStatus']>('IN_PROGRESS');
  const [editCertificateNo, setEditCertificateNo] = useState('');
  const [editCertificateCollectedDate, setEditCertificateCollectedDate] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'completed' | 'dropped'>('active');
  const [editAddress, setEditAddress] = useState('');

  // Handle open edit student modal
  const handleOpenEditStudent = (student: Student) => {
    setEditingStudent(student);
    setEditRollNo(student.rollNo);
    setEditBiometricId(student.biometricId);
    setEditName(student.name);
    setEditFatherName(student.fatherName);
    setEditMotherName(student.motherName || '');
    setEditDob(student.dob || '');
    setEditEmail(student.email);
    setEditPhone(student.phone);
    setEditParentPhone(student.parentPhone);
    setEditCourseId(student.courseId);
    setEditBatchTime(student.batchTime);
    setEditAdmissionDate(student.admissionDate);
    setEditTotalFee(student.totalFee);
    setEditDiscount(student.discount || 0);
    setEditAcademicStatus(student.academicStatus || 'IN_PROGRESS');
    setEditCertificateNo(student.certificateNo || '');
    setEditCertificateCollectedDate(student.certificateCollectedDate || '');
    setEditStatus(student.status);
    setEditAddress(student.address || '');
  };

  // Handle save edited student
  const handleSaveEditedStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    const matchedCourse = courses.find((c) => c.id === editCourseId) || {
      id: editCourseId,
      name: editingStudent.courseName,
      duration: editingStudent.courseDuration || '6 Months',
    };

    const calculatedNetFee = Math.max(0, editTotalFee - editDiscount);
    const calculatedPendingAmount = Math.max(0, calculatedNetFee - editingStudent.paidAmount);
    const duration = matchedCourse.duration || editingStudent.courseDuration || '6 Months';
    const courseEndDate = calculateCourseEndDate(editAdmissionDate, duration);

    const updated: Student = {
      ...editingStudent,
      rollNo: editRollNo.trim(),
      biometricId: editBiometricId.trim(),
      name: editName.trim(),
      fatherName: editFatherName.trim(),
      motherName: editMotherName.trim() || undefined,
      dob: editDob.trim() || undefined,
      email: editEmail.trim(),
      phone: editPhone.trim(),
      parentPhone: editParentPhone.trim(),
      courseId: editCourseId,
      courseName: matchedCourse.name,
      courseDuration: duration,
      courseEndDate,
      batchTime: editBatchTime,
      admissionDate: editAdmissionDate,
      totalFee: editTotalFee,
      discount: editDiscount,
      netPayableFee: calculatedNetFee,
      pendingAmount: calculatedPendingAmount,
      status: editStatus,
      academicStatus: editAcademicStatus,
      certificateNo: editCertificateNo.trim() || undefined,
      certificateCollectedDate: editCertificateCollectedDate.trim() || undefined,
      address: editAddress.trim() || undefined,
    };

    if (onUpdateStudent) {
      onUpdateStudent(updated);
    }
    setEditingStudent(null);
  };

  // Handle delete student
  const handleConfirmDeleteStudent = () => {
    if (!deletingStudent) return;
    if (onDeleteStudent) {
      onDeleteStudent(deletingStudent.id);
    }
    setDeletingStudent(null);
  };

  // Auto-calculated Next Student ID
  const defaultNextStudentId = useMemo(() => {
    return calculateNextStudentId(
      students.map((s) => s.rollNo),
      settings.studentIdPrefix || 'SRIIT',
      settings.studentIdDigits || 4
    );
  }, [students, settings.studentIdPrefix, settings.studentIdDigits]);

  // Add Student Form State
  const [customRollNo, setCustomRollNo] = useState('');
  const [name, setName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [dob, setDob] = useState(''); // Date of Birth (Optional)
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || '');
  const [batchTime, setBatchTime] = useState('08:00 AM - 10:00 AM (Morning)');
  const [admissionDate, setAdmissionDate] = useState(new Date().toISOString().split('T')[0]);
  const [discount, setDiscount] = useState<number>(0);
  const [installmentsCount, setInstallmentsCount] = useState<number>(3);
  const [address, setAddress] = useState('');

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];
  const courseBaseFee = selectedCourse?.fee || 10000;
  const netFee = Math.max(0, courseBaseFee - discount);

  // Handle Add Student Submit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !selectedCourse) return;

    // Use custom roll number if specified, otherwise the auto-calculated next ID
    const rollNo = (customRollNo.trim() || defaultNextStudentId).toUpperCase();
    const biometricId = rollNo.replace(/\D/g, '') || String(students.length + 101);

    // Course duration & end date calculation
    const duration = selectedCourse.duration || '6 Months';
    const courseEndDate = calculateCourseEndDate(admissionDate, duration);

    // Generate installment schedule (up to 8 installments, with installment 1 called "Admission Fees")
    const installmentAmount = Math.round(netFee / installmentsCount);
    const generatedInstallments = [];
    const admDateObj = new Date(admissionDate);

    for (let i = 1; i <= installmentsCount; i++) {
      const dueDateObj = new Date(admDateObj);
      dueDateObj.setMonth(dueDateObj.getMonth() + (i - 1));
      const dueStr = dueDateObj.toISOString().split('T')[0];

      generatedInstallments.push({
        installmentNo: i,
        installmentTitle: getInstallmentTitle(i),
        amount: i === installmentsCount ? netFee - installmentAmount * (installmentsCount - 1) : installmentAmount,
        dueDate: dueStr,
        status: 'pending' as const,
      });
    }

    const newStudent: Student = {
      id: `stu-${Date.now()}`,
      rollNo,
      biometricId,
      name: name.trim(),
      fatherName: fatherName.trim() || 'Mr. Guardian',
      motherName: motherName.trim() || undefined,
      dob: dob.trim() || undefined,
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '')}@student.edu`,
      phone: phone.trim(),
      parentPhone: parentPhone.trim() || phone.trim(),
      courseId: selectedCourse.id,
      courseName: selectedCourse.name,
      courseDuration: duration,
      courseEndDate,
      academicStatus: 'IN_PROGRESS',
      batchTime,
      admissionDate,
      totalFee: courseBaseFee,
      discount,
      netPayableFee: netFee,
      paidAmount: 0,
      pendingAmount: netFee,
      status: 'active',
      installments: generatedInstallments,
      address: address.trim() || undefined,
    };

    onAddStudent(newStudent);
    setShowAddModal(false);

    // Immediately open the Student ID Card modal with roll number base QR code!
    setSelectedStudentForIDCard(newStudent);
    setIsNewlyRegisteredCard(true);

    // Reset fields
    setCustomRollNo('');
    setName('');
    setFatherName('');
    setMotherName('');
    setDob('');
    setEmail('');
    setPhone('');
    setParentPhone('');
    setDiscount(0);
    setAddress('');
  };

  // Export Students CSV
  const handleExportStudentsCSV = () => {
    const headers = [
      'Roll No',
      'Biometric ID',
      'Name',
      'Father Name',
      'Phone (WhatsApp)',
      'Parent Phone',
      'DOB (YYYY-MM-DD)',
      'Course',
      'Batch',
      'Admission Date',
      'Total Fee',
      'Discount',
      'Net Payable',
      'Paid Amount',
      'Pending Due',
      'Status',
    ];

    const rows = students.map((s) => [
      s.rollNo,
      s.biometricId,
      `"${s.name}"`,
      `"${s.fatherName}"`,
      s.phone,
      s.parentPhone,
      s.dob || '',
      `"${s.courseName}"`,
      `"${s.batchTime}"`,
      s.admissionDate,
      s.totalFee,
      s.discount,
      s.netPayableFee,
      s.paidAmount,
      s.pendingAmount,
      s.status,
    ]);

    const content = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadCSV('students-directory.csv', content);
  };

  // Sample CSV Template Download
  const handleDownloadSampleCSV = () => {
    const sample = `Name,FatherName,Phone,ParentPhone,CourseCode,BatchTiming,Fee,Discount,Installments,DOB_YYYY-MM-DD
Aakash Gupta,Mr. Ashok Gupta,9876500001,9876500002,OSCIT,08:00 AM - 10:00 AM,4000,0,1,2005-08-15
Divya Rawat,Mr. Sunil Rawat,9876500003,9876500004,OSCIT-A,10:00 AM - 12:00 PM,9500,500,2,2004-11-20
Mohit Mehra,Mr. Rajan Mehra,9876500005,9876500006,OSCIT-A+,04:00 PM - 06:00 PM,19500,1000,4,2003-03-20`;
    downloadCSV('sample-students-import-template.csv', sample);
  };

  // Process Bulk CSV Import
  const handleProcessImport = () => {
    if (!importCsvText.trim()) return;
    const lines = importCsvText.trim().split('\n');
    const importedList: Student[] = [];

    lines.forEach((line, index) => {
      if (index === 0 && line.toLowerCase().includes('name')) return; // Header
      const parts = line.split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
      if (parts.length >= 3) {
        const sName = parts[0];
        const sFather = parts[1] || 'Parent';
        const sPhone = parts[2] || '9876543210';
        const sParentPhone = parts[3] || sPhone;
        const sCourseCode = parts[4] || 'OSCIT';
        const sBatch = parts[5] || '08:00 AM - 10:00 AM';
        const sFee = Number(parts[6]) || 4000;
        const sDiscount = Number(parts[7]) || 0;
        const sInstCount = Number(parts[8]) || 2;
        const sDob = parts[9]?.trim() ? parts[9].trim() : undefined;

        const matchedCourse =
          courses.find((c) => c.code.toLowerCase() === sCourseCode.toLowerCase()) || courses[0];
        const nextSeq = students.length + importedList.length + 101;
        const rollNo = generateStudentRollNo(matchedCourse.code, nextSeq);
        const net = Math.max(0, sFee - sDiscount);

        const installmentAmount = Math.round(net / sInstCount);
        const instList = [];
        for (let i = 1; i <= sInstCount; i++) {
          instList.push({
            installmentNo: i,
            amount: i === sInstCount ? net - installmentAmount * (sInstCount - 1) : installmentAmount,
            dueDate: new Date(Date.now() + (i - 1) * 30 * 24 * 3600 * 1000)
              .toISOString()
              .split('T')[0],
            status: 'pending' as const,
          });
        }

        importedList.push({
          id: `stu-imp-${Date.now()}-${index}`,
          rollNo,
          biometricId: String(nextSeq),
          name: sName,
          fatherName: sFather,
          dob: sDob,
          email: `${sName.toLowerCase().replace(/\s+/g, '')}@student.edu`,
          phone: sPhone,
          parentPhone: sParentPhone,
          courseId: matchedCourse.id,
          courseName: matchedCourse.name,
          batchTime: sBatch,
          admissionDate: new Date().toISOString().split('T')[0],
          totalFee: sFee,
          discount: sDiscount,
          netPayableFee: net,
          paidAmount: 0,
          pendingAmount: net,
          status: 'active',
          installments: instList,
        });
      }
    });

    if (importedList.length > 0) {
      onImportStudents(importedList);
      setShowImportModal(false);
      setImportCsvText('');
    }
  };

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.biometricId.includes(searchQuery) ||
      s.phone.includes(searchQuery);

    const matchCourse = courseFilter === 'ALL' || s.courseId === courseFilter;

    let matchFee = true;
    if (feeStatusFilter === 'PAID') matchFee = s.pendingAmount === 0;
    if (feeStatusFilter === 'DUE') matchFee = s.pendingAmount > 0;
    if (feeStatusFilter === 'OVERDUE') {
      matchFee = s.installments.some((i) => i.status === 'overdue');
    }

    return matchSearch && matchCourse && matchFee;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      {students.some((s) => isTodayBirthday(s.dob)) && (
        <div className="bg-gradient-to-r from-pink-50 via-rose-50 to-amber-50 border border-pink-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-600 text-white flex items-center justify-center text-xl shadow-xs">
              🎂
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-pink-900 uppercase tracking-wider">
                  Today's Student Birthdays!
                </span>
                <span className="bg-pink-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Special Occasion
                </span>
              </div>
              <p className="text-xs text-pink-800 mt-0.5">
                Congratulate your trainees on their birthday with personalized academy wishes on WhatsApp & SMS.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {students
              .filter((s) => isTodayBirthday(s.dob))
              .map((bStu) => (
                <button
                  key={bStu.id}
                  onClick={() => setBirthdayStudent(bStu)}
                  className="bg-white hover:bg-pink-50 text-pink-700 border border-pink-300 text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  <Cake className="w-3.5 h-3.5 text-pink-600" />
                  Wish {bStu.name.split(' ')[0]} 🎉
                </button>
              ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-0.5 rounded-full font-bold border border-indigo-200">
              Student Information & Enrollment
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {students.length} Registered Trainees
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Student Admissions & Fee Ledgers
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage course enrollments, biometric device sync IDs, installment milestones, and parent WhatsApp reminders.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setCustomRollNo(defaultNextStudentId);
              setShowAddModal(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition shadow-sm flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            Add New Student
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 border border-slate-300"
          >
            <Upload className="w-4 h-4 text-slate-600" />
            Import CSV
          </button>
          <button
            onClick={handleExportStudentsCSV}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 border border-slate-300"
          >
            <Download className="w-4 h-4 text-slate-600" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
          >
            <option value="ALL">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={feeStatusFilter}
            onChange={(e) => setFeeStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
          >
            <option value="ALL">All Fee Status</option>
            <option value="PAID">Fully Paid</option>
            <option value="DUE">Pending Dues</option>
            <option value="OVERDUE">Overdue Installments</option>
          </select>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, roll no, phone, bio ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Roll No / Bio ID</th>
                <th className="py-3 px-4">Student Details</th>
                <th className="py-3 px-4">Course & Duration</th>
                <th className="py-3 px-4">Exam & Certificate</th>
                <th className="py-3 px-4 text-right">Fee Details</th>
                <th className="py-3 px-4 text-center">Fee Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <UserPlus className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">No students found</p>
                    <p className="text-xs text-slate-400">
                      Try adjusting your search criteria or add a new trainee.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const hasOverdue = s.installments.some((i) => i.status === 'overdue');
                  const isFullyPaid = s.pendingAmount === 0;
                  const isDurationEnded = isCourseDurationEnded(s.courseEndDate);

                  return (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-bold text-indigo-700">{s.rollNo}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Fingerprint className="w-3 h-3 text-slate-400" />
                          <span>Bio: {s.biometricId}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{s.name}</div>
                        <div className="text-[11px] text-slate-500">
                          S/O: {s.fatherName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                          <span>Ph: {s.phone}</span>
                          <span>•</span>
                          <span>Parent: {s.parentPhone}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800 max-w-[200px] truncate" title={s.courseName}>
                          {s.courseName}
                        </div>
                        <div className="text-[11px] text-indigo-600 font-mono">
                          {s.batchTime}
                        </div>
                        <div className="mt-1">
                          {isDurationEnded ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200" title="Course duration ended. Course does not expire, student retains active access.">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Duration Ended ({formatDate(s.courseEndDate)})
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-medium">
                              Duration: {s.courseDuration || '6 Months'} (Valid till {formatDate(s.courseEndDate)})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {s.academicStatus === 'EXAM_PASSED' ? (
                          s.certificateCollectedDate ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                                Certificate Issued
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                #{s.certificateNo || 'SRIIT-CERT'}
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1 items-start">
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                <Award className="w-3 h-3 text-emerald-600" />
                                Exam Cleared (Passed)
                              </span>
                              <button
                                onClick={() => setAssessingStudent(s)}
                                className="text-[10px] font-bold bg-amber-500 hover:bg-amber-600 text-white px-2 py-0.5 rounded flex items-center gap-1 shadow-xs transition"
                              >
                                <Award className="w-3 h-3" />
                                Mark Certificate Collected
                              </button>
                            </div>
                          )
                        ) : s.academicStatus === 'EXAM_FAILED_REATTEMPT' || s.formFillupRequired ? (
                          <div className="flex flex-col gap-1 items-start">
                            <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              Exam Not Passed
                            </span>
                            <button
                              onClick={() => {
                                if (onOpenFormFillupFee) onOpenFormFillupFee(s);
                                else setAssessingStudent(s);
                              }}
                              className="text-[10px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-0.5 rounded flex items-center gap-1 shadow-xs transition"
                            >
                              <FileText className="w-3 h-3" />
                              Form Fillup Option
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1 items-start">
                            <span className="text-[11px] text-slate-500 font-medium">
                              {isDurationEnded ? 'Awaiting Exam Assessment' : 'Course In Progress'}
                            </span>
                            <button
                              onClick={() => setAssessingStudent(s)}
                              className="text-[10px] font-semibold bg-slate-100 hover:bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded flex items-center gap-1 transition"
                            >
                              <GraduationCap className="w-3 h-3" />
                              Assess Exam
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono">
                        <div className="font-semibold text-slate-800">
                          {formatCurrency(s.netPayableFee)}
                        </div>
                        <div className="text-[10px] text-emerald-700">
                          Paid: {formatCurrency(s.paidAmount)}
                        </div>
                        <div className={`text-[10px] font-bold ${isFullyPaid ? 'text-slate-400' : 'text-rose-600'}`}>
                          Due: {formatCurrency(s.pendingAmount)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isFullyPaid ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Fully Paid
                          </span>
                        ) : hasOverdue ? (
                          <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Overdue
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Partial Due
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Student ID Card with Roll Number Base QR Code */}
                          <button
                            onClick={() => {
                              setSelectedStudentForIDCard(s);
                              setIsNewlyRegisteredCard(false);
                            }}
                            title="Generate / View Roll Number QR ID Card"
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 p-1.5 rounded-lg transition"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>

                          {!isFullyPaid && (
                            <button
                              onClick={() => onOpenCollectModal(s.id)}
                              title="Collect Fee Counter"
                              className="bg-indigo-600 hover:bg-indigo-500 text-white p-1.5 rounded-lg text-xs font-medium transition shadow-xs flex items-center gap-1"
                            >
                              <Banknote className="w-3.5 h-3.5" />
                              <span className="text-[11px] font-bold pr-0.5">Collect</span>
                            </button>
                          )}

                          <button
                            onClick={() => setWhatsAppStudent(s)}
                            title="Send WhatsApp Fee Reminder"
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 p-1.5 rounded-lg transition"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setUpgradingStudent(s)}
                            title="Upgrade Course (OSCIT / OSCIT A / OSCIT A+)"
                            className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 p-1.5 rounded-lg transition"
                          >
                            <TrendingUp className="w-3.5 h-3.5" />
                          </button>

                          {isTodayBirthday(s.dob) && (
                            <button
                              onClick={() => setBirthdayStudent(s)}
                              title="Send Birthday Greeting via WhatsApp/SMS"
                              className="bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-300 p-1.5 rounded-lg transition animate-pulse"
                            >
                              <Cake className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {onSelectStudentProfile && (
                            <button
                              onClick={() => onSelectStudentProfile(s)}
                              title="View Student Parent Portal Profile"
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 rounded-lg transition"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Admin Rights: Edit and Delete Student */}
                          {currentRole === 'admin' && (
                            <>
                              <button
                                onClick={() => handleOpenEditStudent(s)}
                                title="Edit Student Admission & Profile (Admin Right)"
                                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-300 p-1.5 rounded-lg transition cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => setDeletingStudent(s)}
                                title="Delete Student Record (Admin Right)"
                                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 p-1.5 rounded-lg transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
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

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-6">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-600 rounded-lg">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Student Admission Form</h3>
                  <p className="text-xs text-slate-300">
                    {settings.name} • New Trainee Enrollment
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Customizable Student ID with Auto-Displayed Next Number */}
                <div className="sm:col-span-2 bg-indigo-50/80 p-3.5 rounded-xl border border-indigo-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                    <label className="font-bold text-indigo-950 flex items-center gap-1.5">
                      <Fingerprint className="w-4 h-4 text-indigo-600" />
                      Student ID No (Roll No) *
                    </label>
                    <span className="text-[11px] text-indigo-700 font-mono font-bold bg-white px-2 py-0.5 rounded border border-indigo-200">
                      Example: SRIIT0014 (Auto-displayed next number, customizable)
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={customRollNo}
                      onChange={(e) => setCustomRollNo(e.target.value.toUpperCase())}
                      placeholder="e.g. SRIIT0014"
                      className="flex-1 px-3 py-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-sm uppercase bg-white text-indigo-950"
                    />
                    <button
                      type="button"
                      onClick={() => setCustomRollNo(defaultNextStudentId)}
                      className="px-3 py-2 text-xs font-semibold bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-100 rounded-lg transition"
                      title="Reset to next sequential auto number"
                    >
                      Auto Reset
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    The next sequential student ID number is automatically computed and displayed. You can customize the ID or prefix if needed.
                  </p>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Student Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Father's Name *</label>
                  <input
                    type="text"
                    required
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    placeholder="e.g. Mr. Mohan Kumar"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Student Mobile (WhatsApp) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Parent / Guardian Mobile
                  </label>
                  <input
                    type="tel"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="For fee SMS & WhatsApp reminders"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">Course Program *</label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.duration} - Fee: ₹{c.fee})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Batch Timings *</label>
                  <select
                    value={batchTime}
                    onChange={(e) => setBatchTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="08:00 AM - 10:00 AM (Morning)">08:00 AM - 10:00 AM (Morning)</option>
                    <option value="10:00 AM - 12:00 PM (Batch A)">10:00 AM - 12:00 PM (Batch A)</option>
                    <option value="12:00 PM - 02:00 PM (Noon)">12:00 PM - 02:00 PM (Noon)</option>
                    <option value="02:00 PM - 04:00 PM (Afternoon)">02:00 PM - 04:00 PM (Afternoon)</option>
                    <option value="04:00 PM - 06:00 PM (Evening)">04:00 PM - 06:00 PM (Evening)</option>
                    <option value="06:00 PM - 08:00 PM (Weekend)">06:00 PM - 08:00 PM (Late Batch)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Admission Date</label>
                  <input
                    type="date"
                    value={admissionDate}
                    onChange={(e) => setAdmissionDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Date of Birth <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Special Concession / Discount (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={courseBaseFee}
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Installment Plan (Up to 8 Installments)
                  </label>
                  <select
                    value={installmentsCount}
                    onChange={(e) => setInstallmentsCount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value={1}>1 Single Lumpsum (Admission Fees)</option>
                    <option value={2}>2 Installments (Admission Fees + 2nd Installment)</option>
                    <option value={3}>3 Installments (Admission Fees + 2nd, 3rd Installment)</option>
                    <option value={4}>4 Installments (Admission Fees + 3 Monthly Installments)</option>
                    <option value={5}>5 Installments (Admission Fees + 4 Monthly Installments)</option>
                    <option value={6}>6 Installments (Admission Fees + 5 Monthly Installments)</option>
                    <option value={7}>7 Installments (Admission Fees + 6 Monthly Installments)</option>
                    <option value={8}>8 Installments (Admission Fees + 7 Monthly Installments)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">
                    Residential Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House no, street, locality, city"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Fee Calculation Summary Preview */}
              <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-200 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Standard Course Fee:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {formatCurrency(courseBaseFee)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Concession / Discount:</span>
                  <span className="font-mono text-emerald-700">- {formatCurrency(discount)}</span>
                </div>
                <div className="flex justify-between text-indigo-950 font-bold border-t border-indigo-200 pt-1.5 text-sm">
                  <span>Net Payable Fee:</span>
                  <span className="font-mono">{formatCurrency(netFee)}</span>
                </div>
                <div className="text-[11px] text-slate-500 pt-1">
                  Scheduled into <strong>{installmentsCount} installments</strong> of approx.{' '}
                  <strong className="font-mono">
                    {formatCurrency(Math.round(netFee / installmentsCount))}
                  </strong>{' '}
                  each month.
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-2 rounded-lg transition shadow-sm"
                >
                  Confirm Admission & Assign Biometric ID
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-6">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-bold text-base text-white">Import Students from CSV / Excel</h3>
                  <p className="text-xs text-slate-300">Bulk batch admission</p>
                </div>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">
                  CSV Data Format Instructions:
                </span>
                <button
                  type="button"
                  onClick={handleDownloadSampleCSV}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Sample CSV Template
                </button>
              </div>

              <textarea
                value={importCsvText}
                onChange={(e) => setImportCsvText(e.target.value)}
                placeholder={`Name,FatherName,Phone,ParentPhone,CourseCode,BatchTiming,Fee,Discount,Installments\nAakash Gupta,Mr. Ashok Gupta,9876500001,9876500002,ADCA-12M,08:00 AM - 10:00 AM,18000,1000,3\nDivya Rawat,Mr. Sunil Rawat,9876500003,9876500004,TALLY-03M,10:00 AM - 12:00 PM,8500,500,2`}
                className="w-full text-xs font-mono p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                rows={7}
              />

              <p className="text-[11px] text-slate-500 leading-relaxed">
                * CourseCode should match one of: ADCA-12M, DCA-06M, TALLY-03M, FSD-06M, PY-04M, GDES-04M.
                Each imported trainee will automatically receive a generated Roll Number and Biometric ID for machine punch.
              </p>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleProcessImport}
                  disabled={!importCsvText.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold px-5 py-2 rounded-lg transition"
                >
                  Parse & Import Students
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Modal */}
      {whatsAppStudent && (
        <WhatsAppReminderModal
          student={whatsAppStudent}
          settings={settings}
          onClose={() => setWhatsAppStudent(null)}
        />
      )}

      {/* Birthday Greeting Modal */}
      {birthdayStudent && (
        <BirthdayGreetingModal
          student={birthdayStudent}
          settings={settings}
          onClose={() => setBirthdayStudent(null)}
        />
      )}

      {/* Course Upgrade Modal */}
      {upgradingStudent && (
        <CourseUpgradeModal
          student={upgradingStudent}
          courses={courses}
          currentRole={currentRole}
          currentStaffName={currentStaffName}
          onClose={() => setUpgradingStudent(null)}
          onConfirmUpgrade={(updatedStudent) => {
            if (onUpgradeStudent) {
              onUpgradeStudent(updatedStudent);
            }
            setUpgradingStudent(null);
          }}
        />
      )}

      {/* Student ID Card with Roll Number Base QR Code Modal */}
      {selectedStudentForIDCard && (
        <StudentIDCardModal
          student={selectedStudentForIDCard}
          settings={settings}
          onClose={() => {
            setSelectedStudentForIDCard(null);
            setIsNewlyRegisteredCard(false);
          }}
          isNewlyRegistered={isNewlyRegisteredCard}
        />
      )}

      {/* Academic Assessment (Pass / Fail / Form Fillup / Certificate Issue) Modal */}
      {assessingStudent && (
        <AcademicAssessmentModal
          student={assessingStudent}
          settings={settings}
          currentRole={currentRole}
          currentStaffName={currentStaffName}
          onClose={() => setAssessingStudent(null)}
          onUpdateAcademicStatus={(updatedStudent: Student) => {
            if (onUpdateStudent) {
              onUpdateStudent(updatedStudent);
            }
            setAssessingStudent(null);
          }}
          onOpenFormFillupFee={(stu: Student) => {
            setAssessingStudent(null);
            if (onOpenFormFillupFee) {
              onOpenFormFillupFee(stu);
            }
          }}
        />
      )}

      {/* Admin Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-6">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-600 rounded-lg">
                  <Edit3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Edit Student Admission & Profile</h3>
                  <p className="text-xs text-slate-300 font-mono">
                    Director / Admin Control Panel • {editingStudent.rollNo} ({editingStudent.name})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingStudent(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedStudent} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex items-center justify-between text-xs text-indigo-900">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    Authorized Admin Modification for Student ID <strong>{editingStudent.rollNo}</strong>. All changes update directory and portals in real-time.
                  </span>
                </div>
                <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-indigo-200">
                  Paid: {formatCurrency(editingStudent.paidAmount)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                {/* Roll Number */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Roll No / Student ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={editRollNo}
                    onChange={(e) => setEditRollNo(e.target.value.toUpperCase())}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Biometric ID */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Biometric ID / Fingerprint Key *
                  </label>
                  <input
                    type="text"
                    required
                    value={editBiometricId}
                    onChange={(e) => setEditBiometricId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Full Name */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Student Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Father's Name */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Father / Guardian Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFatherName}
                    onChange={(e) => setEditFatherName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Mother's Name */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Mother Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={editMotherName}
                    onChange={(e) => setEditMotherName(e.target.value)}
                    placeholder="e.g. Smt. Anita Devi"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                    <Cake className="w-3.5 h-3.5 text-pink-500" />
                    <span>Date of Birth (DOB)</span>
                  </label>
                  <input
                    type="date"
                    value={editDob}
                    onChange={(e) => setEditDob(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Student Phone */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Student Phone (WhatsApp) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Parent Phone */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Parent / Emergency Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={editParentPhone}
                    onChange={(e) => setEditParentPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Course Selection */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Enrolled Course *
                  </label>
                  <select
                    value={editCourseId}
                    onChange={(e) => {
                      setEditCourseId(e.target.value);
                      const c = courses.find((course) => course.id === e.target.value);
                      if (c) {
                        setEditTotalFee(c.fee);
                      }
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-indigo-500"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.duration}) - {formatCurrency(c.fee)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Batch Time */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Batch Timing *
                  </label>
                  <input
                    type="text"
                    required
                    value={editBatchTime}
                    onChange={(e) => setEditBatchTime(e.target.value)}
                    placeholder="e.g. 08:00 AM - 10:00 AM (Morning)"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Admission Date */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Admission Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={editAdmissionDate}
                    onChange={(e) => setEditAdmissionDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Total Fee */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Total Course Fee (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editTotalFee}
                    onChange={(e) => setEditTotalFee(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Discount */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Discount / Scholarship (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editDiscount}
                    onChange={(e) => setEditDiscount(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-emerald-700 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Net Payable Fee (Calculated) */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Net Payable Fee (Auto)
                  </label>
                  <div className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg font-mono font-extrabold text-indigo-900">
                    {formatCurrency(Math.max(0, editTotalFee - editDiscount))}
                  </div>
                </div>

                {/* Academic Status */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Academic Status
                  </label>
                  <select
                    value={editAcademicStatus}
                    onChange={(e) => setEditAcademicStatus(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="IN_PROGRESS">Course In Progress</option>
                    <option value="COURSE_ENDED">Course Ended (Duration Complete)</option>
                    <option value="EXAM_PASSED">Exam Passed / Cleared</option>
                    <option value="EXAM_FAILED_REATTEMPT">Exam Failed (Reattempt Required)</option>
                    <option value="CERTIFICATE_COLLECTED">Certificate Issued & Collected</option>
                  </select>
                </div>

                {/* Certificate Number */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Certificate Number
                  </label>
                  <input
                    type="text"
                    value={editCertificateNo}
                    onChange={(e) => setEditCertificateNo(e.target.value)}
                    placeholder="e.g. SRIIT-CERT-2026-089"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Certificate Collected Date */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Certificate Issued Date
                  </label>
                  <input
                    type="date"
                    value={editCertificateCollectedDate}
                    onChange={(e) => setEditCertificateCollectedDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Admission Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="active">Active Trainee</option>
                    <option value="completed">Course Completed / Alum</option>
                    <option value="dropped">Dropped / Discontinued</option>
                  </select>
                </div>

                {/* Address */}
                <div className="sm:col-span-2 md:col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">
                    Postal / Residential Address
                  </label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    placeholder="e.g. Near Bus Stand, Main Market, Main Street"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 text-xs text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-5 py-2.5 rounded-lg font-bold transition shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  Save Student Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Delete Student Confirmation Modal */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 max-w-md w-full">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-base mb-2">
              <div className="p-2 bg-rose-100 rounded-lg">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-slate-900 font-extrabold text-base">Delete Student Admission</h3>
                <p className="text-xs text-rose-600 font-medium">Permanent Record Deletion</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 my-4 leading-relaxed">
              Are you sure you want to permanently delete the admission record for{' '}
              <strong className="text-slate-900">{deletingStudent.name}</strong> (Roll No:{' '}
              <span className="font-mono font-bold text-indigo-700">{deletingStudent.rollNo}</span>)?
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5 text-xs text-slate-700 mb-4 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Course:</span>
                <span className="font-bold">{deletingStudent.courseName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Fees:</span>
                <span>{formatCurrency(deletingStudent.netPayableFee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fees Paid:</span>
                <span className="text-emerald-700 font-bold">{formatCurrency(deletingStudent.paidAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pending Dues:</span>
                <span className="text-rose-600 font-bold">{formatCurrency(deletingStudent.pendingAmount)}</span>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-800 text-[11px] mb-5 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>
                <strong>Warning:</strong> Only Institute Admin / Director can perform this deletion. The student profile will be removed from the directory.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingStudent(null)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteStudent}
                className="bg-rose-600 hover:bg-rose-500 text-white text-xs px-4 py-2 rounded-lg font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Confirm Delete Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
