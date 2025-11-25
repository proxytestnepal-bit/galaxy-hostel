

import React, { useState } from 'react';
import { useAppStore } from '../services/store';
import Layout from './Layout';
import StudentView from './roles/StudentView';
import TeacherView from './roles/TeacherView';
import AccountantView from './roles/AccountantView';
import AdminView from './roles/AdminView';
import InternView from './roles/InternView';
import { User, Shield, Briefcase, GraduationCap, Code } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { state } = useAppStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const role = state.currentUser?.role;

  const renderContent = () => {
    switch (role) {
      case 'student':
        return <StudentView activeTab={activeTab} />;
      case 'teacher':
        return <TeacherView activeTab={activeTab} />;
      case 'accountant':
        return <AccountantView activeTab={activeTab} />;
      case 'admin':
      case 'developer':
        return <AdminView activeTab={activeTab} role={role} />;
      case 'intern':
        return <InternView activeTab={activeTab} />;
      default:
        return <div>Access Denied or Unknown Role</div>;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 capitalize">
          {activeTab.replace('_', ' ')}
        </h2>
        <p className="text-gray-500 mt-1">
          Welcome back, {state.currentUser?.name}.
        </p>
      </header>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-h-[500px]">
        {renderContent()}
      </div>
    </Layout>
  );
};

export default Dashboard;