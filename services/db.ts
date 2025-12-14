

import { db } from './firebase';
import { collection, doc, setDoc, getDocs, deleteDoc, writeBatch } from 'firebase/firestore';
import { AppState, User, FeeRecord, Invoice, Assignment, Submission, ExamSession, ExamReport, Notice, Subject, SystemClass, WorkLog, RoleRequest } from '../types';

// Helper to remove undefined fields which Firestore doesn't support
const sanitize = (data: any) => {
    return JSON.parse(JSON.stringify(data));
};

// Generic saver
const saveCollectionItem = async (collectionName: string, item: any) => {
    try {
        await setDoc(doc(db, collectionName, item.id || item.name), sanitize(item));
    } catch (e) {
        console.error(`Error saving to ${collectionName}`, e);
    }
};

const deleteCollectionItem = async (collectionName: string, itemId: string) => {
    await deleteDoc(doc(db, collectionName, itemId));
};

// --- DATA LOADERS ---
export const loadAllData = async (): Promise<Partial<AppState>> => {
    // Resilient loader: catches errors per collection so one failure doesn't crash app
    const loadCol = async (name: string) => {
        try {
            const snap = await getDocs(collection(db, name));
            return snap.docs.map(d => d.data());
        } catch (e) {
            console.error(`Failed to load collection: ${name}`, e);
            return []; // Return empty array on failure
        }
    };

    try {
        const [
            users, assignments, submissions, invoices, fees, 
            examSessions, examReports, notices, availableSubjects, 
            systemClasses, workLogs, roleRequests
        ] = await Promise.all([
            loadCol('users'), loadCol('assignments'), loadCol('submissions'),
            loadCol('invoices'), loadCol('fees'), loadCol('examSessions'),
            loadCol('examReports'), loadCol('notices'), loadCol('subjects'),
            loadCol('classes'), loadCol('workLogs'), loadCol('roleRequests')
        ]);

        return {
            users: users as User[],
            assignments: assignments as Assignment[],
            submissions: submissions as Submission[],
            invoices: invoices as Invoice[],
            fees: fees as FeeRecord[],
            examSessions: examSessions as ExamSession[],
            examReports: examReports as ExamReport[],
            notices: notices as Notice[],
            availableSubjects: availableSubjects as Subject[],
            systemClasses: systemClasses as SystemClass[],
            workLogs: workLogs as WorkLog[],
            roleRequests: roleRequests as RoleRequest[],
        };
    } catch (error) {
        console.error("Critical: Failed to load database:", error);
        return {};
    }
};

// --- SYNC ACTIONS ---
// These functions correspond to Redux actions to keep DB in sync
export const dbActions = {
    addUser: (u: User) => saveCollectionItem('users', u),
    updateUser: (u: User) => saveCollectionItem('users', u),
    deleteUser: (id: string) => deleteCollectionItem('users', id),
    
    addAssignment: (a: Assignment) => saveCollectionItem('assignments', a),
    addSubmission: (s: Submission) => saveCollectionItem('submissions', s),
    updateSubmission: (s: Submission) => saveCollectionItem('submissions', s),
    
    addInvoice: (i: Invoice) => saveCollectionItem('invoices', i),
    deleteInvoice: (id: string) => deleteCollectionItem('invoices', id),
    
    addFee: (f: FeeRecord) => saveCollectionItem('fees', f),
    updateFee: (f: FeeRecord) => saveCollectionItem('fees', f),
    deleteFee: (id: string) => deleteCollectionItem('fees', id),
    
    addExamSession: (e: ExamSession) => saveCollectionItem('examSessions', e),
    updateExamSession: (e: ExamSession) => saveCollectionItem('examSessions', e),
    
    addReport: (r: ExamReport) => saveCollectionItem('examReports', r),
    updateReport: (r: ExamReport) => saveCollectionItem('examReports', r),
    
    addNotice: (n: Notice) => saveCollectionItem('notices', n),
    
    addSubject: (s: Subject) => saveCollectionItem('subjects', s),
    deleteSubject: (name: string) => deleteCollectionItem('subjects', name),
    
    addClass: (c: SystemClass) => saveCollectionItem('classes', c), // Using name as ID for classes
    updateClass: (c: SystemClass) => saveCollectionItem('classes', c),
    deleteClass: (name: string) => deleteCollectionItem('classes', name),
    
    addWorkLog: (w: WorkLog) => saveCollectionItem('workLogs', w),

    addRoleRequest: (r: RoleRequest) => saveCollectionItem('roleRequests', r),
    deleteRoleRequest: (id: string) => deleteCollectionItem('roleRequests', id),
};

// Helper for Auto-Repair
export const seedCollection = async (collectionName: string, items: any[]) => {
    const batch = writeBatch(db);
    items.forEach(item => {
        const ref = doc(db, collectionName, item.id || item.name);
        batch.set(ref, sanitize(item));
    });
    await batch.commit();
    console.log(`Seeded collection: ${collectionName}`);
}

// SEEDER
export const seedDatabase = async (initialState: AppState) => {
    const batch = writeBatch(db);
    
    const addToBatch = (col: string, items: any[]) => {
        items.forEach(item => {
            const ref = doc(db, col, item.id || item.name);
            batch.set(ref, sanitize(item));
        });
    };

    addToBatch('users', initialState.users);
    addToBatch('subjects', initialState.availableSubjects);
    addToBatch('classes', initialState.systemClasses);
    addToBatch('assignments', initialState.assignments);
    addToBatch('submissions', initialState.submissions);
    addToBatch('invoices', initialState.invoices);
    addToBatch('fees', initialState.fees);
    addToBatch('examSessions', initialState.examSessions);
    addToBatch('examReports', initialState.examReports);
    addToBatch('notices', initialState.notices);
    addToBatch('workLogs', initialState.workLogs);
    // Role Requests start empty usually, but if mock data had them:
    addToBatch('roleRequests', initialState.roleRequests);

    await batch.commit();
    console.log("Database Seeded Successfully");
};

export const resetDatabase = async () => {
    // 1. Load all IDs
    // 2. Batch delete
    // This is expensive but necessary for a HARD reset tool
    const cols = ['users', 'subjects', 'classes', 'assignments', 'submissions', 'invoices', 'fees', 'examSessions', 'examReports', 'notices', 'workLogs', 'roleRequests'];
    
    for (const colName of cols) {
        const snapshot = await getDocs(collection(db, colName));
        const batch = writeBatch(db);
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        console.log(`Wiped ${colName}`);
    }
};