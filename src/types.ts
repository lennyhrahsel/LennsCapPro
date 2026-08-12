export type RecordingType = 'video' | 'audio';

export type ResolutionPreset = '4k' | '1080p' | '720p' | '480p' | 'custom';

export interface ResolutionConfig {
  id: ResolutionPreset;
  label: string;
  width: number;
  height: number;
  aspectRatio: string;
}

export type AudioSourceType = 'mic' | 'system' | 'both' | 'none';

export interface AudioDevice {
  deviceId: string;
  label: string;
}

export interface CropRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  enabled: boolean;
}

export interface RecordingItem {
  id: string;
  title: string;
  type: RecordingType;
  blob: Blob;
  url: string;
  thumbnailUrl?: string;
  duration: number; // in seconds
  fileSize: number; // in bytes
  createdAt: number; // timestamp
  resolution?: string;
  fps?: number;
  audioSource?: string;
}

export interface VideoFilterSettings {
  brightness: number; // 0 to 200 (100 default)
  contrast: number;   // 0 to 200 (100 default)
  saturation: number; // 0 to 200 (100 default)
  grayscale: number;  // 0 to 100 (0 default)
  sepia: number;      // 0 to 100 (0 default)
  blur: number;       // 0 to 10 (0 default)
}

export interface TextOverlaySettings {
  text: string;
  fontSize: number;
  color: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  opacity: number;
  enabled: boolean;
}

export interface VideoEditorState {
  startTime: number;
  endTime: number;
  currentTime: number;
  volume: number;
  playbackRate: number;
  rotation: number; // 0, 90, 180, 270
  flipHorizontal: boolean;
  filters: VideoFilterSettings;
  textOverlay: TextOverlaySettings;
  exportFormat: 'webm' | 'mp4';
  exportQuality: 'high' | 'medium' | 'low';
}
