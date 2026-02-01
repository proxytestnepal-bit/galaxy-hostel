

import React, { useState } from 'react';
import { useAppStore } from '../services/store';
import { User, Role } from '../types';
import { Shield, BookOpen, Calculator, UserCheck, Lock, Mail, User as UserIcon, TestTube, Check, Upload, FileSpreadsheet, Download, Table, X } from 'lucide-react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';

const Auth: React.FC = () => {
  const { state, dispatch } = useAppStore();
  const [isLogin, setIsLogin] = useState(true);
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Register State
  const [isBulk, setIsBulk] = useState(false);
  const [regForm, setRegForm] = useState<Partial<User>>({
    name: '', email: '', role: 'student', phone: '', address: '',
    classId: '', section: '', annualFee: 0, discount: 0, subjects: [], password: ''
  });
  const [regSuccess, setRegSuccess] = useState('');
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkPreview, setBulkPreview] = useState<User[]>([]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
        // 1. Attempt Firebase Auth Login
        await signInWithEmailAndPassword(auth, email, password);
        
        // 2. If successful, find the user profile in our loaded state
        const user = state.users.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (user) {
            if (user.status === 'dropped_out') {
                setError('This account has been deactivated (Dropped Out). Please contact administration.');
                return;
            }
            if (user.status !== 'active' && user.role !== 'developer') {
                setError('Your account is pending approval by an administrator.');
                return;
            }
            dispatch({ type: 'LOGIN', payload: user });
        } else {
            setError('User profile not found in database.');
        }

    } catch (firebaseError: any) {
        console.log("Firebase auth failed, trying mock fallback...", firebaseError.code);
        
        // 3. Fallback for Pre-seeded Demo Users & Bulk Uploaded Users (Firestore Only)
        const user = state.users.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        // Check local password field (Simulated Auth for Bulk Users)
        if (user && user.password === password) {
            if (user.status === 'dropped_out') {
                setError('This account has been deactivated (Dropped Out). Please contact administration.');
                return;
            }
            if (user.status !== 'active') {
                setError('Your account is pending approval by an administrator.');
                return;
            }
            dispatch({ type: 'LOGIN', payload: user });
        } else {
            setError(firebaseError.code === 'auth/invalid-credential' ? 'Invalid credentials' : 'Login failed: ' + firebaseError.message);
        }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!regForm.password || regForm.password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
    }
    
    const isDev = regForm.role === 'developer';

    try {
        // 1. Create User in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, regForm.email!, regForm.password);
        const uid = userCredential.user.uid;

        // 2. Create User Profile in Firestore
        const newUser: User = {
            id: uid, // Use the Firebase Auth UID
            name: regForm.name || '',
            email: regForm.email || '',
            role: regForm.role as Role,
            allowedRoles: [regForm.role as Role],
            password: 'password', // Store dummy in DB, actual auth handled by Firebase
            status: isDev ? 'active' : 'pending',
            phone: regForm.phone,
            address: regForm.address,
            annualFee: 0, 
            discount: 0,
            totalPaid: 0,
            ...(regForm.role === 'student' && regForm.classId ? { classId: regForm.classId } : {}),
            ...(regForm.role === 'student' && regForm.section ? { section: regForm.section } : {}),
            ...(regForm.role === 'teacher' && regForm.subjects ? { subjects: regForm.subjects } : {})
        };

        dispatch({ type: 'ADD_USER', payload: newUser });
        setRegSuccess(isDev ? 'Developer Account Created! Please Login.' : 'Registration submitted. Please wait for approval.');
        setRegForm({ name: '', email: '', role: 'student', phone: '', address: '', classId: '', section: '', annualFee: 0, discount: 0, subjects: [], password: '' });
        
        setTimeout(() => {
            setRegSuccess('');
            setIsLogin(true);
        }, 3000);

    } catch (err: any) {
        console.error("Registration Error:", err);
        if (err.code === 'auth/email-already-in-use') {
            setError('This email is already registered.');
        } else {
            setError(err.message || 'Registration failed.');
        }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!regForm.classId) {
          setError("Please select a target Class before uploading.");
          e.target.value = ''; // Reset input
          return;
      }

      setError('');
      setBulkFile(file);

      const reader = new FileReader();
      reader.onload = async (event) => {
          const text = event.target?.result as string;
          if (!text) return;

          const rows = text.split(/\r?\n/).filter(row => row.trim().length > 0);
          
          // Heuristic: Check if first row is header
          const firstRowLower = rows[0].toLowerCase();
          const startIndex = (firstRowLower.includes('email') || firstRowLower.includes('name')) ? 1 : 0;

          const parsedUsers: User[] = [];

          for (let i = startIndex; i < rows.length; i++) {
              const cols = rows[i].split(',').map(c => c.trim());
              
              // Support Formats:
              // 1. SN, Name, Email, Password
              // 2. Name, Email, Password
              let name = '', emailRaw = '', password = '';

              if (cols.length >= 4) {
                  name = cols[1];
                  emailRaw = cols[2];
                  password = cols[3];
              } else if (cols.length === 3) {
                  name = cols[0];
                  emailRaw = cols[1];
                  password = cols[2];
              } else {
                  continue; // Skip invalid rows
              }

              if (name && emailRaw) {
                  // Auto-append domain if missing @
                  let email = emailRaw;
                  if (!email.includes('@')) {
                      email = `${email}@galaxy.edu.np`;
                  }

                  const newUser: User = {
                      id: `bulk_${Date.now()}_${i}`,
                      name: name,
                      email: email,
                      password: password || 'password', 
                      role: 'student',
                      allowedRoles: ['student'],
                      status: 'pending',
                      classId: regForm.classId,
                      section: regForm.section || '',
                      annualFee: 0,
                      discount: 0,
                      totalPaid: 0
                  };
                  parsedUsers.push(newUser);
              }
          }

          if (parsedUsers.length === 0) {
              setError("No valid student data found in CSV. Format: Name, Email, Password");
              setBulkFile(null);
          } else {
              setBulkPreview(parsedUsers);
          }
      };

      reader.onerror = () => setError("Failed to read file.");
      reader.readAsText(file);
  };

  const confirmBulkUpload = () => {
      bulkPreview.forEach(u => dispatch({ type: 'ADD_USER', payload: u }));
      setRegSuccess(`Successfully processed ${bulkPreview.length} students. They are now pending approval.`);
      setBulkPreview([]);
      setBulkFile(null);
      
      setTimeout(() => {
          setRegSuccess('');
          setIsLogin(true);
      }, 4000);
  };

  const cancelBulkPreview = () => {
      setBulkPreview([]);
      setBulkFile(null);
  };

  const toggleSubject = (subjectName: string) => {
      const currentSubjects = regForm.subjects || [];
      if (currentSubjects.includes(subjectName)) {
          setRegForm({ ...regForm, subjects: currentSubjects.filter(s => s !== subjectName) });
      } else {
          setRegForm({ ...regForm, subjects: [...currentSubjects, subjectName] });
      }
  };

  const selectedClassData = state.systemClasses.find(c => c.name === regForm.classId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-galaxy-900 via-galaxy-800 to-galaxy-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl w-full flex flex-col md:flex-row gap-8">
        
        {/* Left Side: Branding */}
        <div className="md:w-1/3 flex flex-col justify-center border-r border-gray-100 pr-8">
            <div className="w-16 h-16 bg-gold-400 rounded-xl flex items-center justify-center text-galaxy-900 font-bold text-3xl mb-6">
                G
            </div>
            <h1 className="text-3xl font-bold text-galaxy-900 mb-2">Galaxy Hotel</h1>
            <h2 className="text-xl font-medium text-galaxy-600 mb-6">& Tourism School</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
                Welcome to the official portal. Manage assignments, examinations, fees, and more with our integrated role-based system.
            </p>
            <div className="mt-8 pt-6 border-t border-gray-100">
                <p className="text-xs text-gray-400">System Version 2.0.0</p>
            </div>
        </div>

        {/* Right Side: Form */}
        <div className="md:w-2/3">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800">{isLogin ? 'Sign In' : 'Create Account'}</h3>
                <button 
                    onClick={() => { setIsLogin(!isLogin); setError(''); setRegSuccess(''); setIsBulk(false); setBulkPreview([]); setBulkFile(null); }}
                    className="text-right flex flex-col items-end group"
                >
                    <span className="text-xs text-gray-500 font-medium group-hover:text-gray-700 transition-colors">
                        {isLogin ? 'Need an account?' : 'Already have an account?'}
                    </span>
                    <span className="text-2xl font-extrabold text-galaxy-600 group-hover:text-galaxy-800 group-hover:underline transition-all">
                        {isLogin ? 'Sign Up' : 'Sign In'}
                    </span>
                </button>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}
            {regSuccess && <div className="bg-green-50 text-green-600 p-3 rounded mb-4 text-sm">{regSuccess}</div>}
            
            {isLogin ? (
                <>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input 
                                type="email" 
                                className="w-full border pl-10 p-2 rounded-lg focus:ring-2 focus:ring-galaxy-500 outline-none"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="name@galaxy.edu.np"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input 
                                type="password" 
                                className="w-full border pl-10 p-2 rounded-lg focus:ring-2 focus:ring-galaxy-500 outline-none"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-xs text-gray-400">(Default password for demo: password)</span>
                    </div>
                    <button type="submit" className="w-full bg-galaxy-900 text-white py-3 rounded-lg hover:bg-galaxy-800 font-bold shadow-lg transform transition active:scale-95">
                        Login to Portal
                    </button>
                </form>

                {email === 'opentesting' && (
                    <div className="mt-8 pt-6 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
                        <label className="block text-xs font-bold text-red-500 uppercase mb-2 flex items-center gap-1">
                            <TestTube size={14} /> For Testing Only
                        </label>
                        <select
                            className="w-full text-sm border border-red-200 bg-red-50 text-red-800 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-red-300"
                            onChange={(e) => {
                                const selectedEmail = e.target.value;
                                if(!selectedEmail) return;
                                const user = state.users.find(u => u.email === selectedEmail);
                                if(user) dispatch({ type: 'LOGIN', payload: user });
                            }}
                            defaultValue=""
                        >
                            <option value="" disabled>-- Quick Login As Role --</option>
                            <option value="admin@galaxy.edu.np">Admin (Super Admin)</option>
                            <option value="suresh@galaxy.edu.np">Admin (Suresh Pradhan)</option>
                            <option value="ramesh@galaxy.edu.np">Accountant (Ramesh Adhikari)</option>
                            <option value="sarita@galaxy.edu.np">Teacher (Sarita Sharma)</option>
                            <option value="ram@galaxy.edu.np">Student (Ram Kafle)</option>
                            <option value="hari@galaxy.edu.np">Intern (Hari Shrestha)</option>
                            <option value="dheejan@gmail.com">Developer</option>
                        </select>
                    </div>
                )}
                </>
            ) : (
                <div className="space-y-4">
                    {/* Toggle Switch */}
                    <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
                        <button 
                            type="button"
                            onClick={() => { setIsBulk(false); setBulkPreview([]); }}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!isBulk ? 'bg-white shadow-sm text-galaxy-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Individual
                        </button>
                        <button 
                            type="button"
                            onClick={() => setIsBulk(true)}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${isBulk ? 'bg-white shadow-sm text-galaxy-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <FileSpreadsheet size={16}/> Bulk (CSV)
                        </button>
                    </div>

                    {!isBulk ? (
                        <form onSubmit={handleRegister} className="space-y-3 h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Account Type</label>
                                <select 
                                    className="w-full border p-2 rounded mt-1 bg-gray-50"
                                    value={regForm.role}
                                    onChange={e => setRegForm({...regForm, role: e.target.value as Role})}
                                    required
                                >
                                    <option value="student">Student</option>
                                    <option value="intern">Intern</option>
                                    <option value="teacher">Teacher</option>
                                    <option value="accountant">Accountant</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                 <div>
                                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                    <input 
                                        type="text" required
                                        className="w-full border p-2 rounded mt-1"
                                        value={regForm.name}
                                        onChange={e => setRegForm({...regForm, name: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <input 
                                        type="email" required
                                        className="w-full border p-2 rounded mt-1"
                                        value={regForm.email}
                                        onChange={e => setRegForm({...regForm, email: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                 <div>
                                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                                    <input 
                                        type="text"
                                        className="w-full border p-2 rounded mt-1"
                                        value={regForm.phone}
                                        onChange={e => setRegForm({...regForm, phone: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Set Password</label>
                                    <input 
                                        type="password" required
                                        className="w-full border p-2 rounded mt-1"
                                        value={regForm.password}
                                        onChange={e => setRegForm({...regForm, password: e.target.value})}
                                        minLength={6}
                                        placeholder="Min 6 chars"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Address</label>
                                <input 
                                    type="text"
                                    className="w-full border p-2 rounded mt-1"
                                    value={regForm.address}
                                    onChange={e => setRegForm({...regForm, address: e.target.value})}
                                />
                            </div>

                             {/* Student Specific Fields */}
                             {regForm.role === 'student' && (
                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 space-y-2">
                                    <h4 className="font-semibold text-blue-800 text-xs uppercase">Student Details</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700">Class / Batch</label>
                                            <select 
                                                required
                                                className="w-full border p-2 rounded mt-1 text-sm bg-white"
                                                value={regForm.classId}
                                                onChange={e => setRegForm({...regForm, classId: e.target.value, section: ''})}
                                            >
                                                <option value="">-- Select Class --</option>
                                                {state.systemClasses.map(cls => (
                                                    <option key={cls.name} value={cls.name}>{cls.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        {selectedClassData && selectedClassData.sections.length > 0 && (
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700">Section</label>
                                                <select 
                                                    required
                                                    className="w-full border p-2 rounded mt-1 text-sm bg-white"
                                                    value={regForm.section}
                                                    onChange={e => setRegForm({...regForm, section: e.target.value})}
                                                >
                                                    <option value="">-- Select Section --</option>
                                                    {selectedClassData.sections.map(sec => (
                                                        <option key={sec} value={sec}>{sec}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-xs text-blue-600 italic mt-1">
                                        Fees and discounts will be assigned by the administration upon approval.
                                    </div>
                                </div>
                            )}

                            {/* Teacher Specific Fields */}
                            {regForm.role === 'teacher' && (
                                <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                                    <h4 className="font-semibold text-purple-800 text-xs uppercase mb-2">Select Subjects</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {state.availableSubjects.map(subject => {
                                            const isSelected = regForm.subjects?.includes(subject.name);
                                            return (
                                                <button
                                                    key={subject.name}
                                                    type="button"
                                                    onClick={() => toggleSubject(subject.name)}
                                                    className={`text-xs px-2 py-1 rounded-full border transition-all ${
                                                        isSelected 
                                                        ? 'bg-purple-600 text-white border-purple-600' 
                                                        : 'bg-white text-gray-600 border-gray-300 hover:border-purple-400'
                                                    }`}
                                                >
                                                    {subject.name} <span className="text-[10px] opacity-75">({subject.type[0]})</span> {isSelected && '✓'}
                                                </button>
                                            )
                                        })}
                                    </div>
                                    {(regForm.subjects?.length || 0) === 0 && (
                                        <p className="text-xs text-red-400 mt-2">* Please select at least one subject</p>
                                    )}
                                </div>
                            )}

                            <button type="submit" className="w-full bg-galaxy-600 text-white py-2 rounded-lg hover:bg-galaxy-700 font-semibold shadow-sm mt-4">
                                Register Account
                            </button>
                        </form>
                    ) : (
                        <div className="space-y-4 h-[350px] overflow-y-auto pr-2 custom-scrollbar flex flex-col">
                            {bulkPreview.length === 0 ? (
                                <>
                                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-sm text-blue-800">
                                        <h4 className="font-bold flex items-center gap-2 mb-2"><Upload size={16}/> Bulk Registration</h4>
                                        <p className="mb-2">Upload a CSV file to preview and register multiple students. </p>
                                        <div className="bg-white/50 p-2 rounded border border-blue-100 font-mono text-xs">
                                            <strong>Supported Columns:</strong><br/>
                                            1. SN, Name, Email, Password<br/>
                                            2. Name, Email, Password
                                        </div>
                                        <p className="mt-2 text-xs italic">
                                            * Emails without '@' will automatically have <strong>@galaxy.edu.np</strong> appended.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 uppercase">Target Class</label>
                                            <select 
                                                className="w-full border p-2 rounded mt-1 text-sm bg-white"
                                                value={regForm.classId}
                                                onChange={e => setRegForm({...regForm, classId: e.target.value, section: ''})}
                                            >
                                                <option value="">-- Select Class --</option>
                                                {state.systemClasses.map(cls => (
                                                    <option key={cls.name} value={cls.name}>{cls.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 uppercase">Target Section</label>
                                            <select 
                                                className="w-full border p-2 rounded mt-1 text-sm bg-white"
                                                value={regForm.section}
                                                onChange={e => setRegForm({...regForm, section: e.target.value})}
                                                disabled={!selectedClassData || selectedClassData.sections.length === 0}
                                            >
                                                <option value="">-- All / Default --</option>
                                                {selectedClassData?.sections.map(sec => (
                                                    <option key={sec} value={sec}>{sec}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="mt-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Select CSV File</label>
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
                                            <input 
                                                type="file" 
                                                accept=".csv"
                                                onChange={handleFileUpload}
                                                className="hidden" 
                                                id="csvUpload"
                                            />
                                            <label htmlFor="csvUpload" className="cursor-pointer flex flex-col items-center">
                                                <Upload className="text-gray-400 mb-2" size={32} />
                                                <span className="text-sm text-gray-600">Click to select CSV file</span>
                                            </label>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="font-bold text-gray-700 flex items-center gap-2">
                                            <Table size={16} /> Preview Data ({bulkPreview.length})
                                        </h4>
                                        <button 
                                            onClick={cancelBulkPreview}
                                            className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1"
                                        >
                                            <X size={14} /> Clear
                                        </button>
                                    </div>
                                    <div className="flex-1 overflow-auto border rounded-lg bg-gray-50">
                                        <table className="w-full text-xs text-left">
                                            <thead className="bg-gray-200 text-gray-700 sticky top-0">
                                                <tr>
                                                    <th className="p-2">Name</th>
                                                    <th className="p-2">Email</th>
                                                    <th className="p-2">Class</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {bulkPreview.map((u, i) => (
                                                    <tr key={i} className="bg-white">
                                                        <td className="p-2 font-medium">{u.name}</td>
                                                        <td className="p-2 text-gray-500">{u.email}</td>
                                                        <td className="p-2">{u.classId} {u.section ? `(${u.section})` : ''}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <button 
                                        onClick={confirmBulkUpload}
                                        className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-bold shadow-sm flex items-center justify-center gap-2 mt-4"
                                    >
                                        <Check size={18} /> Confirm Upload
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default Auth;
