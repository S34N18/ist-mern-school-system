import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';

const ProtectedLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if screen is mobile size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setIsSidebarOpen(false); // Close mobile sidebar when switching to desktop
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="app-layout">
      {/* Hamburger Menu Button for Mobile */}
      {isMobile && (
        <div className="hamburger" onClick={toggleSidebar}>
          ☰
        </div>
      )}

      {/* Backdrop for mobile */}
      {isMobile && isSidebarOpen && (
        <div className={`backdrop ${isSidebarOpen ? 'show' : ''}`} onClick={closeSidebar}></div>
      )}

      {/* Sidebar */}
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <Sidebar closeSidebar={closeSidebar} />
      </div>

      {/* Main Content */}
      <div className={`main-content ${isSidebarOpen && isMobile ? 'sidebar-open' : ''}`}>
        {children}
      </div>
    </div>
  );
};

export default ProtectedLayout;