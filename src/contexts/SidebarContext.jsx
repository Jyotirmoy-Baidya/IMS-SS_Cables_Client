"use client";

import { createContext, useContext, useState } from "react";

const SidebarContext = createContext(null);

export const SidebarProvider = ({ children }) => {
    const [collapsed, setCollapsed] = useState(false);

    const sidebarWidth = collapsed ? 64 : 256; // px

    return (
        <SidebarContext.Provider
            value={{
                collapsed,
                setCollapsed,
                sidebarWidth,
            }}
        >
            {children}
        </SidebarContext.Provider>
    );
};

export const useSidebar = () => {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error("useSidebar must be used inside SidebarProvider");
    }
    return context;
};
