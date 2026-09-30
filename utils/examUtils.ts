import { ExamConfig, ExamReport, Subject, User, getApplicableSubjects } from '../types';

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
 * Determines which subjects actually participated in an exam session for a given class (and section).
 * A subject is considered active in the session if:
 * 1. An explicit ExamConfig with fullMarks > 0 or practicalFullMarks > 0 exists for this session + class + subject, OR
 * 2. At least one student in that class (and section, if specified) has a valid recorded score
 *    (obtained !== undefined || practicalObtained !== undefined) for this subject in the session reports.
 * 
 * If no student has marks and no session config exists for that subject, it was NOT part of the exam,
 * and is excluded so students are not penalized with default 0 / 100 marks or false failures.
 */
export const getActiveExamSubjects = (
    allSubjects: Subject[],
    reports: ExamReport[],
    configs: ExamConfig[] | undefined,
    sessionId: string | undefined,
    classId: string | undefined,
    section?: string,
    users?: User[]
): Subject[] => {
    if (!classId || !sessionId) return [];

    const applicable = getApplicableSubjects(allSubjects, classId, section);

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

