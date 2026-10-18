import { describe, expect, it, vi } from 'vitest';
import { canListen, listen, pickVoice, speak } from '../src/lib/voice';

type Win = Parameters<typeof canListen>[0];
const voice = (lang: string, name = lang) => ({ lang, name }) as SpeechSynthesisVoice;

/** Minimal SpeechRecognition stand-in: tests drive it through `last`. */
class FakeRecognition {
  static last: FakeRecognition;
  lang = '';
  interimResults = true;
  onresult: ((e: unknown) => void) | null = null;
  onerror: ((e: unknown) => void) | null = null;
  onend: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn();
  constructor() { FakeRecognition.last = this; }
}
const finalResult = (text: string) => ({ results: [Object.assign([{ transcript: text }], { isFinal: true })] });

describe('canListen', () => {
  it('is false without a SpeechRecognition constructor (Firefox)', () => {
    expect(canListen({} as Win)).toBe(false);
  });
  it('is true with the webkit-prefixed constructor (Safari)', () => {
    expect(canListen({ webkitSpeechRecognition: FakeRecognition } as unknown as Win)).toBe(true);
  });
});

describe('listen', () => {
  it('uses the chosen language and resolves with the final transcript', async () => {
    const r = listen('ml-IN', { SpeechRecognition: FakeRecognition } as unknown as Win);
    const rec = FakeRecognition.last;
    expect(rec.lang).toBe('ml-IN');
    expect(rec.start).toHaveBeenCalled();
    rec.onresult!(finalResult('നമസ്കാരം'));
    await expect(r.result).resolves.toBe('നമസ്കാരം');
  });
  it('rejects on a recognition error', async () => {
    const r = listen('en-IN', { SpeechRecognition: FakeRecognition } as unknown as Win);
    FakeRecognition.last.onerror!({ error: 'not-allowed' });
    await expect(r.result).rejects.toThrow('not-allowed');
  });
  it('resolves empty when recognition ends without speech', async () => {
    const r = listen('en-IN', { SpeechRecognition: FakeRecognition } as unknown as Win);
    FakeRecognition.last.onend!();
    await expect(r.result).resolves.toBe('');
  });
  it('can be stopped', () => {
    const r = listen('en-IN', { SpeechRecognition: FakeRecognition } as unknown as Win);
    r.stop();
    expect(FakeRecognition.last.stop).toHaveBeenCalled();
  });
});

describe('pickVoice', () => {
  it('has no Malayalam fallback to another language', () => {
    expect(pickVoice('ml', [voice('en-US'), voice('en-IN')])).toBeNull();
    expect(pickVoice('ml', [voice('en-US'), voice('ml-IN')])?.lang).toBe('ml-IN');
  });
  it('prefers Indian English, then any English', () => {
    expect(pickVoice('en', [voice('en-US'), voice('en-IN')])?.lang).toBe('en-IN');
    expect(pickVoice('en', [voice('en-GB')])?.lang).toBe('en-GB');
    expect(pickVoice('en', [voice('de-DE')])).toBeNull();
  });
});

describe('speak', () => {
  const synthWin = (voices: SpeechSynthesisVoice[]) => {
    const speechSynthesis = { getVoices: () => voices, cancel: vi.fn(), speak: vi.fn() };
    class Utterance { voice: SpeechSynthesisVoice | null = null; lang = ''; constructor(public text: string) {} }
    return { win: { speechSynthesis, SpeechSynthesisUtterance: Utterance } as unknown as Win, speechSynthesis };
  };
  it('cancels current speech, then speaks with the matching voice', () => {
    const { win, speechSynthesis } = synthWin([voice('en-IN')]);
    expect(speak('Hello', 'en', win)).toBe(true);
    expect(speechSynthesis.cancel).toHaveBeenCalled();
    const u = speechSynthesis.speak.mock.calls[0][0];
    expect(u.text).toBe('Hello');
    expect(u.voice.lang).toBe('en-IN');
  });
  it('does nothing without a Malayalam voice', () => {
    const { win, speechSynthesis } = synthWin([voice('en-IN')]);
    expect(speak('നമസ്കാരം', 'ml', win)).toBe(false);
    expect(speechSynthesis.speak).not.toHaveBeenCalled();
  });
  it('does nothing without speech synthesis', () => {
    expect(speak('Hello', 'en', {} as Win)).toBe(false);
  });
});
