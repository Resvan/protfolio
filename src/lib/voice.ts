/** The bits of `window` the voice helpers use, so tests can pass a stand-in. */
export interface VoiceWindow {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
  speechSynthesis?: Pick<SpeechSynthesis, 'getVoices' | 'cancel' | 'speak'>;
  SpeechSynthesisUtterance?: new (text: string) => SpeechSynthesisUtterance;
}
interface Recognition {
  lang: string;
  interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

const browser = () => globalThis as unknown as VoiceWindow;
const Recognizer = (win: VoiceWindow) => win.SpeechRecognition ?? win.webkitSpeechRecognition;

export function canListen(win: VoiceWindow = browser()): boolean {
  return Boolean(Recognizer(win));
}

/** One utterance of speech-to-text. `result` resolves with the transcript ('' if nothing was heard). */
export function listen(lang: 'en-IN' | 'ml-IN', win: VoiceWindow = browser()): { result: Promise<string>; stop(): void } {
  const Ctor = Recognizer(win);
  if (!Ctor) return { result: Promise.reject(new Error('unsupported')), stop() {} };
  const rec = new Ctor();
  rec.lang = lang;
  rec.interimResults = false;
  const result = new Promise<string>((resolve, reject) => {
    rec.onresult = (e) => {
      const first = Array.from(e.results).find((r) => r.isFinal);
      if (first) resolve(first[0].transcript);
    };
    rec.onerror = (e) => reject(new Error(e.error));
    rec.onend = () => resolve('');
  });
  rec.start();
  return { result, stop: () => rec.stop() };
}

/** Malayalam only ever uses a Malayalam voice; English prefers en-IN, then any English voice. */
export function pickVoice(lang: 'en' | 'ml', voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const norm = (v: SpeechSynthesisVoice) => v.lang.toLowerCase().replace('_', '-');
  if (lang === 'ml') return voices.find((v) => norm(v).startsWith('ml')) ?? null;
  return voices.find((v) => norm(v) === 'en-in') ?? voices.find((v) => norm(v).startsWith('en')) ?? null;
}

/** Reads text aloud. Returns false (and stays silent) when the device has no suitable voice. */
export function speak(text: string, lang: 'en' | 'ml', win: VoiceWindow = browser()): boolean {
  const synth = win.speechSynthesis;
  if (!synth || !win.SpeechSynthesisUtterance) return false;
  const voice = pickVoice(lang, synth.getVoices());
  if (!voice) return false;
  synth.cancel();
  const u = new win.SpeechSynthesisUtterance(text);
  u.voice = voice;
  u.lang = voice.lang;
  synth.speak(u);
  return true;
}
