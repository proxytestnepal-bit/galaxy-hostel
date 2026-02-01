

export type Role = 'admin' | 'accountant' | 'teacher' | 'student' | 'guest' | 'developer' | 'intern';

export type UserStatus = 'active' | 'pending' | 'rejected' | 'dropped_out';

export type ExamType = 'Monthly Test' | 'Unit Test' | 'Term Exam' | 'Viva Exam' | 'Final Exam';

export type SubjectType = 'Theory' | 'Practical';

export interface Subject {
  name: string;
  type: SubjectType;
}

export interface User {
  id: string;
  name: string;
  role: Role; // The currently active role (View Mode)
  allowedRoles: Role[]; // All roles this user is authorized to use
  email: string;
  password?: string; // Simulated for this demo
  status: UserStatus;
  phone?: string;
  address?: string;
  
  // Student specific
  classId?: string; 
  section?: string; 
  annualFee?: number; // Total agreed fee for the year
  discount?: number; // Discount amount
  totalPaid?: number; // Calculated field
  
  // Teacher specific
  subjects?: string[]; // Subject Names
}

export interface RoleRequest {
  id: string;
  userId: string;
  userName: string;
  currentRole: Role;
  requestedRole: Role;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
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
  content: string; 
  submittedAt: string;
  grade?: string;
  feedback?: string;
}

export interface InvoiceItem {
  description: string;
  amount: number;
}

export interface Invoice {
  id: string;
  studentId: string;
  studentName: string;
  title: string; 
  amount: number; // Total amount
  feeBreakdown?: InvoiceItem[]; // Details (Viva, Tour, etc.)
  dueDate: string;
  issuedAt: string;
  status: 'unpaid' | 'paid' | 'partial' | 'pending_delete';
}

export interface FeeRecord {
  id: string;
  receiptNumber: number;
  invoiceId?: string; 
  studentId: string;
  studentName: string;
  amount: number;
  description: string;
  date: string;
  status: 'paid' | 'pending_edit' | 'pending_delete';
  editedByAccountant?: boolean;
  remainingDueSnapshot?: number; 
}

export interface ExamSession {
  id: string;
  name: string; 
  type: ExamType;
  status: 'open' | 'closed';
  startDate: string;
}

export interface ScoreData {
  obtained: number;
  fullMarks: number;
  passMarks: number;
}

export interface ExamReport {
  id: string;
  studentId: string;
  term: string; // Maps to ExamSession.name
  examSessionId?: string;
  scores: Record<string, ScoreData>; // Subject Name -> Score Data
  remarks: string;
  published: boolean; 
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

export interface WorkLog {
  id: string;
  studentId: string;
  date: string;
  department: string; // Front Office, Housekeeping, etc.
  shift: string; // Morning, Evening, Night
  description: string;
  hours: number;
}

export interface AppState {
  currentUser: User | null;
  originalUser: User | null; // Tracks the developer when impersonating
  users: User[];
  assignments: Assignment[];
  submissions: Submission[];
  invoices: Invoice[];
  fees: FeeRecord[];
  examSessions: ExamSession[];
  examReports: ExamReport[];
  notices: Notice[];
  roleRequests: RoleRequest[];
  receiptCounter: number;
  availableSubjects: Subject[];
  systemClasses: SystemClass[];
  workLogs: WorkLog[];
}
