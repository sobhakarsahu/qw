import React, { useState } from 'react';
import {
  Student,
  BiometricAttendanceRecord,
  BiometricDevice,
  VerificationType,
  AttendanceStatus,
} from '../types';
import { downloadCSV, formatDate } from '../utils/helpers';
import {
  Fingerprint,
  Cpu,
  RefreshCw,
  Upload,
  Download,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UserCheck,
  Search,
  Filter,
  Check,
  Radio,
  Sparkles,
} from 'lucide-react';

interface BiometricAttendanceProps {
  students: Student[];
  records: BiometricAttendanceRecord[];
  devices: BiometricDevice[];
  onAddPunchRecord: (record: BiometricAttendanceRecord) => void;
  onSyncDevice: (deviceId: string) => void;
  onImportPunches: (newRecords: BiometricAttendanceRecord[]) => void;
}

export const BiometricAttendance: React.FC<BiometricAttendanceProps> = ({
  students,
  records,
  devices,
  onAddPunchRecord,
  onSyncDevice,
  onImportPunches,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(devices[0]?.id || '');
  const [punchMode, setPunchMode] = useState<'IN' | 'OUT'>('IN');
  const [verificationType, setVerificationType] = useState<VerificationType>('FINGERPRINT');
  const [isScanning, setIsScanning] = useState(false);
  const [lastPunchAlert, setLastPunchAlert] = useState<BiometricAttendanceRecord | null>(null);

  // Filter state
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importCsvText, setImportCsvText] = useState('');
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  // Trigger Biometric Scan
  const handleTriggerPunch = () => {
    if (!selectedStudent) return;

    setIsScanning(true);

    setTimeout(() => {
      setIsScanning(false);

      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      const hours = now.getHours();
      // Late logic e.g. after 9:15 AM for morning or custom
      const isLate = hours >= 10 && hours < 11;

      const newRecord: BiometricAttendanceRecord = {
        id: `bio-${Date.now()}`,
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        studentRollNo: selectedStudent.rollNo,
        biometricId: selectedStudent.biometricId,
        date: selectedDate,
        punchInTime: timeStr,
        punchOutTime: punchMode === 'OUT' ? timeStr : undefined,
        status: isLate ? 'LATE' : 'PRESENT',
        deviceId: selectedDeviceId,
        verificationType,
      };

      onAddPunchRecord(newRecord);
      setLastPunchAlert(newRecord);

      // Play soft browser audio tone for biometric punch
      try {
        const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 tone
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.18);
      } catch {
        // AudioContext not allowed or silent
      }
    }, 1200);
  };

  // Sync All Devices
  const handleSyncAllDevices = () => {
    setIsSyncingAll(true);
    devices.forEach((d) => onSyncDevice(d.id));
    setTimeout(() => {
      setIsSyncingAll(false);
    }, 1500);
  };

  // Export Attendance CSV
  const handleExportAttendanceCSV = () => {
    const headers = [
      'Date',
      'Roll No',
      'Biometric ID',
      'Student Name',
      'Punch In Time',
      'Punch Out Time',
      'Status',
      'Device Terminal',
      'Verification Mode',
    ];
    const rows = records.map((r) => [
      r.date,
      r.studentRollNo,
      r.biometricId,
      `"${r.studentName}"`,
      r.punchInTime,
      r.punchOutTime || '-',
      r.status,
      devices.find((d) => d.id === r.deviceId)?.name || r.deviceId,
      r.verificationType,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadCSV(`attendance-report-${selectedDate}.csv`, csvContent);
  };

  // Parse Biometric CSV import
  const handleProcessImport = () => {
    if (!importCsvText.trim()) return;
    const lines = importCsvText.trim().split('\n');
    const parsed: BiometricAttendanceRecord[] = [];

    // Format: BiometricID, Date(YYYY-MM-DD), PunchTime(HH:MM:SS), DeviceModel
    lines.forEach((line, index) => {
      if (index === 0 && line.toLowerCase().includes('biometric')) return; // Skip header
      const parts = line.split(',').map((p) => p.trim());
      if (parts.length >= 3) {
        const bioId = parts[0];
        const date = parts[1] || selectedDate;
        const time = parts[2];
        const devName = parts[3] || 'ZKTeco K40 Machine Import';

        // Match student by biometricId
        const matchStudent = students.find((s) => s.biometricId === bioId);

        parsed.push({
          id: `imp-bio-${Date.now()}-${index}`,
          studentId: matchStudent?.id || 'unknown',
          studentName: matchStudent?.name || `Student (Bio #${bioId})`,
          studentRollNo: matchStudent?.rollNo || `BIO-${bioId}`,
          biometricId: bioId,
          date,
          punchInTime: time,
          status: 'PRESENT',
          deviceId: 'dev-01',
          verificationType: 'FINGERPRINT',
        });
      }
    });

    if (parsed.length > 0) {
      onImportPunches(parsed);
      setShowImportModal(false);
      setImportCsvText('');
    }
  };

  // Filtered records
  const filteredRecords = records.filter((r) => {
    const matchDate = !selectedDate || r.date === selectedDate;
    const matchSearch =
      r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.studentRollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.biometricId.includes(searchQuery);
    const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchDate && matchSearch && matchStatus;
  });

  const totalPunchesToday = records.filter((r) => r.date === selectedDate).length;
  const onTimeCount = records.filter((r) => r.date === selectedDate && r.status === 'PRESENT').length;
  const lateCount = records.filter((r) => r.date === selectedDate && r.status === 'LATE').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Devices Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Terminal Station Simulator */}
        <div className="lg:col-span-2 bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-0.5 rounded-full font-bold border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Biometric Terminal Simulator
                </span>
                <span className="text-xs text-slate-400">ZKTeco & eSSL Hardware Interface</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white">
                Punch In / Out Biometric Station
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-hidden"
              >
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.ipAddress})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
            {/* Student Picker & Punch Controls */}
            <div className="sm:col-span-7 space-y-3">
              <div>
                <label className="text-xs text-slate-400 uppercase font-semibold block mb-1">
                  Select Student to Punch:
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full bg-slate-800 text-white text-xs border border-slate-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} • Roll: {s.rollNo} (Bio ID: {s.biometricId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-slate-400 text-[11px] block mb-1">Punch Mode:</label>
                  <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                    <button
                      type="button"
                      onClick={() => setPunchMode('IN')}
                      className={`flex-1 py-1.5 rounded-md font-bold transition text-xs ${
                        punchMode === 'IN'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Punch IN
                    </button>
                    <button
                      type="button"
                      onClick={() => setPunchMode('OUT')}
                      className={`flex-1 py-1.5 rounded-md font-bold transition text-xs ${
                        punchMode === 'OUT'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Punch OUT
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 text-[11px] block mb-1">Sensor Method:</label>
                  <select
                    value={verificationType}
                    onChange={(e) => setVerificationType(e.target.value as VerificationType)}
                    className="w-full bg-slate-800 text-slate-200 text-xs border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-hidden"
                  >
                    <option value="FINGERPRINT">Fingerprint Scanner</option>
                    <option value="FACE">Facial Recognition</option>
                    <option value="RFID">Smart RFID Card</option>
                    <option value="MANUAL">Manual Desk Override</option>
                  </select>
                </div>
              </div>

              {selectedStudent && (
                <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/80 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Enrolled Course:</span>
                    <span className="font-semibold text-slate-200">{selectedStudent.courseName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Assigned Batch:</span>
                    <span className="font-mono text-indigo-300">{selectedStudent.batchTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Fees Clearance:</span>
                    <span
                      className={`font-semibold ${
                        selectedStudent.pendingAmount === 0
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {selectedStudent.pendingAmount === 0
                        ? 'Fully Paid'
                        : `₹${selectedStudent.pendingAmount} Due`}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Optical Fingerprint Scanner Target */}
            <div className="sm:col-span-5 flex flex-col items-center justify-center text-center p-3">
              <button
                type="button"
                onClick={handleTriggerPunch}
                disabled={isScanning || !selectedStudent}
                className={`relative w-28 h-28 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 shadow-xl cursor-pointer ${
                  isScanning
                    ? 'bg-emerald-600 scale-95 ring-4 ring-emerald-400/50'
                    : 'bg-gradient-to-b from-indigo-900 to-slate-800 hover:from-indigo-800 hover:to-slate-700 border-2 border-indigo-500/40 hover:border-emerald-400'
                }`}
              >
                {/* Scanner Beam Animation */}
                {isScanning && (
                  <div className="absolute inset-0 bg-emerald-400/25 rounded-2xl animate-pulse" />
                )}

                <Fingerprint
                  className={`w-14 h-14 transition-colors duration-300 ${
                    isScanning
                      ? 'text-white animate-bounce'
                      : 'text-emerald-400 group-hover:text-emerald-300'
                  }`}
                />

                <span className="text-[10px] font-mono font-bold mt-1 text-slate-200">
                  {isScanning ? 'SCANNING...' : 'PRESS SENSOR'}
                </span>
              </button>

              <p className="text-[11px] text-slate-400 mt-2 font-mono">
                Optical Resolution: 500 DPI • False Accept Rate: &lt;0.0001%
              </p>
            </div>
          </div>

          {/* Last Punch Confirmation Alert */}
          {lastPunchAlert && (
            <div className="mt-4 bg-emerald-950/80 border border-emerald-500/40 rounded-xl p-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold text-emerald-300">
                    PUNCH VERIFIED: {lastPunchAlert.studentName} ({lastPunchAlert.studentRollNo})
                  </span>
                  <span className="text-slate-300 block text-[11px]">
                    Terminal: Lab 1 (Bio #{lastPunchAlert.biometricId}) • Time:{' '}
                    {lastPunchAlert.punchInTime} • Status:{' '}
                    <strong className="text-emerald-300">{lastPunchAlert.status}</strong>
                  </span>
                </div>
              </div>
              <button
                onClick={() => setLastPunchAlert(null)}
                className="text-slate-400 hover:text-white text-xs px-2"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>

        {/* Hardware Devices & Quick Sync Panel */}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Biometric Machine Fleet</h3>
              </div>
              <button
                onClick={handleSyncAllDevices}
                disabled={isSyncingAll}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
                {isSyncingAll ? 'Syncing...' : 'Sync Fleet'}
              </button>
            </div>

            <div className="space-y-3">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{device.name}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {device.status}
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px] font-mono">
                    Model: {device.model}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200 font-mono">
                    <span>
                      IP: {device.ipAddress}:{device.port}
                    </span>
                    <span>Logs Today: {device.totalLogsToday}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 mt-4 space-y-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold py-2 rounded-lg transition flex items-center justify-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5 text-slate-600" />
              Import Machine CSV / DAT Logs
            </button>
            <button
              onClick={handleExportAttendanceCSV}
              className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold py-2 rounded-lg transition flex items-center justify-center gap-1.5 border border-indigo-200"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              Export Today's Attendance Sheet
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Total Punches Today</div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono mt-0.5">
            {totalPunchesToday}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Across all institute terminals</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">On-Time Attendance</div>
          <div className="text-2xl font-extrabold text-emerald-600 font-mono mt-0.5">
            {onTimeCount}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Punched before cutoff</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Late Arrivals</div>
          <div className="text-2xl font-extrabold text-amber-600 font-mono mt-0.5">
            {lateCount}
          </div>
          <div className="text-[11px] text-amber-600 font-medium mt-1">Grace period exceeded</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Enrolled Students Present %</div>
          <div className="text-2xl font-extrabold text-indigo-600 font-mono mt-0.5">
            {students.length > 0
              ? `${Math.round((totalPunchesToday / students.length) * 100)}%`
              : '0%'}
          </div>
          <div className="text-[11px] text-indigo-600 font-medium mt-1">
            {totalPunchesToday} of {students.length} students logged
          </div>
        </div>
      </div>

      {/* Attendance Register Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Filters */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-semibold text-slate-700">Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="PRESENT">Present (On-Time)</option>
              <option value="LATE">Late Arrival</option>
            </select>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by student, roll, or Bio ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Biometric ID</th>
                <th className="py-3 px-4">Student Particulars</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Punch In Time</th>
                <th className="py-3 px-4">Punch Out Time</th>
                <th className="py-3 px-4">Terminal Device</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    <Clock className="w-8 h-8 mx-auto text-slate-300 mb-1.5" />
                    <p className="font-medium text-slate-600">No punch records found for this date</p>
                    <p className="text-[11px] text-slate-400">
                      Use the scanner above or sync connected devices to register attendance.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const device = devices.find((d) => d.id === r.deviceId);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                        BIO-{r.biometricId}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{r.studentName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {r.studentRollNo}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-mono">
                        {formatDate(r.date)}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-emerald-700">
                        {r.punchInTime}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {r.punchOutTime || '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {device ? device.name : r.deviceId}
                      </td>
                      <td className="py-3 px-4 uppercase text-[10px] font-bold text-slate-600">
                        {r.verificationType}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                            r.status === 'PRESENT'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-600" />
                Import Biometric Machine Logs (CSV)
              </h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              Paste punch records exported from ZKTeco BioTime or eSSL eTimeTrackLite software in
              the standard format:{' '}
              <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-indigo-700">
                BiometricID, Date (YYYY-MM-DD), Time (HH:MM:SS), Device
              </code>
            </p>

            <textarea
              value={importCsvText}
              onChange={(e) => setImportCsvText(e.target.value)}
              placeholder={`101, 2026-03-20, 08:02:11 AM, Lab 1 Terminal\n102, 2026-03-20, 09:59:45 AM, Lab 1 Terminal\n103, 2026-03-20, 04:05:12 PM, Reception Terminal`}
              className="w-full text-xs font-mono p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden mb-3"
              rows={6}
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessImport}
                disabled={!importCsvText.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg transition"
              >
                Process & Register Punches
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
