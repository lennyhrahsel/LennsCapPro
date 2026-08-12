import React, { useState } from 'react';
import {
  FileVideo,
  Play,
  Film,
  Mic,
  Download,
  Trash2,
  Clock,
  HardDrive,
  Sparkles,
  X,
  ExternalLink,
  Edit,
} from 'lucide-react';
import { RecordingItem } from '../types';
import { formatTime, formatFileSize } from '../utils/formatters';

interface RecordingsGalleryProps {
  recordings: RecordingItem[];
  onDeleteRecording: (id: string) => void;
  onOpenInEditor: (item: RecordingItem) => void;
}

export const RecordingsGallery: React.FC<RecordingsGalleryProps> = ({
  recordings,
  onDeleteRecording,
  onOpenInEditor,
}) => {
  const [filter, setFilter] = useState<'all' | 'video' | 'audio'>('all');
  const [activePreview, setActivePreview] = useState<RecordingItem | null>(null);

  const filteredRecordings = recordings.filter((r) => {
    if (filter === 'video') return r.type === 'video';
    if (filter === 'audio') return r.type === 'audio';
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-slate-100">
      {/* Gallery Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-indigo-600/20 rounded-2xl text-indigo-400 border border-indigo-500/30">
            <FileVideo className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Recordings Library</h2>
            <p className="text-xs text-slate-400">
              Locally saved screen videos and audio recordings ({recordings.length} total)
            </p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({recordings.length})
          </button>
          <button
            onClick={() => setFilter('video')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === 'video'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Videos ({recordings.filter((r) => r.type === 'video').length})
          </button>
          <button
            onClick={() => setFilter('audio')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === 'audio'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Audio ({recordings.filter((r) => r.type === 'audio').length})
          </button>
        </div>
      </div>

      {/* Grid of Recordings */}
      {filteredRecordings.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 space-y-3">
          <FileVideo className="w-12 h-12 mx-auto text-slate-600 opacity-60" />
          <h3 className="text-base font-bold text-slate-300">No Recordings Found</h3>
          <p className="text-xs text-slate-500">
            Start a screen recording or audio recording to build your studio media library.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRecordings.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl hover:border-slate-700 transition group flex flex-col justify-between"
            >
              {/* Media Thumbnail / Card Visual */}
              <div
                onClick={() => setActivePreview(item)}
                className="relative aspect-video bg-slate-950 cursor-pointer overflow-hidden group/thumb flex items-center justify-center border-b border-slate-800"
              >
                {item.type === 'video' && item.thumbnailUrl ? (
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover/thumb:scale-105 transition duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 p-4 text-indigo-400">
                    {item.type === 'video' ? (
                      <Film className="w-10 h-10 opacity-70" />
                    ) : (
                      <Mic className="w-10 h-10 opacity-70" />
                    )}
                  </div>
                )}

                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition flex items-center justify-center">
                  <div className="p-3 bg-indigo-600 rounded-full text-white shadow-xl transform scale-90 group-hover/thumb:scale-100 transition">
                    <Play className="w-6 h-6 fill-current ml-0.5" />
                  </div>
                </div>

                {/* Duration Badge */}
                <span className="absolute bottom-2 right-2 bg-slate-950/90 text-slate-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-slate-700">
                  {formatTime(item.duration)}
                </span>

                {/* Type Badge */}
                <span className="absolute top-2 left-2 bg-blue-950/90 text-blue-300 text-[10px] font-semibold px-2 py-0.5 rounded border border-blue-500/30 flex items-center gap-1 font-mono">
                  {item.type === 'video' ? <Film className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                  {item.type === 'video' ? 'MP4 VIDEO' : 'AUDIO MP3'}
                </span>
              </div>

              {/* Media Info & Actions */}
              <div className="p-4 space-y-3">
                <div>
                  <h4 className="text-sm font-bold text-white truncate" title={item.title}>
                    {item.title}
                  </h4>
                  <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3 h-3 text-slate-500" />
                      {formatFileSize(item.fileSize)}
                    </span>
                    {item.resolution && <span>{item.resolution}</span>}
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <a
                    href={item.url}
                    download={`${item.title.replace(/\s+/g, '_')}.${item.type === 'audio' ? 'mp3' : 'mp4'}`}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5 transition font-mono"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Download {item.type === 'audio' ? 'MP3 HD' : 'MP4'}</span>
                  </a>

                  {item.type === 'video' && (
                    <button
                      onClick={() => onOpenInEditor(item)}
                      className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-medium rounded-lg border border-indigo-500/30 flex items-center gap-1.5 transition"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  )}

                  <button
                    onClick={() => onDeleteRecording(item.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                    title="Delete Clip"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Media Playback Preview Modal */}
      {activePreview && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white truncate">{activePreview.title}</h3>
              <button
                onClick={() => setActivePreview(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
              {activePreview.type === 'video' ? (
                <video
                  src={activePreview.url}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full p-8 flex flex-col items-center justify-center space-y-4">
                  <Mic className="w-16 h-16 text-indigo-400 animate-bounce" />
                  <audio src={activePreview.url} controls autoPlay className="w-full max-w-md" />
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <a
                href={activePreview.url}
                download={`${activePreview.title.replace(/\s+/g, '_')}.${activePreview.type === 'audio' ? 'mp3' : 'mp4'}`}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 uppercase tracking-wider font-mono"
              >
                <Download className="w-4 h-4" /> Download {activePreview.type === 'audio' ? 'MP3 HD Audio' : 'MP4 Video'}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
