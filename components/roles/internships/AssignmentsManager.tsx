import React, { useState } from 'react';
import { useAppStore } from '../../../services/store';
import { InternshipAssignment, User } from '../../../types';
import { Users, Upload, Search, Building2, BookOpen, Trash2, Check, AlertCircle, X, Edit2, RotateCcw } from 'lucide-react';
import { EditFeedbackModal } from './EditFeedbackModal';
import { ConfirmDialog } from '../../common/ConfirmDialog';

export const AssignmentsManager: React.FC = () => {
  const { state, dispatch } = useAppStore();
  const cycles = state.feedbackCycles || [];
  const hotels = state.hotels || [];
  const assignments = state.internshipAssignments || [];
  const students = state.users.filter(u => u.role === 'student');

  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const [selectedHotelId, setSelectedHotelId] = useState<string>('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<InternshipAssignment | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  // In-app confirmation dialog state
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    type?: 'danger' | 'warning' | 'info' | 'success';
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

  const activeAssignments = assignments.filter(a => a.cycleId === selectedCycleId && a.hotelId === selectedHotelId);
  const activeCycle = cycles.find(c => c.id === selectedCycleId);
  const activeHotel = hotels.find(h => h.id === selectedHotelId);

  const submittedAssignments = activeAssignments.filter(a => a.feedbackSubmittedAt);

  const removeAssignment = (id: string, studentName: string) => {
    setConfirmState({
      isOpen: true,
      title: 'Remove Student Assignment',
      message: `Are you sure you want to remove ${studentName} from ${activeHotel?.name}? Any feedback submitted for them will also be removed.`,
      confirmText: 'Remove Student',
      type: 'danger',
      onConfirm: () => {
        dispatch({ type: 'REMOVE_INTERNSHIP_ASSIGNMENT', payload: id });
        setConfirmState(prev => ({ ...prev, isOpen: false }));
        showNotice(`Removed ${studentName} from hotel assignment.`);
      }
    });
  };

  const handleReopenStudent = (assignmentId: string, studentName: string) => {
    setConfirmState({
      isOpen: true,
      title: `Reopen Feedback for ${studentName}`,
      message: `Allow ${studentName}'s evaluation to be revised by ${activeHotel?.name}? Their previous ratings and remarks will be kept so they can simply edit and resubmit.`,
      confirmText: 'Reopen & Allow Resubmission',
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

  const handleReopenAllForHotel = () => {
    if (submittedAssignments.length === 0) return;
    setConfirmState({
      isOpen: true,
      title: `Reopen All Feedbacks for ${activeHotel?.name}`,
      message: `Are you sure you want to unlock all ${submittedAssignments.length} submitted evaluations? The hotel evaluator will be able to reopen their link, review/adjust scores, and submit again.`,
      confirmText: 'Unlock All Submissions',
      onConfirm: () => {
        dispatch({
          type: 'REOPEN_INTERNSHIP_FEEDBACK',
          payload: { assignmentIds: submittedAssignments.map(a => a.id) }
        });
        setConfirmState(prev => ({ ...prev, isOpen: false }));
        showNotice(`Feedback reopened for all ${submittedAssignments.length} students at ${activeHotel?.name}.`);
      }
    });
  };

  if (cycles.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle size={48} className="mx-auto text-amber-500 mb-4" />
        <h3 className="text-lg font-bold text-galaxy-900">No Feedback Cycles Found</h3>
        <p className="text-gray-500">You must create a Feedback Cycle first in the "Cycles & Criteria" tab.</p>
      </div>
    );
  }

  if (hotels.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 size={48} className="mx-auto text-amber-500 mb-4" />
        <h3 className="text-lg font-bold text-galaxy-900">No Hotels Found</h3>
        <p className="text-gray-500">You must add Partner Hotels first in the "Hotel Partners" tab.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Cycle</label>
          <select 
            value={selectedCycleId} onChange={(e) => setSelectedCycleId(e.target.value)}
            className="w-full border p-2 rounded focus:ring-2 focus:ring-gold-500"
          >
            <option value="">-- Choose a Cycle --</option>
            {cycles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Hotel</label>
          <select 
            value={selectedHotelId} onChange={(e) => setSelectedHotelId(e.target.value)}
            className="w-full border p-2 rounded focus:ring-2 focus:ring-gold-500"
            disabled={!selectedCycleId}
          >
            <option value="">-- Choose a Hotel --</option>
            {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        </div>
      </div>

      {selectedCycleId && selectedHotelId ? (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-white p-4 flex flex-wrap justify-between items-center gap-2 border-b">
            <div>
              <h3 className="font-bold text-galaxy-900">
                Students at {activeHotel?.name}
                <span className="ml-2 text-sm font-normal text-gray-500">({activeAssignments.length})</span>
              </h3>
              {submittedAssignments.length > 0 && (
                <div className="text-xs text-green-700 font-medium mt-0.5">
                  {submittedAssignments.length} of {activeAssignments.length} feedback(s) submitted
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              {submittedAssignments.length > 0 && (
                <button
                  onClick={handleReopenAllForHotel}
                  className="flex items-center gap-1.5 bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100 px-3 py-1.5 rounded text-xs font-bold transition-colors"
                  title="Allow hotel to resubmit feedback for all submitted students"
                >
                  <RotateCcw size={14} /> Allow Resubmission (All)
                </button>
              )}
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-gold-500 text-galaxy-900 px-4 py-2 rounded text-sm font-bold hover:bg-gold-600 transition-colors"
              >
                Add Students
              </button>
            </div>
          </div>
          
          <div className="divide-y">
            {activeAssignments.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No students assigned to this hotel for this cycle yet.
              </div>
            ) : (
              activeAssignments.map(assignment => {
                const student = students.find(s => s.id === assignment.studentId);
                return (
                  <div key={assignment.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-galaxy-100 flex items-center justify-center text-galaxy-700 font-bold shrink-0">
                        {student?.name.charAt(0) || '?'}
                      </div>
                      <div>
                        <div className="font-bold text-galaxy-900">{student?.name || 'Unknown Student'}</div>
                        <div className="text-xs text-gray-500">{student?.email} • Class {student?.classId} {student?.section}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {assignment.feedbackSubmittedAt ? (
                        <>
                          <span className="text-xs font-bold text-green-600 bg-green-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                            <Check size={12} /> Submitted
                          </span>
                          <button
                            onClick={() => setEditingAssignment(assignment)}
                            className="flex items-center gap-1 text-xs font-bold text-galaxy-700 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded transition-colors"
                            title="Edit feedback scores or remarks directly"
                          >
                            <Edit2 size={13} /> Edit
                          </button>
                          <button
                            onClick={() => handleReopenStudent(assignment.id, student?.name || 'this student')}
                            className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded transition-colors"
                            title="Allow hotel evaluator to resubmit this feedback"
                          >
                            <RotateCcw size={13} /> Reopen
                          </button>
                        </>
                      ) : (
                        <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                          Pending Submission
                        </span>
                      )}
                      <button 
                        onClick={() => removeAssignment(assignment.id, student?.name || 'this student')} 
                        className="text-red-400 hover:text-red-700 p-1.5 rounded hover:bg-red-50"
                        title="Remove student assignment"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
          Select a cycle and hotel above to view or manage assignments.
        </div>
      )}

      {isModalOpen && (
        <AddStudentModal 
          onClose={() => setIsModalOpen(false)}
          cycleId={selectedCycleId}
          hotelId={selectedHotelId}
          existingStudentIds={activeAssignments.map(a => a.studentId)}
        />
      )}

      {editingAssignment && (
        <EditFeedbackModal
          isOpen={!!editingAssignment}
          onClose={() => setEditingAssignment(null)}
          assignment={editingAssignment}
          student={students.find(s => s.id === editingAssignment.studentId)}
          hotel={activeHotel}
          cycle={activeCycle}
        />
      )}

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        type={confirmState.type}
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

// --- Sub-component for the Add Student Modal ---
const AddStudentModal: React.FC<{ onClose: () => void, cycleId: string, hotelId: string, existingStudentIds: string[] }> = ({ onClose, cycleId, hotelId, existingStudentIds }) => {
  const { state, dispatch } = useAppStore();
  const [method, setMethod] = useState<'individual'|'class'|'bulk'>('individual');
  
  const allStudents = state.users.filter(u => u.role === 'student');
  
  // Individual State
  const [searchQuery, setSearchQuery] = useState('');
  
  // Class State
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  
  // Bulk State
  const [csvResult, setCsvResult] = useState<{ matched: User[], notFound: string[] } | null>(null);

  const handleAddMultiple = (studentsToAdd: User[], shouldClose: boolean = false) => {
    const toAdd = studentsToAdd.filter(s => !existingStudentIds.includes(s.id));
    if (toAdd.length === 0) return alert("No new students to add.");
    
    const assignments: InternshipAssignment[] = toAdd.map(s => ({
      id: `asg_${Date.now()}_${Math.random().toString(36).substr(2,5)}`,
      cycleId,
      hotelId,
      studentId: s.id
    }));
    
    dispatch({ type: 'ADD_INTERNSHIP_ASSIGNMENTS', payload: assignments });
    if (shouldClose) onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l);
      if (lines.length < 2) return alert("CSV must have a header row and at least one data row.");

      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
      const emailIdx = headers.findIndex(h => h.includes('email'));
      
      if (emailIdx === -1) {
        return alert("Could not find an 'email' column in the CSV. Please ensure your column is named 'Email'.");
      }

      const matched: User[] = [];
      const notFound: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
        const email = cols[emailIdx]?.trim();
        if (!email) continue;

        const student = allStudents.find(s => s.email.toLowerCase() === email.toLowerCase());
        if (student) {
          if (!matched.find(m => m.id === student.id)) matched.push(student);
        } else {
          notFound.push(email);
        }
      }

      setCsvResult({ matched, notFound });
    };
    reader.readAsText(file);
  };

  const individualResults = searchQuery.length > 2 
    ? allStudents.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.email.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const classResults = selectedClass 
    ? allStudents.filter(s => s.classId === selectedClass && (!selectedSection || s.section === selectedSection))
    : [];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-galaxy-900 text-white p-4 flex justify-between items-center">
          <h3 className="font-bold flex items-center gap-2"><Users size={16} /> Add Students to Hotel</h3>
          <button onClick={onClose} className="hover:text-red-300"><X size={18} /></button>
        </div>
        
        <div className="flex border-b">
          <button onClick={() => setMethod('individual')} className={`flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2 ${method === 'individual' ? 'border-b-2 border-gold-500 text-galaxy-900' : 'text-gray-500'}`}><Search size={16}/> Search</button>
          <button onClick={() => setMethod('class')} className={`flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2 ${method === 'class' ? 'border-b-2 border-gold-500 text-galaxy-900' : 'text-gray-500'}`}><BookOpen size={16}/> By Class</button>
          <button onClick={() => setMethod('bulk')} className={`flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2 ${method === 'bulk' ? 'border-b-2 border-gold-500 text-galaxy-900' : 'text-gray-500'}`}><Upload size={16}/> Bulk CSV</button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {method === 'individual' && (
            <div className="space-y-4">
              <input 
                type="text" placeholder="Search by name or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-gold-500"
              />
              <div className="space-y-2">
                {searchQuery.length <= 2 ? <p className="text-gray-400 text-center text-sm">Type at least 3 characters...</p> : individualResults.length === 0 ? <p className="text-gray-400 text-center">No students found.</p> : individualResults.map(student => (
                  <div key={student.id} className="flex justify-between items-center p-3 border rounded hover:bg-gray-50">
                    <div>
                      <div className="font-bold text-galaxy-900">{student.name}</div>
                      <div className="text-xs text-gray-500">{student.email}</div>
                    </div>
                    <button 
                      onClick={() => handleAddMultiple([student])}
                      disabled={existingStudentIds.includes(student.id)}
                      className="px-3 py-1 bg-galaxy-100 text-galaxy-900 rounded font-medium text-sm disabled:opacity-50"
                    >
                      {existingStudentIds.includes(student.id) ? 'Added' : 'Add'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {method === 'class' && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <select value={selectedClass} onChange={e => {setSelectedClass(e.target.value); setSelectedSection('');}} className="flex-1 border p-2 rounded">
                  <option value="">Select Class...</option>
                  {state.systemClasses?.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
                <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)} disabled={!selectedClass} className="flex-1 border p-2 rounded">
                  <option value="">All Sections...</option>
                  {state.systemClasses?.find(c => c.name === selectedClass)?.sections.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              
              {selectedClass && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 p-3 flex justify-between items-center border-b">
                    <span className="font-bold text-galaxy-900">{classResults.length} Students Found</span>
                    <button 
                      onClick={() => handleAddMultiple(classResults, true)}
                      className="bg-gold-500 text-galaxy-900 px-3 py-1 rounded text-sm font-bold"
                    >
                      Add All {classResults.length}
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2 space-y-1">
                    {classResults.map(student => (
                      <div key={student.id} className="flex justify-between items-center p-2 text-sm hover:bg-gray-50 rounded">
                        <span>{student.name} <span className="text-gray-400">({student.section})</span></span>
                        {existingStudentIds.includes(student.id) ? (
                          <Check size={14} className="text-green-500" />
                        ) : (
                          <button 
                            onClick={() => handleAddMultiple([student])}
                            className="px-3 py-1 bg-galaxy-100 text-galaxy-900 rounded font-medium text-sm hover:bg-galaxy-200"
                          >
                            Add
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {method === 'bulk' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors">
                <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" id="csv-upload" />
                <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center">
                  <Upload size={32} className="text-gold-500 mb-2" />
                  <span className="font-bold text-galaxy-900">Click to upload CSV</span>
                  <span className="text-xs text-gray-500 mt-1">Must contain an "Email" column</span>
                </label>
              </div>

              {csvResult && (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg">
                    <h4 className="font-bold flex items-center gap-2"><Check size={18} /> Found {csvResult.matched.length} Students</h4>
                    <p className="text-sm mt-1">Ready to add to the hotel.</p>
                  </div>
                  
                  {csvResult.notFound.length > 0 && (
                    <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
                      <h4 className="font-bold">Could not find {csvResult.notFound.length} emails:</h4>
                      <div className="max-h-24 overflow-y-auto text-xs mt-2 font-mono">
                        {csvResult.notFound.map(e => <div key={e}>{e}</div>)}
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={() => handleAddMultiple(csvResult.matched, true)}
                    disabled={csvResult.matched.length === 0}
                    className="w-full py-3 bg-galaxy-900 text-white rounded-lg font-bold hover:bg-galaxy-800 disabled:opacity-50"
                  >
                    Confirm & Add {csvResult.matched.length} Students
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
