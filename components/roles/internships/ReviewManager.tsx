import React, { useState } from 'react';
import { useAppStore } from '../../../services/store';
import { Copy, Download, CheckCircle, Clock, ExternalLink, RotateCcw, Edit2, Check } from 'lucide-react';
import { InternshipAssignment } from '../../../types';
import { EditFeedbackModal } from './EditFeedbackModal';
import { ConfirmDialog } from '../../common/ConfirmDialog';

export const ReviewManager: React.FC = () => {
  const { state, dispatch } = useAppStore();
  const cycles = state.feedbackCycles || [];
  const hotels = state.hotels || [];
  const assignments = state.internshipAssignments || [];
  const students = state.users.filter(u => u.role === 'student');

  const [selectedCycleId, setSelectedCycleId] = useState<string>(cycles[0]?.id || '');
  const [editingAssignment, setEditingAssignment] = useState<InternshipAssignment | null>(null);
  const [copiedHotelId, setCopiedHotelId] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  // In-app confirm state
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const showNotice = (msg: string) => {
    setNoticeMessage(msg);
    setTimeout(() => setNoticeMessage(null), 4000);
  };

  const activeCycle = cycles.find(c => c.id === selectedCycleId);
  const activeAssignments = assignments.filter(a => a.cycleId === selectedCycleId);

  // Group assignments by hotel to see which hotels have submitted
  const hotelsInCycle = Array.from(new Set(activeAssignments.map(a => a.hotelId)))
    .map(hotelId => {
      const hotel = hotels.find(h => h.id === hotelId);
      const hotelAssignments = activeAssignments.filter(a => a.hotelId === hotelId);
      const isSubmitted = hotelAssignments.length > 0 && hotelAssignments.every(a => a.feedbackSubmittedAt);
      const someSubmitted = hotelAssignments.some(a => a.feedbackSubmittedAt);
      return { hotel, hotelAssignments, isSubmitted, someSubmitted };
    })
    .filter(h => h.hotel !== undefined);

  const copyLink = (hotelId: string) => {
    const rawId = hotelId.replace('htl_', '');
    const url = `${window.location.origin}/?hotel_token=${selectedCycleId}_htl_${rawId}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url);
    }
    setCopiedHotelId(hotelId);
    showNotice(`Link copied to clipboard! Share this URL with the hotel.`);
    setTimeout(() => setCopiedHotelId(null), 2500);
  };

  const handleReopenHotelFeedback = (hotelId: string, hotelName: string, hotelAssignments: InternshipAssignment[]) => {
    const submittedOnes = hotelAssignments.filter(a => a.feedbackSubmittedAt);
    if (submittedOnes.length === 0) return;

    setConfirmState({
      isOpen: true,
      title: `Reopen Feedback for ${hotelName}`,
      message: `Are you sure you want to unlock all ${submittedOnes.length} submitted student evaluation(s)? The hotel evaluator will be able to open their link, edit scores, and resubmit. Previous responses will be preserved for editing.`,
      confirmText: 'Unlock & Allow Resubmission',
      onConfirm: () => {
        dispatch({
          type: 'REOPEN_INTERNSHIP_FEEDBACK',
          payload: { assignmentIds: submittedOnes.map(a => a.id) }
        });
        setConfirmState(prev => ({ ...prev, isOpen: false }));
        showNotice(`Feedback reopened for ${hotelName}. They can now open their portal link to revise and resubmit.`);
      }
    });
  };

  const handleReopenSingle = (assignmentId: string, studentName: string) => {
    setConfirmState({
      isOpen: true,
      title: `Reopen Feedback for ${studentName}`,
      message: `Allow ${studentName}'s evaluation to be revised? The hotel evaluator will be able to open the portal, edit their ratings, and resubmit.`,
      confirmText: 'Reopen Evaluation',
      onConfirm: () => {
        dispatch({
          type: 'REOPEN_INTERNSHIP_FEEDBACK',
          payload: { assignmentIds: [assignmentId] }
        });
        setConfirmState(prev => ({ ...prev, isOpen: false }));
        showNotice(`Feedback reopened for ${studentName}. The hotel portal link is now unlocked for resubmission.`);
      }
    });
  };

  const exportCSV = () => {
    if (!activeCycle) return;
    
    // Build CSV Header
    const headers = ['Hotel Name', 'Student Name', 'Student Email', 'Class', 'Section'];
    activeCycle.criteria.forEach(c => headers.push(c.label));
    if (activeCycle.remarksEnabled) headers.push('Remarks');
    headers.push('Submitted At');

    let csvContent = headers.join(',') + '\n';

    activeAssignments.forEach(a => {
      if (!a.feedbackSubmittedAt) return; // Only export submitted feedback
      
      const student = students.find(s => s.id === a.studentId);
      const hotel = hotels.find(h => h.id === a.hotelId);
      
      const row = [
        `"${hotel?.name || 'Unknown'}"`,
        `"${student?.name || 'Unknown'}"`,
        `"${student?.email || ''}"`,
        `"${student?.classId || ''}"`,
        `"${student?.section || ''}"`
      ];

      activeCycle.criteria.forEach(c => {
        row.push(a.feedbackData?.[c.id]?.toString() || '');
      });

      if (activeCycle.remarksEnabled) {
        row.push(`"${(a.remarks || '').replace(/"/g, '""')}"`);
      }

      row.push(`"${new Date(a.feedbackSubmittedAt).toLocaleString()}"`);
      
      csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${activeCycle.name.replace(/\s+/g, '_')}_Feedback.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (cycles.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No cycles available to review.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200">
        <div className="w-64">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Cycle</label>
          <select 
            value={selectedCycleId} onChange={(e) => setSelectedCycleId(e.target.value)}
            className="w-full border p-2 rounded focus:ring-2 focus:ring-gold-500"
          >
            {cycles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <button 
          onClick={exportCSV}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-700 transition-colors"
        >
          <Download size={18} /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {hotelsInCycle.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border border-dashed rounded-xl">
            No hotels have been assigned students for this cycle.
          </div>
        ) : (
          hotelsInCycle.map(({ hotel, hotelAssignments, isSubmitted, someSubmitted }) => (
            <div key={hotel!.id} className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 p-4 flex flex-wrap justify-between items-center gap-3 border-b border-gray-200">
                <div>
                  <h4 className="font-bold text-galaxy-900 text-lg flex items-center gap-2">
                    {hotel!.name}
                    {isSubmitted ? (
                      <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        <CheckCircle size={12} /> All Submitted
                      </span>
                    ) : someSubmitted ? (
                      <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        Partially Submitted
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        <Clock size={12} /> Pending
                      </span>
                    )}
                  </h4>
                  <div className="text-sm text-gray-500 mt-1">
                    {hotelAssignments.length} students assigned • Contact: {hotel!.contactPerson || 'N/A'} ({hotel!.email || 'N/A'})
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {someSubmitted && (
                    <button 
                      onClick={() => handleReopenHotelFeedback(hotel!.id, hotel!.name, hotelAssignments)}
                      className="flex items-center gap-1.5 bg-amber-50 border border-amber-300 text-amber-900 px-3 py-1.5 rounded hover:bg-amber-100 text-xs font-bold transition-colors"
                      title="Reopen submission to allow the hotel evaluator to edit and resubmit"
                    >
                      <RotateCcw size={14} /> Allow Resubmission
                    </button>
                  )}
                  <button 
                    onClick={() => copyLink(hotel!.id)}
                    className="flex items-center gap-1 bg-white border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
                  >
                    {copiedHotelId === hotel!.id ? (
                      <>
                        <Check size={16} className="text-green-600" />
                        <span className="text-green-600 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={16} /> Copy Link
                      </>
                    )}
                  </button>
                  <a 
                    href={`/?hotel_token=${selectedCycleId}_htl_${hotel!.id.replace('htl_', '')}`}
                    target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 bg-white border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50 text-sm font-medium text-gray-700"
                  >
                    <ExternalLink size={16} /> Open Link
                  </a>
                </div>
              </div>
              
              {someSubmitted && (
                <div className="p-4">
                  <div className="text-sm font-bold text-gray-500 mb-2 uppercase">Scores Snapshot</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="border-b text-gray-600">
                          <th className="py-2">Student</th>
                          {activeCycle?.criteria.map(c => <th key={c.id} className="py-2">{c.label}</th>)}
                          {activeCycle?.remarksEnabled && <th className="py-2">Remarks</th>}
                          <th className="py-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hotelAssignments.map(a => {
                          const student = students.find(s => s.id === a.studentId);
                          return (
                            <tr key={a.id} className="border-b last:border-0 hover:bg-gray-50">
                              <td className="py-2 font-medium">
                                <div>{student?.name}</div>
                                <div className="text-xs text-gray-400">Class {student?.classId} {student?.section}</div>
                              </td>
                              {activeCycle?.criteria.map(c => (
                                <td key={c.id} className="py-2 font-bold text-galaxy-900">
                                  {a.feedbackData?.[c.id] !== undefined ? a.feedbackData[c.id] : '-'} <span className="text-gray-400 font-normal">/{c.max}</span>
                                </td>
                              ))}
                              {activeCycle?.remarksEnabled && (
                                <td className="py-2 text-gray-600 truncate max-w-xs">{a.remarks || '-'}</td>
                              )}
                              <td className="py-2 text-right whitespace-nowrap">
                                {a.feedbackSubmittedAt ? (
                                  <div className="flex justify-end gap-1.5">
                                    <button
                                      onClick={() => setEditingAssignment(a)}
                                      className="flex items-center gap-1 text-xs font-bold text-galaxy-700 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
                                      title="Edit feedback scores or remarks directly"
                                    >
                                      <Edit2 size={12} /> Edit
                                    </button>
                                    <button
                                      onClick={() => handleReopenSingle(a.id, student?.name || 'this student')}
                                      className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-1 rounded transition-colors"
                                      title="Reopen feedback for this student so hotel can resubmit"
                                    >
                                      <RotateCcw size={12} /> Reopen
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Pending</span>
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
            </div>
          ))
        )}
      </div>

      {editingAssignment && (
        <EditFeedbackModal
          isOpen={!!editingAssignment}
          onClose={() => setEditingAssignment(null)}
          assignment={editingAssignment}
          student={students.find(s => s.id === editingAssignment.studentId)}
          hotel={hotels.find(h => h.id === editingAssignment.hotelId)}
          cycle={activeCycle}
        />
      )}

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
      />

      {noticeMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-galaxy-900 text-white px-4 py-3 rounded-xl shadow-xl border border-galaxy-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <Check size={18} className="text-green-400 shrink-0" />
          <span className="text-sm font-medium">{noticeMessage}</span>
        </div>
      )}
    </div>
  );
};
