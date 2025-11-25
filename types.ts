
export type Role = 'admin' | 'administrator' | 'accountant' | 'teacher' | 'student' | 'guest' | 'developer';

export type UserStatus = 'active' | 'pending' | 'rejected';

export type ExamType = 'Monthly Test' | 'Unit Test' | 'Term Exam' | 'Viva Exam' | 'Final Exam';

export interface User {
  id: string;
  name: string;
  role: Role;
  email: string;
  password?: string; // Simulated for this demo
  status: UserStatus;
  phone?: string;
  address?: string;
  
  // Student specific
  classId?: string; 
  section?: string; // Added section support
  annualFee?: number; // Total agreed fee for the year
  discount?: number; // Discount amount
  totalPaid?: number; // Calculated field
  
  // Teacher specific
  subjects?: string[];
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  subject: string;
  teacherId: string;
  targetClassId: string;
  dueDate: string;
  createdAt: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  content: string; // Text content or simulated file URL
  submittedAt: string;
  grade?: string;
  feedback?: string;
}

export interface Invoice {
  id: string;
  studentId: string;
  studentName: string;
  title: string; // e.g., "First Term Fee (30%)"
  amount: number;
  dueDate: string;
  issuedAt: string;
  status: 'unpaid' | 'paid' | 'partial';
}

export interface FeeRecord {
  id: string;
  receiptNumber: number;
  invoiceId?: string; // Optional link to an invoice
  studentId: string;
  studentName: string;
  amount: number;
  description: string;
  date: string;
  status: 'paid' | 'pending_edit' | 'pending_delete';
  editedByAccountant?: boolean;
  remainingDueSnapshot?: number; // Balance at the time of payment
}

export interface ExamSession {
  id: string;
  name: string; // e.g., "First Term 2024"
  type: ExamType;
  status: 'open' | 'closed';
  startDate: string;
}

export interface ExamReport {
  id: string;
  studentId: string;
  term: string; // Maps to ExamSession.name
  examSessionId?: string;
  scores: Record<string, number>; // Subject -> Score
  remarks: string;
  published: boolean; // Controls visibility to student
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  date: string;
  postedBy: string;
  audience: 'all' | 'students' | 'teachers';
}

export interface SystemClass {
  name: string;
  sections: string[];
}

export interface AppState {
  currentUser: User | null;
  users: User[];
  assignments: Assignment[];
  submissions: Submission[];
  invoices: Invoice[];
  fees: FeeRecord[];
  examSessions: ExamSession[];
  examReports: ExamReport[];
  notices: Notice[];
  receiptCounter: number;
  availableSubjects: string[];
  systemClasses: SystemClass[];
}
