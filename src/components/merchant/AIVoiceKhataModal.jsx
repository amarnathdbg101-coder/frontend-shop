import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Sparkles, Check, X, ArrowDownLeft, ArrowUpRight, AlertCircle, User, Phone, Tag } from 'lucide-react';

/**
 * Intelligent Hinglish Speech Parser for Khata Entry
 */
export function parseKhataVoiceCommand(transcript, existingCustomers = []) {
  const text = transcript.toLowerCase().trim();
  let type = 'CREDIT'; // default to Udhar
  if (
    text.includes('jama') ||
    text.includes('mil') ||
    text.includes('pay') ||
    text.includes('diye') ||
    text.includes('aaye') ||
    text.includes('payment')
  ) {
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
    const cPhone = cust.customer_mobile || cust.phone || '';
    if (cName && cName.length >= 3 && text.includes(cName)) {
      matchedCustomer = cust;
      customerName = cust.customer_name || cust.name;
      break;
    }
    if (cPhone && cPhone.length >= 4 && text.includes(cPhone.slice(-4))) {
      matchedCustomer = cust;
      customerName = cust.customer_name || cust.name;
      break;
    }
  }

  if (!matchedCustomer) {
    const words = text.split(' ').filter(Boolean);
    if (words.length > 0) {
      const firstWord = words[0].replace(/[^a-zA-Z0-9]/g, '');
      if (firstWord && !['ek', 'do', 'teen', 'udhar', 'jama', 'paise', 'bhai'].includes(firstWord.toLowerCase())) {
        customerName = firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
      }
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
    customerName: customerName || (matchedCustomer ? matchedCustomer.customer_name || matchedCustomer.name : 'Customer'),
    customerMobile: matchedCustomer ? matchedCustomer.customer_mobile || matchedCustomer.phone : '',
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

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMsg('Aapke browser me speech recognition support nahi hai. Niche text box me type karein.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'hi-IN';

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

  const handleManualTextChange = (text) => {
    setTranscript(text);
    if (text.trim().length > 3) {
      const parsed = parseKhataVoiceCommand(text, customers);
      setParsedResult(parsed);
    } else {
      setParsedResult(null);
    }
  };

  const applySample = (sample) => {
    setTranscript(sample);
    const parsed = parseKhataVoiceCommand(sample, customers);
    setParsedResult(parsed);
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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          maxWidth: '460px',
          width: '100%',
          padding: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
          border: '1px solid #e2e8f0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '14px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                Bol Kar Khata Likhein
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                AI Hinglish Voice Assistant
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '6px',
              borderRadius: '50%',
              backgroundColor: '#f1f5f9',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Mic Visualizer Area */}
        <div style={{ textAlign: 'center', padding: '24px 0 16px 0' }}>
          <div
            onClick={startListening}
            style={{
              width: '84px',
              height: '84px',
              margin: '0 auto 14px auto',
              borderRadius: '50%',
              background: isListening
                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: isListening ? '0 0 25px rgba(239, 68, 68, 0.5)' : '0 10px 25px rgba(79, 70, 229, 0.35)',
              transition: 'all 0.2s',
            }}
          >
            {isListening ? <Mic size={38} /> : <MicOff size={38} />}
          </div>

          <p style={{ fontSize: '0.88rem', fontWeight: 700, color: isListening ? '#dc2626' : '#475569', margin: 0 }}>
            {isListening ? '🎙️ Sun rahe hain... Boliye' : 'Mic par click karein ya bole'}
          </p>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Jaise: "Ramesh ko 140 rupay udhar doodh" ya "Amit 500 jama"
          </span>
        </div>

        {/* Quick Sample Prompts */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
            ⚡ Sample Voice Prompts:
          </div>
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
            {[
              'Ramesh ko 140 rupay udhar doodh',
              'Amit ne 500 rupay jama kiye cash',
              'Rahul 220 udhar tel',
            ].map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => applySample(p)}
                style={{
                  whiteSpace: 'nowrap',
                  fontSize: '0.72rem',
                  padding: '6px 10px',
                  borderRadius: '10px',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  cursor: 'pointer',
                }}
              >
                "{p}"
              </button>
            ))}
          </div>
        </div>

        {/* Transcript Input Box */}
        <div style={{ marginBottom: '14px' }}>
          <textarea
            value={transcript}
            onChange={(e) => handleManualTextChange(e.target.value)}
            placeholder="Yahan boliye ya type karein (e.g. Ramesh 150 udhar doodh)..."
            style={{
              width: '100%',
              minHeight: '60px',
              padding: '10px 12px',
              borderRadius: '12px',
              border: '1.5px solid #cbd5e1',
              fontSize: '0.88rem',
              outline: 'none',
              resize: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Error message */}
        {errorMsg && (
          <div style={{ backgroundColor: '#fef2f2', color: '#ef4444', padding: '8px 12px', borderRadius: '10px', fontSize: '0.8rem', marginBottom: '12px' }}>
            {errorMsg}
          </div>
        )}

        {/* Parsed AI Intelligence Card */}
        {parsedResult && (
          <div
            style={{
              backgroundColor: parsedResult.type === 'CREDIT' ? '#fef2f2' : '#f0fdf4',
              border: `1.5px solid ${parsedResult.type === 'CREDIT' ? '#fecaca' : '#bbf7d0'}`,
              borderRadius: '16px',
              padding: '14px',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span
                style={{
                  backgroundColor: parsedResult.type === 'CREDIT' ? '#ef4444' : '#10b981',
                  color: '#ffffff',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: '6px',
                }}
              >
                {parsedResult.type === 'CREDIT' ? '🔴 UDHAR (Credit)' : '🟢 JAMA (Payment)'}
              </span>
              <span style={{ fontSize: '1.4rem', fontWeight: 900, color: parsedResult.type === 'CREDIT' ? '#dc2626' : '#16a34a' }}>
                {parsedResult.type === 'CREDIT' ? '-' : '+'}₹{Number(parsedResult.amount).toLocaleString('en-IN')}
              </span>
            </div>

            <div style={{ fontSize: '0.84rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={14} color="#64748b" />
                <span>Customer: <strong>{parsedResult.customerName}</strong> {parsedResult.customerMobile && `(${parsedResult.customerMobile})`}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Tag size={14} color="#64748b" />
                <span>Details: {parsedResult.items}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#f1f5f9',
              color: '#475569',
              border: '1px solid #cbd5e1',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!parsedResult || !parsedResult.amount}
            style={{
              flex: 2,
              padding: '12px',
              background: parsedResult && parsedResult.amount ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#cbd5e1',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '0.92rem',
              cursor: parsedResult && parsedResult.amount ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Check size={18} />
            <span>1-Tap Khata Me Save</span>
          </button>
        </div>
      </div>
    </div>
  );
};
