import React, { useRef, useEffect } from 'react';
import {
  Mic,
  Radio,
  Square,
  Pause,
  Play,
  Volume2,
  HardDrive,
  Download,
  Sparkles,
  Activity,
  Layers,
  Laptop,
} from 'lucide-react';
import { AudioSourceType } from '../types';
import { formatTime, formatFileSize } from '../utils/formatters';

interface AudioOnlyRecorderProps {
  isRecording: boolean;
  isPaused: boolean;
  countdown: number | null;
  elapsedTime: number;
  recordedBytes: number;
  audioLevel: number;
  audioSource: AudioSourceType;
  setAudioSource: (source: AudioSourceType) => void;
  selectedMicId: string;
  setSelectedMicId: (id: string) => void;
  mics: { deviceId: string; label: string }[];
  onStartAudioOnly: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export const AudioOnlyRecorder: React.FC<AudioOnlyRecorderProps> = ({
  isRecording,
  isPaused,
  countdown,
  elapsedTime,
  recordedBytes,
  audioLevel,
  audioSource,
  setAudioSource,
  selectedMicId,
  setSelectedMicId,
  mics,
  onStartAudioOnly,
  onPause,
  onResume,
  onStop,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Oscilloscope Canvas Visualizer effect
  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;

    const renderWave = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      ctx.beginPath();
      ctx.lineWidth = 2.5;

      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, '#6366f1');
      gradient.addColorStop(0.5, '#a855f7');
      gradient.addColorStop(1, '#ec4899');
      ctx.strokeStyle = gradient;

      const amp = isRecording ? Math.max(10, (audioLevel / 100) * (height / 2.5)) : 12;
      const freq = 0.03;

      for (let x = 0; x < width; x++) {
        const y = centerY + Math.sin(x * freq + phase) * amp * Math.sin((x / width) * Math.PI);
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();

      if (isRecording && !isPaused) {
        phase += 0.15;
      } else {
        phase += 0.03;
      }

      animationFrameId = requestAnimationFrame(renderWave);
    };

    renderWave();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isRecording, isPaused, audioLevel]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero Header */}
      <div className="bg-[#0F172A] border border-[#1F2937] rounded-xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-[#E2E8F0]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
              <Mic className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white uppercase tracking-wider">
                Audio Only Studio Recorder
              </h2>
              <p className="text-xs text-slate-400">
                Capture high-fidelity audio from microphone, system sounds, or both
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-1.5 bg-[#020617] px-3 py-1.5 rounded-lg border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>48 kHz HD Studio (320 kbps)</span>
            </div>
            <div className="flex items-center space-x-2 bg-[#020617] px-3 py-1.5 rounded-lg border border-[#1F2937]">
              <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="text-xs font-mono text-slate-300 font-bold">
                Peak Level: {audioLevel}%
              </span>
            </div>
          </div>
        </div>

        {/* Audio Waveform Canvas Box */}
        <div className="relative w-full h-44 bg-[#020617] rounded-xl border border-[#1F2937] overflow-hidden flex flex-col justify-between p-4 shadow-inner">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 z-10">
            <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isRecording ? 'bg-red-500 animate-ping' : 'bg-slate-600'
                }`}
              />
              {isRecording ? 'Capturing Audio Signal...' : 'Oscilloscope Ready'}
            </span>
            <span className="text-blue-400 font-bold uppercase text-[10px] tracking-wider">
              {audioSource.toUpperCase()} SOURCE
            </span>
          </div>

          <canvas
            ref={canvasRef}
            width={800}
            height={150}
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Big Armed Timer */}
          <div className="z-10 text-center py-2">
            <div className="text-4xl sm:text-6xl font-mono font-extrabold tracking-widest text-white">
              {formatTime(elapsedTime, true)}
            </div>
            <div className="text-xs text-slate-400 font-mono mt-1">
              Data Captured: {formatFileSize(recordedBytes)}
            </div>
          </div>
        </div>

        {/* Source Configuration Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
          <button
            disabled={isRecording}
            onClick={() => setAudioSource('both')}
            className={`p-3.5 rounded-lg border text-left transition ${
              audioSource === 'both'
                ? 'bg-blue-600/10 border-blue-500/60 text-blue-400'
                : 'bg-[#1E293B] border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center space-x-2 mb-1">
              <Layers className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-slate-200">System + Mic</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Record both desktop audio and voice microphone
            </p>
          </button>

          <button
            disabled={isRecording}
            onClick={() => setAudioSource('mic')}
            className={`p-3.5 rounded-lg border text-left transition ${
              audioSource === 'mic'
                ? 'bg-blue-600/10 border-blue-500/60 text-blue-400'
                : 'bg-[#1E293B] border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center space-x-2 mb-1">
              <Mic className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-200">Microphone Only</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Voice commentary, podcasts, or music instruments
            </p>
          </button>

          <button
            disabled={isRecording}
            onClick={() => setAudioSource('system')}
            className={`p-3.5 rounded-lg border text-left transition ${
              audioSource === 'system'
                ? 'bg-blue-600/10 border-blue-500/60 text-blue-400'
                : 'bg-[#1E293B] border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center space-x-2 mb-1">
              <Laptop className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-slate-200">System Audio</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Internal desktop sound or browser tabs
            </p>
          </button>
        </div>

        {/* Mic Device Picker */}
        {(audioSource === 'mic' || audioSource === 'both') && (
          <div className="mt-4 bg-[#1E293B] p-3.5 rounded-lg border border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Mic className="w-4 h-4 text-emerald-400" />
              Hardware Microphone Input
            </span>
            <select
              disabled={isRecording}
              value={selectedMicId}
              onChange={(e) => setSelectedMicId(e.target.value)}
              className="bg-[#020617] border border-slate-700 text-slate-200 text-xs rounded-md px-3 py-1.5 focus:outline-none focus:border-blue-500 font-medium w-full sm:w-auto"
            >
              {mics.length === 0 ? (
                <option value="">Default System Microphone</option>
              ) : (
                mics.map((m) => (
                  <option key={m.deviceId} value={m.deviceId}>
                    {m.label}
                  </option>
                ))
              )}
            </select>
          </div>
        )}

        {/* Controls */}
        <div className="mt-6 flex items-center justify-center space-x-4">
          {!isRecording ? (
            <button
              onClick={onStartAudioOnly}
              className="px-8 py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.4)] flex items-center space-x-2 transition-all active:scale-[0.98]"
            >
              <Radio className="w-4 h-4 animate-pulse" />
              <span>Record Audio Only</span>
            </button>
          ) : (
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              {isPaused ? (
                <button
                  onClick={onResume}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center space-x-2"
                >
                  <Play className="w-4 h-4" />
                  <span>Resume</span>
                </button>
              ) : (
                <button
                  onClick={onPause}
                  className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center space-x-2"
                >
                  <Pause className="w-4 h-4" />
                  <span>Pause</span>
                </button>
              )}
              <button
                onClick={onStop}
                className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.4)] flex items-center space-x-2"
              >
                <Square className="w-4 h-4" />
                <span>Stop & Save Audio</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
