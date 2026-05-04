import React, { useState } from 'react';
import { useAppStore } from '../services/store';
import { Crown, Download } from 'lucide-react';
import { getApplicableSubjects } from '../types';

interface ScoreData {
    fullMarks?: number;
    passMarks?: number;
    obtained?: number;
    practicalFullMarks?: number;
    practicalPassMarks?: number;
    practicalObtained?: number;
}

interface ClassLedgerProps {
    allowedClassIds?: string[]; // If undefined, all classes allowed
}

const ClassLedger: React.FC<ClassLedgerProps> = ({ allowedClassIds }) => {
    const { state } = useAppStore();
    const [selectedSessionId, setSelectedSessionId] = useState("");
    const [selectedClassId, setSelectedClassId] = useState("");
    const [selectedSection, setSelectedSection] = useState("");

    const availableClasses = allowedClassIds 
        ? state.systemClasses.filter(c => allowedClassIds.includes(c.name))
        : state.systemClasses;

    const selectedClassData = availableClasses.find(c => c.name === selectedClassId);

    const getStudentStats = (studentId: string, sessionId: string) => {
        const student = state.users.find(u => u.id === studentId);
        if (!student || !student.classId) return { totalObtained: 0, totalFull: 0, pass: false, percentage: 0 };
        
        const report = state.examReports.find(r => r.studentId === studentId && (r.examSessionId === sessionId || r.term === sessionId));
        if (!report) return { totalObtained: 0, totalFull: 0, pass: false, percentage: 0 };

        const applicableSubjects = getApplicableSubjects(state.availableSubjects, student.classId, student.section);
        let totalObtained = 0;
        let totalFull = 0;
        let pass = true;

        applicableSubjects.forEach(s => {
            const effectiveType = s.classTypes?.[student.classId!] || s.type;
            const scoreData = report.scores[s.name] as ScoreData | undefined;

            if (effectiveType === 'Theory' || effectiveType === 'Both') {
                const f = scoreData?.fullMarks ?? 100;
                const p = scoreData?.passMarks ?? 40;
                const o = scoreData?.obtained ?? 0;
                if (f > 0) {
                    totalObtained += o;
                    totalFull += f;
                    if (o < p) pass = false;
                }
            }
            if (effectiveType === 'Practical' || effectiveType === 'Both') {
                const f = scoreData?.practicalFullMarks ?? 50;
                const p = scoreData?.practicalPassMarks ?? 20;
                const o = scoreData?.practicalObtained ?? 0;
                if (f > 0) {
                    totalObtained += o;
                    totalFull += f;
                    if (o < p) pass = false;
                }
            }
        });

        return { totalObtained, totalFull, pass, percentage: totalFull > 0 ? (totalObtained / totalFull) * 100 : 0 };
    };

    const classReports = state.examReports.filter(r => {
        const student = state.users.find(u => u.id === r.studentId);
        return (
            (r.examSessionId === selectedSessionId || r.term === selectedSessionId) && 
            student?.classId === selectedClassId &&
            (!selectedSection || student?.section === selectedSection) &&
            student?.status === 'active'
        );
    });

    const leaderboard = classReports.map(r => {
        const stats = getStudentStats(r.studentId, selectedSessionId);
        return {
            studentId: r.studentId,
            studentName: state.users.find(u => u.id === r.studentId)?.name,
            totalObtained: stats.totalObtained,
            totalFull: stats.totalFull,
            percentage: stats.percentage
        };
    }).sort((a, b) => b.percentage - a.percentage);

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-galaxy-900">Class Ledger</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-xl border">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Select Term / Session</label>
                    <select
                        className="w-full border p-2 rounded"
                        value={selectedSessionId}
                        onChange={(e) => setSelectedSessionId(e.target.value)}
                    >
                        <option value="">-- Choose Term --</option>
                        {state.examSessions.map(session => (
                            <option key={session.id} value={session.id}>{session.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Select Class</label>
                    <select
                        className="w-full border p-2 rounded"
                        value={selectedClassId}
                        onChange={(e) => {
                            setSelectedClassId(e.target.value);
                            setSelectedSection("");
                        }}
                    >
                        <option value="">-- Choose Class --</option>
                        {availableClasses.map(c => (
                            <option key={c.name} value={c.name}>{c.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Select Section</label>
                    <select
                        className="w-full border p-2 rounded"
                        value={selectedSection}
                        onChange={(e) => setSelectedSection(e.target.value)}
                        disabled={!selectedClassData || selectedClassData.sections.length === 0}
                    >
                        <option value="">All Sections</option>
                        {selectedClassData?.sections.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>
            </div>

            {selectedSessionId && selectedClassId && (
                <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-galaxy-900 text-white p-4">
                        <h4 className="font-bold">Ledger Leaderboard</h4>
                    </div>
                    {leaderboard.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No reports found for this class/section in the selected term.</div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-bold">
                                <tr>
                                    <th className="p-3">Rank</th>
                                    <th className="p-3">Student Name</th>
                                    <th className="p-3 text-right">Total Obtained</th>
                                    <th className="p-3 text-right">Percentage</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {leaderboard.map((item, idx) => (
                                    <tr key={item.studentId} className="hover:bg-gray-50">
                                        <td className="p-3 font-mono text-gray-500">
                                            {idx === 0 ? <Crown size={16} className="text-gold-500 inline mr-1" /> : `#${idx + 1}`}
                                        </td>
                                        <td className="p-3 font-medium">
                                            {item.studentName}
                                        </td>
                                        <td className="p-3 text-right font-mono">{item.totalObtained} / {item.totalFull}</td>
                                        <td className="p-3 text-right font-bold">{item.percentage.toFixed(2)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
};

export default ClassLedger;
