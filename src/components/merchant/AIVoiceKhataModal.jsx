import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Sparkles, Check, X, ArrowDownLeft, ArrowUpRight, AlertCircle } from 'lucide-react';

/**
 * Intelligent Hinglish Speech Parser for Khata Entry
 * Examples:
 * - "Ramesh ko 2 packet doodh 140 rupay udhar likho" -> { name: "Ramesh", amount: 140, type: "CREDIT", items: "2 packet doodh" }
 * - "Suresh se 500 rupay jama liye" -> { name: "Suresh", amount: 500, type: "PAYMENT", items: "Jama payment" }
 * - "Priya 350 udhar" -> { name: "Priya", amount: 350, type: "CREDIT", items: "Udhar" }
 */
export function parseKhataVoiceCommand(transcript, existingCustomers = []) {
  const text = transcript.toLowerCase().trim();
  let type = 'CREDIT'; // default to Udhar
  if (text.includes('jama') || text.includes('mil') || text.includes('pay') || text.includes('diye') || text.includes('aaye') || text.includes('payment')) {
    type = 'PAYMENT';
  }

  // Extract amount
  let amount = 0;
  const numMatch = text.match(/(\d+)\s*(?:rupay|rupaye|rs|inr|rupya|rupee|₹)?/i);
  if (numMatch) {
    amount = parseFloat(numMatch[1]) || 0;
  }

  // Find customer match
  let matchedCustomer = null;
  let customerName = '';

  for (const cust of existingCustomers) {
    const cName = (cust.customer_name || cust.name || '').toLowerCase();
    const cPhone = (cust.customer_mobile || cust.phone || '');
    if (cName && text.includes(cName)) {
      matchedCustomer = cust;
      customerName = cust.customer_name || cust.name;
      break;
    }
    if (cPhone && text.includes(cPhone.slice(-4))) {
      matchedCustomer = cust;
      customerName = cust.customer_name || cust.name;
      break;
    }
  }

  if (!matchedCustomer) {
    // Guess name: First word before 'ko', 'se', 'ka'
    const nameMatch = text.match(/^([a-zA-Z\u0900-\u097F]+)(?:\s+ko|\s+se|\s+ka)?/i);
    if (nameMatch && !['ek', 'do', 'teen', 'udhar', 'jama', 'paise'].includes(nameMatch[1])) {
      customerName = nameMatch[1].charAt(0).toUpperCase() + nameMatch[1].slice(1);
    }
  }

  // Extract items/notes
  let items = '';
  const cleaned = text
    .replace(/\b(ko|se|ka|rupay|rupaye|rs|rupya|₹|\d+|udhar|jama|likho|liye|diye|karein|karo)\b/gi, '')
    .trim();
  if (cleaned.length > 2) {
    items = cleaned;
  }

  return {
    customerName: customerName || (matchedCustomer ? (matchedCustomer.customer_name || matchedCustomer.name) : ''),
    customerMobile: matchedCustomer ? (matchedCustomer.customer_mobile || matchedCustomer.phone) : '',
    amount,
    type,
    items: items || (type === 'CREDIT' ? 'Voice Udhar Entry' : 'Voice Cash Payment'),
    matchedCustomer,
    rawText: transcript,
  };
}

export const AIVoiceKhataModal = ({ isOpen, onClose, customers = [], onConfirm }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsedResult, setParsedResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      setIsListening(false);
      setTranscript('');
      setParsedResult(null);
      setErrorMsg('');
      return;
    }

    // Initialize Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMsg('Aapke browser me speech recognition support nahi hai. Kripya Chrome use karein.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'hi-IN'; // Hindi / Hinglish primary

    recognition.onstart = () => {
      setIsListening(true);
      setErrorMsg('');
    };

    recognition.onresult = (event) => {
      let currentText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentText += event.results[i][0].transcript;
      }
      setTranscript(currentText);
      if (event.results[0].isFinal) {
        const parsed = parseKhataVoiceCommand(currentText, customers);
        setParsedResult(parsed);
      }
    };

    recognition.onerror = (event) => {
      console.warn('Speech error:', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        setErrorMsg('Microphone permission block hai. Kripya permission allow karein.');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    startListening();

    return () => {
      try { recognition.stop(); } catch {}
    };
  }, [isOpen, customers]);

  const startListening = () => {
    if (recognitionRef.current) {
      try {
        setTranscript('');
        setParsedResult(null);
        setErrorMsg('');
        recognitionRef.current.start();
      } catch {}
    }
  };

  const handleSave = () => {
    if (!parsedResult || !parsedResult.amount || parsedResult.amount <= 0) {
      alert('Rakam (amount) samajh nahi aayi. Dobara bole ya manually likhein.');
      return;
    }
    onConfirm(parsedResult);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-black shadow-md shadow-indigo-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-gray-900 text-base">🎙️ AI Voice Khata</h3>
              <p className="text-xs text-gray-500">Bol kar turant Udhar / Jama likhein</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mic Visualizer */}
        <div className="text-center py-6 space-y-3 bg-gradient-to-b from-indigo-50/50 to-transparent rounded-2xl border border-indigo-100/60">
          <div className="relative inline-block">
            {isListening && (
              <span className="absolute inset-0 rounded-full bg-indigo-500 animate-ping opacity-30" />
            )}
            <button
              onClick={isListening ? () => recognitionRef.current?.stop() : startListening}
              className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl transition transform hover:scale-105 ${
                isListening ? 'bg-red-600 shadow-red-200' : 'bg-indigo-600 shadow-indigo-200'
              }`}
            >
              {isListening ? <Mic className="w-9 h-9 animate-pulse" /> : <MicOff className="w-9 h-9" />}
            </button>
          </div>

          <div>
            <p className="text-sm font-black text-gray-900">
              {isListening ? 'Sun rahe hain... Aawaz dijiye' : 'Bolne ke liye Mic dabayein'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Example: "Ramesh ko 2 packet doodh 140 rupay udhar likho"
            </p>
          </div>
        </div>

        {/* Live Transcript */}
        {transcript && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">Aapne Bola:</p>
            <p className="text-sm font-semibold text-gray-800 italic">"{transcript}"</p>
          </div>
        )}

        {/* Error Message */}
        {errorMsg && (
          <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl flex items-center gap-2 border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* AI Parsed Card */}
        {parsedResult && (
          <div className="bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border-2 border-indigo-200 rounded-2xl p-4 space-y-3 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> AI Auto-Detected:
              </span>
              <span
                className={`text-xs font-black px-2 py-0.5 rounded-md ${
                  parsedResult.type === 'CREDIT' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}
              >
                {parsedResult.type === 'CREDIT' ? 'Udhar (+)' : 'Jama (-)'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-left">
              <div className="bg-white/90 p-2.5 rounded-xl border border-gray-100">
                <p className="text-[10px] text-gray-400 font-bold">Customer:</p>
                <p className="text-sm font-black text-gray-900 truncate">
                  {parsedResult.customerName || 'Select Customer'}
                </p>
              </div>

              <div className="bg-white/90 p-2.5 rounded-xl border border-gray-100">
                <p className="text-[10px] text-gray-400 font-bold">Rakam (Amount):</p>
                <p className="text-base font-black text-indigo-700">₹{parsedResult.amount}</p>
              </div>
            </div>

            {parsedResult.items && (
              <div className="bg-white/90 p-2 rounded-xl border border-gray-100 text-left">
                <p className="text-[10px] text-gray-400 font-bold">Samaan / Details:</p>
                <p className="text-xs font-medium text-gray-700">{parsedResult.items}</p>
              </div>
            )}

            <button
              onClick={handleSave}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-xl transition shadow-md shadow-indigo-200 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Sahi Hai, Khate me Likhein</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
export default AIVoiceKhataModal;
