
import React, { useState } from 'react';
import { useAppStore } from '../../services/store';
import { Assignment } from '../../types';
import { generateAssignmentIdeas, generateFeedbackHelper } from '../../services/geminiService';
import { Sparkles, Send, CheckCircle, Clock, PenTool, Save, Download, Bell, MessageSquare, GraduationCap, X } from 'lucide-react';

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
    targetClassId: '12',
    dueDate: '',
  });

  // Grading View State
  const [gradingAssignmentId, setGradingAssignmentId] = useState('');

  // Marks Entry State
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  
  // Marks Config defaults
  const [fullMarks, setFullMarks] = useState(100);
  const [passMarks, setPassMarks] = useState(40);

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
              scoreData: {
                  obtained: score,
                  fullMarks,
                  passMarks
              }
          }
      });
  };

  const exportToCSV = (filteredStudents: any[]) => {
      if (filteredStudents.length === 0) return;
      
      const csvRows = [
          ['Student Name', 'Section', 'Subject', 'Full Marks', 'Pass Marks', 'Obtained Marks']
      ];

      filteredStudents.forEach(student => {
          const report = state.examReports.find(r => r.studentId === student.id && r.examSessionId === selectedSessionId);
          const data = report?.scores[selectedSubject];
          csvRows.push([
              student.name,
              student.section || '-',
              selectedSubject,
              data?.fullMarks?.toString() || fullMarks.toString(),
              data?.passMarks?.toString() || passMarks.toString(),
              data?.obtained?.toString() || '0'
          ]);
      });

      const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${selectedSubject}_Marks_${selectedClassId}.csv`);
      document.body.appendChild(link);
      link.click();
  }

  const selectedClassData = state.systemClasses.find(c => c.name === selectedClassId);

  if (activeTab === 'marks_entry') {
      const openSessions = state.examSessions.filter(s => s.status === 'open');
      const uniqueClasses = state.systemClasses.map(c => c.name);
      
      const filteredStudents = selectedClassId 
          ? state.users.filter(u => {
              const isStudent = u.role === 'student';
              const matchesClass = u.classId === selectedClassId;
              const matchesSection = !selectedSection || u.section === selectedSection;
              return isStudent && matchesClass && matchesSection;
          })
          : [];

      return (
          <div className="space-y-1 md:space-y-6">
              <div className="bg-white p-0 md:p-6 rounded-xl border-0 md:border shadow-none md:shadow-sm">
                  <h3 className="text-sm md:text-xl font-bold mb-2 md:mb-4 flex items-center gap-2 px-2 md:px-0">
                      <PenTool className="text-galaxy-600 w-4 h-4 md:w-6 md:h-6" /> Exam Marks Entry
                  </h3>
                  
                  {openSessions.length === 0 ? (
                      <div className="text-center p-8 bg-gray-50 rounded-lg text-gray-500">
                          No exams currently open.
                      </div>
                  ) : (
                      <div className="space-y-2 md:space-y-6">
                          {/* Filters - Tightened for Mobile */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-1 md:gap-4 px-2 md:px-0">
                              <div className="col-span-2 md:col-span-1">
                                  <label className="block text-[8px] md:text-sm font-bold text-gray-400 md:text-gray-700 mb-0.5 uppercase tracking-tighter md:normal-case">Exam Session</label>
                                  <select 
                                      className="w-full border p-1 rounded text-xs bg-white h-8"
                                      value={selectedSessionId}
                                      onChange={e => setSelectedSessionId(e.target.value)}
                                  >
                                      <option value="">-- Choose Exam --</option>
                                      {openSessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-[8px] md:text-sm font-bold text-gray-400 md:text-gray-700 mb-0.5 uppercase tracking-tighter md:normal-case">Class</label>
                                  <select 
                                      className="w-full border p-1 rounded text-xs bg-white h-8"
                                      value={selectedClassId}
                                      onChange={e => { setSelectedClassId(e.target.value); setSelectedSection(''); }}
                                  >
                                      <option value="">-- Class --</option>
                                      {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-[8px] md:text-sm font-bold text-gray-400 md:text-gray-700 mb-0.5 uppercase tracking-tighter md:normal-case">Section</label>
                                  <select 
                                      className="w-full border p-1 rounded text-xs bg-white h-8"
                                      value={selectedSection}
                                      onChange={e => setSelectedSection(e.target.value)}
                                      disabled={!selectedClassData || selectedClassData.sections.length === 0}
                                  >
                                      <option value="">All</option>
                                      {selectedClassData?.sections.map(s => <option key={s} value={s}>{s}</option>)}
                                  </select>
                              </div>
                              <div className="col-span-2 md:col-span-1">
                                  <label className="block text-[8px] md:text-sm font-bold text-gray-400 md:text-gray-700 mb-0.5 uppercase tracking-tighter md:normal-case">Subject</label>
                                  <select 
                                      className="w-full border p-1 rounded text-xs bg-white h-8"
                                      value={selectedSubject}
                                      onChange={e => setSelectedSubject(e.target.value)}
                                  >
                                      <option value="">-- Subject --</option>
                                      {state.currentUser?.subjects?.map(s => <option key={s} value={s}>{s}</option>)}
                                  </select>
                              </div>
                          </div>

                          {selectedSessionId && selectedClassId && selectedSubject && (
                              <div className="flex flex-row md:flex-row gap-1 md:gap-4 p-1 md:p-4 bg-gray-50 border-y md:border md:rounded-lg items-end">
                                  <div className="flex-1 px-1">
                                      <label className="block text-[8px] md:text-xs font-bold text-gray-400 uppercase">Full Marks</label>
                                      <input type="number" value={fullMarks} onChange={e => setFullMarks(Number(e.target.value))} className="border p-1 rounded w-full md:w-24 text-xs h-7" />
                                  </div>
                                  <div className="flex-1 px-1">
                                      <label className="block text-[8px] md:text-xs font-bold text-gray-400 uppercase">Pass Marks</label>
                                      <input type="number" value={passMarks} onChange={e => setPassMarks(Number(e.target.value))} className="border p-1 rounded w-full md:w-24 text-xs h-7" />
                                  </div>
                                  <div className="hidden md:block flex-1 text-right">
                                      <button 
                                        onClick={() => exportToCSV(filteredStudents)}
                                        className="bg-green-600 text-white px-3 py-1.5 rounded flex items-center justify-center gap-2 hover:bg-green-700 transition"
                                      >
                                          <Download size={14} /> Export CSV
                                      </button>
                                  </div>
                              </div>
                          )}

                          {selectedSessionId && selectedClassId && selectedSubject ? (
                              <div className="mt-1 md:mt-6 overflow-hidden">
                                  <div className="border-0 md:border rounded-lg overflow-hidden">
                                      <table className="w-full text-left">
                                          <thead className="bg-gray-100 text-gray-600 border-b">
                                              <tr>
                                                  <th className="p-2 md:p-3 text-[10px] md:text-sm font-bold uppercase tracking-wider">Student Name</th>
                                                  <th className="p-2 md:p-3 text-[10px] md:text-sm font-bold uppercase tracking-wider hidden md:table-cell">Section</th>
                                                  <th className="p-2 md:p-3 w-16 md:w-32 text-right text-[10px] md:text-sm font-bold uppercase tracking-wider">Marks</th>
                                              </tr>
                                          </thead>
                                          <tbody className="divide-y bg-white">
                                              {filteredStudents.map(student => {
                                                  const report = state.examReports.find(
                                                      r => r.studentId === student.id && r.examSessionId === selectedSessionId
                                                  );
                                                  const scoreData = report?.scores[selectedSubject];
                                                  const score = scoreData ? scoreData.obtained : '';

                                                  return (
                                                      <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                                          <td className="p-2 md:p-3">
                                                              <div className="font-semibold text-gray-900 text-xs md:text-base leading-tight">
                                                                {student.name}
                                                              </div>
                                                              <div className="text-[9px] text-gray-400 md:hidden flex items-center gap-1">
                                                                  <span className="bg-gray-50 border px-0.5 rounded text-[8px] font-bold uppercase">{student.section || '-'}</span>
                                                                  <span>• {student.classId}</span>
                                                              </div>
                                                          </td>
                                                          <td className="p-2 md:p-3 text-sm text-gray-500 hidden md:table-cell">{student.section || '-'}</td>
                                                          <td className="p-2 md:p-3 text-right">
                                                              <input 
                                                                  type="number" 
                                                                  className="border p-1 rounded w-14 md:w-24 text-right font-mono text-xs md:text-sm focus:ring-1 focus:ring-galaxy-500 outline-none border-gray-300 shadow-inner h-8 md:h-10"
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
                                          <div className="p-6 text-center text-gray-400 text-xs">No students found.</div>
                                      )}
                                  </div>
                              </div>
                          ) : (
                              <div className="p-6 text-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 mx-2 md:mx-0">
                                  <p className="text-xs">Select all filters above to enter marks.</p>
                              </div>
                          )}
                      </div>
                  )}
              </div>
          </div>
      );
  }

  // Submissions & Grading Tab
  if (activeTab === 'submissions') {
      const myAssignments = state.assignments.filter(a => a.teacherId === state.currentUser?.id);
      const submissionsForSelected = state.submissions.filter(s => s.assignmentId === gradingAssignmentId);

      return (
          <div className="space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                  <GraduationCap className="text-galaxy-600" /> Submissions & Grading
              </h3>
              
              {/* Assignment Selector */}
              <div className="bg-white p-4 rounded-xl border shadow-sm">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Select Assignment to Grade</label>
                  <select 
                      className="w-full border p-2 rounded-lg"
                      value={gradingAssignmentId}
                      onChange={e => setGradingAssignmentId(e.target.value)}
                  >
                      <option value="">-- Choose Assignment --</option>
                      {myAssignments.map(a => (
                          <option key={a.id} value={a.id}>
                              {a.title} ({a.targetClassId}) - Due: {a.dueDate}
                          </option>
                      ))}
                  </select>
              </div>

              {gradingAssignmentId ? (
                  <div className="space-y-4">
                      {submissionsForSelected.length === 0 ? (
                          <div className="p-8 text-center bg-gray-50 border-2 border-dashed rounded-lg text-gray-500">
                              No submissions received for this assignment yet.
                          </div>
                      ) : (
                          submissionsForSelected.map(submission => {
                              const isEditing = selectedSubmissionId === submission.id;
                              
                              return (
                                  <div key={submission.id} className="bg-white border rounded-xl overflow-hidden shadow-sm">
                                      <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                                          <div>
                                              <p className="font-bold text-lg text-gray-800">{submission.studentName}</p>
                                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                                  <Clock size={12}/> Submitted: {submission.submittedAt}
                                              </p>
                                          </div>
                                          {!isEditing && (
                                              <div className="flex items-center gap-3">
                                                  {submission.grade ? (
                                                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold border border-green-200">
                                                          Grade: {submission.grade}
                                                      </span>
                                                  ) : (
                                                      <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-bold border border-amber-200">
                                                          Pending
                                                      </span>
                                                  )}
                                                  <button 
                                                      onClick={() => {
                                                          setSelectedSubmissionId(submission.id);
                                                          setGradeData({ grade: submission.grade || '', feedback: submission.feedback || '' });
                                                      }}
                                                      className="text-galaxy-600 hover:underline text-sm font-medium"
                                                  >
                                                      {submission.grade ? 'Edit Grade' : 'Grade Now'}
                                                  </button>
                                              </div>
                                          )}
                                      </div>
                                      
                                      <div className="p-6">
                                          <div className="mb-4">
                                              <h5 className="text-xs font-bold text-gray-400 uppercase mb-1">Student Answer</h5>
                                              <p className="text-gray-800 bg-gray-50 p-4 rounded-lg border border-gray-100 whitespace-pre-wrap">
                                                  {submission.content}
                                              </p>
                                          </div>

                                          {isEditing ? (
                                              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 animate-in fade-in">
                                                  <h5 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                                                      <PenTool size={16}/> Grading Console
                                                  </h5>
                                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                      <div>
                                                          <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Grade / Score</label>
                                                          <input 
                                                              type="text" 
                                                              className="w-full border p-2 rounded bg-white"
                                                              placeholder="e.g. A, 85/100"
                                                              value={gradeData.grade}
                                                              onChange={e => setGradeData({...gradeData, grade: e.target.value})}
                                                          />
                                                      </div>
                                                      <div className="md:col-span-2">
                                                           <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Feedback</label>
                                                           <div className="relative">
                                                               <textarea 
                                                                  className="w-full border p-2 rounded bg-white h-24"
                                                                  placeholder="Enter constructive feedback..."
                                                                  value={gradeData.feedback}
                                                                  onChange={e => setGradeData({...gradeData, feedback: e.target.value})}
                                                               />
                                                               <button 
                                                                  onClick={() => handleAiFeedback(submission.content, gradingAssignmentId)}
                                                                  disabled={gradingLoading}
                                                                  className="absolute bottom-2 right-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 flex items-center gap-1 border border-purple-200"
                                                               >
                                                                   <Sparkles size={12} /> {gradingLoading ? 'Generating...' : 'Auto-Generate'}
                                                               </button>
                                                           </div>
                                                      </div>
                                                  </div>
                                                  <div className="flex gap-2 justify-end">
                                                      <button 
                                                          onClick={() => setSelectedSubmissionId(null)}
                                                          className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded"
                                                      >
                                                          Cancel
                                                      </button>
                                                      <button 
                                                          onClick={submitGrade}
                                                          className="px-4 py-2 bg-galaxy-600 text-white rounded hover:bg-galaxy-700 flex items-center gap-2"
                                                      >
                                                          <Save size={16} /> Save Grading
                                                      </button>
                                                  </div>
                                              </div>
                                          ) : (
                                              submission.feedback && (
                                                  <div className="mt-4 border-t pt-4">
                                                      <h5 className="text-xs font-bold text-gray-400 uppercase mb-1">Teacher Feedback</h5>
                                                      <p className="text-gray-700 italic flex items-start gap-2">
                                                          <MessageSquare size={16} className="text-gray-400 mt-1 shrink-0" />
                                                          "{submission.feedback}"
                                                      </p>
                                                  </div>
                                              )
                                          )}
                                      </div>
                                  </div>
                              );
                          })
                      )}
                  </div>
              ) : (
                  <div className="flex flex-col items-center justify-center h-64 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl">
                      <div className="p-4 bg-white rounded-full shadow-sm mb-4 text-gray-400">
                          <GraduationCap size={32} />
                      </div>
                      <p className="text-gray-500 font-medium">Please select an assignment above to view submissions.</p>
                  </div>
              )}
          </div>
      );
  }

  // Fallback for assignments/notices (Existing Code)
  if (activeTab === 'assignments') {
    return (
      <div className="px-2">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-700">Assignments</h3>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-galaxy-600 text-white px-4 py-2 rounded-lg hover:bg-galaxy-700 transition text-sm"
          >
            + New
          </button>
        </div>

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-full max-w-2xl mx-4">
              <div className="flex justify-between mb-4">
                 <h3 className="text-xl font-bold">Create Assignment</h3>
                 <button onClick={() => setShowCreateModal(false)} className="text-gray-500"><X /></button>
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
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea 
                            value={newAssignment.description}
                            onChange={e => setNewAssignment({...newAssignment, description: e.target.value})}
                            className="w-full border rounded-md p-2 mt-1 h-32"
                            required
                        />
                         <div className="mt-2 flex justify-end">
                            <button 
                                type="button"
                                onClick={handleAiAssist}
                                disabled={aiLoading || !newAssignment.subject}
                                className="text-xs flex items-center gap-1 text-purple-600 hover:text-purple-800 disabled:opacity-50"
                            >
                                <Sparkles size={14} /> {aiLoading ? 'Thinking...' : 'Get AI Ideas'}
                            </button>
                        </div>
                    </div>
                    {aiSuggestion && (
                         <div className="col-span-2 bg-purple-50 p-3 rounded border border-purple-100 text-sm text-purple-800 whitespace-pre-wrap">
                             {aiSuggestion}
                             <button type="button" onClick={() => setAiSuggestion('')} className="block mt-2 text-xs underline">Clear</button>
                         </div>
                    )}
                    <div className="col-span-2">
                         <label className="block text-sm font-medium text-gray-700">Due Date</label>
                         <input 
                            type="date"
                            value={newAssignment.dueDate}
                            onChange={e => setNewAssignment({...newAssignment, dueDate: e.target.value})}
                            className="w-full border rounded-md p-2 mt-1"
                            required
                         />
                    </div>
                    <button type="submit" className="col-span-2 w-full bg-galaxy-600 text-white py-2 rounded-lg hover:bg-galaxy-700 transition font-bold">Publish Assignment</button>
                  </form>
              </div>
            </div>
          </div>
        )}
        <div className="space-y-4">
            {state.assignments.filter(a => a.teacherId === state.currentUser?.id).length === 0 ? (
                <div className="text-center p-8 text-gray-500 bg-gray-50 border rounded-lg border-dashed">No assignments yet.</div>
            ) : (
                state.assignments.filter(a => a.teacherId === state.currentUser?.id).map(assignment => (
                    <div key={assignment.id} className="border p-4 rounded-lg bg-white shadow-sm flex justify-between items-center hover:border-galaxy-200 transition">
                        <div>
                            <h4 className="font-bold text-lg text-galaxy-900">{assignment.title}</h4>
                            <p className="text-sm text-gray-600">Class {assignment.targetClassId} • {assignment.subject}</p>
                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium"><Clock size={12}/> Due: {assignment.dueDate}</p>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] text-gray-400 block mb-1 uppercase tracking-wider">Posted {assignment.createdAt}</span>
                            <div className="text-xs bg-galaxy-50 text-galaxy-700 border border-galaxy-100 px-3 py-1 rounded-full font-bold">
                                {state.submissions.filter(s => s.assignmentId === assignment.id).length} Submissions
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>
    );
  }

  if (activeTab === 'notices') {
    const relevantNotices = state.notices.filter(n => n.audience === 'all' || n.audience === 'teachers');
    
    return (
        <div className="space-y-4 px-2">
             <h3 className="font-bold text-xl mb-2 flex items-center gap-2">
                 <Bell className="text-galaxy-600" /> Staff Notices
             </h3>
             {relevantNotices.length === 0 ? (
                 <div className="p-8 text-center text-gray-500 bg-white rounded-lg border">No new notices.</div>
             ) : (
                 relevantNotices.map(n => (
                    <div key={n.id} className="bg-white border-l-4 border-purple-500 p-4 rounded-r-lg shadow-sm">
                        <div className="flex justify-between items-start">
                            <h4 className="font-bold text-base text-galaxy-900">{n.title}</h4>
                            <span className="text-[10px] text-gray-400 bg-gray-50 px-1 rounded">{n.date}</span>
                        </div>
                        <p className="mt-2 text-sm text-gray-700 leading-relaxed">{n.content}</p>
                        <div className="mt-2 flex items-center gap-2 text-[10px] text-gray-400 border-t pt-2">
                            <span className="font-medium">Posted By:</span> {n.postedBy}
                        </div>
                    </div>
                ))
             )}
        </div>
    )
  }

  return <div className="p-4 text-center text-gray-500">Select a tab.</div>;
};

export default TeacherView;
