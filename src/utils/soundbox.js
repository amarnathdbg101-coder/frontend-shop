/**
 * Soundbox Audio Synthesizer & Voice Announcements for ShopMe Merchant
 * 
 * Emulates the audio feedback of BharatPe / Paytm / PhonePe Soundbox devices:
 * 1. Web Audio API synthesized chimes for instant, zero-latency, crisp audio feedback
 * 2. Natural Hindi voice announcements with full numeral conversion:
 *    "ShopMe Soundbox par ek sau pachaas rupaye prapt hue. Shukriya!"
 */

// Natural Hindi Numbers to Words for crisp, accurate pronunciation
export const numberToHindiWords = (num) => {
  const n = Math.round(Number(num) || 0);
  if (n <= 0) return 'shunya';
  if (n > 9999999) return `${n.toLocaleString('en-IN')}`;

  const ones = [
    '', 'ek', 'do', 'teen', 'chaar', 'paanch', 'chhe', 'saat', 'aath', 'nau', 'das',
    'gyaarah', 'baarah', 'terah', 'chaudah', 'pandrah', 'solah', 'satrah', 'athaarah', 'unnees', 'bees',
    'ikkees', 'baayees', 'teyees', 'chaubees', 'pachchees', 'chhabbees', 'sattaayees', 'athaayees', 'untees', 'tees',
    'iktees', 'battees', 'taintees', 'chauntees', 'paintees', 'chhattees', 'saintees', 'adhtees', 'untaalees', 'chaalees',
    'iktaalees', 'byaalees', 'taintaalees', 'chawaalees', 'paintaalees', 'chhiyaalees', 'saintaalees', 'adhtaalees', 'unchaas', 'pachaas',
    'ikyaawan', 'baawan', 'tirpan', 'chawwan', 'pachpan', 'chhappan', 'sattaawan', 'atthaawan', 'unsath', 'saath',
    'iksath', 'baasath', 'tirsath', 'chaunsath', 'painsath', 'chhiyaasath', 'sadsath', 'adsath', 'unhattar', 'sattar',
    'ikhattar', 'bahattar', 'tihattar', 'chauhattar', 'pachhattar', 'chhihattar', 'satattar', 'athattar', 'unyoonaasi', 'assi',
    'ikyaasi', 'bayaasi', 'tiraasi', 'chauraasi', 'pachaasi', 'chhiyaasi', 'sattaasi', 'atthaasi', 'nawaasi', 'nabbe',
    'ikyaanwe', 'baanwe', 'tiraanwe', 'chauraanwe', 'pachaanwe', 'chhiyaanwe', 'sattaanwe', 'atthaanwe', 'ninyaanwe', 'sau'
  ];

  let words = '';
  let rem = n;

  if (rem >= 100000) {
    const lakh = Math.floor(rem / 100000);
    words += (ones[lakh] || lakh) + ' lakh ';
    rem %= 100000;
  }
  if (rem >= 1000) {
    const hazar = Math.floor(rem / 1000);
    words += (ones[hazar] || hazar) + ' hazaar ';
    rem %= 1000;
  }
  if (rem >= 100) {
    const sau = Math.floor(rem / 100);
    words += (ones[sau] || sau) + ' sau ';
    rem %= 100;
  }
  if (rem > 0) {
    words += ones[rem] || rem;
  }

  return words.trim();
};

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

export const playSoundboxAnnouncement = (text) => {
  if (typeof window === 'undefined') return;

  // Play chime first
  playSoundboxTone('payment');

  if (!window.speechSynthesis) return;

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    // Prioritize high quality Hindi voices, fallback to Indian English
    const hiVoice = voices.find(
      (v) =>
        v.lang === 'hi-IN' ||
        v.lang.startsWith('hi') ||
        v.name.toLowerCase().includes('hindi') ||
        v.name.toLowerCase().includes('kalpana') ||
        v.name.toLowerCase().includes('hemant') ||
        v.name.toLowerCase().includes('lekha') ||
        v.name.toLowerCase().includes('india')
    ) || voices.find((v) => v.lang.includes('en-IN') || v.lang.includes('en_IN'));

    if (hiVoice) {
      utterance.voice = hiVoice;
    }

    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 280);
  } catch (e) {
    console.warn('[Soundbox] Announcement error:', e);
  }
};

export const speakSoundboxPayment = (amount) => {
  const n = Math.round(Number(amount) || 0);
  const hindiWords = numberToHindiWords(n);
  playSoundboxAnnouncement(`ShopMe Soundbox par ${hindiWords} rupaye prapt hue. Shukriya!`);
};

export const speakKhataTransaction = (type, amount, customerName = '') => {
  const n = Math.round(Number(amount) || 0);
  const hindiWords = numberToHindiWords(n);
  const name = customerName ? `${customerName} ` : 'Grahak ';

  if (type === 'CREDIT' || type === 'credit') {
    playSoundboxTone('credit');
    playSoundboxAnnouncement(`${name}ke khate me ${hindiWords} rupaye udhar likhe gaye.`);
  } else {
    playSoundboxTone('payment');
    playSoundboxAnnouncement(`${name}se ${hindiWords} rupaye jama prapt hue. Shukriya!`);
  }
};
