import React, { useState, useEffect } from "react";
import ResumeUpload from "./components/ResumeUpload";
import ChatInterface from "./components/ChatInterface";
import "./App.css";
const fetchResume = async (
  setUploadedResume,
  setResumeContent,
  setIsLoading
) => {
  try {
    const response = await fetch(
      `${process.env.REACT_APP_BACKEND_URL}/resume`,
      {
        headers: {
          Authorization: process.env.REACT_APP_AUTHORIZATION_HEADER,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();

      let file = data[data.length - 1];
      if (file) {
        // Create a File object from the response
        setUploadedResume({
          name: file.metadata.fileName,
          size: file.metadata.fileSize,
        });
        setResumeContent(file.raw_text);
      }
    }
  } catch (error) {
    console.error("Error fetching resume:", error);
  } finally {
    setIsLoading(false);
  }
};

function App() {
  const [uploadedResume, setUploadedResume] = useState(null);
  const [resumeContent, setResumeContent] = useState();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchResume(setUploadedResume, setResumeContent, setIsLoading);
  }, []);

  const handleResumeUpload = (file, content) => {
    setUploadedResume(file);
    setResumeContent(content);
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Left Sidebar - Resume Upload */}
      <div className="w-80 bg-sidebar-bg border-r border-gray-700 flex flex-col">
        <ResumeUpload
          onResumeUpload={handleResumeUpload}
          uploadedResume={uploadedResume}
          resumeContent={resumeContent}
          isLoading={isLoading}
        />
      </div>

      {/* Right Side - Chat Interface */}
      <div className="flex-1 flex flex-col bg-chat-bg">
        <ChatInterface
          uploadedResume={uploadedResume}
          resumeContent={resumeContent}
        />
      </div>
    </div>
  );
}

export default App;
