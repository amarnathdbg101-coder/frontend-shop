/**
 * Soundbox Audio Synthesizer & Voice Announcements for ShopMe Merchant
 * 
 * Emulates the audio feedback of BharatPe / Paytm / PhonePe Soundbox devices:
 * 1. Web Audio API synthesized chimes for fast, zero-asset, crisp audio feedback
 * 2. Web SpeechSynthesis Hindi voice announcement: "ShopMe par [X] rupaye prapt huye"
 */

export const playSoundboxTone = (tone = 'payment', spokenAmount = null) => {
  try {
    if (typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const now = ctx.currentTime;
        const gain = ctx.createGain();
        gain.connect(ctx.destination);

        if (tone === 'payment') {
          // Cheerful C-major chord (C5 -> E5 -> G5)
          [523.25, 659.25, 783.99].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.08);
            osc.connect(gain);
            osc.start(now + i * 0.08);
            osc.stop(now + i * 0.08 + 0.22);
          });
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        } else if (tone === 'credit') {
          // Crisp debit / credit note
          const osc = ctx.createOscillator();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(440, now); // A4
          osc.frequency.exponentialRampToValueAtTime(554.37, now + 0.15); // C#5
          osc.connect(gain);
          gain.gain.setValueAtTime(0.25, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
          osc.start(now);
          osc.stop(now + 0.35);
        } else {
          // Reversal double note
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(600, now);
          osc.frequency.setValueAtTime(400, now + 0.12);
          osc.connect(gain);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
          osc.start(now);
          osc.stop(now + 0.3);
        }
      }
    }
  } catch (e) {
    console.warn('[Soundbox] Tone playback error:', e);
  }

  // Voice announcement if amount provided
  if (spokenAmount != null) {
    speakSoundboxPayment(spokenAmount);
  }
};

export const speakSoundboxPayment = (amount) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  try {
    window.speechSynthesis.cancel(); // cancel previous queued speeches
    const cleanAmount = Math.round(Number(amount) || 0);
    const text = `ShopMe par ${cleanAmount} rupaye prapt huye`;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Try finding Hindi voice if available
    const voices = window.speechSynthesis.getVoices();
    const hiVoice = voices.find(
      (v) => v.lang.includes('hi') || v.lang.includes('HI') || v.name.toLowerCase().includes('hindi')
    );
    if (hiVoice) {
      utterance.voice = hiVoice;
    }

    // Delay speech slightly to let chord chime finish
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 450);
  } catch (e) {
    console.warn('[Soundbox] Speech error:', e);
  }
};
