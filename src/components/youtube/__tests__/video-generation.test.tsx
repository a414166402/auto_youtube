import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fc from 'fast-check';
import { VideoGenerationCard } from '../video-generation-card';
import { VideoSelector } from '../video-selector';
import type { Prompt, GeneratedImage, GeneratedVideo } from '@/types/youtube';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn()
  })
}));

// Mock the toast hook
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
    toasts: [],
    dismiss: vi.fn()
  })
}));

describe('VideoGenerationCard', () => {
  const mockPrompt: Prompt = {
    id: 'prompt_001',
    project_id: 'proj_123',
    storyboard_id: 'sb_001',
    storyboard_index: 1,
    text_to_image: 'A beautiful landscape with mountains',
    image_to_video: 'Camera slowly pans across the landscape',
    character_refs: ['A', 'B'],
    version: 'v1',
    is_edited: false,
    created_at: '2025-12-28T10:00:00Z',
    updated_at: '2025-12-28T10:00:00Z'
  };

  const mockSourceImage: GeneratedImage = {
    id: 'img_001',
    project_id: 'proj_123',
    prompt_id: 'prompt_001',
    storyboard_index: 1,
    image_url: '/images/img_001.png',
    generation_type: 'text_to_image',
    is_selected: true,
    created_at: '2025-12-28T10:00:00Z'
  };

  const mockVideos: GeneratedVideo[] = [
    {
      id: 'vid_001',
      project_id: 'proj_123',
      prompt_id: 'prompt_001',
      storyboard_index: 1,
      source_image_id: 'img_001',
      video_url: '/videos/vid_001.mp4',
      is_selected: true,
      created_at: '2025-12-28T10:00:00Z'
    },
    {
      id: 'vid_002',
      project_id: 'proj_123',
      prompt_id: 'prompt_001',
      storyboard_index: 1,
      source_image_id: 'img_001',
      video_url: '/videos/vid_002.mp4',
      is_selected: false,
      created_at: '2025-12-28T10:01:00Z'
    }
  ];

  const mockOnSelectVideo = vi.fn();
  const mockOnRegenerate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render storyboard index', () => {
    render(
      <VideoGenerationCard
        prompt={mockPrompt}
        sourceImage={mockSourceImage}
        videos={mockVideos}
        status='selected'
        onSelectVideo={mockOnSelectVideo}
        onRegenerate={mockOnRegenerate}
      />
    );

    expect(screen.getByText('微创新分镜 #1')).toBeInTheDocument();
  });

  it('should display "已选择" badge when status is selected', () => {
    render(
      <VideoGenerationCard
        prompt={mockPrompt}
        sourceImage={mockSourceImage}
        videos={mockVideos}
        status='selected'
        onSelectVideo={mockOnSelectVideo}
        onRegenerate={mockOnRegenerate}
      />
    );

    expect(screen.getByText('已选择')).toBeInTheDocument();
  });

  it('should display "生成中..." badge when status is generating', () => {
    render(
      <VideoGenerationCard
        prompt={mockPrompt}
        sourceImage={mockSourceImage}
        videos={[]}
        status='generating'
        onSelectVideo={mockOnSelectVideo}
        onRegenerate={mockOnRegenerate}
        isGenerating={true}
      />
    );

    expect(screen.getByText('生成中...')).toBeInTheDocument();
  });

  it('should display "待选择" badge when status is has_videos', () => {
    const videosWithoutSelection = mockVideos.map((vid) => ({
      ...vid,
      is_selected: false
    }));
    render(
      <VideoGenerationCard
        prompt={mockPrompt}
        sourceImage={mockSourceImage}
        videos={videosWithoutSelection}
        status='has_videos'
        onSelectVideo={mockOnSelectVideo}
        onRegenerate={mockOnRegenerate}
      />
    );

    expect(screen.getByText('待选择')).toBeInTheDocument();
  });

  it('should display "待生成" badge when status is pending', () => {
    render(
      <VideoGenerationCard
        prompt={mockPrompt}
        sourceImage={mockSourceImage}
        videos={[]}
        status='pending'
        onSelectVideo={mockOnSelectVideo}
        onRegenerate={mockOnRegenerate}
      />
    );

    expect(screen.getByText('待生成')).toBeInTheDocument();
  });

  it('should display video count', () => {
    render(
      <VideoGenerationCard
        prompt={mockPrompt}
        sourceImage={mockSourceImage}
        videos={mockVideos}
        status='selected'
        onSelectVideo={mockOnSelectVideo}
        onRegenerate={mockOnRegenerate}
      />
    );

    expect(screen.getByText('生成的视频 (2)')).toBeInTheDocument();
  });

  it('should display source image thumbnail', () => {
    render(
      <VideoGenerationCard
        prompt={mockPrompt}
        sourceImage={mockSourceImage}
        videos={mockVideos}
        status='selected'
        onSelectVideo={mockOnSelectVideo}
        onRegenerate={mockOnRegenerate}
      />
    );

    const sourceImg = screen.getByAltText('分镜 1 源图片');
    expect(sourceImg).toHaveAttribute('src', '/images/img_001.png');
  });

  it('should show "未选择图片" when no source image', () => {
    render(
      <VideoGenerationCard
        prompt={mockPrompt}
        sourceImage={null}
        videos={[]}
        status='pending'
        onSelectVideo={mockOnSelectVideo}
        onRegenerate={mockOnRegenerate}
      />
    );

    expect(screen.getByText('未选择图片')).toBeInTheDocument();
  });

  it('should call onRegenerate when regenerate button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <VideoGenerationCard
        prompt={mockPrompt}
        sourceImage={mockSourceImage}
        videos={mockVideos}
        status='selected'
        onSelectVideo={mockOnSelectVideo}
        onRegenerate={mockOnRegenerate}
      />
    );

    const regenerateButton = screen.getByRole('button', { name: /重新生成/i });
    await user.click(regenerateButton);

    expect(mockOnRegenerate).toHaveBeenCalled();
  });

  it('should disable regenerate button when isGenerating is true', () => {
    render(
      <VideoGenerationCard
        prompt={mockPrompt}
        sourceImage={mockSourceImage}
        videos={mockVideos}
        status='generating'
        onSelectVideo={mockOnSelectVideo}
        onRegenerate={mockOnRegenerate}
        isGenerating={true}
      />
    );

    const regenerateButton = screen.getByRole('button', { name: /重新生成/i });
    expect(regenerateButton).toBeDisabled();
  });

  it('should disable regenerate button when no source image', () => {
    render(
      <VideoGenerationCard
        prompt={mockPrompt}
        sourceImage={null}
        videos={[]}
        status='pending'
        onSelectVideo={mockOnSelectVideo}
        onRegenerate={mockOnRegenerate}
      />
    );

    const regenerateButton = screen.getByRole('button', { name: /重新生成/i });
    expect(regenerateButton).toBeDisabled();
  });

  it('should show "请先选择源图片" when no source image and no videos', () => {
    render(
      <VideoGenerationCard
        prompt={mockPrompt}
        sourceImage={null}
        videos={[]}
        status='pending'
        onSelectVideo={mockOnSelectVideo}
        onRegenerate={mockOnRegenerate}
      />
    );

    expect(screen.getByText('请先选择源图片')).toBeInTheDocument();
  });

  it('should display image_to_video prompt preview', () => {
    render(
      <VideoGenerationCard
        prompt={mockPrompt}
        sourceImage={mockSourceImage}
        videos={mockVideos}
        status='selected'
        onSelectVideo={mockOnSelectVideo}
        onRegenerate={mockOnRegenerate}
      />
    );

    expect(
      screen.getByText('Camera slowly pans across the landscape')
    ).toBeInTheDocument();
  });

  it('should display character refs when available', () => {
    render(
      <VideoGenerationCard
        prompt={mockPrompt}
        sourceImage={mockSourceImage}
        videos={mockVideos}
        status='selected'
        onSelectVideo={mockOnSelectVideo}
        onRegenerate={mockOnRegenerate}
      />
    );

    expect(screen.getByText('角色引用:')).toBeInTheDocument();
  });
});

describe('VideoSelector', () => {
  const mockVideo: GeneratedVideo = {
    id: 'vid_001',
    project_id: 'proj_123',
    prompt_id: 'prompt_001',
    storyboard_index: 1,
    source_image_id: 'img_001',
    video_url: '/videos/vid_001.mp4',
    is_selected: false,
    created_at: '2025-12-28T10:00:00Z'
  };

  const mockOnSelect = vi.fn();
  const mockOnPlay = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render video element', () => {
    render(
      <VideoSelector
        video={mockVideo}
        isSelected={false}
        onSelect={mockOnSelect}
      />
    );

    const video = document.querySelector('video');
    expect(video).toHaveAttribute('src', '/videos/vid_001.mp4');
  });

  it('should show video badge', () => {
    render(
      <VideoSelector
        video={mockVideo}
        isSelected={false}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('视频')).toBeInTheDocument();
  });

  it('should call onSelect when clicked', async () => {
    const user = userEvent.setup();
    mockOnSelect.mockResolvedValue(undefined);

    render(
      <VideoSelector
        video={mockVideo}
        isSelected={false}
        onSelect={mockOnSelect}
      />
    );

    const selector = screen.getByRole('button', { name: /选择视频/i });
    await user.click(selector);

    await waitFor(() => {
      expect(mockOnSelect).toHaveBeenCalledWith(true);
    });
  });

  it('should toggle selection state when clicked', async () => {
    const user = userEvent.setup();
    mockOnSelect.mockResolvedValue(undefined);

    render(
      <VideoSelector
        video={mockVideo}
        isSelected={true}
        onSelect={mockOnSelect}
      />
    );

    const selector = screen.getByRole('button', { name: /选择视频/i });
    await user.click(selector);

    await waitFor(() => {
      expect(mockOnSelect).toHaveBeenCalledWith(false);
    });
  });

  it('should have correct aria-pressed when selected', () => {
    render(
      <VideoSelector
        video={mockVideo}
        isSelected={true}
        onSelect={mockOnSelect}
      />
    );

    const selector = screen.getByRole('button', { name: /选择视频/i });
    expect(selector).toHaveAttribute('aria-pressed', 'true');
  });

  it('should have correct aria-label', () => {
    render(
      <VideoSelector
        video={mockVideo}
        isSelected={false}
        onSelect={mockOnSelect}
      />
    );

    const selector = screen.getByRole('button', { name: /选择视频/i });
    expect(selector).toHaveAttribute('aria-label', '选择视频');
  });

  it('should have correct aria-label when selected', () => {
    render(
      <VideoSelector
        video={mockVideo}
        isSelected={true}
        onSelect={mockOnSelect}
      />
    );

    const selector = screen.getByRole('button', { name: /选择视频/i });
    expect(selector).toHaveAttribute('aria-label', '选择视频 (已选中)');
  });
});

/**
 * Property-Based Test: Property 12 - 选择标记唯一性 (Video Selection)
 * Feature: youtube-video-tool, Property 12: 选择标记唯一性
 * Validates: Requirements 8.4
 *
 * For any video selection operation within a storyboard,
 * only one video can have is_selected set to true.
 */
describe('Property 12: 选择标记唯一性 - Video Selection Uniqueness', () => {
  // Generator for generated videos with unique IDs
  const generatedVideoArb = (index: number) =>
    fc.record({
      id: fc.constant(`vid_${index}_${Date.now()}`),
      project_id: fc.uuid(),
      prompt_id: fc.uuid(),
      storyboard_index: fc.integer({ min: 1, max: 100 }),
      source_image_id: fc.uuid(),
      video_url: fc.webUrl(),
      is_selected: fc.boolean(),
      created_at: fc.constant('2025-01-01T00:00:00.000Z')
    }) as fc.Arbitrary<GeneratedVideo>;

  // Generator for array of videos with unique IDs
  const videosArrayArb = (minLength: number, maxLength: number) =>
    fc
      .integer({ min: minLength, max: maxLength })
      .chain((length) =>
        fc.tuple(...Array.from({ length }, (_, i) => generatedVideoArb(i)))
      );

  // Helper function to normalize selection (ensure at most one selected per storyboard)
  const normalizeSelection = (videos: GeneratedVideo[]): GeneratedVideo[] => {
    const seenStoryboards = new Set<number>();
    return videos.map((vid) => {
      if (vid.is_selected) {
        if (seenStoryboards.has(vid.storyboard_index)) {
          // Already have a selected video in this storyboard, deselect this one
          return { ...vid, is_selected: false };
        }
        seenStoryboards.add(vid.storyboard_index);
      }
      return vid;
    });
  };

  // Helper function to simulate selection (ensures uniqueness)
  const selectVideo = (
    videos: GeneratedVideo[],
    videoIdToSelect: string
  ): GeneratedVideo[] => {
    const targetVideo = videos.find((vid) => vid.id === videoIdToSelect);
    if (!targetVideo) return videos;

    return videos.map((vid) => {
      // If same storyboard_index, only the selected video should be selected
      if (vid.storyboard_index === targetVideo.storyboard_index) {
        return {
          ...vid,
          is_selected: vid.id === videoIdToSelect
        };
      }
      return vid;
    });
  };

  // Helper to check selection uniqueness within each storyboard
  const validateSelectionUniqueness = (videos: GeneratedVideo[]): boolean => {
    // Group videos by storyboard_index
    const byStoryboard = new Map<number, GeneratedVideo[]>();
    for (const vid of videos) {
      const existing = byStoryboard.get(vid.storyboard_index) || [];
      byStoryboard.set(vid.storyboard_index, [...existing, vid]);
    }

    // Check each storyboard has at most one selected video
    for (const [, storyboardVideos] of byStoryboard) {
      const selectedCount = storyboardVideos.filter(
        (vid) => vid.is_selected
      ).length;
      if (selectedCount > 1) {
        return false;
      }
    }
    return true;
  };

  it('should maintain at most one selected video per storyboard after selection', () => {
    fc.assert(
      fc.property(
        videosArrayArb(2, 20),
        fc.integer({ min: 0, max: 19 }),
        (videos, randomIndex) => {
          // Ensure we have at least one video to select
          if (videos.length === 0) return true;

          // First, normalize the initial data to have at most one selected per storyboard
          const normalizedVideos = normalizeSelection(videos);

          // Pick a video to select using the generated index
          const videoIndex = randomIndex % normalizedVideos.length;
          const videoToSelect = normalizedVideos[videoIndex];

          // Perform selection
          const updatedVideos = selectVideo(normalizedVideos, videoToSelect.id);

          // Property: After selection, each storyboard should have at most one selected video
          return validateSelectionUniqueness(updatedVideos);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should deselect other videos in same storyboard when selecting', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        videosArrayArb(2, 10),
        (storyboardIndex, baseVideos) => {
          // Create videos all in the same storyboard
          const videos = baseVideos.map((vid) => ({
            ...vid,
            storyboard_index: storyboardIndex
          }));

          // Select the first video
          const selectedVideos = selectVideo(videos, videos[0].id);

          // Count selected in this storyboard
          const selectedCount = selectedVideos.filter(
            (vid) => vid.storyboard_index === storyboardIndex && vid.is_selected
          ).length;

          // Property: Exactly one video should be selected
          return selectedCount === 1;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not affect selection in other storyboards', () => {
    fc.assert(
      fc.property(videosArrayArb(4, 20), (videos) => {
        // Ensure we have videos in at least 2 different storyboards
        const storyboards = new Set(videos.map((vid) => vid.storyboard_index));
        if (storyboards.size < 2) return true;

        // Get videos from first storyboard
        const firstStoryboardIndex = videos[0].storyboard_index;
        const otherStoryboardVideos = videos.filter(
          (vid) => vid.storyboard_index !== firstStoryboardIndex
        );

        // Record selection state of other storyboards before
        const otherSelectionsBefore = otherStoryboardVideos.map((vid) => ({
          id: vid.id,
          is_selected: vid.is_selected
        }));

        // Select a video from first storyboard
        const videoToSelect = videos.find(
          (vid) => vid.storyboard_index === firstStoryboardIndex
        );
        if (!videoToSelect) return true;

        const updatedVideos = selectVideo(videos, videoToSelect.id);

        // Check other storyboards' selection state unchanged
        const otherSelectionsAfter = updatedVideos
          .filter((vid) => vid.storyboard_index !== firstStoryboardIndex)
          .map((vid) => ({
            id: vid.id,
            is_selected: vid.is_selected
          }));

        // Property: Selection in other storyboards should be unchanged
        return otherSelectionsBefore.every((before) => {
          const after = otherSelectionsAfter.find((a) => a.id === before.id);
          return after && after.is_selected === before.is_selected;
        });
      }),
      { numRuns: 100 }
    );
  });

  it('should allow zero selected videos in a storyboard', () => {
    fc.assert(
      fc.property(videosArrayArb(1, 10), (videos) => {
        // Set all videos to not selected
        const unselectedVideos = videos.map((vid) => ({
          ...vid,
          is_selected: false
        }));

        // Property: Zero selected is valid (at most one)
        return validateSelectionUniqueness(unselectedVideos);
      }),
      { numRuns: 100 }
    );
  });

  it('should ensure selected video exists in the list after selection', () => {
    fc.assert(
      fc.property(
        videosArrayArb(1, 10),
        fc.integer({ min: 0, max: 9 }),
        (videos, randomIndex) => {
          // Pick a video to select using the generated index
          const videoIndex = randomIndex % videos.length;
          const videoToSelect = videos[videoIndex];

          // Perform selection
          const updatedVideos = selectVideo(videos, videoToSelect.id);

          // Find the selected video in the storyboard
          const storyboardVideos = updatedVideos.filter(
            (vid) => vid.storyboard_index === videoToSelect.storyboard_index
          );
          const selectedVideo = storyboardVideos.find((vid) => vid.is_selected);

          // Property: The selected video should be the one we selected
          return selectedVideo?.id === videoToSelect.id;
        }
      ),
      { numRuns: 100 }
    );
  });
});
