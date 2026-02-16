
import Sidebar from "../components/basic/Sidebar";
import { Outlet } from "react-router-dom";
import { useSidebar } from "../contexts/SidebarContext";

const DashboardLayout = () => {
    const { sidebarWidth } = useSidebar();

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
