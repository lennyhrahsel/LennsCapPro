import React from 'react';
import {
  Download,
  CheckCircle2,
  Monitor,
  HardDrive,
  Cpu,
  Layers,
  X,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Video,
} from 'lucide-react';

interface WindowsInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInstallable: boolean;
  isInstalled: boolean;
  promptInstall: () => Promise<boolean>;
  isWindows10: boolean;
}

export const WindowsInstallModal: React.FC<WindowsInstallModalProps> = ({
  isOpen,
  onClose,
  isInstallable,
  isInstalled,
  promptInstall,
  isWindows10,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0F172A] border border-[#1F2937] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 relative text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
              <Monitor className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <span>Windows 10 (64-bit) Installer</span>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded text-[10px] font-mono font-bold">
                  Compatible
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Install as a standalone desktop app on Windows 10 with MP4 video output
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* System Verification Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-[#020617] border border-slate-800 rounded-xl p-3 space-y-1">
            <div className="flex items-center space-x-2 text-blue-400 text-xs font-bold">
              <Cpu className="w-4 h-4" />
              <span>OS Architecture</span>
            </div>
            <div className="text-xs font-semibold text-slate-200">
              {isWindows10 ? 'Windows 10 (64-bit)' : 'Windows / x64 Desktop'}
            </div>
            <div className="text-[10px] text-slate-400">DirectX GPU Ready</div>
          </div>

          <div className="bg-[#020617] border border-slate-800 rounded-xl p-3 space-y-1">
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold">
              <Video className="w-4 h-4" />
              <span>Video Export</span>
            </div>
            <div className="text-xs font-semibold text-emerald-300 font-mono">
              MP4 (H.264 / AAC)
            </div>
            <div className="text-[10px] text-slate-400">Windows Media Player Native</div>
          </div>

          <div className="bg-[#020617] border border-slate-800 rounded-xl p-3 space-y-1">
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold">
              <Layers className="w-4 h-4" />
              <span>PWA Desktop</span>
            </div>
            <div className="text-xs font-semibold text-slate-200">
              {isInstalled ? 'Installed Standalone' : 'Ready to Install'}
            </div>
            <div className="text-[10px] text-slate-400">Start Menu & Taskbar</div>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="bg-gradient-to-r from-blue-950/60 via-indigo-950/60 to-slate-900 border border-blue-500/30 rounded-xl p-5 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>1-Click Windows 10 App Installation</span>
              </h4>
              <p className="text-xs text-slate-300 mt-1 max-w-md">
                Installs LENNSCAP PRO directly onto your Windows 10 system with standard MP4 recording support.
              </p>
            </div>
            {isInstallable && (
              <button
                onClick={async () => {
                  const res = await promptInstall();
                  if (res) onClose();
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-xl flex items-center space-x-2 transition shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Install App Now</span>
              </button>
            )}
          </div>

          {!isInstallable && !isInstalled && (
            <div className="bg-[#020617]/80 p-3 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-2">
              <div className="font-bold text-blue-300 flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Installation Guide for Windows 10 (Edge / Chrome / Brave):</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400 leading-relaxed">
                <li>Click the <strong>"Open in New Tab"</strong> button in the top header bar.</li>
                <li>In Chrome or Microsoft Edge, click the <strong>Install Icon</strong> in the browser URL address bar (or menu ➔ <em>Apps</em> ➔ <em>Install LENNSCAP PRO</em>).</li>
                <li>Confirm install to create a Windows 10 Start Menu shortcut and Desktop app launcher.</li>
              </ol>
            </div>
          )}

          {isInstalled && (
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold pt-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Application is currently installed and running as a native Windows 10 Desktop App!</span>
            </div>
          )}
        </div>

        {/* Feature Highlights List */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Windows 10 Desktop Capabilities
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Saves recordings directly in MP4 format</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Hardware-accelerated H.264 video rendering</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Custom drag crop region screen recorder</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Built-in MP4 Video Editor & Audio studio</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition uppercase tracking-wider"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
