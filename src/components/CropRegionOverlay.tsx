import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CropRegion } from '../types';
import { Crop, Move, Maximize2, RotateCcw, Monitor, Sliders } from 'lucide-react';

interface CropRegionOverlayProps {
  cropRegion: CropRegion;
  setCropRegion: React.Dispatch<React.SetStateAction<CropRegion>>;
  videoStream: MediaStream | null;
  stageWidth?: number;
  stageHeight?: number;
  onCustomSizeChange?: (width: number, height: number) => void;
}

export const CropRegionOverlay: React.FC<CropRegionOverlayProps> = ({
  cropRegion,
  setCropRegion,
  videoStream,
  stageWidth = 1920,
  stageHeight = 1080,
  onCustomSizeChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Dynamic stage resolution based on active stream or fallback
  const [streamDim, setStreamDim] = useState<{ width: number; height: number }>({
    width: stageWidth,
    height: stageHeight,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [activeHandle, setActiveHandle] = useState<string | null>(null);

  const dragStartRef = useRef<{
    clientX: number;
    clientY: number;
    cropX: number;
    cropY: number;
    cropW: number;
    cropH: number;
  }>({
    clientX: 0,
    clientY: 0,
    cropX: 0,
    cropY: 0,
    cropW: 1920,
    cropH: 1080,
  });

  // Attach live video feed
  useEffect(() => {
    if (videoRef.current && videoStream) {
      videoRef.current.srcObject = videoStream;
      videoRef.current.play().catch((e) => console.log('Video play error:', e));

      // Try reading actual stream track settings
      const videoTrack = videoStream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        if (settings.width && settings.height) {
          setStreamDim({ width: settings.width, height: settings.height });
        }
      }
    }
  }, [videoStream]);

  const effectiveStageWidth = streamDim.width || stageWidth || 1920;
  const effectiveStageHeight = streamDim.height || stageHeight || 1080;

  // Handle Drag / Resize Pointer Start
  const handleStart = (
    clientX: number,
    clientY: number,
    handle: string | null,
    e: React.MouseEvent | React.TouchEvent
  ) => {
    e.stopPropagation();
    if (e.cancelable) e.preventDefault();

    setIsDragging(true);
    setActiveHandle(handle);

    // If crop box is currently larger than stage, normalize it first
    const curW = Math.min(effectiveStageWidth, cropRegion.width || effectiveStageWidth);
    const curH = Math.min(effectiveStageHeight, cropRegion.height || effectiveStageHeight);
    const curX = Math.max(0, Math.min(effectiveStageWidth - curW, cropRegion.x));
    const curY = Math.max(0, Math.min(effectiveStageHeight - curH, cropRegion.y));

    dragStartRef.current = {
      clientX,
      clientY,
      cropX: curX,
      cropY: curY,
      cropW: curW,
      cropH: curH,
    };
  };

  const handlePointerMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const dx = clientX - dragStartRef.current.clientX;
      const dy = clientY - dragStartRef.current.clientY;

      const scaleX = effectiveStageWidth / rect.width;
      const scaleY = effectiveStageHeight / rect.height;

      const deltaX = dx * scaleX;
      const deltaY = dy * scaleY;

      const { cropX, cropY, cropW, cropH } = dragStartRef.current;

      if (!activeHandle) {
        // Dragging entire crop box
        let newX = cropX + deltaX;
        let newY = cropY + deltaY;

        // Keep inside stage boundaries
        newX = Math.max(0, Math.min(effectiveStageWidth - cropW, newX));
        newY = Math.max(0, Math.min(effectiveStageHeight - cropH, newY));

        setCropRegion((prev) => ({
          ...prev,
          x: Math.round(newX),
          y: Math.round(newY),
        }));
      } else {
        // Resizing handles (nw, ne, sw, se, n, s, w, e)
        let nextX = cropX;
        let nextY = cropY;
        let nextW = cropW;
        let nextH = cropH;

        const MIN_SIZE = 120;

        if (activeHandle.includes('e')) {
          nextW = Math.max(MIN_SIZE, Math.min(effectiveStageWidth - cropX, cropW + deltaX));
        }
        if (activeHandle.includes('s')) {
          nextH = Math.max(MIN_SIZE, Math.min(effectiveStageHeight - cropY, cropH + deltaY));
        }
        if (activeHandle.includes('w')) {
          const maxW = cropX + cropW;
          const proposedW = Math.max(MIN_SIZE, cropW - deltaX);
          nextX = Math.max(0, maxW - proposedW);
          nextW = maxW - nextX;
        }
        if (activeHandle.includes('n')) {
          const maxH = cropY + cropH;
          const proposedH = Math.max(MIN_SIZE, cropH - deltaY);
          nextY = Math.max(0, maxH - proposedH);
          nextH = maxH - nextY;
        }

        const roundedW = Math.round(nextW);
        const roundedH = Math.round(nextH);

        setCropRegion((prev) => ({
          ...prev,
          x: Math.round(nextX),
          y: Math.round(nextY),
          width: roundedW,
          height: roundedH,
        }));

        if (onCustomSizeChange) {
          onCustomSizeChange(roundedW, roundedH);
        }
      }
    },
    [
      isDragging,
      activeHandle,
      effectiveStageWidth,
      effectiveStageHeight,
      setCropRegion,
      onCustomSizeChange,
    ]
  );

  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => {
      handlePointerMove(e.clientX, e.clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onPointerUp = () => {
      setIsDragging(false);
      setActiveHandle(null);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onPointerUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onPointerUp);
    };
  }, [isDragging, handlePointerMove]);

  // Normalize box bounds for display
  const displayW = Math.min(effectiveStageWidth, cropRegion.width || effectiveStageWidth);
  const displayH = Math.min(effectiveStageHeight, cropRegion.height || effectiveStageHeight);
  const displayX = Math.max(0, Math.min(effectiveStageWidth - displayW, cropRegion.x || 0));
  const displayY = Math.max(0, Math.min(effectiveStageHeight - displayH, cropRegion.y || 0));

  const leftPct = (displayX / effectiveStageWidth) * 100;
  const topPct = (displayY / effectiveStageHeight) * 100;
  const widthPct = (displayW / effectiveStageWidth) * 100;
  const heightPct = (displayH / effectiveStageHeight) * 100;

  // Preset aspect ratio quick functions
  const setPresetRatio = (aspectWidth: number, aspectHeight: number) => {
    let targetW = effectiveStageWidth;
    let targetH = Math.round((targetW * aspectHeight) / aspectWidth);

    if (targetH > effectiveStageHeight) {
      targetH = effectiveStageHeight;
      targetW = Math.round((targetH * aspectWidth) / aspectHeight);
    }

    const startX = Math.round((effectiveStageWidth - targetW) / 2);
    const startY = Math.round((effectiveStageHeight - targetH) / 2);

    setCropRegion({
      x: startX,
      y: startY,
      width: targetW,
      height: targetH,
      enabled: true,
    });

    if (onCustomSizeChange) {
      onCustomSizeChange(targetW, targetH);
    }
  };

  return (
    <div className="bg-[#0F172A] border border-[#1F2937] rounded-xl p-4 text-slate-200 shadow-2xl space-y-3">
      {/* Stage Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
            <Crop className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <span>Custom Drag Screen Size Stage</span>
              <span className="px-1.5 py-0.2 bg-blue-500/20 text-blue-300 rounded text-[9px] font-mono">
                {effectiveStageWidth} × {effectiveStageHeight} Stage
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Drag the blue rectangle or corners to crop your target screen area
            </p>
          </div>
        </div>

        {/* Quick Aspect Ratio Selector Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setPresetRatio(16, 9)}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded border border-slate-700 transition"
          >
            16:9 HD
          </button>
          <button
            type="button"
            onClick={() => setPresetRatio(4, 3)}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded border border-slate-700 transition"
          >
            4:3 SD
          </button>
          <button
            type="button"
            onClick={() => setPresetRatio(1, 1)}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded border border-slate-700 transition"
          >
            1:1 Square
          </button>
          <button
            type="button"
            onClick={() => setPresetRatio(9, 16)}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded border border-slate-700 transition"
          >
            9:16 Shorts
          </button>
          <button
            type="button"
            onClick={() => {
              setCropRegion({
                x: 0,
                y: 0,
                width: effectiveStageWidth,
                height: effectiveStageHeight,
                enabled: true,
              });
              if (onCustomSizeChange) {
                onCustomSizeChange(effectiveStageWidth, effectiveStageHeight);
              }
            }}
            className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-[10px] font-bold rounded border border-blue-500/40 flex items-center gap-1 transition"
          >
            <RotateCcw className="w-3 h-3" /> Full Screen
          </button>
        </div>
      </div>

      {/* Interactive Canvas Drag Stage */}
      <div
        ref={containerRef}
        className="relative w-full aspect-video bg-[#020617] rounded-lg overflow-hidden border border-[#1F2937] select-none shadow-inner group"
      >
        {/* Live video feed preview */}
        {videoStream ? (
          <video
            ref={videoRef}
            onLoadedMetadata={(e) => {
              const target = e.currentTarget;
              if (target.videoWidth && target.videoHeight) {
                setStreamDim({ width: target.videoWidth, height: target.videoHeight });
              }
            }}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-contain pointer-events-none opacity-85"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 space-y-2 p-4">
            <Maximize2 className="w-8 h-8 opacity-40 text-blue-400" />
            <span className="text-xs text-slate-400 font-medium text-center">
              Start Screen Capture or Demo Feed to view live crop feed. Drag the blue box anytime.
            </span>
          </div>
        )}

        {/* Dimming overlay outside crop box */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Top dim */}
          <div
            className="absolute left-0 top-0 right-0 bg-black/65 backdrop-blur-[1px]"
            style={{ height: `${topPct}%` }}
          />
          {/* Bottom dim */}
          <div
            className="absolute left-0 right-0 bottom-0 bg-black/65 backdrop-blur-[1px]"
            style={{ top: `${topPct + heightPct}%` }}
          />
          {/* Left dim */}
          <div
            className="absolute left-0 bg-black/65 backdrop-blur-[1px]"
            style={{
              top: `${topPct}%`,
              height: `${heightPct}%`,
              width: `${leftPct}%`,
            }}
          />
          {/* Right dim */}
          <div
            className="absolute right-0 bg-black/65 backdrop-blur-[1px]"
            style={{
              top: `${topPct}%`,
              height: `${heightPct}%`,
              left: `${leftPct + widthPct}%`,
            }}
          />
        </div>

        {/* Draggable & Resizable Crop Box */}
        <div
          onMouseDown={(e) => handleStart(e.clientX, e.clientY, null, e)}
          onTouchStart={(e) =>
            e.touches.length > 0 &&
            handleStart(e.touches[0].clientX, e.touches[0].clientY, null, e)
          }
          className={`absolute border-2 border-blue-400 bg-blue-500/15 cursor-move shadow-2xl flex flex-col justify-between p-2 transition-shadow ${
            isDragging ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-black/50' : ''
          }`}
          style={{
            left: `${leftPct}%`,
            top: `${topPct}%`,
            width: `${widthPct}%`,
            height: `${heightPct}%`,
          }}
        >
          {/* Dimensions Badge */}
          <div className="bg-[#020617]/90 border border-blue-500/50 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-blue-300 self-start shadow-lg flex items-center gap-1.5 pointer-events-none">
            <Move className="w-3 h-3 text-blue-400" />
            <span>
              {displayW} × {displayH} px
            </span>
          </div>

          {/* Rule of Thirds Grid lines */}
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
            <div className="border-r border-b border-blue-400/40" />
            <div className="border-r border-b border-blue-400/40" />
            <div className="border-b border-blue-400/40" />
            <div className="border-r border-b border-blue-400/40" />
            <div className="border-r border-b border-blue-400/40" />
            <div className="border-b border-blue-400/40" />
          </div>

          {/* 8 Resize Handles (Corners & Midpoints) */}
          {/* Top-Left NW */}
          <div
            onMouseDown={(e) => handleStart(e.clientX, e.clientY, 'nw', e)}
            onTouchStart={(e) =>
              e.touches.length > 0 &&
              handleStart(e.touches[0].clientX, e.touches[0].clientY, 'nw', e)
            }
            className="absolute -top-2 -left-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-nwse-resize shadow-md hover:scale-125 transition-transform"
          />
          {/* Top-Right NE */}
          <div
            onMouseDown={(e) => handleStart(e.clientX, e.clientY, 'ne', e)}
            onTouchStart={(e) =>
              e.touches.length > 0 &&
              handleStart(e.touches[0].clientX, e.touches[0].clientY, 'ne', e)
            }
            className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-nesw-resize shadow-md hover:scale-125 transition-transform"
          />
          {/* Bottom-Left SW */}
          <div
            onMouseDown={(e) => handleStart(e.clientX, e.clientY, 'sw', e)}
            onTouchStart={(e) =>
              e.touches.length > 0 &&
              handleStart(e.touches[0].clientX, e.touches[0].clientY, 'sw', e)
            }
            className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-nesw-resize shadow-md hover:scale-125 transition-transform"
          />
          {/* Bottom-Right SE */}
          <div
            onMouseDown={(e) => handleStart(e.clientX, e.clientY, 'se', e)}
            onTouchStart={(e) =>
              e.touches.length > 0 &&
              handleStart(e.touches[0].clientX, e.touches[0].clientY, 'se', e)
            }
            className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-nwse-resize shadow-md hover:scale-125 transition-transform"
          />
          {/* Top North */}
          <div
            onMouseDown={(e) => handleStart(e.clientX, e.clientY, 'n', e)}
            onTouchStart={(e) =>
              e.touches.length > 0 &&
              handleStart(e.touches[0].clientX, e.touches[0].clientY, 'n', e)
            }
            className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-2.5 bg-blue-400 border border-white rounded-full cursor-ns-resize shadow hover:scale-110 transition-transform"
          />
          {/* Bottom South */}
          <div
            onMouseDown={(e) => handleStart(e.clientX, e.clientY, 's', e)}
            onTouchStart={(e) =>
              e.touches.length > 0 &&
              handleStart(e.touches[0].clientX, e.touches[0].clientY, 's', e)
            }
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-2.5 bg-blue-400 border border-white rounded-full cursor-ns-resize shadow hover:scale-110 transition-transform"
          />
          {/* Left West */}
          <div
            onMouseDown={(e) => handleStart(e.clientX, e.clientY, 'w', e)}
            onTouchStart={(e) =>
              e.touches.length > 0 &&
              handleStart(e.touches[0].clientX, e.touches[0].clientY, 'w', e)
            }
            className="absolute top-1/2 -translate-y-1/2 -left-2 w-2.5 h-6 bg-blue-400 border border-white rounded-full cursor-ew-resize shadow hover:scale-110 transition-transform"
          />
          {/* Right East */}
          <div
            onMouseDown={(e) => handleStart(e.clientX, e.clientY, 'e', e)}
            onTouchStart={(e) =>
              e.touches.length > 0 &&
              handleStart(e.touches[0].clientX, e.touches[0].clientY, 'e', e)
            }
            className="absolute top-1/2 -translate-y-1/2 -right-2 w-2.5 h-6 bg-blue-400 border border-white rounded-full cursor-ew-resize shadow hover:scale-110 transition-transform"
          />
        </div>
      </div>
    </div>
  );
};
