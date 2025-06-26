import React, { useState, useRef, useEffect } from "react";
import { Send, User, Bot, FileText } from "lucide-react";
import VoiceInput from './VoiceInput';

const ChatInterface = ({ uploadedResume, sessionId }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!uploadedResume) {
      setMessages([]);
      return;
    }

    // Welcome message when resume is uploaded
    if (uploadedResume && messages.length === 0) {
      setMessages([
        {
          id: 1,
          type: "assistant",
          content: `Hi! I've analyzed your resume "${uploadedResume.name}". I'm here to help you discuss your experience, skills, and career opportunities. What would you like to talk about?`,
          timestamp: new Date(),
        },
      ]);
    }
  }, [uploadedResume, messages.length]);

  const handleVoiceTranscript = (transcript) => {
    setInputMessage(transcript);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    // Simulate AI response
    const aiResponse = await generateAIResponse(inputMessage, sessionId);
    const assistantMessage = {
      id: Date.now() + 1,
      type: "assistant",
      content: aiResponse,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsTyping(false);
  };

  const generateAIResponse = async (question, sessionId) => {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/session/chat`,
      {
        method: "POST",
        headers: {
          Authorization: import.meta.env.VITE_AUTHORIZATION_HEADER,
        },
        body: JSON.stringify({
          question: question,
          sessionId: sessionId,
        }),
      }
    );

    const data = await response.json();
    return data.answer;
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!uploadedResume) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">
            No Resume Uploaded
          </h3>
          <p className="text-gray-500">
            Please upload your resume to start chatting about your career
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-700 p-4">
        <div className="flex items-center">
          <Bot className="h-8 w-8 text-blue-400 mr-3" />
          <div>
            <h1 className="text-lg font-semibold">Resume Chat Assistant</h1>
            <p className="text-sm text-gray-400">
              {uploadedResume ? `Discussing: ${uploadedResume.name}` : 'Upload a resume to get started'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.type === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`flex max-w-[80%] ${
                message.type === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                  message.type === "user"
                    ? "bg-blue-600 ml-3"
                    : "bg-green-600 mr-3"
                }`}
              >
                {message.type === "user" ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>
              <div
                className={`rounded-lg px-4 py-2 ${
                  message.type === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-100"
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                <div
                  className={`text-xs mt-1 ${
                    message.type === "user" ? "text-blue-200" : "text-gray-400"
                  }`}
                >
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="flex">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-600 mr-3 flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-gray-700 text-gray-100 rounded-lg px-4 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-700 p-4">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your resume, career, or job search..."
              className="w-full bg-chat-input text-white placeholder-gray-400 rounded-lg px-4 py-3 pr-12 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[52px] max-h-32"
              rows={1}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg p-2 transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <VoiceInput 
            onTranscript={handleVoiceTranscript}
            disabled={isTyping}
            currentText={inputMessage}
          />
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          {messages.length <= 1 && (
            <>
              <button
                onClick={() =>
                  setInputMessage(
                    "What are my key strengths based on my resume?"
                  )
                }
                className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1 rounded-full transition-colors"
              >
                My key strengths
              </button>
              <button
                onClick={() => setInputMessage("How can I improve my resume?")}
                className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1 rounded-full transition-colors"
              >
                Improve my resume
              </button>
              <button
                onClick={() =>
                  setInputMessage("Help me prepare for interviews")
                }
                className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1 rounded-full transition-colors"
              >
                Interview prep
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInterface; 