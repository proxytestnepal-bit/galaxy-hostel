
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AppState, User, Assignment, Submission, FeeRecord, ExamReport, Notice, Invoice, ExamSession, Subject, ScoreData, WorkLog, RoleRequest, Role } from '../types';
import { INITIAL_STATE } from './mockData';
import { loadAllData, dbActions, seedDatabase, seedCollection } from './db';

type Action =
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SWITCH_ACTIVE_ROLE'; payload: Role }
  | { type: 'IMPERSONATE_USER'; payload: User }
  | { type: 'STOP_IMPERSONATION' }
  | { type: 'LOAD_DATA'; payload: Partial<AppState> }
  | { type: 'ADD_USER'; payload: User }
  | { type: 'UPDATE_USER_DETAILS'; payload: Partial<User> & { id: string } }
  | { type: 'APPROVE_USER'; payload: { id: string; updates?: Partial<User> } }
  | { type: 'REJECT_USER'; payload: string }
  | { type: 'DROP_USER'; payload: string }
  | { type: 'DELETE_USER'; payload: string }
  | { type: 'ADD_ASSIGNMENT'; payload: Assignment }
  | { type: 'ADD_SUBMISSION'; payload: Submission }
  | { type: 'GRADE_SUBMISSION'; payload: { id: string; grade: string; feedback: string } }
  | { type: 'GENERATE_INVOICE'; payload: Invoice }
  | { type: 'BULK_GENERATE_INVOICE'; payload: Invoice[] }
  | { type: 'REQUEST_DELETE_INVOICE'; payload: string }
  | { type: 'UPDATE_INVOICE_STATUS'; payload: { id: string; status: Invoice['status'] } }
  | { type: 'DELETE_INVOICE'; payload: string }
  | { type: 'ADD_FEE'; payload: FeeRecord }
  | { type: 'UPDATE_FEE_STATUS'; payload: { id: string; status: FeeRecord['status'] } }
  | { type: 'DELETE_FEE'; payload: string }
  | { type: 'REQUEST_DELETE_FEE'; payload: string }
  | { type: 'DELETE_FEE'; payload: string }
  | { type: 'ADD_EXAM_SESSION'; payload: ExamSession }
  | { type: 'TOGGLE_EXAM_SESSION_STATUS'; payload: string } // id
  | { type: 'UPDATE_EXAM_MARKS'; payload: { studentId: string; examSessionId: string; sessionName: string; subject: string; scoreData: ScoreData } }
  | { type: 'PUBLISH_REPORT'; payload: { id: string; published: boolean } }
  | { type: 'PUBLISH_CLASS_RESULT'; payload: { examSessionId: string; sessionName: string; classId: string; section?: string; published: boolean } }
  | { type: 'ADD_NOTICE'; payload: Notice }
  | { type: 'RESET_RECEIPT_COUNTER'; payload: number }
  | { type: 'ADD_SYSTEM_SUBJECT'; payload: Subject }
  | { type: 'DELETE_SYSTEM_SUBJECT'; payload: string } // name
  | { type: 'ADD_SYSTEM_CLASS'; payload: string }
  | { type: 'DELETE_SYSTEM_CLASS'; payload: string }
  | { type: 'ADD_CLASS_SECTION'; payload: { className: string; section: string } }
  | { type: 'DELETE_CLASS_SECTION'; payload: { className: string; section: string } }
  | { type: 'ADD_WORK_LOG'; payload: WorkLog }
  | { type: 'ADD_ROLE_REQUEST'; payload: RoleRequest }
  | { type: 'RESOLVE_ROLE_REQUEST'; payload: { id: string; status: 'approved' | 'rejected' } }
  | { type: 'RESET_DATABASE' };

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | undefined>(undefined);

const reducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, currentUser: action.payload };
    case 'LOGOUT':
      return { ...state, currentUser: null, originalUser: null };
    case 'SWITCH_ACTIVE_ROLE': {
      if (!state.currentUser) return state;
      if (!state.currentUser.allowedRoles?.includes(action.payload)) return state;
      return { ...state, currentUser: { ...state.currentUser, role: action.payload } };
    }
    case 'IMPERSONATE_USER':
      return { ...state, originalUser: state.currentUser, currentUser: action.payload };
    case 'STOP_IMPERSONATION':
        return { ...state, currentUser: state.originalUser || state.currentUser, originalUser: null };
    case 'LOAD_DATA':
        // Migration: Ensure allowedRoles exists on loaded users if data is old
        if (action.payload.users) {
            action.payload.users = action.payload.users.map(u => ({
                ...u,
                allowedRoles: u.allowedRoles || [u.role]
            }));
        }
        return { ...state, ...action.payload };
    case 'ADD_USER':
      // Ensure new users have allowedRoles set
      const newUser = { ...action.payload, allowedRoles: action.payload.allowedRoles || [action.payload.role] };
      dbActions.addUser(newUser);
      return { ...state, users: [...state.users, newUser] };
    case 'UPDATE_USER_DETAILS': {
      const updatedUsers = state.users.map(u => u.id === action.payload.id ? { ...u, ...action.payload } : u);
      const user = updatedUsers.find(u => u.id === action.payload.id);
      if(user) dbActions.updateUser(user);
      
      // If current user is updated, sync local state
      let current = state.currentUser;
      if (current && current.id === action.payload.id) {
          current = { ...current, ...action.payload };
      }

      return { ...state, users: updatedUsers, currentUser: current };
    }
    case 'APPROVE_USER': {
      const updatedUsers = state.users.map(u => u.id === action.payload.id ? { ...u, status: 'active' as const, ...action.payload.updates } : u);
      const user = updatedUsers.find(u => u.id === action.payload.id);
      if(user) dbActions.updateUser(user);
      return { ...state, users: updatedUsers };
    }
    case 'REJECT_USER':
        dbActions.deleteUser(action.payload);
        return {
            ...state,
            users: state.users.filter(u => u.id !== action.payload)
        };
    case 'DROP_USER': {
        const droppedUsers = state.users.map(u => u.id === action.payload ? { ...u, status: 'dropped_out' as const } : u);
        const droppedUser = droppedUsers.find(u => u.id === action.payload);
        if(droppedUser) dbActions.updateUser(droppedUser);
        return { ...state, users: droppedUsers };
    }
    case 'DELETE_USER':
        dbActions.deleteUser(action.payload);
        return {
            ...state,
            users: state.users.filter(u => u.id !== action.payload)
        };
    case 'ADD_ASSIGNMENT':
      dbActions.addAssignment(action.payload);
      return { ...state, assignments: [action.payload, ...state.assignments] };
    case 'ADD_SUBMISSION':
      dbActions.addSubmission(action.payload);
      return { ...state, submissions: [action.payload, ...state.submissions] };
    case 'GRADE_SUBMISSION': {
      const updatedSubmissions = state.submissions.map(s =>
          s.id === action.payload.id ? { ...s, grade: action.payload.grade, feedback: action.payload.feedback } : s
      );
      const sub = updatedSubmissions.find(s => s.id === action.payload.id);
      if(sub) dbActions.updateSubmission(sub);
      return { ...state, submissions: updatedSubmissions };
    }
    case 'GENERATE_INVOICE':
      dbActions.addInvoice(action.payload);
      return { ...state, invoices: [action.payload, ...state.invoices] };
    case 'BULK_GENERATE_INVOICE':
      action.payload.forEach(inv => dbActions.addInvoice(inv));
      return { ...state, invoices: [...action.payload, ...state.invoices] };
    case 'REQUEST_DELETE_INVOICE': {
        const updatedInvoices = state.invoices.map(inv => inv.id === action.payload ? { ...inv, status: 'pending_delete' as const } : inv);
        const inv = updatedInvoices.find(i => i.id === action.payload);
        if(inv) dbActions.addInvoice(inv);
        return { ...state, invoices: updatedInvoices };
    }
    case 'UPDATE_INVOICE_STATUS': {
        const updatedInvoices = state.invoices.map(inv => inv.id === action.payload.id ? { ...inv, status: action.payload.status } : inv);
        const inv = updatedInvoices.find(i => i.id === action.payload.id);
        if(inv) dbActions.addInvoice(inv);
        return { ...state, invoices: updatedInvoices };
    }
    case 'DELETE_INVOICE':
      dbActions.deleteInvoice(action.payload);
      return { ...state, invoices: state.invoices.filter(i => i.id !== action.payload) };
    case 'ADD_FEE': {
      dbActions.addFee(action.payload);
      const nextCounter = state.receiptCounter + 1;
      const updatedUsers = state.users.map(u => {
          if (u.id === action.payload.studentId) {
              const updatedUser = { ...u, totalPaid: (u.totalPaid || 0) + action.payload.amount };
              dbActions.updateUser(updatedUser);
              return updatedUser;
          }
          return u;
      });
      let updatedInvoices = state.invoices;
      if (action.payload.invoiceId) {
          updatedInvoices = state.invoices.map(inv => {
              if (inv.id === action.payload.invoiceId) {
                  const updatedInv = { ...inv, status: 'paid' as const };
                  dbActions.addInvoice(updatedInv); // Invoice saver handles updates if ID exists
                  return updatedInv;
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
    case 'UPDATE_FEE_STATUS': {
        const updatedFees = state.fees.map(f => f.id === action.payload.id ? { ...f, status: action.payload.status } : f);
        const fee = updatedFees.find(f => f.id === action.payload.id);
        if(fee) dbActions.updateFee(fee);
        return { ...state, fees: updatedFees };
    }
    case 'REQUEST_DELETE_FEE': {
        const updatedFees = state.fees.map(f => f.id === action.payload ? { ...f, status: 'pending_delete' as const } : f);
        const fee = updatedFees.find(f => f.id === action.payload);
        if(fee) dbActions.updateFee(fee);
        return { ...state, fees: updatedFees };
    }
    case 'DELETE_FEE':
        dbActions.deleteFee(action.payload);
        return { ...state, fees: state.fees.filter(f => f.id !== action.payload) };
    case 'ADD_EXAM_SESSION':
        dbActions.addExamSession(action.payload);
        return { ...state, examSessions: [action.payload, ...state.examSessions] };
    case 'TOGGLE_EXAM_SESSION_STATUS': {
        const updatedSessions = state.examSessions.map(s => 
            s.id === action.payload ? { ...s, status: s.status === 'open' ? 'closed' as const : 'open' as const } : s
        );
        const session = updatedSessions.find(s => s.id === action.payload);
        if(session) dbActions.updateExamSession(session);
        return { ...state, examSessions: updatedSessions };
    }
    case 'UPDATE_EXAM_MARKS': {
        const { studentId, examSessionId, sessionName, subject, scoreData } = action.payload;
        const existingReportIndex = state.examReports.findIndex(
            r => r.studentId === studentId && (r.examSessionId === examSessionId || r.term === sessionName)
        );

        let newReports = [...state.examReports];
        if (existingReportIndex > -1) {
            const report = newReports[existingReportIndex];
            const updatedReport = {
                ...report,
                examSessionId, 
                scores: { ...report.scores, [subject]: scoreData }
            };
            newReports[existingReportIndex] = updatedReport;
            dbActions.updateReport(updatedReport);
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
            newReports = [...newReports, newReport];
            dbActions.addReport(newReport);
        }
        return { ...state, examReports: newReports };
    }
    case 'PUBLISH_REPORT': {
        const updatedReports = state.examReports.map(r => r.id === action.payload.id ? { ...r, published: action.payload.published } : r);
        const report = updatedReports.find(r => r.id === action.payload.id);
        if(report) dbActions.updateReport(report);
        return { ...state, examReports: updatedReports };
    }
    case 'PUBLISH_CLASS_RESULT': {
        const { examSessionId, sessionName, classId, section, published } = action.payload;
        
        // Normalize inputs
        const targetClass = classId?.trim();
        // Treat empty string and undefined the same: means "All Sections"
        const targetSection = (section && section.trim().length > 0) ? section.trim() : null;

        // Find matching students
        const studentIds = state.users
            .filter(u => {
                const isStudent = u.role === 'student';
                const matchClass = u.classId?.trim() === targetClass;
                // If targetSection exists, user section must match. If targetSection is null, ignore section.
                const matchSection = targetSection ? u.section?.trim() === targetSection : true;
                return isStudent && matchClass && matchSection;
            })
            .map(u => u.id);

        if (studentIds.length === 0) {
            console.warn("Publish failed: No students found in class", targetClass);
            return state;
        }

        let hasChanges = false;
        const updatedReports = state.examReports.map(report => {
            // Only affect reports for students in this class
            if (!studentIds.includes(report.studentId)) return report;

            // Check if report belongs to the session
            // We match by ID or Name to handle legacy data
            const reportTerm = report.term?.trim();
            const reportSessionId = report.examSessionId;
            const targetSessionName = sessionName?.trim();

            const isIdMatch = reportSessionId === examSessionId;
            const isNameMatch = reportTerm && targetSessionName && reportTerm === targetSessionName;

            if (isIdMatch || isNameMatch) {
                // Determine current status (handling string/boolean legacy data)
                const currentPublished = report.published === true || String(report.published) === 'true';
                
                // Determine if update is needed
                // 1. Status change?
                // 2. ID Repair needed? (Old reports might lack examSessionId)
                if (currentPublished !== published || report.examSessionId !== examSessionId) {
                    hasChanges = true;
                    const updated = {
                        ...report,
                        published: published,
                        examSessionId: examSessionId // Self-heal: ensure ID is linked
                    };
                    // Trigger DB save immediately for this record
                    dbActions.updateReport(updated);
                    return updated;
                }
            }
            return report;
        });

        if (!hasChanges) {
             console.log("No reports required updates (State already matches).");
             return state;
        }

        return { ...state, examReports: updatedReports };
    }
    case 'ADD_NOTICE':
        dbActions.addNotice(action.payload);
        return { ...state, notices: [action.payload, ...state.notices] };
    case 'RESET_RECEIPT_COUNTER':
        return { ...state, receiptCounter: action.payload };
    case 'ADD_SYSTEM_SUBJECT':
        if(state.availableSubjects.find(s => s.name === action.payload.name)) return state;
        dbActions.addSubject(action.payload);
        return { ...state, availableSubjects: [...state.availableSubjects, action.payload] };
    case 'DELETE_SYSTEM_SUBJECT':
        dbActions.deleteSubject(action.payload);
        return { ...state, availableSubjects: state.availableSubjects.filter(s => s.name !== action.payload) };
    case 'ADD_SYSTEM_CLASS':
        if(state.systemClasses.find(c => c.name === action.payload)) return state;
        const newClass = { name: action.payload, sections: [] };
        dbActions.addClass(newClass);
        return { ...state, systemClasses: [...state.systemClasses, newClass] };
    case 'DELETE_SYSTEM_CLASS':
        dbActions.deleteClass(action.payload);
        return { ...state, systemClasses: state.systemClasses.filter(c => c.name !== action.payload) };
    case 'ADD_CLASS_SECTION': {
        const updatedClasses = state.systemClasses.map(c => 
            c.name === action.payload.className 
            ? { ...c, sections: [...c.sections, action.payload.section] }
            : c
        );
        const cls = updatedClasses.find(c => c.name === action.payload.className);
        if(cls) dbActions.updateClass(cls);
        return { ...state, systemClasses: updatedClasses };
    }
    case 'DELETE_CLASS_SECTION': {
        const updatedClasses = state.systemClasses.map(c => 
            c.name === action.payload.className 
            ? { ...c, sections: c.sections.filter(s => s !== action.payload.section) }
            : c
        );
        const cls = updatedClasses.find(c => c.name === action.payload.className);
        if(cls) dbActions.updateClass(cls);
        return { ...state, systemClasses: updatedClasses };
    }
    case 'ADD_WORK_LOG':
        dbActions.addWorkLog(action.payload);
        return { ...state, workLogs: [action.payload, ...state.workLogs] };
    case 'ADD_ROLE_REQUEST':
        dbActions.addRoleRequest(action.payload);
        return { ...state, roleRequests: [...state.roleRequests, action.payload] };
    case 'RESOLVE_ROLE_REQUEST': {
        const { id, status } = action.payload;
        // 1. Update the request status
        const updatedRequests = state.roleRequests.map(r => r.id === id ? { ...r, status } : r);
        
        // 2. If approved, update the user's allowedRoles
        const request = state.roleRequests.find(r => r.id === id);
        let updatedUsers = state.users;
        
        if (request && status === 'approved') {
            updatedUsers = state.users.map(u => {
                if (u.id === request.userId) {
                    const currentRoles = u.allowedRoles || [u.role];
                    // Add only if not already there
                    if (!currentRoles.includes(request.requestedRole)) {
                        const updatedUser = { ...u, allowedRoles: [...currentRoles, request.requestedRole] };
                        dbActions.updateUser(updatedUser);
                        // If it's the current user, update session too
                        if (state.currentUser?.id === u.id) {
                            state.currentUser.allowedRoles = updatedUser.allowedRoles;
                        }
                        return updatedUser;
                    }
                }
                return u;
            });
        }
        
        // Save request status update to DB
        dbActions.deleteRoleRequest(id);
        
        return { ...state, roleRequests: state.roleRequests.filter(r => r.id !== id), users: updatedUsers };
    }
    case 'RESET_DATABASE':
        return INITIAL_STATE;
    default:
      return state;
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  // Load Data on Mount
  useEffect(() => {
    const fetchData = async () => {
        const data = await loadAllData();
        
        // 1. Check if ANY data exists (Users is a good proxy)
        if(!data.users || data.users.length === 0) {
            console.log("Empty DB detected, seeding initial data...");
            await seedDatabase(INITIAL_STATE);
            dispatch({ type: 'LOAD_DATA', payload: INITIAL_STATE });
        } else {
            // 2. Data Repair Logic:
            const missingSubjects = !data.availableSubjects || data.availableSubjects.length === 0;
            const missingClasses = !data.systemClasses || data.systemClasses.length === 0;
            const missingNotices = !data.notices || data.notices.length === 0;

            if (missingSubjects) {
                await seedCollection('subjects', INITIAL_STATE.availableSubjects);
                data.availableSubjects = INITIAL_STATE.availableSubjects;
            }
            
            if (missingClasses) {
                 await seedCollection('classes', INITIAL_STATE.systemClasses);
                 data.systemClasses = INITIAL_STATE.systemClasses;
            }

            if (missingNotices) {
                await seedCollection('notices', INITIAL_STATE.notices);
                data.notices = INITIAL_STATE.notices;
            }

            dispatch({ type: 'LOAD_DATA', payload: data });
        }
    };
    fetchData();
  }, []);

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
