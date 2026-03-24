import { useState, useRef } from 'react'
import { useAudioAnalyzer } from './useAudioAnalyzer'
import Waveform from './components/Waveform'
import MFCCChart from './components/MFCCChart'

const s = {
  // Layout
  page: { maxWidth: 800, margin: '0 auto', padding: '24px 16px' },
  card: { background: '#0f0f1c', border: '0.5px solid #1e1e35', borderRadius: 12, padding: '20px 24px', marginBottom: 16 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 },
  // Typography
  title: { fontSize: 13, fontWeight: 500, color: '#e2e0d8', marginBottom: 12 },
  label: { fontSize: 11, color: '#888780', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' },
  bigNum: { fontSize: 28, fontWeight: 600, color: '#e2e0d8', lineHeight: 1 },
  sub: { fontSize: 11, color: '#444441', marginTop: 3 },
  body: { fontSize: 13, color: '#888780', lineHeight: 1.6 },
  // Metric card
  metric: { background: '#14141f', borderRadius: 8, padding: '14px 16px' },
  // Bar
  barWrap: { height: 6, background: '#1a1a2e', borderRadius: 99, overflow: 'hidden', marginTop: 8 },
  barFill: (pct, color) => ({ height: 6, borderRadius: 99, background: color, width: `${pct}%`, transition: 'width 0.8s ease' }),
  // Upload
  dropzone: (drag) => ({
    border: `2px dashed ${drag ? '#534AB7' : '#2e2e50'}`,
    borderRadius: 12, padding: '40px 24px', textAlign: 'center', cursor: 'pointer',
    background: drag ? '#1a1a2e' : 'transparent', transition: 'all 0.2s',
  }),
  // Step
  stepRow: { display: 'flex', alignItems: 'flex-start', gap: 12, padding: '8px 0', borderBottom: '0.5px solid #1a1a2e' },
  stepDot: (status) => ({
    width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 10, fontWeight: 600,
    background: status === 'done' ? '#0d2318' : status === 'active' ? '#1a1a2e' : '#14141f',
    color: status === 'done' ? '#1D9E75' : status === 'active' ? '#7F77DD' : '#444441',
    border: `1px solid ${status === 'done' ? '#1D9E75' : status === 'active' ? '#534AB7' : '#2e2e50'}`,
  }),
  // Tag
  tag: (color = '#1a1a2e', textColor = '#AFA9EC') => ({
    display: 'inline-block', fontSize: 11, padding: '2px 10px', borderRadius: 99,
    background: color, color: textColor, margin: '2px 3px',
    border: `0.5px solid ${textColor}40`,
  }),
  // Compat row
  compatRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '0.5px solid #1a1a2e' },
  avatar: (bg = '#1a1a2e', c = '#AFA9EC') => ({
    width: 36, height: 36, borderRadius: '50%', background: bg,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 600, color: c, flexShrink: 0,
  }),
  // Button
  btn: { background: '#534AB7', color: '#EEEDFE', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 500, cursor: 'pointer', width: '100%' },
  btnOutline: { background: 'transparent', color: '#888780', border: '0.5px solid #2e2e50', borderRadius: 8, padding: '8px 16px', fontSize: 12, cursor: 'pointer' },
}

const avatarColors = [
  ['#1e1a3e', '#AFA9EC'], ['#0d2318', '#5DCAA5'],
  ['#2a1a2e', '#ED93B1'], ['#1a1a08', '#EF9F27'],
]

function CompatPct({ pct }) {
  const color = pct >= 80 ? '#7F77DD' : pct >= 70 ? '#1D9E75' : '#D85A30'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
      <div style={s.barWrap}>
        <div style={s.barFill(pct, color)} />
      </div>
      <span style={{ fontSize: 14, fontWeight: 600, color, width: 38, textAlign: 'right' }}>{pct}%</span>
    </div>
  )
}

function StepIcon({ status }) {
  if (status === 'active') return (
    <svg width="14" height="14" viewBox="0 0 14 14" style={{ animation: 'spin 0.8s linear infinite' }}>
      <circle cx="7" cy="7" r="5" fill="none" stroke="#534AB7" strokeWidth="1.5" strokeDasharray="20" strokeDashoffset="10" />
    </svg>
  )
  if (status === 'done') return <span>✓</span>
  return <span>·</span>
}

export default function App() {
  const { state, progress, result, error, analyze, rawSignal } = useAudioAnalyzer()
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('audio/')) return
    analyze(file)
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  return (
    <div style={s.page}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        body { background: #0a0a14; }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 36, fontWeight: 700, color: '#e2e0d8', letterSpacing: -1, marginBottom: 6 }}>
          🎵 Band<span style={{ color: '#7F77DD' }}>ify</span>
        </div>
        <div style={{ fontSize: 14, color: '#888780' }}>
          Analizador de audio — Extrae BPM, tonalidad, energía y MFCC de tu demo
        </div>
        <div style={{ fontSize: 11, color: '#444441', marginTop: 4 }}>
          TPY1101 · DuocUC · Prueba técnica del módulo de análisis
        </div>
      </div>

      {/* Upload */}
      {state === 'idle' || state === 'error' ? (
        <div style={s.card}>
          <input
            ref={inputRef} type="file" accept="audio/*"
            style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files[0])}
          />
          <div
            style={s.dropzone(dragging)}
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#534AB7" strokeWidth="1.5" style={{ display: 'block', margin: '0 auto 12px' }}>
              <path d="M24 32V16M17 23l7-7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="6" y="34" width="36" height="8" rx="3"/>
            </svg>
            <div style={{ fontSize: 15, fontWeight: 500, color: '#e2e0d8', marginBottom: 6 }}>
              Arrastra tu demo aquí o haz clic
            </div>
            <div style={{ fontSize: 12, color: '#444441' }}>mp3, wav, ogg, m4a, flac — máx 50 MB</div>
          </div>
          {error && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: '#1f0808', border: '0.5px solid #7F1D1D', borderRadius: 8, fontSize: 12, color: '#F09595' }}>
              ⚠ {error}
            </div>
          )}
        </div>
      ) : null}

      {/* Pipeline steps */}
      {(state === 'loading' || state === 'done') && progress.length > 0 && (
        <div style={s.card}>
          <div style={s.title}>Pipeline de análisis</div>
          {progress.map((p, i) => (
            <div key={i} style={{ ...s.stepRow, borderBottom: i === progress.length - 1 ? 'none' : '0.5px solid #1a1a2e' }}>
              <div style={s.stepDot(p.status)}>
                <StepIcon status={p.status} />
              </div>
              <div style={{ fontSize: 13, color: p.status === 'active' ? '#AFA9EC' : '#888780' }}>{p.msg}</div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {result && (
        <>
          {/* File info + waveform */}
          <div style={s.card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#e2e0d8' }}>{result.fileName}</div>
                <div style={{ fontSize: 12, color: '#888780' }}>
                  {result.duration.toFixed(1)}s · {result.sampleRate}Hz · {result.channels}ch
                </div>
              </div>
              <div style={{ background: '#0d2318', color: '#1D9E75', fontSize: 11, padding: '3px 12px', borderRadius: 99, border: '0.5px solid #1D9E75' }}>
                ✓ Análisis completo
              </div>
            </div>
            <Waveform rawSignal={rawSignal} />
          </div>

          {/* Metrics */}
          <div style={s.grid4}>
            <div style={s.metric}>
              <div style={s.label}>Tempo</div>
              <div style={s.bigNum}>{result.bpm}</div>
              <div style={s.sub}>BPM</div>
            </div>
            <div style={s.metric}>
              <div style={s.label}>Energía</div>
              <div style={s.bigNum}>{(result.energy * 100).toFixed(0)}%</div>
              <div style={s.barWrap}><div style={s.barFill(result.energy * 100, '#534AB7')} /></div>
            </div>
            <div style={s.metric}>
              <div style={s.label}>Tonalidad</div>
              <div style={s.bigNum}>{result.key}</div>
              <div style={s.sub}>{result.isMajor ? 'Mayor' : 'Menor'}</div>
            </div>
            <div style={s.metric}>
              <div style={s.label}>Acústico</div>
              <div style={s.bigNum}>{(result.acoustic * 100).toFixed(0)}%</div>
              <div style={s.barWrap}><div style={s.barFill(result.acoustic * 100, '#1D9E75')} /></div>
            </div>
          </div>

          {/* MFCC + Genre */}
          <div style={{ ...s.grid2, marginBottom: 16 }}>
            <div style={s.card}>
              <div style={s.title}>MFCC — huella tímbrica (13 coef.)</div>
              <MFCCChart mfcc={result.mfcc} />
              <div style={{ ...s.sub, marginTop: 8 }}>
                [{result.mfcc.slice(0, 4).join(', ')}...]
              </div>
              <div style={{ fontSize: 11, color: '#444441', marginTop: 4 }}>
                Vector de 13 coeficientes · Se normaliza a vector(27) para pgvector
              </div>
            </div>
            <div style={s.card}>
              <div style={s.title}>Perfil detectado</div>
              <div style={{ marginBottom: 10 }}>
                {result.energy > 0.6
                  ? [['Indie rock','#1e1a3e','#AFA9EC'],['Post-rock','#1e1a3e','#AFA9EC']]
                  : result.energy > 0.35
                  ? [['Alternativo','#1e1a3e','#AFA9EC'],['Pop','#0d2318','#5DCAA5']]
                  : [['Folk','#1a1a08','#EF9F27'],['Acústico','#0d2318','#5DCAA5']]
                }.map(([g, bg, tc]) => (
                  <span key={g} style={s.tag(bg, tc)}>{g}</span>
                ))}
                <span style={s.tag('#14141f', '#888780')}>{result.bpm} BPM</span>
                <span style={s.tag('#14141f', '#888780')}>{result.key} {result.isMajor ? 'M' : 'm'}</span>
              </div>
              <div style={s.body}>
                Energía {result.energy > 0.6 ? 'alta' : result.energy > 0.3 ? 'media' : 'baja'} ·{' '}
                {result.acoustic > 0.5 ? 'Acústico' : 'Amplificado/electrónico'} ·{' '}
                Tonalidad {result.isMajor ? 'mayor (alegre)' : 'menor (melancólico)'}
              </div>
            </div>
          </div>

          {/* Matches */}
          <div style={s.card}>
            <div style={s.title}>Músicos compatibles con este perfil</div>
            <div style={{ fontSize: 12, color: '#444441', marginBottom: 14 }}>
              Simulación basada en el análisis — en producción usa pgvector con ORDER BY audio_vector &lt;=&gt; $1
            </div>
            {result.matches.map((m, i) => (
              <div key={m.name} style={{ ...s.compatRow, borderBottom: i === result.matches.length - 1 ? 'none' : '0.5px solid #1a1a2e' }}>
                <div style={s.avatar(...avatarColors[i % avatarColors.length])}>{m.initials}</div>
                <div style={{ minWidth: 140 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#e2e0d8' }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: '#888780' }}>{m.role} · {m.city}</div>
                </div>
                <CompatPct pct={m.compat} />
              </div>
            ))}
          </div>

          {/* Vector */}
          <div style={s.card}>
            <div style={s.title}>Vector de compatibilidad (27 dimensiones)</div>
            <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#888780', background: '#0a0a14', padding: 12, borderRadius: 6, overflowX: 'auto', whiteSpace: 'nowrap', marginBottom: 10 }}>
              [{result.vector.map(v => v.toFixed(4)).join(', ')}]
            </div>
            <div style={{ fontSize: 11, color: '#444441' }}>
              dim[0] = tempo/{200} · dim[1] = energía · dim[2..14] = MFCC normalizados · dim[15..26] = chroma
            </div>
          </div>

          {/* Reset */}
          <button
            style={s.btnOutline}
            onClick={() => window.location.reload()}
          >
            ← Analizar otro archivo
          </button>
        </>
      )}
    </div>
  )
}
