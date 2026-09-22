import { useEffect, useState } from 'react'

export type MicLevelStatus = 'requesting' | 'active' | 'error'

interface MicLevelState {
  level: number
  status: MicLevelStatus
  errorMessage: string
}

/** Live microphone input level (0-1), via a separate getUserMedia + AnalyserNode
 * pipeline — the Web Speech API itself exposes no volume/threshold data, only
 * events (onspeechstart/onresult/onerror), so this is a best-effort visual
 * indicator, not the engine's actual speech-detection signal. */
export function useMicLevel(): MicLevelState {
  const [state, setState] = useState<MicLevelState>({
    level: 0, status: 'requesting', errorMessage: '',
  })

  useEffect(() => {
    let stream: MediaStream | null = null
    let audioCtx: AudioContext | null = null
    let raf = 0
    let cancelled = false

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop())
          return
        }
        stream = s
        audioCtx = new AudioContext()
        // Browsers create a new AudioContext in "suspended" state unless it's
        // resumed as part of a user gesture — without this, the graph never
        // actually processes audio and the meter stays flat at 0 forever,
        // even while the mic is picking up sound.
        if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {})
        const source = audioCtx.createMediaStreamSource(s)
        const analyser = audioCtx.createAnalyser()
        analyser.fftSize = 512
        source.connect(analyser)
        // getByteTimeDomainData wants a buffer sized to fftSize, NOT
        // frequencyBinCount (fftSize/2) — the previous version passed a
        // half-sized buffer, silently truncating the waveform it read.
        const data = new Uint8Array(analyser.fftSize)

        setState((prev) => ({ ...prev, status: 'active' }))

        const tick = () => {
          analyser.getByteTimeDomainData(data)
          let sumSquares = 0
          for (let i = 0; i < data.length; i++) {
            const normalized = (data[i] - 128) / 128
            sumSquares += normalized * normalized
          }
          const rms = Math.sqrt(sumSquares / data.length)
          // ponytail: x4 is a rough heuristic so normal speaking volume fills
          // a legible chunk of the meter — tune here if it reads too hot/cold.
          setState((prev) => ({ ...prev, level: Math.min(1, rms * 4) }))
          raf = requestAnimationFrame(tick)
        }
        tick()
      })
      .catch((err) => {
        console.error('mic level meter: getUserMedia failed', err)
        setState({
          level: 0, status: 'error',
          errorMessage: `${err?.name ?? 'Error'}: ${err?.message ?? String(err)}`,
        })
      })

    return () => {
      cancelled = true
      if (raf) cancelAnimationFrame(raf)
      stream?.getTracks().forEach((t) => t.stop())
      audioCtx?.close()
    }
  }, [])

  return state
}
