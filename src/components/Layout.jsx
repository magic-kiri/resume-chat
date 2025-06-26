import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import ResumeUpload from './ResumeUpload';

const Layout = ({ children, onResumeUpload, uploadedResume, sessionId, isLoading }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar when screen size changes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Mobile Header with Hamburger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={toggleSidebar}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold">Resume Chat</h1>
          <div className="w-6"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-80 bg-sidebar-bg border-r border-gray-700
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Mobile Close Button */}
        <div className="lg:hidden p-4 border-b border-gray-700">
          <button
            onClick={closeSidebar}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Resume Upload Component */}
        <ResumeUpload
          onResumeUpload={(file, content, isRemove) => {
            onResumeUpload(file, content, isRemove);
            // Close sidebar on mobile after upload
            if (window.innerWidth < 1024) {
              closeSidebar();
            }
          }}
          uploadedResume={uploadedResume}
          sessionId={sessionId}
          isLoading={isLoading}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-chat-bg pt-16 lg:pt-0">
        {children}
      </div>
    </div>
  );
};

export default Layout; 