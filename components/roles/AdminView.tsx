
import React, { useState } from 'react';
import { useAppStore } from '../../services/store';
import { Role, User, ExamType, SubjectType } from '../../types';
import AccountantView from './AccountantView';
import { Check, X, Printer, Lock, Unlock, AlertTriangle, RefreshCw, UserCheck, Shield, BookOpen, Edit2, Search, Filter, Eye, Settings, Plus, Trash2, Calendar, Layout, ChevronRight, ChevronDown } from 'lucide-react';

interface Props {
  activeTab: string;
  role: Role;
}

const AdminView: React.FC<Props> = ({ activeTab, role }) => {
  const { state, dispatch } = useAppStore();
  const { currentUser } = state;
  
  // Notice Form
  const [noticeForm, setNoticeForm] = useState({ title: '', content: '', audience: 'all' });

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');

  // Approval / Edit Modal State
  const [reviewUser, setReviewUser] = useState<User | null>(null);
  const [reviewData, setReviewData] = useState<Partial<User>>({});
  
  // System Management State
  const [showSubjectManager, setShowSubjectManager] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newSubjectType, setNewSubjectType] = useState<SubjectType>('Theory');
  
  const [showClassManager, setShowClassManager] = useState(false);
  const [newClass, setNewClass] = useState('');
  const [newSection, setNewSection] = useState('');
  const [activeClassForSection, setActiveClassForSection] = useState<string | null>(null);

  // Exam Session Form
  const [newSessionName, setNewSessionName] = useState('');
  const [newSessionType, setNewSessionType] = useState<ExamType>('Term Exam');
  const [publishClassId, setPublishClassId] = useState('');
  const [publishSection, setPublishSection] = useState('');

  // Hierarchy Definition
  const roleHierarchy: Record<string, number> = {
    developer: 100,
    admin: 90,
    accountant: 50,
    teacher: 50,
    student: 10,
    guest: 0
  };

  // Approvals Logic
  const getPendingUsers = () => {
      return state.users.filter(u => u.status === 'pending').filter(u => {
          if (role === 'developer') return u.role === 'admin';
          if (role === 'admin') return u.role === 'accountant' || u.role === 'teacher' || u.role === 'student';
          return false;
      });
  };

  const openReviewModal = (user: User) => {
      setReviewUser(user);
      setReviewData({ ...user });
  };

  const confirmApprovalOrEdit = () => {
      if (!reviewUser) return;
      
      const updates: Partial<User> = { ...reviewData };
      if (updates.role === 'student') {
          updates.annualFee = Number(updates.annualFee || 0);
          updates.discount = Number(updates.discount || 0);
      }
      if (updates.role !== 'student') {
          delete updates.annualFee; delete updates.discount; delete updates.classId; delete updates.section;
      }
      if (updates.role !== 'teacher') {
          delete updates.subjects;
      }

      if (reviewUser.status === 'pending') {
          dispatch({ type: 'APPROVE_USER', payload: { id: reviewUser.id, updates } });
      } else {
          dispatch({ type: 'UPDATE_USER_DETAILS', payload: { id: reviewUser.id, ...updates } });
      }
      setReviewUser(null);
      setReviewData({});
  };

  const handleReject = (id: string) => {
      if(window.confirm('Are you sure you want to reject this registration?')) {
          dispatch({ type: 'REJECT_USER', payload: id });
      }
  };

  const toggleSubjectInReview = (subjectName: string) => {
      const currentSubjects = reviewData.subjects || [];
      if (currentSubjects.includes(subjectName)) {
          setReviewData({ ...reviewData, subjects: currentSubjects.filter(s => s !== subjectName) });
      } else {
          setReviewData({ ...reviewData, subjects: [...currentSubjects, subjectName] });
      }
  };

  const handleAddSubject = () => {
      if(newSubject.trim()) {
          dispatch({ type: 'ADD_SYSTEM_SUBJECT', payload: { name: newSubject.trim(), type: newSubjectType } });
          setNewSubject('');
      }
  };

  const handleAddClass = () => {
    if(newClass.trim()) {
        dispatch({ type: 'ADD_SYSTEM_CLASS', payload: newClass.trim() });
        setNewClass('');
    }
  };

  const handleAddSection = (className: string) => {
      if(newSection.trim()) {
          dispatch({ type: 'ADD_CLASS_SECTION', payload: { className, section: newSection.trim() } });
          setNewSection('');
      }
  }

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

  const handleCreateSession = () => {
      if (!newSessionName.trim()) return;
      dispatch({
          type: 'ADD_EXAM_SESSION',
          payload: {
              id: `es${Date.now()}`,
              name: newSessionName,
              type: newSessionType,
              status: 'open',
              startDate: new Date().toISOString().split('T')[0]
          }
      });
      setNewSessionName('');
  };

  // System Tools
  const [resetVal, setResetVal] = useState(1);
  const handleResetReceipt = () => {
      if(window.confirm(`Are you sure you want to reset the receipt counter to ${resetVal}? This is a critical action.`)) {
          dispatch({ type: 'RESET_RECEIPT_COUNTER', payload: Number(resetVal) });
      }
  }

  const handlePublishClassResult = (examSessionId: string, published: boolean) => {
      if (!publishClassId) {
          alert("Please select a class first");
          return;
      }
      if(window.confirm(`${published ? 'Publish' : 'Unpublish'} results for ${publishClassId} ${publishSection ? publishSection : ''}?`)) {
          dispatch({
              type: 'PUBLISH_CLASS_RESULT',
              payload: { examSessionId, classId: publishClassId, section: publishSection || undefined, published }
          });
      }
  }

  const selectedClassData = state.systemClasses.find(c => c.name === reviewData.classId);

  // --- Registration / User Management ---
  if (activeTab === 'registration' || activeTab === 'users') {
      const usersToManage = state.users
        .filter(u => u.status === 'active' && u.id !== currentUser?.id)
        .filter(u => {
            if (currentUser?.role === 'developer') return true;
            const myLevel = roleHierarchy[currentUser?.role || 'guest'];
            const targetLevel = roleHierarchy[u.role || 'guest'];
            return myLevel > targetLevel;
        })
        .filter(u => {
            const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  u.email.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRole = filterRole === 'all' || u.role === filterRole;
            return matchesSearch && matchesRole;
        });
      
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
                                      <p className="text-sm text-gray-600">{u.role.toUpperCase()} • {u.email}</p>
                                      <p className="text-xs text-gray-500">Applied: {new Date().toLocaleDateString()}</p>
                                  </div>
                                  <div className="flex gap-2">
                                      <button onClick={() => handleReject(u.id)} className="px-3 py-1 bg-white border border-red-200 text-red-600 rounded hover:bg-red-50 text-sm">Reject</button>
                                      <button onClick={() => openReviewModal(u)} className="px-3 py-1 bg-galaxy-600 text-white rounded hover:bg-galaxy-700 text-sm flex items-center gap-1">
                                          <Eye size={14} /> Review
                                      </button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>

              {/* Subject Manager Modal */}
              {showSubjectManager && (
                  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                          <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
                              <h3 className="font-bold">Subject Library</h3>
                              <button onClick={() => setShowSubjectManager(false)}><X size={18} /></button>
                          </div>
                          <div className="p-6">
                              <div className="flex gap-2 mb-4">
                                  <input 
                                      type="text" 
                                      placeholder="Subject Name" 
                                      className="flex-1 border p-2 rounded"
                                      value={newSubject}
                                      onChange={e => setNewSubject(e.target.value)}
                                  />
                                  <select 
                                    className="border p-2 rounded"
                                    value={newSubjectType}
                                    onChange={e => setNewSubjectType(e.target.value as SubjectType)}
                                  >
                                      <option value="Theory">Theory</option>
                                      <option value="Practical">Practical</option>
                                  </select>
                                  <button onClick={handleAddSubject} className="bg-green-600 text-white px-3 py-2 rounded">
                                      <Plus size={18} />
                                  </button>
                              </div>
                              <div className="max-h-60 overflow-y-auto space-y-2">
                                  {state.availableSubjects.map(s => (
                                      <div key={s.name} className="flex justify-between items-center p-2 bg-gray-50 rounded border">
                                          <span>{s.name} <span className="text-xs text-gray-400">({s.type})</span></span>
                                          <button 
                                              onClick={() => dispatch({ type: 'DELETE_SYSTEM_SUBJECT', payload: s.name })}
                                              className="text-red-500 hover:text-red-700"
                                          >
                                              <Trash2 size={16} />
                                          </button>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </div>
                  </div>
              )}

              {/* Class & Section Manager Modal */}
              {showClassManager && (
                  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
                          <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
                              <h3 className="font-bold">Class & Section Library</h3>
                              <button onClick={() => setShowClassManager(false)}><X size={18} /></button>
                          </div>
                          <div className="p-6">
                              <div className="flex gap-2 mb-6">
                                  <input 
                                      type="text" 
                                      placeholder="New Class (e.g. 11)" 
                                      className="flex-1 border p-2 rounded"
                                      value={newClass}
                                      onChange={e => setNewClass(e.target.value)}
                                  />
                                  <button onClick={handleAddClass} className="bg-green-600 text-white px-3 py-2 rounded flex items-center gap-1">
                                      <Plus size={16} /> Add Class
                                  </button>
                              </div>
                              
                              <div className="max-h-96 overflow-y-auto space-y-4">
                                  {state.systemClasses.map(c => (
                                      <div key={c.name} className="border rounded-lg overflow-hidden">
                                          <div className="bg-gray-100 p-3 flex justify-between items-center font-bold">
                                              <span>{c.name}</span>
                                              <button 
                                                  onClick={() => dispatch({ type: 'DELETE_SYSTEM_CLASS', payload: c.name })}
                                                  className="text-red-500 hover:text-red-700 p-1"
                                              >
                                                  <Trash2 size={16} />
                                              </button>
                                          </div>
                                          <div className="p-3 bg-white">
                                              <div className="flex flex-wrap gap-2 mb-2">
                                                  {c.sections.map(sec => (
                                                      <div key={sec} className="bg-blue-50 text-blue-800 text-xs px-2 py-1 rounded border border-blue-200 flex items-center gap-1">
                                                          {sec}
                                                          <button 
                                                            onClick={() => dispatch({ type: 'DELETE_CLASS_SECTION', payload: { className: c.name, section: sec } })}
                                                            className="text-red-400 hover:text-red-600"
                                                          >
                                                              <X size={12} />
                                                          </button>
                                                      </div>
                                                  ))}
                                              </div>
                                              
                                              <div className="flex gap-2 mt-2">
                                                  <input 
                                                      type="text" 
                                                      placeholder={`Add section to ${c.name}`} 
                                                      className="flex-1 border p-1 rounded text-sm"
                                                      value={activeClassForSection === c.name ? newSection : ''}
                                                      onChange={e => { setActiveClassForSection(c.name); setNewSection(e.target.value); }}
                                                  />
                                                  <button 
                                                    onClick={() => { setActiveClassForSection(c.name); handleAddSection(c.name); }}
                                                    className="bg-blue-600 text-white px-2 py-1 rounded text-xs"
                                                  >
                                                      Add
                                                  </button>
                                              </div>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </div>
                  </div>
              )}

              {/* Review / Edit Modal */}
              {reviewUser && (
                  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden max-h-[90vh] overflow-y-auto">
                          <div className="bg-galaxy-900 text-white p-4 flex justify-between items-center sticky top-0 z-10">
                              <h3 className="font-bold">
                                  {reviewUser.status === 'pending' ? 'Review Application' : 'Edit User Details'}
                              </h3>
                              <button onClick={() => setReviewUser(null)}><X size={20} /></button>
                          </div>
                          <div className="p-6 space-y-4">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                      <label className="block text-xs font-bold text-gray-500 uppercase">Full Name</label>
                                      <input 
                                          type="text" 
                                          value={reviewData.name || ''}
                                          onChange={e => setReviewData({...reviewData, name: e.target.value})}
                                          className="w-full border p-2 rounded mt-1 outline-none"
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-gray-500 uppercase">Role</label>
                                      <select 
                                          value={reviewData.role || 'student'}
                                          onChange={e => setReviewData({...reviewData, role: e.target.value as any})}
                                          className="w-full border p-2 rounded mt-1 bg-white outline-none"
                                      >
                                          <option value="student">Student</option>
                                          <option value="teacher">Teacher</option>
                                          <option value="accountant">Accountant</option>
                                          <option value="admin">Admin</option>
                                      </select>
                                  </div>
                                  <div className="col-span-2">
                                      <label className="block text-xs font-bold text-gray-500 uppercase">Email</label>
                                      <input 
                                          type="email" 
                                          value={reviewData.email || ''}
                                          onChange={e => setReviewData({...reviewData, email: e.target.value})}
                                          className="w-full border p-2 rounded mt-1 outline-none"
                                      />
                                  </div>
                              </div>

                              <div className="border-t pt-4">
                                  {reviewData.role === 'student' && (
                                      <div className="space-y-3 bg-blue-50 p-4 rounded-lg border border-blue-100">
                                          <h4 className="font-bold text-blue-900 flex items-center gap-2">
                                              <BookOpen size={16}/> Student Configuration
                                          </h4>
                                          <div className="grid grid-cols-2 gap-4">
                                              <div>
                                                  <label className="block text-xs font-bold text-gray-500 uppercase">Assigned Class</label>
                                                  <select
                                                      value={reviewData.classId || ''}
                                                      onChange={e => setReviewData({...reviewData, classId: e.target.value, section: ''})}
                                                      className="w-full border p-2 rounded mt-1 bg-white"
                                                  >
                                                      <option value="">-- Select Class --</option>
                                                      {state.systemClasses.map(cls => (
                                                          <option key={cls.name} value={cls.name}>{cls.name}</option>
                                                      ))}
                                                  </select>
                                              </div>
                                              <div>
                                                  <label className="block text-xs font-bold text-gray-500 uppercase">Section</label>
                                                  <select
                                                      value={reviewData.section || ''}
                                                      onChange={e => setReviewData({...reviewData, section: e.target.value})}
                                                      className="w-full border p-2 rounded mt-1 bg-white"
                                                      disabled={!selectedClassData || selectedClassData.sections.length === 0}
                                                  >
                                                      <option value="">{selectedClassData && selectedClassData.sections.length > 0 ? '-- Select Section --' : 'N/A'}</option>
                                                      {selectedClassData?.sections.map(sec => (
                                                          <option key={sec} value={sec}>{sec}</option>
                                                      ))}
                                                  </select>
                                              </div>
                                          </div>
                                          <div className="grid grid-cols-2 gap-4">
                                              <div>
                                                  <label className="block text-xs font-bold text-gray-500 uppercase">Annual Fee (Rs)</label>
                                                  <input 
                                                      type="number" 
                                                      value={reviewData.annualFee || 0}
                                                      onChange={e => setReviewData({...reviewData, annualFee: Number(e.target.value)})}
                                                      className="w-full border p-2 rounded mt-1"
                                                      // Accountant can't edit fees here if restricted, but sticking to prompt "Admins approval to remove or edit"
                                                  />
                                              </div>
                                              <div>
                                                  <label className="block text-xs font-bold text-gray-500 uppercase">Discount (Rs)</label>
                                                  <input 
                                                      type="number" 
                                                      value={reviewData.discount || 0}
                                                      onChange={e => setReviewData({...reviewData, discount: Number(e.target.value)})}
                                                      className="w-full border p-2 rounded mt-1"
                                                  />
                                              </div>
                                          </div>
                                      </div>
                                  )}

                                  {reviewData.role === 'teacher' && (
                                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                                          <h4 className="font-bold text-purple-900 mb-2">Teacher Configuration</h4>
                                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Assign Subjects</label>
                                          <div className="flex flex-wrap gap-2">
                                              {state.availableSubjects.map(subject => {
                                                  const isSelected = reviewData.subjects?.includes(subject.name);
                                                  return (
                                                      <button
                                                          key={subject.name}
                                                          onClick={() => toggleSubjectInReview(subject.name)}
                                                          className={`text-xs px-2 py-1 rounded-full border transition-all ${
                                                              isSelected 
                                                              ? 'bg-purple-600 text-white border-purple-600' 
                                                              : 'bg-white text-gray-600 border-gray-300 hover:border-purple-400'
                                                          }`}
                                                      >
                                                          {subject.name} {isSelected && '✓'}
                                                      </button>
                                                  )
                                              })}
                                          </div>
                                      </div>
                                  )}
                              </div>

                              <div className="flex gap-3 pt-4">
                                  <button onClick={() => setReviewUser(null)} className="flex-1 py-2 border rounded hover:bg-gray-50">Cancel</button>
                                  <button onClick={confirmApprovalOrEdit} className="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-bold">
                                      {reviewUser.status === 'pending' ? 'Confirm & Approve' : 'Save Changes'}
                                  </button>
                              </div>
                          </div>
                      </div>
                  </div>
              )}

              {/* User Management Section */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                      <h3 className="text-xl font-bold">Manage Active Users</h3>
                      
                      <div className="flex gap-3 w-full md:w-auto items-center">
                          <button onClick={() => setShowSubjectManager(true)} className="px-3 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
                              <BookOpen size={18} /><span className="hidden md:inline text-sm">Subjects</span>
                          </button>

                          <button onClick={() => setShowClassManager(true)} className="px-3 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
                              <Layout size={18} /><span className="hidden md:inline text-sm">Classes</span>
                          </button>

                          <div className="relative flex-1 md:w-64">
                              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                              <input 
                                type="text" placeholder="Search..." 
                                className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                              />
                          </div>
                      </div>
                  </div>

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
                                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                          <td className="p-3 font-medium">
                                              {u.name} <br/> <span className="text-xs text-gray-500 font-normal">{u.email}</span>
                                          </td>
                                          <td className="p-3">
                                              <span className={`px-2 py-1 rounded text-xs font-bold uppercase
                                                  ${u.role === 'student' ? 'bg-blue-100 text-blue-700' : u.role === 'teacher' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}
                                              >
                                                  {u.role}
                                              </span>
                                          </td>
                                          <td className="p-3 text-sm">
                                              {u.role === 'student' && <div>{u.classId} {u.section ? `- ${u.section}` : ''}</div>}
                                              {u.role === 'teacher' && <span className="text-xs text-gray-600">{u.subjects?.join(', ')}</span>}
                                          </td>
                                          <td className="p-3">
                                              <button onClick={() => openReviewModal(u)} className="text-galaxy-600 hover:bg-galaxy-100 p-2 rounded transition-colors">
                                                  <Edit2 size={16} />
                                              </button>
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

  // --- Financials ---
  if (activeTab === 'finance_overview' && role === 'admin') {
      return <AccountantView activeTab="finance_overview" />;
  }

  if (activeTab === 'approvals') {
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
          <div className="space-y-8">
              {/* Exam Sessions Management */}
              <div className="bg-white p-6 rounded-xl border border-galaxy-200 shadow-sm">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                       <Calendar className="text-galaxy-600" /> Manage Exam Sessions
                  </h3>
                  
                  {/* Create New Session */}
                  <div className="bg-gray-50 p-4 rounded-lg mb-6 flex flex-wrap gap-4 items-end border">
                      <div className="flex-1 min-w-[200px]">
                          <label className="text-sm font-bold text-gray-600 block mb-1">Session Name</label>
                          <input 
                              type="text" placeholder="e.g. Second Term 2024" 
                              className="w-full border p-2 rounded"
                              value={newSessionName} onChange={e => setNewSessionName(e.target.value)}
                          />
                      </div>
                      <div className="min-w-[150px]">
                           <label className="text-sm font-bold text-gray-600 block mb-1">Exam Type</label>
                           <select 
                              className="w-full border p-2 rounded"
                              value={newSessionType} onChange={e => setNewSessionType(e.target.value as ExamType)}
                           >
                               <option value="Monthly Test">Monthly Test</option>
                               <option value="Unit Test">Unit Test</option>
                               <option value="Term Exam">Term Exam</option>
                               <option value="Viva Exam">Viva Exam</option>
                               <option value="Final Exam">Final Exam</option>
                           </select>
                      </div>
                      <button 
                          onClick={handleCreateSession}
                          className="bg-galaxy-900 text-white px-4 py-2 rounded hover:bg-galaxy-800 flex items-center gap-2"
                      >
                          <Plus size={16} /> Create Session
                      </button>
                  </div>

                  {/* List Sessions */}
                  <div className="space-y-3">
                      {state.examSessions.map(session => (
                          <div key={session.id} className="flex items-center justify-between border p-4 rounded-lg bg-white shadow-sm">
                              <div>
                                  <div className="flex items-center gap-2">
                                      <h4 className="font-bold text-lg">{session.name}</h4>
                                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded border">{session.type}</span>
                                  </div>
                                  <p className="text-xs text-gray-500">Started: {session.startDate}</p>
                              </div>
                              <div className="flex items-center gap-4">
                                  <div className={`text-sm font-bold ${session.status === 'open' ? 'text-green-600' : 'text-red-500'}`}>
                                      {session.status === 'open' ? 'OPEN FOR ENTRY' : 'CLOSED'}
                                  </div>
                                  <button 
                                      onClick={() => dispatch({ type: 'TOGGLE_EXAM_SESSION_STATUS', payload: session.id })}
                                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${session.status === 'open' ? 'bg-green-600' : 'bg-gray-300'}`}
                                  >
                                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${session.status === 'open' ? 'translate-x-6' : 'translate-x-1'}`} />
                                  </button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              {/* Class-wise Result Publishing */}
              <div className="bg-white p-6 rounded-xl border border-galaxy-200 shadow-sm">
                  <h3 className="text-xl font-bold mb-4">Publish Class Results</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                       <div className="md:col-span-1">
                           <label className="text-sm font-bold text-gray-600 block mb-1">Select Class</label>
                           <select className="w-full border p-2 rounded" value={publishClassId} onChange={e => { setPublishClassId(e.target.value); setPublishSection(''); }}>
                               <option value="">-- Choose Class --</option>
                               {state.systemClasses.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                           </select>
                       </div>
                       <div className="md:col-span-1">
                           <label className="text-sm font-bold text-gray-600 block mb-1">Select Section</label>
                           <select 
                             className="w-full border p-2 rounded" 
                             value={publishSection} 
                             onChange={e => setPublishSection(e.target.value)}
                             disabled={!publishClassId}
                           >
                               <option value="">All Sections</option>
                               {state.systemClasses.find(c => c.name === publishClassId)?.sections.map(s => <option key={s} value={s}>{s}</option>)}
                           </select>
                       </div>
                       <div className="md:col-span-2">
                           <p className="text-xs text-gray-500 mb-2">Publishing will make results visible to all students in the selected class/section for respective active sessions.</p>
                           <div className="flex gap-2">
                               {state.examSessions.map(session => (
                                   <div key={session.id} className="flex items-center gap-2">
                                       <button 
                                         onClick={() => handlePublishClassResult(session.id, true)}
                                         className="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700"
                                         disabled={!publishClassId}
                                       >
                                           Publish {session.name}
                                       </button>
                                   </div>
                               ))}
                           </div>
                       </div>
                  </div>
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
                            value={noticeForm.title} onChange={e => setNoticeForm({...noticeForm, title: e.target.value})}
                            required
                          />
                          <textarea 
                            className="w-full border p-2 rounded h-32" 
                            placeholder="Notice content..."
                            value={noticeForm.content} onChange={e => setNoticeForm({...noticeForm, content: e.target.value})}
                            required
                          />
                          <select 
                            className="w-full border p-2 rounded"
                            value={noticeForm.audience} onChange={e => setNoticeForm({...noticeForm, audience: e.target.value})}
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

  return <div>Welcome Admin</div>;
};

export default AdminView;
