import React, { useState } from 'react';
import { useAppStore } from '../../services/store';
import { Role, User } from '../../types';
import AccountantView from './AccountantView';
import { Check, X, Printer, Lock, Unlock, AlertTriangle, RefreshCw, UserCheck, Shield, BookOpen, Edit2 } from 'lucide-react';

interface Props {
  activeTab: string;
  role: Role;
}

const AdminView: React.FC<Props> = ({ activeTab, role }) => {
  const { state, dispatch } = useAppStore();
  const { currentUser } = state;
  
  // Notice Form
  const [noticeForm, setNoticeForm] = useState({ title: '', content: '', audience: 'all' });

  // User Edit Form
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});

  // Approvals Logic
  const getPendingUsers = () => {
      return state.users.filter(u => u.status === 'pending').filter(u => {
          // Hierarchy Logic
          if (role === 'developer') return u.role === 'admin';
          if (role === 'admin') return u.role === 'administrator' || u.role === 'accountant' || u.role === 'teacher' || u.role === 'student';
          if (role === 'administrator') return u.role === 'teacher' || u.role === 'student';
          return false;
      });
  };

  const handleApprove = (id: string) => {
      dispatch({ type: 'APPROVE_USER', payload: id });
  };

  const handleReject = (id: string) => {
      dispatch({ type: 'REJECT_USER', payload: id });
  };

  const postNotice = (e: React.FormEvent) => {
      e.preventDefault();
      dispatch({
          type: 'ADD_NOTICE',
          payload: {
              id: Date.now().toString(),
              title: noticeForm.title,
              content: noticeForm.content,
              audience: noticeForm.audience as 'all' | 'students' | 'teachers',
              date: new Date().toISOString().split('T')[0],
              postedBy: state.currentUser?.name || 'Admin'
          }
      });
      setNoticeForm({ title: '', content: '', audience: 'all' });
  }

  // Edit User Logic
  const startEditUser = (user: User) => {
      setEditingUserId(user.id);
      setEditForm({ ...user });
  }

  const saveUserEdit = () => {
      if(editingUserId && editForm) {
          dispatch({ type: 'UPDATE_USER_DETAILS', payload: { id: editingUserId, ...editForm } });
          setEditingUserId(null);
          setEditForm({});
      }
  }

  // System Tools
  const [resetVal, setResetVal] = useState(1);
  const handleResetReceipt = () => {
      if(window.confirm(`Are you sure you want to reset the receipt counter to ${resetVal}? This is a critical action.`)) {
          dispatch({ type: 'RESET_RECEIPT_COUNTER', payload: Number(resetVal) });
      }
  }

  // --- Registration / User Management ---
  if (activeTab === 'registration' || activeTab === 'users') {
      const usersToManage = state.users.filter(u => u.status === 'active' && u.id !== currentUser?.id);
      
      return (
          <div className="space-y-8">
              {/* Approval Section */}
              <div className="bg-white p-6 rounded-xl border border-galaxy-200 shadow-sm">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <UserCheck className="text-galaxy-600" /> Pending Approvals
                  </h3>
                  {getPendingUsers().length === 0 ? (
                      <p className="text-gray-500 italic">No pending registration requests requiring your approval.</p>
                  ) : (
                      <div className="grid gap-4">
                          {getPendingUsers().map(u => (
                              <div key={u.id} className="flex items-center justify-between border p-4 rounded-lg bg-yellow-50 border-yellow-100">
                                  <div>
                                      <p className="font-bold text-gray-800">{u.name}</p>
                                      <p className="text-sm text-gray-600">{u.role} • {u.email}</p>
                                      {u.role === 'student' && <p className="text-xs text-gray-500">Class: {u.classId} | Fee: {u.annualFee}</p>}
                                  </div>
                                  <div className="flex gap-2">
                                      <button onClick={() => handleReject(u.id)} className="px-3 py-1 bg-white border border-red-200 text-red-600 rounded hover:bg-red-50">Reject</button>
                                      <button onClick={() => handleApprove(u.id)} className="px-3 py-1 bg-galaxy-600 text-white rounded hover:bg-galaxy-700">Approve</button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>

              {/* User Management Section */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-xl font-bold mb-4">Manage Active Users</h3>
                  <div className="overflow-x-auto">
                      <table className="w-full text-left">
                          <thead className="bg-gray-50">
                              <tr>
                                  <th className="p-3">Name</th>
                                  <th className="p-3">Role</th>
                                  <th className="p-3">Details</th>
                                  <th className="p-3">Actions</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y">
                              {usersToManage.map(u => (
                                  <tr key={u.id}>
                                      <td className="p-3 font-medium">{u.name} <br/><span className="text-xs text-gray-500 font-normal">{u.email}</span></td>
                                      <td className="p-3 capitalize">{u.role}</td>
                                      <td className="p-3 text-sm">
                                          {editingUserId === u.id ? (
                                              <div className="space-y-2">
                                                  {u.role === 'student' && (
                                                      <input 
                                                        className="border p-1 rounded w-full"
                                                        placeholder="Class ID"
                                                        value={editForm.classId || ''}
                                                        onChange={e => setEditForm({...editForm, classId: e.target.value})}
                                                      />
                                                  )}
                                                  {u.role === 'teacher' && (
                                                      <input 
                                                        className="border p-1 rounded w-full"
                                                        placeholder="Subjects"
                                                        value={(editForm.subjects || []).join(', ')}
                                                        onChange={e => setEditForm({...editForm, subjects: e.target.value.split(',').map(s=>s.trim())})}
                                                      />
                                                  )}
                                                  {(u.role === 'admin' || u.role === 'administrator') && <span className="text-gray-400">No editable details</span>}
                                              </div>
                                          ) : (
                                              <div>
                                                  {u.role === 'student' && <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">{u.classId}</span>}
                                                  {u.role === 'teacher' && <span className="text-xs text-gray-600">{u.subjects?.join(', ')}</span>}
                                              </div>
                                          )}
                                      </td>
                                      <td className="p-3">
                                          {editingUserId === u.id ? (
                                              <div className="flex gap-2">
                                                  <button onClick={saveUserEdit} className="text-green-600 hover:underline">Save</button>
                                                  <button onClick={() => setEditingUserId(null)} className="text-gray-500 hover:underline">Cancel</button>
                                              </div>
                                          ) : (
                                              <button onClick={() => startEditUser(u)} className="text-galaxy-600 hover:bg-galaxy-50 p-2 rounded">
                                                  <Edit2 size={16} />
                                              </button>
                                          )}
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      );
  }

  // --- Financials (Reuse Accountant View) ---
  if (activeTab === 'finance_overview' && (role === 'admin' || role === 'administrator')) {
      return <AccountantView activeTab="finance_overview" />;
  }

  if (activeTab === 'approvals') {
       // This tab is specifically for Fee Approvals (Admin Only) or general approvals if we merged logic
       const pendingFees = state.fees.filter(f => f.status === 'pending_delete' || f.status === 'pending_edit');
       
       return (
          <div>
              <h3 className="text-xl font-bold mb-4">Financial Approvals</h3>
              {pendingFees.length === 0 ? <p className="text-gray-500">No pending financial requests.</p> : (
                  <div className="space-y-4">
                      {pendingFees.map(fee => (
                          <div key={fee.id} className="border border-red-200 bg-red-50 p-4 rounded-lg flex justify-between items-center">
                              <div>
                                  <p className="font-bold text-red-900">Request: {fee.status === 'pending_delete' ? 'Delete Receipt' : 'Edit Receipt'}</p>
                                  <p className="text-sm">Receipt #{fee.receiptNumber} - {fee.studentName} - Rs. {fee.amount}</p>
                              </div>
                              <div className="flex gap-2">
                                  <button 
                                    onClick={() => dispatch({ type: 'UPDATE_FEE_STATUS', payload: { id: fee.id, status: 'paid' } })} 
                                    className="bg-white border hover:bg-gray-100 text-gray-700 px-3 py-1 rounded"
                                  >
                                      Reject
                                  </button>
                                  <button 
                                    onClick={() => dispatch({ type: 'DELETE_FEE', payload: fee.id })}
                                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                                  >
                                      Approve
                                  </button>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
       )
  }

  if (activeTab === 'reports' || activeTab === 'exam_management') {
      return (
          <div>
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold">Exam Reports Management</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {state.examReports.map(report => {
                      const student = state.users.find(u => u.id === report.studentId);
                      return (
                          <div key={report.id} className="border rounded-xl p-4 bg-white shadow-sm relative">
                              <div className="flex justify-between mb-2">
                                  <h4 className="font-bold text-lg">{student?.name}</h4>
                                  <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${report.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                      {report.published ? 'Published' : 'Draft'}
                                  </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{report.term}</p>
                              <div className="mb-4">
                                  {Object.entries(report.scores).map(([s, score]) => (
                                      <div key={s} className="flex justify-between text-sm border-b border-gray-100 py-1">
                                          <span>{s}</span>
                                          <span className="font-mono">{score}</span>
                                      </div>
                                  ))}
                              </div>
                              <div className="flex justify-end gap-2 mt-4 pt-2 border-t">
                                  <button 
                                    onClick={() => dispatch({ type: 'PUBLISH_REPORT', payload: { id: report.id, published: !report.published } })}
                                    className={`w-full py-2 px-4 rounded text-white flex items-center justify-center gap-2 ${report.published ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-600 hover:bg-green-700'}`}
                                  >
                                      {report.published ? <><Lock size={16} /> Unpublish</> : <><Unlock size={16} /> Publish Result</>}
                                  </button>
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>
      );
  }

  if (activeTab === 'notices' || activeTab === 'issue_notices') {
      return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                  <h3 className="font-bold text-lg">Posted Notices</h3>
                  {state.notices.map(n => (
                      <div key={n.id} className="border p-4 rounded bg-white">
                          <div className="flex justify-between">
                             <h4 className="font-bold">{n.title}</h4>
                             <span className="text-xs text-gray-500">{n.audience.toUpperCase()}</span>
                          </div>
                          <p className="text-gray-700 mt-2">{n.content}</p>
                          <p className="text-xs text-gray-400 mt-2">{n.date}</p>
                      </div>
                  ))}
              </div>
              <div>
                  <div className="bg-white p-6 rounded-xl border shadow-sm sticky top-4">
                      <h3 className="font-bold text-lg mb-4">Post New Notice</h3>
                      <form onSubmit={postNotice} className="space-y-4">
                          <input 
                            className="w-full border p-2 rounded" 
                            placeholder="Title" 
                            value={noticeForm.title}
                            onChange={e => setNoticeForm({...noticeForm, title: e.target.value})}
                            required
                          />
                          <textarea 
                            className="w-full border p-2 rounded h-32" 
                            placeholder="Notice content..."
                            value={noticeForm.content}
                            onChange={e => setNoticeForm({...noticeForm, content: e.target.value})}
                            required
                          />
                          <select 
                            className="w-full border p-2 rounded"
                            value={noticeForm.audience}
                            onChange={e => setNoticeForm({...noticeForm, audience: e.target.value})}
                          >
                              <option value="all">All School</option>
                              <option value="students">Students Only</option>
                              <option value="teachers">Teachers Only</option>
                          </select>
                          <button type="submit" className="w-full bg-galaxy-900 text-white py-2 rounded hover:bg-galaxy-800">
                              Publish Notice
                          </button>
                      </form>
                  </div>
              </div>
          </div>
      )
  }

  if ((activeTab === 'system' || activeTab === 'debug') && (role === 'admin' || role === 'developer')) {
      return (
          <div>
              <h3 className="text-xl font-bold mb-6 text-red-700 flex items-center gap-2">
                  <AlertTriangle /> Dangerous Zone
              </h3>
              
              <div className="bg-white border border-red-200 p-6 rounded-xl shadow-sm max-w-md">
                  <h4 className="font-bold mb-2">Receipt Counter Reset</h4>
                  <p className="text-sm text-gray-600 mb-4">
                      Current Next Receipt #: <strong>{state.receiptCounter}</strong><br/>
                      Resetting this will cause future receipts to start from the defined number. Ensure no duplication occurs manually.
                  </p>
                  <div className="flex gap-2">
                      <input 
                        type="number" 
                        value={resetVal} 
                        onChange={e => setResetVal(parseInt(e.target.value))}
                        className="border p-2 rounded w-24"
                      />
                      <button 
                        onClick={handleResetReceipt}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center gap-2"
                      >
                          <RefreshCw size={16} /> Reset Counter
                      </button>
                  </div>
              </div>
          </div>
      )
  }

  // Fallback Dashboard
  return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-blue-500">
              <h3 className="text-gray-500 text-sm">Total Students</h3>
              <p className="text-3xl font-bold">{state.users.filter(u => u.role === 'student').length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-green-500">
              <h3 className="text-gray-500 text-sm">Fees Collected</h3>
              <p className="text-3xl font-bold">Rs. {state.fees.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-red-500">
              <h3 className="text-gray-500 text-sm">Pending Approvals</h3>
              <p className="text-3xl font-bold">{getPendingUsers().length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-purple-500">
              <h3 className="text-gray-500 text-sm">Pending Assignments</h3>
              <p className="text-3xl font-bold">{state.assignments.length}</p>
          </div>
      </div>
  );
};

export default AdminView;