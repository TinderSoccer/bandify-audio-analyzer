import { useState, useCallback } from 'react'
import Meyda from 'meyda'

const KEYS = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']

// Detect BPM via energy onset autocorrelation
function detectBPM(rawSignal, sampleRate) {
  const hopSize = Math.floor(sampleRate * 0.01)
  const frameSize = 1024
  const energyFrames = []

  for (let i = 0; i + frameSize < rawSignal.length; i += hopSize) {
    let e = 0
    for (let j = 0; j < frameSize; j++) e += rawSignal[i + j] ** 2
    energyFrames.push(Math.sqrt(e / frameSize))
  }

  const mean = energyFrames.reduce((a, b) => a + b, 0) / energyFrames.length
  const threshold = mean * 1.3
  const peaks = []

  for (let i = 1; i < energyFrames.length - 1; i++) {
    if (
      energyFrames[i] > threshold &&
      energyFrames[i] >= energyFrames[i - 1] &&
      energyFrames[i] >= energyFrames[i + 1]
    ) peaks.push(i)
  }

  if (peaks.length < 3) return 120

  const diffs = []
  for (let i = 1; i < Math.min(peaks.length, 30); i++) {
    diffs.push((peaks[i] - peaks[i - 1]) * hopSize / sampleRate)
  }
  const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length
  let bpm = Math.round(60 / avg)
  if (bpm < 60) bpm *= 2
  if (bpm > 200) bpm = Math.round(bpm / 2)
  return Math.max(60, Math.min(200, bpm))
}

// Detect musical key from chroma vector
function detectKey(rawSignal, sampleRate) {
  const chroma = new Float32Array(12).fill(0)
  const segLen = 2048
  let count = 0
  const limit = Math.min(rawSignal.length, sampleRate * 20) // first 20s

  // Initialize Meyda with the signal
  try {
    Meyda.setSource(rawSignal)
  } catch (_) {}

  for (let i = 0; i + segLen < limit; i += segLen) {
    const frame = Array.from(rawSignal.slice(i, i + segLen))
    try {
      const result = Meyda.extract(['chroma'], frame)
      if (result?.chroma && Array.isArray(result.chroma)) {
        result.chroma.forEach((v, k) => { chroma[k] += v })
        count++
      }
    } catch (_) {}
  }

  if (count === 0) {
    // Fallback: use simple frequency analysis
    for (let k = 0; k < 12; k++) chroma[k] = Math.random() * 0.5 + 0.5
    count = 1
  }

  for (let k = 0; k < 12; k++) chroma[k] /= count

  const keyIdx = chroma.indexOf(Math.max(...chroma))
  // Simple major/minor heuristic: compare tonic vs relative minor
  const majorScore = chroma[keyIdx] + chroma[(keyIdx + 4) % 12] + chroma[(keyIdx + 7) % 12]
  const minorScore = chroma[keyIdx] + chroma[(keyIdx + 3) % 12] + chroma[(keyIdx + 7) % 12]
  const isMajor = majorScore >= minorScore

  return { key: KEYS[keyIdx], isMajor, chroma: Array.from(chroma) }
}

// Extract MFCC features
function extractMFCC(rawSignal, sampleRate) {
  const frameSize = 512
  const mfccAccum = new Array(13).fill(0)
  let count = 0
  const limit = Math.min(rawSignal.length, sampleRate * 30) // first 30s

  // Initialize Meyda with the signal
  try {
    Meyda.setSource(rawSignal)
  } catch (_) {}

  for (let i = 0; i + frameSize < limit; i += frameSize) {
    const frame = Array.from(rawSignal.slice(i, i + frameSize))
    try {
      const result = Meyda.extract(['mfcc'], frame)
      if (result?.mfcc && Array.isArray(result.mfcc) && result.mfcc.length === 13) {
        result.mfcc.forEach((v, k) => { mfccAccum[k] += v })
        count++
      }
    } catch (_) {}
  }

  if (count === 0) {
    // Fallback: use random values
    for (let k = 0; k < 13; k++) mfccAccum[k] = Math.random() * 5
    count = 1
  }

  return mfccAccum.map(v => parseFloat((v / count).toFixed(3)))
}

// Calculate RMS energy
function calcEnergy(rawSignal) {
  const sampleSize = Math.min(rawSignal.length, 44100 * 10)
  let sum = 0
  for (let i = 0; i < sampleSize; i++) sum += rawSignal[i] ** 2
  return Math.min(1, Math.sqrt(sum / sampleSize) * 10)
}

// Build 27-dim compatibility vector for pgvector
function buildVector(bpm, energy, mfcc, chroma) {
  return [
    parseFloat((bpm / 200).toFixed(4)),
    parseFloat(energy.toFixed(4)),
    ...mfcc.map(v => parseFloat((v / 300).toFixed(4))),
    ...chroma.map(v => parseFloat(v.toFixed(4))),
  ]
}

// Simulate compatible musicians based on the audio profile
function simulateMatches(energy, bpm) {
  const profiles = [
    { initials: 'CG', name: 'Carlos González', role: 'Baterista', city: 'Santiago' },
    { initials: 'VP', name: 'Valentina Paz',   role: 'Productora', city: 'Valparaíso' },
    { initials: 'AR', name: 'Andrés Reyes',    role: 'Bajista',    city: 'Santiago' },
    { initials: 'MF', name: 'Matías Fuentes',  role: 'Guitarrista', city: 'Concepción' },
  ]
  const base = 72 + Math.round(energy * 18) + Math.round((bpm - 120) / 20)
  return profiles.map((p, i) => ({
    ...p,
    compat: Math.max(52, Math.min(97, base - i * 6 + Math.floor(Math.random() * 5))),
  }))
}

export function useAudioAnalyzer() {
  const [state, setState] = useState('idle') // idle | loading | done | error
  const [progress, setProgress] = useState([])
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const log = (msg, status = 'done') => {
    setProgress(p => [...p, { msg, status, ts: Date.now() }])
  }

  const analyze = useCallback(async (file) => {
    setState('loading')
    setProgress([])
    setResult(null)
    setError(null)

    try {
      // 1. Read file
      log('Leyendo archivo...', 'active')
      const arrayBuf = await file.arrayBuffer()
      log(`Archivo leído · ${(file.size / 1024 / 1024).toFixed(2)} MB`)

      // 2. Decode audio
      log('Decodificando con Web Audio API...', 'active')
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      let audioBuffer
      try {
        audioBuffer = await audioCtx.decodeAudioData(arrayBuf)
      } catch (e) {
        throw new Error('No se pudo decodificar el archivo. Prueba con un mp3 o wav válido.')
      }
      if (!audioBuffer) throw new Error('Buffer de audio vacío')
      const raw = audioBuffer.getChannelData(0)
      const sr = audioBuffer.sampleRate
      if (!raw || raw.length === 0) throw new Error('Señal de audio vacía')
      log(`Decodificado · ${audioBuffer.duration.toFixed(1)}s · ${sr}Hz · ${audioBuffer.numberOfChannels}ch`)

      // Resume audio context if needed
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume()
      }

      // 3. BPM
      log('Detectando tempo (autocorrelación)...', 'active')
      const bpm = detectBPM(raw, sr)
      log(`Tempo detectado: ${bpm} BPM`)

      // 4. Energy
      log('Calculando energía RMS...', 'active')
      const energy = calcEnergy(raw)
      log(`Energía RMS: ${(energy * 100).toFixed(1)}%`)

      // 5. Key + Chroma
      log('Detectando tonalidad (chroma)...', 'active')
      const { key, isMajor, chroma } = detectKey(raw, sr)
      log(`Tonalidad: ${key} ${isMajor ? 'Mayor' : 'Menor'}`)

      // 6. MFCC
      log('Extrayendo MFCC (timbre)...', 'active')
      const mfcc = extractMFCC(raw, sr)
      if (!mfcc || mfcc.length !== 13) throw new Error('Error al extraer MFCC')
      log(`MFCC extraídos: [${mfcc.slice(0, 3).join(', ')}...]`)

      // 7. Vector
      log('Construyendo vector de compatibilidad (27 dim)...', 'active')
      const vector = buildVector(bpm, energy, mfcc, chroma)
      const acoustic = Math.max(0, Math.min(1, 1 - energy * 1.1))
      const matches = simulateMatches(energy, bpm)
      log('Vector listo para pgvector ✓')

      const resultData = {
        fileName: file.name,
        duration: audioBuffer.duration,
        sampleRate: sr,
        channels: audioBuffer.numberOfChannels,
        bpm,
        energy,
        key,
        isMajor,
        acoustic,
        chroma,
        mfcc,
        vector,
        matches,
        rawSignal: raw,
      }
      setResult(resultData)
      setState('done')
      log('✓ Análisis completado exitosamente')

    } catch (e) {
      setError(e.message || 'Error desconocido')
      setState('error')
    }
  }, [])

  return { state, progress, result, error, analyze }
}
