'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  Loader2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { getProxiedVideoUrl } from '@/lib/utils/media-proxy';
import type { GeneratedVideo } from '@/types/youtube';

export interface VideoPlayerProps {
  /** The video to play */
  video: GeneratedVideo | null;
  /** Whether the player dialog is open */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Optional title for the dialog */
  title?: string;
  /** Optional pre-computed video URL (to avoid re-computing proxy URL) */
  videoUrl?: string;
}

// Format time to MM:SS
function formatTime(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function VideoPlayer({
  video,
  open,
  onOpenChange,
  title = '视频预览',
  videoUrl
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [videoDimensions, setVideoDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  // 使用传入的 URL 或计算代理 URL（缓存以避免重复计算）
  const proxiedVideoUrl = useMemo(
    () => videoUrl || (video ? getProxiedVideoUrl(video.url) : ''),
    [videoUrl, video]
  );

  // Reset state when video changes or dialog opens
  useEffect(() => {
    if (open && video) {
      setIsPlaying(false);
      setCurrentTime(0);
      setIsLoading(true);
      setVideoDimensions(null);
    }
  }, [open, video]);

  // Hide controls after inactivity
  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
      return;
    }

    const timer = setTimeout(() => {
      setShowControls(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [isPlaying, showControls]);

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () =>
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handlePlayPause = useCallback(() => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleMuteToggle = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const handleVolumeChange = useCallback((value: number[]) => {
    if (!videoRef.current) return;
    const newVolume = value[0];
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  }, []);

  const handleSeek = useCallback((value: number[]) => {
    if (!videoRef.current) return;
    const newTime = value[0];
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, []);

  const handleSkip = useCallback(
    (seconds: number) => {
      if (!videoRef.current) return;
      const newTime = Math.max(
        0,
        Math.min(duration, videoRef.current.currentTime + seconds)
      );
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    },
    [duration]
  );

  const handleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (isFullscreen) {
        await document.exitFullscreen();
      } else {
        await containerRef.current.requestFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  }, [isFullscreen]);

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    setVideoDimensions({
      width: videoRef.current.videoWidth,
      height: videoRef.current.videoHeight
    });
    setIsLoading(false);
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setShowControls(true);
  }, []);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'm':
          e.preventDefault();
          handleMuteToggle();
          break;
        case 'f':
          e.preventDefault();
          handleFullscreen();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleSkip(-5);
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleSkip(5);
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleVolumeChange([Math.min(1, volume + 0.1)]);
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleVolumeChange([Math.max(0, volume - 0.1)]);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    open,
    handlePlayPause,
    handleMuteToggle,
    handleFullscreen,
    handleSkip,
    handleVolumeChange,
    volume
  ]);

  if (!video) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[95vh] max-w-[95vw] flex-col overflow-hidden p-0'>
        <DialogHeader className='flex-shrink-0 p-4 pb-2'>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div
          ref={containerRef}
          className='relative flex min-h-0 flex-1 items-center justify-center bg-black'
          onMouseMove={handleMouseMove}
          onMouseLeave={() => isPlaying && setShowControls(false)}
        >
          {/* Video Element */}
          <video
            ref={videoRef}
            src={proxiedVideoUrl}
            className='max-h-[calc(95vh-120px)] max-w-full'
            onClick={handlePlayPause}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
            onWaiting={() => setIsLoading(true)}
            onCanPlay={() => setIsLoading(false)}
            playsInline
          />

          {/* Loading Overlay */}
          {isLoading && (
            <div className='absolute inset-0 flex items-center justify-center bg-black/50'>
              <Loader2 className='h-12 w-12 animate-spin text-white' />
            </div>
          )}

          {/* Play/Pause Overlay (center) */}
          {!isPlaying && !isLoading && (
            <div
              className='absolute inset-0 flex cursor-pointer items-center justify-center'
              onClick={handlePlayPause}
            >
              <div className='rounded-full bg-black/50 p-4 transition-colors hover:bg-black/70'>
                <Play className='h-12 w-12 fill-white text-white' />
              </div>
            </div>
          )}

          {/* Controls Overlay */}
          <div
            className={cn(
              'absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300',
              showControls ? 'opacity-100' : 'pointer-events-none opacity-0'
            )}
          >
            {/* Progress Bar */}
            <div className='mb-3'>
              <Slider
                value={[currentTime]}
                min={0}
                max={duration || 100}
                step={0.1}
                onValueChange={handleSeek}
                className='cursor-pointer'
              />
            </div>

            {/* Controls Row */}
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                {/* Play/Pause */}
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={handlePlayPause}
                  className='text-white hover:bg-white/20'
                >
                  {isPlaying ? (
                    <Pause className='h-5 w-5' />
                  ) : (
                    <Play className='h-5 w-5 fill-white' />
                  )}
                </Button>

                {/* Skip Backward */}
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => handleSkip(-5)}
                  className='text-white hover:bg-white/20'
                  title='后退5秒'
                >
                  <SkipBack className='h-4 w-4' />
                </Button>

                {/* Skip Forward */}
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => handleSkip(5)}
                  className='text-white hover:bg-white/20'
                  title='前进5秒'
                >
                  <SkipForward className='h-4 w-4' />
                </Button>

                {/* Volume */}
                <div className='flex items-center gap-2'>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={handleMuteToggle}
                    className='text-white hover:bg-white/20'
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className='h-5 w-5' />
                    ) : (
                      <Volume2 className='h-5 w-5' />
                    )}
                  </Button>
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    min={0}
                    max={1}
                    step={0.1}
                    onValueChange={handleVolumeChange}
                    className='w-20'
                  />
                </div>

                {/* Time Display */}
                <span className='ml-2 text-sm text-white'>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              {/* Right Controls */}
              <div className='flex items-center gap-2'>
                {/* Fullscreen */}
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={handleFullscreen}
                  className='text-white hover:bg-white/20'
                  title={isFullscreen ? '退出全屏' : '全屏'}
                >
                  {isFullscreen ? (
                    <Minimize className='h-5 w-5' />
                  ) : (
                    <Maximize className='h-5 w-5' />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Video Info */}
        <div className='text-muted-foreground flex flex-shrink-0 items-center justify-between border-t p-4 pt-2 text-sm'>
          <span>源图片索引: {video.source_image_index}</span>
          {videoDimensions && (
            <span>
              尺寸: {videoDimensions.width} × {videoDimensions.height}
            </span>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
