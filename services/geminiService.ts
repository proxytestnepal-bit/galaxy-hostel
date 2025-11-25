import { GoogleGenAI } from "@google/genai";

// Ideally, this should come from process.env, but for this demo context we assume it's available.
// In a real app, never expose keys on client side without proxy.
const apiKey = process.env.API_KEY || ''; 

let ai: GoogleGenAI | null = null;

try {
    if (apiKey) {
        ai = new GoogleGenAI({ apiKey });
    }
} catch (error) {
    console.error("Failed to initialize GoogleGenAI", error);
}

export const generateAssignmentIdeas = async (subject: string, topic: string): Promise<string> => {
  if (!ai) return "AI Service not configured (Missing API Key).";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Create 3 distinct assignment ideas for a college level class on the subject "${subject}" specifically regarding "${topic}". 
      Include a brief title and description for each. Format as a clean list.`,
    });
    return response.text || "No response generated.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating assignment ideas. Please try again.";
  }
};

export const generateFeedbackHelper = async (studentContent: string, assignmentDescription: string): Promise<string> => {
    if (!ai) return "AI Service not configured.";

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Act as a kind but strict teacher. Provide a brief constructive feedback evaluation for a student submission.
            
            Assignment: ${assignmentDescription}
            Student Submission: "${studentContent}"
            
            Keep it under 100 words. Focus on improvements.`,
        });
        return response.text || "No feedback generated.";
    } catch (error) {
        return "Error generating feedback.";
    }
}