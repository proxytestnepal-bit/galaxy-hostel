

import React, { createContext, useContext, useReducer } from 'react';
import { AppState, User, Assignment, Submission, FeeRecord, ExamReport, Notice, Invoice, ExamSession, Subject, ScoreData, WorkLog } from '../types';
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
  | { type: 'UPDATE_EXAM_MARKS'; payload: { studentId: string; examSessionId: string; sessionName: string; subject: string; scoreData: ScoreData } }
  | { type: 'PUBLISH_REPORT'; payload: { id: string; published: boolean } }
  | { type: 'PUBLISH_CLASS_RESULT'; payload: { examSessionId: string; classId: string; section?: string; published: boolean } }
  | { type: 'ADD_NOTICE'; payload: Notice }
  | { type: 'RESET_RECEIPT_COUNTER'; payload: number }
  | { type: 'ADD_SYSTEM_SUBJECT'; payload: Subject }
  | { type: 'DELETE_SYSTEM_SUBJECT'; payload: string } // name
  | { type: 'ADD_SYSTEM_CLASS'; payload: string }
  | { type: 'DELETE_SYSTEM_CLASS'; payload: string }
  | { type: 'ADD_CLASS_SECTION'; payload: { className: string; section: string } }
  | { type: 'DELETE_CLASS_SECTION'; payload: { className: string; section: string } }
  | { type: 'ADD_WORK_LOG'; payload: WorkLog };

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
      const nextCounter = state.receiptCounter + 1;
      const updatedUsers = state.users.map(u => {
          if (u.id === action.payload.studentId) {
              return { ...u, totalPaid: (u.totalPaid || 0) + action.payload.amount };
          }
          return u;
      });
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
        const { studentId, examSessionId, sessionName, subject, scoreData } = action.payload;
        
        const existingReportIndex = state.examReports.findIndex(
            r => r.studentId === studentId && (r.examSessionId === examSessionId || r.term === sessionName)
        );

        if (existingReportIndex > -1) {
            const updatedReports = [...state.examReports];
            const report = updatedReports[existingReportIndex];
            updatedReports[existingReportIndex] = {
                ...report,
                examSessionId, 
                scores: { ...report.scores, [subject]: scoreData }
            };
            return { ...state, examReports: updatedReports };
        } else {
            const newReport: ExamReport = {
                id: `er_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                studentId,
                examSessionId,
                term: sessionName,
                scores: { [subject]: scoreData },
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
    case 'PUBLISH_CLASS_RESULT': {
        const { examSessionId, classId, section, published } = action.payload;
        
        // Find all students in this class/section
        const studentIds = state.users
            .filter(u => u.role === 'student' && u.classId === classId && (!section || u.section === section))
            .map(u => u.id);

        return {
            ...state,
            examReports: state.examReports.map(report => {
                // If report belongs to one of these students AND matches the session
                if (studentIds.includes(report.studentId) && report.examSessionId === examSessionId) {
                    return { ...report, published };
                }
                return report;
            })
        };
    }
    case 'ADD_NOTICE':
        return { ...state, notices: [action.payload, ...state.notices] };
    case 'RESET_RECEIPT_COUNTER':
        return { ...state, receiptCounter: action.payload };
    case 'ADD_SYSTEM_SUBJECT':
        if(state.availableSubjects.find(s => s.name === action.payload.name)) return state;
        return { ...state, availableSubjects: [...state.availableSubjects, action.payload] };
    case 'DELETE_SYSTEM_SUBJECT':
        return { ...state, availableSubjects: state.availableSubjects.filter(s => s.name !== action.payload) };
    case 'ADD_SYSTEM_CLASS':
        if(state.systemClasses.find(c => c.name === action.payload)) return state;
        return { ...state, systemClasses: [...state.systemClasses, { name: action.payload, sections: [] }] };
    case 'DELETE_SYSTEM_CLASS':
        return { ...state, systemClasses: state.systemClasses.filter(c => c.name !== action.payload) };
    case 'ADD_CLASS_SECTION':
        return {
            ...state,
            systemClasses: state.systemClasses.map(c => 
                c.name === action.payload.className 
                ? { ...c, sections: [...c.sections, action.payload.section] }
                : c
            )
        };
    case 'DELETE_CLASS_SECTION':
        return {
            ...state,
            systemClasses: state.systemClasses.map(c => 
                c.name === action.payload.className 
                ? { ...c, sections: c.sections.filter(s => s !== action.payload.section) }
                : c
            )
        };
    case 'ADD_WORK_LOG':
        return { ...state, workLogs: [action.payload, ...state.workLogs] };
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