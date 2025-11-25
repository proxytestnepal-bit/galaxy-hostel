
import { AppState, User } from '../types';

export const INITIAL_USERS: User[] = [
  { id: 'u1', name: 'Super Admin', role: 'admin', email: 'admin@galaxy.edu.np', password: 'password', status: 'active' },
  { id: 'u2', name: 'Suresh Pradhan', role: 'administrator', email: 'suresh@galaxy.edu.np', password: 'password', status: 'active' },
  { id: 'u3', name: 'Ramesh Adhikari', role: 'accountant', email: 'ramesh@galaxy.edu.np', password: 'password', status: 'active' },
  { id: 'u4', name: 'Sarita Sharma', role: 'teacher', email: 'sarita@galaxy.edu.np', password: 'password', status: 'active', subjects: ['Hotel Management', 'Culinary Arts'] },
  { id: 'u5', name: 'Bishal Gurung', role: 'teacher', email: 'bishal@galaxy.edu.np', password: 'password', status: 'active', subjects: ['Chemistry', 'Food Science'] },
  { 
    id: 'u6', 
    name: 'Ram Thapa', 
    role: 'student', 
    email: 'ram@galaxy.edu.np', 
    password: 'password',
    status: 'active',
    classId: 'Class 10A',
    annualFee: 100000,
    discount: 5000,
    totalPaid: 30000
  },
  { 
    id: 'u7', 
    name: 'Sita Karki', 
    role: 'student', 
    email: 'sita@galaxy.edu.np', 
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
      title: 'History of Hospitality in Nepal',
      description: 'Write a 500-word essay on the evolution of 5-star hotels in Kathmandu and Pokhara.',
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
      studentName: 'Sita Karki',
      content: 'The hospitality industry in Nepal began with the opening of Royal Hotel...',
      submittedAt: '2023-11-02',
    }
  ],
  invoices: [
     {
       id: 'inv1',
       studentId: 'u6',
       studentName: 'Ram Thapa',
       title: 'First Term Fee (30%)',
       amount: 30000,
       dueDate: '2023-10-15',
       issuedAt: '2023-10-01',
       status: 'paid'
     },
     {
      id: 'inv2',
      studentId: 'u7',
      studentName: 'Sita Karki',
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
      studentName: 'Ram Thapa',
      amount: 30000,
      description: 'First Term Fee Payment',
      date: '2023-10-05',
      status: 'paid',
      remainingDueSnapshot: 65000 // 95k - 30k
    }
  ],
  examSessions: [
    {
      id: 'es1',
      name: 'First Term 2024',
      type: 'Term Exam',
      status: 'closed', // Previous exam
      startDate: '2023-10-01'
    },
    {
      id: 'es2',
      name: 'Second Term 2024',
      type: 'Term Exam',
      status: 'open', // Currently active
      startDate: '2024-02-15'
    }
  ],
  examReports: [
    {
      id: 'e1',
      studentId: 'u7',
      term: 'First Term 2024',
      examSessionId: 'es1',
      scores: { 'Hotel Management': 95, 'Food Science': 98 },
      remarks: 'Excellent performance.',
      published: true,
    }
  ],
  notices: [
    {
      id: 'n1',
      title: 'Dashain & Tihar Vacation',
      content: 'School will remain closed for the upcoming Dashain and Tihar festivals starting from next week.',
      date: '2023-10-01',
      postedBy: 'Suresh Pradhan',
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
