
import React, { createContext, useContext, useReducer } from 'react';
import { AppState, User, Assignment, Submission, FeeRecord, ExamReport, Notice, Invoice } from '../types';
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
  | { type: 'ADD_REPORT'; payload: ExamReport }
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
        // Note: In a real app, deleting a fee should ideally reverse the 'totalPaid' on the user. 
        // For simplicity here we just remove the record.
        return {
            ...state,
            fees: state.fees.filter(f => f.id !== action.payload)
        };
    case 'ADD_REPORT':
        return { ...state, examReports: [...state.examReports, action.payload] };
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
