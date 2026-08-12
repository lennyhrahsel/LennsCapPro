import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Square,
  Clock,
  ExternalLink,
  Minimize2,
  Maximize2,
  Radio,
  Volume2,
  VolumeX,
  Timer,
  HardDrive,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { formatTime, formatFileSize } from '../utils/formatters';

interface FloatingControlPanelProps {
  isRecording: boolean;
  isPaused: boolean;
  countdown: number | null;
  elapsedTime: number;
  recordedBytes: number;
  audioLevel: number;
  countdownDelay: number;
  setCountdownDelay: (delay: number) => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  audioSource: string;
}

export const FloatingControlPanel: React.FC<FloatingControlPanelProps> = ({
  isRecording,
  isPaused,
  countdown,
  elapsedTime,
  recordedBytes,
  audioLevel,
  countdownDelay,
  setCountdownDelay,
  onStart,
  onPause,
  onResume,
  onStop,
  audioSource,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [autoHide, setAutoHide] = useState(false);
  const [isPiPActive, setIsPiPActive] = useState(false);

  // Auto-minimize when recording starts if autoHide is enabled
  useEffect(() => {
    if (isRecording && autoHide) {
      setIsMinimized(true);
    }
  }, [isRecording, autoHide]);

  // Document Picture in Picture support
  const openPictureInPicture = async () => {
    if ('documentPictureInPicture' in window) {
      try {
        const dpip = (window as unknown as { documentPictureInPicture: { requestWindow: (opts: { width: number; height: number }) => Promise<Window> } }).documentPictureInPicture;
        const pipWindow = await dpip.requestWindow({
          width: 340,
          height: 180,
        });

        // Copy styles into PiP window
        [...document.styleSheets].forEach((styleSheet) => {
          try {
            if (styleSheet.href) {
              const link = document.createElement('link');
              link.rel = 'stylesheet';
              link.href = styleSheet.href;
              pipWindow.document.head.appendChild(link);
            } else if (styleSheet.cssRules) {
              const style = document.createElement('style');
              [...styleSheet.cssRules].forEach((rule) => {
                style.appendChild(document.createTextNode(rule.cssText));
              });
              pipWindow.document.head.appendChild(style);
            }
          } catch (e) {
            console.warn('Style copy error to PiP:', e);
          }
        });

        const container = pipWindow.document.createElement('div');
        container.className = 'bg-slate-950 text-white p-4 font-sans h-full flex flex-col justify-between';
        container.innerHTML = `
          <div class="flex items-center justify-between text-xs font-semibold text-red-400">
            <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Screen Recorder Studio</span>
            <span class="font-mono text-slate-300" id="pip-timer">00:00</span>
          </div>
          <div class="text-center py-2">
            <span class="text-3xl font-mono font-bold tracking-wider text-white" id="pip-big-timer">00:00:00</span>
          </div>
          <div class="flex justify-center gap-2">
            <button id="pip-btn-stop" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg shadow">Stop Recording</button>
          </div>
        `;
        pipWindow.document.body.appendChild(container);
        setIsPiPActive(true);

        const stopBtn = pipWindow.document.getElementById('pip-btn-stop');
        if (stopBtn) {
          stopBtn.onclick = () => {
            onStop();
            pipWindow.close();
          };
        }

        pipWindow.onpagehide = () => {
          setIsPiPActive(false);
        };
      } catch (err) {
        console.warn('DPIP failed or not supported:', err);
      }
    } else {
      alert('Document Picture-in-Picture is not supported in this browser. You can minimize or drag this control panel to an adjacent window.');
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 transition-all duration-300">
      {/* Countdown overlay banner */}
      {countdown !== null && (
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-red-600 text-white text-2xl font-black px-6 py-2 rounded-2xl shadow-2xl animate-bounce border-2 border-red-400 flex items-center gap-2">
          <Timer className="w-6 h-6 animate-spin" />
          <span>Starting in {countdown}s...</span>
        </div>
      )}

      {/* Minimized Floating Pill Bar */}
      {isMinimized ? (
        <div className="bg-[#0F172A]/95 border border-[#1F2937] rounded-full px-4 py-2 shadow-2xl backdrop-blur-xl flex items-center space-x-3 text-slate-100">
          <div className="flex items-center space-x-2">
            <span
              className={`w-3 h-3 rounded-full ${
                isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-600'
              }`}
            />
            <span className="font-mono text-xs font-bold text-slate-100">
              {formatTime(elapsedTime, true)}
            </span>
          </div>

          {isRecording ? (
            <div className="flex items-center space-x-1.5 border-l border-[#1F2937] pl-2">
              {isPaused ? (
                <button
                  onClick={onResume}
                  className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition"
                  title="Resume Recording"
                >
                  <Play className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={onPause}
                  className="p-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-full transition"
                  title="Pause Recording"
                >
                  <Pause className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={onStop}
                className="p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-full transition shadow-[0_0_10px_rgba(220,38,38,0.4)]"
                title="Stop Recording"
              >
                <Square className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onStart}
              className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition"
              title="Start Recording"
            >
              <Radio className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => setIsMinimized(false)}
            className="p-1 text-slate-400 hover:text-slate-100 transition border-l border-[#1F2937] pl-2"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        /* Full Floating Armed Control Deck */
        <div className="w-80 sm:w-96 bg-[#0F172A]/95 border border-[#1F2937] rounded-2xl p-5 shadow-2xl backdrop-blur-2xl text-slate-100">
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-[#1F2937]">
            <div className="flex items-center space-x-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isRecording ? 'bg-red-500 animate-ping' : 'bg-blue-500'
                }`}
              />
              <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
                {isRecording ? (isPaused ? 'Recording Paused' : 'Live Recording') : 'Control Center'}
              </span>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                onClick={openPictureInPicture}
                className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-[#1E293B] rounded-lg transition"
                title="Pop-out Floating Window (PiP)"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-[#1E293B] rounded-lg transition"
                title="Minimize Control Bar"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Big Armed Timer Display */}
          <div className="py-4 text-center">
            <div className="text-4xl sm:text-5xl font-mono font-extrabold tracking-widest text-white">
              {formatTime(elapsedTime, true)}
            </div>

            <div className="flex items-center justify-center space-x-4 mt-2 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1 font-semibold">
                <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                {formatFileSize(recordedBytes)}
              </span>
              <span className="flex items-center gap-1 font-semibold">
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                {audioLevel}% Peak
              </span>
            </div>
          </div>

          {/* Countdown & Auto-Hide Options */}
          {!isRecording && (
            <div className="mb-4 bg-[#020617] p-3 rounded-lg border border-[#1F2937] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <Timer className="w-3.5 h-3.5 text-blue-400" /> Countdown Delay
                </span>
                <div className="flex space-x-1">
                  {[0, 3, 5, 10].map((sec) => (
                    <button
                      key={sec}
                      onClick={() => setCountdownDelay(sec)}
                      className={`px-2 py-0.5 text-[10px] rounded font-mono font-bold ${
                        countdownDelay === sec
                          ? 'bg-blue-600 text-white'
                          : 'bg-[#1E293B] text-slate-400 hover:text-white'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-[#1F2937]">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <EyeOff className="w-3.5 h-3.5 text-blue-400" /> Auto-Minimize
                </span>
                <button
                  onClick={() => setAutoHide(!autoHide)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    autoHide ? 'bg-blue-600' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      autoHide ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Main Action Control Buttons */}
          <div className="flex items-center space-x-3">
            {!isRecording ? (
              <button
                onClick={onStart}
                className="w-full py-3 px-4 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.4)] flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
              >
                <div className="w-4 h-4 bg-white rounded-sm" />
                <span>Start Recording</span>
              </button>
            ) : (
              <>
                {isPaused ? (
                  <button
                    onClick={onResume}
                    className="flex-1 py-3 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center space-x-1.5 transition"
                  >
                    <Play className="w-4 h-4" />
                    <span>Resume</span>
                  </button>
                ) : (
                  <button
                    onClick={onPause}
                    className="flex-1 py-3 px-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center space-x-1.5 transition"
                  >
                    <Pause className="w-4 h-4" />
                    <span>Pause</span>
                  </button>
                )}

                <button
                  onClick={onStop}
                  className="flex-1 py-3 px-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.4)] flex items-center justify-center space-x-1.5 transition"
                >
                  <Square className="w-4 h-4" />
                  <span>Stop & Save</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
