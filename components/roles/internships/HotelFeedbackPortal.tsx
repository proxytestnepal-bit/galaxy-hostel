import React, { useState } from 'react';
import { useAppStore } from '../../../services/store';
import { InternshipAssignment, FeedbackCycle, Hotel, User } from '../../../types';
import { CheckCircle, Building2, Send, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { ConfirmDialog } from '../../common/ConfirmDialog';

interface HotelFeedbackPortalProps {
  token: string;
}

export const HotelFeedbackPortal: React.FC<HotelFeedbackPortalProps> = ({ token }) => {
  const { state, dispatch } = useAppStore();
  const [cycleId, hotelId] = token.split('_htl_');
  const fullHotelId = 'htl_' + hotelId;
  
  const cycle = state.feedbackCycles?.find(c => c.id === cycleId);
  const hotel = state.hotels?.find(h => h.id === fullHotelId);
  const assignments = React.useMemo(() => state.internshipAssignments?.filter(a => a.cycleId === cycleId && a.hotelId === fullHotelId) || [], [state.internshipAssignments, cycleId, fullHotelId]);
  const students = state.users.filter(u => u.role === 'student');

  const [isSubmittedState, setIsSubmittedState] = useState(false);
  const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState(false);
  const [feedbackState, setFeedbackState] = useState<Record<string, { scores: Record<string, number>, remarks: string }>>({});

  // Initialize form state
  React.useEffect(() => {
    if (!cycle) return;
    const initial: typeof feedbackState = {};
    assignments.forEach(a => {
      if (a.feedbackData && Object.keys(a.feedbackData).length > 0) {
        initial[a.id] = { scores: { ...a.feedbackData }, remarks: a.remarks || '' };
        // Fill default max for any missing criteria
        cycle.criteria.forEach(c => {
          if (initial[a.id].scores[c.id] === undefined) {
            initial[a.id].scores[c.id] = c.max;
          }
        });
      } else {
        initial[a.id] = { scores: {}, remarks: '' };
        cycle.criteria.forEach(c => {
          initial[a.id].scores[c.id] = c.max; // default to max score
        });
      }
    });
    setFeedbackState(initial);
  }, [assignments, cycle]);

  if (!cycle || !hotel) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-md text-center max-w-md w-full">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Link</h2>
          <p className="text-gray-600">This feedback link is invalid or has expired. Please contact the college administration.</p>
        </div>
      </div>
    );
  }

  const isFullySubmitted = assignments.length > 0 && assignments.every(a => a.feedbackSubmittedAt);
  const isReopened = assignments.some(a => a.feedbackData && Object.keys(a.feedbackData).length > 0 && !a.feedbackSubmittedAt);

  const handleExecuteSubmit = () => {
    const now = new Date().toISOString();
    const updatedAssignments: InternshipAssignment[] = assignments.map(a => ({
      ...a,
      feedbackSubmittedAt: now,
      feedbackData: feedbackState[a.id]?.scores || {},
      remarks: feedbackState[a.id]?.remarks || ''
    }));

    dispatch({ type: 'SUBMIT_INTERNSHIP_FEEDBACK', payload: updatedAssignments });
    setIsConfirmSubmitOpen(false);
    setIsSubmittedState(true);
  };

  if (isFullySubmitted || isSubmittedState) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-lg w-full border-t-4 border-green-500">
          <CheckCircle size={56} className="mx-auto text-green-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Feedback Submitted</h2>
          <p className="text-gray-600 mb-4">
            Thank you for evaluating our students for <strong>{cycle.name}</strong> at <strong>{hotel.name}</strong>. Your feedback has been safely recorded.
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-500 mb-6 text-left space-y-1">
            <div className="font-semibold text-gray-700">Need to make corrections?</div>
            <div>If you noticed a mistake or need to update submitted scores/remarks, please contact the college administration to reopen the evaluation link for you.</div>
          </div>
          <div className="text-sm text-gray-400">You can safely close this browser window.</div>
        </div>
      </div>
    );
  }

  if (!cycle.isActive) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-md text-center max-w-md w-full">
          <AlertCircle size={48} className="mx-auto text-amber-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Cycle Closed</h2>
          <p className="text-gray-600">The feedback period for {cycle.name} is currently closed.</p>
        </div>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-md text-center max-w-md w-full">
          <Building2 size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Students Assigned</h2>
          <p className="text-gray-600">There are no students currently assigned to {hotel.name} for this cycle.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <div className="bg-galaxy-900 text-white p-6 shadow-md rounded-b-3xl mb-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Building2 size={24} className="text-gold-500" />
            <h1 className="text-2xl font-bold">{hotel.name}</h1>
          </div>
          <p className="text-gray-300">Internship Feedback • {cycle.name}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 space-y-4">
        {isReopened ? (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-sm text-amber-900 mb-6 flex items-start gap-3 shadow-sm">
            <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
            <div>
              <div className="font-bold">Form Reopened for Corrections</div>
              <div className="text-xs text-amber-800 mt-0.5">
                The college administration has unlocked this evaluation. Your previous ratings and comments have been restored below. Please update any necessary scores and submit when finished.
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 mb-6">
            Please provide your feedback for the {assignments.length} student(s) below. All scores are required.
          </div>
        )}

        {assignments.map(assignment => {
          const student = students.find(s => s.id === assignment.studentId);
          const fState = feedbackState[assignment.id];
          if (!student || !fState) return null;

          return (
            <div key={assignment.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gold-100 flex items-center justify-center text-gold-800 font-bold text-lg">
                  {student.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-gray-900">{student.name}</div>
                  <div className="text-xs text-gray-500">Class {student.classId} {student.section}</div>
                </div>
              </div>
              
              <div className="p-4 space-y-6">
                {cycle.criteria.map(c => (
                  <div key={c.id}>
                    <div className="flex justify-between items-end mb-2">
                      <label className="font-bold text-sm text-gray-700">{c.label}</label>
                      <span className="text-2xl font-black text-gold-600">{fState.scores[c.id]}<span className="text-sm font-normal text-gray-400">/{c.max}</span></span>
                    </div>
                    
                    <input 
                      type="range" 
                      min={c.min} 
                      max={c.max} 
                      step="1"
                      value={fState.scores[c.id] ?? c.max}
                      onChange={(e) => {
                        setFeedbackState(prev => ({
                          ...prev,
                          [assignment.id]: {
                            ...prev[assignment.id],
                            scores: { ...prev[assignment.id].scores, [c.id]: parseInt(e.target.value) }
                          }
                        }));
                      }}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gold-500"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>Poor ({c.min})</span>
                      <span>Excellent ({c.max})</span>
                    </div>
                  </div>
                ))}

                {cycle.remarksEnabled && (
                  <div>
                    <label className="font-bold text-sm text-gray-700 block mb-2">Remarks (Optional)</label>
                    <textarea 
                      className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none text-sm"
                      rows={3}
                      placeholder="Any additional comments..."
                      value={fState.remarks}
                      onChange={(e) => {
                        setFeedbackState(prev => ({
                          ...prev,
                          [assignment.id]: { ...prev[assignment.id], remarks: e.target.value }
                        }));
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div className="mt-8">
          <button 
            type="button"
            onClick={() => setIsConfirmSubmitOpen(true)}
            className="w-full bg-galaxy-900 text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2 hover:bg-galaxy-800 transition-colors shadow-lg cursor-pointer"
          >
            <Send size={20} />
            Submit Feedback for All {assignments.length} Students
          </button>
          <p className="text-center text-xs text-gray-500 mt-3">You will not be able to edit this once submitted unless reopened by the college.</p>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isConfirmSubmitOpen}
        title="Submit Hotel Feedback"
        message={`Are you sure you want to submit evaluations for all ${assignments.length} intern(s)? Your ratings and remarks will be recorded for the college.`}
        confirmText="Confirm & Submit"
        type="info"
        onConfirm={handleExecuteSubmit}
        onCancel={() => setIsConfirmSubmitOpen(false)}
      />
    </div>
  );
};
