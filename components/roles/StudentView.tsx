import React, { useState } from 'react';
import { useAppStore } from '../../services/store';
import { CheckCircle, AlertCircle, FileText, Send } from 'lucide-react';

interface Props {
  activeTab: string;
}

const StudentView: React.FC<Props> = ({ activeTab }) => {
  const { state, dispatch } = useAppStore();
  const { currentUser } = state;
  const [submissionText, setSubmissionText] = useState('');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);

  const handleSubmit = (assignmentId: string) => {
    if (!submissionText.trim()) return;
    dispatch({
      type: 'ADD_SUBMISSION',
      payload: {
        id: Date.now().toString(),
        assignmentId,
        studentId: currentUser?.id || '',
        studentName: currentUser?.name || '',
        content: submissionText,
        submittedAt: new Date().toISOString().split('T')[0],
      },
    });
    setSubmissionText('');
    setSelectedAssignmentId(null);
  };

  if (activeTab === 'assignments') {
    const myAssignments = state.assignments.filter(a => a.targetClassId === currentUser?.classId);
    
    return (
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-galaxy-900">My Assignments</h3>
        <div className="grid gap-4">
          {myAssignments.map(assign => {
            const mySubmission = state.submissions.find(s => s.assignmentId === assign.id && s.studentId === currentUser?.id);
            const isSubmitting = selectedAssignmentId === assign.id;

            return (
              <div key={assign.id} className="bg-white border rounded-xl p-6 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-lg">{assign.title}</h4>
                    <span className="text-sm bg-gray-100 text-gray-600 px-2 py-0.5 rounded mr-2">{assign.subject}</span>
                    <span className="text-sm text-red-500">Due: {assign.dueDate}</span>
                  </div>
                  {mySubmission ? (
                    <span className="flex items-center text-green-600 text-sm font-medium bg-green-50 px-3 py-1 rounded-full">
                      <CheckCircle size={14} className="mr-1" /> Submitted
                    </span>
                  ) : (
                    <span className="flex items-center text-amber-600 text-sm font-medium bg-amber-50 px-3 py-1 rounded-full">
                      <AlertCircle size={14} className="mr-1" /> Pending
                    </span>
                  )}
                </div>
                
                <p className="text-gray-700 mb-4">{assign.description}</p>

                {mySubmission ? (
                  <div className="bg-gray-50 p-4 rounded border border-gray-100">
                    <p className="text-sm font-semibold text-gray-600 mb-1">Your Submission:</p>
                    <p className="text-gray-800 italic mb-2">"{mySubmission.content}"</p>
                    {mySubmission.grade && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                         <p className="font-bold text-galaxy-800">Teacher's Evaluation:</p>
                         <div className="flex items-center gap-4 mt-1">
                            <span className="text-xl font-bold text-green-600">{mySubmission.grade}</span>
                            <span className="text-gray-600 text-sm">{mySubmission.feedback}</span>
                         </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {isSubmitting ? (
                      <div className="animate-in fade-in slide-in-from-top-2">
                        <textarea
                          className="w-full border p-3 rounded-lg mb-3 focus:ring-2 focus:ring-galaxy-500 outline-none"
                          placeholder="Type your answer here..."
                          rows={4}
                          value={submissionText}
                          onChange={(e) => setSubmissionText(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleSubmit(assign.id)}
                            className="bg-galaxy-600 text-white px-4 py-2 rounded-lg hover:bg-galaxy-700 flex items-center gap-2"
                          >
                            <Send size={16} /> Submit Assignment
                          </button>
                          <button 
                            onClick={() => setSelectedAssignmentId(null)}
                            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setSelectedAssignmentId(assign.id)}
                        className="bg-galaxy-600 text-white px-4 py-2 rounded-lg hover:bg-galaxy-700 transition"
                      >
                        Start Assignment
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (activeTab === 'reports') {
      const myReports = state.examReports.filter(r => r.studentId === currentUser?.id && r.published);

      return (
          <div>
              <h3 className="text-xl font-bold text-galaxy-900 mb-6">Examination Reports</h3>
              {myReports.length === 0 ? (
                  <p className="text-gray-500">No published reports available.</p>
              ) : (
                  <div className="grid gap-6">
                      {myReports.map(report => (
                          <div key={report.id} className="border-2 border-galaxy-100 rounded-xl overflow-hidden shadow-sm">
                              <div className="bg-galaxy-50 p-4 border-b border-galaxy-100 flex justify-between items-center">
                                  <h4 className="font-bold text-lg text-galaxy-800">{report.term} Report</h4>
                                  <span className="text-xs font-mono text-gray-500">ID: {report.id}</span>
                              </div>
                              <div className="p-6 bg-white">
                                  <table className="w-full mb-4">
                                      <thead>
                                          <tr className="border-b text-left text-sm text-gray-500">
                                              <th className="py-2">Subject</th>
                                              <th className="py-2 text-right">Score</th>
                                          </tr>
                                      </thead>
                                      <tbody>
                                          {Object.entries(report.scores).map(([subj, score]) => (
                                              <tr key={subj} className="border-b last:border-0">
                                                  <td className="py-3 text-gray-800 font-medium">{subj}</td>
                                                  <td className="py-3 text-right text-gray-900 font-bold">{score}</td>
                                              </tr>
                                          ))}
                                      </tbody>
                                  </table>
                                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-sm text-yellow-800">
                                      <strong>Remarks:</strong> {report.remarks}
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      );
  }

  if (activeTab === 'fees') {
      const myFees = state.fees.filter(f => f.studentId === currentUser?.id);
      return (
          <div>
              <h3 className="text-xl font-bold text-galaxy-900 mb-6">Fee History</h3>
              <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                      <thead>
                          <tr className="bg-gray-100 text-gray-600 text-sm uppercase tracking-wider">
                              <th className="p-4 rounded-tl-lg">Date</th>
                              <th className="p-4">Receipt #</th>
                              <th className="p-4">Description</th>
                              <th className="p-4 text-right">Amount</th>
                              <th className="p-4 rounded-tr-lg text-center">Status</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                          {myFees.map(fee => (
                              <tr key={fee.id} className="hover:bg-gray-50">
                                  <td className="p-4 text-gray-600">{fee.date}</td>
                                  <td className="p-4 font-mono text-sm">{fee.receiptNumber}</td>
                                  <td className="p-4 font-medium text-gray-800">{fee.description}</td>
                                  <td className="p-4 text-right font-bold">Rs. {fee.amount.toLocaleString()}</td>
                                  <td className="p-4 text-center">
                                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase">
                                          {fee.status === 'paid' ? 'Paid' : fee.status}
                                      </span>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )
  }

  if (activeTab === 'notices') {
    return (
        <div className="space-y-4">
             <h3 className="text-xl font-bold text-galaxy-900 mb-6">School Notices</h3>
             {state.notices.filter(n => n.audience === 'all' || n.audience === 'students').map(notice => (
                 <div key={notice.id} className="bg-yellow-50 border-l-4 border-gold-400 p-4 rounded shadow-sm">
                     <div className="flex justify-between items-center mb-2">
                         <h4 className="font-bold text-gold-600 text-lg">{notice.title}</h4>
                         <span className="text-xs text-gray-500">{notice.date}</span>
                     </div>
                     <p className="text-gray-800 whitespace-pre-line">{notice.content}</p>
                     <p className="text-xs text-gray-500 mt-2 text-right">- {notice.postedBy}</p>
                 </div>
             ))}
        </div>
    )
  }

  // Dashboard Overview for Student
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-galaxy-500 to-galaxy-700 text-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-medium opacity-90">Pending Assignments</h3>
            <p className="text-4xl font-bold mt-2">
                {state.assignments.filter(a => a.targetClassId === currentUser?.classId && !state.submissions.find(s => s.assignmentId === a.id)).length}
            </p>
        </div>
        <div className="bg-white border rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-medium text-gray-600">Average Grade</h3>
            <p className="text-4xl font-bold mt-2 text-galaxy-900">A-</p>
            <p className="text-xs text-gray-400 mt-1">Based on recent submissions</p>
        </div>
        <div className="bg-white border rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-medium text-gray-600">Attendance</h3>
            <p className="text-4xl font-bold mt-2 text-green-600">92%</p>
        </div>
    </div>
  );
};

export default StudentView;