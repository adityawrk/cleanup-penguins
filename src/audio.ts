type RoomId = 'quay' | 'hold' | 'locker' | 'glasshouse'

/**
 * Every sound in the harbor is synthesized here. No samples, no files.
 * Everything runs through one master bus with a gentle compressor so stacked effects never clip.
 * Each room also has a quiet ambient bed: waves and gulls on the quay, a muffled creaking hull in the hold,
 * a hum in the Locker, drips and birds in the Glasshouse.
 */
export class HarborAudio {
  private ctx: AudioContext | null = null
  private bus: GainNode | null = null
  private noiseBuffer: AudioBuffer | null = null
  private bed: { room: RoomId; stop: () => void } | null = null
  private bedTimer = 0
  private room: RoomId = 'quay'
  muted = false

  unlock() {
    if (this.muted) return
    const ctx = this.context()
    if (ctx.state === 'suspended') void ctx.resume()
    if (!this.bed) this.ambience(this.room)
  }

  toggle() {
    this.muted = !this.muted
    if (this.muted) this.stopBed()
    else this.unlock()
    return !this.muted
  }

  /** Switch the ambient bed to a room. */
  ambience(room: RoomId) {
    this.room = room
    if (this.muted || !this.ctx) return
    if (this.bed?.room === room) return
    this.stopBed()
    const ctx = this.context()
    const out = ctx.createGain()
    out.gain.setValueAtTime(0.0001, ctx.currentTime)
    out.gain.exponentialRampToValueAtTime(1, ctx.currentTime + 1.2)
    out.connect(this.master())
    const stops: (() => void)[] = []
    if (room === 'quay' || room === 'hold') {
      // Waves: looping noise through a low-pass whose level swells like surf.
      const src = this.loopNoise()
      const lp = ctx.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = room === 'hold' ? 260 : 520
      const amp = ctx.createGain()
      amp.gain.value = room === 'hold' ? 0.05 : 0.035
      const lfo = ctx.createOscillator()
      const depth = ctx.createGain()
      lfo.frequency.value = 0.13
      depth.gain.value = room === 'hold' ? 0.03 : 0.025
      lfo.connect(depth)
      depth.connect(amp.gain)
      src.connect(lp)
      lp.connect(amp)
      amp.connect(out)
      src.start()
      lfo.start()
      stops.push(() => {
        src.stop()
        lfo.stop()
      })
    }
    if (room === 'locker') {
      const hum = ctx.createOscillator()
      const amp = ctx.createGain()
      hum.type = 'sine'
      hum.frequency.value = 58
      amp.gain.value = 0.02
      hum.connect(amp)
      amp.connect(out)
      hum.start()
      stops.push(() => hum.stop())
    }
    const sprinkle = () => {
      if (this.muted) return
      if (room === 'quay') this.gull(out)
      if (room === 'hold') this.creakHull(out)
      if (room === 'glasshouse') Math.random() < 0.5 ? this.drip(out) : this.tweet(out)
      if (room === 'locker') this.clank(out)
      this.bedTimer = window.setTimeout(sprinkle, 6000 + Math.random() * 9000)
    }
    this.bedTimer = window.setTimeout(sprinkle, 2500 + Math.random() * 3000)
    this.bed = {
      room,
      stop: () => {
        window.clearTimeout(this.bedTimer)
        out.gain.cancelScheduledValues(ctx.currentTime)
        out.gain.setValueAtTime(Math.max(0.0001, out.gain.value), ctx.currentTime)
        out.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5)
        window.setTimeout(() => {
          for (const stop of stops) stop()
          out.disconnect()
        }, 600)
      },
    }
  }

  /** A soft step: a thump plus a tick whose color depends on the floor. */
  foot(high: boolean, room: RoomId = 'quay') {
    if (this.muted) return
    const floor = {
      quay: { thump: 150, tick: 1400, q: 1.2, gain: 0.05 },
      hold: { thump: 110, tick: 900, q: 1, gain: 0.055 },
      locker: { thump: 180, tick: 3200, q: 6, gain: 0.035 },
      glasshouse: { thump: 200, tick: 2600, q: 3, gain: 0.035 },
    }[room]
    this.tone(high ? floor.thump * 1.15 : floor.thump, 0.06, 'sine', 0.05, 0.6)
    this.burst(0.035, floor.tick * (high ? 1.1 : 1), floor.q, floor.gain, 'bandpass')
  }

  pop() {
    this.sweep(520, 980, 0.07, 'sine', 0.05)
  }

  card() {
    this.tone(659, 0.05, 'triangle', 0.16)
    this.later(70, () => this.tone(988, 0.04, 'triangle', 0.2))
  }

  /** The second sea card: two low notes, a little ominous. */
  tide() {
    this.tone(220, 0.06, 'triangle', 0.22)
    this.later(120, () => this.tone(165, 0.06, 'triangle', 0.34))
  }

  heave() {
    this.sweep(150, 260, 0.1, 'triangle', 0.06)
    this.burst(0.06, 500, 1, 0.03, 'lowpass')
  }

  setDown() {
    this.tone(95, 0.08, 'sine', 0.12, 0.5)
    this.burst(0.05, 700, 1, 0.04, 'lowpass')
  }

  /** The scout's call: a quick rising tweet, twice. */
  chirp() {
    this.sweep(1500, 2600, 0.06, 'sine', 0.035)
    this.later(90, () => this.sweep(1700, 3000, 0.05, 'sine', 0.03))
  }

  /** The tide board flipping: a rattle of small clicks. */
  flap() {
    for (let i = 0; i < 6; i += 1) this.later(i * 38, () => this.burst(0.012, 2400 + i * 120, 4, 0.05, 'bandpass'))
  }

  oof() {
    this.sweep(220, 130, 0.12, 'triangle', 0.06)
  }

  snore() {
    this.burst(0.5, 380, 1, 0.05, 'lowpass')
  }

  /** Something hits the water: a wash of noise falling in pitch, then a few droplets. */
  splash() {
    if (this.muted) return
    const ctx = this.context()
    const src = ctx.createBufferSource()
    src.buffer = this.noise()
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.Q.value = 0.8
    bp.frequency.setValueAtTime(2400, ctx.currentTime)
    bp.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.5)
    const amp = this.envelope(0.14, 0.01, 0.55)
    src.connect(bp)
    bp.connect(amp)
    src.start()
    src.stop(ctx.currentTime + 0.6)
    for (let i = 0; i < 4; i += 1) this.later(120 + i * 70 + Math.random() * 40, () => this.sweep(900 + Math.random() * 700, 1900 + Math.random() * 600, 0.05, 'sine', 0.025))
  }

  /** Changing rooms: a soft whoosh. */
  creak() {
    if (this.muted) return
    const ctx = this.context()
    const src = ctx.createBufferSource()
    src.buffer = this.noise()
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.Q.value = 1.4
    bp.frequency.setValueAtTime(300, ctx.currentTime)
    bp.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.32)
    const amp = this.envelope(0.06, 0.12, 0.42)
    src.connect(bp)
    bp.connect(amp)
    src.start()
    src.stop(ctx.currentTime + 0.5)
  }

  /** The ship's bell on the quay: inharmonic partials with a long ring. */
  bell() {
    for (const [ratio, gain, dur] of [[1, 0.07, 1.6], [2.76, 0.035, 1], [5.4, 0.018, 0.6], [0.5, 0.03, 1.8]] as const) {
      this.tone(520 * ratio, gain, 'sine', dur, 1)
    }
  }

  private gull(out: AudioNode) {
    const calls = 2 + Math.floor(Math.random() * 3)
    for (let i = 0; i < calls; i += 1) {
      this.later(i * 190, () => this.sweep(1300 + Math.random() * 200, 900, 0.16, 'triangle', 0.012, out))
    }
  }

  private creakHull(out: AudioNode) {
    this.sweep(70, 110, 0.6, 'sawtooth', 0.006, out)
  }

  private drip(out: AudioNode) {
    this.sweep(900, 1700, 0.05, 'sine', 0.02, out)
  }

  private tweet(out: AudioNode) {
    for (let i = 0; i < 3; i += 1) this.later(i * 110, () => this.sweep(2600, 3600, 0.05, 'sine', 0.01, out))
  }

  private clank(out: AudioNode) {
    this.tone(1240, 0.008, 'triangle', 0.3, 1, out)
  }

  private stopBed() {
    this.bed?.stop()
    this.bed = null
  }

  private context() {
    if (!this.ctx) this.ctx = new AudioContext()
    return this.ctx
  }

  private master(): AudioNode {
    const ctx = this.context()
    if (!this.bus) {
      const comp = ctx.createDynamicsCompressor()
      comp.threshold.value = -18
      comp.ratio.value = 3
      this.bus = ctx.createGain()
      this.bus.gain.value = 0.9
      this.bus.connect(comp)
      comp.connect(ctx.destination)
    }
    return this.bus
  }

  private noise(): AudioBuffer {
    const ctx = this.context()
    if (!this.noiseBuffer) {
      const length = ctx.sampleRate * 2
      this.noiseBuffer = ctx.createBuffer(1, length, ctx.sampleRate)
      const data = this.noiseBuffer.getChannelData(0)
      for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1
    }
    return this.noiseBuffer
  }

  private loopNoise(): AudioBufferSourceNode {
    const src = this.context().createBufferSource()
    src.buffer = this.noise()
    src.loop = true
    return src
  }

  private envelope(gain: number, attack: number, dur: number, out: AudioNode = this.master()): GainNode {
    const ctx = this.context()
    const amp = ctx.createGain()
    amp.gain.setValueAtTime(0.0001, ctx.currentTime)
    amp.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + attack)
    amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur)
    amp.connect(out)
    return amp
  }

  private tone(freq: number, gain: number, type: OscillatorType, dur: number, drop = 0.85, out?: AudioNode) {
    if (this.muted) return
    const ctx = this.context()
    const osc = ctx.createOscillator()
    osc.type = type
    osc.frequency.setValueAtTime(freq, ctx.currentTime)
    if (drop < 1) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq * drop), ctx.currentTime + dur)
    osc.connect(this.envelope(gain, 0.008, dur, out))
    osc.start()
    osc.stop(ctx.currentTime + dur + 0.05)
  }

  private sweep(from: number, to: number, dur: number, type: OscillatorType, gain: number, out?: AudioNode) {
    if (this.muted) return
    const ctx = this.context()
    const osc = ctx.createOscillator()
    osc.type = type
    osc.frequency.setValueAtTime(from, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(to, ctx.currentTime + dur)
    osc.connect(this.envelope(gain, 0.01, dur, out))
    osc.start()
    osc.stop(ctx.currentTime + dur + 0.05)
  }

  private burst(dur: number, freq: number, q: number, gain: number, type: BiquadFilterType) {
    if (this.muted) return
    const ctx = this.context()
    const src = ctx.createBufferSource()
    src.buffer = this.noise()
    const filter = ctx.createBiquadFilter()
    filter.type = type
    filter.frequency.value = freq
    filter.Q.value = q
    src.connect(filter)
    filter.connect(this.envelope(gain, 0.004, dur))
    src.start(ctx.currentTime, Math.random() * 1.5)
    src.stop(ctx.currentTime + dur + 0.05)
  }

  private later(ms: number, fn: () => void) {
    window.setTimeout(fn, ms)
  }
}
