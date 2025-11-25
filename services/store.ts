
import React, { createContext, useContext, useReducer } from 'react';
import { AppState, User, Assignment, Submission, FeeRecord, ExamReport, Notice, Invoice, ExamSession } from '../types';
import { INITIAL_STATE } from './mockData';

type Action =
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'ADD_USER'; payload: User }
  | { type: 'UPDATE_USER_DETAILS'; payload: Partial<User> & { id: string } }
  | { type: 'APPROVE_USER'; payload: { id: string; updates?: Partial<User> } }
  | { type: 'REJECT_USER'; payload: string }
  | { type: 'ADD_ASSIGNMENT'; payload: Assignment }
  | { type: 'ADD_SUBMISSION'; payload: Submission }
  | { type: 'GRADE_SUBMISSION'; payload: { id: string; grade: string; feedback: string } }
  | { type: 'GENERATE_INVOICE'; payload: Invoice }
  | { type: 'BULK_GENERATE_INVOICE'; payload: Invoice[] }
  | { type: 'ADD_FEE'; payload: FeeRecord }
  | { type: 'UPDATE_FEE_STATUS'; payload: { id: string; status: FeeRecord['status'] } }
  | { type: 'DELETE_FEE'; payload: string }
  | { type: 'REQUEST_DELETE_FEE'; payload: string }
  | { type: 'ADD_EXAM_SESSION'; payload: ExamSession }
  | { type: 'TOGGLE_EXAM_SESSION_STATUS'; payload: string } // id
  | { type: 'UPDATE_EXAM_MARKS'; payload: { studentId: string; examSessionId: string; sessionName: string; subject: string; score: number } }
  | { type: 'PUBLISH_REPORT'; payload: { id: string; published: boolean } }
  | { type: 'ADD_NOTICE'; payload: Notice }
  | { type: 'RESET_RECEIPT_COUNTER'; payload: number }
  | { type: 'ADD_SYSTEM_SUBJECT'; payload: string }
  | { type: 'DELETE_SYSTEM_SUBJECT'; payload: string };

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | undefined>(undefined);

const reducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, currentUser: action.payload };
    case 'LOGOUT':
      return { ...state, currentUser: null };
    case 'ADD_USER':
      return { ...state, users: [...state.users, action.payload] };
    case 'UPDATE_USER_DETAILS':
      return {
          ...state,
          users: state.users.map(u => u.id === action.payload.id ? { ...u, ...action.payload } : u)
      };
    case 'APPROVE_USER':
      return {
          ...state,
          users: state.users.map(u => u.id === action.payload.id ? { ...u, status: 'active', ...action.payload.updates } : u)
      };
    case 'REJECT_USER':
        return {
            ...state,
            users: state.users.filter(u => u.id !== action.payload)
        };
    case 'ADD_ASSIGNMENT':
      return { ...state, assignments: [action.payload, ...state.assignments] };
    case 'ADD_SUBMISSION':
      return { ...state, submissions: [action.payload, ...state.submissions] };
    case 'GRADE_SUBMISSION':
      return {
        ...state,
        submissions: state.submissions.map(s =>
          s.id === action.payload.id ? { ...s, grade: action.payload.grade, feedback: action.payload.feedback } : s
        ),
      };
    case 'GENERATE_INVOICE':
      return { ...state, invoices: [action.payload, ...state.invoices] };
    case 'BULK_GENERATE_INVOICE':
      return { ...state, invoices: [...action.payload, ...state.invoices] };
    case 'ADD_FEE': {
      // 1. Increment receipt counter
      const nextCounter = state.receiptCounter + 1;
      
      // 2. Update Student Total Paid
      const updatedUsers = state.users.map(u => {
          if (u.id === action.payload.studentId) {
              return { ...u, totalPaid: (u.totalPaid || 0) + action.payload.amount };
          }
          return u;
      });

      // 3. Update Invoice Status if linked
      let updatedInvoices = state.invoices;
      if (action.payload.invoiceId) {
          updatedInvoices = state.invoices.map(inv => {
              if (inv.id === action.payload.invoiceId) {
                  return { ...inv, status: 'paid' };
              }
              return inv;
          });
      }

      return {
        ...state,
        fees: [action.payload, ...state.fees],
        users: updatedUsers,
        invoices: updatedInvoices,
        receiptCounter: nextCounter
      };
    }
    case 'UPDATE_FEE_STATUS':
        return {
            ...state,
            fees: state.fees.map(f => f.id === action.payload.id ? { ...f, status: action.payload.status } : f)
        };
    case 'REQUEST_DELETE_FEE':
        return {
            ...state,
            fees: state.fees.map(f => f.id === action.payload ? { ...f, status: 'pending_delete' } : f)
        };
    case 'DELETE_FEE':
        return {
            ...state,
            fees: state.fees.filter(f => f.id !== action.payload)
        };
    case 'ADD_EXAM_SESSION':
        return { ...state, examSessions: [action.payload, ...state.examSessions] };
    case 'TOGGLE_EXAM_SESSION_STATUS':
        return {
            ...state,
            examSessions: state.examSessions.map(s => 
                s.id === action.payload ? { ...s, status: s.status === 'open' ? 'closed' : 'open' } : s
            )
        };
    case 'UPDATE_EXAM_MARKS': {
        const { studentId, examSessionId, sessionName, subject, score } = action.payload;
        
        // Find existing report for this student and session
        const existingReportIndex = state.examReports.findIndex(
            r => r.studentId === studentId && (r.examSessionId === examSessionId || r.term === sessionName)
        );

        if (existingReportIndex > -1) {
            // Update existing
            const updatedReports = [...state.examReports];
            const report = updatedReports[existingReportIndex];
            updatedReports[existingReportIndex] = {
                ...report,
                examSessionId, // Ensure ID is set
                scores: { ...report.scores, [subject]: score }
            };
            return { ...state, examReports: updatedReports };
        } else {
            // Create new
            const newReport: ExamReport = {
                id: `er_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                studentId,
                examSessionId,
                term: sessionName,
                scores: { [subject]: score },
                remarks: '',
                published: false
            };
            return { ...state, examReports: [...state.examReports, newReport] };
        }
    }
    case 'PUBLISH_REPORT':
        return {
            ...state,
            examReports: state.examReports.map(r => r.id === action.payload.id ? { ...r, published: action.payload.published } : r)
        };
    case 'ADD_NOTICE':
        return { ...state, notices: [action.payload, ...state.notices] };
    case 'RESET_RECEIPT_COUNTER':
        return { ...state, receiptCounter: action.payload };
    case 'ADD_SYSTEM_SUBJECT':
        if(state.availableSubjects.includes(action.payload)) return state;
        return { ...state, availableSubjects: [...state.availableSubjects, action.payload] };
    case 'DELETE_SYSTEM_SUBJECT':
        return { ...state, availableSubjects: state.availableSubjects.filter(s => s !== action.payload) };
    default:
      return state;
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  return React.createElement(
    AppContext.Provider,
    { value: { state, dispatch } },
    children
  );
};

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppStore must be used within AppProvider');
  return context;
};
