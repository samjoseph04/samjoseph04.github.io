export const ambientPreferenceKey = 'sam-joseph:ambient';
export const pauseAmbientEvent = 'portfolio:pause-ambient';

const indiaFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Kolkata',
  hourCycle: 'h23',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});
export function formatIndiaTime(date: Date) {
  return indiaFormatter.format(date);
}

// An original, quiet three-tone soundscape. Nothing is created until a user gesture.
export class AmbientSound {
  private context?: AudioContext;
  private stopped = false;
  private sources: OscillatorNode[] = [];
  private gain?: GainNode;
  constructor(
    private factory: () => AudioContext = () => new AudioContext(),
    private onInterrupted: () => void = () => {},
  ) {}

  async start() {
    if (this.context || this.stopped) throw new Error('Sound session already used');
    const context = (this.context = this.factory());
    try {
      // Call resume before yielding so the browser sees the original click gesture.
      await context.resume();
      if (this.stopped) return false;
      if (context.state !== 'running') throw new Error('Audio is unavailable');
      const master = (this.gain = context.createGain());
      master.gain.setValueAtTime(0, context.currentTime);
      master.gain.linearRampToValueAtTime(0.035, context.currentTime + 1.5);
      master.connect(context.destination);
      [110, 164.8138, 220].forEach((frequency, index) => {
        const tone = context.createOscillator();
        tone.type = 'sine';
        tone.frequency.value = frequency;
        const voice = context.createGain();
        voice.gain.value = 0.2;
        const breath = context.createOscillator();
        breath.frequency.value = 0.045 + index * 0.013;
        const depth = context.createGain();
        depth.gain.value = 0.035;
        breath.connect(depth);
        depth.connect(voice.gain);
        tone.connect(voice);
        voice.connect(master);
        this.sources.push(tone, breath);
        tone.start();
        breath.start();
      });
      context.onstatechange = () => {
        if (!this.stopped && context.state !== 'running') {
          this.stop();
          this.onInterrupted();
        }
      };
      return true;
    } catch (error) {
      this.stop();
      throw error;
    }
  }

  stop() {
    if (this.stopped) return;
    this.stopped = true;
    const context = this.context;
    if (!context) return;
    context.onstatechange = null;
    const finish = () => {
      this.sources.forEach((source) => {
        try {
          source.disconnect();
        } catch {}
      });
      this.gain?.disconnect();
      void context.close().catch(() => {});
    };
    if (context.state === 'running' && this.gain) {
      const now = context.currentTime;
      this.gain.gain.cancelScheduledValues(now);
      this.gain.gain.setValueAtTime(this.gain.gain.value, now);
      this.gain.gain.linearRampToValueAtTime(0, now + 0.04);
      this.sources.forEach((source) => source.stop(now + 0.05));
      setTimeout(finish, 80);
    } else {
      this.sources.forEach((source) => {
        try {
          source.stop();
        } catch {}
      });
      finish();
    }
  }
}
