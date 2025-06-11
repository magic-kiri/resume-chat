import React, { useState, useRef } from "react";
import { Upload, FileText, X, CheckCircle } from "lucide-react";

const ResumeUpload = ({ onResumeUpload, uploadedResume, isLoading }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    // Check file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    if (!allowedTypes.includes(file.type)) {
      alert("Please upload a PDF, DOC, DOCX, or TXT file.");
      return;
    }

    setIsUploading(true);

    try {
      // Get presigned URL
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/resume/getSignedUrl?filename=${encodeURIComponent(
          file.name
        )}`,
        {
          method: "GET",
          headers: {
            Authorization: `${import.meta.env.VITE_AUTHORIZATION_HEADER}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { url: presignedUrl } = await response.json();

      // Upload file to S3 using presigned URL
      const uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file to storage");
      }

      // Call backend to process the uploaded resume
      const processResponse = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/resume`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${import.meta.env.VITE_AUTHORIZATION_HEADER}`,
          },
          body: JSON.stringify({
            fileName: file.name,
          }),
        }
      );

      if (!processResponse.ok) {
        throw new Error("Failed to process resume");
      }

      onResumeUpload(file, "", false);
    } catch (error) {
      console.error("Error processing file:", error);
      alert("Error processing file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const removeResume = async () => {
    onResumeUpload(null, "", true);
    await deleteResume(uploadedResume.id);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Resume Upload</h2>
        <p className="text-gray-400 text-sm">
          Upload your resume to start chatting about your experience
        </p>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : !uploadedResume ? (
        <div
          className={`flex-1 border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            isDragOver
              ? "border-blue-400 bg-blue-400/10"
              : "border-gray-600 hover:border-gray-500"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf"
            onChange={handleFileInput}
          />

          {isUploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-300">Processing your resume...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-300 mb-2">
                Drag and drop your resume here
              </p>
              <p className="text-gray-500 text-sm mb-4">
                or click to browse files
              </p>
              <p className="text-xs text-gray-600">
                Supports PDF, DOC, DOCX, TXT files
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-green-400 font-medium">
                  Resume Uploaded
                </span>
              </div>
              <button
                onClick={removeResume}
                className="text-gray-400 hover:text-red-400 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-400 mr-3" />
              <div>
                <p className="text-white font-medium">{uploadedResume.name}</p>
                <p className="text-gray-400 text-sm">{uploadedResume.size}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-900/30 rounded-lg border border-blue-800">
            <p className="text-blue-300 text-sm">
              ✨ Ready to chat! Your resume has been processed and you can now
              ask questions about your experience.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeUpload;

const deleteResume = async (id) => {
  await fetch(`${import.meta.env.VITE_BACKEND_URL}/resume/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `${import.meta.env.VITE_AUTHORIZATION_HEADER}`,
    },
  });

  // Remove sessionId from URL
  const url = new URL(window.location);
  url.searchParams.delete("sessionId");
  window.history.pushState({}, "", url);
}; 