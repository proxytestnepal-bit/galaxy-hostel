

import React, { useState } from 'react';
import { useAppStore } from '../services/store';
import { LogOut, User, LayoutDashboard, FileText, CreditCard, Bell, GraduationCap, Settings, Shield, UserPlus, PenTool, ClipboardList, ScanFace, LogIn, ChevronDown, PlusCircle } from 'lucide-react';
import { Role } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { state, dispatch } = useAppStore();
  const { currentUser, originalUser } = state;
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showRequestRoleModal, setShowRequestRoleModal] = useState(false);
  const [requestedRole, setRequestedRole] = useState<Role>('teacher');

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const handleStopImpersonation = () => {
    dispatch({ type: 'STOP_IMPERSONATION' });
  };

  const role = currentUser?.role;
  const allowedRoles = currentUser?.allowedRoles || [role];

  const handleRoleSwitch = (newRole: Role) => {
      dispatch({ type: 'SWITCH_ACTIVE_ROLE', payload: newRole });
      setShowRoleMenu(false);
      setActiveTab('dashboard'); // Reset tab to prevent broken views
  };

  const handleSubmitRoleRequest = () => {
      if (!currentUser) return;

      // Developer Privilege: Instant Access
      const isDeveloper = currentUser.role === 'developer' || currentUser.allowedRoles?.includes('developer');

      if (isDeveloper) {
          const currentRoles = currentUser.allowedRoles || [currentUser.role];
          if (!currentRoles.includes(requestedRole)) {
              dispatch({
                  type: 'UPDATE_USER_DETAILS',
                  payload: {
                      id: currentUser.id,
                      allowedRoles: [...currentRoles, requestedRole]
                  }
              });
              alert(`Role '${requestedRole}' added successfully (Developer Privilege).`);
          } else {
              alert(`You already have the '${requestedRole}' role.`);
          }
          setShowRequestRoleModal(false);
          return;
      }

      dispatch({
          type: 'ADD_ROLE_REQUEST',
          payload: {
              id: `req_${Date.now()}`,
              userId: currentUser.id,
              userName: currentUser.name,
              currentRole: currentUser.role,
              requestedRole: requestedRole,
              status: 'pending',
              requestedAt: new Date().toISOString().split('T')[0]
          }
      });
      setShowRequestRoleModal(false);
      alert('Role request submitted for approval.');
  };

  const getNavItems = () => {
    const common = [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }];
    
    switch (role) {
      case 'student':
        return [
          ...common,
          { id: 'assignments', label: 'My Assignments', icon: FileText },
          { id: 'reports', label: 'Exam Reports', icon: GraduationCap },
          { id: 'fees', label: 'Fee Status', icon: CreditCard },
          { id: 'ledger', label: 'Class Ledger', icon: FileText },
          { id: 'notices', label: 'Notices', icon: Bell },
        ];
      case 'teacher':
        return [
          ...common,
          { id: 'assignments', label: 'Manage Assignments', icon: FileText },
          { id: 'submissions', label: 'Submissions & Grading', icon: GraduationCap },
          { id: 'marks_entry', label: 'Marks Entry', icon: PenTool },
          { id: 'notices', label: 'Notices', icon: Bell },
        ];
      case 'accountant':
        return [
          ...common,
          { id: 'fees', label: 'Fees & Invoices', icon: CreditCard },
          { id: 'approvals', label: 'Pending Approvals', icon: UserCheck },
          { id: 'ledger', label: 'Student Ledger', icon: FileText },
        ];
      case 'admin':
        return [
          ...common,
          { id: 'registration', label: 'Registration & Users', icon: UserPlus },
          { id: 'approvals', label: 'Approvals', icon: Shield },
          { id: 'finance_overview', label: 'Finance Overview', icon: CreditCard },
          { id: 'exam_management', label: 'Exam Management', icon: GraduationCap },
          { id: 'issue_notices', label: 'Issue Notices', icon: Bell },
        ];
      case 'intern':
          return [
              ...common,
              { id: 'work_logs', label: 'Work Logs', icon: ClipboardList },
              { id: 'notices', label: 'Notices', icon: Bell },
          ];
      case 'developer':
          return [
              ...common,
              { id: 'users', label: 'Manage Users', icon: User }, 
              { id: 'impersonate', label: 'Act As User', icon: ScanFace },
              { id: 'debug', label: 'Debug & Reset', icon: Settings },
          ];
      default:
        return common;
    }
  };

  // Icon for Accountant Approval
  const UserCheck = ({ size }: { size: number }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-galaxy-900 text-white flex flex-col shadow-xl z-20">
        <div className="p-6 border-b border-galaxy-800">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-gold-400 rounded-lg flex items-center justify-center text-galaxy-900 font-bold text-xl">
                G
             </div>
             <div>
                 <h1 className="font-bold text-lg leading-tight">Galaxy Hotel</h1>
                 <p className="text-xs text-galaxy-100 opacity-75">& Tourism School</p>
             </div>
          </div>
        </div>
        
        <div className="p-4 bg-galaxy-800 relative">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                        <User size={16} />
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-medium truncate">{currentUser?.name}</p>
                        <p className="text-xs uppercase tracking-wider text-galaxy-200 opacity-70 flex items-center gap-1">
                            {role}
                            {allowedRoles.length > 1 && <ChevronDown size={10} className="inline" />}
                        </p>
                    </div>
                </div>
                
                {allowedRoles.length > 1 && (
                    <button 
                        onClick={() => setShowRoleMenu(!showRoleMenu)} 
                        className="text-galaxy-300 hover:text-white"
                    >
                        <Settings size={16} />
                    </button>
                )}
            </div>

            {/* Role Switcher Menu */}
            {showRoleMenu && (
                <div className="absolute top-full left-0 right-0 bg-white text-gray-800 shadow-xl rounded-b-lg border border-galaxy-200 py-2 z-50">
                    <p className="px-4 py-2 text-xs font-bold text-gray-500 uppercase border-b mb-1">Switch View</p>
                    {allowedRoles.map(r => (
                        <button
                            key={r}
                            onClick={() => handleRoleSwitch(r)}
                            className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-gray-100 ${role === r ? 'font-bold text-galaxy-600 bg-blue-50' : ''}`}
                        >
                            <span className="capitalize">{r}</span>
                            {role === r && <div className="w-2 h-2 rounded-full bg-green-500"></div>}
                        </button>
                    ))}
                    {role !== 'student' && (
                        <div className="border-t mt-1 pt-1">
                             <button 
                                onClick={() => { setShowRoleMenu(false); setShowRequestRoleModal(true); }}
                                className="w-full text-left px-4 py-2 text-xs text-blue-600 hover:bg-gray-100 flex items-center gap-1"
                             >
                                 <PlusCircle size={12} /> Request Access
                             </button>
                        </div>
                    )}
                </div>
            )}
            
            {/* Single Role Request Button (if no multi-role) */}
            {allowedRoles.length === 1 && role !== 'student' && (
                 <button 
                    onClick={() => setShowRequestRoleModal(true)}
                    className="mt-2 text-xs text-galaxy-300 hover:text-white flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity"
                 >
                     <PlusCircle size={10} /> Add Role
                 </button>
            )}

            {originalUser && (
                <button 
                    onClick={handleStopImpersonation}
                    className="mt-3 w-full bg-red-600 hover:bg-red-700 text-white text-xs py-2 rounded flex items-center justify-center gap-2 font-bold animate-pulse"
                >
                    <LogOut size={12} /> Exit View Mode
                </button>
            )}
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {getNavItems().map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                activeTab === item.id
                  ? 'bg-gold-500 text-galaxy-900 font-semibold shadow-md'
                  : 'text-galaxy-100 hover:bg-galaxy-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-galaxy-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-red-300 hover:bg-red-900/20 transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen">
        <div className="p-8 max-w-7xl mx-auto">
           {children}
        </div>
      </main>

      {/* Role Request Modal */}
      {showRequestRoleModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
                  <h3 className="text-lg font-bold mb-4">Request Additional Role</h3>
                  <p className="text-sm text-gray-600 mb-4">
                      Need access to another dashboard? Select the role you need. An admin will review your request.
                  </p>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Role</label>
                  <select 
                      className="w-full border p-2 rounded mb-4"
                      value={requestedRole}
                      onChange={e => setRequestedRole(e.target.value as Role)}
                  >
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                      <option value="accountant">Accountant</option>
                      <option value="student">Student</option>
                      <option value="intern">Intern</option>
                  </select>
                  <div className="flex gap-2">
                      <button 
                        onClick={() => setShowRequestRoleModal(false)}
                        className="flex-1 py-2 border rounded hover:bg-gray-50"
                      >
                          Cancel
                      </button>
                      <button 
                        onClick={handleSubmitRoleRequest}
                        className="flex-1 py-2 bg-galaxy-600 text-white rounded hover:bg-galaxy-700"
                      >
                          Submit Request
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Layout;