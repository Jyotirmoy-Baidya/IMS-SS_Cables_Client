import { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { LogOut, User } from "lucide-react";
import useAuthStore from "../store/authStore";

const EmployeeDashboardLayout = () => {
    const { user, isAuthenticated, isEmployee, loading, logout } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading) {
            // Check if user is authenticated
            if (!isAuthenticated()) {
                alert('Please login to access the dashboard');
                navigate('/login');
                return;
            }

            // Check if user is employee
            if (!isEmployee()) {
                alert('Access denied. Employee privileges required.');
                navigate('/login');
                return;
            }
        }
    }, [loading, isAuthenticated, isEmployee, navigate]);

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            logout();
            navigate('/login');
        }
    };

    // Show loading state while checking authentication
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    // Don't render dashboard if not authenticated or not employee
    if (!isAuthenticated() || !isEmployee()) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Employee Dashboard</h1>
                            <p className="text-sm text-gray-600">Welcome, {user?.name || 'Employee'}</p>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
                                <User size={18} className="text-gray-600" />
                                <div>
                                    <p className="text-sm font-medium text-gray-800">{user?.name || 'Employee'}</p>
                                    <p className="text-xs text-gray-500">{user?.phoneNumber}</p>
                                </div>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                <LogOut size={18} />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-6 py-8">
                <Outlet />
            </main>
        </div>
    );
};

export default EmployeeDashboardLayout;
