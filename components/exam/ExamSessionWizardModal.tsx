import React, { useState, useEffect } from 'react';
import { ExamSession, ExamType, Subject, SystemClass, User, getApplicableSubjects } from '../../types';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  X,
  BookOpen,
  Users,
  CheckCircle,
  Calendar,
  Layers,
  Sparkles,
  Copy,
  AlertCircle
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (sessionData: {
    id?: string;
    name: string;
    type: ExamType;
    startDate: string;
    applicableClasses?: string[];
    applicableSections?: Record<string, string[]>;
    applicableSubjects?: Record<string, string[]>;
  }) => void;
  initialSession?: ExamSession | null;
  systemClasses: SystemClass[];
  availableSubjects: Subject[];
  users: User[];
}

export const ExamSessionWizardModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  initialSession,
  systemClasses,
  availableSubjects,
  users
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [sessionName, setSessionName] = useState('');
  const [sessionType, setSessionType] = useState<ExamType>('Term Exam');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  // Selected Classes: empty array means "All Classes"
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  // Selected Sections per Class: classId -> array of section names
  const [selectedSections, setSelectedSections] = useState<Record<string, string[]>>({});

  // Selected Subjects per Section: `${classId}_${section}` or `${classId}` -> array of subject names
  const [selectedSubjects, setSelectedSubjects] = useState<Record<string, string[]>>({});

  // Active section drilldown in Step 3
  const [activeDrillKey, setActiveDrillKey] = useState<string>('');

  // Validation errors
  const [error, setError] = useState<string | null>(null);

  // Initialize or reset when opened
  useEffect(() => {
    if (!isOpen) return;

    if (initialSession) {
      setSessionName(initialSession.name);
      setSessionType(initialSession.type);
      setStartDate(initialSession.startDate || new Date().toISOString().split('T')[0]);
      setSelectedClasses(initialSession.applicableClasses ? [...initialSession.applicableClasses] : []);
      setSelectedSections(initialSession.applicableSections ? { ...initialSession.applicableSections } : {});
      setSelectedSubjects(initialSession.applicableSubjects ? { ...initialSession.applicableSubjects } : {});
    } else {
      setSessionName('');
      setSessionType('Term Exam');
      setStartDate(new Date().toISOString().split('T')[0]);
      setSelectedClasses([]);
      setSelectedSections({});
      setSelectedSubjects({});
    }
    setStep(1);
    setError(null);
  }, [isOpen, initialSession]);

  // Determine effective classes participating
  const effectiveClasses = selectedClasses.length > 0
    ? selectedClasses
    : systemClasses.map(c => c.name);

  // Helpers to get student count
  const getSectionStudentCount = (classId: string, section: string) => {
    return users.filter(u => u.role === 'student' && u.classId === classId && u.section === section && u.status === 'active').length;
  };

  const getClassStudentCount = (classId: string) => {
    return users.filter(u => u.role === 'student' && u.classId === classId && u.status === 'active').length;
  };

  // Helper to get selected sections for a class (defaults to all sections of that class)
  const getChosenSectionsForClass = (classId: string) => {
    const cls = systemClasses.find(c => c.name === classId);
    if (!cls) return [];
    const chosen = selectedSections[classId];
    if (chosen && chosen.length > 0) return chosen;
    // Default is all sections of that class
    return cls.sections || [];
  };

  // Helper to get selected subjects for a section
  const getChosenSubjectsForSection = (classId: string, section: string) => {
    const key = `${classId}_${section}`;
    const specific = selectedSubjects[key];
    if (specific && specific.length > 0) return specific;
    const classFallback = selectedSubjects[classId];
    if (classFallback && classFallback.length > 0) return classFallback;
    // Default is all applicable subjects
    return getApplicableSubjects(availableSubjects, classId, section).map(s => s.name);
  };

  // Build the list of all section drill keys for Step 3
  const allSectionDrillKeys: { classId: string; section: string; key: string }[] = [];
  effectiveClasses.forEach(clsName => {
    const sections = getChosenSectionsForClass(clsName);
    sections.forEach(sec => {
      allSectionDrillKeys.push({
        classId: clsName,
        section: sec,
        key: `${clsName}_${sec}`
      });
    });
  });

  // Ensure active drill key is set when entering Step 3
  useEffect(() => {
    if (step === 3 && allSectionDrillKeys.length > 0) {
      if (!allSectionDrillKeys.some(k => k.key === activeDrillKey)) {
        setActiveDrillKey(allSectionDrillKeys[0].key);
      }
    }
  }, [step, allSectionDrillKeys, activeDrillKey]);

  if (!isOpen) return null;

  // Validation handlers before proceeding to next step
  const handleNextFromStep1 = () => {
    if (!sessionName.trim()) {
      setError('Please enter an exam session name.');
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleNextFromStep2 = () => {
    // Validate that each effective class has at least 1 section selected
    for (const clsName of effectiveClasses) {
      const secs = getChosenSectionsForClass(clsName);
      if (secs.length === 0) {
        setError(`Class ${clsName} has no sections selected. Please select at least one section or deselect the class.`);
        return;
      }
    }
    setError(null);
    setStep(3);
  };

  const handleNextFromStep3 = () => {
    // Validate that each section has at least 1 subject selected
    for (const item of allSectionDrillKeys) {
      const subjs = getChosenSubjectsForSection(item.classId, item.section);
      if (subjs.length === 0) {
        setError(`Class ${item.classId} (${item.section}) has no subjects selected. Please select at least one subject.`);
        return;
      }
    }
    setError(null);
    setStep(4);
  };

  const handleFinalSubmit = () => {
    onSave({
      id: initialSession?.id,
      name: sessionName.trim(),
      type: sessionType,
      startDate,
      applicableClasses: selectedClasses.length > 0 ? selectedClasses : undefined,
      applicableSections: Object.keys(selectedSections).length > 0 ? selectedSections : undefined,
      applicableSubjects: Object.keys(selectedSubjects).length > 0 ? selectedSubjects : undefined
    });
    onClose();
  };

  // Section toggle logic
  const handleToggleSection = (classId: string, section: string) => {
    const cls = systemClasses.find(c => c.name === classId);
    if (!cls) return;
    const allSections = cls.sections || [];
    const current = selectedSections[classId] || [...allSections];

    let updated: string[];
    if (current.includes(section)) {
      updated = current.filter(s => s !== section);
    } else {
      updated = [...current, section];
    }

    setSelectedSections(prev => ({
      ...prev,
      [classId]: updated
    }));
  };

  const handleSelectAllSections = (classId: string) => {
    const cls = systemClasses.find(c => c.name === classId);
    if (!cls) return;
    setSelectedSections(prev => ({
      ...prev,
      [classId]: [...(cls.sections || [])]
    }));
  };

  // Subject toggle logic for a section
  const handleToggleSubject = (classId: string, section: string, subjectName: string) => {
    const key = `${classId}_${section}`;
    const allPossible = getApplicableSubjects(availableSubjects, classId, section).map(s => s.name);
    const current = selectedSubjects[key] || getChosenSubjectsForSection(classId, section) || [...allPossible];

    let updated: string[];
    if (current.includes(subjectName)) {
      updated = current.filter(s => s !== subjectName);
    } else {
      updated = [...current, subjectName];
    }

    setSelectedSubjects(prev => ({
      ...prev,
      [key]: updated
    }));
  };

  const handleSelectAllSubjectsForSection = (classId: string, section: string) => {
    const key = `${classId}_${section}`;
    const allPossible = getApplicableSubjects(availableSubjects, classId, section).map(s => s.name);
    setSelectedSubjects(prev => ({
      ...prev,
      [key]: [...allPossible]
    }));
  };

  const handleCopySubjectsToAllSectionsInClass = (sourceClassId: string, sourceSection: string) => {
    const sourceKey = `${sourceClassId}_${sourceSection}`;
    const subjs = getChosenSubjectsForSection(sourceClassId, sourceSection);
    const sections = getChosenSectionsForClass(sourceClassId);

    const nextSubjects = { ...selectedSubjects };
    sections.forEach(sec => {
      const targetKey = `${sourceClassId}_${sec}`;
      // Filter subjs to those applicable to target section
      const applicableNames = getApplicableSubjects(availableSubjects, sourceClassId, sec).map(s => s.name);
      nextSubjects[targetKey] = subjs.filter(s => applicableNames.includes(s));
    });
    setSelectedSubjects(nextSubjects);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full flex flex-col max-h-[92vh] overflow-hidden border border-gray-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b bg-gradient-to-r from-galaxy-900 via-galaxy-800 to-galaxy-900 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-white/10 rounded-lg backdrop-blur-xs">
                <Layers size={18} className="text-yellow-300" />
              </span>
              <h2 className="text-lg md:text-xl font-bold">
                {initialSession ? `Edit Exam Scope: ${initialSession.name}` : 'Create Exam Session'}
              </h2>
            </div>
            <p className="text-xs text-gray-300 mt-0.5">
              Step-by-step configuration for classes, sections, and subjects
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="px-6 py-3 bg-gray-50 border-b flex items-center justify-between text-xs">
          {[
            { num: 1, label: 'Session & Class' },
            { num: 2, label: 'Sections' },
            { num: 3, label: 'Subjects Drill-down' },
            { num: 4, label: 'Review & Confirm' }
          ].map((s, idx) => (
            <React.Fragment key={s.num}>
              <div
                className={`flex items-center gap-2 cursor-pointer transition ${
                  step === s.num
                    ? 'text-galaxy-900 font-bold'
                    : step > s.num
                    ? 'text-emerald-700 font-medium'
                    : 'text-gray-400'
                }`}
                onClick={() => {
                  if (s.num < step) setStep(s.num as any);
                }}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition ${
                    step === s.num
                      ? 'bg-galaxy-900 text-white shadow-xs'
                      : step > s.num
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step > s.num ? <Check size={13} strokeWidth={3} /> : s.num}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {idx < 3 && <div className={`flex-1 h-0.5 mx-2 ${step > idx + 1 ? 'bg-emerald-500' : 'bg-gray-200'}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700 font-medium">
              <AlertCircle size={16} className="text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Session Details & Class Selection */}
          {step === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-1">
                  1. Exam Session Details
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  Define the name, type, and commencement date for this exam session.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Session Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., First Term Examination 2026, Unit Test 1"
                      className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-galaxy-500 focus:border-galaxy-500"
                      value={sessionName}
                      onChange={e => setSessionName(e.target.value)}
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="text-[11px] text-gray-400 self-center">Quick suggestions:</span>
                      {['1st Term Exam', '2nd Term Exam', 'Unit Test 1', 'Unit Test 2', 'Monthly Test', 'Pre-Board Exam'].map(sugg => (
                        <button
                          key={sugg}
                          type="button"
                          onClick={() => setSessionName(sugg)}
                          className="text-[11px] px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition"
                        >
                          {sugg}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Exam Type
                    </label>
                    <select
                      className="w-full border border-gray-300 p-2.5 rounded-lg text-sm bg-white focus:ring-2 focus:ring-galaxy-500"
                      value={sessionType}
                      onChange={e => setSessionType(e.target.value as ExamType)}
                    >
                      <option value="Term Exam">Term Exam</option>
                      <option value="Unit Test">Unit Test</option>
                      <option value="Monthly Test">Monthly Test</option>
                      <option value="Viva Exam">Viva Exam</option>
                      <option value="Final Exam">Final Exam</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                      2. Select Participating Classes
                    </h3>
                    <p className="text-xs text-gray-500">
                      Choose which class or classes are participating in this exam session.
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-galaxy-50 text-galaxy-800 rounded-full border border-galaxy-200">
                    {selectedClasses.length === 0 ? 'All Classes Selected' : `${selectedClasses.length} of ${systemClasses.length} Selected`}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-3">
                  <div
                    onClick={() => setSelectedClasses([])}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition text-center flex flex-col justify-center items-center ${
                      selectedClasses.length === 0
                        ? 'border-galaxy-800 bg-galaxy-50/70 shadow-xs'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="font-bold text-sm text-galaxy-900 flex items-center gap-1.5">
                      {selectedClasses.length === 0 && <CheckCircle size={15} className="text-galaxy-800" />}
                      All Classes
                    </div>
                    <span className="text-[11px] text-gray-500 mt-1">Open to entire school</span>
                  </div>

                  {systemClasses.map(cls => {
                    const isSelected = selectedClasses.includes(cls.name);
                    const studentCount = getClassStudentCount(cls.name);
                    return (
                      <div
                        key={cls.name}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedClasses(selectedClasses.filter(c => c !== cls.name));
                          } else {
                            setSelectedClasses([...selectedClasses, cls.name]);
                          }
                        }}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                          isSelected
                            ? 'border-galaxy-600 bg-galaxy-50/50 shadow-xs'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-gray-900">Class {cls.name}</span>
                          <span
                            className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                              isSelected ? 'bg-galaxy-600 text-white' : 'border border-gray-300'
                            }`}
                          >
                            {isSelected && <Check size={11} strokeWidth={3} />}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-500 mt-2 flex items-center justify-between">
                          <span>{cls.sections?.length || 0} sections</span>
                          <span>{studentCount} students</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Section Selection */}
          {step === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-1">
                  Select Participating Sections
                </h3>
                <p className="text-xs text-gray-500">
                  For each chosen class, select which sections will have this exam. You can choose all sections or only specific sections.
                </p>
              </div>

              <div className="space-y-4">
                {effectiveClasses.map(clsName => {
                  const cls = systemClasses.find(c => c.name === clsName);
                  const allSections = cls?.sections || [];
                  const chosen = getChosenSectionsForClass(clsName);
                  const isAllSelected = chosen.length === allSections.length;

                  return (
                    <div key={clsName} className="p-4 bg-gray-50/60 rounded-xl border border-gray-200 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-galaxy-800 text-white flex items-center justify-center font-bold text-xs">
                            {clsName}
                          </span>
                          <div>
                            <span className="font-bold text-sm text-gray-900">Class {clsName}</span>
                            <span className="text-xs text-gray-500 ml-2">
                              ({chosen.length} of {allSections.length} sections selected)
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSelectAllSections(clsName)}
                            className={`text-xs px-2.5 py-1 rounded transition ${
                              isAllSelected
                                ? 'bg-galaxy-900 text-white font-semibold'
                                : 'bg-white border text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSections(prev => ({
                                ...prev,
                                [clsName]: []
                              }));
                            }}
                            className="text-xs px-2.5 py-1 rounded bg-white border text-gray-600 hover:bg-gray-100 transition"
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      {allSections.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">No sections created for this class.</p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                          {allSections.map(sec => {
                            const isChecked = chosen.includes(sec);
                            const studentCount = getSectionStudentCount(clsName, sec);

                            return (
                              <button
                                key={sec}
                                type="button"
                                onClick={() => handleToggleSection(clsName, sec)}
                                className={`p-3 rounded-lg border text-left transition flex items-center justify-between ${
                                  isChecked
                                    ? 'bg-white border-galaxy-600 ring-2 ring-galaxy-500/20 shadow-xs'
                                    : 'bg-white/60 border-gray-200 hover:border-gray-300 opacity-60'
                                }`}
                              >
                                <div>
                                  <div className="font-bold text-xs text-gray-900">{sec}</div>
                                  <div className="text-[11px] text-gray-500">{studentCount} students</div>
                                </div>
                                <div
                                  className={`w-4 h-4 rounded flex items-center justify-center ${
                                    isChecked ? 'bg-galaxy-600 text-white' : 'border border-gray-300'
                                  }`}
                                >
                                  {isChecked && <Check size={12} strokeWidth={3} />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Subjects Drill-Down per Section */}
          {step === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-1">
                  Drill Down: Specific Subjects per Section
                </h3>
                <p className="text-xs text-gray-500">
                  Select each section to specify which subjects will have exams. You can also copy the subject list to all other sections with one click.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Left Column: Sections List */}
                <div className="md:col-span-4 space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-1 mb-1">
                    Sections ({allSectionDrillKeys.length})
                  </div>
                  {allSectionDrillKeys.map(item => {
                    const isSelected = activeDrillKey === item.key;
                    const subjs = getChosenSubjectsForSection(item.classId, item.section);
                    const allPossible = getApplicableSubjects(availableSubjects, item.classId, item.section);

                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setActiveDrillKey(item.key)}
                        className={`w-full p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                          isSelected
                            ? 'bg-galaxy-900 text-white border-galaxy-900 shadow-sm'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-xs flex items-center gap-1.5">
                            <span>Class {item.classId}</span>
                            <span className={isSelected ? 'text-gray-300' : 'text-gray-400'}>•</span>
                            <span>{item.section}</span>
                          </div>
                          <div className={`text-[11px] mt-0.5 ${isSelected ? 'text-galaxy-200' : 'text-gray-500'}`}>
                            {subjs.length} of {allPossible.length} subjects
                          </div>
                        </div>
                        <ChevronRight size={14} className={isSelected ? 'text-white' : 'text-gray-400'} />
                      </button>
                    );
                  })}
                </div>

                {/* Right Column: Subjects for Active Section */}
                <div className="md:col-span-8 p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col justify-between">
                  {(() => {
                    const activeItem = allSectionDrillKeys.find(k => k.key === activeDrillKey) || allSectionDrillKeys[0];
                    if (!activeItem) return <p className="text-xs text-gray-500">No section selected.</p>;

                    const classId = activeItem.classId;
                    const section = activeItem.section;
                    const applicable = getApplicableSubjects(availableSubjects, classId, section);
                    const chosen = getChosenSubjectsForSection(classId, section);
                    const isAll = chosen.length === applicable.length;

                    return (
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-3">
                          <div>
                            <div className="text-xs font-bold text-galaxy-900 flex items-center gap-1.5">
                              <span>Class {classId}</span>
                              <span className="text-gray-400">•</span>
                              <span className="text-galaxy-700">{section}</span>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              {chosen.length} subjects selected for this section
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSelectAllSubjectsForSection(classId, section)}
                              className={`text-[11px] px-2.5 py-1 rounded transition ${
                                isAll ? 'bg-galaxy-800 text-white font-bold' : 'bg-white border text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              All Subjects
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopySubjectsToAllSectionsInClass(classId, section)}
                              title="Copy these selected subjects to all other sections of this class"
                              className="text-[11px] px-2.5 py-1 rounded bg-white border border-galaxy-300 text-galaxy-800 hover:bg-galaxy-50 font-medium flex items-center gap-1 transition"
                            >
                              <Copy size={11} /> Copy to Class {classId}
                            </button>
                          </div>
                        </div>

                        {applicable.length === 0 ? (
                          <p className="text-xs text-gray-400 italic">No applicable subjects found for this class and section.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1">
                            {applicable.map(subj => {
                              const isChecked = chosen.includes(subj.name);
                              const effectiveType = subj.classTypes?.[classId] || subj.type;

                              return (
                                <button
                                  key={subj.name}
                                  type="button"
                                  onClick={() => handleToggleSubject(classId, section, subj.name)}
                                  className={`p-2.5 rounded-lg border text-left transition flex items-center justify-between ${
                                    isChecked
                                      ? 'bg-white border-galaxy-600 ring-2 ring-galaxy-500/15 shadow-xs'
                                      : 'bg-white/50 border-gray-200 hover:border-gray-300 opacity-60'
                                  }`}
                                >
                                  <div>
                                    <div className="font-bold text-xs text-gray-900">{subj.name}</div>
                                    <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded mt-0.5 inline-block">
                                      {effectiveType}
                                    </span>
                                  </div>
                                  <div
                                    className={`w-4 h-4 rounded flex items-center justify-center ${
                                      isChecked ? 'bg-galaxy-600 text-white' : 'border border-gray-300'
                                    }`}
                                  >
                                    {isChecked && <Check size={11} strokeWidth={3} />}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Review & Confirm */}
          {step === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-1">
                  Review Exam Session Scope
                </h3>
                <p className="text-xs text-gray-500">
                  Verify the session details and the exact hierarchy of participating classes, sections, and subjects.
                </p>
              </div>

              {/* Session Overview Card */}
              <div className="p-4 bg-gradient-to-r from-galaxy-50 to-blue-50/50 rounded-xl border border-galaxy-200 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base text-galaxy-900">{sessionName}</span>
                    <span className="text-xs bg-galaxy-800 text-white px-2 py-0.5 rounded font-bold">
                      {sessionType}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 flex items-center gap-1.5">
                    <Calendar size={13} /> Starts on: {startDate}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-galaxy-900">
                    {effectiveClasses.length} {effectiveClasses.length === 1 ? 'Class' : 'Classes'} • {allSectionDrillKeys.length} {allSectionDrillKeys.length === 1 ? 'Section' : 'Sections'}
                  </div>
                  <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Ready to launch
                  </span>
                </div>
              </div>

              {/* Hierarchy Tree Card */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Configured Scope Hierarchy:
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {effectiveClasses.map(clsName => {
                    const sections = getChosenSectionsForClass(clsName);

                    return (
                      <div key={clsName} className="p-3.5 bg-white rounded-xl border border-gray-200 space-y-2 shadow-xs">
                        <div className="flex items-center justify-between border-b pb-2">
                          <div className="font-bold text-sm text-galaxy-900 flex items-center gap-2">
                            <span className="w-5 h-5 rounded bg-galaxy-100 text-galaxy-800 flex items-center justify-center text-xs">
                              {clsName}
                            </span>
                            Class {clsName}
                          </div>
                          <span className="text-xs text-gray-500 font-medium">
                            {sections.length} {sections.length === 1 ? 'section' : 'sections'} participating
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {sections.map(sec => {
                            const subjs = getChosenSubjectsForSection(clsName, sec);

                            return (
                              <div key={sec} className="p-2.5 bg-gray-50 rounded-lg border border-gray-100 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-xs text-gray-800">Section {sec}</span>
                                  <span className="text-[10px] font-semibold text-galaxy-700 bg-galaxy-100 px-1.5 py-0.2 rounded">
                                    {subjs.length} subjects
                                  </span>
                                </div>
                                <div className="text-[11px] text-gray-600 line-clamp-2">
                                  {subjs.join(', ')}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((step - 1) as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition flex items-center gap-1.5"
              >
                <ChevronLeft size={14} /> Back
              </button>
            )}

            {step === 1 && (
              <button
                type="button"
                onClick={handleNextFromStep1}
                className="px-5 py-2 bg-galaxy-900 text-white rounded-lg text-xs font-bold hover:bg-galaxy-800 transition flex items-center gap-1.5 shadow-sm"
              >
                Next: Select Sections <ChevronRight size={14} />
              </button>
            )}

            {step === 2 && (
              <button
                type="button"
                onClick={handleNextFromStep2}
                className="px-5 py-2 bg-galaxy-900 text-white rounded-lg text-xs font-bold hover:bg-galaxy-800 transition flex items-center gap-1.5 shadow-sm"
              >
                Next: Select Subjects <ChevronRight size={14} />
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                onClick={handleNextFromStep3}
                className="px-5 py-2 bg-galaxy-900 text-white rounded-lg text-xs font-bold hover:bg-galaxy-800 transition flex items-center gap-1.5 shadow-sm"
              >
                Next: Review Scope <ChevronRight size={14} />
              </button>
            )}

            {step === 4 && (
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle size={15} /> {initialSession ? 'Save Exam Scope' : 'Create Exam Session'}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
