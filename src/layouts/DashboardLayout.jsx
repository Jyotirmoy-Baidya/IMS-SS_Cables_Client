import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/basic/Sidebar";
import { Outlet } from "react-router-dom";
import { useSidebar } from "../contexts/SidebarContext";
import useAuthStore from "../store/authStore";

const DashboardLayout = () => {
    const { sidebarWidth } = useSidebar();
    const { isAuthenticated, isAdmin, loading } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading) {
            // Check if user is authenticated
            if (!isAuthenticated()) {
                alert('Please login to access the dashboard');
                navigate('/login');
                return;
            }

            // Check if user is admin
            if (!isAdmin()) {
                alert('Access denied. Admin privileges required.');
                navigate('/login');
                return;
            }
        }
    }, [loading, isAuthenticated, isAdmin, navigate]);

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

    // Don't render dashboard if not authenticated or not admin
    if (!isAuthenticated() || !isAdmin()) {
        return null;
    }

    return (
        <div className="flex">
            <Sidebar />

            {/* Main Content */}
            <main
                className="w-full min-h-screen bg-gray-50 transition-all duration-300"
                style={{ marginLeft: sidebarWidth }}
            >

                {/* Page content */}
                <div className="p-4"><Outlet /></div>
            </main>
        </div>
    );
};

export default DashboardLayout;
