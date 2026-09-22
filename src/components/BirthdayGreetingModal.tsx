import React, { useState } from 'react';
import { Student, InstituteSettings } from '../types';
import { createWhatsAppURL, createSmsURL, formatBirthdayGreeting } from '../utils/helpers';
import {
  X,
  Cake,
  Send,
  MessageCircle,
  Copy,
  Check,
  Sparkles,
  Phone,
  Calendar,
} from 'lucide-react';

interface BirthdayGreetingModalProps {
  student: Student;
  settings: InstituteSettings;
  onClose: () => void;
}

export const BirthdayGreetingModal: React.FC<BirthdayGreetingModalProps> = ({
  student,
  settings,
  onClose,
}) => {
  const initialMessage = formatBirthdayGreeting(
    student.name,
    settings.name,
    settings.directorName
  );

  const [message, setMessage] = useState(initialMessage);
  const [copied, setCopied] = useState(false);
  const [targetPhone, setTargetPhone] = useState(student.phone || student.parentPhone);

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleSendWhatsApp = () => {
    const url = createWhatsAppURL(targetPhone, message);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSendSms = () => {
    const url = createSmsURL(targetPhone, message);
    window.location.href = url;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-pink-200 w-full max-w-lg overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Festive Header */}
        <div className="bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 text-white p-5 flex items-start justify-between relative overflow-hidden">
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner">
              🎂
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-pink-100">
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                Birthday Celebration Wish
              </div>
              <h2 className="text-xl font-extrabold text-white">{student.name}</h2>
              <p className="text-xs text-pink-100">
                Roll No: <span className="font-mono font-semibold">{student.rollNo}</span> • Course:{' '}
                {student.courseName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition relative z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between text-xs bg-pink-50 text-pink-900 border border-pink-200 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <Cake className="w-4 h-4 text-pink-600 shrink-0" />
              <span>
                <strong>Date of Birth:</strong> {student.dob || 'Today'}
              </span>
            </div>
            <span className="bg-pink-200 text-pink-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              Birthday Today 🎉
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Send To Phone Number
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={targetPhone}
                  onChange={(e) => setTargetPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 font-mono"
                  placeholder="Student mobile or WhatsApp number"
                />
              </div>
              {student.parentPhone && student.parentPhone !== student.phone && (
                <button
                  type="button"
                  onClick={() => setTargetPhone(student.parentPhone)}
                  className="px-2.5 py-1.5 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                >
                  Parent Phone
                </button>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Greeting Message (WhatsApp & SMS)
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] font-semibold text-pink-600 hover:text-pink-700 flex items-center gap-1"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:outline-hidden font-sans leading-relaxed text-slate-800 bg-slate-50/50"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4 fill-emerald-600 text-white" />
              Send WhatsApp Greeting
            </button>

            <button
              type="button"
              onClick={handleSendSms}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-xs font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Wish via Message (SMS)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
