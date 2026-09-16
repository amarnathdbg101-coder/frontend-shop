/**
 * Professional Soundbox Audio Synthesizer & Natural Speech Engine
 * Designed for ShopSilo Retail POS & Merchant OS
 * 
 * Features:
 * 1. Studio-grade Web Audio API multi-harmonic resonant chime (like Paytm/PhonePe hardware soundboxes)
 * 2. High-clarity Devanagari Hindi numbers & speech synthesizer with Neural/Natural voice prioritization
 * 3. Dynamic Real-Time Data Announcements: Real Store Name, Exact Rupee Amount, Customer Name & Payment Mode
 * 4. Automatic dual-mode language support: speaks native Devanagari Hindi on Hindi engines, 
 *    and clear Indian-English on English engines (no bot-like Latin transliteration glitching)
 */

// Comprehensive Devanagari Hindi Number to Words dictionary (1 to 99,99,999)
const DEVANAGARI_ONES = [
  '', 'एक', 'दो', 'तीन', 'चार', 'पाँच', 'छह', 'सात', 'आठ', 'नौ', 'दस',
  'ग्यारह', 'बारह', 'तेरह', 'चौदह', 'पंद्रह', 'सोलह', 'सत्रह', 'अठारह', 'उन्नीस', 'बीस',
  'इक्कीस', 'बाईस', 'तेईस', 'चौबीस', 'पच्चीस', 'छब्बीस', 'सत्ताईस', 'अट्ठाईस', 'उनतीस', 'तीस',
  'इकतीस', 'बत्तीस', 'तैंतीस', 'चौंतीस', 'पैंतीस', 'छत्तीस', 'सैंतीस', 'अड़तीस', 'उनतालीस', 'चालीस',
  'इकतालीस', 'बयालीस', 'तैंतालीस', 'चवालीस', 'पैंतालीस', 'छियालीस', 'सैंतालीस', 'अड़तालीस', 'उनचास', 'पचास',
  'इक्यावन', 'बावन', 'तिरेपन', 'चौवन', 'पचपन', 'छप्पन', 'सत्तावन', 'अट्ठावन', 'उनसठ', 'साठ',
  'इकसठ', 'बासठ', 'तिरसठ', 'चौंसठ', 'पैंसठ', 'छियासठ', 'सरसठ', 'अड़सठ', 'उनहत्तर', 'सत्तर',
  'इकहत्तर', 'बहत्तर', 'तिहत्तर', 'चौहत्तर', 'पचहत्तर', 'छिहत्तर', 'सतहत्तर', 'अठहत्तर', 'उन्नासी', 'अस्सी',
  'इक्यासी', 'बयासी', 'तिरासी', 'चौरासी', 'पचासी', 'छियासी', 'सत्तासी', 'अट्ठासी', 'नवासी', 'नब्बे',
  'इक्यानवे', 'बानवे', 'तिरानवे', 'चौरानवे', 'पंचानवे', 'छियानवे', 'सत्तानवे', 'अट्ठानवे', 'निन्यानवे', 'सौ'
];

export const numberToDevanagariWords = (num) => {
  const n = Math.round(Number(num) || 0);
  if (n <= 0) return 'शून्य';
  if (n > 9999999) return `${n.toLocaleString('en-IN')}`;

  let words = '';
  let rem = n;

  if (rem >= 100000) {
    const lakh = Math.floor(rem / 100000);
    words += (DEVANAGARI_ONES[lakh] || lakh) + ' लाख ';
    rem %= 100000;
  }
  if (rem >= 1000) {
    const hazar = Math.floor(rem / 1000);
    words += (DEVANAGARI_ONES[hazar] || hazar) + ' हज़ार ';
    rem %= 1000;
  }
  if (rem >= 100) {
    const sau = Math.floor(rem / 100);
    words += (DEVANAGARI_ONES[sau] || sau) + ' सौ ';
    rem %= 100;
  }
  if (rem > 0) {
    words += DEVANAGARI_ONES[rem] || rem;
  }

  return words.trim();
};

export const numberToEnglishWords = (num) => {
  const n = Math.round(Number(num) || 0);
  if (n <= 0) return 'zero';
  if (n > 9999999) return `${n.toLocaleString('en-IN')}`;

  const a = [
    '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'
  ];
  const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  const inWords = (numVal) => {
    if (numVal < 20) return a[numVal];
    const digit = numVal % 10;
    return b[Math.floor(numVal / 10)] + (digit ? ' ' + a[digit] : '');
  };

  let str = '';
  let rem = n;

  if (rem >= 100000) {
    const lakh = Math.floor(rem / 100000);
    str += inWords(lakh) + ' lakh ';
    rem %= 100000;
  }
  if (rem >= 1000) {
    const hazar = Math.floor(rem / 1000);
    str += inWords(hazar) + ' thousand ';
    rem %= 1000;
  }
  if (rem >= 100) {
    const sau = Math.floor(rem / 100);
    str += a[sau] + ' hundred ';
    rem %= 100;
  }
  if (rem > 0) {
    str += inWords(rem);
  }

  return str.trim();
};

/**
 * Play authentic soundbox chime using Web Audio API with harmonic overtones and compression
 */
export const playSoundboxTone = (tone = 'payment') => {
  try {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Master dynamics compressor for loud, bold, punchy tone without distortion
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-18, now);
    compressor.knee.setValueAtTime(30, now);
    compressor.ratio.setValueAtTime(12, now);
    compressor.attack.setValueAtTime(0.003, now);
    compressor.release.setValueAtTime(0.25, now);
    compressor.connect(ctx.destination);

    const masterGain = ctx.createGain();
    masterGain.connect(compressor);

    if (tone === 'payment') {
      // 🔔 Iconic Multi-Harmonic Soundbox Payment Chime (D5 -> A5 -> D6 Arpeggio)
      const chord = [
        { freq: 587.33, time: 0.00, dur: 0.35, gain: 0.35 }, // D5
        { freq: 880.00, time: 0.09, dur: 0.35, gain: 0.40 }, // A5
        { freq: 1174.66, time: 0.18, dur: 0.55, gain: 0.45 }, // D6 (Hero Bell)
      ];

      chord.forEach(({ freq, time, dur, gain: noteGain }) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();

        // Dual sine + subtle triangle overtone for rich hardware soundbox bell body
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + time);

        g.gain.setValueAtTime(0, now + time);
        g.gain.linearRampToValueAtTime(noteGain, now + time + 0.015);
        g.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

        osc.connect(g);
        g.connect(masterGain);

        osc.start(now + time);
        osc.stop(now + time + dur + 0.05);
      });
    } else if (tone === 'credit') {
      // ⚠️ Distinctive Warm Credit/Udhar Tone (Two-tone alert)
      [
        { freq: 523.25, time: 0.00, dur: 0.20 }, // C5
        { freq: 659.25, time: 0.10, dur: 0.35 }, // E5
      ].forEach(({ freq, time, dur }) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + time);

        g.gain.setValueAtTime(0.3, now + time);
        g.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

        osc.connect(g);
        g.connect(masterGain);

        osc.start(now + time);
        osc.stop(now + time + dur + 0.05);
      });
    } else {
      // 🔄 Reversal / Alert Double Beep
      [
        { freq: 700, time: 0.00, dur: 0.15 },
        { freq: 450, time: 0.12, dur: 0.25 },
      ].forEach(({ freq, time, dur }) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + time);

        g.gain.setValueAtTime(0.25, now + time);
        g.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

        osc.connect(g);
        g.connect(masterGain);

        osc.start(now + time);
        osc.stop(now + time + dur + 0.05);
      });
    }
  } catch (e) {
    console.warn('[Soundbox] AudioContext error:', e);
  }
};

/**
 * Intelligent Speech Synthesis Announcer
 * Selects best available Neural/Natural Indian Voice (Swara, Heera, Google हिन्दी, Ravi)
 */
export const playSoundboxAnnouncement = (options) => {
  if (typeof window === 'undefined') return;

  let hindiText = '';
  let englishText = '';
  let tone = 'payment';

  if (typeof options === 'string') {
    hindiText = options;
    englishText = options;
  } else if (options && typeof options === 'object') {
    hindiText = options.hindiText || options.text || '';
    englishText = options.englishText || options.text || hindiText;
    tone = options.tone || 'payment';
  }

  if (!hindiText && !englishText) return;

  // 1. Play high-impact harmonic chime first
  playSoundboxTone(tone);

  // 2. Speech Synthesis
  if (!window.speechSynthesis) return;

  try {
    window.speechSynthesis.cancel(); // Cancel any overlapping voice

    const voices = window.speechSynthesis.getVoices();

    // Prioritize natural Hindi voice, followed by Indian English
    const hindiVoice = voices.find(
      (v) =>
        (v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi') || v.name.toLowerCase().includes('swara') || v.name.toLowerCase().includes('kalpana') || v.name.toLowerCase().includes('lekha'))
    );

    const indianEnglishVoice = voices.find(
      (v) =>
        v.lang === 'en-IN' ||
        v.lang === 'en_IN' ||
        v.name.toLowerCase().includes('india') ||
        v.name.toLowerCase().includes('heera') ||
        v.name.toLowerCase().includes('neerja') ||
        v.name.toLowerCase().includes('ravi')
    );

    const activeVoice = hindiVoice || indianEnglishVoice || voices[0];
    const isHindiEngine = activeVoice && (activeVoice.lang.startsWith('hi') || activeVoice.name.toLowerCase().includes('hindi'));

    const textToSpeak = isHindiEngine ? hindiText : englishText;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    utterance.lang = isHindiEngine ? 'hi-IN' : (indianEnglishVoice ? 'en-IN' : 'en-US');
    if (activeVoice) {
      utterance.voice = activeVoice;
    }
    
    // Bold, punchy, confident delivery parameters
    utterance.rate = 0.94; // Steady, professional cadence
    utterance.pitch = 1.0; // Natural resonant pitch
    utterance.volume = 1.0; // Full volume

    // Wait 320ms for the chime to peak, then speak clearly
    setTimeout(() => {
      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('[Soundbox] Speak execution error:', err);
      }
    }, 320);
  } catch (e) {
    console.warn('[Soundbox] Announcement error:', e);
  }
};

/**
 * Real-Time Soundbox Announcement for POS & Customer Payments
 * e.g., "शॉपसिलो पर रमेश कुमार से ₹500 प्राप्त हुए। शुक्रिया!"
 */
export const speakSoundboxPayment = (payload, ...rest) => {
  // Support legacy signature (amount, paymentMode, customerName, shopName) or object signature
  let amount = 0;
  let shopName = 'शॉपसिलो';
  let customerName = '';
  let paymentMode = '';

  if (typeof payload === 'object' && payload !== null) {
    amount = payload.amount;
    shopName = payload.shopName || 'शॉपसिलो';
    customerName = payload.customerName || '';
    paymentMode = payload.paymentMode || '';
  } else {
    amount = payload;
    paymentMode = rest[0] || '';
    customerName = rest[1] || '';
    shopName = rest[2] || 'शॉपसिलो';
  }

  const n = Math.round(Number(amount) || 0);
  if (n <= 0) return;

  const hindiAmount = numberToDevanagariWords(n);
  const englishAmount = numberToEnglishWords(n);
  const cleanStoreName = (shopName && typeof shopName === 'string') ? shopName.trim() : 'शॉपसिलो';

  // Natural Devanagari Hindi Text
  let hindiText = `${cleanStoreName} पर `;
  if (customerName) {
    hindiText += `${customerName} से `;
  }
  if (paymentMode && typeof paymentMode === 'string' && paymentMode.toLowerCase() === 'upi') {
    hindiText += `UPI द्वारा `;
  }
  hindiText += `${hindiAmount} रुपये प्राप्त हुए। शुक्रिया!`;

  // Natural Indian English Text
  let englishText = `Received ${englishAmount} rupees on ${cleanStoreName}`;
  if (customerName) {
    englishText += ` from ${customerName}`;
  }
  englishText += `. Thank you!`;

  playSoundboxAnnouncement({
    hindiText,
    englishText,
    tone: 'payment',
  });
};

/**
 * Real-Time Soundbox Announcement for Khata Credit (Udhar) & Payment (Jama)
 */
export const speakKhataTransaction = (payload, ...rest) => {
  let type = 'CREDIT';
  let amount = 0;
  let customerName = '';
  let shopName = 'शॉपसिलो';

  if (typeof payload === 'object' && payload !== null) {
    type = payload.type || 'CREDIT';
    amount = payload.amount || 0;
    customerName = payload.customerName || '';
    shopName = payload.shopName || 'शॉपसिलो';
  } else {
    type = payload;
    amount = rest[0] || 0;
    customerName = rest[1] || '';
    shopName = rest[2] || 'शॉपसिलो';
  }

  const n = Math.round(Number(amount) || 0);
  if (n <= 0) return;

  const hindiAmount = numberToDevanagariWords(n);
  const englishAmount = numberToEnglishWords(n);
  const name = customerName ? customerName.trim() : 'ग्राहक';

  const isCredit = type === 'CREDIT' || type === 'credit' || type === 'DEBIT';

  if (isCredit) {
    // 🔴 Udhar Entry Announcement
    const hindiText = `${name} के खाते में ${hindiAmount} रुपये उधार दर्ज हुए।`;
    const englishText = `${englishAmount} rupees credit recorded for ${customerName || 'customer'}.`;

    playSoundboxAnnouncement({
      hindiText,
      englishText,
      tone: 'credit',
    });
  } else {
    // 🟢 Jama / Payment Settlement Announcement
    const hindiText = `${name} से ${hindiAmount} रुपये जमा प्राप्त हुए। शुक्रिया!`;
    const englishText = `Received ${englishAmount} rupees payment from ${customerName || 'customer'}. Thank you!`;

    playSoundboxAnnouncement({
      hindiText,
      englishText,
      tone: 'payment',
    });
  }
};

/**
 * Real-Time Order Alert Announcement for Pickups
 */
export const speakOrderAlert = ({
  orderNumber = '',
  totalAmount = 0,
  customerName = '',
} = {}) => {
  const n = Math.round(Number(totalAmount) || 0);
  const hindiAmount = n > 0 ? numberToDevanagariWords(n) : '';
  const englishAmount = n > 0 ? numberToEnglishWords(n) : '';

  let hindiText = 'नया काउंटर पिकअप ऑर्डर प्राप्त हुआ है!';
  if (customerName) {
    hindiText = `${customerName} का नया पिकअप ऑर्डर प्राप्त हुआ है!`;
  }
  if (hindiAmount) {
    hindiText += ` कुल राशि ${hindiAmount} रुपये।`;
  }

  let englishText = 'New counter pickup order received!';
  if (customerName) {
    englishText = `New pickup order received from ${customerName}!`;
  }
  if (englishAmount) {
    englishText += ` Total amount ${englishAmount} rupees.`;
  }

  playSoundboxAnnouncement({
    hindiText,
    englishText,
    tone: 'payment',
  });
};
