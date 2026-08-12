import React from 'react';
import {
  Video,
  Mic,
  Film,
  FileVideo,
  HelpCircle,
  Radio,
  ExternalLink,
  Download,
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'recorder' | 'audio-only' | 'editor' | 'gallery';
  setActiveTab: (tab: 'recorder' | 'audio-only' | 'editor' | 'gallery') => void;
  isRecording: boolean;
  elapsedTimeFormatted: string;
  onOpenHotkeyModal: () => void;
  onOpenWindowsInstall?: () => void;
  recordingsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isRecording,
  elapsedTimeFormatted,
  onOpenHotkeyModal,
  onOpenWindowsInstall,
  recordingsCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0F172A] border-b border-[#1F2937] text-[#E2E8F0] shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Brand logo & title */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`} />
            <span className="font-extrabold tracking-wider text-sm uppercase text-white">
              LENNSCAP PRO
            </span>
          </div>
          <span className="hidden lg:inline-block text-[10px] px-2 py-0.5 rounded border border-blue-500/30 bg-blue-500/10 text-blue-400 font-bold uppercase tracking-wider">
            Windows 10 • MP4
          </span>
        </div>

        {/* Tab Navigation */}
        <nav className="flex items-center bg-[#020617] p-1 rounded-lg border border-[#1F2937]">
          <button
            onClick={() => setActiveTab('recorder')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'recorder'
                ? 'bg-blue-600/20 border border-blue-500/50 text-blue-400 shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1E293B]'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Screen</span>
            <span className="sm:hidden">Screen</span>
          </button>

          <button
            onClick={() => setActiveTab('audio-only')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'audio-only'
                ? 'bg-blue-600/20 border border-blue-500/50 text-blue-400 shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1E293B]'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Audio</span>
            <span className="sm:hidden">Audio</span>
          </button>

          <button
            onClick={() => setActiveTab('editor')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'editor'
                ? 'bg-blue-600/20 border border-blue-500/50 text-blue-400 shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1E293B]'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Editor</span>
            <span className="sm:hidden">Editor</span>
          </button>

          <button
            onClick={() => setActiveTab('gallery')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all relative ${
              activeTab === 'gallery'
                ? 'bg-blue-600/20 border border-blue-500/50 text-blue-400 shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1E293B]'
            }`}
          >
            <FileVideo className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Gallery</span>
            {recordingsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-blue-500/30 text-blue-300 text-[10px] rounded-full font-bold">
                {recordingsCount}
              </span>
            )}
          </button>
        </nav>

        {/* Status & Guide button */}
        <div className="flex items-center space-x-2">
          {onOpenWindowsInstall && (
            <button
              onClick={onOpenWindowsInstall}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold rounded-lg transition shadow-md uppercase tracking-wider"
              title="Install app on Windows 10 (64-bit)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline text-[10px]">Win 10 App</span>
            </button>
          )}

          <button
            onClick={() => window.open(window.location.href, '_blank')}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition shadow-md uppercase tracking-wider"
            title="Open app in a new top-level tab for unrestricted native screen capture"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[10px]">Open in New Tab</span>
          </button>

          {isRecording ? (
            <div className="flex items-center space-x-2 px-3 py-1 bg-red-950/80 border border-red-500/50 rounded-full text-red-300 text-xs font-mono font-bold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <Radio className="w-3.5 h-3.5 text-red-400" />
              <span>REC {elapsedTimeFormatted}</span>
            </div>
          ) : (
            <button
              onClick={onOpenHotkeyModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#1E293B] hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700/80 transition"
              title="Hotkeys & Invisible Panel Tips"
            >
              <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden md:inline text-[11px] font-semibold uppercase tracking-wider">Hotkeys & Tips</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

