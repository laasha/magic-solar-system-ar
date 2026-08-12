let voices: SpeechSynthesisVoice[] = [];

// Initialize voices as soon as possible
if ('speechSynthesis' in window) {
  voices = window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    voices = window.speechSynthesis.getVoices();
  };
}

export function speak(text: string) {
  if (!('speechSynthesis' in window)) return;

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const msg = new SpeechSynthesisUtterance(text);
  
  // Try to find a Georgian voice, if not fallback to default
  const georgianVoice = voices.find(v => v.lang.startsWith('ka') || v.name.toLowerCase().includes('georgian'));
  
  if (georgianVoice) {
    msg.voice = georgianVoice;
  }
  
  msg.lang = 'ka-GE';
  msg.rate = 1.0; // Normal rate
  msg.pitch = 0.9; // Slightly lower pitch for serious tone
  
  window.speechSynthesis.speak(msg);
}

export function stopSpeaking() {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
}
