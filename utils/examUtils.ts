import { ExamConfig } from '../types';

export const getExamConfig = (
    configs: ExamConfig[] | undefined,
    sessionId: string,
    classId: string,
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
