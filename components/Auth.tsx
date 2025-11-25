import React, { useState } from 'react';
import { useAppStore } from '../services/store';
import { User, Role } from '../types';
import { Shield, BookOpen, Calculator, UserCheck, Lock, Mail, User as UserIcon } from 'lucide-react';

const Auth: React.FC = () => {
  const { state, dispatch } = useAppStore();
  const [isLogin, setIsLogin] = useState(true);
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Register State
  const [regForm, setRegForm] = useState<Partial<User>>({
    name: '', email: '', role: 'student', phone: '', address: '',
    classId: '', annualFee: 0, discount: 0, subjects: []
  });
  const [regSuccess, setRegSuccess] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Find user in mock data
    const user = state.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (user) {
        if (user.password !== password) {
            setError('Invalid credentials');
            return;
        }
        if (user.status !== 'active') {
            setError('Your account is pending approval by an administrator.');
            return;
        }
        dispatch({ type: 'LOGIN', payload: user });
    } else {
        setError('User not found');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Developer auto-create logic (Simulated)
    // In real app, only an existing dev could create a dev, or use a secret key.
    // Here we allow it but it will just be 'pending' unless specific logic is added,
    // but the prompt says "Developer... no approval is required". 
    // We will make Developer auto-active for the sake of the "First User" problem in this demo.
    const isDev = regForm.role === 'developer';

    const newUser: User = {
        id: `u${Date.now()}`,
        name: regForm.name || '',
        email: regForm.email || '',
        role: regForm.role as Role,
        password: 'password', // Default password for demo
        status: isDev ? 'active' : 'pending',
        phone: regForm.phone,
        address: regForm.address,
        classId: regForm.role === 'student' ? regForm.classId : undefined,
        annualFee: regForm.role === 'student' ? Number(regForm.annualFee) : undefined,
        discount: regForm.role === 'student' ? Number(regForm.discount) : undefined,
        totalPaid: 0,
        subjects: regForm.role === 'teacher' ? (regForm.subjects as unknown as string).split(',').map(s => s.trim()) : undefined
    };

    dispatch({ type: 'ADD_USER', payload: newUser });
    setRegSuccess(isDev ? 'Developer Account Created! Please Login.' : 'Registration successful! Please wait for administrator approval.');
    setRegForm({ name: '', email: '', role: 'student', phone: '', address: '', classId: '', annualFee: 0, discount: 0, subjects: [] });
    setTimeout(() => {
        setRegSuccess('');
        setIsLogin(true);
    }, 3000);
  };

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
                    onClick={() => { setIsLogin(!isLogin); setError(''); setRegSuccess(''); }}
                    className="text-sm text-galaxy-600 font-semibold hover:underline"
                >
                    {isLogin ? 'Need an account?' : 'Already have an account?'}
                </button>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}
            {regSuccess && <div className="bg-green-50 text-green-600 p-3 rounded mb-4 text-sm">{regSuccess}</div>}
            
            {isLogin ? (
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
                        <span className="text-xs text-gray-400">(Default password: password)</span>
                    </div>
                    <button type="submit" className="w-full bg-galaxy-900 text-white py-3 rounded-lg hover:bg-galaxy-800 font-bold shadow-lg transform transition active:scale-95">
                        Login to Portal
                    </button>
                </form>
            ) : (
                <form onSubmit={handleRegister} className="space-y-3 h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Account Type</label>
                        <select 
                            className="w-full border p-2 rounded mt-1 bg-gray-50"
                            value={regForm.role}
                            onChange={e => setRegForm({...regForm, role: e.target.value as Role})}
                            required
                        >
                            <option value="student">Student</option>
                            <option value="teacher">Teacher</option>
                            <option value="accountant">Accountant</option>
                            <option value="administrator">Administrator</option>
                            <option value="admin">Admin</option>
                            <option value="developer">Developer</option>
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
                            <label className="block text-sm font-medium text-gray-700">Address</label>
                            <input 
                                type="text"
                                className="w-full border p-2 rounded mt-1"
                                value={regForm.address}
                                onChange={e => setRegForm({...regForm, address: e.target.value})}
                            />
                        </div>
                    </div>

                     {/* Student Specific Fields */}
                     {regForm.role === 'student' && (
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 space-y-2">
                            <h4 className="font-semibold text-blue-800 text-xs uppercase">Student Details</h4>
                            <div>
                                <label className="block text-xs font-medium text-gray-700">Class / Batch</label>
                                <input 
                                    type="text" required
                                    className="w-full border p-2 rounded mt-1 text-sm"
                                    placeholder="e.g. Batch 2024 - Sec A"
                                    value={regForm.classId}
                                    onChange={e => setRegForm({...regForm, classId: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700">Annual Fee</label>
                                    <input 
                                        type="number" required
                                        className="w-full border p-2 rounded mt-1 text-sm"
                                        value={regForm.annualFee}
                                        onChange={e => setRegForm({...regForm, annualFee: Number(e.target.value)})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700">Discount</label>
                                    <input 
                                        type="number"
                                        className="w-full border p-2 rounded mt-1 text-sm"
                                        value={regForm.discount}
                                        onChange={e => setRegForm({...regForm, discount: Number(e.target.value)})}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Teacher Specific Fields */}
                    {regForm.role === 'teacher' && (
                        <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                            <h4 className="font-semibold text-purple-800 text-xs uppercase">Teacher Details</h4>
                            <label className="block text-xs font-medium text-gray-700">Subjects (comma separated)</label>
                            <input 
                                type="text" required
                                className="w-full border p-2 rounded mt-1 text-sm"
                                placeholder="e.g. Housekeeping, F&B Production"
                                value={regForm.subjects as unknown as string}
                                onChange={e => setRegForm({...regForm, subjects: e.target.value as unknown as string[]})}
                            />
                        </div>
                    )}

                    <button type="submit" className="w-full bg-galaxy-600 text-white py-2 rounded-lg hover:bg-galaxy-700 font-semibold shadow-sm mt-4">
                        Register Account
                    </button>
                </form>
            )}
        </div>

      </div>
    </div>
  );
};

export default Auth;