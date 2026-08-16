import React, { useState } from 'react';
import { useAppStore } from '../../../services/store';
import { FeedbackCycle, FeedbackCriteria } from '../../../types';
import { Plus, Edit2, Trash2, X, Settings, ListPlus, ArrowUp, ArrowDown } from 'lucide-react';
import { ConfirmDialog } from '../../common/ConfirmDialog';

const DEFAULT_CRITERIA: FeedbackCriteria[] = [
  { id: 'c1', label: 'Regularity/Punctuality', type: 'scale', min: 1, max: 5, order: 1 },
  { id: 'c2', label: 'Work Effectiveness', type: 'scale', min: 1, max: 10, order: 2 }
];

export const CyclesManager: React.FC = () => {
  const { state, dispatch } = useAppStore();
  const cycles = state.feedbackCycles || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<FeedbackCycle | null>(null);
  const [cycleToDelete, setCycleToDelete] = useState<string | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [remarksEnabled, setRemarksEnabled] = useState(true);
  const [criteria, setCriteria] = useState<FeedbackCriteria[]>([]);

  const handleOpenModal = (cycle?: FeedbackCycle) => {
    if (cycle) {
      setEditingCycle(cycle);
      setName(cycle.name);
      setIsActive(cycle.isActive);
      setRemarksEnabled(cycle.remarksEnabled);
      setCriteria([...cycle.criteria]);
    } else {
      setEditingCycle(null);
      setName('');
      setIsActive(true);
      setRemarksEnabled(true);
      setCriteria([...DEFAULT_CRITERIA]);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCycle) {
      dispatch({
        type: 'UPDATE_FEEDBACK_CYCLE',
        payload: { ...editingCycle, name, isActive, remarksEnabled, criteria }
      });
    } else {
      dispatch({
        type: 'ADD_FEEDBACK_CYCLE',
        payload: {
          id: `cyc_${Date.now()}`,
          name,
          isActive,
          remarksEnabled,
          criteria
        }
      });
    }
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    setCycleToDelete(id);
  };

  const handleConfirmDelete = () => {
    if (cycleToDelete) {
      dispatch({ type: 'DELETE_FEEDBACK_CYCLE', payload: cycleToDelete });
      setCycleToDelete(null);
    }
  };

  const addCriteria = () => {
    setCriteria([
      ...criteria, 
      { id: `c_${Date.now()}`, label: 'New Criteria', type: 'scale', min: 1, max: 5, order: criteria.length + 1 }
    ]);
  };

  const updateCriteria = (id: string, updates: Partial<FeedbackCriteria>) => {
    setCriteria(criteria.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const removeCriteria = (id: string) => {
    setCriteria(criteria.filter(c => c.id !== id));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-galaxy-900 flex items-center gap-2">
          <Settings size={20} className="text-gold-500" />
          Feedback Cycles
        </h3>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-galaxy-900 text-white px-4 py-2 rounded hover:bg-galaxy-800 transition-colors text-sm font-medium"
        >
          <Plus size={16} /> Create Cycle
        </button>
      </div>

      {cycles.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
          <Settings size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">No feedback cycles created yet.</p>
          <p className="text-sm text-gray-400 mt-1">Create a cycle (e.g. "Summer 2026") to begin assigning students.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {cycles.map(cycle => (
            <div key={cycle.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow relative">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-galaxy-900 text-lg">{cycle.name}</h4>
                <div className="flex gap-1">
                  <button onClick={() => handleOpenModal(cycle)} className="p-1 text-gray-400 hover:text-blue-600">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(cycle.id)} className="p-1 text-gray-400 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${cycle.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {cycle.isActive ? 'Active (Accepting Feedback)' : 'Locked'}
                </span>
                {cycle.remarksEnabled && <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-700">Remarks Enabled</span>}
              </div>
              
              <div className="bg-gray-50 rounded p-3 text-sm border border-gray-100">
                <h5 className="font-bold text-gray-700 mb-2 text-xs uppercase">Grading Criteria</h5>
                <ul className="space-y-1">
                  {cycle.criteria.map(c => (
                    <li key={c.id} className="text-gray-600 flex justify-between">
                      <span>{c.label}</span>
                      <span className="text-gray-400">Scale: {c.min}-{c.max}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-galaxy-900 text-white p-4 flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2">
                <Settings size={16} /> 
                {editingCycle ? 'Edit Cycle' : 'Create New Cycle'}
              </h3>
              <button onClick={handleCloseModal} className="hover:text-red-300">
                <X size={18} />
              </button>
            </div>
            
            <div className="overflow-y-auto p-6">
              <form id="cycleForm" onSubmit={handleSubmit} className="space-y-6">
                
                <div className="space-y-4 border-b pb-6">
                  <h4 className="font-bold text-gray-800">General Settings</h4>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cycle Name</label>
                    <input
                      type="text" required
                      className="w-full border p-2 rounded focus:ring-2 focus:ring-gold-500 outline-none"
                      value={name} onChange={e => setName(e.target.value)}
                      placeholder="e.g. Summer 2026 Internship"
                    />
                  </div>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4 text-gold-600" />
                      <span className="text-sm font-medium text-gray-700">Active (Accepting Feedback)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={remarksEnabled} onChange={e => setRemarksEnabled(e.target.checked)} className="w-4 h-4 text-gold-600" />
                      <span className="text-sm font-medium text-gray-700">Include "Remarks" Text Field</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-gray-800">Feedback Criteria Form</h4>
                    <button type="button" onClick={addCriteria} className="text-sm text-gold-600 font-bold flex items-center gap-1 hover:text-gold-700">
                      <Plus size={14} /> Add Field
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {criteria.map((c, index) => (
                      <div key={c.id} className="flex gap-3 items-center bg-gray-50 p-3 rounded border border-gray-200">
                        <div className="flex-1">
                          <input 
                            type="text" value={c.label} required
                            onChange={e => updateCriteria(c.id, { label: e.target.value })}
                            className="w-full text-sm border p-1.5 rounded" placeholder="Criteria Name"
                          />
                        </div>
                        <div className="flex gap-2 items-center w-32">
                          <input 
                            type="number" value={c.min}
                            onChange={e => updateCriteria(c.id, { min: parseInt(e.target.value) || 0 })}
                            className="w-full text-sm border p-1.5 rounded text-center" placeholder="Min"
                          />
                          <span className="text-xs text-gray-400">to</span>
                          <input 
                            type="number" value={c.max}
                            onChange={e => updateCriteria(c.id, { max: parseInt(e.target.value) || 0 })}
                            className="w-full text-sm border p-1.5 rounded text-center" placeholder="Max"
                          />
                        </div>
                        <button type="button" onClick={() => removeCriteria(c.id)} className="text-red-500 hover:text-red-700 p-1">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    {criteria.length === 0 && (
                      <p className="text-sm text-red-500">You must add at least one criteria field.</p>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">Note: Changing these criteria will only apply to new feedbacks in this cycle. To preserve data integrity across semesters, create a new cycle instead of massively editing an old one.</p>
                </div>

              </form>
            </div>
            
            <div className="p-4 border-t bg-gray-50 flex gap-3">
              <button type="button" onClick={handleCloseModal} className="flex-1 py-2 border rounded hover:bg-white text-sm font-medium">
                Cancel
              </button>
              <button type="submit" form="cycleForm" disabled={criteria.length === 0} className="flex-1 py-2 bg-galaxy-600 text-white rounded hover:bg-galaxy-700 disabled:opacity-50 text-sm font-bold">
                {editingCycle ? 'Save Changes' : 'Create Cycle'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!cycleToDelete}
        title="Delete Feedback Cycle"
        message="Are you sure you want to delete this cycle? This will remove the cycle from the active list. Existing past feedback records will remain stored."
        confirmText="Delete Cycle"
        type="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setCycleToDelete(null)}
      />
    </div>
  );
};
