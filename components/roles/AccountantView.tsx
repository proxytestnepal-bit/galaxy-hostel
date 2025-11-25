

import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../services/store';
import { User, Invoice, FeeRecord, InvoiceItem } from '../../types';
import { Plus, Trash2, Edit2, AlertTriangle, Printer, FileText, Download, User as UserIcon, Users, X } from 'lucide-react';

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

  // Helper to calculate total amount for an invoice
  const calculateTotalInvoiceAmount = (student: User) => {
      const payableFee = (student.annualFee || 0) - (student.discount || 0);
      const percentAmount = (payableFee * invoicePercent) / 100;
      const extrasAmount = feeBreakdown.reduce((acc, item) => acc + item.amount, 0);
      return Math.round(percentAmount + extrasAmount);
  };

  // Generate Single Invoice
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
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +15 days
          issuedAt: new Date().toISOString().split('T')[0],
          status: 'unpaid'
      };

      dispatch({ type: 'GENERATE_INVOICE', payload: newInvoice });
      alert(`Invoice generated for Rs. ${newInvoice.amount}`);
      setFeeBreakdown([]); // Reset
  };

  const handleDeleteInvoice = (id: string) => {
      if(window.confirm("Are you sure you want to delete this pending invoice?")) {
          dispatch({ type: 'DELETE_INVOICE', payload: id });
      }
  }

  // Bulk Generate Invoice
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
               feeBreakdown: [...feeBreakdown], // Copy the breakdown
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
      // Determine balance before this payment
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

  // Render Cash Receipt
  const renderReceipt = () => {
      if (!showReceipt) return null;
      const student = state.users.find(u => u.id === showReceipt.studentId);

      return (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden">
                  {/* Receipt Header */}
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

                  {/* Receipt Body */}
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
                              <p>Annual Fee: Rs. {student?.annualFee?.toLocaleString()}</p>
                              <p>Discount: Rs. {student?.discount?.toLocaleString()}</p>
                              <p className="font-bold text-red-600">Remaining Due: Rs. {showReceipt.remainingDueSnapshot?.toLocaleString()}</p>
                          </div>
                          <div className="text-center">
                              <div className="border-b border-gray-400 w-48 mb-2"></div>
                              <p className="text-xs uppercase font-bold text-gray-500">Authorized Signature</p>
                          </div>
                      </div>
                  </div>

                  {/* Footer */}
                  <div className="bg-gray-50 p-4 border-t flex justify-end gap-3 print:hidden">
                      <button onClick={() => setShowReceipt(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg">Close</button>
                      <button onClick={() => window.print()} className="px-4 py-2 bg-galaxy-600 text-white hover:bg-galaxy-700 rounded-lg flex items-center gap-2">
                          <Printer size={16} /> Print Receipt
                      </button>
                  </div>
              </div>
          </div>
      );
  };

  if(activeTab === 'approvals') {
       const pendingFees = state.fees.filter(f => f.status === 'pending_delete' || f.status === 'pending_edit');
       return (
          <div>
              <h3 className="text-xl font-bold mb-4">Pending Approvals</h3>
              {pendingFees.length === 0 ? <p className="text-gray-500">No pending approvals for fees.</p> : (
                  <div className="space-y-4">
                      {pendingFees.map(fee => (
                          <div key={fee.id} className="border border-red-200 bg-red-50 p-4 rounded-lg flex justify-between items-center">
                              <div>
                                  <p className="font-bold text-red-900">Request: {fee.status === 'pending_delete' ? 'Delete Receipt' : 'Edit Receipt'}</p>
                                  <p className="text-sm">Receipt #{fee.receiptNumber} - {fee.studentName} - Rs. {fee.amount}</p>
                              </div>
                              <div className="flex gap-2">
                                  <button className="bg-white border text-gray-600 px-3 py-1 rounded text-sm cursor-not-allowed">Wait for Admin</button>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
       )
  }

  if(activeTab === 'ledger' || activeTab === 'fees' || activeTab === 'finance_overview') {
      const studentInvoices = state.invoices.filter(i => i.studentId === selectedStudentId);
      const studentFees = state.fees.filter(f => f.studentId === selectedStudentId);
      
      const annualFee = selectedStudent?.annualFee || 0;
      const discount = selectedStudent?.discount || 0;
      const netPayable = annualFee - discount;
      const totalPaid = selectedStudent?.totalPaid || 0;
      const currentDue = netPayable - totalPaid;

      return (
          <div className="space-y-6">
              {renderReceipt()}

              {/* Bulk Operation Panel */}
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

              {/* Individual Student Selection */}
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
                      
                      {/* Left: Individual Invoice Generation */}
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
                                  
                                  {/* Inline Breakdown UI to prevent focus loss */}
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
                                          </div>
                                          <div className="flex items-center gap-4">
                                              <span className="font-bold">Rs. {inv.amount.toLocaleString()}</span>
                                              <div className="flex gap-2">
                                                  <button 
                                                    onClick={() => handleDeleteInvoice(inv.id)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                                    title="Delete Invoice"
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
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </div>

                      {/* Right: Payment & Ledger */}
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
                                                  <button onClick={() => setShowReceipt(fee)} className="text-galaxy-600 hover:underline flex items-center justify-end gap-1 w-full">
                                                      <Printer size={14} />
                                                  </button>
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

              {/* Payment Modal */}
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