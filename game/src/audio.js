export function createAudio() {
  let context = null;
  let gainNode = null;
  let muted = false;

  function ensure() {
    if (context === null) {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return null;
      context = new AudioCtor();
      gainNode = context.createGain();
      gainNode.gain.value = muted ? 0 : 0.14;
      gainNode.connect(context.destination);
    }
    return context;
  }

  function tone({ frequency = 220, duration = 0.12, type = 'sine', volume = 0.04, sweep = 0 }) {
    const ctx = ensure();
    if (!ctx || gainNode === null || muted) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);
    if (sweep !== 0) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, frequency + sweep), now + duration);
    }
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(gainNode);
    osc.start(now);
    osc.stop(now + duration + 0.04);
  }

  function noiseBurst({ duration = 0.18, volume = 0.05, high = 1900 }) {
    const ctx = ensure();
    if (!ctx || gainNode === null || muted) return;
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      const t = i / data.length;
      data[i] = (Math.random() * 2 - 1) * (1 - t) * 0.9;
    }
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    source.buffer = buffer;
    filter.type = 'highpass';
    filter.frequency.value = high;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(gainNode);
    source.start(now);
    source.stop(now + duration + 0.02);
  }

  return {
    begin() {
      const ctx = ensure();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume();
      }
      return ctx;
    },
    setMuted(next) {
      muted = Boolean(next);
      if (gainNode) gainNode.gain.value = muted ? 0 : 0.14;
    },
    toggleMute() {
      this.setMuted(!muted);
    },
    fire() {
      tone({ frequency: 420, duration: 0.08, type: 'square', volume: 0.025, sweep: 40 });
    },
    explode() {
      tone({ frequency: 120, duration: 0.18, type: 'sawtooth', volume: 0.045, sweep: -180 });
      noiseBurst({ duration: 0.22, volume: 0.03, high: 2600 });
    },
    pickup() {
      tone({ frequency: 830, duration: 0.12, type: 'triangle', volume: 0.04, sweep: 300 });
      tone({ frequency: 1200, duration: 0.15, type: 'triangle', volume: 0.03, sweep: 180 });
    },
    hurt() {
      tone({ frequency: 210, duration: 0.18, type: 'sawtooth', volume: 0.04, sweep: -120 });
    },
    wave() {
      tone({ frequency: 380, duration: 0.22, type: 'triangle', volume: 0.04, sweep: 220 });
      tone({ frequency: 520, duration: 0.3, type: 'triangle', volume: 0.025, sweep: 240 });
    },
    win() {
      tone({ frequency: 520, duration: 0.18, type: 'triangle', volume: 0.04, sweep: 160 });
      tone({ frequency: 760, duration: 0.25, type: 'triangle', volume: 0.03, sweep: 180 });
      tone({ frequency: 1030, duration: 0.32, type: 'triangle', volume: 0.025, sweep: 200 });
    },
    lose() {
      tone({ frequency: 180, duration: 0.28, type: 'square', volume: 0.04, sweep: -80 });
      tone({ frequency: 120, duration: 0.48, type: 'sawtooth', volume: 0.03, sweep: -100 });
    },
    mutedState() {
      return muted;
    },
  };
}
