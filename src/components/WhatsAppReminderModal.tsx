import React, { useState } from 'react';
import { Student, InstituteSettings } from '../types';
import { INITIAL_WHATSAPP_TEMPLATES } from '../mockData';
import { formatCurrency, createWhatsAppURL } from '../utils/helpers';
import {
  MessageSquare,
  Send,
  Copy,
  Check,
  X,
  Phone,
  UserCheck,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface WhatsAppReminderModalProps {
  student: Student;
  settings: InstituteSettings;
  onClose: () => void;
}

export const WhatsAppReminderModal: React.FC<WhatsAppReminderModalProps> = ({
  student,
  settings,
  onClose,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('tpl-due-reminder');
  const [targetPhoneType, setTargetPhoneType] = useState<'student' | 'parent'>('student');
  const [copied, setCopied] = useState(false);

  // Find next pending or overdue installment
  const overdueInst = student.installments.find((i) => i.status === 'overdue');
  const pendingInst = student.installments.find((i) => i.status === 'pending');
  const relevantInst = overdueInst || pendingInst || student.installments[student.installments.length - 1];

  const dueAmount = relevantInst ? relevantInst.amount : student.pendingAmount;
  const dueDate = relevantInst ? relevantInst.dueDate : 'Immediate';

  const selectedTemplate =
    INITIAL_WHATSAPP_TEMPLATES.find((t) => t.id === selectedTemplateId) ||
    INITIAL_WHATSAPP_TEMPLATES[0];

  // Substitute variables
  const populatedMessage = selectedTemplate.template
    .replace(/{STUDENT_NAME}/g, student.name)
    .replace(/{ROLL_NO}/g, student.rollNo)
    .replace(/{COURSE}/g, student.courseName)
    .replace(/{DUE_AMOUNT}/g, String(dueAmount))
    .replace(/{DUE_DATE}/g, dueDate)
    .replace(/{INSTITUTE_NAME}/g, settings.name)
    .replace(/{UPI_ID}/g, settings.upiId)
    .replace(/{INSTITUTE_PHONE}/g, settings.phone)
    .replace(/{PAID_AMOUNT}/g, String(student.paidAmount))
    .replace(/{REMAINING_BALANCE}/g, String(student.pendingAmount))
    .replace(/{PAYMENT_DATE}/g, 'Recently')
    .replace(/{PAYMENT_MODE}/g, 'Counter/UPI')
    .replace(/{RECEIPT_NO}/g, 'OFFICIAL-RECEIPT');

  const targetPhoneNumber = targetPhoneType === 'student' ? student.phone : student.parentPhone;

  const handleCopy = () => {
    navigator.clipboard.writeText(populatedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    const url = createWhatsAppURL(targetPhoneNumber, populatedMessage);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-6">
        {/* Header */}
        <div className="bg-emerald-700 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-800 rounded-lg">
              <MessageSquare className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Send WhatsApp Fee Reminder</h3>
              <p className="text-xs text-emerald-100">
                Direct WhatsApp Gateway • {student.name} ({student.rollNo})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Target Phone Selector */}
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-700 block">Send To:</span>
              <div className="flex items-center gap-4 mt-1">
                <label className="flex items-center gap-1.5 text-xs text-slate-800 cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="phoneType"
                    checked={targetPhoneType === 'student'}
                    onChange={() => setTargetPhoneType('student')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Student Phone ({student.phone})</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs text-slate-800 cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="phoneType"
                    checked={targetPhoneType === 'parent'}
                    onChange={() => setTargetPhoneType('parent')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Parent Phone ({student.parentPhone})</span>
                </label>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Total Overdue / Due
              </span>
              <span className="text-base font-extrabold font-mono text-rose-600">
                {formatCurrency(dueAmount)}
              </span>
            </div>
          </div>

          {/* Template Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              Choose Message Template
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {INITIAL_WHATSAPP_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTemplateId(t.id)}
                  className={`p-2.5 rounded-lg border text-xs text-left transition font-medium ${
                    selectedTemplateId === t.id
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-950 font-bold ring-2 ring-emerald-500/30'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {t.title}
                </button>
              ))}
            </div>
          </div>

          {/* Live Message Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Message Preview
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-[#EFEAE2] p-4 rounded-xl border border-[#D1D7DB] text-xs font-sans text-slate-800 whitespace-pre-wrap leading-relaxed shadow-inner max-h-56 overflow-y-auto">
              <div className="bg-white p-3 rounded-lg shadow-xs border border-slate-200 relative">
                {populatedMessage}
                <div className="text-[10px] text-slate-400 text-right mt-2 font-mono">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
                </div>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <AlertCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Clicking "Send via WhatsApp" will open WhatsApp Web or the WhatsApp desktop/mobile app
              with the message pre-filled for <strong>+91 {targetPhoneNumber}</strong>.
            </span>
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2 rounded-lg transition shadow-sm flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send via WhatsApp
              <ExternalLink className="w-3 h-3 text-emerald-200" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
