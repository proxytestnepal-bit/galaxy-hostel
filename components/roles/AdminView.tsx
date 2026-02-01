
import React, { useState } from 'react';
import { useAppStore } from '../../services/store';
import { Role, User, ExamType, SubjectType, Notice } from '../../types';
import AccountantView from './AccountantView';
import { Check, X, Printer, Lock, Unlock, AlertTriangle, RefreshCw, UserCheck, Shield, BookOpen, Edit2, Search, Filter, Eye, Settings, Plus, Trash2, Calendar, Layout, ChevronRight, ChevronDown, UploadCloud, Database, ScanFace, LogIn, Briefcase, GraduationCap, Calculator, ChevronLeft, Bell, Send, Users, Clock, Key, Archive, AlertCircle } from 'lucide-react';
import { INITIAL_STATE } from '../../services/mockData';

interface Props {
  activeTab: string;
  role: Role;
}

const AdminView: React.FC<Props> = ({ activeTab, role }) => {
  const { state, dispatch } = useAppStore();
  const { currentUser } = state;
  
  // Notice Form
  const [noticeForm, setNoticeForm] = useState({ title: '', content: '', audience: 'all' as 'all' | 'students' | 'teachers' });

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');

  // Impersonation State
  const [viewMode, setViewMode] = useState<'roles' | 'users'>('roles');
  const [selectedRoleForImp, setSelectedRoleForImp] = useState<Role | null>(null);
  const [impSearch, setImpSearch] = useState('');

  // Approval / Edit Modal State
  const [reviewUser, setReviewUser] = useState<User | null>(null);
  const [reviewData, setReviewData] = useState<Partial<User>>({});
  
  // Password Reset State
  const [resetPassUserId, setResetPassUserId] = useState<string | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');

  // Delete/Dropout Modal State
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

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
    intern: 10,
    guest: 0
  };

  const handlePostNotice = (e: React.FormEvent) => {
      e.preventDefault();
      if (!noticeForm.title || !noticeForm.content) return;

      const newNotice: Notice = {
          id: `n${Date.now()}`,
          title: noticeForm.title,
          content: noticeForm.content,
          audience: noticeForm.audience,
          date: new Date().toISOString().split('T')[0],
          postedBy: currentUser?.name || 'Administrator'
      };

      dispatch({ type: 'ADD_NOTICE', payload: newNotice });
      setNoticeForm({ title: '', content: '', audience: 'all' });
      alert('Notice published successfully to the chosen audience.');
  };

  // Approvals Logic
  const getPendingUsers = () => {
      return state.users.filter(u => u.status === 'pending').filter(u => {
          if (role === 'developer') return u.role === 'admin';
          if (role === 'admin') return u.role === 'accountant' || u.role === 'teacher' || u.role === 'student' || u.role === 'intern';
          return false;
      });
  };

  const openReviewModal = (user: User) => {
      setReviewUser(user);
      setReviewData({ ...user, allowedRoles: user.allowedRoles || [user.role] });
  };

  const confirmApprovalOrEdit = () => {
      if (!reviewUser) return;
      const updates: Partial<User> = { ...reviewData };
      delete updates.status; 

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
      
      if (updates.allowedRoles && updates.role && !updates.allowedRoles.includes(updates.role)) {
          updates.allowedRoles.push(updates.role);
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

  const handleAdminResetPassword = () => {
      if (!resetPassUserId || !newPasswordInput) return;
      if (newPasswordInput.length < 4) {
          alert("Password must be at least 4 characters.");
          return;
      }

      dispatch({
          type: 'UPDATE_USER_DETAILS',
          payload: {
              id: resetPassUserId,
              password: newPasswordInput
          }
      });
      alert("Password updated successfully.");
      setResetPassUserId(null);
      setNewPasswordInput('');
  };

  const handleDeleteClick = (user: User) => {
      if (user.role === 'developer') {
          alert("Cannot delete developer accounts.");
          return;
      }
      setUserToDelete(user);
  };

  const confirmDropUser = () => {
      if(!userToDelete) return;
      dispatch({ type: 'DROP_USER', payload: userToDelete.id });
      setUserToDelete(null);
  };

  const confirmDeleteUser = () => {
      if(!userToDelete) return;
      dispatch({ type: 'DELETE_USER', payload: userToDelete.id });
      setUserToDelete(null);
  }

  const toggleSubjectInReview = (subjectName: string) => {
      const currentSubjects = reviewData.subjects || [];
      if (currentSubjects.includes(subjectName)) {
          setReviewData({ ...reviewData, subjects: currentSubjects.filter(s => s !== subjectName) });
      } else {
          setReviewData({ ...reviewData, subjects: [...currentSubjects, subjectName] });
      }
  };

  const toggleAllowedRoleInReview = (roleName: Role) => {
      const currentAllowed = reviewData.allowedRoles || [];
      if (roleName === reviewData.role) return;
      if (currentAllowed.includes(roleName)) {
          setReviewData({ ...reviewData, allowedRoles: currentAllowed.filter(r => r !== roleName) });
      } else {
          setReviewData({ ...reviewData, allowedRoles: [...currentAllowed, roleName] });
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

  const [resetVal, setResetVal] = useState(1);
  const handleResetReceipt = () => {
      if(window.confirm(`Are you sure you want to reset the receipt counter to ${resetVal}? This is a critical action.`)) {
          dispatch({ type: 'RESET_RECEIPT_COUNTER', payload: Number(resetVal) });
      }
  }

  const handlePublishClassResult = (session: any, published: boolean, reportCount: number) => {
      if (!publishClassId) {
          alert("Please select a class first");
          return;
      }
      if (reportCount === 0) {
          alert("No marks found for this session in the selected class. Teachers must enter marks before you can publish results.");
          return;
      }
      
      dispatch({
          type: 'PUBLISH_CLASS_RESULT',
          payload: { 
              examSessionId: session.id,
              sessionName: session.name, 
              classId: publishClassId, 
              section: publishSection === '' ? undefined : publishSection, 
              published 
          }
      });
  }

  const selectedClassData = state.systemClasses.find(c => c.name === reviewData.classId);

  // --- ISSUE NOTICES TAB ---
  if (activeTab === 'issue_notices') {
    return (
        <div className="space-y-8 max-w-4xl">
            <div className="bg-white p-8 rounded-2xl border border-galaxy-100 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gold-400 rounded-full flex items-center justify-center text-galaxy-900">
                        <Bell size={20} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-galaxy-900">Issue New Notice</h3>
                        <p className="text-sm text-gray-500">Communicate with students, staff, or everyone.</p>
                    </div>
                </div>

                <form onSubmit={handlePostNotice} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Notice Title</label>
                            <input 
                                type="text" 
                                required
                                className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-galaxy-500 outline-none transition-all shadow-sm"
                                placeholder="e.g. Winter Break Schedule"
                                value={noticeForm.title}
                                onChange={e => setNoticeForm({...noticeForm, title: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Target Audience</label>
                            <div className="relative">
                                <Users size={16} className="absolute left-3 top-3.5 text-gray-400" />
                                <select 
                                    className="w-full border pl-10 p-3 rounded-xl focus:ring-2 focus:ring-galaxy-500 outline-none transition-all shadow-sm bg-white appearance-none"
                                    value={noticeForm.audience}
                                    onChange={e => setNoticeForm({...noticeForm, audience: e.target.value as any})}
                                >
                                    <option value="all">Everyone</option>
                                    <option value="students">Students Only</option>
                                    <option value="teachers">Staff Only</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Content</label>
                        <textarea 
                            required
                            rows={6}
                            className="w-full border p-4 rounded-xl focus:ring-2 focus:ring-galaxy-500 outline-none transition-all shadow-sm resize-none"
                            placeholder="Type your announcement details here..."
                            value={noticeForm.content}
                            onChange={e => setNoticeForm({...noticeForm, content: e.target.value})}
                        />
                    </div>

                    <div className="flex justify-end">
                        <button 
                            type="submit" 
                            className="bg-galaxy-900 text-white px-8 py-3 rounded-xl hover:bg-galaxy-800 font-bold flex items-center gap-2 shadow-lg shadow-galaxy-900/20 transform transition active:scale-95"
                        >
                            <Send size={18} /> Publish Announcement
                        </button>
                    </div>
                </form>
            </div>

            {/* History Feed */}
            <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Clock size={16} /> Recently Issued
                </h4>
                {state.notices.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-2xl border border-dashed">
                        No notices have been issued yet.
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {state.notices.slice(0, 5).map(notice => (
                            <div key={notice.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm group hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                            notice.audience === 'all' ? 'bg-gold-100 text-gold-700' :
                                            notice.audience === 'teachers' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                            {notice.audience}
                                        </span>
                                        <h5 className="font-bold text-gray-900">{notice.title}</h5>
                                    </div>
                                    <span className="text-xs text-gray-400 font-mono">{notice.date}</span>
                                </div>
                                <p className="text-sm text-gray-600 line-clamp-2 mb-4 leading-relaxed">
                                    {notice.content}
                                </p>
                                <div className="flex justify-between items-center text-[10px] text-gray-400 border-t pt-3">
                                    <span className="flex items-center gap-1">
                                        <LogIn size={12} className="opacity-50" /> Posted By: <strong className="text-gray-500">{notice.postedBy}</strong>
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
  }

  // --- IMPERSONATION LOGIC ---
  if (activeTab === 'impersonate' && role === 'developer') {
    if (viewMode === 'roles') {
        const roles: { id: Role, label: string, icon: any, color: string }[] = [
            { id: 'admin', label: 'Admin', icon: Shield, color: 'bg-red-100 text-red-700' },
            { id: 'teacher', label: 'Teacher', icon: BookOpen, color: 'bg-purple-100 text-purple-700' },
            { id: 'student', label: 'Student', icon: GraduationCap, color: 'bg-blue-100 text-blue-700' },
            { id: 'accountant', label: 'Accountant', icon: Calculator, color: 'bg-green-100 text-green-700' },
            { id: 'intern', label: 'Intern', icon: Briefcase, color: 'bg-teal-100 text-teal-700' },
        ];

        return (
            <div className="space-y-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <ScanFace className="text-galaxy-600" /> Act As User
                </h3>
                <p className="text-gray-500 text-sm">
                    Select a role to see available users. You can switch to their view without logging out.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {roles.map((r) => (
                        <button 
                            key={r.id}
                            onClick={() => { setSelectedRoleForImp(r.id); setViewMode('users'); setImpSearch(''); }}
                            className="flex flex-col items-center justify-center p-6 bg-white border rounded-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
                        >
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${r.color}`}>
                                <r.icon size={32} />
                            </div>
                            <span className="font-bold text-gray-800">{r.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        )
    }
    const filteredUsers = state.users.filter(u => {
        if (u.id === currentUser?.id) return false;
        const matchesRole = u.role === selectedRoleForImp;
        const searchLower = impSearch.toLowerCase();
        const matchesSearch = u.name.toLowerCase().includes(searchLower) || u.email.toLowerCase().includes(searchLower);
        return matchesRole && matchesSearch;
    });

    const handleImpersonate = (user: User) => {
        // Confirmation alert removed as requested.
        dispatch({ type: 'IMPERSONATE_USER', payload: user });
    };
    
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => setViewMode('roles')} className="p-2 rounded-full hover:bg-gray-200 transition-colors"><ChevronLeft size={24} /></button>
                <div><h3 className="text-xl font-bold">Select User</h3></div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input type="text" placeholder={`Search ${selectedRoleForImp}...`} className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none" value={impSearch} onChange={(e) => setImpSearch(e.target.value)} autoFocus />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsers.map(user => (
                    <div key={user.id} className="bg-white p-4 rounded-xl border hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                            <div><h4 className="font-bold text-gray-800">{user.name}</h4><p className="text-xs text-gray-500">{user.email}</p></div>
                        </div>
                        <button onClick={() => handleImpersonate(user)} className="w-full bg-galaxy-900 text-white py-2 rounded-lg hover:bg-galaxy-700 mt-2 text-sm">Act as {user.name.split(' ')[0]}</button>
                    </div>
                ))}
            </div>
        </div>
    )
  }

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

              {showSubjectManager && (
                  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-xl shadow-xl max-md w-full">
                          <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
                              <h3 className="font-bold">Subject Library</h3>
                              <button onClick={() => setShowSubjectManager(false)}><X size={18} /></button>
                          </div>
                          <div className="p-6">
                              <div className="flex gap-2 mb-4">
                                  <input type="text" placeholder="Subject Name" className="flex-1 border p-2 rounded" value={newSubject} onChange={e => setNewSubject(e.target.value)} />
                                  <select className="border p-2 rounded" value={newSubjectType} onChange={e => setNewSubjectType(e.target.value as SubjectType)}>
                                      <option value="Theory">Theory</option><option value="Practical">Practical</option>
                                  </select>
                                  <button onClick={handleAddSubject} className="bg-green-600 text-white px-3 py-2 rounded"><Plus size={18} /></button>
                              </div>
                              <div className="max-h-60 overflow-y-auto space-y-2">
                                  {state.availableSubjects.map(s => (
                                      <div key={s.name} className="flex justify-between items-center p-2 bg-gray-50 rounded border">
                                          <span>{s.name} <span className="text-xs text-gray-400">({s.type})</span></span>
                                          <button onClick={() => dispatch({ type: 'DELETE_SYSTEM_SUBJECT', payload: s.name })} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </div>
                  </div>
              )}

              {showClassManager && (
                  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
                          <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
                              <h3 className="font-bold">Class & Section Library</h3>
                              <button onClick={() => setShowClassManager(false)}><X size={18} /></button>
                          </div>
                          <div className="p-6">
                              <div className="flex gap-2 mb-6">
                                  <input type="text" placeholder="New Class (e.g. 11)" className="flex-1 border p-2 rounded" value={newClass} onChange={e => setNewClass(e.target.value)} />
                                  <button onClick={handleAddClass} className="bg-green-600 text-white px-3 py-2 rounded flex items-center gap-1"><Plus size={16} /> Add Class</button>
                              </div>
                              <div className="max-h-96 overflow-y-auto space-y-4">
                                  {state.systemClasses.map(c => (
                                      <div key={c.name} className="border rounded-lg overflow-hidden">
                                          <div className="bg-gray-100 p-3 flex justify-between items-center font-bold"><span>{c.name}</span><button onClick={() => dispatch({ type: 'DELETE_SYSTEM_CLASS', payload: c.name })} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={16} /></button></div>
                                          <div className="p-3 bg-white">
                                              <div className="flex flex-wrap gap-2 mb-2">{c.sections.map(sec => (<div key={sec} className="bg-blue-50 text-blue-800 text-xs px-2 py-1 rounded border border-blue-200 flex items-center gap-1">{sec}<button onClick={() => dispatch({ type: 'DELETE_CLASS_SECTION', payload: { className: c.name, section: sec } })} className="text-red-400 hover:text-red-600"><X size={12} /></button></div>))}</div>
                                              <div className="flex gap-2 mt-2">
                                                  <input type="text" placeholder={`Add section to ${c.name}`} className="flex-1 border p-1 rounded text-sm" value={activeClassForSection === c.name ? newSection : ''} onChange={e => { setActiveClassForSection(c.name); setNewSection(e.target.value); }} />
                                                  <button onClick={() => { setActiveClassForSection(c.name); handleAddSection(c.name); }} className="bg-blue-600 text-white px-2 py-1 rounded text-xs">Add</button>
                                              </div>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </div>
                  </div>
              )}

              {/* Password Reset Modal */}
              {resetPassUserId && (
                  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
                          <div className="bg-galaxy-900 text-white p-4 rounded-t-xl flex justify-between items-center">
                               <h3 className="font-bold flex items-center gap-2"><Key size={18} /> Reset User Password</h3>
                               <button onClick={() => { setResetPassUserId(null); setNewPasswordInput(''); }}><X size={18} /></button>
                          </div>
                          <div className="p-6">
                              <p className="text-sm text-gray-600 mb-4">
                                  You are resetting the password for this user. You cannot see their existing password.
                              </p>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">New Password</label>
                              <input 
                                type="text"
                                className="w-full border p-2 rounded mb-4 focus:ring-2 focus:ring-galaxy-500 outline-none"
                                value={newPasswordInput}
                                onChange={e => setNewPasswordInput(e.target.value)}
                                placeholder="Enter new password"
                              />
                              <div className="flex justify-end gap-2">
                                  <button onClick={() => { setResetPassUserId(null); setNewPasswordInput(''); }} className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50">Cancel</button>
                                  <button onClick={handleAdminResetPassword} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Set Password</button>
                              </div>
                          </div>
                      </div>
                  </div>
              )}

              {/* Delete / Drop Out Confirmation Modal */}
              {userToDelete && (
                  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in">
                      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                           <div className="bg-galaxy-900 text-white p-4 flex justify-between items-center">
                               <h3 className="font-bold flex items-center gap-2">
                                   <Trash2 size={18} /> Remove User Access
                               </h3>
                               <button onClick={() => setUserToDelete(null)} className="hover:text-red-200"><X size={20} /></button>
                           </div>
                           <div className="p-6">
                               <div className="flex items-start gap-4 mb-6">
                                   <div className="bg-amber-100 p-3 rounded-full text-amber-600 shrink-0">
                                       <AlertTriangle size={24} />
                                   </div>
                                   <div>
                                       <h4 className="font-bold text-gray-800 text-lg">{userToDelete.name}</h4>
                                       <p className="text-sm text-gray-500">{userToDelete.email} • {userToDelete.role.toUpperCase()}</p>
                                   </div>
                               </div>
                               
                               <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                                   How would you like to handle this user account?
                               </p>

                               <div className="space-y-3">
                                   <button 
                                     onClick={confirmDropUser}
                                     className="w-full flex items-center justify-between p-4 border border-amber-200 bg-amber-50 hover:bg-amber-100 rounded-xl transition-all group text-left"
                                   >
                                       <div>
                                           <span className="font-bold text-amber-800 block mb-1">Drop Out (Archive)</span>
                                           <span className="text-xs text-amber-700">Removes access but keeps data. User is hidden from active lists.</span>
                                       </div>
                                       <Archive size={20} className="text-amber-500 group-hover:scale-110 transition-transform"/>
                                   </button>

                                   <button 
                                     onClick={confirmDeleteUser}
                                     className="w-full flex items-center justify-between p-4 border border-red-200 bg-red-50 hover:bg-red-100 rounded-xl transition-all group text-left"
                                   >
                                       <div>
                                           <span className="font-bold text-red-800 block mb-1">Permanently Delete</span>
                                           <span className="text-xs text-red-700">Completely removes user and data. Cannot be undone.</span>
                                       </div>
                                       <Trash2 size={20} className="text-red-500 group-hover:scale-110 transition-transform"/>
                                   </button>
                               </div>

                               <button 
                                 onClick={() => setUserToDelete(null)}
                                 className="w-full mt-4 py-3 text-gray-500 font-medium hover:bg-gray-50 rounded-lg"
                               >
                                   Cancel
                               </button>
                           </div>
                      </div>
                  </div>
              )}

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
                                      <label className="block text-xs font-bold text-gray-500 uppercase">Primary Role</label>
                                      <select 
                                          value={reviewData.role || 'student'}
                                          onChange={e => setReviewData({...reviewData, role: e.target.value as any})}
                                          className="w-full border p-2 rounded mt-1 bg-white outline-none"
                                      >
                                          <option value="student">Student</option>
                                          <option value="intern">Intern</option>
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
                              
                              <div className="bg-gray-50 p-3 rounded-lg border">
                                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Allowed Roles (Access Control)</label>
                                  <div className="flex flex-wrap gap-2">
                                      {(['admin', 'teacher', 'accountant', 'student', 'intern'] as Role[]).map(r => {
                                          const isPrimary = reviewData.role === r;
                                          const isAllowed = reviewData.allowedRoles?.includes(r) || isPrimary;
                                          
                                          return (
                                              <button
                                                  key={r}
                                                  onClick={() => toggleAllowedRoleInReview(r)}
                                                  className={`px-3 py-1 text-xs rounded-full border transition-all ${
                                                      isPrimary 
                                                        ? 'bg-galaxy-800 text-white border-galaxy-800 cursor-not-allowed opacity-80' 
                                                        : isAllowed 
                                                            ? 'bg-galaxy-500 text-white border-galaxy-500' 
                                                            : 'bg-white text-gray-500 border-gray-300'
                                                  }`}
                                                  title={isPrimary ? "Primary role cannot be removed" : "Click to toggle access"}
                                              >
                                                  {r} {isAllowed && '✓'}
                                              </button>
                                          )
                                      })}
                                  </div>
                                  <p className="text-[10px] text-gray-400 mt-1">Users can switch between allowed roles in their dashboard.</p>
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

                                  {(reviewData.role === 'teacher' || reviewData.allowedRoles?.includes('teacher')) && (
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
                                              <div className="flex flex-wrap gap-1">
                                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase
                                                    ${u.role === 'student' ? 'bg-blue-100 text-blue-700' : 
                                                        u.role === 'teacher' ? 'bg-purple-100 text-purple-700' : 
                                                        u.role === 'intern' ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-700'}`}
                                                >
                                                    {u.role}
                                                </span>
                                                {u.allowedRoles && u.allowedRoles.filter(r => r !== u.role).map(r => (
                                                    <span key={r} className="px-2 py-1 rounded text-xs border border-gray-300 text-gray-500 uppercase">{r[0]}</span>
                                                ))}
                                              </div>
                                          </td>
                                          <td className="p-3 text-sm">
                                              {u.role === 'student' && <div>{u.classId} {u.section ? `- ${u.section}` : ''}</div>}
                                              {u.role === 'teacher' && <span className="text-xs text-gray-600">{u.subjects?.join(', ')}</span>}
                                          </td>
                                          <td className="p-3">
                                              <div className="flex gap-2">
                                                  <button onClick={() => openReviewModal(u)} className="text-galaxy-600 hover:bg-galaxy-100 p-2 rounded transition-colors" title="Edit User">
                                                      <Edit2 size={16} />
                                                  </button>
                                                  <button onClick={() => setResetPassUserId(u.id)} className="text-amber-500 hover:bg-amber-50 p-2 rounded transition-colors" title="Reset Password">
                                                      <Key size={16} />
                                                  </button>
                                                  <button onClick={() => handleDeleteClick(u)} className="text-red-500 hover:bg-red-50 p-2 rounded transition-colors" title="Delete or Drop User">
                                                      <Trash2 size={16} />
                                                  </button>
                                              </div>
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
       const pendingInvoices = state.invoices.filter(i => i.status === 'pending_delete');
       const roleRequests = state.roleRequests; 
       
       return (
          <div className="space-y-8">
              {roleRequests.length > 0 && (
                  <div>
                      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                          <UserCheck className="text-purple-600" /> Role Access Requests
                      </h3>
                      <div className="space-y-4">
                          {roleRequests.map(req => (
                              <div key={req.id} className="border border-purple-200 bg-purple-50 p-4 rounded-lg flex justify-between items-center shadow-sm">
                                  <div>
                                      <p className="font-bold text-purple-900">{req.userName}</p>
                                      <p className="text-sm text-purple-700">
                                          Current: <span className="font-bold uppercase">{req.currentRole}</span> 
                                          <span className="mx-2">→</span> 
                                          Requesting: <span className="font-bold uppercase text-galaxy-600">{req.requestedRole}</span>
                                      </p>
                                      <p className="text-xs text-purple-400 mt-1">Requested: {req.requestedAt}</p>
                                  </div>
                                  <div className="flex gap-2">
                                      <button 
                                        onClick={() => dispatch({ type: 'RESOLVE_ROLE_REQUEST', payload: { id: req.id, status: 'rejected' } })}
                                        className="bg-white border hover:bg-gray-100 text-gray-700 px-4 py-2 rounded text-sm font-medium"
                                      >
                                          Reject
                                      </button>
                                      <button 
                                        onClick={() => dispatch({ type: 'RESOLVE_ROLE_REQUEST', payload: { id: req.id, status: 'approved' } })}
                                        className="bg-purple-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-purple-700 shadow-sm"
                                      >
                                          Approve Access
                                      </button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              <div>
                  <h3 className="text-xl font-bold mb-4">Financial Approvals</h3>
                  {pendingFees.length === 0 && pendingInvoices.length === 0 && roleRequests.length === 0 ? <p className="text-gray-500">No pending approvals.</p> : (
                      <div className="space-y-4">
                          {pendingInvoices.map(inv => (
                              <div key={inv.id} className="border border-orange-200 bg-orange-50 p-4 rounded-lg flex justify-between items-center">
                                  <div>
                                      <p className="font-bold text-orange-900">Request: Delete Invoice</p>
                                      <p className="text-sm">{inv.title} - {inv.studentName} - Rs. {inv.amount}</p>
                                  </div>
                                  <div className="flex gap-2">
                                      <button 
                                        onClick={() => dispatch({ type: 'UPDATE_INVOICE_STATUS', payload: { id: inv.id, status: 'unpaid' } })} 
                                        className="bg-white border hover:bg-gray-100 text-gray-700 px-3 py-1 rounded"
                                      >
                                          Reject
                                      </button>
                                      <button 
                                        onClick={() => dispatch({ type: 'DELETE_INVOICE', payload: inv.id })}
                                        className="bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700"
                                      >
                                          Approve
                                      </button>
                                  </div>
                              </div>
                          ))}
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
          </div>
       )
  }

  if (activeTab === 'reports' || activeTab === 'exam_management') {
      return (
          <div className="space-y-8">
              <div className="bg-white p-6 rounded-xl border border-galaxy-200 shadow-sm">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                       <Calendar className="text-galaxy-600" /> Manage Exam Sessions
                  </h3>
                  
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

              <div className="bg-white p-6 rounded-xl border border-galaxy-200 shadow-sm">
                  <h3 className="text-xl font-bold mb-4">Publish Class Results</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-6">
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
                           <p className="text-xs text-gray-500 mb-2">
                               Results are hidden from students until published. Publishing applies to all students in the selected class/section.
                           </p>
                       </div>
                  </div>

                  {publishClassId && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in">
                        {state.examSessions.map(session => {
                            const reportsForSession = state.examReports.filter(r => 
                                (r.examSessionId && r.examSessionId === session.id) || 
                                r.term?.trim() === session.name?.trim()
                            );
                            const studentsInClass = state.users.filter(u => 
                                u.role === 'student' && 
                                u.classId?.trim() === publishClassId?.trim() && 
                                (!publishSection || u.section?.trim() === publishSection.trim())
                            );
                            const reportsForClass = reportsForSession.filter(r => studentsInClass.some(s => s.id === r.studentId));
                            const publishedCount = reportsForClass.filter(r => r.published === true || String(r.published) === 'true').length;
                            const totalReports = reportsForClass.length;
                            
                            const isFullyPublished = totalReports > 0 && publishedCount === totalReports;
                            const hasNoReports = totalReports === 0;

                            return (
                                <div key={session.id} className={`border rounded-xl p-4 transition-all ${
                                    isFullyPublished ? 'bg-green-50 border-green-200' : 
                                    hasNoReports ? 'bg-gray-50 border-gray-200 opacity-70' : 'bg-white border-yellow-200 shadow-sm'
                                }`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-gray-800">{session.name}</h4>
                                        {isFullyPublished ? <Check size={18} className="text-green-600" /> : <UploadCloud size={18} className="text-gray-400"/>}
                                    </div>
                                    <div className="text-xs space-y-1 mb-4">
                                        <p className="flex justify-between"><span className="text-gray-500">Students:</span><span className="font-mono">{studentsInClass.length}</span></p>
                                        <p className="flex justify-between"><span className="text-gray-500">Reports Found:</span><span className="font-mono">{totalReports}</span></p>
                                        <p className="flex justify-between font-bold"><span className="text-gray-500">Published:</span><span className={`${isFullyPublished ? 'text-green-600' : 'text-gray-400'}`}>{publishedCount} / {totalReports}</span></p>
                                    </div>
                                    <button 
                                      onClick={() => handlePublishClassResult(session, !isFullyPublished, totalReports)}
                                      disabled={hasNoReports}
                                      className={`w-full py-2 rounded text-sm font-bold transition-colors ${
                                          hasNoReports ? 'bg-gray-200 text-gray-400 cursor-not-allowed' :
                                          isFullyPublished ? 'bg-white border border-red-200 text-red-600 hover:bg-red-50' :
                                          'bg-galaxy-900 text-white hover:bg-galaxy-800'
                                      }`}
                                    >
                                        {hasNoReports ? 'No Data' : isFullyPublished ? 'Unpublish Results' : 'Publish Results'}
                                    </button>
                                </div>
                            );
                        })}
                      </div>
                  )}
              </div>
          </div>
      );
  }

  if ((activeTab === 'system' || activeTab === 'debug') && role === 'developer') {
      return (
          <div>
              <h3 className="text-xl font-bold mb-6 text-red-700 flex items-center gap-2">
                  <AlertTriangle /> Dangerous Zone
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border border-red-200 p-6 rounded-xl shadow-sm">
                      <h4 className="font-bold mb-2">Receipt Counter Reset</h4>
                      <p className="text-sm text-gray-600 mb-4">
                          Current Next Receipt #: <strong>{state.receiptCounter}</strong><br/>
                      </p>
                      <div className="flex gap-2">
                          <input type="number" value={resetVal} onChange={e => setResetVal(parseInt(e.target.value))} className="border p-2 rounded w-24" />
                          <button onClick={handleResetReceipt} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center gap-2"><RefreshCw size={16} /> Reset Counter</button>
                      </div>
                  </div>
              </div>
          </div>
      )
  }

  return <div>Welcome Admin</div>;
};

export default AdminView;
