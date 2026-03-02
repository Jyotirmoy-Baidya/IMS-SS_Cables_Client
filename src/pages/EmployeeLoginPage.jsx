import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, LogIn } from 'lucide-react';
import api from '../api/axiosInstance';

const EmployeeLoginPage = () => {
    const navigate = useNavigate();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        if (!phoneNumber) {
            setError('Please enter your phone number');
            return;
        }

        try {
            setLoading(true);
            const response = await api.post('/employee/login', { phoneNumber });

            // Store employee data in localStorage
            localStorage.setItem('employee', JSON.stringify(response.data));

            // Navigate to employee dashboard
            navigate(`/employee/${response.data.employeeId}/dashboard`);
        } catch (err) {
            setError(err.message || 'Login failed. Please check your phone number.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <div className="bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                        <Phone size={40} className="text-blue-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Employee Portal</h1>
                    <p className="text-gray-500">Enter your phone number to continue</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="Enter your phone number"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={loading}
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                Logging in...
                            </>
                        ) : (
                            <>
                                <LogIn size={20} />
                                Login
                            </>
                        )}
                    </button>
                </form>

                {/* Info */}
                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-500">
                        Use the phone number registered in your employee profile
                    </p>
                </div>
            </div>
        </div>
    );
};

export default EmployeeLoginPage;
