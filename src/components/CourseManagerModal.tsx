import React, { useState } from 'react';
import { Course, UserRole } from '../types';
import { formatCurrency } from '../utils/helpers';
import {
  X,
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  Tag,
} from 'lucide-react';

interface CourseManagerModalProps {
  courses: Course[];
  currentRole: UserRole;
  onClose: () => void;
  onAddCourse: (course: Course) => void;
  onUpdateCourse: (course: Course) => void;
  onDeleteCourse: (courseId: string) => void;
}

export const CourseManagerModal: React.FC<CourseManagerModalProps> = ({
  courses,
  currentRole,
  onClose,
  onAddCourse,
  onUpdateCourse,
  onDeleteCourse,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('3 Months');
  const [fee, setFee] = useState<number>(5000);
  const [category, setCategory] = useState('Certificate');
  const [description, setDescription] = useState('');

  const resetForm = () => {
    setCode('');
    setName('');
    setDuration('3 Months');
    setFee(5000);
    setCategory('Certificate');
    setDescription('');
    setShowAddForm(false);
    setEditingCourseId(null);
  };

  const handleStartEdit = (c: Course) => {
    setEditingCourseId(c.id);
    setCode(c.code);
    setName(c.name);
    setDuration(c.duration);
    setFee(c.fee);
    setCategory(c.category);
    setDescription(c.description);
    setShowAddForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim() || fee <= 0) return;

    if (currentRole !== 'admin') {
      alert('Security Notice: Only Admin / Director has authority to modify or add institute courses.');
      return;
    }

    if (editingCourseId) {
      const updated: Course = {
        id: editingCourseId,
        code: code.trim().toUpperCase(),
        name: name.trim(),
        duration: duration.trim(),
        fee: Number(fee),
        category: category.trim(),
        description: description.trim() || 'Comprehensive IT and practical training curriculum.',
      };
      onUpdateCourse(updated);
    } else {
      const newCourse: Course = {
        id: `c-${Date.now()}`,
        code: code.trim().toUpperCase(),
        name: name.trim(),
        duration: duration.trim(),
        fee: Number(fee),
        category: category.trim(),
        description: description.trim() || 'Comprehensive IT and practical training curriculum.',
      };
      onAddCourse(newCourse);
    }

    resetForm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">Institute Course Management</h2>
              <p className="text-xs text-indigo-200">
                Admin Panel • Add & configure syllabus programs, duration and fee tariffs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-700">
            Total Active Courses: <span className="font-mono text-indigo-700">{courses.length}</span>
          </div>

          {currentRole === 'admin' && !showAddForm && (
            <button
              onClick={() => {
                resetForm();
                setShowAddForm(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-xs transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add New Course
            </button>
          )}
        </div>

        {/* Add / Edit Form */}
        {showAddForm && (
          <form onSubmit={handleSubmit} className="p-6 bg-indigo-50/40 border-b border-indigo-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-indigo-600" />
                {editingCourseId ? 'Edit Course Program' : 'Add New Student Course'}
              </h3>
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Course Code *
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. OSCIT, ADCA, PYTHON"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono font-bold uppercase"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Full Course Title *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. OSCIT (Certificate in IT) or Full Stack Web Dev"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Duration *
                </label>
                <input
                  type="text"
                  required
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 2 Months, 6 Months, 1 Year"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Total Course Fee (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="500"
                  step="100"
                  value={fee}
                  onChange={(e) => setFee(Number(e.target.value))}
                  placeholder="e.g. 4000, 9500, 19500"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Certificate">Certificate</option>
                  <option value="Advanced Certificate">Advanced Certificate</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Master Diploma">Master Diploma</option>
                  <option value="Accounting">Accounting & Finance</option>
                  <option value="Programming">Programming & Web</option>
                  <option value="Designing">Graphic Design & DTP</option>
                  <option value="AI & Data Science">AI & Data Science</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Course Syllabus & Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Topics covered, software taught, certification details..."
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={resetForm}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                {editingCourseId ? 'Save Changes' : 'Publish Course'}
              </button>
            </div>
          </form>
        )}

        {/* Courses List Table */}
        <div className="p-5 max-h-96 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {courses.map((course) => {
              const isOscit = course.code.includes('OSCIT');
              return (
                <div
                  key={course.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isOscit
                      ? 'border-amber-300 bg-amber-50/40 hover:bg-amber-50/70 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-extrabold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          {course.code}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold">
                          {course.category}
                        </span>
                        {isOscit && (
                          <span className="text-[9px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                            Upgrade Eligible
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-xs text-slate-900 mt-1">{course.name}</h4>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-black text-slate-900 font-mono">
                        {formatCurrency(course.fee)}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1 justify-end mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {course.duration}
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>

                  {currentRole === 'admin' && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(course)}
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-indigo-50 transition"
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Are you sure you want to remove course "${course.name}"?`)) {
                            onDeleteCourse(course.id);
                          }
                        }}
                        className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-rose-50 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            {currentRole === 'admin'
              ? 'Authorized: You can add and configure all student courses.'
              : 'Read-only view: Only Institute Admin / Director can add or edit courses.'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
