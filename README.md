# Bandify — Analizador de Audio

Módulo de análisis de audio del proyecto Bandify para la asignatura TPY1101, DuocUC.

## Qué hace

Sube un archivo de audio (mp3, wav, ogg) y extrae:

- **BPM** — tempo por autocorrelación de energía
- **Energía RMS** — intensidad de la señal
- **Tonalidad** — nota musical y modo (mayor/menor) por análisis de chroma
- **MFCC** — 13 coeficientes cepstrales (huella tímbrica)
- **Vector(27)** — vector de compatibilidad listo para pgvector

## Correr localmente

```bash
npm install
npm run dev
```

Abre http://localhost:5173

## Subir a Vercel (gratis)

```bash
# Opción 1: Vercel CLI
npm i -g vercel
vercel

# Opción 2: Drag & drop
# Ve a vercel.com → New Project → Import → arrastra esta carpeta
```

## Stack

- React 18 + Vite
- Meyda.js (análisis de audio / MFCC)
- Web Audio API (decodificación y waveform)

## Tecnologías que reemplaza en frontend

En el backend real esto es **Python + Librosa**. Este módulo demuestra el mismo análisis
en el navegador usando Meyda.js y la Web Audio API nativa.
