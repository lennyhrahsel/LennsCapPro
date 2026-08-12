import React from 'react';
import { ResolutionPreset, CropRegion } from '../types';
import { Monitor, Sliders, Crop, Sparkles, Check, Settings2 } from 'lucide-react';

interface ResolutionSelectorProps {
  resolutionPreset: ResolutionPreset;
  setResolutionPreset: (preset: ResolutionPreset) => void;
  customWidth: number;
  setCustomWidth: (w: number) => void;
  customHeight: number;
  setCustomHeight: (h: number) => void;
  targetFps: number;
  setTargetFps: (fps: number) => void;
  targetBitrate: number;
  setTargetBitrate: (bitrate: number) => void;
  cropRegion: CropRegion;
  setCropRegion: React.Dispatch<React.SetStateAction<CropRegion>>;
  isRecording: boolean;
}

export const ResolutionSelector: React.FC<ResolutionSelectorProps> = ({
  resolutionPreset,
  setResolutionPreset,
  customWidth,
  setCustomWidth,
  customHeight,
  setCustomHeight,
  targetFps,
  setTargetFps,
  targetBitrate,
  setTargetBitrate,
  cropRegion,
  setCropRegion,
  isRecording,
}) => {
  const presets: { id: ResolutionPreset; label: string; desc: string; width: number; height: number }[] = [
    { id: '4k', label: '4K Ultra HD', desc: '3840 × 2160', width: 3840, height: 2160 },
    { id: '1080p', label: '1080p Full HD', desc: '1920 × 1080', width: 1920, height: 1080 },
    { id: '720p', label: '720p HD', desc: '1280 × 720', width: 1280, height: 720 },
    { id: '480p', label: '480p SD', desc: '854 × 480', width: 854, height: 480 },
    { id: 'custom', label: 'Custom Drag Size', desc: 'User defined area', width: customWidth, height: customHeight },
  ];

  const handleApplyPreset = (preset: ResolutionPreset) => {
    setResolutionPreset(preset);
    if (preset === 'custom') {
      setCropRegion((prev) => ({
        ...prev,
        enabled: true,
        width: customWidth,
        height: customHeight,
      }));
    } else {
      const match = presets.find((p) => p.id === preset);
      if (match) {
        setCustomWidth(match.width);
        setCustomHeight(match.height);
        setCropRegion((prev) => ({
          ...prev,
          width: match.width,
          height: match.height,
        }));
      }
    }
  };

  const handleBitrateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTargetBitrate(Number(e.target.value) * 1000000); // Mbps to bps
  };

  return (
    <div className="bg-[#0F172A] border border-[#1F2937] rounded-xl p-5 shadow-2xl text-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
            <Monitor className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Resolution & Quality Settings
            </h3>
            <p className="text-[11px] text-slate-400">
              HD Presets, Frame Rate & Crop Region
            </p>
          </div>
        </div>
        {cropRegion.enabled && (
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 flex items-center gap-1 uppercase tracking-wider">
            <Crop className="w-3 h-3" /> Crop Region Active
          </span>
        )}
      </div>

      {/* Preset Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
        {presets.map((p) => {
          const isSelected = resolutionPreset === p.id;
          return (
            <button
              key={p.id}
              disabled={isRecording}
              onClick={() => handleApplyPreset(p.id)}
              className={`p-2.5 rounded-lg border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-blue-600/10 border-blue-500/60 text-blue-400 shadow'
                  : 'bg-[#1E293B] border-transparent hover:border-slate-700 text-slate-400 hover:text-slate-200'
              } ${isRecording ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold">{p.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
              </div>
              <span className="text-[10px] font-mono text-slate-400">{p.desc}</span>
            </button>
          );
        })}
      </div>

      {/* Custom Width/Height Inputs & Crop Box Toggle */}
      {resolutionPreset === 'custom' && (
        <div className="bg-[#1E293B] p-3.5 rounded-lg border border-slate-700/80 mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Settings2 className="w-3.5 h-3.5 text-blue-400" />
              Custom Resolution Dimensions
            </span>
            <span className="text-[11px] text-blue-400 font-mono font-bold">
              {customWidth} × {customHeight} px
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Width (px)</label>
              <input
                type="number"
                min={320}
                max={3840}
                disabled={isRecording}
                value={customWidth}
                onChange={(e) => {
                  const val = Math.max(320, Number(e.target.value));
                  setCustomWidth(val);
                  setCropRegion((prev) => ({ ...prev, width: val }));
                }}
                className="w-full bg-[#020617] border border-slate-700 rounded-md px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Height (px)</label>
              <input
                type="number"
                min={240}
                max={2160}
                disabled={isRecording}
                value={customHeight}
                onChange={(e) => {
                  const val = Math.max(240, Number(e.target.value));
                  setCustomHeight(val);
                  setCropRegion((prev) => ({ ...prev, height: val }));
                }}
                className="w-full bg-[#020617] border border-slate-700 rounded-md px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Common Aspect Ratio quick buttons */}
            <div className="col-span-2 flex items-end gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setCustomWidth(1920);
                  setCustomHeight(1080);
                  setCropRegion((prev) => ({ ...prev, width: 1920, height: 1080 }));
                }}
                className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold uppercase rounded border border-slate-700"
              >
                16:9 HD
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomWidth(1080);
                  setCustomHeight(1080);
                  setCropRegion((prev) => ({ ...prev, width: 1080, height: 1080 }));
                }}
                className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold uppercase rounded border border-slate-700"
              >
                1:1 Square
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomWidth(1080);
                  setCustomHeight(1920);
                  setCropRegion((prev) => ({ ...prev, width: 1080, height: 1920 }));
                }}
                className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold uppercase rounded border border-slate-700"
              >
                9:16 Vertical
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Frame Rate & Bitrate Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#1E293B] p-3.5 rounded-lg border border-slate-700/80">
        {/* Frame Rate FPS */}
        <div>
          <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-2">
            Frame Rate Selection
          </label>
          <div className="flex items-center space-x-1.5">
            {[60, 30, 24].map((fps) => (
              <button
                key={fps}
                disabled={isRecording}
                onClick={() => setTargetFps(fps)}
                className={`flex-1 py-1.5 px-2 rounded text-xs font-bold border transition ${
                  targetFps === fps
                    ? 'bg-blue-600 text-white border-blue-500 shadow'
                    : 'bg-[#020617] border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {fps} FPS
              </button>
            ))}
          </div>
        </div>

        {/* Video Bitrate */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              Quality Bitrate
            </label>
            <span className="text-xs font-mono text-blue-400 font-bold">
              {(targetBitrate / 1000000).toFixed(1)} Mbps
            </span>
          </div>
          <input
            type="range"
            min={2}
            max={16}
            step={0.5}
            disabled={isRecording}
            value={targetBitrate / 1000000}
            onChange={handleBitrateChange}
            className="w-full accent-blue-500 h-1.5 bg-[#020617] rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
            <span>2 Mbps</span>
            <span>8 Mbps</span>
            <span>16 Mbps</span>
          </div>
        </div>
      </div>

      {/* Custom Drag Crop Box Enable Button */}
      <div className="mt-4 pt-3 border-t border-[#1F2937] flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Crop className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
            Interactive Drag Crop Area
          </span>
        </div>
        <button
          disabled={isRecording}
          onClick={() =>
            setCropRegion((prev) => ({
              ...prev,
              enabled: !prev.enabled,
            }))
          }
          className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
            cropRegion.enabled ? 'bg-blue-600' : 'bg-slate-800'
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
              cropRegion.enabled ? 'translate-x-5' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
};
