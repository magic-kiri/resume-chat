import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

const VoiceInput = ({ onTranscript, disabled = false, currentText = '' }) => {
  const [isListening, setIsListening] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState(null);
  const shortPauseTimeoutRef = useRef(null);
  const mediumPauseTimeoutRef = useRef(null);
  const longPauseTimeoutRef = useRef(null);
  const lastTranscriptRef = useRef('');
  const initialTextRef = useRef('');
  const accumulatedTranscriptRef = useRef('');
  const lastSpeechTimeRef = useRef(Date.now());

  const {
    transcript,
    finalTranscript,
    interimTranscript,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  // Initialize speech recognition on component mount
  useEffect(() => {
    const initializeSpeechRecognition = () => {
      try {
        console.log('Initializing speech recognition...');
        console.log('Browser supports speech recognition:', browserSupportsSpeechRecognition);
        console.log('Secure context:', window.isSecureContext);
        console.log('Protocol:', window.location.protocol);
        console.log('Host:', window.location.host);
        
        // Check browser support
        if (!browserSupportsSpeechRecognition) {
          throw new Error('Browser does not support speech recognition');
        }

        // Check secure context
        const isSecureContext = window.isSecureContext || 
                               window.location.protocol === 'https:' || 
                               ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);

        if (!isSecureContext) {
          throw new Error('Speech recognition requires HTTPS');
        }

        // Check if speech recognition API is available
        if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
          throw new Error('Speech Recognition API not available');
        }

        setIsInitialized(true);
        setInitError(null);
        console.log('Speech recognition initialized successfully');
      } catch (error) {
        console.error('Failed to initialize speech recognition:', error);
        setInitError(error.message);
        setIsInitialized(false);
      }
    };

    // Add a small delay to ensure everything is loaded
    const timer = setTimeout(initializeSpeechRecognition, 100);
    return () => clearTimeout(timer);
  }, [browserSupportsSpeechRecognition]);

  // Enhanced timeout strategy
  const clearAllTimeouts = () => {
    if (shortPauseTimeoutRef.current) {
      clearTimeout(shortPauseTimeoutRef.current);
      shortPauseTimeoutRef.current = null;
    }
    if (mediumPauseTimeoutRef.current) {
      clearTimeout(mediumPauseTimeoutRef.current);
      mediumPauseTimeoutRef.current = null;
    }
    if (longPauseTimeoutRef.current) {
      clearTimeout(longPauseTimeoutRef.current);
      longPauseTimeoutRef.current = null;
    }
  };

  const setProgressiveTimeouts = () => {
    clearAllTimeouts();
    
    // Short pause (2s): Just log, keep listening
    shortPauseTimeoutRef.current = setTimeout(() => {
      console.log('Short pause detected');
    }, 2000);
    
    // Medium pause (4s): Save current progress, keep listening
    mediumPauseTimeoutRef.current = setTimeout(() => {
      console.log('Medium pause detected - saving progress');
      // Save the current transcript to accumulated
      if (transcript && transcript.trim()) {
        const currentTranscript = transcript.trim();
        // Check if this content is already in accumulated (prevent duplication)
        if (!accumulatedTranscriptRef.current.includes(currentTranscript)) {
          accumulatedTranscriptRef.current += (accumulatedTranscriptRef.current ? ' ' : '') + currentTranscript;
        }
        // Force reset the transcript to start fresh
        setTimeout(() => {
          resetTranscript();
        }, 100);
      }
    }, 4000);
    
    // Long pause (6s): Stop listening and finalize
    longPauseTimeoutRef.current = setTimeout(() => {
      console.log('Long pause detected - stopping');
      stopListening();
    }, 6000);
  };

  // Text post-processing function
  const postProcessText = (text) => {
    if (!text) return text;
    
    let processedText = text;
    
    // Clean up filler words
    const fillerWords = /\b(um|uh|like|you know|sort of|kind of)\b/gi;
    processedText = processedText.replace(fillerWords, '');
    
    // Fix common speech recognition errors
    const corrections = {
      'there are': 'their',
      'your welcome': 'you\'re welcome',
      'its a': 'it\'s a',
      'cant': 'can\'t',
      'wont': 'won\'t',
      'dont': 'don\'t',
      'shouldnt': 'shouldn\'t',
      'wouldnt': 'wouldn\'t',
      'couldnt': 'couldn\'t',
    };
    
    Object.entries(corrections).forEach(([wrong, right]) => {
      const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
      processedText = processedText.replace(regex, right);
    });
    
    // Remove multiple spaces
    processedText = processedText.replace(/\s+/g, ' ');
    
    // Trim whitespace
    processedText = processedText.trim();
    
    // Capitalize first letter
    if (processedText.length > 0) {
      processedText = processedText.charAt(0).toUpperCase() + processedText.slice(1);
    }
    
    // Add period at the end if it doesn't end with punctuation
    if (processedText.length > 0 && !/[.!?]$/.test(processedText)) {
      processedText += '.';
    }
    
    return processedText;
  };

  // Handle final transcript from natural speech ending
  useEffect(() => {
    console.log('finalTranscript', finalTranscript);
    if (finalTranscript && finalTranscript !== lastTranscriptRef.current) {
      lastTranscriptRef.current = finalTranscript;
      // Add to accumulated transcript only if it's not already there
      const finalTrimmed = finalTranscript.trim();
      if (finalTrimmed && !accumulatedTranscriptRef.current.includes(finalTrimmed)) {
        accumulatedTranscriptRef.current += (accumulatedTranscriptRef.current ? ' ' : '') + finalTrimmed;
      }
      
      const processedTranscript = postProcessText(accumulatedTranscriptRef.current);
      const combinedText = initialTextRef.current + (initialTextRef.current ? ' ' : '') + processedTranscript;
      onTranscript(combinedText);
      resetTranscript();
    }
  }, [finalTranscript, onTranscript, resetTranscript]);

  // Handle interim transcript and auto-stop timer
  useEffect(() => {
    if (isListening && transcript) {
      lastTranscriptRef.current = transcript;
      
      // Get clean current transcript (remove any overlap with accumulated)
      let cleanCurrentTranscript = transcript;
      if (accumulatedTranscriptRef.current) {
        // Remove any overlap to prevent duplication
        const accumulated = accumulatedTranscriptRef.current.toLowerCase();
        const current = transcript.toLowerCase();
        
        // If current transcript starts with end of accumulated, remove the overlap
        const words = accumulated.split(' ');
        const lastWords = words.slice(-5).join(' '); // Check last 5 words for overlap
        
        if (current.startsWith(lastWords)) {
          cleanCurrentTranscript = transcript.substring(lastWords.length).trim();
        }
      }
      
      // Combine accumulated + clean current transcript
      const fullTranscript = accumulatedTranscriptRef.current + 
        (accumulatedTranscriptRef.current && cleanCurrentTranscript ? ' ' : '') + 
        cleanCurrentTranscript;
      const combinedText = initialTextRef.current + (initialTextRef.current ? ' ' : '') + fullTranscript;
      onTranscript(combinedText);
      
      // Reset timeouts on new speech
      if (shortPauseTimeoutRef.current || mediumPauseTimeoutRef.current || longPauseTimeoutRef.current) {
        clearAllTimeouts();
      }
      
      // Set progressive timeouts
      setProgressiveTimeouts();
    }
  }, [transcript, isListening, onTranscript]);

  const startListening = () => {
    console.log('startListening called');
    console.log('browserSupportsSpeechRecognition:', browserSupportsSpeechRecognition);
    console.log('window.isSecureContext:', window.isSecureContext);
    console.log('window.location.protocol:', window.location.protocol);
    console.log('window.location.hostname:', window.location.hostname);

    if (!browserSupportsSpeechRecognition) {
      console.error('Browser does not support speech recognition');
      alert("Your browser doesn't support speech recognition. Please try using Chrome, Safari, or Edge.");
      return;
    }

    // Check if we're on HTTPS or localhost
    const isSecureContext = window.isSecureContext || 
                           window.location.protocol === 'https:' || 
                           ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);

    console.log('isSecureContext:', isSecureContext);

    if (!isSecureContext) {
      console.error('Not in secure context');
      alert(
        "Voice input requires HTTPS for security reasons.\n\n" +
        "This site is currently using HTTP, which blocks microphone access.\n\n" +
        "Please contact the site administrator to enable HTTPS, or try accessing via a secure connection."
      );
      return;
    }

    // Check if SpeechRecognition is available
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      console.error('SpeechRecognition API not available');
      alert("Speech Recognition API is not available in this browser or context.");
      return;
    }

    // Store the current text before starting voice input
    initialTextRef.current = currentText;
    // Reset accumulated transcript for new session
    accumulatedTranscriptRef.current = '';
    setIsListening(true);
    lastTranscriptRef.current = '';
    resetTranscript();
    
    console.log('Starting speech recognition...');
    SpeechRecognition.startListening({
      continuous: true,
      language: 'en-US',
    }).catch((error) => {
      console.error('Speech recognition error:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      setIsListening(false);
      
      if (error.name === 'NotAllowedError') {
        alert("Microphone access was denied. Please allow microphone access and try again.");
      } else if (error.name === 'NotSupportedError') {
        alert("Speech recognition is not supported on this connection. Please use HTTPS.");
      } else if (error.name === 'ServiceNotAllowedError') {
        alert("Speech recognition service is not allowed. Please check your browser settings and ensure you're using HTTPS.");
      } else if (error.name === 'BadGrammarError') {
        alert("There was an issue with the speech recognition grammar. Please try again.");
      } else if (error.name === 'LanguageNotSupportedError') {
        alert("The specified language is not supported. Please try again.");
      } else {
        alert(`Voice input failed to start: ${error.message}. Please check your microphone permissions and ensure you're using HTTPS.`);
      }
    });
  };

  const stopListening = () => {
    // If we have current transcript, add it to accumulated
    if (transcript && transcript.trim()) {
      accumulatedTranscriptRef.current += (accumulatedTranscriptRef.current ? ' ' : '') + transcript.trim();
    }
    
    // Process the final accumulated transcript
    if (accumulatedTranscriptRef.current) {
      const processedTranscript = postProcessText(accumulatedTranscriptRef.current);
      const combinedText = initialTextRef.current + (initialTextRef.current ? ' ' : '') + processedTranscript;
      onTranscript(combinedText);
    }
    
    setIsListening(false);
    SpeechRecognition.stopListening();
    
    // Clear all timeouts
    clearAllTimeouts();
    
    // Reset transcript after a short delay to ensure the final transcript is captured
    setTimeout(() => {
      resetTranscript();
      accumulatedTranscriptRef.current = '';
    }, 100);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (shortPauseTimeoutRef.current || mediumPauseTimeoutRef.current || longPauseTimeoutRef.current) {
        clearAllTimeouts();
      }
    };
  }, []);

  if (!browserSupportsSpeechRecognition || !isInitialized) {
    return (
      <button
        disabled={true}
        className="p-2 rounded-lg bg-gray-800 cursor-not-allowed text-gray-500 transition-colors"
        title={
          initError 
            ? `Voice input unavailable: ${initError}`
            : "Voice input not available"
        }
      >
        <Mic className="h-4 w-4 opacity-50" />
      </button>
    );
  }

  // Check if we're in a secure context
  const isSecureContext = window.isSecureContext || 
                         window.location.protocol === 'https:' || 
                         ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);

  return (
    <button
      onClick={toggleListening}
      disabled={disabled || !isSecureContext || !isInitialized}
      className={`p-2 rounded-lg transition-colors ${
        !isSecureContext || !isInitialized
          ? 'bg-gray-800 cursor-not-allowed text-gray-500'
          : isListening
          ? 'bg-red-600 hover:bg-red-700 animate-pulse'
          : 'bg-gray-600 hover:bg-gray-700'
      } disabled:bg-gray-800 disabled:cursor-not-allowed text-white`}
      title={
        !isInitialized
          ? `Voice input initializing... ${initError ? `Error: ${initError}` : ''}`
          : !isSecureContext
          ? 'Voice input requires HTTPS - not available on HTTP'
          : isListening 
          ? 'Stop recording (auto-stops after 6s of silence)' 
          : 'Start voice input'
      }
    >
      {isListening ? (
        <MicOff className="h-4 w-4" />
      ) : (
        <Mic className={`h-4 w-4 ${(!isSecureContext || !isInitialized) ? 'opacity-50' : ''}`} />
      )}
    </button>
  );
};

export default VoiceInput; 