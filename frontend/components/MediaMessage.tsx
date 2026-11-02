'use client';

import { useState, useEffect } from 'react';
import type { FileAttachment } from '@/lib/types';

interface MediaMessageProps {
  attachment: FileAttachment;
  cachedUrl?: string;
  onUrlLoaded?: (fileId: string, url: string) => void;
}

export default function MediaMessage({ attachment, cachedUrl, onUrlLoaded }: MediaMessageProps) {
  const fileId = attachment?.fileId || '';
  const directUrl = fileId ? `/api/upload/${fileId}/file` : '';
  const [url, setUrl] = useState<string>(cachedUrl || directUrl);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (cachedUrl) {
      setUrl(cachedUrl);
      return;
    }
    if (directUrl && fileId) {
      setUrl(directUrl);
      onUrlLoaded?.(fileId, directUrl);
    }
  }, [fileId, cachedUrl, directUrl, onUrlLoaded]);

  const displayUrl = cachedUrl || url || directUrl;

  const formatSize = (bytes?: number) => {
    if (!bytes || isNaN(bytes)) return '';
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  if (!attachment || error || !displayUrl) {
    return (
      <div className="mt-2 p-3 border-2 border-black bg-surface rounded" style={{ borderRadius: 0 }}>
        <span className="text-xs font-bold text-error">Media unavailable</span>
      </div>
    );
  }

  const mime = typeof attachment?.mimeType === 'string' ? attachment.mimeType : '';
  const isImage = mime.startsWith('image/');
  const isVideo = mime.startsWith('video/');
  const isAudio = mime.startsWith('audio/');

  return (
    <div className="mt-2">
      {isImage && (
        <a href={displayUrl} target="_blank" rel="noopener noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displayUrl}
            alt={attachment.fileName || 'Attachment'}
            className="border-2 border-black"
            style={{ maxWidth: '100%', maxHeight: 300, width: 'auto', height: 'auto', borderRadius: 0, objectFit: 'contain' }}
            onError={() => {
              setError(true);
            }}
          />
        </a>
      )}

      {isVideo && (
        <video
          controls
          className="border-2 border-black"
          style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 0 }}
          preload="metadata"
        >
          <source src={displayUrl} type={mime || undefined} />
          Your browser does not support video playback.
        </video>
      )}

      {isAudio && (
        <audio
          controls
          className="w-full"
          preload="metadata"
        >
          <source src={displayUrl} type={mime || undefined} />
          Your browser does not support audio playback.
        </audio>
      )}

      <div className="flex items-center gap-2 mt-1">
        <span className="text-xs font-bold truncate" style={{ maxWidth: 200 }}>
          {attachment.fileName || 'file'}
        </span>
        {typeof attachment.fileSize === 'number' && (
          <span className="badge-brutal text-xs bg-surface px-1 py-0">
            {formatSize(attachment.fileSize)}
          </span>
        )}
      </div>
    </div>
  );
}
