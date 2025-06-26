import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

const VoiceInput = ({ onTranscript, disabled = false, currentText = '' }) => {
  const [isListening, setIsListening] = useState(false);
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
    if (!browserSupportsSpeechRecognition) {
      alert("Your browser doesn't support speech recognition. Please try using Chrome, Safari, or Edge.");
      return;
    }

    // Store the current text before starting voice input
    initialTextRef.current = currentText;
    // Reset accumulated transcript for new session
    accumulatedTranscriptRef.current = '';
    setIsListening(true);
    lastTranscriptRef.current = '';
    resetTranscript();
    SpeechRecognition.startListening({
      continuous: true,
      language: 'en-US',
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

  if (!browserSupportsSpeechRecognition) {
    return null; // Hide button if not supported
  }

  return (
    <button
      onClick={toggleListening}
      disabled={disabled}
      className={`p-2 rounded-lg transition-colors ${
        isListening
          ? 'bg-red-600 hover:bg-red-700 animate-pulse'
          : 'bg-gray-600 hover:bg-gray-700'
      } disabled:bg-gray-800 disabled:cursor-not-allowed text-white`}
      title={isListening ? 'Stop recording (auto-stops after 5s of silence)' : 'Start voice input'}
    >
      {isListening ? (
        <MicOff className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </button>
  );
};

export default VoiceInput; 