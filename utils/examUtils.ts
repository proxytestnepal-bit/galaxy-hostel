import { ExamConfig, ExamReport, ExamSession, Subject, User, getApplicableSubjects } from '../types';

export const getExamConfig = (
    configs: ExamConfig[] | undefined,
    sessionId: string | undefined,
    classId: string | undefined,
    subject: string
): ExamConfig | undefined => {
    if (!configs || configs.length === 0) return undefined;
    
    // First, try to find an exact match for the session
    let config = configs.find(c => 
        c.examSessionId === sessionId && 
        c.classId === classId && 
        c.subject === subject
    );

    // Make sure we have a fallback if not found
    if (!config) {
        // Fallback to the most recent configuration for this class and subject 
        // regardless of the session
        config = [...configs].reverse().find(c => 
            c.classId === classId && 
            c.subject === subject
        );
    }
    
    return config;
};

/**
 * Returns subjects configured/allowed for a given session, class, and section
 */
export const getSessionAllowedSubjects = (
    allSubjects: Subject[],
    session: ExamSession | undefined,
    classId: string | undefined,
    section?: string
): Subject[] => {
    if (!classId) return [];
    let list = getApplicableSubjects(allSubjects, classId, section);
    if (!session) return list;

    // Check class scope
    if (session.applicableClasses && session.applicableClasses.length > 0) {
        if (!session.applicableClasses.includes(classId)) return [];
    }

    // Check section scope
    if (section && session.applicableSections?.[classId] && session.applicableSections[classId].length > 0) {
        if (!session.applicableSections[classId].includes(section)) return [];
    }

    // Check subject scope
    const sectionKey = section ? `${classId}_${section}` : '';
    const configuredSubjects = (sectionKey && session.applicableSubjects?.[sectionKey]) || session.applicableSubjects?.[classId];
    if (configuredSubjects && configuredSubjects.length > 0) {
        list = list.filter(s => configuredSubjects.includes(s.name));
    }

    return list;
};

/**
 * Determines which subjects actually participated in an exam session for a given class (and section).
 * A subject is considered active in the session if:
 * 1. It is allowed by the session scope (if configured for classes, sections, and subjects), AND
 * 2. At least one student in that class & section scored > 0 in theory or practical.
 * 
 * If no student has positive marks, it was NOT part of the exam,
 * and is excluded so students are not penalized with default 0 / 100 marks or false failures.
 */
export const getActiveExamSubjects = (
    allSubjects: Subject[],
    reports: ExamReport[],
    configs: ExamConfig[] | undefined,
    sessionId: string | undefined,
    classId: string | undefined,
    section?: string,
    users?: User[],
    sessions?: ExamSession[]
): Subject[] => {
    if (!classId || !sessionId) return [];

    const session = sessions?.find(s => s.id === sessionId || s.name === sessionId);
    const applicable = getSessionAllowedSubjects(allSubjects, session, classId, section);
    if (applicable.length === 0) return [];

    // Find student IDs belonging to this class & section if users are provided
    let relevantStudentIds: Set<string> | null = null;
    if (users && users.length > 0) {
        relevantStudentIds = new Set(
            users
                .filter(u => u.role === 'student' && u.classId === classId && (!section || u.section === section))
                .map(u => u.id)
        );
    }

    // Filter reports for this session (by session ID or session name for legacy support)
    const sessionReports = reports.filter(r => 
        r.examSessionId === sessionId || r.term === sessionId
    );

    return applicable.filter(subj => {
        // A subject is ONLY active if at least one student in this class & section scored > 0 in theory or practical
        // If all students have 0 or no value, that subject was not examined in this session for this class/section
        const hasPositiveStudentMarks = sessionReports.some(r => {
            if (relevantStudentIds && !relevantStudentIds.has(r.studentId)) {
                return false;
            }
            const scoreData = r.scores?.[subj.name];
            if (!scoreData) return false;
            return (
                (scoreData.obtained !== undefined && scoreData.obtained > 0) ||
                (scoreData.practicalObtained !== undefined && scoreData.practicalObtained > 0)
            );
        });

        return hasPositiveStudentMarks;
    });
};

