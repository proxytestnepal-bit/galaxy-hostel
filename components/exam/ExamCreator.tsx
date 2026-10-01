import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../services/store';
import { dbActions } from '../../services/db';
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
  Copy,
  AlertCircle,
  Database,
  UploadCloud,
  RefreshCw,
  Sparkles
} from 'lucide-react';

interface ExamCreatorProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: (session: ExamSession) => void;
  initialSession?: ExamSession | null;
  mode?: 'modal' | 'embedded';
}

export const ExamCreator: React.FC<ExamCreatorProps> = ({
  isOpen = true,
  onClose,
  onSuccess,
  initialSession,
  mode = 'modal'
}) => {
  const { state, dispatch } = useAppStore();
  const { systemClasses, availableSubjects, users } = state;

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form Fields
  const [sessionName, setSessionName] = useState('');
  const [sessionType, setSessionType] = useState<ExamType>('Term Exam');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  // Step 1: Selected Classes (empty array = All Classes)
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  // Step 2: Selected Sections per Class: classId -> array of section names
  const [selectedSections, setSelectedSections] = useState<Record<string, string[]>>({});

  // Step 3: Selected Subjects per Section: `${classId}_${section}` -> array of subject names
  const [sectionSubjects, setSectionSubjects] = useState<Record<string, string[]>>({});

  // Active section drilldown in Step 3 (key: `${classId}_${section}`)
  const [activeDrillKey, setActiveDrillKey] = useState<string>('');

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Only consider non-archived classes by default, unless initialSession uses archived ones
  const activeSystemClasses = systemClasses.filter(c => !c.isArchived);
  const allClassesList = activeSystemClasses.length > 0 ? activeSystemClasses : systemClasses;

  // Determine effective classes participating
  const effectiveClasses = selectedClasses.length > 0
    ? selectedClasses
    : allClassesList.map(c => c.name);

  // Helper to count active students
  const getClassStudentCount = (classId: string) => {
    return users.filter(u => u.role === 'student' && u.classId === classId && u.status === 'active').length;
  };

  const getSectionStudentCount = (classId: string, section: string) => {
    return users.filter(u => u.role === 'student' && u.classId === classId && u.section === section && u.status === 'active').length;
  };

  // Helper to get selected sections for a class (defaults to all sections of that class)
  const getChosenSectionsForClass = (classId: string) => {
    const cls = systemClasses.find(c => c.name === classId);
    if (!cls) return [];
    const chosen = selectedSections[classId];
    if (chosen !== undefined) return chosen;
    return cls.sections || [];
  };

  // Helper to get selected subjects for a section
  const getChosenSubjectsForSection = (classId: string, section: string) => {
    const key = `${classId}_${section}`;
    const specific = sectionSubjects[key];
    if (specific !== undefined) return specific;
    const classFallback = sectionSubjects[classId];
    if (classFallback !== undefined) return classFallback;
    return getApplicableSubjects(availableSubjects, classId, section).map(s => s.name);
  };

  const hasInitializedRef = React.useRef(false);

  // Build the list of all section drill keys for Step 3
  const allSectionDrillKeys = React.useMemo(() => {
    const list: { classId: string; section: string; key: string }[] = [];
    effectiveClasses.forEach(clsName => {
      const sections = getChosenSectionsForClass(clsName);
      sections.forEach(sec => {
        list.push({
          classId: clsName,
          section: sec,
          key: `${clsName}_${sec}`
        });
      });
    });
    return list;
  }, [effectiveClasses, selectedSections, systemClasses]);

  // Preload initial session if editing - runs ONLY ONCE when modal opens or session ID changes
  useEffect(() => {
    if (!isOpen) {
      hasInitializedRef.current = false;
      return;
    }

    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      if (initialSession) {
        setSessionName(initialSession.name || '');
        setSessionType(initialSession.type || 'Term Exam');
        setStartDate(initialSession.startDate || new Date().toISOString().split('T')[0]);
        setSelectedClasses(initialSession.applicableClasses ? [...initialSession.applicableClasses] : []);
        setSelectedSections(initialSession.applicableSections ? { ...initialSession.applicableSections } : {});
        setSectionSubjects(initialSession.applicableSubjects ? { ...initialSession.applicableSubjects } : {});
      } else {
        setSessionName('');
        setSessionType('Term Exam');
        setStartDate(new Date().toISOString().split('T')[0]);
        setSelectedClasses([]); // Defaults to All Classes
        setSelectedSections({});
        setSectionSubjects({});
      }
      setStep(1);
      setError(null);
      setSaveSuccess(false);
    }
  }, [isOpen, initialSession?.id]);

  // Ensure active drill key is set when entering Step 3
  useEffect(() => {
    if (step === 3 && allSectionDrillKeys.length > 0) {
      if (!allSectionDrillKeys.some(k => k.key === activeDrillKey)) {
        setActiveDrillKey(allSectionDrillKeys[0].key);
      }
    }
  }, [step, allSectionDrillKeys, activeDrillKey]);

  // Step 1 Validation -> Step 2
  const handleNextToSections = () => {
    if (!sessionName.trim()) {
      setError('Please provide a name for this exam session.');
      return;
    }
    setError(null);
    setStep(2);
  };

  // Step 2 Validation -> Step 3
  const handleNextToSubjects = () => {
    for (const clsName of effectiveClasses) {
      const secs = getChosenSectionsForClass(clsName);
      if (secs.length === 0) {
        setError(`Class ${clsName} has no sections selected. Please select at least one section or adjust your selected classes.`);
        return;
      }
    }
    setError(null);
    setStep(3);
  };

  // Step 3 Validation -> Step 4
  const handleNextToReview = () => {
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

  // Class toggle logic in Step 1
  const handleToggleClass = (clsName: string) => {
    if (selectedClasses.includes(clsName)) {
      const next = selectedClasses.filter(c => c !== clsName);
      setSelectedClasses(next);
    } else {
      setSelectedClasses([...selectedClasses, clsName]);
    }
  };

  // Section toggle logic in Step 2
  const handleToggleSection = (classId: string, section: string) => {
    const cls = systemClasses.find(c => c.name === classId);
    if (!cls) return;
    const allSecs = cls.sections || [];
    const current = selectedSections[classId] || [...allSecs];

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

  const handleToggleAllSectionsForClass = (classId: string) => {
    const cls = systemClasses.find(c => c.name === classId);
    if (!cls) return;
    const allSecs = cls.sections || [];
    const current = getChosenSectionsForClass(classId);

    if (current.length === allSecs.length) {
      setSelectedSections(prev => ({
        ...prev,
        [classId]: []
      }));
    } else {
      setSelectedSections(prev => ({
        ...prev,
        [classId]: [...allSecs]
      }));
    }
  };

  // Subject toggle logic in Step 3
  const handleToggleSubject = (classId: string, section: string, subjectName: string) => {
    const key = `${classId}_${section}`;
    const allPossible = getApplicableSubjects(availableSubjects, classId, section).map(s => s.name);
    const current = sectionSubjects[key] || getChosenSubjectsForSection(classId, section) || [...allPossible];

    let updated: string[];
    if (current.includes(subjectName)) {
      updated = current.filter(s => s !== subjectName);
    } else {
      updated = [...current, subjectName];
    }

    setSectionSubjects(prev => ({
      ...prev,
      [key]: updated
    }));
  };

  const handleSelectAllSubjectsForSection = (classId: string, section: string) => {
    const key = `${classId}_${section}`;
    const allPossible = getApplicableSubjects(availableSubjects, classId, section).map(s => s.name);
    setSectionSubjects(prev => ({
      ...prev,
      [key]: [...allPossible]
    }));
  };

  const handleCopySubjectsToClass = (sourceClassId: string, sourceSection: string) => {
    const subjs = getChosenSubjectsForSection(sourceClassId, sourceSection);
    const sections = getChosenSectionsForClass(sourceClassId);

    const nextMap = { ...sectionSubjects };
    sections.forEach(sec => {
      const targetKey = `${sourceClassId}_${sec}`;
      const applicableNames = getApplicableSubjects(availableSubjects, sourceClassId, sec).map(s => s.name);
      nextMap[targetKey] = subjs.filter(s => applicableNames.includes(s));
    });
    setSectionSubjects(nextMap);
  };

  const handleCopySubjectsToAllClasses = (sourceClassId: string, sourceSection: string) => {
    const subjs = getChosenSubjectsForSection(sourceClassId, sourceSection);
    const nextMap = { ...sectionSubjects };

    effectiveClasses.forEach(clsName => {
      const sections = getChosenSectionsForClass(clsName);
      sections.forEach(sec => {
        const targetKey = `${clsName}_${sec}`;
        const applicableNames = getApplicableSubjects(availableSubjects, clsName, sec).map(s => s.name);
        nextMap[targetKey] = subjs.filter(s => applicableNames.includes(s));
      });
    });
    setSectionSubjects(nextMap);
  };

  // Step 4: Store in Firebase Database
  const handleStoreInFirebase = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // Build applicableSubjects payload
      const applicableSubjectsPayload: Record<string, string[]> = {};
      allSectionDrillKeys.forEach(item => {
        const key = `${item.classId}_${item.section}`;
        applicableSubjectsPayload[key] = getChosenSubjectsForSection(item.classId, item.section);
      });

      // Class fallbacks
      effectiveClasses.forEach(clsName => {
        const sections = getChosenSectionsForClass(clsName);
        const subjsForClass = Array.from(new Set(
          sections.flatMap(sec => getChosenSubjectsForSection(clsName, sec))
        ));
        applicableSubjectsPayload[clsName] = subjsForClass;
      });

      const sessionPayload: ExamSession = {
        id: initialSession?.id || `es${Date.now()}`,
        name: sessionName.trim(),
        type: sessionType,
        status: initialSession?.status || 'open',
        startDate,
        applicableClasses: selectedClasses.length > 0 ? selectedClasses : undefined,
        applicableSections: Object.keys(selectedSections).length > 0 ? selectedSections : undefined,
        applicableSubjects: Object.keys(applicableSubjectsPayload).length > 0 ? applicableSubjectsPayload : undefined
      };

      // Store in Firebase Firestore
      if (initialSession?.id) {
        await dbActions.updateExamSession(sessionPayload);
        dispatch({ type: 'UPDATE_EXAM_SESSION', payload: sessionPayload });
      } else {
        await dbActions.addExamSession(sessionPayload);
        dispatch({ type: 'ADD_EXAM_SESSION', payload: sessionPayload });
      }

      setSaveSuccess(true);
      if (onSuccess) {
        onSuccess(sessionPayload);
      }

      setTimeout(() => {
        if (onClose) onClose();
      }, 900);

    } catch (err: any) {
      console.error('Failed to store exam session in Firebase:', err);
      setError(err?.message || 'Failed to store exam session in Firebase database. Please check your connection.');
    } finally {
      setIsSaving(false);
    }
  };

  if (mode === 'modal' && !isOpen) return null;

  const content = (
    <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full flex flex-col max-h-[92vh] overflow-hidden border border-gray-100">
      {/* Top Header */}
      <div className="px-6 py-4 border-b bg-gradient-to-r from-galaxy-900 via-galaxy-800 to-galaxy-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs">
            <Layers size={22} className="text-yellow-300" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
              ExamCreator
              <span className="text-[10px] bg-yellow-400/20 text-yellow-300 border border-yellow-300/30 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                Multi-Step Workflow
              </span>
            </h2>
            <p className="text-xs text-gray-300">
              Select classes (one, many, or all) &rarr; choose sections &rarr; customize subjects &rarr; review and confirm
            </p>
          </div>
        </div>

        {mode === 'modal' && onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Stepper Progress Bar */}
      <div className="px-6 py-3 bg-gray-50 border-b flex items-center justify-between text-xs">
        {[
          { num: 1, label: '1. Classes & Name' },
          { num: 2, label: '2. Sections' },
          { num: 3, label: '3. Subjects' },
          { num: 4, label: '4. Review & Confirm' }
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
            {idx < 3 && (
              <div
                className={`flex-1 h-0.5 mx-2 transition-colors ${
                  step > idx + 1 ? 'bg-emerald-500' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Body Content */}
      <div className="p-6 overflow-y-auto flex-1 space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700 font-medium animate-shake">
            <AlertCircle size={16} className="text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {saveSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-bold animate-fadeIn">
            <CheckCircle size={18} className="text-emerald-600 shrink-0" />
            <span>{initialSession ? 'Exam session updated successfully!' : 'Exam session created successfully!'}</span>
          </div>
        )}

        {/* STEP 1: Select Classes & Exam Details */}
        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-1">
                Step 1: Exam Session Details & Target Classes
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Define the session name, select exam type, and choose one, multiple, or all participating classes.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Exam Session Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. First Term Exam 2026, Unit Test 1"
                    className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-galaxy-500 focus:border-galaxy-500"
                    value={sessionName}
                    onChange={e => setSessionName(e.target.value)}
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-[11px] text-gray-400 self-center">Suggestions:</span>
                    {['1st Term Exam', '2nd Term Exam', 'Unit Test 1', 'Unit Test 2', 'Monthly Test', 'Pre-Board'].map(sugg => (
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
                    className="w-full border border-gray-300 p-2.5 rounded-xl text-sm bg-white focus:ring-2 focus:ring-galaxy-500"
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
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Select Target Classes (One, Many, or All) <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Click "All Classes" to include the whole school, or toggle specific classes below.
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-galaxy-50 text-galaxy-800 rounded-full border border-galaxy-200">
                  {selectedClasses.length === 0
                    ? 'All Classes Selected (Whole School)'
                    : `${selectedClasses.length} of ${allClassesList.length} Classes Selected`}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-3">
                {/* "All Classes" Quick Button Card */}
                <div
                  onClick={() => setSelectedClasses([])}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition text-center flex flex-col justify-center items-center ${
                    selectedClasses.length === 0
                      ? 'border-galaxy-800 bg-galaxy-50/80 shadow-xs ring-2 ring-galaxy-800/10'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="font-extrabold text-sm text-galaxy-900 flex items-center gap-1.5">
                    {selectedClasses.length === 0 && <CheckCircle size={15} className="text-galaxy-800" />}
                    All Classes
                  </div>
                  <span className="text-[11px] text-gray-500 mt-1">Open to all active classes</span>
                </div>

                {/* Individual Class Cards */}
                {allClassesList.map(cls => {
                  const isSelected = selectedClasses.includes(cls.name);
                  const studentCount = getClassStudentCount(cls.name);

                  return (
                    <div
                      key={cls.name}
                      onClick={() => handleToggleClass(cls.name)}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                        isSelected
                          ? 'border-galaxy-800 bg-galaxy-50 shadow-xs ring-2 ring-galaxy-800/10'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-sm text-gray-900">Class {cls.name}</span>
                          {cls.isArchived && (
                            <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold">
                              Archived
                            </span>
                          )}
                        </div>
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                            isSelected ? 'bg-galaxy-800 text-white' : 'border border-gray-300'
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

        {/* STEP 2: Select Section(s) for All Chosen Classes */}
        {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                  Step 2: Select Sections for Chosen Classes ({effectiveClasses.length} {effectiveClasses.length === 1 ? 'Class' : 'Classes'})
                </h3>
              </div>
              <p className="text-xs text-gray-500">
                For each participating class, select which sections will have this exam. You can choose all sections, or any specific subset.
              </p>
            </div>

            <div className="space-y-4">
              {effectiveClasses.map(clsName => {
                const cls = systemClasses.find(c => c.name === clsName);
                const allSecs = cls?.sections || [];
                const chosen = getChosenSectionsForClass(clsName);
                const isAllSelected = chosen.length === allSecs.length;

                return (
                  <div key={clsName} className="p-4 bg-gray-50/70 rounded-xl border border-gray-200 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-galaxy-800 text-white flex items-center justify-center font-bold text-xs">
                          {clsName}
                        </span>
                        <div>
                          <span className="font-bold text-sm text-gray-900">Class {clsName}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({chosen.length} of {allSecs.length} sections selected)
                          </span>
                        </div>
                      </div>

                      {allSecs.length > 1 && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleAllSectionsForClass(clsName)}
                            className={`text-xs px-2.5 py-1 rounded-lg transition font-medium ${
                              isAllSelected
                                ? 'bg-galaxy-100 text-galaxy-800 hover:bg-galaxy-200'
                                : 'bg-white border text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {isAllSelected ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>
                      )}
                    </div>

                    {allSecs.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No sections created for Class {clsName}.</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                        {allSecs.map(sec => {
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

        {/* STEP 3: Drill Down to Select Subjects for Each Section */}
        {step === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-1">
                Step 3: Select Subjects for Each Chosen Section
              </h3>
              <p className="text-xs text-gray-500">
                Drill down into each chosen section and toggle the exact subjects to include in the exam.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Left Column: Sections List */}
              <div className="md:col-span-4 space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-1 mb-1">
                  Configured Sections ({allSectionDrillKeys.length})
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
                          <span className={isSelected ? 'text-gray-300' : 'text-gray-400'}>&bull;</span>
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
                            <span className="text-gray-400">&bull;</span>
                            <span className="text-galaxy-700">Section {section}</span>
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
                            onClick={() => handleCopySubjectsToClass(classId, section)}
                            title="Copy these selected subjects to all other sections of this class"
                            className="text-[11px] px-2.5 py-1 rounded bg-white border border-galaxy-300 text-galaxy-800 hover:bg-galaxy-50 font-medium flex items-center gap-1 transition"
                          >
                            <Copy size={11} /> Copy to Class {classId}
                          </button>
                          {effectiveClasses.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleCopySubjectsToAllClasses(classId, section)}
                              title="Copy these selected subjects to all selected classes"
                              className="text-[11px] px-2.5 py-1 rounded bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium flex items-center gap-1 transition"
                            >
                              <Copy size={11} /> Apply to All Classes
                            </button>
                          )}
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
                                    ? 'bg-white border-galaxy-600 ring-2 ring-galaxy-500/15 shadow-2xs'
                                    : 'bg-white/50 border-gray-200 hover:border-gray-300 opacity-60'
                                }`}
                              >
                                <div>
                                  <div className="font-bold text-xs text-gray-900">{subj.name}</div>
                                  <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded mt-0.5 inline-block">
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
                Step 4: Review & Confirm Session Configuration
              </h3>
              <p className="text-xs text-gray-500">
                Confirm your classes, sections, and subject details below before creating the session.
              </p>
            </div>

            {/* Overview Card */}
            <div className="p-4 bg-gradient-to-r from-galaxy-50 to-blue-50/50 rounded-xl border border-galaxy-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base text-galaxy-900">{sessionName}</span>
                  <span className="text-xs bg-galaxy-800 text-white px-2 py-0.5 rounded font-bold">
                    {sessionType}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1 flex items-center gap-1.5">
                  <Calendar size={13} /> Starts on: {startDate} &bull; Classes: <strong className="text-galaxy-900">{effectiveClasses.join(', ')}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-200 shadow-2xs">
                  <CheckCircle size={18} />
                </span>
                <div className="text-right">
                  <span className="text-[11px] text-gray-500 block">Status</span>
                  <span className="text-xs font-bold text-emerald-800">Ready to Save</span>
                </div>
              </div>
            </div>

            {/* Hierarchy Tree */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Configured Classes, Sections & Subjects Hierarchy:
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {effectiveClasses.map(clsName => {
                  const sections = getChosenSectionsForClass(clsName);

                  return (
                    <div key={clsName} className="p-3.5 bg-white rounded-xl border border-gray-200 space-y-2 shadow-2xs">
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
        {mode === 'modal' && onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
        ) : <div />}

        <div className="flex items-center gap-2">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((step - 1) as any)}
              disabled={isSaving}
              className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition flex items-center gap-1.5"
            >
              <ChevronLeft size={14} /> Back
            </button>
          )}

          {step === 1 && (
            <button
              type="button"
              onClick={handleNextToSections}
              className="px-5 py-2 bg-galaxy-900 text-white rounded-xl text-xs font-bold hover:bg-galaxy-800 transition flex items-center gap-1.5 shadow-sm"
            >
              Next: Select Sections <ChevronRight size={14} />
            </button>
          )}

          {step === 2 && (
            <button
              type="button"
              onClick={handleNextToSubjects}
              className="px-5 py-2 bg-galaxy-900 text-white rounded-xl text-xs font-bold hover:bg-galaxy-800 transition flex items-center gap-1.5 shadow-sm"
            >
              Next: Select Subjects <ChevronRight size={14} />
            </button>
          )}

          {step === 3 && (
            <button
              type="button"
              onClick={handleNextToReview}
              className="px-5 py-2 bg-galaxy-900 text-white rounded-xl text-xs font-bold hover:bg-galaxy-800 transition flex items-center gap-1.5 shadow-sm"
            >
              Next: Review & Confirm <ChevronRight size={14} />
            </button>
          )}

          {step === 4 && (
            <button
              type="button"
              onClick={handleStoreInFirebase}
              disabled={isSaving}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Saving Exam Session...
                </>
              ) : (
                <>
                  <CheckCircle size={15} />
                  {initialSession ? 'Save Changes' : 'Create Exam Session'}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (mode === 'modal') {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-fadeIn">
        {content}
      </div>
    );
  }

  return content;
};

export default ExamCreator;
