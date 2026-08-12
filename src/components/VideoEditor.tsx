import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Film,
  Scissors,
  RotateCw,
  Sliders,
  Type,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Download,
  Sparkles,
  Crop,
  Check,
  RefreshCw,
  FastForward,
  Eye,
  X,
  Plus,
} from 'lucide-react';
import { RecordingItem, VideoEditorState } from '../types';
import { formatTime, formatFileSize } from '../utils/formatters';

interface VideoEditorProps {
  selectedItem: RecordingItem | null;
  onSaveEditedItem: (item: RecordingItem) => void;
  onCancel: () => void;
}

export const VideoEditor: React.FC<VideoEditorProps> = ({
  selectedItem,
  onSaveEditedItem,
  onCancel,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // Active Tool Tab in Editor
  const [activeSubTab, setActiveSubTab] = useState<'trim' | 'filters' | 'watermark' | 'audio'>('trim');

  // Video Editor State
  const [editorState, setEditorState] = useState<VideoEditorState>({
    startTime: 0,
    endTime: 0,
    currentTime: 0,
    volume: 1,
    playbackRate: 1,
    rotation: 0,
    flipHorizontal: false,
    filters: {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      grayscale: 0,
      sepia: 0,
      blur: 0,
    },
    textOverlay: {
      text: 'LENNSCAP PRO',
      fontSize: 28,
      color: '#ffffff',
      position: 'bottom-right',
      opacity: 0.9,
      enabled: false,
    },
    exportFormat: 'webm',
    exportQuality: 'high',
  });

  // Load video metadata
  useEffect(() => {
    if (selectedItem && videoRef.current) {
      const video = videoRef.current;
      video.src = selectedItem.url;
      video.onloadedmetadata = () => {
        const dur = video.duration || selectedItem.duration || 10;
        setDuration(dur);
        setEditorState((prev) => ({
          ...prev,
          startTime: 0,
          endTime: dur,
          currentTime: 0,
        }));
      };
    }
  }, [selectedItem]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      if (videoRef.current.currentTime >= editorState.endTime) {
        videoRef.current.currentTime = editorState.startTime;
      }
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  // Video Time Update listener
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const curr = videoRef.current.currentTime;
    setEditorState((prev) => ({ ...prev, currentTime: curr }));

    // Auto-loop within trim start/end boundaries
    if (curr >= editorState.endTime) {
      videoRef.current.currentTime = editorState.startTime;
      if (!isPlaying) {
        videoRef.current.pause();
      }
    }
  };

  // Apply playback rate & volume to preview video
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = editorState.playbackRate;
      videoRef.current.volume = editorState.volume;
    }
  }, [editorState.playbackRate, editorState.volume]);

  // Generate CSS Filter String
  const getFilterStyle = useCallback(() => {
    const { brightness, contrast, saturation, grayscale, sepia, blur } = editorState.filters;
    return `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) grayscale(${grayscale}%) sepia(${sepia}%) blur(${blur}px)`;
  }, [editorState.filters]);

  // Render Frame onto Canvas with Watermark & Filters
  const drawCanvasOverlay = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    ctx.save();
    ctx.filter = getFilterStyle();

    // Rotation & Flipping
    if (editorState.rotation !== 0 || editorState.flipHorizontal) {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      if (editorState.rotation !== 0) {
        ctx.rotate((editorState.rotation * Math.PI) / 180);
      }
      if (editorState.flipHorizontal) {
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
    } else {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    ctx.restore();

    // Text Overlay / Watermark
    if (editorState.textOverlay.enabled && editorState.textOverlay.text.trim()) {
      const { text, fontSize, color, position, opacity } = editorState.textOverlay;
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.fillStyle = color;

      const padding = 24;
      const textWidth = ctx.measureText(text).width;
      let x = padding;
      let y = padding + fontSize;

      if (position === 'top-right') {
        x = canvas.width - textWidth - padding;
      } else if (position === 'bottom-left') {
        y = canvas.height - padding;
      } else if (position === 'bottom-right') {
        x = canvas.width - textWidth - padding;
        y = canvas.height - padding;
      } else if (position === 'center') {
        x = (canvas.width - textWidth) / 2;
        y = (canvas.height + fontSize) / 2;
      }

      // Subtle shadow behind text
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 6;
      ctx.fillText(text, x, y);
      ctx.restore();
    }
  }, [getFilterStyle, editorState.rotation, editorState.flipHorizontal, editorState.textOverlay]);

  // Render overlay continuously
  useEffect(() => {
    let animId: number;
    const loop = () => {
      drawCanvasOverlay();
      animId = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(animId);
  }, [drawCanvasOverlay]);

  // Export Edited Video via Canvas Capture Stream
  const handleExportEditedVideo = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !selectedItem) return;

    setIsExporting(true);
    setExportProgress(0);

    video.pause();
    setIsPlaying(false);

    video.currentTime = editorState.startTime;

    const stream = canvas.captureStream(30);
    const chunks: Blob[] = [];

    const exportMime = [
      'video/mp4;codecs=avc1,mp4a.40.2',
      'video/mp4;codecs=avc1',
      'video/mp4',
      'video/webm;codecs=h264',
      'video/webm',
    ].find((t) => MediaRecorder.isTypeSupported(t)) || 'video/webm';

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: exportMime,
      videoBitsPerSecond: 8000000,
      audioBitsPerSecond: 320000,
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const editedBlob = new Blob(chunks, { type: 'video/mp4' });
      const editedUrl = URL.createObjectURL(editedBlob);
      const editedDuration = editorState.endTime - editorState.startTime;

      const editedItem: RecordingItem = {
        ...selectedItem,
        id: `edited_${Date.now()}`,
        title: `${selectedItem.title} (Edited)`,
        blob: editedBlob,
        url: editedUrl,
        duration: editedDuration,
        fileSize: editedBlob.size,
        createdAt: Date.now(),
      };

      setIsExporting(false);
      onSaveEditedItem(editedItem);
    };

    mediaRecorder.start(500);

    // Play segment and track progress
    video.play();
    const trimDuration = editorState.endTime - editorState.startTime;

    const checkProgress = setInterval(() => {
      const elapsed = video.currentTime - editorState.startTime;
      const pct = Math.min(100, Math.round((elapsed / trimDuration) * 100));
      setExportProgress(pct);

      if (video.currentTime >= editorState.endTime || video.ended) {
        clearInterval(checkProgress);
        video.pause();
        mediaRecorder.stop();
      }
    }, 200);
  };

  if (!selectedItem) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 space-y-4 max-w-2xl mx-auto my-8">
        <Film className="w-12 h-12 mx-auto text-indigo-400 opacity-60" />
        <h3 className="text-lg font-bold text-slate-200">No Video Selected for Editing</h3>
        <p className="text-xs text-slate-400">
          Record a screen video or select a saved clip from the Gallery to open it in the Video Editor.
        </p>
        <button
          onClick={onCancel}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl shadow transition"
        >
          Go to Screen Recorder
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-slate-100">
      {/* Top Title & Save Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0F172A] border border-[#1F2937] rounded-xl p-4 shadow-2xl">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">Video Editor Studio</h2>
            <p className="text-xs text-slate-400">
              {selectedItem.title} • {formatTime(duration)}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={onCancel}
            className="flex-1 sm:flex-initial px-4 py-2 bg-[#1E293B] hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg border border-slate-700 transition uppercase tracking-wider"
          >
            Cancel
          </button>
          <button
            disabled={isExporting}
            onClick={handleExportEditedVideo}
            className="flex-1 sm:flex-initial px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg flex items-center justify-center space-x-1.5 transition"
          >
            {isExporting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{isExporting ? `Exporting ${exportProgress}%` : 'Export Edited Clip'}</span>
          </button>
        </div>
      </div>

      {/* Main Studio Canvas Preview */}
      <div className="bg-[#0F172A] border border-[#1F2937] rounded-xl p-4 sm:p-5 shadow-2xl space-y-4">
        <div className="relative w-full aspect-video bg-[#020617] rounded-lg overflow-hidden border border-[#1F2937] shadow-2xl flex items-center justify-center">
          {/* Hidden Video element used as render source */}
          <video
            ref={videoRef}
            onTimeUpdate={handleTimeUpdate}
            playsInline
            className="hidden"
          />

          {/* Canvas Render Display with Filters & Watermark */}
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain cursor-pointer"
            onClick={togglePlay}
          />

          {/* Center Play/Pause Overlay button */}
          {!isPlaying && (
            <button
              onClick={togglePlay}
              className="absolute p-4 rounded-full bg-blue-600/90 text-white shadow-2xl hover:scale-110 transition border border-blue-400/40"
            >
              <Play className="w-8 h-8 fill-current ml-1" />
            </button>
          )}

          {/* Time Badge */}
          <div className="absolute bottom-3 left-3 bg-[#0F172A]/90 backdrop-blur px-3 py-1 rounded text-xs font-mono font-bold border border-slate-700 text-slate-200">
            {formatTime(editorState.currentTime, true)} / {formatTime(editorState.endTime)}
          </div>
        </div>

        {/* Precision Timeline Scrubber */}
        <div className="bg-[#1E293B] p-4 rounded-lg border border-slate-700/80 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono font-bold">
            <span className="text-blue-400 flex items-center gap-1">
              <Scissors className="w-3.5 h-3.5" /> Start: {formatTime(editorState.startTime, true)}
            </span>
            <span className="text-slate-400">
              Duration: {formatTime(editorState.endTime - editorState.startTime)}
            </span>
            <span className="text-purple-400 flex items-center gap-1">
              End: {formatTime(editorState.endTime, true)}
            </span>
          </div>

          {/* Dual Range Scrubber Slider */}
          <div className="relative py-2">
            <input
              type="range"
              min={0}
              max={duration || 10}
              step={0.05}
              value={editorState.currentTime}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (videoRef.current) videoRef.current.currentTime = val;
                setEditorState((prev) => ({ ...prev, currentTime: val }));
              }}
              className="w-full accent-blue-500 h-2 bg-[#020617] rounded-lg cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Trim Start Time (s)</label>
              <input
                type="number"
                min={0}
                max={editorState.endTime - 0.5}
                step={0.1}
                value={editorState.startTime.toFixed(1)}
                onChange={(e) =>
                  setEditorState((prev) => ({
                    ...prev,
                    startTime: Math.max(0, Number(e.target.value)),
                  }))
                }
                className="w-full bg-[#020617] border border-slate-700 rounded-md px-3 py-1.5 text-xs font-mono text-white"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Trim End Time (s)</label>
              <input
                type="number"
                min={editorState.startTime + 0.5}
                max={duration}
                step={0.1}
                value={editorState.endTime.toFixed(1)}
                onChange={(e) =>
                  setEditorState((prev) => ({
                    ...prev,
                    endTime: Math.min(duration, Number(e.target.value)),
                  }))
                }
                className="w-full bg-[#020617] border border-slate-700 rounded-md px-3 py-1.5 text-xs font-mono text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Editing Tools Tabs */}
      <div className="bg-[#0F172A] border border-[#1F2937] rounded-xl p-5 shadow-2xl space-y-5">
        <div className="flex border-b border-[#1F2937] pb-3 space-x-2">
          <button
            onClick={() => setActiveSubTab('trim')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
              activeSubTab === 'trim'
                ? 'bg-blue-600/20 border border-blue-500/50 text-blue-400 shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1E293B]'
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span>Trim & Speed</span>
          </button>

          <button
            onClick={() => setActiveSubTab('filters')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
              activeSubTab === 'filters'
                ? 'bg-blue-600/20 border border-blue-500/50 text-blue-400 shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1E293B]'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Filters & Colors</span>
          </button>

          <button
            onClick={() => setActiveSubTab('watermark')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
              activeSubTab === 'watermark'
                ? 'bg-blue-600/20 border border-blue-500/50 text-blue-400 shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1E293B]'
            }`}
          >
            <Type className="w-4 h-4" />
            <span>Text Watermark</span>
          </button>

          <button
            onClick={() => setActiveSubTab('audio')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
              activeSubTab === 'audio'
                ? 'bg-blue-600/20 border border-blue-500/50 text-blue-400 shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1E293B]'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>Audio Volume</span>
          </button>
        </div>

        {/* Tab 1: Trim & Speed */}
        {activeSubTab === 'trim' && (
          <div className="space-y-4">
            <label className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Playback Speed Multiplier
            </label>
            <div className="flex flex-wrap gap-2">
              {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                <button
                  key={rate}
                  onClick={() => setEditorState((prev) => ({ ...prev, playbackRate: rate }))}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold border transition ${
                    editorState.playbackRate === rate
                      ? 'bg-blue-600 text-white border-blue-500 shadow'
                      : 'bg-[#020617] border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {rate}x Speed
                </button>
              ))}
            </div>

            <div className="pt-2">
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-2 tracking-wider">
                Video Rotation & Flip
              </label>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() =>
                    setEditorState((prev) => ({
                      ...prev,
                      rotation: (prev.rotation + 90) % 360,
                    }))
                  }
                  className="px-4 py-2 bg-[#1E293B] hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 flex items-center gap-2 uppercase tracking-wider"
                >
                  <RotateCw className="w-4 h-4 text-blue-400" />
                  <span>Rotate 90° ({editorState.rotation}°)</span>
                </button>

                <button
                  onClick={() =>
                    setEditorState((prev) => ({
                      ...prev,
                      flipHorizontal: !prev.flipHorizontal,
                    }))
                  }
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border transition ${
                    editorState.flipHorizontal
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-[#1E293B] text-slate-300 border-slate-700'
                  }`}
                >
                  Flip Horizontal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Filters */}
        {activeSubTab === 'filters' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1 font-bold">
                <span className="uppercase tracking-wider text-[10px] text-slate-400">Brightness</span>
                <span className="font-mono text-blue-400">{editorState.filters.brightness}%</span>
              </div>
              <input
                type="range"
                min={50}
                max={150}
                value={editorState.filters.brightness}
                onChange={(e) =>
                  setEditorState((prev) => ({
                    ...prev,
                    filters: { ...prev.filters, brightness: Number(e.target.value) },
                  }))
                }
                className="w-full accent-blue-500 h-1.5 bg-[#020617] rounded-lg"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1 font-bold">
                <span className="uppercase tracking-wider text-[10px] text-slate-400">Contrast</span>
                <span className="font-mono text-blue-400">{editorState.filters.contrast}%</span>
              </div>
              <input
                type="range"
                min={50}
                max={150}
                value={editorState.filters.contrast}
                onChange={(e) =>
                  setEditorState((prev) => ({
                    ...prev,
                    filters: { ...prev.filters, contrast: Number(e.target.value) },
                  }))
                }
                className="w-full accent-blue-500 h-1.5 bg-[#020617] rounded-lg"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1 font-bold">
                <span className="uppercase tracking-wider text-[10px] text-slate-400">Saturation</span>
                <span className="font-mono text-blue-400">{editorState.filters.saturation}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={200}
                value={editorState.filters.saturation}
                onChange={(e) =>
                  setEditorState((prev) => ({
                    ...prev,
                    filters: { ...prev.filters, saturation: Number(e.target.value) },
                  }))
                }
                className="w-full accent-blue-500 h-1.5 bg-[#020617] rounded-lg"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1 font-bold">
                <span className="uppercase tracking-wider text-[10px] text-slate-400">Grayscale</span>
                <span className="font-mono text-blue-400">{editorState.filters.grayscale}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={editorState.filters.grayscale}
                onChange={(e) =>
                  setEditorState((prev) => ({
                    ...prev,
                    filters: { ...prev.filters, grayscale: Number(e.target.value) },
                  }))
                }
                className="w-full accent-blue-500 h-1.5 bg-[#020617] rounded-lg"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1 font-bold">
                <span className="uppercase tracking-wider text-[10px] text-slate-400">Sepia Filter</span>
                <span className="font-mono text-blue-400">{editorState.filters.sepia}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={editorState.filters.sepia}
                onChange={(e) =>
                  setEditorState((prev) => ({
                    ...prev,
                    filters: { ...prev.filters, sepia: Number(e.target.value) },
                  }))
                }
                className="w-full accent-blue-500 h-1.5 bg-[#020617] rounded-lg"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1 font-bold">
                <span className="uppercase tracking-wider text-[10px] text-slate-400">Blur Filter</span>
                <span className="font-mono text-blue-400">{editorState.filters.blur}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                value={editorState.filters.blur}
                onChange={(e) =>
                  setEditorState((prev) => ({
                    ...prev,
                    filters: { ...prev.filters, blur: Number(e.target.value) },
                  }))
                }
                className="w-full accent-blue-500 h-1.5 bg-[#020617] rounded-lg"
              />
            </div>
          </div>
        )}

        {/* Tab 3: Text Watermark */}
        {activeSubTab === 'watermark' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Enable Text Overlay / Watermark
              </span>
              <button
                onClick={() =>
                  setEditorState((prev) => ({
                    ...prev,
                    textOverlay: {
                      ...prev.textOverlay,
                      enabled: !prev.textOverlay.enabled,
                    },
                  }))
                }
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                  editorState.textOverlay.enabled ? 'bg-blue-600' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    editorState.textOverlay.enabled ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {editorState.textOverlay.enabled && (
              <div className="bg-[#1E293B] p-4 rounded-lg border border-slate-700/80 space-y-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Watermark Text</label>
                  <input
                    type="text"
                    value={editorState.textOverlay.text}
                    onChange={(e) =>
                      setEditorState((prev) => ({
                        ...prev,
                        textOverlay: { ...prev.textOverlay, text: e.target.value },
                      }))
                    }
                    placeholder="Enter custom watermark or title"
                    className="w-full bg-[#020617] border border-slate-700 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Position</label>
                    <select
                      value={editorState.textOverlay.position}
                      onChange={(e) =>
                        setEditorState((prev) => ({
                          ...prev,
                          textOverlay: {
                            ...prev.textOverlay,
                            position: e.target.value as VideoEditorState['textOverlay']['position'],
                          },
                        }))
                      }
                      className="w-full bg-[#020617] border border-slate-700 rounded-md px-3 py-1.5 text-xs text-white font-medium"
                    >
                      <option value="bottom-right">Bottom Right</option>
                      <option value="bottom-left">Bottom Left</option>
                      <option value="top-right">Top Right</option>
                      <option value="top-left">Top Left</option>
                      <option value="center">Center</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Font Size (px)</label>
                    <input
                      type="number"
                      min={12}
                      max={72}
                      value={editorState.textOverlay.fontSize}
                      onChange={(e) =>
                        setEditorState((prev) => ({
                          ...prev,
                          textOverlay: {
                            ...prev.textOverlay,
                            fontSize: Number(e.target.value),
                          },
                        }))
                      }
                      className="w-full bg-[#020617] border border-slate-700 rounded-md px-3 py-1.5 text-xs font-mono text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Text Color</label>
                    <input
                      type="color"
                      value={editorState.textOverlay.color}
                      onChange={(e) =>
                        setEditorState((prev) => ({
                          ...prev,
                          textOverlay: { ...prev.textOverlay, color: e.target.value },
                        }))
                      }
                      className="w-full h-8 bg-[#020617] border border-slate-700 rounded-md cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Audio Volume */}
        {activeSubTab === 'audio' && (
          <div className="space-y-3">
            <div className="flex justify-between text-xs text-slate-300 font-bold">
              <span className="flex items-center gap-1.5 uppercase tracking-wider text-[10px] text-slate-400">
                <Volume2 className="w-4 h-4 text-blue-400" /> Audio Gain Volume
              </span>
              <span className="font-mono text-blue-400">
                {Math.round(editorState.volume * 100)}%
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={2}
              step={0.05}
              value={editorState.volume}
              onChange={(e) =>
                setEditorState((prev) => ({ ...prev, volume: Number(e.target.value) }))
              }
              className="w-full accent-blue-500 h-2 bg-[#020617] rounded-lg cursor-pointer"
            />
          </div>
        )}
      </div>
    </div>
  );
};
