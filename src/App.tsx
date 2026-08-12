import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ResolutionSelector } from './components/ResolutionSelector';
import { AudioSourceSelector } from './components/AudioSourceSelector';
import { CropRegionOverlay } from './components/CropRegionOverlay';
import { FloatingControlPanel } from './components/FloatingControlPanel';
import { AudioOnlyRecorder } from './components/AudioOnlyRecorder';
import { VideoEditor } from './components/VideoEditor';
import { RecordingsGallery } from './components/RecordingsGallery';
import { HotkeyGuideModal } from './components/HotkeyGuideModal';
import { WindowsInstallModal } from './components/WindowsInstallModal';

import { useMediaRecorder } from './hooks/useMediaRecorder';
import { usePwaInstall } from './hooks/usePwaInstall';
import {
  saveRecordingToDB,
  getAllRecordingsFromDB,
  deleteRecordingFromDB,
} from './utils/indexedDB';
import { RecordingItem } from './types';
import { formatTime } from './utils/formatters';
import { Video, Sparkles, Play, Monitor, Radio, Info, AlertTriangle, ExternalLink, ShieldCheck, Download } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'recorder' | 'audio-only' | 'editor' | 'gallery'>('recorder');
  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [selectedEditorItem, setSelectedEditorItem] = useState<RecordingItem | null>(null);
  const [isHotkeyModalOpen, setIsHotkeyModalOpen] = useState(false);
  const [isWinInstallModalOpen, setIsWinInstallModalOpen] = useState(false);

  const pwa = usePwaInstall();

  // Load recordings from IndexedDB on startup
  useEffect(() => {
    getAllRecordingsFromDB()
      .then((items) => setRecordings(items))
      .catch((e) => console.warn('Failed to load recordings from DB:', e));
  }, []);

  // Handle completed recording
  const handleRecordingComplete = useCallback(async (newItem: RecordingItem) => {
    setRecordings((prev) => [newItem, ...prev]);
    try {
      await saveRecordingToDB(newItem);
    } catch (e) {
      console.warn('Failed to save recording to IndexedDB:', e);
    }
  }, []);

  // Hook for Screen & Audio Recorder
  const recorder = useMediaRecorder({
    onRecordingComplete: handleRecordingComplete,
  });

  // Global Keyboard Hotkeys Listener (Alt+R to record, Alt+P to pause)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        if (recorder.isRecording) {
          recorder.stopRecording();
        } else {
          if (activeTab === 'audio-only') {
            recorder.startRecording('audio');
          } else {
            recorder.startRecording('video');
          }
        }
      } else if (e.altKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        if (recorder.isRecording) {
          if (recorder.isPaused) {
            recorder.resumeRecording();
          } else {
            recorder.pauseRecording();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [recorder, activeTab]);

  // Delete Recording
  const handleDeleteRecording = async (id: string) => {
    setRecordings((prev) => prev.filter((r) => r.id !== id));
    try {
      await deleteRecordingFromDB(id);
    } catch (e) {
      console.warn('Failed to delete from DB:', e);
    }
  };

  // Open clip in Video Editor
  const handleOpenInEditor = (item: RecordingItem) => {
    setSelectedEditorItem(item);
    setActiveTab('editor');
  };

  return (
    <div className="min-h-screen bg-[#0A0C10] text-[#E2E8F0] font-sans selection:bg-blue-600 selection:text-white flex flex-col justify-between">
      <div>
        {/* Main Header */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isRecording={recorder.isRecording}
          elapsedTimeFormatted={formatTime(recorder.elapsedTime)}
          onOpenHotkeyModal={() => setIsHotkeyModalOpen(true)}
          onOpenWindowsInstall={() => setIsWinInstallModalOpen(true)}
          recordingsCount={recordings.length}
        />

        {/* Content Views */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Iframe Permission / Capture Error Notice Banner */}
          {recorder.captureError && (
            <div className="bg-[#1E1B4B]/90 border border-indigo-500/40 rounded-xl p-4 shadow-2xl text-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start space-x-3">
                <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-lg shrink-0 mt-0.5 border border-indigo-500/30">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                    Screen Capture Notice
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    {recorder.captureError}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <button
                  onClick={() => window.open(window.location.href, '_blank')}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-lg transition inline-flex items-center justify-center gap-1.5 uppercase tracking-wider shadow-lg"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in New Tab</span>
                </button>
                <button
                  onClick={() => recorder.startPreview(true)}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-[#0F172A] hover:bg-slate-800 text-slate-200 font-bold text-xs rounded-lg border border-slate-700 transition inline-flex items-center justify-center gap-1.5 uppercase tracking-wider"
                >
                  <Play className="w-3.5 h-3.5 text-blue-400" />
                  <span>Use Virtual Demo Feed</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: Screen Recorder */}
          {activeTab === 'recorder' && (
            <div className="space-y-6">
              {/* Windows 10 64-bit & MP4 Status Bar */}
              <div className="bg-[#0F172A] border border-[#1F2937] rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center space-x-3 text-xs">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg font-bold font-mono">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Windows 10 64-bit Certified
                  </span>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-lg font-bold font-mono">
                    <Video className="w-3.5 h-3.5" />
                    MP4 (H.264 / AAC) Native Output
                  </span>
                </div>

                <button
                  onClick={() => setIsWinInstallModalOpen(true)}
                  className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-bold rounded-lg border border-blue-500/40 flex items-center gap-1.5 transition uppercase tracking-wider"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  <span>Install App on Windows 10</span>
                </button>
              </div>

              {/* Screen Preview & Controls */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols: Interactive Screen Preview & Crop Box */}
                <div className="lg:col-span-2 space-y-4">
                  {recorder.cropRegion.enabled ? (
                    <CropRegionOverlay
                      cropRegion={recorder.cropRegion}
                      setCropRegion={recorder.setCropRegion}
                      videoStream={recorder.displayStream}
                      stageWidth={recorder.customWidth}
                      stageHeight={recorder.customHeight}
                      onCustomSizeChange={(w, h) => {
                        recorder.setCustomWidth(w);
                        recorder.setCustomHeight(h);
                      }}
                    />
                  ) : (
                    /* Default Screen Preview Card */
                    <div className="bg-[#0F172A] border border-[#1F2937] rounded-xl p-4 shadow-2xl">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Monitor className="w-4 h-4 text-blue-400" />
                          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                            Live Screen Monitor Feed
                          </span>
                        </div>
                        {recorder.displayStream && (
                          <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[11px] rounded border border-emerald-500/20 font-mono font-bold">
                            Stream Active
                          </span>
                        )}
                      </div>

                      <div className="relative w-full aspect-video bg-[#020617] rounded-lg overflow-hidden border border-[#1F2937] flex items-center justify-center shadow-inner">
                        {recorder.displayStream ? (
                          <video
                            ref={(el) => {
                              if (el && recorder.displayStream) {
                                el.srcObject = recorder.displayStream;
                                el.play().catch((e) => console.log('Preview error:', e));
                              }
                            }}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="text-center p-6 space-y-4">
                            <div className="w-16 h-16 border-2 border-dashed border-blue-500/40 rounded-full mx-auto flex items-center justify-center bg-slate-900/40">
                              <Video className="w-7 h-7 text-blue-400" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-200">
                                Ready to Capture Screen
                              </h4>
                              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                                Capture your Monitor, Window, or Browser Tab with custom resolution & audio controls
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center justify-center gap-2">
                              <button
                                onClick={() => recorder.startPreview()}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition inline-flex items-center gap-1.5 uppercase tracking-wider shadow-md"
                              >
                                <Play className="w-3.5 h-3.5" />
                                <span>Capture Native Screen</span>
                              </button>
                              <button
                                onClick={() => window.open(window.location.href, '_blank')}
                                className="px-3.5 py-2 bg-[#1E293B] hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition inline-flex items-center gap-1.5 uppercase tracking-wider"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                                <span>Open in New Tab</span>
                              </button>
                              <button
                                onClick={() => recorder.startPreview(true)}
                                className="px-3.5 py-2 bg-[#1E293B] hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition inline-flex items-center gap-1.5 uppercase tracking-wider"
                              >
                                <span>Demo Feed</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Audio Capture Selector Card */}
                  <AudioSourceSelector
                    audioSource={recorder.audioSource}
                    setAudioSource={recorder.setAudioSource}
                    selectedMicId={recorder.selectedMicId}
                    setSelectedMicId={recorder.setSelectedMicId}
                    mics={recorder.mics}
                    audioLevel={recorder.audioLevel}
                    isRecording={recorder.isRecording}
                  />
                </div>

                {/* Right 1 Col: Video Quality & Resolution Settings */}
                <div className="space-y-6">
                  <ResolutionSelector
                    resolutionPreset={recorder.resolutionPreset}
                    setResolutionPreset={recorder.setResolutionPreset}
                    customWidth={recorder.customWidth}
                    setCustomWidth={recorder.setCustomWidth}
                    customHeight={recorder.customHeight}
                    setCustomHeight={recorder.setCustomHeight}
                    targetFps={recorder.targetFps}
                    setTargetFps={recorder.setTargetFps}
                    targetBitrate={recorder.targetBitrate}
                    setTargetBitrate={recorder.setTargetBitrate}
                    cropRegion={recorder.cropRegion}
                    setCropRegion={recorder.setCropRegion}
                    isRecording={recorder.isRecording}
                  />

                  {/* Recording Tips Box */}
                  <div className="bg-blue-600/5 border border-blue-500/20 rounded-xl p-4 text-xs text-slate-300 space-y-2">
                    <div className="flex items-center space-x-2 font-bold text-blue-400 uppercase tracking-wider text-[10px]">
                      <Info className="w-4 h-4 text-blue-400" />
                      <span>Invisible Control Panel Tip</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      To keep control buttons off your recorded video, use the <b>3s Countdown Delay</b>, or click the <b>Pop-out Picture-in-Picture window</b> button on the floating control panel!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Audio Only */}
          {activeTab === 'audio-only' && (
            <AudioOnlyRecorder
              isRecording={recorder.isRecording}
              isPaused={recorder.isPaused}
              countdown={recorder.countdown}
              elapsedTime={recorder.elapsedTime}
              recordedBytes={recorder.recordedBytes}
              audioLevel={recorder.audioLevel}
              audioSource={recorder.audioSource}
              setAudioSource={recorder.setAudioSource}
              selectedMicId={recorder.selectedMicId}
              setSelectedMicId={recorder.setSelectedMicId}
              mics={recorder.mics}
              onStartAudioOnly={() => recorder.startRecording('audio')}
              onPause={recorder.pauseRecording}
              onResume={recorder.resumeRecording}
              onStop={recorder.stopRecording}
            />
          )}

          {/* TAB 3: Video Editor */}
          {activeTab === 'editor' && (
            <VideoEditor
              selectedItem={selectedEditorItem}
              onSaveEditedItem={(editedItem) => {
                handleRecordingComplete(editedItem);
                setActiveTab('gallery');
              }}
              onCancel={() => setActiveTab('recorder')}
            />
          )}

          {/* TAB 4: Gallery */}
          {activeTab === 'gallery' && (
            <RecordingsGallery
              recordings={recordings}
              onDeleteRecording={handleDeleteRecording}
              onOpenInEditor={handleOpenInEditor}
            />
          )}
        </main>
      </div>

      {/* Always Visible Floating Control Panel */}
      <FloatingControlPanel
        isRecording={recorder.isRecording}
        isPaused={recorder.isPaused}
        countdown={recorder.countdown}
        elapsedTime={recorder.elapsedTime}
        recordedBytes={recorder.recordedBytes}
        audioLevel={recorder.audioLevel}
        countdownDelay={recorder.countdownDelay}
        setCountdownDelay={recorder.setCountdownDelay}
        onStart={() => {
          if (activeTab === 'audio-only') {
            recorder.startRecording('audio');
          } else {
            recorder.startRecording('video');
          }
        }}
        onPause={recorder.pauseRecording}
        onResume={recorder.resumeRecording}
        onStop={recorder.stopRecording}
        audioSource={recorder.audioSource}
      />

      {/* Hotkey Guide Modal */}
      <HotkeyGuideModal
        isOpen={isHotkeyModalOpen}
        onClose={() => setIsHotkeyModalOpen(false)}
      />

      {/* Windows 10 Installer Modal */}
      <WindowsInstallModal
        isOpen={isWinInstallModalOpen}
        onClose={() => setIsWinInstallModalOpen(false)}
        isInstallable={pwa.isInstallable}
        isInstalled={pwa.isInstalled}
        promptInstall={pwa.promptInstall}
        isWindows10={pwa.isWindows10}
      />

      {/* Footer */}
      <footer className="border-t border-[#1F2937] bg-[#0F172A] py-3 text-center text-[11px] text-slate-500 font-medium uppercase tracking-widest">
        LENNSCAP PRO • HD Screen & Audio Engine
      </footer>
    </div>
  );
}
