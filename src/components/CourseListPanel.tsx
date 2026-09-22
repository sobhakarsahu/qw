import React, { useState, useMemo } from 'react';
import { Course, Student, UserRole, InstituteSettings } from '../types';
import { formatCurrency } from '../utils/helpers';
import {
  BookOpen,
  Plus,
  Edit3,
  Trash2,
  Search,
  Users,
  Clock,
  DollarSign,
  Sparkles,
  Printer,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  X,
  Lock,
  GraduationCap,
  LayoutGrid,
  List,
  RotateCcw,
  ArchiveRestore,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface CourseListPanelProps {
  courses: Course[];
  deletedCourses?: Course[];
  students: Student[];
  settings: InstituteSettings;
  currentRole: UserRole;
  currentStaffName?: string;
  onAddCourse: (course: Course) => void;
  onUpdateCourse: (course: Course) => void;
  onDeleteCourse: (courseId: string) => void;
  onRestoreCourse?: (courseId: string) => void;
  onRestoreDefaultCourses?: () => void;
  onPurgeDeletedCourse?: (courseId: string) => void;
  onClearRecycleBin?: () => void;
  onSelectStudentProfile?: (student: Student) => void;
}

const CATEGORIES = [
  'All Categories',
  'Certificate',
  'Advanced Certificate',
  'Diploma',
  'Master Diploma',
  'Accounting & Finance',
  'Programming & Web',
  'Designing & DTP',
  'AI & Data Science',
  'Short Term',
];

interface CoursePresetTemplate {
  label: string;
  code: string;
  name: string;
  duration: string;
  fee: number;
  category: string;
  description: string;
  badge?: string;
  isUpgradable?: boolean;
}

const COURSE_PRESETS: CoursePresetTemplate[] = [
  {
    label: 'OSCIT (3 Months) • Flagship IT',
    code: 'OSCIT',
    name: 'OSCIT (Odisha State Certificate in Information Technology)',
    duration: '3 Months',
    fee: 4000,
    category: 'Certificate',
    description: 'Computer Fundamentals, Windows 11, MS Word, Excel, PowerPoint, Internet & Typing, Odia Typing',
    badge: 'Popular',
    isUpgradable: true,
  },
  {
    label: 'OSCIT A (4 Months)',
    code: 'OSCIT-A',
    name: 'OSCIT A (Advanced Certificate in IT & Applications)',
    duration: '4 Months',
    fee: 9500,
    category: 'Advanced Certificate',
    description: 'Advanced MS Office 365, Tally Prime Basics, GST Invoicing, Internet Security & DTP Basics',
    isUpgradable: true,
  },
  {
    label: 'OSCIT A+ (8 Months)',
    code: 'OSCIT-A+',
    name: 'OSCIT A+ (Professional Master Diploma in Computer Applications)',
    duration: '8 Months',
    fee: 19500,
    category: 'Master Diploma',
    description: 'Comprehensive IT Suite: Office Suite, Tally Prime + GST, DTP Graphic Design, Web Development & AI Tools',
    badge: 'Master',
    isUpgradable: false,
  },
  {
    label: 'OCOC Tally Prime (2 Months) • Standalone',
    code: 'OCOC-TALLY',
    name: 'OCOC Tally Prime',
    duration: '2 Months',
    fee: 5000,
    category: 'Accounting & Finance',
    description: 'Official OCOC Tally Prime Certificate: Computerized Accounting, Inventory, GST Invoicing, e-Way Bills & Tax Compliance.',
    badge: 'Non-Upgradable',
    isUpgradable: false,
  },
  {
    label: 'Tally Prime + GST (3 Months)',
    code: 'TALLY-03M',
    name: 'Tally Prime Professional with e-Way Bill & GST Portal',
    duration: '3 Months',
    fee: 8500,
    category: 'Accounting & Finance',
    description: 'Voucher Entry, Inventory, Payroll, GST Reconciliation, TDS, BRS & Balance Sheet Finalization',
    isUpgradable: true,
  },
  {
    label: 'DCA (6 Months)',
    code: 'DCA-06M',
    name: 'DCA (Diploma in Computer Applications)',
    duration: '6 Months',
    fee: 10500,
    category: 'Diploma',
    description: 'Computer Fundamentals, Windows 11, MS Word, Excel, PowerPoint, Internet & Typing',
  },
  {
    label: 'ADCA (12 Months)',
    code: 'ADCA-12M',
    name: 'ADCA (Advanced Diploma in Computer Applications)',
    duration: '12 Months',
    fee: 18000,
    category: 'Diploma',
    description: 'Fundamentals, MS Office 365, Tally Prime + GST, DTP (Photoshop/CorelDraw), Web Design & C++',
  },
  {
    label: 'Full Stack Web Dev (6 Months)',
    code: 'FSD-06M',
    name: 'Full Stack Web Development (React, Node, MongoDB)',
    duration: '6 Months',
    fee: 32000,
    category: 'Programming & Web',
    description: 'HTML5, Modern CSS/Tailwind, JavaScript ES6+, React, Node.js, Express, REST APIs, Git & Cloud',
  },
  {
    label: 'Python & AI (4 Months)',
    code: 'PY-04M',
    name: 'Python Programming, Data Science & AI Essentials',
    duration: '4 Months',
    fee: 22000,
    category: 'AI & Data Science',
    description: 'Core Python, OOPs, NumPy, Pandas, Matplotlib, Machine Learning Scikit-Learn & Gemini AI API',
  },
];

export const CourseListPanel: React.FC<CourseListPanelProps> = ({
  courses,
  deletedCourses = [],
  students,
  settings,
  currentRole,
  onAddCourse,
  onUpdateCourse,
  onDeleteCourse,
  onRestoreCourse,
  onRestoreDefaultCourses,
  onPurgeDeletedCourse,
  onClearRecycleBin,
  onSelectStudentProfile,
}) => {
  const isAdmin = currentRole === 'admin';

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal / Form States
  const [showCourseFormModal, setShowCourseFormModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Recycle Bin Modal
  const [showRecycleBinModal, setShowRecycleBinModal] = useState(false);
  const [recycleSearch, setRecycleSearch] = useState('');

  // View Enrolled Students Modal
  const [viewingEnrolledCourse, setViewingEnrolledCourse] = useState<Course | null>(null);

  // Delete Confirmation Modal
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);

  // Form Fields
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formDuration, setFormDuration] = useState('3 Months');
  const [formFee, setFormFee] = useState<number>(4000);
  const [formCategory, setFormCategory] = useState('Certificate');
  const [formDescription, setFormDescription] = useState('');
  const [formIsUpgradable, setFormIsUpgradable] = useState<boolean>(true);
  const [formError, setFormError] = useState('');

  // Status message
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  const triggerSuccessMsg = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => {
      setActionSuccessMsg('');
    }, 4000);
  };

  // Check if active OSCIT course is present
  const hasActiveOscit = useMemo(() => {
    return courses.some((c) => c.code.toUpperCase() === 'OSCIT');
  }, [courses]);

  // Course Enrollment mapping
  const courseStudentMap = useMemo(() => {
    const map = new Map<string, Student[]>();
    courses.forEach((c) => {
      const enrolled = students.filter(
        (s) => s.courseId === c.id || s.courseName?.toLowerCase() === c.name.toLowerCase()
      );
      map.set(c.id, enrolled);
    });
    return map;
  }, [courses, students]);

  // Filtered Courses
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.duration.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'All Categories' || course.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [courses, searchQuery, selectedCategory]);

  // Filtered Deleted Courses
  const filteredDeletedCourses = useMemo(() => {
    return deletedCourses.filter((course) => {
      return (
        course.name.toLowerCase().includes(recycleSearch.toLowerCase()) ||
        course.code.toLowerCase().includes(recycleSearch.toLowerCase()) ||
        course.category.toLowerCase().includes(recycleSearch.toLowerCase())
      );
    });
  }, [deletedCourses, recycleSearch]);

  // Financial Stats
  const totalCourses = courses.length;
  const totalEnrolled = students.length;
  const avgFee =
    courses.length > 0
      ? Math.round(courses.reduce((acc, c) => acc + (c.fee || 0), 0) / courses.length)
      : 0;
  const highestFeeCourse = courses.reduce(
    (max, c) => (c.fee > (max?.fee || 0) ? c : max),
    courses[0]
  );

  // Apply Preset Template into Form
  const applyPresetTemplate = (preset: CoursePresetTemplate) => {
    setFormCode(preset.code);
    setFormName(preset.name);
    setFormDuration(preset.duration);
    setFormFee(preset.fee);
    setFormCategory(preset.category);
    setFormDescription(preset.description);
    setFormIsUpgradable(preset.isUpgradable ?? (preset.code.includes('OCOC') ? false : true));
    setFormError('');
  };

  // Open Create Modal
  const handleOpenCreateModal = (prefillPreset?: CoursePresetTemplate) => {
    if (!isAdmin) {
      alert('Security Notice: Only Institute Admin / Director has authority to add new courses.');
      return;
    }
    setEditingCourse(null);
    if (prefillPreset) {
      applyPresetTemplate(prefillPreset);
    } else {
      setFormCode('');
      setFormName('');
      setFormDuration('3 Months');
      setFormFee(4000);
      setFormCategory('Certificate');
      setFormDescription('');
      setFormIsUpgradable(true);
      setFormError('');
    }
    setShowCourseFormModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (course: Course) => {
    if (!isAdmin) {
      alert('Security Notice: Only Institute Admin / Director has authority to edit courses.');
      return;
    }
    setEditingCourse(course);
    setFormCode(course.code);
    setFormName(course.name);
    setFormDuration(course.duration);
    setFormFee(course.fee);
    setFormCategory(course.category);
    setFormDescription(course.description);
    setFormIsUpgradable(
      course.isUpgradable ?? (course.code.includes('OCOC') || course.name.includes('OCOC') ? false : true)
    );
    setFormError('');
    setShowCourseFormModal(true);
  };

  // Save Course (Create or Update)
  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Security Notice: Only Institute Admin has permission to save courses.');
      return;
    }

    if (!formCode.trim()) {
      setFormError('Course code is required (e.g. OSCIT, ADCA, TALLY).');
      return;
    }
    if (!formName.trim()) {
      setFormError('Course name is required.');
      return;
    }
    if (formFee <= 0) {
      setFormError('Course fee must be greater than zero.');
      return;
    }

    // Check duplicate code if creating or changing code
    const duplicate = courses.find(
      (c) =>
        c.code.toUpperCase() === formCode.trim().toUpperCase() &&
        (!editingCourse || c.id !== editingCourse.id)
    );
    if (duplicate) {
      setFormError(`Course code "${formCode.trim().toUpperCase()}" is already assigned to "${duplicate.name}".`);
      return;
    }

    if (editingCourse) {
      const updated: Course = {
        ...editingCourse,
        code: formCode.trim().toUpperCase(),
        name: formName.trim(),
        duration: formDuration.trim(),
        fee: Number(formFee),
        category: formCategory.trim(),
        description: formDescription.trim() || 'Comprehensive IT and practical training curriculum.',
        isUpgradable: formIsUpgradable,
      };
      onUpdateCourse(updated);
      triggerSuccessMsg(`Course "${updated.code}" updated successfully.`);
    } else {
      const newCourse: Course = {
        id: `c-${Date.now()}`,
        code: formCode.trim().toUpperCase(),
        name: formName.trim(),
        duration: formDuration.trim(),
        fee: Number(formFee),
        category: formCategory.trim(),
        description: formDescription.trim() || 'Comprehensive IT and practical training curriculum.',
        isUpgradable: formIsUpgradable,
      };
      onAddCourse(newCourse);
      triggerSuccessMsg(`Course "${newCourse.code}" added to active catalog successfully.`);
    }

    setShowCourseFormModal(false);
    setEditingCourse(null);
  };

  // Confirm Delete Course
  const handleConfirmDelete = () => {
    if (!isAdmin || !deletingCourse) {
      alert('Security Notice: Only Institute Admin has authority to delete courses.');
      return;
    }
    onDeleteCourse(deletingCourse.id);
    triggerSuccessMsg(`Course "${deletingCourse.code}" moved to Recycle Bin.`);
    setDeletingCourse(null);
  };

  // Handle Restore Single Course
  const handleRestore = (courseId: string, courseCode: string) => {
    if (onRestoreCourse) {
      onRestoreCourse(courseId);
      triggerSuccessMsg(`Course "${courseCode}" has been restored to the active catalog.`);
    }
  };

  // Handle Restore OSCIT Directly
  const handleDirectRestoreOscit = () => {
    const oscitInDeleted = deletedCourses.find((c) => c.code.toUpperCase() === 'OSCIT' || c.id === 'c-oscit');
    if (oscitInDeleted && onRestoreCourse) {
      onRestoreCourse(oscitInDeleted.id);
      triggerSuccessMsg('OSCIT (3 Months) course has been restored from the Recycle Bin.');
    } else if (onRestoreDefaultCourses) {
      onRestoreDefaultCourses();
      triggerSuccessMsg('Standard OSCIT (3 Months) course has been restored successfully.');
    } else {
      onAddCourse({
        id: 'c-oscit',
        code: 'OSCIT',
        name: 'OSCIT (Odisha State Certificate in Information Technology)',
        duration: '3 Months',
        fee: 4000,
        category: 'Certificate',
        description: 'Computer Fundamentals, Windows 11, MS Word, Excel, PowerPoint, Internet & Typing',
      });
      triggerSuccessMsg('OSCIT (3 Months) course has been added to active courses.');
    }
  };

  // Print Course Prospectus
  const handlePrintTariff = () => {
    window.print();
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
                <BookOpen className="w-3.5 h-3.5" />
                Curriculum & Tariff Master
              </span>
              {isAdmin ? (
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                  Admin Full Rights: Add / Edit / Delete / Restore
                </span>
              ) : (
                <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  Staff View (Counseling Mode)
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black text-white mt-1.5 tracking-tight">
              Course List & Syllabus Panel
            </h2>
            <p className="text-xs text-indigo-200 mt-1 max-w-2xl">
              Configure course fees, syllabus, 3-month OSCIT curricula, and restore deleted courses from the Recycle Bin anytime.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 no-print">
            <button
              onClick={handlePrintTariff}
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-2 rounded-xl transition border border-white/15 flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Print Official Course Fee Structure"
            >
              <Printer className="w-4 h-4 text-indigo-300" />
              Print Prospectus
            </button>

            {/* Recycle Bin Button */}
            {isAdmin && (
              <button
                onClick={() => setShowRecycleBinModal(true)}
                className={`text-xs font-bold px-3.5 py-2 rounded-xl transition border flex items-center gap-1.5 cursor-pointer shadow-xs ${
                  deletedCourses.length > 0
                    ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border-amber-400/40 ring-1 ring-amber-400/30'
                    : 'bg-white/10 hover:bg-white/20 text-slate-300 border-white/15'
                }`}
                title="View and restore deleted courses"
              >
                <ArchiveRestore className="w-4 h-4 text-amber-300" />
                <span>Recycle Bin</span>
                {deletedCourses.length > 0 && (
                  <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full">
                    {deletedCourses.length}
                  </span>
                )}
              </button>
            )}

            {isAdmin ? (
              <button
                onClick={() => handleOpenCreateModal()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add New Course
              </button>
            ) : (
              <div
                className="bg-slate-800 text-slate-400 text-xs font-semibold px-3.5 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5 cursor-not-allowed"
                title="Only Admin / Director can create new courses"
              >
                <Lock className="w-3.5 h-3.5" />
                Add (Admin Only)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {actionSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-3.5 flex items-center gap-2.5 text-xs font-bold shadow-xs animate-in fade-in slide-in-from-top-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* RESTORE OSCIT / MISSING COURSE ALERT BANNER */}
      {!hasActiveOscit && (
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-300/80 rounded-2xl p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-amber-900 text-xs uppercase tracking-wider">
                  Notice: OSCIT Course Missing from Active List
                </span>
                <span className="bg-amber-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  3 Months Program
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                The 3-month <strong>OSCIT (Odisha State Certificate in Information Technology)</strong> course is not currently active. You can restore it with a single click or restore from the Recycle Bin.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isAdmin && (
              <>
                <button
                  onClick={handleDirectRestoreOscit}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restore OSCIT (3 Months)
                </button>
                {deletedCourses.length > 0 && (
                  <button
                    onClick={() => setShowRecycleBinModal(true)}
                    className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArchiveRestore className="w-3.5 h-3.5" />
                    Open Recycle Bin ({deletedCourses.length})
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* KPI Stats Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Active Courses
            </div>
            <div className="text-xl font-mono font-black text-slate-900 mt-0.5">
              {totalCourses}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Enrolled Students
            </div>
            <div className="text-xl font-mono font-black text-emerald-700 mt-0.5">
              {totalEnrolled}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Average Fee Tariff
            </div>
            <div className="text-xl font-mono font-black text-amber-700 mt-0.5">
              {formatCurrency(avgFee)}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
              Flagship Program
            </div>
            <div className="text-sm font-bold text-slate-900 mt-0.5 truncate max-w-[140px]" title={highestFeeCourse?.name}>
              {highestFeeCourse?.code || 'OSCIT A+'}
            </div>
          </div>
        </div>
      </div>

      {/* Search, Category Filter, and View Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3 no-print">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by course code, name, duration, syllabus keywords..."
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

          {/* Quick Add Presets Trigger & View Mode Toggle */}
          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            {isAdmin && (
              <button
                type="button"
                onClick={() => handleOpenCreateModal(COURSE_PRESETS[0])}
                className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                title="Add OSCIT 3 Month Course"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Quick Add OSCIT (3M)</span>
              </button>
            )}

            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                  viewMode === 'grid'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Grid Card View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                  viewMode === 'table'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Detailed Table View"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            const count =
              cat === 'All Categories'
                ? courses.length
                : courses.filter((c) => c.category === cat).length;
            if (cat !== 'All Categories' && count === 0) return null;

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Course List: Grid View or Table View */}
      {filteredCourses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Courses Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery || selectedCategory !== 'All Categories'
              ? 'No courses matched your search or category filter. Try clearing filters.'
              : 'No courses exist in the catalog yet.'}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            {(searchQuery || selectedCategory !== 'All Categories') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All Categories');
                }}
                className="px-4 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
              >
                Clear Search Filters
              </button>
            )}
            {isAdmin && (
              <button
                onClick={handleDirectRestoreOscit}
                className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restore OSCIT (3 Months)
              </button>
            )}
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCourses.map((course) => {
            const isOscit = course.code.includes('OSCIT');
            const enrolled = courseStudentMap.get(course.id) || [];
            const suggestedInstallment = Math.round(course.fee / 2);

            return (
              <div
                key={course.id}
                className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                  isOscit
                    ? 'border-indigo-200/80 ring-1 ring-indigo-500/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Course Header Banner */}
                <div
                  className={`p-4 border-b ${
                    isOscit
                      ? 'bg-gradient-to-r from-indigo-50/70 to-purple-50/50 border-indigo-100'
                      : 'bg-slate-50/70 border-slate-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-black text-indigo-900 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shadow-2xs">
                        {course.code}
                      </span>
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded-full">
                        {course.category}
                      </span>
                      {isOscit && (
                        <span className="text-[9px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                          Odisha IT
                        </span>
                      )}
                      {course.code === 'OSCIT-A+' ? (
                        <span className="text-[9px] font-bold bg-purple-100 text-purple-900 border border-purple-300 px-1.5 py-0.5 rounded-full">
                          Master Tier
                        </span>
                      ) : course.isUpgradable === false || course.code.includes('OCOC') || course.name.includes('OCOC') ? (
                        <span className="text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-300 px-1.5 py-0.5 rounded-full">
                          Non-Upgradable
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                          Upgradable
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-base font-black font-mono text-slate-900">
                        {formatCurrency(course.fee)}
                      </div>
                      <div className="text-[10px] text-slate-500 font-bold flex items-center justify-end gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {course.duration}
                      </div>
                    </div>
                  </div>

                  <h3 className="font-extrabold text-sm text-slate-900 mt-2.5 leading-snug line-clamp-2">
                    {course.name}
                  </h3>
                </div>

                {/* Course Body: Syllabus & Details */}
                <div className="p-4 space-y-3 flex-1">
                  <div className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {course.description || 'Comprehensive syllabus including theory and hands-on practical lab sessions.'}
                  </div>

                  {/* Enrollment & Installment breakdown */}
                  <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setViewingEnrolledCourse(course)}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 transition text-left cursor-pointer group"
                    >
                      <div className="text-[10px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-400 group-hover:text-indigo-600" />
                        Enrolled
                      </div>
                      <div className="font-mono font-bold text-xs text-slate-900 group-hover:text-indigo-700 mt-0.5 flex items-center justify-between">
                        <span>{enrolled.length} Students</span>
                        <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                      </div>
                    </button>

                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[10px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-slate-400" />
                        2-Inst Plan
                      </div>
                      <div className="font-mono font-bold text-xs text-slate-800 mt-0.5">
                        2 × {formatCurrency(suggestedInstallment)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Course Action Footer */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setViewingEnrolledCourse(course)}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white transition cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5" />
                    Students ({enrolled.length})
                  </button>

                  <div className="flex items-center gap-1">
                    {isAdmin ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(course)}
                          className="text-[11px] font-bold text-slate-700 hover:text-indigo-700 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="Edit Course Code, Fee & Syllabus"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingCourse(course)}
                          className="text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="Delete Course from catalog"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 px-2 py-1">
                        <Lock className="w-3 h-3" />
                        Admin Rights
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Detailed Table View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Course Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Total Fee</th>
                  <th className="py-3 px-4">Enrolled</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCourses.map((course) => {
                  const enrolled = courseStudentMap.get(course.id) || [];

                  return (
                    <tr key={course.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-900">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded text-[11px]">
                            {course.code}
                          </span>
                          {course.code === 'OSCIT-A+' ? (
                            <span className="text-[9px] font-bold bg-purple-100 text-purple-900 border border-purple-300 px-1.5 py-0.2 rounded-full">
                              Master Tier
                            </span>
                          ) : course.isUpgradable === false || course.code.includes('OCOC') || course.name.includes('OCOC') ? (
                            <span className="text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-300 px-1.5 py-0.2 rounded-full">
                              Non-Upgradable
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded-full">
                              Upgradable
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{course.name}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {course.description}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold">
                          {course.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-semibold whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {course.duration}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 text-sm whitespace-nowrap">
                        {formatCurrency(course.fee)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button
                          onClick={() => setViewingEnrolledCourse(course)}
                          className="font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5" />
                          {enrolled.length} Students
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {isAdmin ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(course)}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                              title="Edit Course"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingCourse(course)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Delete Course"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400">View Only</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RECYCLE BIN / DELETED COURSES MODAL */}
      {showRecycleBinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
                  <ArchiveRestore className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">
                      Course Recycle Bin & Recovery Vault
                    </h3>
                    <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                      {deletedCourses.length} Deleted
                    </span>
                  </div>
                  <p className="text-xs text-amber-200 mt-0.5">
                    Restore accidentally deleted courses back into the active catalog with all details preserved.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRecycleBinModal(false)}
                className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions & Search */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={recycleSearch}
                  onChange={(e) => setRecycleSearch(e.target.value)}
                  placeholder="Search deleted courses by code, title, or category..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {onRestoreDefaultCourses && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Restore all standard Odisha IT courses (OSCIT 3 Months, OSCIT-A, OSCIT-A+, etc.) to active catalog?')) {
                        onRestoreDefaultCourses();
                        triggerSuccessMsg('All standard IT courses restored to catalog.');
                        setShowRecycleBinModal(false);
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore Standard Courses</span>
                  </button>
                )}

                {deletedCourses.length > 0 && onClearRecycleBin && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to permanently clear the Recycle Bin? This action cannot be undone.')) {
                        onClearRecycleBin();
                        triggerSuccessMsg('Recycle bin cleared.');
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-200 hover:bg-rose-100 text-slate-700 hover:text-rose-700 text-xs font-semibold transition cursor-pointer"
                  >
                    Empty Bin
                  </button>
                )}
              </div>
            </div>

            {/* Deleted Items List */}
            <div className="p-5 max-h-[55vh] overflow-y-auto space-y-3">
              {filteredDeletedCourses.length === 0 ? (
                <div className="text-center py-12">
                  <ArchiveRestore className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-slate-700">No Courses in Recycle Bin</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    {deletedCourses.length === 0
                      ? 'No courses have been deleted yet. When courses are removed from the catalog, they appear here.'
                      : 'No deleted courses matched your search query.'}
                  </p>
                  {/* Option to restore standard OSCIT directly */}
                  {!hasActiveOscit && (
                    <button
                      type="button"
                      onClick={() => {
                        handleDirectRestoreOscit();
                        setShowRecycleBinModal(false);
                      }}
                      className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Add Standard OSCIT (3 Months) Course
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {filteredDeletedCourses.map((course) => (
                    <div
                      key={course.id}
                      className="p-4 bg-white hover:bg-amber-50/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded">
                            {course.code}
                          </span>
                          <span className="font-bold text-slate-900 text-sm">
                            {course.name}
                          </span>
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px]">
                            {course.category}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500 line-clamp-1">
                          {course.description}
                        </div>

                        <div className="text-[11px] text-slate-500 flex items-center gap-3 pt-0.5">
                          <span className="font-semibold text-slate-700">Duration: {course.duration}</span>
                          <span>•</span>
                          <span className="font-mono font-bold text-indigo-700">Fee: {formatCurrency(course.fee)}</span>
                          {course.deletedAt && (
                            <>
                              <span>•</span>
                              <span className="text-slate-400">Deleted on: {course.deletedAt}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => {
                            handleRestore(course.id, course.code);
                            setShowRecycleBinModal(false);
                          }}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                          title="Restore this course to active catalog"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>

                        {onPurgeDeletedCourse && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Permanently purge "${course.code}"? It will be removed forever.`)) {
                                onPurgeDeletedCourse(course.id);
                                triggerSuccessMsg(`Course "${course.code}" permanently purged.`);
                              }
                            }}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Permanently delete forever"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="text-[11px] text-slate-500 font-medium">
                Admin Privilege • Restoring puts the course immediately back on student admission forms.
              </div>
              <button
                onClick={() => setShowRecycleBinModal(false)}
                className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT COURSE MODAL */}
      {showCourseFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingCourse ? `Edit Course Program: ${editingCourse.code}` : 'Add New Course Program'}
                  </h3>
                  <p className="text-xs text-indigo-200">
                    Admin Panel • Set course code, fees, 3-month duration, syllabus & tariff
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCourseFormModal(false)}
                className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveCourse} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2 font-semibold text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* QUICK PRESET TEMPLATES BAR */}
              {!editingCourse && (
                <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      Quick Preset Curriculum Templates (1-Click Auto-Fill):
                    </span>
                    <span className="text-[10px] text-indigo-600 font-semibold">
                      Standard Odisha State Curricula
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {COURSE_PRESETS.map((preset) => (
                      <button
                        key={preset.code}
                        type="button"
                        onClick={() => applyPresetTemplate(preset)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer border ${
                          formCode === preset.code
                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                            : 'bg-white hover:bg-indigo-100/80 text-indigo-900 border-indigo-200'
                        }`}
                      >
                        <span>{preset.label}</span>
                        {preset.badge && (
                          <span className="bg-amber-400 text-slate-900 text-[9px] font-black px-1 rounded-xs">
                            {preset.badge}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Course Code */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Course Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    placeholder="e.g. OSCIT, ADCA, TALLY"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Unique identifier code
                  </span>
                </div>

                {/* Course Name */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Full Course Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. OSCIT (Odisha State Certificate in Information Technology)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                  >
                    <option value="Certificate">Certificate</option>
                    <option value="Advanced Certificate">Advanced Certificate</option>
                    <option value="Diploma">Diploma</option>
                    <option value="Master Diploma">Master Diploma</option>
                    <option value="Accounting & Finance">Accounting & Finance</option>
                    <option value="Programming & Web">Programming & Web</option>
                    <option value="Designing & DTP">Designing & DTP</option>
                    <option value="AI & Data Science">AI & Data Science</option>
                    <option value="Short Term">Short Term</option>
                  </select>
                </div>

                {/* Duration */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Duration *
                  </label>
                  <input
                    type="text"
                    required
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    placeholder="e.g. 3 Months, 6 Months"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                  />
                  {/* Preset quick buttons */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {['1M', '2M', '3 Months', '4M', '6M', '1 Year'].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          const map: Record<string, string> = {
                            '1M': '1 Month',
                            '2M': '2 Months',
                            '3 Months': '3 Months',
                            '4M': '4 Months',
                            '6M': '6 Months',
                            '1 Year': '1 Year',
                          };
                          setFormDuration(map[d] || d);
                        }}
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold cursor-pointer transition ${
                          formDuration === (d === '3 Months' ? '3 Months' : d)
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Total Fee */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Total Standard Fee (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="100"
                    step="100"
                    value={formFee || ''}
                    onChange={(e) => setFormFee(Number(e.target.value))}
                    placeholder="e.g. 4000, 9500"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-black text-sm text-indigo-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                  />
                  <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">
                    2 Installments: ~{formatCurrency(Math.round(formFee / 2))} each
                  </span>
                </div>

                {/* Description & Syllabus */}
                <div className="sm:col-span-3">
                  <label className="block font-bold text-slate-700 mb-1">
                    Syllabus Topics & Course Curriculum
                  </label>
                  <textarea
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="List topics taught, e.g.: Computer Fundamentals, Windows 11, MS Word, Excel, PowerPoint, Internet & Typing..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white leading-relaxed"
                  />
                </div>

                {/* Course Upgradability Switch */}
                <div className="sm:col-span-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <label htmlFor="course-upgradable-toggle" className="text-xs font-bold text-slate-800 cursor-pointer flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                      Course Upgrade Eligibility (OSCIT / Higher Tier Pathway)
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Enable this if students can upgrade to or from this course (Keep disabled for standalone courses like OCOC Tally Prime).
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                    <input
                      id="course-upgradable-toggle"
                      type="checkbox"
                      checked={formIsUpgradable}
                      onChange={(e) => setFormIsUpgradable(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>

              {/* Form Action Footer */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCourseFormModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {editingCourse ? 'Save Changes' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW ENROLLED STUDENTS MODAL */}
      {viewingEnrolledCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-700">
                      {viewingEnrolledCourse.code}
                    </span>
                    <h3 className="text-base font-bold text-white">
                      Enrolled Students
                    </h3>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {viewingEnrolledCourse.name} • Fee: {formatCurrency(viewingEnrolledCourse.fee)} • {viewingEnrolledCourse.duration}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingEnrolledCourse(null)}
                className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student List */}
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
              {(() => {
                const enrolled = courseStudentMap.get(viewingEnrolledCourse.id) || [];
                if (enrolled.length === 0) {
                  return (
                    <div className="text-center py-10">
                      <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-600">
                        No students are currently enrolled in this course.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-700 mb-2">
                      Total Active Enrollments: <span className="text-indigo-600 font-mono">{enrolled.length}</span>
                    </div>

                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                      {enrolled.map((student) => {
                        const isFullyPaid = student.pendingAmount <= 0;
                        return (
                          <div
                            key={student.id}
                            className="p-3.5 bg-white hover:bg-slate-50 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-xs">
                                {student.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 flex items-center gap-2">
                                  <span>{student.name}</span>
                                  <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                                    {student.rollNo}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                  <span>Batch: {student.batchTime}</span>
                                  <span>•</span>
                                  <span>Ph: {student.phone}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 text-right">
                              <div>
                                <div className="font-mono font-bold text-slate-900">
                                  Paid: {formatCurrency(student.paidAmount)}
                                </div>
                                <div
                                  className={`text-[10px] font-bold ${
                                    isFullyPaid ? 'text-emerald-600' : 'text-amber-600'
                                  }`}
                                >
                                  {isFullyPaid ? 'Fully Paid' : `Due: ${formatCurrency(student.pendingAmount)}`}
                                </div>
                              </div>

                              {onSelectStudentProfile && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setViewingEnrolledCourse(null);
                                    onSelectStudentProfile(student);
                                  }}
                                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                                >
                                  View Ledger
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setViewingEnrolledCourse(null)}
                className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deletingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-black text-slate-900">
                Move "{deletingCourse.code}" to Recycle Bin?
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-semibold">
                {deletingCourse.name}
              </p>
            </div>

            {/* Enrollment Warning */}
            {(() => {
              const enrolled = courseStudentMap.get(deletingCourse.id) || [];
              if (enrolled.length > 0) {
                return (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      Notice: {enrolled.length} students currently enrolled!
                    </div>
                    <p className="text-[11px] text-amber-800 mt-1">
                      Moving this course to Recycle Bin removes it from the active admissions dropdown. It can be safely restored anytime from the Recycle Bin.
                    </p>
                  </div>
                );
              }
              return (
                <p className="text-xs text-slate-600 text-center">
                  This course will be archived in the Recycle Bin. You can restore it anytime or add standard presets.
                </p>
              );
            })()}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCourse(null)}
                className="w-full px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="w-full px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-md transition cursor-pointer"
              >
                Move to Recycle Bin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT-ONLY OFFICIAL PROSPECTUS / TARIFF SHEET */}
      <div className="hidden print:block font-serif text-black p-6">
        <div className="text-center border-b-2 border-black pb-4 mb-4">
          <h1 className="text-xl font-bold uppercase">{settings.name}</h1>
          <p className="text-xs">{settings.tagline}</p>
          <p className="text-xs mt-1">
            {settings.address} • {settings.city} • Phone: {settings.phone}
          </p>
          <div className="text-sm font-bold uppercase mt-2 tracking-widest">
            OFFICIAL COURSE LIST & FEE STRUCTURE
          </div>
        </div>

        <table className="w-full text-xs border-collapse border border-black">
          <thead>
            <tr className="bg-slate-200 border-b border-black">
              <th className="border border-black p-2 text-left">Code</th>
              <th className="border border-black p-2 text-left">Course Name</th>
              <th className="border border-black p-2 text-left">Category</th>
              <th className="border border-black p-2 text-left">Duration</th>
              <th className="border border-black p-2 text-right">Fee (₹)</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c.id} className="border-b border-black">
                <td className="border border-black p-2 font-bold">{c.code}</td>
                <td className="border border-black p-2">
                  <div className="font-bold">{c.name}</div>
                  <div className="text-[10px]">{c.description}</div>
                </td>
                <td className="border border-black p-2">{c.category}</td>
                <td className="border border-black p-2">{c.duration}</td>
                <td className="border border-black p-2 text-right font-bold">
                  {formatCurrency(c.fee)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-8 flex justify-between text-xs pt-8">
          <div>
            Date of Issue: {new Date().toLocaleDateString('en-IN')}
          </div>
          <div className="text-center">
            <div className="font-bold">{settings.directorName}</div>
            <div>{settings.directorTitle}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
