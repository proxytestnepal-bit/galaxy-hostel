
import { AppState, User } from '../types';

export const INITIAL_USERS: User[] = [
  { id: 'u1', name: 'Super Admin', role: 'admin', email: 'admin@galaxy.edu.np', password: 'password', status: 'active' },
  { id: 'u2', name: 'Principal Skinner', role: 'administrator', email: 'principal@galaxy.edu.np', password: 'password', status: 'active' },
  { id: 'u3', name: 'John Accountant', role: 'accountant', email: 'accounts@galaxy.edu.np', password: 'password', status: 'active' },
  { id: 'u4', name: 'Mrs. Krabappel', role: 'teacher', email: 'edna@galaxy.edu.np', password: 'password', status: 'active', subjects: ['Hotel Management', 'Culinary Arts'] },
  { id: 'u5', name: 'Walter White', role: 'teacher', email: 'walter@galaxy.edu.np', password: 'password', status: 'active', subjects: ['Chemistry', 'Food Science'] },
  { 
    id: 'u6', 
    name: 'Bart Simpson', 
    role: 'student', 
    email: 'bart@galaxy.edu.np', 
    password: 'password',
    status: 'active',
    classId: 'Class 10A',
    annualFee: 100000,
    discount: 5000,
    totalPaid: 30000
  },
  { 
    id: 'u7', 
    name: 'Lisa Simpson', 
    role: 'student', 
    email: 'lisa@galaxy.edu.np', 
    password: 'password',
    status: 'active',
    classId: 'Class 10A',
    annualFee: 100000,
    discount: 20000, // Scholarship
    totalPaid: 0
  },
  { id: 'u8', name: 'Dheejan Developer', role: 'developer', email: 'dheejan@gmail.com', password: 'password', status: 'active' },
];

export const INITIAL_STATE: AppState = {
  currentUser: null,
  users: INITIAL_USERS,
  assignments: [
    {
      id: 'a1',
      title: 'History of Hospitality',
      description: 'Write a 500-word essay on the evolution of 5-star hotels in Nepal.',
      subject: 'Hotel Management',
      teacherId: 'u4',
      targetClassId: 'Class 10A',
      dueDate: '2023-11-15',
      createdAt: '2023-11-01',
    }
  ],
  submissions: [
    {
      id: 's1',
      assignmentId: 'a1',
      studentId: 'u7',
      studentName: 'Lisa Simpson',
      content: 'The hospitality industry in Nepal began with...',
      submittedAt: '2023-11-02',
    }
  ],
  invoices: [
     {
       id: 'inv1',
       studentId: 'u6',
       studentName: 'Bart Simpson',
       title: 'First Term Fee (30%)',
       amount: 30000,
       dueDate: '2023-10-15',
       issuedAt: '2023-10-01',
       status: 'paid'
     },
     {
      id: 'inv2',
      studentId: 'u7',
      studentName: 'Lisa Simpson',
      title: 'First Term Fee (30%)',
      amount: 24000, // (100k - 20k) * 30%
      dueDate: '2023-10-15',
      issuedAt: '2023-10-01',
      status: 'unpaid'
    }
  ],
  fees: [
    {
      id: 'f1',
      receiptNumber: 1001,
      invoiceId: 'inv1',
      studentId: 'u6',
      studentName: 'Bart Simpson',
      amount: 30000,
      description: 'First Term Fee Payment',
      date: '2023-10-05',
      status: 'paid',
      remainingDueSnapshot: 65000 // 95k - 30k
    }
  ],
  examReports: [
    {
      id: 'e1',
      studentId: 'u7',
      term: 'First Term',
      scores: { 'Hotel Management': 95, 'Food Science': 98 },
      remarks: 'Excellent performance.',
      published: true,
    }
  ],
  notices: [
    {
      id: 'n1',
      title: 'Winter Vacation',
      content: 'School will remain closed from Jan 1st to Jan 15th.',
      date: '2023-12-01',
      postedBy: 'Principal Skinner',
      audience: 'all',
    }
  ],
  receiptCounter: 1002,
  availableSubjects: [
    'Hotel Management',
    'Culinary Arts',
    'Food & Beverage Service',
    'Front Office Operations',
    'Housekeeping',
    'Travel & Tourism',
    'Food Science',
    'Business Communication',
    'Hospitality Marketing',
    'Accounting',
    'Chemistry'
  ]
};
