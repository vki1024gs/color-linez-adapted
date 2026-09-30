const CHIP_LAYERS = Object.freeze([
  { wave: 'square', level: 0.68 },
  { wave: 'triangle', level: 0.42 },
]);

const VICTORY_LAYERS = Object.freeze([
  { wave: 'square', level: 0.42 },
  { wave: 'sawtooth', level: 0.23 },
  { wave: 'triangle', level: 0.2 },
  { wave: 'square', level: 0.08, frequencyRatio: 2 },
]);

const SFX = Object.freeze({
  select: {
    layers: CHIP_LAYERS,
    notes: [392],
    step: 0,
    attack: 0.002,
    decay: 0.055,
    volume: 0.075,
    cooldown: 35,
    maxVoices: 3,
  },
  move: {
    layers: CHIP_LAYERS,
    pattern: [330, 392, 440, 392],
    notes: [330],
    step: 0.07,
    attack: 0.001,
    decay: 0.045,
    volume: 0.052,
    cooldown: 18,
    maxVoices: 2,
  },
  land: {
    layers: CHIP_LAYERS,
    notes: [131],
    step: 0,
    attack: 0.001,
    decay: 0.13,
    volume: 0.12,
    noise: 0.18,
    bitCrush: 0.16,
    cooldown: 28,
    maxVoices: 3,
  },
  spawn: {
    layers: CHIP_LAYERS,
    notes: [262, 330, 392],
    step: 0.06,
    attack: 0.001,
    decay: 0.07,
    volume: 0.075,
    cooldown: 25,
    maxVoices: 4,
  },
  clear: {
    layers: CHIP_LAYERS,
    notes: [262, 330, 392, 523, 659],
    step: 0.036,
    attack: 0.001,
    decay: 0.13,
    volume: 0.11,
    noise: 0.24,
    tail: {
      notes: [784, 659, 523, 392],
      step: 0.055,
      delay: 0.2,
      volumeScale: 0.3,
      decayScale: 0.6,
    },
    cooldown: 60,
    maxVoices: 3,
  },
  clear6: {
    layers: CHIP_LAYERS,
    notes: [262, 330, 392, 523, 659, 880],
    step: 0.033,
    attack: 0.001,
    decay: 0.16,
    volume: 0.122,
    noise: 0.3,
    tail: {
      notes: [988, 784, 659, 523],
      step: 0.058,
      delay: 0.21,
      volumeScale: 0.34,
      decayScale: 0.7,
    },
    cooldown: 70,
    maxVoices: 2,
  },
  clear7plus: {
    layers: CHIP_LAYERS,
    notes: [262, 330, 392, 523, 659, 784, 1175],
    step: 0.031,
    attack: 0.001,
    decay: 0.2,
    volume: 0.14,
    noise: 0.38,
    tail: {
      notes: [1397, 1175, 880, 659, 523, 392],
      step: 0.06,
      delay: 0.22,
      volumeScale: 0.4,
      decayScale: 0.85,
    },
    cooldown: 90,
    maxVoices: 1,
  },
  rankup: {
    layers: VICTORY_LAYERS,
    phrase: [
      { at: 0, frequency: 330, duration: 0.13, level: 0.9 },
      { at: 0.17, frequency: 330, duration: 0.1, level: 0.72 },
      { at: 0.34, frequency: 494, duration: 0.16, level: 0.95 },
      { at: 0.58, frequency: 659, duration: 0.2, level: 1 },
      { at: 0.9, frequency: 587, duration: 0.1, level: 0.78 },
      { at: 1.04, frequency: 784, duration: 0.36, level: 0.98 },
      { at: 0, frequency: 165, duration: 0.16, level: 0.38 },
      { at: 0.34, frequency: 247, duration: 0.17, level: 0.36 },
      { at: 0.58, frequency: 330, duration: 0.2, level: 0.38 },
      { at: 1.04, frequency: 392, duration: 0.36, level: 0.44 },
    ],
    attack: 0.002,
    decay: 0.24,
    volume: 0.078,
    cooldown: 180,
    maxVoices: 1,
  },
  crown: {
    layers: VICTORY_LAYERS,
    phrase: [
      { at: 0, frequency: 523, duration: 0.22, level: 0.9 },
      { at: 0.3, frequency: 659, duration: 0.18, level: 0.92 },
      { at: 0.56, frequency: 784, duration: 0.24, level: 1 },
      { at: 0.92, frequency: 698, duration: 0.16, level: 0.78 },
      { at: 1.16, frequency: 587, duration: 0.2, level: 0.72 },
      { at: 1.46, frequency: 698, duration: 0.18, level: 0.82 },
      { at: 1.72, frequency: 880, duration: 0.25, level: 0.98 },
      { at: 2.08, frequency: 784, duration: 0.16, level: 0.8 },
      { at: 0, frequency: 262, duration: 0.26, level: 0.38 },
      { at: 0.56, frequency: 330, duration: 0.24, level: 0.35 },
      { at: 1.16, frequency: 392, duration: 0.24, level: 0.38 },
      { at: 1.72, frequency: 440, duration: 0.26, level: 0.4 },
      { at: 2.42, frequency: 659, duration: 0.13, level: 0.68 },
      { at: 2.42, frequency: 784, duration: 0.13, level: 0.54 },
      { at: 2.42, frequency: 988, duration: 0.13, level: 0.44 },
      { at: 2.42, frequency: 196, duration: 0.13, level: 0.42, accent: true },
      { at: 2.61, frequency: 523, duration: 0.12, level: 0.78 },
      { at: 2.61, frequency: 659, duration: 0.12, level: 0.58 },
      { at: 2.61, frequency: 784, duration: 0.12, level: 0.44 },
      { at: 2.61, frequency: 262, duration: 0.12, level: 0.4, accent: true },
      { at: 2.8, frequency: 659, duration: 0.4, level: 0.76 },
      { at: 2.8, frequency: 784, duration: 0.4, level: 0.61 },
      { at: 2.8, frequency: 988, duration: 0.4, level: 0.5 },
      { at: 2.8, frequency: 196, duration: 0.19, level: 0.5, accent: true },
    ],
    attack: 0.003,
    decay: 0.34,
    volume: 0.085,
    noise: 0.16,
    cooldown: 2200,
    maxVoices: 1,
  },
  gameover: {
    layers: CHIP_LAYERS,
    notes: [330, 262, 220, 175],
    step: 0.11,
    attack: 0.003,
    decay: 0.46,
    volume: 0.09,
    noise: 0.03,
    cooldown: 350,
    maxVoices: 1,
  },
  error: {
    layers: CHIP_LAYERS,
    notes: [220, 175],
    step: 0.07,
    attack: 0.002,
    decay: 0.12,
    volume: 0.095,
    noise: 0.08,
    cooldown: 80,
    maxVoices: 2,
  },
});

function envelope(gain, start, attack, decay, peak) {
  gain.gain.cancelScheduledValues(start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(peak, start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + attack + decay);
}

function getSfxDuration(definition) {
  if (definition.phrase?.length)
    return Math.max(
      ...definition.phrase.map((note) => note.at + definition.attack + note.duration + 0.025),
    );
  const mainEnd = definition.notes.length
    ? (definition.notes.length - 1) * definition.step + definition.attack + definition.decay + 0.025
    : 0;
  const tail = definition.tail;
  const tailEnd = tail?.notes.length
    ? tail.delay +
      (tail.notes.length - 1) * tail.step +
      definition.attack +
      definition.decay * tail.decayScale +
      0.025
    : 0;
  return Math.max(mainEnd, tailEnd);
}

function playProceduralSfx(context, destination, definition, onEnded = () => {}) {
  const nodes = [];
  const sources = [];
  const output = context.createGain();
  output.connect(destination);
  let remaining = 0;
  let finished = false;

  function finish() {
    if (finished) return;
    finished = true;
    output.disconnect();
    for (const node of nodes) node.disconnect();
    onEnded();
  }

  function stop() {
    for (const source of sources) {
      try {
        source.stop();
      } catch {
        // Already ended or interrupted during device shutdown.
      }
    }
    finish();
  }

  function trackSource(source) {
    sources.push(source);
    nodes.push(source);
    remaining++;
    source.onended = () => {
      remaining--;
      if (remaining === 0) finish();
    };
    return source;
  }

  function playVoice(
    frequency,
    when,
    volumeScale,
    decayScale,
    includeNoise,
    layers = definition.layers,
    noteDuration,
  ) {
    const decay = noteDuration ?? definition.decay * decayScale;
    const duration = Math.max(0.035, definition.attack + decay + 0.025);
    const voiceOutput = definition.bitCrush
      ? createBitCrusher(context, definition.bitCrush)
      : output;
    if (voiceOutput !== output) {
      nodes.push(voiceOutput);
      voiceOutput.connect(output);
    }
    for (const layer of layers) {
      const oscillator = trackSource(context.createOscillator());
      const gain = context.createGain();
      nodes.push(gain);
      oscillator.type = layer.wave;
      oscillator.frequency.setValueAtTime(frequency * (layer.frequencyRatio ?? 1), when);
      oscillator.connect(gain).connect(voiceOutput);
      envelope(gain, when, definition.attack, decay, definition.volume * layer.level * volumeScale);
      oscillator.start(when);
      oscillator.stop(when + duration);
    }
    if (definition.noise && includeNoise) {
      const buffer = context.createBuffer(
        1,
        Math.ceil(context.sampleRate * duration),
        context.sampleRate,
      );
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const source = trackSource(context.createBufferSource());
      const gain = context.createGain();
      nodes.push(gain);
      source.buffer = buffer;
      source.connect(gain).connect(voiceOutput);
      envelope(gain, when, 0.001, decay * 0.55, definition.noise * definition.volume * volumeScale);
      source.start(when);
      source.stop(when + duration);
    }
  }

  try {
    const when = context.currentTime;
    if (definition.phrase) {
      for (const note of definition.phrase)
        playVoice(
          note.frequency,
          when + note.at,
          note.level,
          1,
          note.accent === true,
          note.layers ?? definition.layers,
          note.duration,
        );
    } else {
      for (const [index, frequency] of definition.notes.entries())
        playVoice(frequency, when + index * definition.step, 1, 1, index === 0);
      if (definition.tail) {
        const tail = definition.tail;
        for (const [index, frequency] of tail.notes.entries())
          playVoice(
            frequency,
            when + tail.delay + index * tail.step,
            tail.volumeScale,
            tail.decayScale,
            false,
          );
      }
    }
    return { stop };
  } catch (error) {
    stop();
    throw error;
  }
}

function createBitCrusher(context, amount) {
  const shaper = context.createWaveShaper();
  const curve = new Float32Array(256);
  const levels = 2 ** Math.max(2, Math.round(8 - amount * 8));
  for (let i = 0; i < curve.length; i++) {
    const sample = (i * 2) / (curve.length - 1) - 1;
    curve[i] = Math.round(sample * levels) / levels;
  }
  shaper.curve = curve;
  shaper.oversample = 'none';
  return shaper;
}

export { CHIP_LAYERS, SFX, createBitCrusher, getSfxDuration, playProceduralSfx };
