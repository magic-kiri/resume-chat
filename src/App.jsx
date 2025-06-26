import React, { useState, useEffect } from "react";
import Layout from "./components/Layout.jsx";
import ChatInterface from "./components/ChatInterface.jsx";
import "./App.css";

const fetchResume = async (setUploadedResume, setSessionId, setIsLoading) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/resume/latest`,
      {
        headers: {
          Authorization: import.meta.env.VITE_AUTHORIZATION_HEADER,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();

      if (data) {
        // Create a File object from the response
        setUploadedResume({
          name: data.metadata.fileName,
          size: data.metadata.fileSize,
          sessionId: data.user_id,
          id: data.id,
        });
        // attach the session id to the browser url
        window.history.pushState(
          {},
          "",
          `${window.location.pathname}?sessionId=${data.user_id}`
        );

        setSessionId(data.user_id);
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
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchResume(setUploadedResume, setSessionId, setIsLoading);
  }, []);

  const handleResumeUpload = (file, content, isRemove) => {
    setUploadedResume(file);
    if (!isRemove) {
      fetchResume(setUploadedResume, setSessionId, setIsLoading);
    }
    setIsLoading(false);
  };

  return (
    <Layout
      onResumeUpload={handleResumeUpload}
      uploadedResume={uploadedResume}
      sessionId={sessionId}
      isLoading={isLoading}
    >
      <ChatInterface uploadedResume={uploadedResume} sessionId={sessionId} />
    </Layout>
  );
}

export default App; 