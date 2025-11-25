
import React, { useState } from 'react';
import { useAppStore } from '../../services/store';
import { ClipboardList, Plus, Calendar, Clock, Briefcase } from 'lucide-react';

interface Props {
  activeTab: string;
}

const InternView: React.FC<Props> = ({ activeTab }) => {
  const { state, dispatch } = useAppStore();
  const { currentUser } = state;

  const [logForm, setLogForm] = useState({
      date: new Date().toISOString().split('T')[0],
      department: '',
      shift: 'Morning',
      description: '',
      hours: 8
  });

  const handleSubmitLog = (e: React.FormEvent) => {
      e.preventDefault();
      if(!currentUser) return;
      
      dispatch({
          type: 'ADD_WORK_LOG',
          payload: {
              id: `wl${Date.now()}`,
              studentId: currentUser.id,
              ...logForm
          }
      });
      setLogForm({ ...logForm, description: '', department: '' }); // Reset partial
      alert('Work log added successfully');
  };

  const myLogs = state.workLogs
    .filter(log => log.studentId === currentUser?.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (activeTab === 'work_logs') {
      return (
          <div className="space-y-8">
              {/* Add New Log Form */}
              <div className="bg-white p-6 rounded-xl border shadow-sm">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Plus className="text-galaxy-600" /> New Work Log
                  </h3>
                  <form onSubmit={handleSubmitLog} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700">Date</label>
                          <input 
                            type="date" 
                            required
                            className="w-full border p-2 rounded mt-1"
                            value={logForm.date}
                            onChange={e => setLogForm({...logForm, date: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700">Department</label>
                          <select 
                            required
                            className="w-full border p-2 rounded mt-1"
                            value={logForm.department}
                            onChange={e => setLogForm({...logForm, department: e.target.value})}
                          >
                              <option value="">-- Select Department --</option>
                              <option value="Front Office">Front Office</option>
                              <option value="Housekeeping">Housekeeping</option>
                              <option value="Food Production">Food Production (Kitchen)</option>
                              <option value="F&B Service">F&B Service</option>
                              <option value="Concierge">Concierge</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700">Shift</label>
                          <select 
                            className="w-full border p-2 rounded mt-1"
                            value={logForm.shift}
                            onChange={e => setLogForm({...logForm, shift: e.target.value})}
                          >
                              <option value="Morning">Morning</option>
                              <option value="Afternoon">Afternoon</option>
                              <option value="Evening">Evening</option>
                              <option value="Night">Night</option>
                              <option value="Split">Split</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700">Hours Worked</label>
                          <input 
                            type="number" 
                            className="w-full border p-2 rounded mt-1"
                            value={logForm.hours}
                            onChange={e => setLogForm({...logForm, hours: Number(e.target.value)})}
                          />
                      </div>
                      <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">Work Description / Tasks Completed</label>
                          <textarea 
                            required
                            rows={3}
                            className="w-full border p-2 rounded mt-1"
                            placeholder="Describe what you learned or did today..."
                            value={logForm.description}
                            onChange={e => setLogForm({...logForm, description: e.target.value})}
                          />
                      </div>
                      <div className="md:col-span-2">
                          <button type="submit" className="bg-galaxy-600 text-white px-6 py-2 rounded hover:bg-galaxy-700">
                              Submit Log
                          </button>
                      </div>
                  </form>
              </div>

              {/* Log History */}
              <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-galaxy-900 text-white p-4">
                      <h4 className="font-bold flex items-center gap-2">
                          <ClipboardList size={20} /> My Work History
                      </h4>
                  </div>
                  {myLogs.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">No work logs submitted yet.</div>
                  ) : (
                      <div className="divide-y">
                          {myLogs.map(log => (
                              <div key={log.id} className="p-4 hover:bg-gray-50">
                                  <div className="flex justify-between items-start mb-2">
                                      <div className="flex gap-4">
                                          <div className="flex items-center gap-1 text-sm font-bold text-gray-700">
                                              <Calendar size={14} className="text-galaxy-500" /> {log.date}
                                          </div>
                                          <div className="flex items-center gap-1 text-sm text-gray-600 bg-blue-50 px-2 rounded">
                                              <Briefcase size={14} /> {log.department}
                                          </div>
                                      </div>
                                      <div className="flex items-center gap-1 text-sm font-medium text-gray-500">
                                          <Clock size={14} /> {log.shift} ({log.hours}h)
                                      </div>
                                  </div>
                                  <p className="text-gray-800 text-sm">{log.description}</p>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          </div>
      );
  }

  if (activeTab === 'notices') {
      return (
          <div className="space-y-4">
               <h3 className="font-bold text-xl mb-4">Notices</h3>
               {state.notices.map(n => (
                  <div key={n.id} className="bg-white border p-4 rounded-lg shadow-sm">
                      <div className="flex justify-between items-start">
                          <h4 className="font-bold text-lg text-galaxy-900">{n.title}</h4>
                          <span className="text-xs text-gray-500">{n.date}</span>
                      </div>
                      <p className="mt-2 text-gray-700">{n.content}</p>
                      <p className="mt-2 text-xs text-gray-400">Posted by: {n.postedBy}</p>
                  </div>
              ))}
          </div>
      )
  }

  return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-white p-6 rounded-xl shadow-sm border text-center">
               <h3 className="text-gray-500 font-medium">Total Hours Logged</h3>
               <p className="text-4xl font-bold text-galaxy-600 mt-2">
                   {myLogs.reduce((acc, curr) => acc + curr.hours, 0)}
               </p>
           </div>
           <div className="bg-white p-6 rounded-xl shadow-sm border text-center">
               <h3 className="text-gray-500 font-medium">Days Worked</h3>
               <p className="text-4xl font-bold text-green-600 mt-2">
                   {myLogs.length}
               </p>
           </div>
      </div>
  );
};

export default InternView;
