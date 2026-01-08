

import React, { useState } from 'react';
import { useAppStore } from '../../services/store';
import { CheckCircle, AlertCircle, FileText, Send, Crown, Bell } from 'lucide-react';
import { ScoreData } from '../../types';

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
      // Robust check for published status: checks strictly boolean true OR string "true"
      const myReports = state.examReports.filter(r => 
        r.studentId === currentUser?.id && 
        (r.published === true || String(r.published) === 'true')
      );

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
                                              <th className="py-2 text-center">Full Marks</th>
                                              <th className="py-2 text-center">Pass Marks</th>
                                              <th className="py-2 text-right">Obtained</th>
                                          </tr>
                                      </thead>
                                      <tbody>
                                          {Object.entries(report.scores).map(([subj, data]) => {
                                              const score = data as ScoreData;
                                              return (
                                                <tr key={subj} className="border-b last:border-0">
                                                    <td className="py-3 text-gray-800 font-medium">{subj}</td>
                                                    <td className="py-3 text-center text-gray-500">{score.fullMarks}</td>
                                                    <td className="py-3 text-center text-gray-500">{score.passMarks}</td>
                                                    <td className={`py-3 text-right font-bold ${score.obtained < score.passMarks ? 'text-red-600' : 'text-gray-900'}`}>
                                                        {score.obtained}
                                                    </td>
                                                </tr>
                                              );
                                          })}
                                      </tbody>
                                  </table>
                                  {report.remarks && (
                                    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-sm text-yellow-800">
                                        <strong>Remarks:</strong> {report.remarks}
                                    </div>
                                  )}
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      );
  }

  // Aggregate Ledger (Leaderboard/Summary)
  if (activeTab === 'ledger') {
      // Find all published reports for my class's sessions
      // Filter sessions that have at least one report for me
      const mySessions = state.examReports
          .filter(r => r.studentId === currentUser?.id && (r.published === true || String(r.published) === 'true'))
          .map(r => r.term);
      const uniqueSessions = [...new Set(mySessions)];

      return (
          <div className="space-y-8">
              <h3 className="text-xl font-bold text-galaxy-900">Class Aggregate Ledger</h3>
              
              {uniqueSessions.map(sessionName => {
                  // Get reports for all students in my class for this session
                  const classReports = state.examReports.filter(r => 
                      r.term === sessionName && 
                      (r.published === true || String(r.published) === 'true') && 
                      state.users.find(u => u.id === r.studentId)?.classId === currentUser?.classId
                  );

                  // Calculate totals
                  const leaderboard = classReports.map(r => {
                      const scores = Object.values(r.scores) as ScoreData[];
                      const totalObtained = scores.reduce((acc: number, curr: ScoreData) => acc + (curr.obtained || 0), 0);
                      const totalFull = scores.reduce((acc: number, curr: ScoreData) => acc + (curr.fullMarks || 0), 0);
                      
                      return {
                          studentId: r.studentId,
                          studentName: state.users.find(u => u.id === r.studentId)?.name,
                          totalObtained,
                          totalFull,
                          percentage: totalFull > 0 ? (totalObtained / totalFull) * 100 : 0
                      };
                  }).sort((a, b) => b.percentage - a.percentage);

                  return (
                      <div key={sessionName} className="bg-white border rounded-xl overflow-hidden shadow-sm">
                          <div className="bg-galaxy-900 text-white p-4">
                              <h4 className="font-bold">{sessionName} - Class Performance</h4>
                          </div>
                          <table className="w-full text-left">
                              <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-bold">
                                  <tr>
                                      <th className="p-3">Rank</th>
                                      <th className="p-3">Student Name</th>
                                      <th className="p-3 text-right">Total Obtained</th>
                                      <th className="p-3 text-right">Percentage</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y">
                                  {leaderboard.map((item, idx) => (
                                      <tr key={item.studentId} className={item.studentId === currentUser?.id ? 'bg-yellow-50' : ''}>
                                          <td className="p-3 font-mono text-gray-500">
                                              {idx === 0 ? <Crown size={16} className="text-gold-500 inline mr-1" /> : `#${idx + 1}`}
                                          </td>
                                          <td className="p-3 font-medium">
                                              {item.studentName} {item.studentId === currentUser?.id && '(You)'}
                                          </td>
                                          <td className="p-3 text-right font-mono">{item.totalObtained} / {item.totalFull}</td>
                                          <td className="p-3 text-right font-bold">{item.percentage.toFixed(2)}%</td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  )
              })}
              
              {uniqueSessions.length === 0 && (
                  <p className="text-gray-500">No published class results available yet.</p>
              )}
          </div>
      )
  }

  if (activeTab === 'fees') {
      const myFees = state.fees
        .filter(f => f.studentId === currentUser?.id)
        .sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            if (dateB !== dateA) return dateB - dateA;
            return b.receiptNumber - a.receiptNumber;
        });

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
      const relevantNotices = state.notices.filter(n => n.audience === 'all' || n.audience === 'students');
      
      return (
          <div className="space-y-6">
               <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                   <Bell className="text-galaxy-600" /> School Notices
               </h3>
               {relevantNotices.length === 0 ? (
                   <div className="p-8 text-center text-gray-500 bg-white rounded-lg border">No new notices.</div>
               ) : (
                   relevantNotices.map(n => (
                      <div key={n.id} className="bg-white border-l-4 border-galaxy-500 p-6 rounded-r-lg shadow-sm">
                          <div className="flex justify-between items-start">
                              <h4 className="font-bold text-lg text-galaxy-900">{n.title}</h4>
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{n.date}</span>
                          </div>
                          <p className="mt-3 text-gray-700 leading-relaxed">{n.content}</p>
                          <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                              <span className="font-medium">Posted By:</span> {n.postedBy}
                          </div>
                      </div>
                  ))
               )}
          </div>
      )
  }

  // Pending Fees Calculation
  const annualFee = currentUser?.annualFee || 0;
  const discount = currentUser?.discount || 0;
  const totalPaid = currentUser?.totalPaid || 0;
  const pendingFees = Math.max(0, (annualFee - discount) - totalPaid);

  // Dashboard Overview
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-galaxy-500 to-galaxy-700 text-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-medium opacity-90">Pending Assignments</h3>
            <p className="text-4xl font-bold mt-2">
                {state.assignments.filter(a => a.targetClassId === currentUser?.classId && !state.submissions.find(s => s.assignmentId === a.id)).length}
            </p>
        </div>
        <div className="bg-white border rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-medium text-gray-600">Pending Fees</h3>
            <p className="text-4xl font-bold mt-2 text-red-600">Rs. {pendingFees.toLocaleString()}</p>
        </div>
        {/* Attendance Card Removed per request */}
    </div>
  );
};

export default StudentView;
