import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../../services/store';
import { InternshipAssignment, FeedbackCycle, Hotel, User } from '../../../types';
import { X, Check, RotateCcw, Building2, AlertCircle } from 'lucide-react';
import { ConfirmDialog } from '../../common/ConfirmDialog';

interface EditFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: InternshipAssignment;
  student?: User;
  hotel?: Hotel;
  cycle?: FeedbackCycle;
}

export const EditFeedbackModal: React.FC<EditFeedbackModalProps> = ({
  isOpen,
  onClose,
  assignment,
  student,
  hotel,
  cycle
}) => {
  const { dispatch } = useAppStore();

  const [scores, setScores] = useState<Record<string, number>>({});
  const [remarks, setRemarks] = useState<string>('');
  const [isConfirmReopenOpen, setIsConfirmReopenOpen] = useState(false);

  useEffect(() => {
    if (cycle && assignment) {
      const initialScores: Record<string, number> = {};
      cycle.criteria.forEach(c => {
        initialScores[c.id] = assignment.feedbackData?.[c.id] ?? c.max;
      });
      setScores(initialScores);
      setRemarks(assignment.remarks || '');
    }
  }, [assignment, cycle]);

  if (!isOpen || !cycle || !assignment) return null;

  const handleScoreChange = (criteriaId: string, val: number) => {
    setScores(prev => ({ ...prev, [criteriaId]: val }));
  };

  const handleSaveDirect = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({
      type: 'UPDATE_INTERNSHIP_FEEDBACK',
      payload: {
        assignmentId: assignment.id,
        feedbackData: scores,
        remarks
      }
    });
    onClose();
  };

  const handleExecuteReopen = () => {
    dispatch({
      type: 'REOPEN_INTERNSHIP_FEEDBACK',
      payload: {
        assignmentIds: [assignment.id]
      }
    });
    setIsConfirmReopenOpen(false);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
          <div className="bg-galaxy-900 text-white p-4 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-base">Edit Internship Feedback</h3>
              <div className="text-xs text-gray-300">
                {student?.name} • {hotel?.name}
              </div>
            </div>
            <button onClick={onClose} className="hover:text-red-300 p-1">
              <X size={18} />
            </button>
          </div>

          <form id="editFeedbackForm" onSubmit={handleSaveDirect} className="p-6 overflow-y-auto flex-1 space-y-5">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 flex items-start gap-2">
              <AlertCircle size={16} className="text-blue-600 mt-0.5 shrink-0" />
              <div>
                You can adjust scores/remarks directly as an Admin, or click <strong>Allow Hotel Resubmission</strong> to reopen the link for the hotel evaluator.
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-sm text-gray-800">Criteria Scores</h4>
              {cycle.criteria.map(c => {
                const currentVal = scores[c.id] ?? c.max;
                return (
                  <div key={c.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-semibold text-sm text-gray-800">{c.label}</label>
                      <div className="flex items-center gap-1">
                        <input 
                          type="number"
                          min={c.min}
                          max={c.max}
                          value={currentVal}
                          onChange={e => handleScoreChange(c.id, parseInt(e.target.value) || c.min)}
                          className="w-16 border rounded p-1 text-center font-bold text-galaxy-900 text-sm focus:ring-1 focus:ring-gold-500"
                        />
                        <span className="text-xs text-gray-400">/ {c.max}</span>
                      </div>
                    </div>
                    <input 
                      type="range"
                      min={c.min}
                      max={c.max}
                      step="1"
                      value={currentVal}
                      onChange={e => handleScoreChange(c.id, parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gold-500 mt-2"
                    />
                    <div className="flex justify-between text-[11px] text-gray-400 mt-0.5">
                      <span>Min ({c.min})</span>
                      <span>Max ({c.max})</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {cycle.remarksEnabled && (
              <div>
                <label className="font-bold text-sm text-gray-800 block mb-1">Remarks</label>
                <textarea 
                  rows={3}
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  placeholder="Evaluator's remarks..."
                  className="w-full border p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-gold-500 outline-none"
                />
              </div>
            )}
          </form>

          <div className="p-4 border-t bg-gray-50 flex flex-col sm:flex-row gap-2 justify-between">
            <button
              type="button"
              onClick={() => setIsConfirmReopenOpen(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 border border-amber-300 bg-amber-50 text-amber-900 rounded-lg hover:bg-amber-100 text-xs font-bold transition-colors"
            >
              <RotateCcw size={14} /> Reopen for Hotel Resubmission
            </button>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded-lg hover:bg-white text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="editFeedbackForm"
                className="flex items-center gap-1 px-4 py-2 bg-galaxy-900 text-white rounded-lg hover:bg-galaxy-800 text-xs font-bold transition-colors"
              >
                <Check size={14} /> Save Direct
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isConfirmReopenOpen}
        title="Allow Hotel Resubmission"
        message={`Reopen evaluation for ${student?.name || 'this student'}? The partner hotel (${hotel?.name}) will be able to reopen their link, make adjustments, and resubmit.`}
        confirmText="Reopen Evaluation"
        onConfirm={handleExecuteReopen}
        onCancel={() => setIsConfirmReopenOpen(false)}
      />
    </>
  );
};
