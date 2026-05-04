
import React, { useState } from 'react';
import { useAppStore } from '../../services/store';
import { CheckCircle, AlertCircle, FileText, Send, Crown, Bell } from 'lucide-react';
import { ScoreData, getApplicableSubjects } from '../../types';

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
    const myAssignments = state.assignments.filter(a => 
      a.targetClassId === currentUser?.classId
    );
    
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

  // Utility to get stats for a student in a specific session (by ID or term name)
  const getStudentStats = (studentId: string, sessionIdentifier?: string) => {
    if (!sessionIdentifier) return { totalObtained: 0, totalFull: 0, pass: false, percentage: 0 };
    const student = state.users.find(u => u.id === studentId);
    if (!student || !student.classId) return { totalObtained: 0, totalFull: 0, pass: false, percentage: 0 };
    
    // sessionIdentifier can be examSessionId or term (name)
    const report = state.examReports.find(r => r.studentId === studentId && (r.examSessionId === sessionIdentifier || r.term === sessionIdentifier));
    if (!report) return { totalObtained: 0, totalFull: 0, pass: false, percentage: 0 };

    const applicableSubjects = getApplicableSubjects(state.availableSubjects, student.classId, student.section);
    let totalObtained = 0;
    let totalFull = 0;
    let pass = true;

    applicableSubjects.forEach(s => {
        const effectiveType = s.classTypes?.[student.classId!] || s.type;
        const scoreData = report.scores[s.name];

        if (effectiveType === 'Theory' || effectiveType === 'Both') {
            const f = scoreData?.fullMarks ?? 100;
            const p = scoreData?.passMarks ?? 40;
            const o = scoreData?.obtained ?? 0;
            if (f > 0) {
                totalObtained += o;
                totalFull += f;
                if (o < p) pass = false;
            }
        }
        if (effectiveType === 'Practical' || effectiveType === 'Both') {
            const f = scoreData?.practicalFullMarks ?? 50;
            const p = scoreData?.practicalPassMarks ?? 20;
            const o = scoreData?.practicalObtained ?? 0;
            if (f > 0) {
                totalObtained += o;
                totalFull += f;
                if (o < p) pass = false;
            }
        }
    });

    return { totalObtained, totalFull, pass, percentage: totalFull > 0 ? (totalObtained / totalFull) * 100 : 0 };
  };

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
                      {myReports.map(report => {
                          const applicableSubjects = getApplicableSubjects(state.availableSubjects, currentUser!.classId!, currentUser!.section);
                          const myStats = getStudentStats(currentUser!.id, report.examSessionId);
                          
                          // Calculate Rank and Highest in Section
                          const classReports = state.examReports.filter(r => r.examSessionId === report.examSessionId && r.published);
                          const sectionStudents = state.users.filter(u => u.role === 'student' && u.classId === currentUser!.classId && u.section === currentUser!.section && u.status === 'active');
                          const classStudents = state.users.filter(u => u.role === 'student' && u.classId === currentUser!.classId && u.status === 'active');

                          const classLeaderboard = classStudents.map(su => ({
                              studentId: su.id,
                              ...getStudentStats(su.id, report.examSessionId)
                          })).sort((a, b) => b.percentage - a.percentage);

                          const myRank = classLeaderboard.findIndex(l => l.studentId === currentUser!.id) + 1;
                          
                          const sectionLeaderboard = sectionStudents.map(su => ({
                              studentId: su.id,
                              ...getStudentStats(su.id, report.examSessionId)
                          })).sort((a, b) => b.totalObtained - a.totalObtained);

                          const mySectionRank = sectionLeaderboard.findIndex(l => l.studentId === currentUser!.id) + 1;
                          
                          const highestInSection = sectionLeaderboard.length > 0 ? sectionLeaderboard[0].totalObtained : 0;

                          return (
                          <div key={report.id} className="border-2 border-galaxy-100 rounded-xl overflow-hidden shadow-sm">
                              <div className="bg-galaxy-50 p-4 border-b border-galaxy-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                  <div>
                                      <h4 className="font-bold text-lg text-galaxy-800">{report.term} Report</h4>
                                      <div className="text-sm font-medium text-gray-600 mt-1">
                                          Class: {currentUser?.classId} {currentUser?.section ? `| Section: ${currentUser?.section}` : ''}
                                      </div>
                                  </div>
                                  <div className="text-xs font-mono text-gray-500 bg-white px-2 py-1 rounded shadow-sm border border-gray-100">ID: {report.id}</div>
                              </div>
                              <div className="p-6 bg-white">
                                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                                      <div>
                                          <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Total Marks</div>
                                          <div className="text-lg font-mono font-bold text-galaxy-900">{myStats.totalObtained} / {myStats.totalFull}</div>
                                      </div>
                                      <div>
                                          <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Percentage</div>
                                          <div className="text-lg font-mono font-bold text-galaxy-900">{myStats.percentage.toFixed(2)}%</div>
                                      </div>
                                      <div>
                                          <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Class Rank</div>
                                          <div className="text-lg font-mono font-bold text-galaxy-900">{myRank > 0 ? `#${myRank}` : 'N/A'}</div>
                                      </div>
                                      <div>
                                          <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Section Rank</div>
                                          <div className="text-lg font-mono font-bold text-galaxy-900">{mySectionRank > 0 ? `#${mySectionRank}` : 'N/A'}</div>
                                      </div>
                                      <div>
                                          <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Highest in Section</div>
                                          <div className="text-lg font-mono font-bold text-galaxy-900">{highestInSection}</div>
                                      </div>
                                  </div>
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
                                          {applicableSubjects.map(s => {
                                              const data = report.scores[s.name];
                                              if (!data) return null;
                                              const score = data as ScoreData;
                                              const effectiveType = s.classTypes?.[currentUser!.classId!] || s.type;
                                              
                                              return (
                                                <React.Fragment key={s.name}>
                                                    {(effectiveType === 'Theory' || effectiveType === 'Both') && (score.fullMarks ?? 100) > 0 && (
                                                      <tr className="border-b last:border-0">
                                                          <td className="py-3 text-gray-800 font-medium">{s.name} {effectiveType === 'Both' ? '(Theory)' : ''}</td>
                                                          <td className="py-3 text-center text-gray-500">{score.fullMarks ?? 100}</td>
                                                          <td className="py-3 text-center text-gray-500">{score.passMarks ?? 40}</td>
                                                          <td className={`py-3 text-right font-bold ${score.obtained < (score.passMarks ?? 40) ? 'text-red-600' : 'text-gray-900'}`}>
                                                              {score.obtained ?? 0}
                                                          </td>
                                                      </tr>
                                                    )}
                                                    {(effectiveType === 'Practical' || effectiveType === 'Both') && (score.practicalFullMarks ?? 50) > 0 && (
                                                      <tr className="border-b last:border-0 bg-gray-50">
                                                          <td className="py-3 text-gray-800 font-medium pl-6">{s.name} (Practical)</td>
                                                          <td className="py-3 text-center text-gray-500">{score.practicalFullMarks ?? 50}</td>
                                                          <td className="py-3 text-center text-gray-500">{score.practicalPassMarks ?? 20}</td>
                                                          <td className={`py-3 text-right font-bold ${(score.practicalObtained ?? 0) < (score.practicalPassMarks ?? 20) ? 'text-red-600' : 'text-gray-900'}`}>
                                                              {score.practicalObtained ?? 0}
                                                          </td>
                                                      </tr>
                                                    )}
                                                </React.Fragment>
                                              );
                                          })}
                                      </tbody>
                                  </table>
                                  {report.remarks && (
                                    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-sm text-yellow-800 mt-4">
                                        <strong>Remarks:</strong> {report.remarks}
                                    </div>
                                  )}
                              </div>
                          </div>
                      )})}
                  </div>
              )}
          </div>
      );
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
