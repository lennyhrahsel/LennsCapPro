import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ResolutionPreset,
  AudioSourceType,
  CropRegion,
  RecordingItem,
  RecordingType,
} from '../types';
import { generateVideoThumbnail } from '../utils/formatters';

// Helper to create a synthetic animated HD screen stream when browser display-capture is disallowed inside embedded iFrames
function createDemoDisplayStream(width: number, height: number, fps: number): MediaStream {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  let angle = 0;
  let animId: number;

  const render = () => {
    angle += 0.03;

    // Studio canvas background
    ctx.fillStyle = '#090D16';
    ctx.fillRect(0, 0, width, height);

    // Subtle background grid
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1;
    const gridSize = 60;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Top window bar
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, width, 50);
    ctx.fillStyle = '#EF4444'; ctx.beginPath(); ctx.arc(20, 25, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#F59E0B'; ctx.beginPath(); ctx.arc(40, 25, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#10B981'; ctx.beginPath(); ctx.arc(60, 25, 6, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#94A3B8';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('Screen Recorder Studio - HD Virtual Live Stream Feed', 90, 31);

    // Dynamic wave graphic
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 0; x < width; x += 5) {
      const y = height / 2 + Math.sin(x * 0.01 + angle) * 70 + Math.cos(x * 0.02 - angle) * 35;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Bouncing cursor indicator
    const cx = (width / 2) + Math.cos(angle * 1.5) * (width * 0.3);
    const cy = (height / 2) + Math.sin(angle * 2) * (height * 0.25);
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fill();

    // Footer overlay status text
    ctx.fillStyle = '#64748B';
    ctx.font = '13px monospace';
    ctx.fillText(`DEMO SCREEN FEED ACTIVE • ${new Date().toLocaleTimeString()} • ${width}x${height} @ ${fps}FPS`, 30, height - 25);

    animId = requestAnimationFrame(render);
  };

  render();

  const stream = canvas.captureStream(fps);
  const track = stream.getVideoTracks()[0];
  const origStop = track.stop.bind(track);
  track.stop = () => {
    cancelAnimationFrame(animId);
    origStop();
  };

  return stream;
}

export interface UseMediaRecorderOptions {
  onRecordingComplete?: (item: RecordingItem) => void;
}

export function useMediaRecorder(options: UseMediaRecorderOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0); // in seconds
  const [recordedBytes, setRecordedBytes] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0); // 0 to 100 for visualizer
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [isIframeBlocked, setIsIframeBlocked] = useState<boolean>(false);

  // Configuration state
  const [resolutionPreset, setResolutionPreset] = useState<ResolutionPreset>('1080p');
  const [customWidth, setCustomWidth] = useState(1920);
  const [customHeight, setCustomHeight] = useState(1080);
  const [targetFps, setTargetFps] = useState(60);
  const [targetBitrate, setTargetBitrate] = useState(8000000); // 8 Mbps
  const [audioSource, setAudioSource] = useState<AudioSourceType>('both');
  const [selectedMicId, setSelectedMicId] = useState<string>('');
  const [mics, setMics] = useState<{ deviceId: string; label: string }[]>([]);
  const [countdownDelay, setCountdownDelay] = useState<number>(3); // 0, 3, 5, 10s
  const [cropRegion, setCropRegion] = useState<CropRegion>({
    x: 0,
    y: 0,
    width: 1920,
    height: 1080,
    enabled: false,
  });

  // Active stream preview & refs
  const [displayStream, setDisplayStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isRecordingRef = useRef<boolean>(false);

  // Audio Context refs for mixing & visualizer
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const displayStreamRef = useRef<MediaStream | null>(null);

  // Canvas ref for cropping/resolution rendering
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoElemRef = useRef<HTMLVideoElement | null>(null);

  // Enumerate audio input devices
  const refreshAudioDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices
        .filter((d) => d.kind === 'audioinput')
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone ${index + 1}`,
        }));
      setMics(audioInputs);
      if (audioInputs.length > 0 && !selectedMicId) {
        setSelectedMicId(audioInputs[0].deviceId);
      }
    } catch (e) {
      console.warn('Failed to enumerate audio devices:', e);
    }
  }, [selectedMicId]);

  useEffect(() => {
    refreshAudioDevices();
    navigator.mediaDevices.addEventListener?.('devicechange', refreshAudioDevices);
    return () => {
      navigator.mediaDevices.removeEventListener?.('devicechange', refreshAudioDevices);
    };
  }, [refreshAudioDevices]);

  // Resolution dimensions helper
  const getTargetDimensions = useCallback(() => {
    switch (resolutionPreset) {
      case '4k':
        return { width: 3840, height: 2160 };
      case '1080p':
        return { width: 1920, height: 1080 };
      case '720p':
        return { width: 1280, height: 720 };
      case '480p':
        return { width: 854, height: 480 };
      case 'custom':
        return { width: customWidth, height: customHeight };
      default:
        return { width: 1920, height: 1080 };
    }
  }, [resolutionPreset, customWidth, customHeight]);

  // Request display media stream preview
  const startPreview = useCallback(async (useDemoFallback = false) => {
    setCaptureError(null);
    const dim = getTargetDimensions();

    if (useDemoFallback) {
      const demoStream = createDemoDisplayStream(dim.width, dim.height, targetFps);
      displayStreamRef.current = demoStream;
      setDisplayStream(demoStream);
      return demoStream;
    }

    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        throw new Error('Screen capture API is not available in this browser context.');
      }

      const constraints: DisplayMediaStreamOptions = {
        video: {
          width: { ideal: dim.width },
          height: { ideal: dim.height },
          frameRate: { ideal: targetFps },
        },
        audio: audioSource === 'system' || audioSource === 'both',
      };

      const stream = await navigator.mediaDevices.getDisplayMedia(constraints);
      displayStreamRef.current = stream;
      setDisplayStream(stream);

      // Listen for stream end (user clicks browser "Stop Sharing" bar)
      stream.getVideoTracks()[0].onended = () => {
        stopRecording();
        setDisplayStream(null);
        displayStreamRef.current = null;
      };

      return stream;
    } catch (err: any) {
      console.warn('Error starting screen preview:', err);
      const isPolicyError =
        err?.name === 'NotAllowedError' ||
        err?.name === 'SecurityError' ||
        err?.message?.includes('display-capture') ||
        err?.message?.includes('permission') ||
        err?.message?.includes('disallowed');

      if (isPolicyError) {
        setIsIframeBlocked(true);
        setCaptureError(
          'Screen capture (getDisplayMedia) is restricted inside embedded iFrames by browser security policy. Please click "Open in New Tab" for native screen capture, or use the Demo Screen Feed.'
        );
      } else {
        setCaptureError(err?.message || 'Failed to start screen capture preview.');
      }
      throw err;
    }
  }, [getTargetDimensions, targetFps, audioSource]);

  const stopPreview = useCallback(() => {
    if (displayStreamRef.current) {
      displayStreamRef.current.getTracks().forEach((track) => track.stop());
      displayStreamRef.current = null;
      setDisplayStream(null);
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
  }, []);

  // Web Audio Mixing setup
  const setupAudioMixing = async (
    systemStream: MediaStream | null,
    recordingType: RecordingType = 'video'
  ): Promise<MediaStreamTrack | null> => {
    if (audioSource === 'none') return null;

    try {
      // Audio Context with 48 kHz HD Studio sampling
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx({ sampleRate: 48000 });
      audioContextRef.current = audioCtx;

      const destination = audioCtx.createMediaStreamDestination();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      let hasAudioTrack = false;

      // System audio track from displayMedia
      if ((audioSource === 'system' || audioSource === 'both') && systemStream) {
        const sysAudioTracks = systemStream.getAudioTracks();
        if (sysAudioTracks.length > 0) {
          const sysSource = audioCtx.createMediaStreamSource(new MediaStream([sysAudioTracks[0]]));
          const sysGain = audioCtx.createGain();
          sysGain.gain.value = 1.0;
          sysSource.connect(sysGain);
          sysGain.connect(destination);
          sysGain.connect(analyser);
          hasAudioTrack = true;
        }
      }

      // Mic audio track with HD Studio constraints from getUserMedia
      if (audioSource === 'mic' || audioSource === 'both') {
        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: selectedMicId ? { exact: selectedMicId } : undefined,
            echoCancellation: { ideal: true },
            noiseSuppression: { ideal: true },
            autoGainControl: { ideal: true },
            sampleRate: { ideal: 48000 },
            sampleSize: { ideal: 16 },
            channelCount: { ideal: 2 }, // Stereo HD
          },
        });
        micStreamRef.current = micStream;
        const micTracks = micStream.getAudioTracks();
        if (micTracks.length > 0) {
          const micSource = audioCtx.createMediaStreamSource(micStream);
          const micGain = audioCtx.createGain();
          micGain.gain.value = 1.0;
          micSource.connect(micGain);
          micGain.connect(destination);
          micGain.connect(analyser);
          hasAudioTrack = true;
        }
      }

      // Start audio peak meter loop
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        setAudioLevel(Math.min(100, Math.round((average / 128) * 100)));
        if (isRecording) {
          animationFrameRef.current = requestAnimationFrame(updateLevel);
        }
      };
      updateLevel();

      if (hasAudioTrack && destination.stream.getAudioTracks().length > 0) {
        return destination.stream.getAudioTracks()[0];
      }
    } catch (e) {
      console.warn('Audio mixing setup failed:', e);
    }
    return null;
  };

  // Start Recording function
  const startRecording = useCallback(
    async (type: RecordingType = 'video') => {
      // Countdown handler
      if (countdownDelay > 0) {
        for (let i = countdownDelay; i > 0; i--) {
          setCountdown(i);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        setCountdown(null);
      }

      chunksRef.current = [];
      isRecordingRef.current = true;
      setIsRecording(true);
      setIsPaused(false);
      setElapsedTime(0);
      setRecordedBytes(0);

      try {
        let finalStream: MediaStream;

        if (type === 'audio') {
          // Audio-only recording mode
          const audioTrack = await setupAudioMixing(null, 'audio');
          if (!audioTrack) {
            throw new Error('No audio track available for audio-only recording.');
          }
          finalStream = new MediaStream([audioTrack]);
        } else {
          // Video + Audio recording mode
          let activeDisplayStream = displayStreamRef.current;
          if (!activeDisplayStream || !activeDisplayStream.active) {
            try {
              activeDisplayStream = await startPreview();
            } catch (pErr) {
              // If iframe permission policy blocked real getDisplayMedia, fallback smoothly to demo screen feed
              activeDisplayStream = await startPreview(true);
            }
          }

          let videoTrack: MediaStreamTrack;

          // Check if custom crop or canvas resolution processing is needed
          const targetDim = getTargetDimensions();
          if (cropRegion.enabled) {
            // Setup Canvas rendering loop for custom crop region
            const canvas = document.createElement('canvas');
            canvas.width = cropRegion.width;
            canvas.height = cropRegion.height;
            const ctx = canvas.getContext('2d')!;

            const video = document.createElement('video');
            video.srcObject = activeDisplayStream;
            video.muted = true;
            video.playsInline = true;
            video.play().catch((e) => console.log('Crop video element play error:', e));
            videoElemRef.current = video;

            const drawFrame = () => {
              if (video.readyState >= 2) {
                ctx.drawImage(
                  video,
                  cropRegion.x,
                  cropRegion.y,
                  cropRegion.width,
                  cropRegion.height,
                  0,
                  0,
                  cropRegion.width,
                  cropRegion.height
                );
              }
              if (isRecordingRef.current) {
                animationFrameRef.current = requestAnimationFrame(drawFrame);
              }
            };
            drawFrame();

            const canvasStream = canvas.captureStream(targetFps);
            videoTrack = canvasStream.getVideoTracks()[0];
          } else {
            videoTrack = activeDisplayStream.getVideoTracks()[0];
          }

          // Setup Audio track mix
          const mixedAudioTrack = await setupAudioMixing(activeDisplayStream, 'video');

          const tracks: MediaStreamTrack[] = [videoTrack];
          if (mixedAudioTrack) {
            tracks.push(mixedAudioTrack);
          }

          finalStream = new MediaStream(tracks);
        }

        // Determine supported mimeType for recording
        let mimeType = 'video/mp4';
        if (type === 'audio') {
          const audioTypes = ['audio/mp4', 'audio/aac', 'audio/webm;codecs=opus', 'audio/webm'];
          mimeType = audioTypes.find((t) => MediaRecorder.isTypeSupported(t)) || 'audio/webm';
        } else {
          const videoTypes = [
            'video/mp4;codecs=avc1,mp4a.40.2',
            'video/mp4;codecs=avc1',
            'video/mp4;codecs=h264,aac',
            'video/mp4',
            'video/webm;codecs=h264,opus',
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm',
          ];
          mimeType = videoTypes.find((t) => MediaRecorder.isTypeSupported(t)) || 'video/webm';
        }

        const mediaRecorder = new MediaRecorder(finalStream, {
          mimeType,
          videoBitsPerSecond: type === 'video' ? targetBitrate : undefined,
          audioBitsPerSecond: 320000, // Studio 320 kbps HD Audio
        });

        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            chunksRef.current.push(event.data);
            setRecordedBytes((prev) => prev + event.data.size);
          }
        };

        mediaRecorder.onstop = async () => {
          isRecordingRef.current = false;
          setIsRecording(false);
          setIsPaused(false);
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
          }

          const actualMimeType = mediaRecorder.mimeType || mimeType || (type === 'video' ? 'video/webm' : 'audio/webm');
          const blob = new Blob(chunksRef.current, { type: actualMimeType });

          if (blob.size === 0) {
            console.warn('Recorded blob is 0 bytes.');
            setCaptureError('Recording produced 0 bytes. Please try recording again.');
            return;
          }

          const url = URL.createObjectURL(blob);
          const duration = elapsedTime;

          let thumbnailUrl: string | undefined = undefined;
          if (type === 'video') {
            thumbnailUrl = await generateVideoThumbnail(blob);
          }

          const dim = getTargetDimensions();
          const item: RecordingItem = {
            id: `rec_${Date.now()}`,
            title: `${type === 'video' ? 'Screen Recording' : 'Audio Recording'} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            type,
            blob,
            url,
            thumbnailUrl,
            duration,
            fileSize: blob.size,
            createdAt: Date.now(),
            resolution: type === 'video' ? `${dim.width}x${dim.height}` : undefined,
            fps: type === 'video' ? targetFps : undefined,
            audioSource,
          };

          if (options.onRecordingComplete) {
            options.onRecordingComplete(item);
          }

          // Clean audio contexts
          if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
          }
        };

        mediaRecorder.start(1000); // collect chunk every 1 second
        setIsRecording(true);
        setIsPaused(false);

        // Start elapsed timer
        timerIntervalRef.current = window.setInterval(() => {
          setElapsedTime((prev) => prev + 1);
        }, 1000);
      } catch (err) {
        console.error('Failed to start recording:', err);
        setCountdown(null);
        setIsRecording(false);
      }
    },
    [
      countdownDelay,
      audioSource,
      selectedMicId,
      targetFps,
      targetBitrate,
      cropRegion,
      getTargetDimensions,
      startPreview,
      isRecording,
      elapsedTime,
      options,
    ]
  );

  // Pause Recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  }, []);

  // Resume Recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerIntervalRef.current = window.setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
  }, []);

  // Stop Recording
  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  return {
    isRecording,
    isPaused,
    countdown,
    elapsedTime,
    recordedBytes,
    audioLevel,
    captureError,
    setCaptureError,
    isIframeBlocked,
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
    audioSource,
    setAudioSource,
    selectedMicId,
    setSelectedMicId,
    mics,
    countdownDelay,
    setCountdownDelay,
    cropRegion,
    setCropRegion,
    displayStream,
    startPreview,
    stopPreview,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
  };
}
