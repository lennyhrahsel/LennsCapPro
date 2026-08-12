import React from 'react';
import { AudioSourceType } from '../types';
import { Volume2, Mic, Laptop, Layers, VolumeX, Check, Activity } from 'lucide-react';

interface AudioSourceSelectorProps {
  audioSource: AudioSourceType;
  setAudioSource: (source: AudioSourceType) => void;
  selectedMicId: string;
  setSelectedMicId: (id: string) => void;
  mics: { deviceId: string; label: string }[];
  audioLevel: number; // 0 to 100
  isRecording: boolean;
}

export const AudioSourceSelector: React.FC<AudioSourceSelectorProps> = ({
  audioSource,
  setAudioSource,
  selectedMicId,
  setSelectedMicId,
  mics,
  audioLevel,
  isRecording,
}) => {
  const sources: { id: AudioSourceType; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'both',
      label: 'System + Mic',
      icon: <Layers className="w-4 h-4 text-blue-400" />,
      desc: 'Mix desktop audio & mic',
    },
    {
      id: 'system',
      label: 'System Audio',
      icon: <Laptop className="w-4 h-4 text-cyan-400" />,
      desc: 'Desktop sounds only',
    },
    {
      id: 'mic',
      label: 'Microphone Only',
      icon: <Mic className="w-4 h-4 text-emerald-400" />,
      desc: 'External mic input',
    },
    {
      id: 'none',
      label: 'No Audio (Mute)',
      icon: <VolumeX className="w-4 h-4 text-slate-500" />,
      desc: 'Silent video feed',
    },
  ];

  return (
    <div className="bg-[#0F172A] border border-[#1F2937] rounded-xl p-5 shadow-2xl text-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Audio Capture Source
            </h3>
            <p className="text-[11px] text-slate-400">
              Select internal system sound, microphone, or mixed channels
            </p>
          </div>
        </div>

        {/* Live Audio Visualizer Peak Meter */}
        <div className="flex items-center space-x-2 bg-[#020617] px-3 py-1 rounded-lg border border-[#1F2937]">
          <Activity className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
          <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-yellow-400 to-red-500 transition-all duration-75"
              style={{ width: `${audioLevel}%` }}
            />
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-400">{audioLevel}%</span>
        </div>
      </div>

      {/* Audio Source Option Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {sources.map((s) => {
          const isSelected = audioSource === s.id;
          return (
            <button
              key={s.id}
              disabled={isRecording}
              onClick={() => setAudioSource(s.id)}
              className={`p-2.5 rounded-lg border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-blue-600/10 border-blue-500/60 text-blue-400 shadow'
                  : 'bg-[#1E293B] border-transparent hover:border-slate-700 text-slate-400 hover:text-slate-200'
              } ${isRecording ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-1 rounded bg-[#020617] border border-slate-800">
                  {s.icon}
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
              </div>
              <div>
                <span className="text-xs font-bold block text-slate-200">{s.label}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">{s.desc}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Microphone Device Selection */}
      {(audioSource === 'mic' || audioSource === 'both') && (
        <div className="bg-[#1E293B] p-3 rounded-lg border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Mic className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Hardware Microphone Input</span>
          </div>

          <select
            disabled={isRecording || mics.length === 0}
            value={selectedMicId}
            onChange={(e) => setSelectedMicId(e.target.value)}
            className="bg-[#020617] border border-slate-700 text-slate-200 text-xs rounded-md px-3 py-1.5 focus:outline-none focus:border-blue-500 max-w-xs font-medium"
          >
            {mics.length === 0 ? (
              <option value="">Default System Microphone</option>
            ) : (
              mics.map((mic) => (
                <option key={mic.deviceId} value={mic.deviceId}>
                  {mic.label}
                </option>
              ))
            )}
          </select>
        </div>
      )}
    </div>
  );
};
