
import React, { useState } from 'react';
import { useAppStore } from '../../services/store';
import { Assignment } from '../../types';
import { generateAssignmentIdeas, generateFeedbackHelper } from '../../services/geminiService';
import { Sparkles, Send, CheckCircle, Clock, PenTool, Save } from 'lucide-react';

interface Props {
  activeTab: string;
}

const TeacherView: React.FC<Props> = ({ activeTab }) => {
  const { state, dispatch } = useAppStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');

  // Form State
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    subject: state.currentUser?.subjects?.[0] || '',
    targetClassId: 'Class 10A',
    dueDate: '',
  });

  // Marks Entry State
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    const assignment: Assignment = {
      id: Date.now().toString(),
      ...newAssignment,
      teacherId: state.currentUser?.id || '',
      createdAt: new Date().toISOString().split('T')[0],
    };
    dispatch({ type: 'ADD_ASSIGNMENT', payload: assignment });
    setShowCreateModal(false);
    setNewAssignment({ title: '', description: '', subject: state.currentUser?.subjects?.[0] || '', targetClassId: 'Class 10A', dueDate: '' });
  };

  const handleAiAssist = async () => {
    if (!newAssignment.subject) return;
    setAiLoading(true);
    const ideas = await generateAssignmentIdeas(newAssignment.subject, "General Topic");
    setAiSuggestion(ideas);
    setAiLoading(false);
  };

  // Grading State
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [gradeData, setGradeData] = useState({ grade: '', feedback: '' });
  const [gradingLoading, setGradingLoading] = useState(false);

  const handleAiFeedback = async (submissionContent: string, assignmentId: string) => {
      const assignment = state.assignments.find(a => a.id === assignmentId);
      if(!assignment) return;
      setGradingLoading(true);
      const feedback = await generateFeedbackHelper(submissionContent, assignment.description);
      setGradeData(prev => ({ ...prev, feedback }));
      setGradingLoading(false);
  }

  const submitGrade = () => {
      if(selectedSubmissionId) {
          dispatch({
              type: 'GRADE_SUBMISSION',
              payload: { id: selectedSubmissionId, ...gradeData }
          });
          setSelectedSubmissionId(null);
          setGradeData({ grade: '', feedback: '' });
      }
  }

  // Marks Entry Handlers
  const handleScoreChange = (studentId: string, scoreStr: string) => {
      if (!selectedSessionId || !selectedSubject) return;
      const score = parseFloat(scoreStr);
      if (isNaN(score)) return;

      const session = state.examSessions.find(s => s.id === selectedSessionId);
      
      dispatch({
          type: 'UPDATE_EXAM_MARKS',
          payload: {
              studentId,
              examSessionId: selectedSessionId,
              sessionName: session?.name || '',
              subject: selectedSubject,
              score
          }
      });
  };

  if (activeTab === 'marks_entry') {
      const openSessions = state.examSessions.filter(s => s.status === 'open');
      const uniqueClasses = Array.from(new Set(state.users.filter(u => u.role === 'student' && u.classId).map(u => u.classId as string)));
      
      const filteredStudents = selectedClassId 
          ? state.users.filter(u => u.role === 'student' && u.classId === selectedClassId)
          : [];

      return (
          <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl border shadow-sm">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <PenTool className="text-galaxy-600" /> Exam Marks Entry
                  </h3>
                  
                  {openSessions.length === 0 ? (
                      <div className="text-center p-8 bg-gray-50 rounded-lg text-gray-500">
                          No exams are currently open for marks entry. Please contact the administrator.
                      </div>
                  ) : (
                      <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                  <label className="block text-sm font-bold text-gray-700 mb-1">Select Exam Session</label>
                                  <select 
                                      className="w-full border p-2 rounded"
                                      value={selectedSessionId}
                                      onChange={e => setSelectedSessionId(e.target.value)}
                                  >
                                      <option value="">-- Choose Exam --</option>
                                      {openSessions.map(s => <option key={s.id} value={s.id}>{s.name} ({s.type})</option>)}
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-gray-700 mb-1">Select Class</label>
                                  <select 
                                      className="w-full border p-2 rounded"
                                      value={selectedClassId}
                                      onChange={e => setSelectedClassId(e.target.value)}
                                  >
                                      <option value="">-- Choose Class --</option>
                                      {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-gray-700 mb-1">Select Subject</label>
                                  <select 
                                      className="w-full border p-2 rounded"
                                      value={selectedSubject}
                                      onChange={e => setSelectedSubject(e.target.value)}
                                  >
                                      <option value="">-- Choose Subject --</option>
                                      {state.currentUser?.subjects?.map(s => <option key={s} value={s}>{s}</option>)}
                                  </select>
                              </div>
                          </div>

                          {selectedSessionId && selectedClassId && selectedSubject ? (
                              <div className="mt-6">
                                  <div className="flex justify-between items-center mb-2">
                                      <h4 className="font-bold text-gray-800">Student List</h4>
                                      <span className="text-sm text-gray-500 italic">Changes are saved automatically</span>
                                  </div>
                                  <div className="border rounded-lg overflow-hidden">
                                      <table className="w-full text-left">
                                          <thead className="bg-gray-50 text-gray-700">
                                              <tr>
                                                  <th className="p-3">Student Name</th>
                                                  <th className="p-3 w-32 text-right">Marks Obtained</th>
                                              </tr>
                                          </thead>
                                          <tbody className="divide-y bg-white">
                                              {filteredStudents.map(student => {
                                                  // Find current score
                                                  const report = state.examReports.find(
                                                      r => r.studentId === student.id && r.examSessionId === selectedSessionId
                                                  );
                                                  const score = report?.scores[selectedSubject] || '';

                                                  return (
                                                      <tr key={student.id}>
                                                          <td className="p-3">{student.name}</td>
                                                          <td className="p-3 text-right">
                                                              <input 
                                                                  type="number" 
                                                                  className="border p-2 rounded w-24 text-right font-mono focus:ring-2 focus:ring-galaxy-500 outline-none"
                                                                  placeholder="0"
                                                                  value={score}
                                                                  onChange={e => handleScoreChange(student.id, e.target.value)}
                                                              />
                                                          </td>
                                                      </tr>
                                                  );
                                              })}
                                          </tbody>
                                      </table>
                                      {filteredStudents.length === 0 && (
                                          <div className="p-4 text-center text-gray-500">No students found in this class.</div>
                                      )}
                                  </div>
                              </div>
                          ) : (
                              <div className="p-8 text-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg text-gray-400">
                                  Please select Exam, Class, and Subject to start entering marks.
                              </div>
                          )}
                      </div>
                  )}
              </div>
          </div>
      );
  }

  if (activeTab === 'assignments') {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-700">Current Assignments</h3>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-galaxy-600 text-white px-4 py-2 rounded-lg hover:bg-galaxy-700 transition"
          >
            + New Assignment
          </button>
        </div>

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between mb-4">
                 <h3 className="text-xl font-bold">Create Assignment</h3>
                 <button onClick={() => setShowCreateModal(false)} className="text-gray-500">Close</button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <form onSubmit={handleCreateAssignment} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Subject</label>
                        <select 
                            value={newAssignment.subject}
                            onChange={e => setNewAssignment({...newAssignment, subject: e.target.value})}
                            className="w-full border rounded-md p-2 mt-1"
                        >
                            {state.currentUser?.subjects?.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Target Class</label>
                        <input 
                            type="text" 
                            value={newAssignment.targetClassId}
                            onChange={e => setNewAssignment({...newAssignment, targetClassId: e.target.value})}
                            className="w-full border rounded-md p-2 mt-1"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Title</label>
                        <input 
                            type="text" 
                            value={newAssignment.title}
                            onChange={e => setNewAssignment({...newAssignment, title: e.target.value})}
                            className="w-full border rounded-md p-2 mt-1"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Due Date</label>
                        <input 
                            type="date" 
                            value={newAssignment.dueDate}
                            onChange={e => setNewAssignment({...newAssignment, dueDate: e.target.value})}
                            className="w-full border rounded-md p-2 mt-1"
                            required
                        />
                    </div>
                    <div>
                        <div className="flex justify-between">
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <button type="button" onClick={handleAiAssist} className="text-xs text-galaxy-600 flex items-center gap-1 hover:underline">
                                <Sparkles size={12} /> Ask AI for Ideas
                            </button>
                        </div>
                        <textarea 
                            value={newAssignment.description}
                            onChange={e => setNewAssignment({...newAssignment, description: e.target.value})}
                            className="w-full border rounded-md p-2 mt-1 h-32"
                            required
                        />
                    </div>
                    <button type="submit" className="w-full bg-galaxy-600 text-white py-2 rounded-lg hover:bg-galaxy-700">
                        Publish Assignment
                    </button>
                  </form>

                  {/* AI Panel */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                     <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Sparkles className="text-gold-500" size={16} /> AI Assistant
                     </h4>
                     {aiLoading ? (
                         <div className="text-sm text-gray-500 animate-pulse">Generating ideas with Gemini...</div>
                     ) : (
                         <div className="text-sm text-gray-600 whitespace-pre-wrap h-64 overflow-y-auto">
                             {aiSuggestion || "Click 'Ask AI for Ideas' to generate assignment topics based on your subject."}
                         </div>
                     )}
                  </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
            {state.assignments.filter(a => a.teacherId === state.currentUser?.id).map(assignment => (
                <div key={assignment.id} className="border p-4 rounded-lg hover:shadow-md transition bg-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="font-bold text-lg text-galaxy-900">{assignment.title}</h4>
                            <p className="text-sm text-gray-500">{assignment.subject} • {assignment.targetClassId}</p>
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Due: {assignment.dueDate}
                        </span>
                    </div>
                    <p className="mt-2 text-gray-700">{assignment.description}</p>
                </div>
            ))}
        </div>
      </div>
    );
  }

  if (activeTab === 'submissions') {
      const myAssignments = state.assignments.filter(a => a.teacherId === state.currentUser?.id).map(a => a.id);
      const relevantSubmissions = state.submissions.filter(s => myAssignments.includes(s.assignmentId));

      return (
          <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-700">Student Submissions</h3>
              <div className="grid grid-cols-1 gap-4">
                  {relevantSubmissions.length === 0 && <p className="text-gray-500">No submissions yet.</p>}
                  {relevantSubmissions.map(sub => {
                      const assignment = state.assignments.find(a => a.id === sub.assignmentId);
                      return (
                        <div key={sub.id} className="border rounded-lg p-4 bg-white shadow-sm">
                            <div className="flex justify-between mb-2">
                                <div>
                                    <span className="font-bold">{sub.studentName}</span>
                                    <span className="text-gray-500 mx-2">submitted for</span>
                                    <span className="font-medium text-galaxy-700">{assignment?.title}</span>
                                </div>
                                <span className="text-xs text-gray-400">{sub.submittedAt}</span>
                            </div>
                            
                            <div className="bg-gray-50 p-3 rounded text-sm text-gray-800 mb-4 border-l-4 border-galaxy-500">
                                {sub.content}
                            </div>

                            {selectedSubmissionId === sub.id ? (
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 animate-in fade-in slide-in-from-top-2">
                                    <div className="flex justify-between items-center mb-2">
                                        <h5 className="font-semibold text-blue-900">Grading</h5>
                                        <button 
                                            onClick={() => handleAiFeedback(sub.content, sub.assignmentId)}
                                            className="text-xs flex items-center gap-1 text-gold-600 font-medium hover:underline"
                                            disabled={gradingLoading}
                                        >
                                            <Sparkles size={12} /> {gradingLoading ? 'Analyzing...' : 'Auto-Generate Feedback'}
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <input 
                                            type="text" 
                                            placeholder="Grade (e.g. A, 90/100)" 
                                            className="border p-2 rounded"
                                            value={gradeData.grade}
                                            onChange={e => setGradeData({...gradeData, grade: e.target.value})}
                                        />
                                        <textarea 
                                            placeholder="Feedback..." 
                                            className="md:col-span-3 border p-2 rounded"
                                            value={gradeData.feedback}
                                            onChange={e => setGradeData({...gradeData, feedback: e.target.value})}
                                        />
                                    </div>
                                    <div className="mt-3 flex gap-2 justify-end">
                                        <button onClick={() => setSelectedSubmissionId(null)} className="px-3 py-1 text-gray-600 hover:bg-gray-200 rounded">Cancel</button>
                                        <button onClick={submitGrade} className="px-3 py-1 bg-galaxy-600 text-white rounded hover:bg-galaxy-700">Save Evaluation</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex justify-between items-center">
                                    {sub.grade ? (
                                        <div className="text-sm">
                                            <span className="font-bold text-green-600">Grade: {sub.grade}</span>
                                            <p className="text-gray-600">"{sub.feedback}"</p>
                                        </div>
                                    ) : (
                                        <div className="text-sm text-amber-600 flex items-center gap-1">
                                            <Clock size={14} /> Pending Evaluation
                                        </div>
                                    )}
                                    <button 
                                        onClick={() => { setSelectedSubmissionId(sub.id); setGradeData({ grade: sub.grade || '', feedback: sub.feedback || ''}); }}
                                        className="text-galaxy-600 hover:underline text-sm font-medium"
                                    >
                                        {sub.grade ? 'Edit Grade' : 'Evaluate'}
                                    </button>
                                </div>
                            )}
                        </div>
                      );
                  })}
              </div>
          </div>
      );
  }

  // Fallback for Notices or Dashboard
  return (
    <div className="p-4 text-center text-gray-500">
      Select a tab to manage your classes.
    </div>
  );
};

export default TeacherView;
