export class HarborAudio {
  private ctx: AudioContext | null = null
  muted = false

  unlock() {
    if (this.muted) return
    const ctx = this.context()
    if (ctx.state === 'suspended') void ctx.resume()
  }

  toggle() {
    this.muted = !this.muted
    if (!this.muted) this.unlock()
    return !this.muted
  }

  foot(high: boolean) {
    this.blip(high ? 230 : 168, 0.045, 'triangle', 0.07)
  }

  pop() {
    this.blip(620, 0.03, 'sine', 0.09)
  }

  card() {
    this.blip(440, 0.04, 'sine', 0.12)
  }

  flap() {
    this.blip(180, 0.05, 'square', 0.05)
  }

  oof() {
    this.blip(140, 0.04, 'triangle', 0.1)
  }

  snore() {
    this.noise(0.18, 400)
  }

  splash() {
    this.noise(0.28, 900)
  }

  creak() {
    this.noise(0.12, 500)
  }

  private context() {
    if (!this.ctx) this.ctx = new AudioContext()
    return this.ctx
  }

  private blip(freq: number, gain: number, type: OscillatorType, dur: number) {
    if (this.muted) return
    const ctx = this.context()
    const osc = ctx.createOscillator()
    const amp = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.7), ctx.currentTime + dur)
    amp.gain.setValueAtTime(0.0001, ctx.currentTime)
    amp.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + 0.012)
    amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur)
    osc.connect(amp)
    amp.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + dur + 0.02)
  }

  private noise(dur: number, cutoff: number) {
    if (this.muted) return
    const ctx = this.context()
    const length = Math.floor(ctx.sampleRate * dur)
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length)
    const src = ctx.createBufferSource()
    src.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = cutoff
    const amp = ctx.createGain()
    amp.gain.value = 0.08
    src.connect(filter)
    filter.connect(amp)
    amp.connect(ctx.destination)
    src.start()
  }
}
