
import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini API client using the API key from environment variables.
// Following @google/genai guidelines for direct initialization.
// const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const ai = new GoogleGenAI({ apiKey: '12345678' });

export const generateAssignmentIdeas = async (subject: string, topic: string): Promise<string> => {
  try {
    // Using gemini-3-flash-preview for general text tasks as recommended.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Create 3 distinct assignment ideas for a college level class on the subject "${subject}" specifically regarding "${topic}". 
      Include a brief title and description for each. Format as a clean list.`,
    });
    // The text property is a getter, not a method.
    return response.text || "No response generated.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating assignment ideas. Please try again.";
  }
};

export const generateFeedbackHelper = async (studentContent: string, assignmentDescription: string): Promise<string> => {
    try {
        // Using gemini-3-flash-preview for constructive feedback tasks.
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Act as a kind but strict teacher. Provide a brief constructive feedback evaluation for a student submission.
            
            Assignment: ${assignmentDescription}
            Student Submission: "${studentContent}"
            
            Keep it under 100 words. Focus on improvements.`,
        });
        // The text property is a getter, not a method.
        return response.text || "No feedback generated.";
    } catch (error) {
        console.error("Gemini Error:", error);
        return "Error generating feedback.";
    }
}
