
import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../services/store';
import { User, Invoice, FeeRecord, InvoiceItem } from '../../types';
import { Plus, Trash2, Edit2, AlertTriangle, Printer, FileText, Download, User as UserIcon, Users, X, UserPlus, Eye, CheckCircle, GraduationCap, DollarSign } from 'lucide-react';

interface Props {
  activeTab: string;
}

const PREDEFINED_FEE_HEADS = [
    "Admission Fee",
    "Monthly Fee",
    "Exam Fee",
    "Viva Fee",
    "Practical Fee", 
    "Tour Fee", 
    "Transportation", 
    "Medical", 
    "Fine", 
    "ID Card", 
    "Uniform", 
    "Books", 
    "Other"
];

const AccountantView: React.FC<Props> = ({ activeTab }) => {
  const { state, dispatch } = useAppStore();
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  
  // Invoice Form State
  const [invoicePercent, setInvoicePercent] = useState<number>(30);
  const [invoiceTitle, setInvoiceTitle] = useState('Term Fee');
  
  // Breakdown State
  const [feeBreakdown, setFeeBreakdown] = useState<InvoiceItem[]>([]);
  const [selectedHead, setSelectedHead] = useState('');
  const [newFeeItem, setNewFeeItem] = useState({ description: '', amount: 0 });
  
  // Bulk Invoice State
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  
  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [paymentDesc, setPaymentDesc] = useState('');

  // Receipt Modal State
  const [showReceipt, setShowReceipt] = useState<FeeRecord | null>(null);

  // --- NEW: Student Approval States ---
  const [reviewUser, setReviewUser] = useState<User | null>(null);
  const [reviewData, setReviewData] = useState<Partial<User>>({});

  const students = state.users.filter(u => u.role === 'student' && u.status === 'active');
  const selectedStudent = students.find(s => s.id === selectedStudentId);
  
  // Get system classes
  const classes = state.systemClasses;
  const selectedClassData = classes.find(c => c.name === selectedClassId);

  // Auto-fill description when dropdown changes
  useEffect(() => {
      if (selectedHead && selectedHead !== 'Other') {
          setNewFeeItem(prev => ({ ...prev, description: selectedHead }));
      } else if (selectedHead === 'Other') {
          setNewFeeItem(prev => ({ ...prev, description: '' }));
      }
  }, [selectedHead]);

  const addFeeItem = () => {
      if(newFeeItem.description && newFeeItem.amount) {
          setFeeBreakdown([...feeBreakdown, { ...newFeeItem }]);
          setNewFeeItem({ description: '', amount: 0 });
          setSelectedHead('');
      }
  };

  const removeFeeItem = (index: number) => {
      setFeeBreakdown(feeBreakdown.filter((_, i) => i !== index));
  };

  const calculateTotalInvoiceAmount = (student: User) => {
      const payableFee = (student.annualFee || 0) - (student.discount || 0);
      const percentAmount = (payableFee * invoicePercent) / 100;
      const extrasAmount = feeBreakdown.reduce((acc, item) => acc + item.amount, 0);
      return Math.round(percentAmount + extrasAmount);
  };

  const handleGenerateInvoice = () => {
      if (!selectedStudent || !selectedStudent.annualFee) return;
      
      const amount = calculateTotalInvoiceAmount(selectedStudent);
      
      const newInvoice: Invoice = {
          id: `inv${Date.now()}`,
          studentId: selectedStudent.id,
          studentName: selectedStudent.name,
          title: invoiceTitle,
          amount: amount,
          feeBreakdown: [...feeBreakdown],
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          issuedAt: new Date().toISOString().split('T')[0],
          status: 'unpaid'
      };

      dispatch({ type: 'GENERATE_INVOICE', payload: newInvoice });
      alert(`Invoice generated for Rs. ${newInvoice.amount}`);
      setFeeBreakdown([]); 
  };

  const handleDeleteInvoiceRequest = (id: string) => {
      if(window.confirm("Send request to delete this invoice?")) {
          dispatch({ type: 'REQUEST_DELETE_INVOICE', payload: id });
      }
  }

  const handleDeleteFeeRequest = (id: string) => {
      if(window.confirm("Send request to delete this payment receipt?")) {
          dispatch({ type: 'REQUEST_DELETE_FEE', payload: id });
      }
  }

  const handleBulkInvoice = () => {
      if (!selectedClassId) return;
      
      const targetStudents = students.filter(s => {
          const matchClass = s.classId === selectedClassId;
          const matchSection = !selectedSection || s.section === selectedSection;
          return matchClass && matchSection;
      });
      
      if (targetStudents.length === 0) {
          alert("No students found in this class/section.");
          return;
      }
      
      const newInvoices: Invoice[] = [];
      const timestamp = Date.now();
      
      targetStudents.forEach((student, index) => {
           if (!student.annualFee) return;
           const amount = calculateTotalInvoiceAmount(student);
           
           newInvoices.push({
               id: `inv${timestamp}_${index}`,
               studentId: student.id,
               studentName: student.name,
               title: invoiceTitle,
               amount: amount,
               feeBreakdown: [...feeBreakdown],
               dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
               issuedAt: new Date().toISOString().split('T')[0],
               status: 'unpaid'
           });
      });

      if (newInvoices.length > 0) {
          if(window.confirm(`Generate ${newInvoices.length} invoices for ${selectedClassId} ${selectedSection ? `(${selectedSection})` : ''}?`)) {
              dispatch({ type: 'BULK_GENERATE_INVOICE', payload: newInvoices });
              alert(`Successfully generated ${newInvoices.length} invoices.`);
              setFeeBreakdown([]);
          }
      }
  };

  const handlePayment = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedStudent) return;
      
      const amt = parseFloat(paymentAmount);
      const totalPayable = (selectedStudent.annualFee || 0) - (selectedStudent.discount || 0);
      const previousPaid = selectedStudent.totalPaid || 0;
      const balanceAfterPayment = totalPayable - previousPaid - amt;

      const newFee: FeeRecord = {
          id: `f${Date.now()}`,
          receiptNumber: state.receiptCounter, 
          invoiceId: selectedInvoiceId || undefined,
          studentId: selectedStudent.id,
          studentName: selectedStudent.name,
          amount: amt,
          description: paymentDesc || 'General Fee Payment',
          date: new Date().toISOString().split('T')[0],
          status: 'paid',
          remainingDueSnapshot: balanceAfterPayment
      };

      dispatch({ type: 'ADD_FEE', payload: newFee });
      setShowPaymentModal(false);
      setShowReceipt(newFee); 
      setPaymentAmount('');
      setPaymentDesc('');
      setSelectedInvoiceId('');
  };

  const handlePrint = () => {
    if (!showReceipt) return;
    const student = state.users.find(u => u.id === showReceipt.studentId);
    
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
        const content = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Receipt #${showReceipt.receiptNumber}</title>
              <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
              <style>
                body { font-family: 'Inter', sans-serif; padding: 40px; background: #fff; color: #1f2937; }
                .container { max-width: 800px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; box-sizing: border-box; }
                .header { background: #0c4a6e; color: white; padding: 32px; display: flex; justify-content: space-between; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .logo { background: #fbbf24; color: #0c4a6e; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; border-radius: 8px; margin-right: 16px; }
                .table { width: 100%; border-collapse: collapse; margin-top: 24px; }
                .table th { text-align: left; background: #f3f4f6; padding: 12px; font-size: 12px; text-transform: uppercase; color: #6b7280; -webkit-print-color-adjust: exact; print-color-adjust: exact; border-bottom: 1px solid #e5e7eb; }
                .table td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
                .footer { background-color: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                   <div style="display: flex; align-items: center;">
                      <div class="logo">G</div>
                      <div>
                         <h1 style="margin: 0; font-size: 20px;">Galaxy Hotel</h1>
                         <p style="margin: 0; opacity: 0.8; font-size: 14px;">& Tourism School</p>
                      </div>
                   </div>
                   <div style="text-align: right;">
                      <h2 style="margin: 0; font-family: monospace; font-size: 24px;">RECEIPT</h2>
                      <p style="margin: 0; font-size: 14px;">#${showReceipt.receiptNumber}</p>
                      <p style="margin: 0; font-size: 14px;">${showReceipt.date}</p>
                   </div>
                </div>
                <div style="padding: 32px;">
                   <div style="display: flex; justify-content: space-between; margin-bottom: 32px;">
                      <div>
                         <div style="font-size: 12px; color: #6b7280; text-transform: uppercase;">Received From</div>
                         <div style="font-size: 18px; font-weight: bold; margin-top: 4px;">${showReceipt.studentName}</div>
                         <div style="color: #4b5563; font-size: 14px;">${student?.classId || ''} ${student?.section ? `- ${student.section}` : ''}</div>
                      </div>
                      <div style="text-align: right;">
                         <div style="font-size: 12px; color: #6b7280; text-transform: uppercase;">Payment Method</div>
                         <div style="font-size: 16px; font-weight: 600; margin-top: 4px;">Cash / Bank Transfer</div>
                      </div>
                   </div>
                   <table class="table">
                      <thead>
                         <tr><th>Description</th><th style="text-align: right;">Amount</th></tr>
                      </thead>
                      <tbody>
                         <tr>
                            <td>${showReceipt.description}</td>
                            <td style="text-align: right; font-weight: bold;">Rs. ${showReceipt.amount.toLocaleString()}</td>
                         </tr>
                      </tbody>
                   </table>
                   <div style="margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end;">
                      <div style="font-size: 14px; color: #4b5563;">
                         <div style="color: #dc2626; font-weight: bold;">Remaining Due: Rs. ${showReceipt.remainingDueSnapshot?.toLocaleString() || 'N/A'}</div>
                      </div>
                      <div style="text-align: center;">
                         <div style="border-bottom: 1px solid #9ca3af; width: 200px; margin-bottom: 8px;"></div>
                         <div style="font-size: 12px; text-transform: uppercase; color: #6b7280;">Authorized Signature</div>
                      </div>
                   </div>
                </div>
                <div class="footer">
                  Thank you for your payment. This is a computer generated receipt.
                </div>
              </div>
              <script>window.onload = () => { window.print(); window.close(); }</script>
            </body>
          </html>
        `;
        printWindow.document.write(content);
        printWindow.document.close();
    } else {
        alert("Please allow popups to print receipt.");
    }
  };

  const renderReceipt = () => {
      if (!showReceipt) return null;
      const student = state.users.find(u => u.id === showReceipt.studentId);

      return (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden">
                  <div className="bg-galaxy-900 text-white p-6 flex justify-between items-center print:bg-white print:text-black">
                      <div className="flex gap-4 items-center">
                          <div className="w-12 h-12 bg-gold-400 rounded-lg flex items-center justify-center text-galaxy-900 font-bold text-2xl">G</div>
                          <div>
                              <h2 className="text-2xl font-bold">Galaxy Hotel & Tourism School</h2>
                              <p className="text-sm opacity-80">Biratnagar, Koshi, Nepal</p>
                          </div>
                      </div>
                      <div className="text-right">
                          <h3 className="text-xl font-mono font-bold tracking-widest uppercase">Cash Receipt</h3>
                          <p className="text-sm">No: #{showReceipt.receiptNumber}</p>
                          <p className="text-sm">Date: {showReceipt.date}</p>
                      </div>
                  </div>

                  <div className="p-8 space-y-6">
                      <div className="flex justify-between border-b pb-4">
                          <div>
                              <p className="text-xs text-gray-500 uppercase">Received From</p>
                              <p className="text-lg font-bold">{showReceipt.studentName}</p>
                              <p className="text-sm text-gray-600">{student?.classId} {student?.section ? `- ${student.section}` : ''}</p>
                          </div>
                          <div className="text-right">
                              <p className="text-xs text-gray-500 uppercase">Payment Method</p>
                              <p className="font-medium">Cash / Bank Transfer</p>
                          </div>
                      </div>

                      <table className="w-full">
                          <thead>
                              <tr className="bg-gray-100 text-left text-xs uppercase text-gray-600">
                                  <th className="p-3">Description</th>
                                  <th className="p-3 text-right">Amount (NPR)</th>
                              </tr>
                          </thead>
                          <tbody>
                              <tr>
                                  <td className="p-3 border-b">{showReceipt.description}</td>
                                  <td className="p-3 border-b text-right font-bold">{showReceipt.amount.toLocaleString()}</td>
                              </tr>
                          </tbody>
                      </table>

                      <div className="flex justify-between items-end pt-4">
                          <div className="text-sm text-gray-600 space-y-1">
                              <p className="font-bold text-red-600">Remaining Due: Rs. {showReceipt.remainingDueSnapshot?.toLocaleString()}</p>
                          </div>
                          <div className="text-center">
                              <div className="border-b border-gray-400 w-48 mb-2"></div>
                              <p className="text-xs uppercase font-bold text-gray-500">Authorized Signature</p>
                          </div>
                      </div>
                  </div>

                  <div className="bg-gray-50 p-4 border-t flex justify-end gap-3 print:hidden">
                      <button onClick={() => setShowReceipt(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg">Close</button>
                      <button onClick={handlePrint} className="px-4 py-2 bg-galaxy-600 text-white hover:bg-galaxy-700 rounded-lg flex items-center gap-2">
                          <Printer size={16} /> Print Receipt
                      </button>
                  </div>
              </div>
          </div>
      );
  };

  // --- NEW: Handle Student Approvals ---
  const handleRejectStudent = (id: string) => {
      if(window.confirm('Are you sure you want to reject this registration?')) {
          dispatch({ type: 'REJECT_USER', payload: id });
      }
  };

  const openReviewModal = (user: User) => {
      setReviewUser(user);
      setReviewData({ ...user });
  };

  const confirmStudentApproval = () => {
      if (!reviewUser) return;
      
      const updates: Partial<User> = { 
          ...reviewData,
          annualFee: Number(reviewData.annualFee || 0),
          discount: Number(reviewData.discount || 0)
      };
      
      // Remove status from updates to let APPROVE_USER handle it
      delete updates.status; 

      dispatch({ type: 'APPROVE_USER', payload: { id: reviewUser.id, updates } });
      setReviewUser(null);
      setReviewData({});
      alert("Student registration approved and financial profile created.");
  };

  if(activeTab === 'approvals') {
       const pendingFees = state.fees.filter(f => f.status === 'pending_delete' || f.status === 'pending_edit');
       const pendingInvoices = state.invoices.filter(i => i.status === 'pending_delete');
       const pendingStudents = state.users.filter(u => u.status === 'pending' && u.role === 'student');

       return (
          <div className="space-y-8">
              {/* Student Registration Approvals Section */}
              <div className="bg-white p-6 rounded-xl border border-galaxy-100 shadow-sm">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <UserPlus className="text-galaxy-600" /> New Student Registrations
                  </h3>
                  {pendingStudents.length === 0 ? (
                      <p className="text-gray-500 italic text-sm">No new student registrations to approve.</p>
                  ) : (
                      <div className="grid gap-4">
                          {pendingStudents.map(u => (
                              <div key={u.id} className="flex items-center justify-between border p-4 rounded-lg bg-blue-50/50 border-blue-100">
                                  <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-blue-200 text-blue-600">
                                          <GraduationCap size={20} />
                                      </div>
                                      <div>
                                          <p className="font-bold text-gray-800">{u.name}</p>
                                          <p className="text-sm text-gray-600">{u.email}</p>
                                          <p className="text-xs text-gray-400">Class Interest: {u.classId || 'Not Specified'}</p>
                                      </div>
                                  </div>
                                  <div className="flex gap-2">
                                      <button onClick={() => handleRejectStudent(u.id)} className="px-3 py-1 bg-white border border-red-200 text-red-600 rounded hover:bg-red-50 text-sm">Reject</button>
                                      <button onClick={() => openReviewModal(u)} className="px-3 py-1 bg-galaxy-600 text-white rounded hover:bg-galaxy-700 text-sm flex items-center gap-1 font-semibold">
                                          <Eye size={14} /> Review & Approve
                                      </button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>

              {/* Financial Request Approvals Section */}
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <AlertTriangle className="text-orange-500" /> Pending Deletion Requests
                  </h3>
                  {pendingFees.length === 0 && pendingInvoices.length === 0 ? (
                      <p className="text-gray-500 italic text-sm">No pending deletion requests.</p>
                  ) : (
                      <div className="space-y-4">
                          {pendingInvoices.map(inv => (
                              <div key={inv.id} className="border border-orange-200 bg-orange-50 p-4 rounded-lg flex justify-between items-center">
                                  <div>
                                      <p className="font-bold text-orange-900">Invoice Deletion Request</p>
                                      <p className="text-sm">{inv.title} - {inv.studentName} - Rs. {inv.amount}</p>
                                  </div>
                                  <div className="flex gap-2">
                                      <span className="bg-white border text-gray-400 px-3 py-1 rounded text-xs font-bold uppercase">Pending Admin</span>
                                  </div>
                              </div>
                          ))}
                          {pendingFees.map(fee => (
                              <div key={fee.id} className="border border-red-200 bg-red-50 p-4 rounded-lg flex justify-between items-center">
                                  <div>
                                      <p className="font-bold text-red-900">Payment Deletion Request</p>
                                      <p className="text-sm">Receipt #{fee.receiptNumber} - {fee.studentName} - Rs. {fee.amount}</p>
                                  </div>
                                  <div className="flex gap-2">
                                      <span className="bg-white border text-gray-400 px-3 py-1 rounded text-xs font-bold uppercase">Pending Admin</span>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>

              {/* Approval Modal for Accountants */}
              {reviewUser && (
                  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
                          <div className="bg-galaxy-900 text-white p-6 flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                  <UserPlus className="text-gold-400" />
                                  <h3 className="text-xl font-bold">Approve Student Registration</h3>
                              </div>
                              <button onClick={() => setReviewUser(null)} className="hover:bg-white/10 p-1 rounded"><X size={20} /></button>
                          </div>
                          
                          <div className="p-8 space-y-6">
                              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border">
                                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border text-galaxy-900">
                                      <UserIcon size={24} />
                                  </div>
                                  <div>
                                      <p className="font-bold text-gray-900">{reviewUser.name}</p>
                                      <p className="text-sm text-gray-500">{reviewUser.email}</p>
                                  </div>
                              </div>

                              <div className="space-y-4">
                                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                      <DollarSign size={14} /> Financial Configuration
                                  </h4>
                                  <div className="grid grid-cols-2 gap-4">
                                      <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-1">Annual Fee (Rs)</label>
                                          <input 
                                              type="number" 
                                              value={reviewData.annualFee || 0}
                                              onChange={e => setReviewData({...reviewData, annualFee: Number(e.target.value)})}
                                              className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-galaxy-500 outline-none"
                                              placeholder="100,000"
                                          />
                                      </div>
                                      <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-1">Scholarship / Discount (Rs)</label>
                                          <input 
                                              type="number" 
                                              value={reviewData.discount || 0}
                                              onChange={e => setReviewData({...reviewData, discount: Number(e.target.value)})}
                                              className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-galaxy-500 outline-none"
                                              placeholder="0"
                                          />
                                      </div>
                                  </div>

                                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest pt-2 flex items-center gap-2">
                                      <GraduationCap size={14} /> Academic Assignment
                                  </h4>
                                  <div className="grid grid-cols-2 gap-4">
                                      <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-1">Assign Class</label>
                                          <select
                                              value={reviewData.classId || ''}
                                              onChange={e => setReviewData({...reviewData, classId: e.target.value, section: ''})}
                                              className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-galaxy-500 outline-none bg-white"
                                          >
                                              <option value="">-- Choose Class --</option>
                                              {state.systemClasses.map(cls => (
                                                  <option key={cls.name} value={cls.name}>{cls.name}</option>
                                              ))}
                                          </select>
                                      </div>
                                      <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                                          <select
                                              value={reviewData.section || ''}
                                              onChange={e => setReviewData({...reviewData, section: e.target.value})}
                                              className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-galaxy-500 outline-none bg-white"
                                              disabled={!state.systemClasses.find(c => c.name === reviewData.classId)?.sections.length}
                                          >
                                              <option value="">-- Choose Section --</option>
                                              {state.systemClasses.find(c => c.name === reviewData.classId)?.sections.map(sec => (
                                                  <option key={sec} value={sec}>{sec}</option>
                                              ))}
                                          </select>
                                      </div>
                                  </div>
                              </div>

                              <div className="flex gap-3 pt-6 border-t">
                                  <button onClick={() => setReviewUser(null)} className="flex-1 py-3 border rounded-xl hover:bg-gray-50 font-medium text-gray-600 transition-colors">Cancel</button>
                                  <button onClick={confirmStudentApproval} className="flex-1 py-3 bg-galaxy-900 text-white rounded-xl hover:bg-galaxy-800 font-bold flex items-center justify-center gap-2 shadow-lg shadow-galaxy-900/20 transition-all">
                                      <CheckCircle size={18} /> Confirm & Approve
                                  </button>
                              </div>
                          </div>
                      </div>
                  </div>
              )}
          </div>
       )
  }

  if(activeTab === 'ledger' || activeTab === 'fees' || activeTab === 'finance_overview') {
      const studentInvoices = state.invoices.filter(i => i.studentId === selectedStudentId);
      const studentFees = state.fees
          .filter(f => f.studentId === selectedStudentId)
          .sort((a, b) => {
              const dateA = new Date(a.date).getTime();
              const dateB = new Date(b.date).getTime();
              if (dateB !== dateA) return dateB - dateA;
              return b.receiptNumber - a.receiptNumber;
          });
      
      const annualFee = selectedStudent?.annualFee || 0;
      const discount = selectedStudent?.discount || 0;
      const netPayable = annualFee - discount;
      const totalPaid = selectedStudent?.totalPaid || 0;
      const currentDue = netPayable - totalPaid;

      return (
          <div className="space-y-6">
              {renderReceipt()}

              <div className="bg-galaxy-50 border border-galaxy-200 p-6 rounded-xl shadow-sm">
                  <h4 className="font-bold text-galaxy-900 mb-4 flex items-center gap-2">
                       <Users size={20} /> Class-wise Invoice Generation
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                      <div className="md:col-span-1">
                          <label className="text-sm text-gray-600">Select Class</label>
                          <select 
                            className="w-full border p-2 rounded mt-1"
                            value={selectedClassId}
                            onChange={e => { setSelectedClassId(e.target.value); setSelectedSection(''); }}
                          >
                              <option value="">-- Choose Class --</option>
                              {classes.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                          </select>
                          <label className="text-sm text-gray-600 mt-2 block">Select Section</label>
                          <select 
                            className="w-full border p-2 rounded mt-1"
                            value={selectedSection}
                            onChange={e => setSelectedSection(e.target.value)}
                            disabled={!selectedClassData || selectedClassData.sections.length === 0}
                          >
                              <option value="">All Sections</option>
                              {selectedClassData?.sections.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                      </div>
                      
                      <div className="md:col-span-1">
                          <label className="text-sm text-gray-600">Invoice Title</label>
                          <input type="text" value={invoiceTitle} onChange={e => setInvoiceTitle(e.target.value)} className="w-full border p-2 rounded mt-1" />
                          <label className="text-sm text-gray-600 mt-2 block">% of Annual Fee</label>
                          <input type="number" value={invoicePercent} onChange={e => setInvoicePercent(Number(e.target.value))} className="w-full border p-2 rounded mt-1" />
                      </div>

                      <div className="md:col-span-2">
                          <div className="bg-white p-4 rounded-lg border mb-4 shadow-sm">
                              <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Additional Fee Heads (Optional)</label>
                              <div className="space-y-2 mb-2">
                                  {feeBreakdown.map((item, idx) => (
                                      <div key={idx} className="flex justify-between items-center bg-gray-50 p-2 rounded border text-sm">
                                          <span>{item.description}</span>
                                          <div className="flex items-center gap-3">
                                              <span className="font-mono">Rs. {item.amount}</span>
                                              <button onClick={() => removeFeeItem(idx)} className="text-red-500 hover:text-red-700"><X size={14}/></button>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                              <div className="flex gap-2 mb-2">
                                  <select 
                                      className="flex-1 border p-1 text-sm rounded"
                                      value={selectedHead}
                                      onChange={e => setSelectedHead(e.target.value)}
                                  >
                                      <option value="">-- Select Fee Head --</option>
                                      {PREDEFINED_FEE_HEADS.map(head => <option key={head} value={head}>{head}</option>)}
                                  </select>
                              </div>
                              <div className="flex gap-2">
                                  <input 
                                      type="text" 
                                      placeholder="Description" 
                                      className="flex-1 border p-1 text-sm rounded"
                                      value={newFeeItem.description}
                                      onChange={e => setNewFeeItem({...newFeeItem, description: e.target.value})}
                                  />
                                  <input 
                                      type="number" 
                                      placeholder="Amount" 
                                      className="w-24 border p-1 text-sm rounded"
                                      value={newFeeItem.amount || ''}
                                      onChange={e => setNewFeeItem({...newFeeItem, amount: Number(e.target.value)})}
                                  />
                                  <button onClick={addFeeItem} className="bg-blue-600 text-white px-2 py-1 rounded text-sm"><Plus size={16}/></button>
                              </div>
                          </div>
                          <div className="text-right">
                              <button 
                                onClick={handleBulkInvoice}
                                disabled={!selectedClassId}
                                className="bg-galaxy-600 text-white px-4 py-2 rounded hover:bg-galaxy-700 disabled:opacity-50"
                              >
                                  Generate Bulk Invoices
                              </button>
                          </div>
                      </div>
                  </div>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4 items-center flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Student</label>
                      <select 
                        className="w-full border p-2 rounded-lg"
                        value={selectedStudentId}
                        onChange={e => setSelectedStudentId(e.target.value)}
                      >
                          <option value="">-- Choose Student --</option>
                          {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.classId} {s.section ? `- ${s.section}` : ''})</option>)}
                      </select>
                  </div>
                  {selectedStudent && (
                      <div className="flex gap-4 px-4 border-l flex-wrap">
                         <div>
                             <p className="text-xs text-gray-500">Annual Fee</p>
                             <p className="text-lg font-bold">Rs. {annualFee.toLocaleString()}</p>
                         </div>
                         <div>
                             <p className="text-xs text-gray-500">Paid</p>
                             <p className="text-lg font-bold text-green-600">Rs. {totalPaid.toLocaleString()}</p>
                         </div>
                         <div>
                             <p className="text-xs text-gray-500">Balance</p>
                             <p className="text-lg font-bold text-red-600">Rs. {currentDue.toLocaleString()}</p>
                         </div>
                      </div>
                  )}
              </div>

              {selectedStudent ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-6">
                          <div className="bg-white p-6 rounded-xl border shadow-sm">
                              <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                                  <FileText size={20} className="text-galaxy-600" />
                                  Single Invoice
                              </h4>
                              <div className="space-y-4">
                                  <div className="flex gap-4">
                                      <div className="flex-1">
                                          <label className="text-sm text-gray-600">Title</label>
                                          <input 
                                            type="text" 
                                            value={invoiceTitle} onChange={e => setInvoiceTitle(e.target.value)}
                                            className="w-full border p-2 rounded mt-1"
                                          />
                                      </div>
                                      <div className="w-1/3">
                                          <label className="text-sm text-gray-600">% Fee</label>
                                          <input 
                                            type="number" 
                                            value={invoicePercent} onChange={e => setInvoicePercent(Number(e.target.value))}
                                            className="w-full border p-2 rounded mt-1"
                                          />
                                      </div>
                                  </div>
                                  
                                  <div className="bg-gray-50 p-4 rounded-lg border mb-4">
                                      <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Additional Fee Heads (Optional)</label>
                                      <div className="space-y-2 mb-2">
                                          {feeBreakdown.map((item, idx) => (
                                              <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border text-sm">
                                                  <span>{item.description}</span>
                                                  <div className="flex items-center gap-3">
                                                      <span className="font-mono">Rs. {item.amount}</span>
                                                      <button onClick={() => removeFeeItem(idx)} className="text-red-500 hover:text-red-700"><X size={14}/></button>
                                          </div>
                                              </div>
                                          ))}
                                      </div>
                                      <div className="flex gap-2 mb-2">
                                            <select 
                                                className="flex-1 border p-1 text-sm rounded"
                                                value={selectedHead}
                                                onChange={e => setSelectedHead(e.target.value)}
                                            >
                                                <option value="">-- Select Fee Head --</option>
                                                {PREDEFINED_FEE_HEADS.map(head => <option key={head} value={head}>{head}</option>)}
                                            </select>
                                      </div>
                                      <div className="flex gap-2">
                                          <input 
                                              type="text" 
                                              placeholder="e.g. Viva, Tour, Medicine" 
                                              className="flex-1 border p-1 text-sm rounded"
                                              value={newFeeItem.description}
                                              onChange={e => setNewFeeItem({...newFeeItem, description: e.target.value})}
                                          />
                                          <input 
                                              type="number" 
                                              placeholder="Amount" 
                                              className="w-24 border p-1 text-sm rounded"
                                              value={newFeeItem.amount || ''}
                                              onChange={e => setNewFeeItem({...newFeeItem, amount: Number(e.target.value)})}
                                          />
                                          <button onClick={addFeeItem} className="bg-blue-600 text-white px-2 py-1 rounded text-sm"><Plus size={16}/></button>
                                      </div>
                                  </div>

                                  <button 
                                    onClick={handleGenerateInvoice}
                                    className="w-full bg-galaxy-600 text-white px-4 py-2 rounded hover:bg-galaxy-700"
                                  >
                                      Generate Invoice
                                  </button>
                              </div>
                          </div>

                          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                              <div className="p-4 bg-gray-50 border-b font-bold text-gray-700">Pending Invoices</div>
                              <div className="divide-y max-h-64 overflow-y-auto">
                                  {studentInvoices.filter(i => i.status !== 'paid').map(inv => (
                                      <div key={inv.id} className="p-4 flex justify-between items-center group">
                                          <div>
                                              <p className="font-medium">{inv.title}</p>
                                              <p className="text-xs text-gray-500">Due: {inv.dueDate}</p>
                                              {inv.feeBreakdown && inv.feeBreakdown.length > 0 && (
                                                  <div className="text-xs text-gray-500 mt-1">
                                                      Includes: {inv.feeBreakdown.map(i => i.description).join(', ')}
                                                  </div>
                                              )}
                                              {inv.status === 'pending_delete' && <span className="text-xs bg-red-100 text-red-600 px-1 rounded">Deletion Requested</span>}
                                          </div>
                                          <div className="flex items-center gap-4">
                                              <span className="font-bold">Rs. {inv.amount.toLocaleString()}</span>
                                              {inv.status === 'unpaid' ? (
                                                  <div className="flex gap-2">
                                                      <button 
                                                        onClick={() => handleDeleteInvoiceRequest(inv.id)}
                                                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                                        title="Request Delete Invoice"
                                                      >
                                                          <Trash2 size={16} />
                                                      </button>
                                                      <button 
                                                        onClick={() => {
                                                            setPaymentAmount(inv.amount.toString());
                                                            setPaymentDesc(`Payment for ${inv.title}`);
                                                            setSelectedInvoiceId(inv.id);
                                                            setShowPaymentModal(true);
                                                        }}
                                                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                                                      >
                                                          Pay
                                                      </button>
                                                  </div>
                                              ) : (
                                                  <div className="text-xs text-gray-400 italic">Processing</div>
                                              )}
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </div>

                      <div className="space-y-6">
                           <div className="bg-white p-6 rounded-xl border shadow-sm flex justify-between items-center">
                               <div>
                                   <h4 className="font-bold text-lg">Collect Payment</h4>
                                   <p className="text-sm text-gray-500">Manual Entry</p>
                               </div>
                               <button 
                                onClick={() => {
                                    setPaymentAmount('');
                                    setPaymentDesc('');
                                    setSelectedInvoiceId('');
                                    setShowPaymentModal(true);
                                }}
                                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 shadow-md flex items-center gap-2"
                               >
                                   <Plus size={18} /> Receive Payment
                               </button>
                           </div>

                           <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                              <div className="p-4 bg-gray-50 border-b font-bold text-gray-700">Payment History</div>
                              <table className="w-full text-left text-sm">
                                  <thead className="bg-gray-50 text-gray-500">
                                      <tr>
                                          <th className="p-3">Date</th>
                                          <th className="p-3">Receipt #</th>
                                          <th className="p-3 text-right">Amount</th>
                                          <th className="p-3 text-right">Action</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y">
                                      {studentFees.map(fee => (
                                          <tr key={fee.id}>
                                              <td className="p-3">{fee.date}</td>
                                              <td className="p-3 font-mono">{fee.receiptNumber}</td>
                                              <td className="p-3 text-right font-bold">Rs. {fee.amount.toLocaleString()}</td>
                                              <td className="p-3 text-right">
                                                  <div className="flex justify-end gap-2">
                                                      <button onClick={() => setShowReceipt(fee)} className="text-galaxy-600 hover:text-galaxy-800" title="Print Receipt">
                                                          <Printer size={16} />
                                                      </button>
                                                      {fee.status !== 'pending_delete' ? (
                                                          <button onClick={() => handleDeleteFeeRequest(fee.id)} className="text-red-400 hover:text-red-600" title="Request Delete">
                                                              <Trash2 size={16} />
                                                          </button>
                                                      ) : (
                                                          <span className="text-xs text-red-300 cursor-not-allowed"><Trash2 size={16} /></span>
                                                      )}
                                                  </div>
                                              </td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                           </div>
                      </div>
                  </div>
              ) : (
                  <div className="flex flex-col items-center justify-center h-64 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl">
                      <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                          <UserIcon size={32} className="text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-medium">Please select a student above to manage fees.</p>
                  </div>
              )}

              {showPaymentModal && selectedStudent && (
                  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                      <div className="bg-white p-6 rounded-xl w-96 shadow-xl">
                          <h3 className="text-lg font-bold mb-4">Receive Payment</h3>
                          <form onSubmit={handlePayment} className="space-y-4">
                              <div>
                                  <label className="block text-sm text-gray-600">Student</label>
                                  <input type="text" value={selectedStudent.name} disabled className="w-full border p-2 rounded bg-gray-100" />
                              </div>
                              <div>
                                  <label className="block text-sm text-gray-600">Amount (NPR)</label>
                                  <input 
                                    type="number" 
                                    value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)}
                                    className="w-full border p-2 rounded font-bold text-lg"
                                    required
                                  />
                              </div>
                              <div>
                                  <label className="block text-sm text-gray-600">Description</label>
                                  <input 
                                    type="text" 
                                    value={paymentDesc} onChange={e => setPaymentDesc(e.target.value)}
                                    placeholder="e.g. Monthly Tuition"
                                    className="w-full border p-2 rounded"
                                    required
                                  />
                              </div>
                              <div className="flex gap-2 pt-2">
                                  <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 bg-gray-200 py-2 rounded">Cancel</button>
                                  <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded">Confirm Payment</button>
                              </div>
                          </form>
                      </div>
                  </div>
              )}
          </div>
      );
  }

  return <div>Not Implemented View</div>;
};

export default AccountantView;
