
import React from 'react';
import { useAppStore } from '../services/store';
import { LogOut, User, LayoutDashboard, FileText, CreditCard, Bell, GraduationCap, Settings, Shield, UserPlus, PenTool } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { state, dispatch } = useAppStore();
  const { currentUser } = state;

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const role = currentUser?.role;

  const getNavItems = () => {
    const common = [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }];
    
    switch (role) {
      case 'student':
        return [
          ...common,
          { id: 'assignments', label: 'My Assignments', icon: FileText },
          { id: 'reports', label: 'Exam Reports', icon: GraduationCap },
          { id: 'fees', label: 'Fee Status', icon: CreditCard },
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
          { id: 'ledger', label: 'Student Ledger', icon: FileText },
        ];
      case 'administrator':
        return [
            ...common,
            { id: 'registration', label: 'Registration', icon: UserPlus },
            { id: 'users', label: 'Manage Users', icon: User },
            { id: 'reports', label: 'Exam Management', icon: GraduationCap },
            { id: 'notices', label: 'Issue Notices', icon: Bell },
        ];
      case 'admin':
        return [
          ...common,
          { id: 'registration', label: 'Admin Registration', icon: UserPlus },
          { id: 'approvals', label: 'Approvals', icon: Shield },
          { id: 'finance_overview', label: 'Finance Overview', icon: CreditCard },
          { id: 'system', label: 'System Control', icon: Settings },
        ];
      case 'developer':
          return [
              ...common,
              { id: 'users', label: 'Manage Users', icon: User }, // Added this line
              { id: 'debug', label: 'Debug & Reset', icon: Settings },
          ];
      default:
        return common;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-galaxy-900 text-white flex flex-col shadow-xl">
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
        
        <div className="p-4 bg-galaxy-800">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <User size={16} />
                </div>
                <div className="overflow-hidden">
                    <p className="text-sm font-medium truncate">{currentUser?.name}</p>
                    <p className="text-xs uppercase tracking-wider text-galaxy-200 opacity-70">{role}</p>
                </div>
            </div>
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
    </div>
  );
};

export default Layout;
