import { useEffect, useState } from 'react'

/** Live microphone input level (0-1), via a separate getUserMedia + AnalyserNode
 * pipeline — the Web Speech API itself exposes no volume/threshold data, only
 * events (onspeechstart/onresult/onerror), so this is a best-effort visual
 * indicator, not the engine's actual speech-detection signal. */
export function useMicLevel(): number {
  const [level, setLevel] = useState(0)

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
        const source = audioCtx.createMediaStreamSource(s)
        const analyser = audioCtx.createAnalyser()
        analyser.fftSize = 512
        source.connect(analyser)
        const data = new Uint8Array(analyser.frequencyBinCount)

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
          setLevel(Math.min(1, rms * 4))
          raf = requestAnimationFrame(tick)
        }
        tick()
      })
      .catch(() => {
        // Mic denied/unavailable — meter stays at 0. SpeechRecognition surfaces
        // its own failure via onerror; nothing else to do here.
      })

    return () => {
      cancelled = true
      if (raf) cancelAnimationFrame(raf)
      stream?.getTracks().forEach((t) => t.stop())
      audioCtx?.close()
    }
  }, [])

  return level
}
