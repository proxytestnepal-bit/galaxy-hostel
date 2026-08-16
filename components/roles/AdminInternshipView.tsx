import React, { useState } from 'react';
import { useAppStore } from '../../services/store';
import { Hotel } from '../../types';
import { Plus, Edit2, Trash2, X, Building2, RefreshCw, Radio, Check } from 'lucide-react';
import { CyclesManager } from './internships/CyclesManager';
import { AssignmentsManager } from './internships/AssignmentsManager';
import { ReviewManager } from './internships/ReviewManager';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const AdminInternshipView: React.FC = () => {
  const { state, refreshData, isSyncing, lastSyncedAt } = useAppStore();
  const [activeSubTab, setActiveSubTab] = useState<'hotels' | 'cycles' | 'assignments' | 'review'>('hotels');
  const [syncToast, setSyncToast] = useState<string | null>(null);

  const handleManualSync = async () => {
    await refreshData(false);
    setSyncToast('Submissions & data updated');
    setTimeout(() => setSyncToast(null), 3000);
  };

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Not yet synced';
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-galaxy-900">Internships Manager</h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Auto-Sync Live
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">Manage hotel partners, assignment cycles, and track evaluations in real time.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs text-gray-400">Last Synced</div>
            <div className="text-xs font-semibold text-gray-700">{formatLastSync(lastSyncedAt)}</div>
          </div>

          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border shadow-xs ${
              isSyncing 
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'bg-white text-galaxy-900 border-gray-300 hover:bg-galaxy-50 hover:border-galaxy-400 active:scale-95'
            }`}
            title="Check for new submissions from hotels and sync database"
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin text-gold-500' : 'text-galaxy-700'} />
            <span>{isSyncing ? 'Syncing...' : 'Check / Sync Data'}</span>
          </button>
        </div>
      </div>

      <div className="flex space-x-1 border-b border-gray-200">
        {[
          { id: 'hotels', label: 'Hotel Partners' },
          { id: 'cycles', label: 'Cycles & Criteria' },
          { id: 'assignments', label: 'Assignments' },
          { id: 'review', label: 'Review & Export' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
              activeSubTab === tab.id
                ? 'border-gold-500 text-galaxy-900 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {activeSubTab === 'hotels' && <HotelsManager />}
        {activeSubTab === 'cycles' && <CyclesManager />}
        {activeSubTab === 'assignments' && <AssignmentsManager />}
        {activeSubTab === 'review' && <ReviewManager />}
      </div>

      {syncToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-galaxy-900 text-white px-4 py-3 rounded-xl shadow-xl border border-galaxy-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <Check size={18} className="text-green-400 shrink-0" />
          <span className="text-sm font-medium">{syncToast}</span>
        </div>
      )}
    </div>
  );
};

const HotelsManager: React.FC = () => {
  const { state, dispatch } = useAppStore();
  const hotels = state.hotels || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [formData, setFormData] = useState({ name: '' });
  const [hotelToDelete, setHotelToDelete] = useState<{ id: string; name: string } | null>(null);

  const handleOpenModal = (hotel?: Hotel) => {
    if (hotel) {
      setEditingHotel(hotel);
      setFormData({ name: hotel.name });
    } else {
      setEditingHotel(null);
      setFormData({ name: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingHotel(null);
    setFormData({ name: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingHotel) {
      dispatch({
        type: 'UPDATE_HOTEL',
        payload: { ...editingHotel, name: formData.name }
      });
    } else {
      dispatch({
        type: 'ADD_HOTEL',
        payload: {
          id: `htl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: formData.name,
          contactPerson: '',
          email: ''
        }
      });
    }
    handleCloseModal();
  };

  const handleConfirmDelete = () => {
    if (hotelToDelete) {
      dispatch({ type: 'DELETE_HOTEL', payload: hotelToDelete.id });
      setHotelToDelete(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-galaxy-900 flex items-center gap-2">
          <Building2 size={20} className="text-gold-500" />
          Partner Hotels
        </h3>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-galaxy-900 text-white px-4 py-2 rounded-xl hover:bg-galaxy-800 transition-colors text-sm font-medium"
        >
          <Plus size={16} /> Add Hotel
        </button>
      </div>

      {hotels.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
          <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">No partner hotels added yet.</p>
          <p className="text-sm text-gray-400 mt-1">Add a hotel to start assigning interns.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hotels.map(hotel => (
            <div key={hotel.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <h4 className="font-bold text-galaxy-900 text-lg">{hotel.name}</h4>
                <div className="flex gap-1">
                  <button onClick={() => handleOpenModal(hotel)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100 transition-colors">
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => setHotelToDelete({ id: hotel.id, name: hotel.name })} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-galaxy-900 text-white p-4 flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2">
                <Building2 size={16} /> 
                {editingHotel ? 'Edit Hotel' : 'Add New Hotel'}
              </h3>
              <button onClick={handleCloseModal} className="hover:text-red-300">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hotel Name</label>
                <input
                  type="text"
                  required
                  className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. The Grand Palace"
                />
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-2 border rounded-lg hover:bg-gray-50 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-galaxy-900 text-white rounded-lg hover:bg-galaxy-800 text-sm font-bold"
                >
                  {editingHotel ? 'Save Changes' : 'Add Hotel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!hotelToDelete}
        title="Delete Hotel Partner"
        message={`Are you sure you want to delete "${hotelToDelete?.name}"? Assigned students and feedback records will remain stored.`}
        confirmText="Delete Hotel"
        type="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setHotelToDelete(null)}
      />
    </div>
  );
};
