

import { AppState, User, Subject } from '../types';

const INITIAL_SUBJECTS: Subject[] = [
  { name: 'Account', type: 'Theory' },
  { name: 'English', type: 'Theory' },
  { name: 'Nepali', type: 'Theory' },
  { name: 'Social Studies', type: 'Theory' },
  { name: 'Travel Tourism and Mountaineering', type: 'Theory' },
  { name: 'Hotel Management', type: 'Theory' },
  { name: 'Front Office', type: 'Theory' },
  { name: 'Food and Beverage Service', type: 'Practical' },
  { name: 'House Keeping', type: 'Practical' },
  { name: 'Food Production', type: 'Practical' },
  { name: 'English for Hospitality', type: 'Theory' },
  { name: 'Personal Development', type: 'Theory' },
  { name: 'Entrepreneurship', type: 'Theory' },
  { name: 'Event Management', type: 'Theory' },
  { name: 'Hospitality Management', type: 'Theory' },
  { name: 'Food Science and Nutrition', type: 'Theory' },
  { name: 'French for Hospitality', type: 'Theory' },
  { name: 'Chemistry', type: 'Theory' },
  { name: 'Business Communication', type: 'Theory' }
];

export const INITIAL_USERS: User[] = [
  { id: 'u1', name: 'Super Admin', role: 'admin', allowedRoles: ['admin', 'teacher', 'accountant'], email: 'admin@galaxy.edu.np', password: 'password', status: 'active' },
  { id: 'u2', name: 'Suresh Pradhan', role: 'admin', allowedRoles: ['admin'], email: 'suresh@galaxy.edu.np', password: 'password', status: 'active' }, 
  { id: 'u3', name: 'Ramesh Adhikari', role: 'accountant', allowedRoles: ['accountant'], email: 'ramesh@galaxy.edu.np', password: 'password', status: 'active' },
  { id: 'u4', name: 'Sarita Sharma', role: 'teacher', allowedRoles: ['teacher'], email: 'sarita@galaxy.edu.np', password: 'password', status: 'active', subjects: ['Hotel Management', 'Food Production'] },
  { id: 'u5', name: 'Bishal Gurung', role: 'teacher', allowedRoles: ['teacher'], email: 'bishal@galaxy.edu.np', password: 'password', status: 'active', subjects: ['Chemistry', 'Food Science and Nutrition'] },
  { 
    id: 'u6', 
    name: 'Ram Kafle', 
    role: 'student',
    allowedRoles: ['student'],
    email: 'ram@galaxy.edu.np', 
    password: 'password',
    status: 'active',
    classId: '12',
    section: 'Emirates',
    annualFee: 100000,
    discount: 5000,
    totalPaid: 30000
  },
  { 
    id: 'u7', 
    name: 'Gita Acharya', 
    role: 'student', 
    allowedRoles: ['student'],
    email: 'gita@galaxy.edu.np', 
    password: 'password',
    status: 'active',
    classId: '12',
    section: 'Marriott',
    annualFee: 100000,
    discount: 20000, // Scholarship
    totalPaid: 0
  },
  { id: 'u8', name: 'Gita Singh', role: 'developer', allowedRoles: ['developer', 'admin'], email: 'dheejan@gmail.com', password: 'password', status: 'active' },
  { id: 'u9', name: 'Hari Shrestha', role: 'intern', allowedRoles: ['intern'], email: 'hari@galaxy.edu.np', password: 'password', status: 'active' },
];

export const INITIAL_STATE: AppState = {
  currentUser: null,
  originalUser: null,
  users: INITIAL_USERS,
  assignments: [
    {
      id: 'a1',
      title: 'History of Hospitality in Nepal',
      description: 'Write a 500-word essay on the evolution of 5-star hotels in Kathmandu and Pokhara.',
      subject: 'Hotel Management',
      teacherId: 'u4',
      targetClassId: '12',
      dueDate: '2023-11-15',
      createdAt: '2023-11-01',
    }
  ],
  submissions: [
    {
      id: 's1',
      assignmentId: 'a1',
      studentId: 'u7',
      studentName: 'Gita Acharya',
      content: 'The hospitality industry in Nepal began with the opening of Royal Hotel...',
      submittedAt: '2023-11-02',
    }
  ],
  invoices: [
     {
       id: 'inv1',
       studentId: 'u6',
       studentName: 'Ram Kafle',
       title: 'First Term Fee (30%)',
       amount: 30000,
       dueDate: '2023-10-15',
       issuedAt: '2023-10-01',
       status: 'paid'
     },
     {
      id: 'inv2',
      studentId: 'u7',
      studentName: 'Gita Acharya',
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
      studentName: 'Ram Kafle',
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
      scores: { 
        'Hotel Management': { obtained: 95, fullMarks: 100, passMarks: 40 }, 
        'Food Science and Nutrition': { obtained: 98, fullMarks: 100, passMarks: 40 } 
      },
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
  roleRequests: [],
  receiptCounter: 1002,
  availableSubjects: INITIAL_SUBJECTS,
  systemClasses: [
    { name: '11', sections: ['Accor', 'Jumeirah', 'Hyatt', 'Fourseasons'] },
    { name: '12', sections: ['Emirates', 'Marriott', 'Sheraton'] },
    { name: 'HDHM-SEM1', sections: [] },
    { name: 'HDHM-SEM2', sections: [] },
    { name: 'HDHM-SEM3', sections: [] }
  ],
  workLogs: [
    {
        id: 'wl1',
        studentId: 'u9',
        date: '2024-03-01',
        department: 'Front Office',
        shift: 'Morning',
        description: 'Assisted with guest check-ins and handled 5 luggage transfers.',
        hours: 8
    }
  ]
};