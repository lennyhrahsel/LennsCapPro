import React from 'react';
import {
  X,
  Keyboard,
  EyeOff,
  ExternalLink,
  Timer,
  Crop,
  Layers,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

interface HotkeyGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HotkeyGuideModal: React.FC<HotkeyGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-6 relative text-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">
              Hotkeys & Invisible Control Panel Tips
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hotkeys Table */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
            <Keyboard className="w-4 h-4" /> Global Keyboard Shortcuts
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-300">Start / Stop Recording</span>
              <kbd className="bg-slate-800 border border-slate-700 px-2 py-1 rounded text-[11px] font-mono text-indigo-300">
                Alt + R
              </kbd>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-300">Pause / Resume Recording</span>
              <kbd className="bg-slate-800 border border-slate-700 px-2 py-1 rounded text-[11px] font-mono text-indigo-300">
                Alt + P
              </kbd>
            </div>
          </div>
        </div>

        {/* How to Hide Control Panel from Video */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <EyeOff className="w-4 h-4" /> How to Keep Control Panel Invisible in Recordings
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-white mb-1">
                <Timer className="w-4 h-4 text-indigo-400" />
                <span>1. Use Countdown Delay</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Set a 3s, 5s, or 10s delay. The recording starts after you minimize or switch to your target application window.
              </p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-white mb-1">
                <ExternalLink className="w-4 h-4 text-indigo-400" />
                <span>2. Picture-in-Picture Popout</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Click the pop-out button on the floating panel. Control buttons stay in a separate window outside the recorded area.
              </p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-white mb-1">
                <Crop className="w-4 h-4 text-indigo-400" />
                <span>3. Drag Custom Crop Box</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Define a custom crop rectangle. Anything outside your cropped area (including control panels) is omitted from recorded video!
              </p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-white mb-1">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>4. Select Specific "Window" or "Tab"</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                When Chrome asks for screen permissions, choose a specific application window or browser tab instead of your full monitor.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow transition"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
