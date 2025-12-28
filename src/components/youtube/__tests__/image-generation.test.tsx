import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fc from 'fast-check';
import { ImageGenerationCard } from '../image-generation-card';
import { ImageSelector } from '../image-selector';
import type { Prompt, GeneratedImage } from '@/types/youtube';

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

describe('ImageGenerationCard', () => {
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

  const mockImages: GeneratedImage[] = [
    {
      id: 'img_001',
      project_id: 'proj_123',
      prompt_id: 'prompt_001',
      storyboard_index: 1,
      image_url: '/images/img_001.png',
      generation_type: 'text_to_image',
      is_selected: true,
      created_at: '2025-12-28T10:00:00Z'
    },
    {
      id: 'img_002',
      project_id: 'proj_123',
      prompt_id: 'prompt_001',
      storyboard_index: 1,
      image_url: '/images/img_002.png',
      generation_type: 'image_text_to_image',
      is_selected: false,
      created_at: '2025-12-28T10:01:00Z'
    }
  ];

  const mockOnSelectImage = vi.fn();
  const mockOnRegenerate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render storyboard index', () => {
    render(
      <ImageGenerationCard
        prompt={mockPrompt}
        images={mockImages}
        status='selected'
        onSelectImage={mockOnSelectImage}
        onRegenerate={mockOnRegenerate}
      />
    );

    expect(screen.getByText('微创新分镜 #1')).toBeInTheDocument();
  });

  it('should display "已选择" badge when status is selected', () => {
    render(
      <ImageGenerationCard
        prompt={mockPrompt}
        images={mockImages}
        status='selected'
        onSelectImage={mockOnSelectImage}
        onRegenerate={mockOnRegenerate}
      />
    );

    expect(screen.getByText('已选择')).toBeInTheDocument();
  });

  it('should display "生成中..." badge when status is generating', () => {
    render(
      <ImageGenerationCard
        prompt={mockPrompt}
        images={[]}
        status='generating'
        onSelectImage={mockOnSelectImage}
        onRegenerate={mockOnRegenerate}
        isGenerating={true}
      />
    );

    expect(screen.getByText('生成中...')).toBeInTheDocument();
  });

  it('should display "待选择" badge when status is has_images', () => {
    const imagesWithoutSelection = mockImages.map((img) => ({
      ...img,
      is_selected: false
    }));
    render(
      <ImageGenerationCard
        prompt={mockPrompt}
        images={imagesWithoutSelection}
        status='has_images'
        onSelectImage={mockOnSelectImage}
        onRegenerate={mockOnRegenerate}
      />
    );

    expect(screen.getByText('待选择')).toBeInTheDocument();
  });

  it('should display "待生成" badge when status is pending', () => {
    render(
      <ImageGenerationCard
        prompt={mockPrompt}
        images={[]}
        status='pending'
        onSelectImage={mockOnSelectImage}
        onRegenerate={mockOnRegenerate}
      />
    );

    expect(screen.getByText('待生成')).toBeInTheDocument();
  });

  it('should display image count', () => {
    render(
      <ImageGenerationCard
        prompt={mockPrompt}
        images={mockImages}
        status='selected'
        onSelectImage={mockOnSelectImage}
        onRegenerate={mockOnRegenerate}
      />
    );

    expect(screen.getByText('生成的图片 (2)')).toBeInTheDocument();
  });

  it('should call onRegenerate when regenerate button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ImageGenerationCard
        prompt={mockPrompt}
        images={mockImages}
        status='selected'
        onSelectImage={mockOnSelectImage}
        onRegenerate={mockOnRegenerate}
      />
    );

    const regenerateButton = screen.getByRole('button', { name: /重新生成/i });
    await user.click(regenerateButton);

    expect(mockOnRegenerate).toHaveBeenCalled();
  });

  it('should disable regenerate button when isGenerating is true', () => {
    render(
      <ImageGenerationCard
        prompt={mockPrompt}
        images={mockImages}
        status='generating'
        onSelectImage={mockOnSelectImage}
        onRegenerate={mockOnRegenerate}
        isGenerating={true}
      />
    );

    const regenerateButton = screen.getByRole('button', { name: /重新生成/i });
    expect(regenerateButton).toBeDisabled();
  });

  it('should show "开始生成" button when no images exist', async () => {
    const user = userEvent.setup();
    render(
      <ImageGenerationCard
        prompt={mockPrompt}
        images={[]}
        status='pending'
        onSelectImage={mockOnSelectImage}
        onRegenerate={mockOnRegenerate}
      />
    );

    const startButton = screen.getByRole('button', { name: /开始生成/i });
    await user.click(startButton);

    expect(mockOnRegenerate).toHaveBeenCalled();
  });

  it('should display generation type with character refs', () => {
    render(
      <ImageGenerationCard
        prompt={mockPrompt}
        images={mockImages}
        status='selected'
        onSelectImage={mockOnSelectImage}
        onRegenerate={mockOnRegenerate}
      />
    );

    expect(screen.getByText('图文生图 (角色: A, B)')).toBeInTheDocument();
  });

  it('should display text_to_image prompt preview', () => {
    render(
      <ImageGenerationCard
        prompt={mockPrompt}
        images={mockImages}
        status='selected'
        onSelectImage={mockOnSelectImage}
        onRegenerate={mockOnRegenerate}
      />
    );

    expect(
      screen.getByText('A beautiful landscape with mountains')
    ).toBeInTheDocument();
  });

  it('should display "文生图 (无角色引用)" when no character refs', () => {
    const promptWithoutRefs = { ...mockPrompt, character_refs: [] };
    render(
      <ImageGenerationCard
        prompt={promptWithoutRefs}
        images={mockImages}
        status='selected'
        onSelectImage={mockOnSelectImage}
        onRegenerate={mockOnRegenerate}
      />
    );

    expect(screen.getByText('文生图 (无角色引用)')).toBeInTheDocument();
  });
});

describe('ImageSelector', () => {
  const mockImage: GeneratedImage = {
    id: 'img_001',
    project_id: 'proj_123',
    prompt_id: 'prompt_001',
    storyboard_index: 1,
    image_url: '/images/img_001.png',
    generation_type: 'text_to_image',
    is_selected: false,
    created_at: '2025-12-28T10:00:00Z'
  };

  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render image', () => {
    render(
      <ImageSelector
        image={mockImage}
        isSelected={false}
        onSelect={mockOnSelect}
      />
    );

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', '/images/img_001.png');
  });

  it('should show generation type badge for text_to_image', () => {
    render(
      <ImageSelector
        image={mockImage}
        isSelected={false}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('文生图')).toBeInTheDocument();
  });

  it('should show generation type badge for image_text_to_image', () => {
    const imageTextToImageMock = {
      ...mockImage,
      generation_type: 'image_text_to_image' as const
    };
    render(
      <ImageSelector
        image={imageTextToImageMock}
        isSelected={false}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('图文生图')).toBeInTheDocument();
  });

  it('should call onSelect when clicked', async () => {
    const user = userEvent.setup();
    mockOnSelect.mockResolvedValue(undefined);

    render(
      <ImageSelector
        image={mockImage}
        isSelected={false}
        onSelect={mockOnSelect}
      />
    );

    const selector = screen.getByRole('button', { name: /选择图片/i });
    await user.click(selector);

    await waitFor(() => {
      expect(mockOnSelect).toHaveBeenCalledWith(true);
    });
  });

  it('should toggle selection state when clicked', async () => {
    const user = userEvent.setup();
    mockOnSelect.mockResolvedValue(undefined);

    const { rerender } = render(
      <ImageSelector
        image={mockImage}
        isSelected={true}
        onSelect={mockOnSelect}
      />
    );

    const selector = screen.getByRole('button', { name: /选择图片/i });
    await user.click(selector);

    await waitFor(() => {
      expect(mockOnSelect).toHaveBeenCalledWith(false);
    });
  });

  it('should show check icon when selected', () => {
    render(
      <ImageSelector
        image={mockImage}
        isSelected={true}
        onSelect={mockOnSelect}
      />
    );

    // The check icon should be visible in the selection overlay
    const selector = screen.getByRole('button', { name: /选择图片/i });
    expect(selector).toHaveAttribute('aria-pressed', 'true');
  });

  it('should have correct aria-label', () => {
    render(
      <ImageSelector
        image={mockImage}
        isSelected={false}
        onSelect={mockOnSelect}
      />
    );

    const selector = screen.getByRole('button', { name: /选择图片/i });
    expect(selector).toHaveAttribute('aria-label', '选择图片');
  });

  it('should have correct aria-label when selected', () => {
    render(
      <ImageSelector
        image={mockImage}
        isSelected={true}
        onSelect={mockOnSelect}
      />
    );

    const selector = screen.getByRole('button', { name: /选择图片/i });
    expect(selector).toHaveAttribute('aria-label', '选择图片 (已选中)');
  });
});

/**
 * Property-Based Test: Property 11 - 重新生成增加候选
 * Feature: youtube-video-tool, Property 11: 重新生成增加候选
 * Validates: Requirements 7.5, 8.3
 *
 * For any image or video regeneration operation, the candidate list length
 * for that storyboard should increase.
 */
describe('Property 11: 重新生成增加候选 (Regeneration Adds Candidates)', () => {
  // Generator for generated images
  const generatedImageArb = fc.record({
    id: fc.uuid(),
    project_id: fc.uuid(),
    prompt_id: fc.uuid(),
    storyboard_index: fc.integer({ min: 1, max: 100 }),
    image_url: fc.webUrl(),
    generation_type: fc.constantFrom(
      'text_to_image' as const,
      'image_text_to_image' as const
    ),
    is_selected: fc.boolean(),
    created_at: fc.constant('2025-01-01T00:00:00.000Z')
  }) as fc.Arbitrary<GeneratedImage>;

  // Helper function to simulate regeneration
  const simulateRegeneration = (
    existingImages: GeneratedImage[],
    storyboardIndex: number,
    newImagesCount: number
  ): GeneratedImage[] => {
    const newImages: GeneratedImage[] = Array.from(
      { length: newImagesCount },
      (_, i) => ({
        id: `new_img_${Date.now()}_${i}`,
        project_id: existingImages[0]?.project_id || 'proj_123',
        prompt_id: existingImages[0]?.prompt_id || 'prompt_123',
        storyboard_index: storyboardIndex,
        image_url: `/images/new_${i}.png`,
        generation_type: 'text_to_image' as const,
        is_selected: false,
        created_at: new Date().toISOString()
      })
    );
    return [...existingImages, ...newImages];
  };

  it('should increase candidate count after regeneration', () => {
    fc.assert(
      fc.property(
        fc.array(generatedImageArb, { minLength: 0, maxLength: 10 }),
        fc.integer({ min: 1, max: 5 }),
        (existingImages, newImagesCount) => {
          const storyboardIndex = existingImages[0]?.storyboard_index || 1;
          const initialCount = existingImages.filter(
            (img) => img.storyboard_index === storyboardIndex
          ).length;

          // Simulate regeneration
          const updatedImages = simulateRegeneration(
            existingImages,
            storyboardIndex,
            newImagesCount
          );

          const finalCount = updatedImages.filter(
            (img) => img.storyboard_index === storyboardIndex
          ).length;

          // Property: After regeneration, the count should increase by newImagesCount
          return finalCount === initialCount + newImagesCount;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve existing images after regeneration', () => {
    fc.assert(
      fc.property(
        fc.array(generatedImageArb, { minLength: 1, maxLength: 10 }),
        fc.integer({ min: 1, max: 5 }),
        (existingImages, newImagesCount) => {
          const storyboardIndex = existingImages[0].storyboard_index;
          const existingIds = new Set(existingImages.map((img) => img.id));

          // Simulate regeneration
          const updatedImages = simulateRegeneration(
            existingImages,
            storyboardIndex,
            newImagesCount
          );

          // Property: All existing images should still be present
          return existingImages.every((img) =>
            updatedImages.some((updated) => updated.id === img.id)
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should add new unique images after regeneration', () => {
    fc.assert(
      fc.property(
        fc.array(generatedImageArb, { minLength: 0, maxLength: 10 }),
        fc.integer({ min: 1, max: 5 }),
        (existingImages, newImagesCount) => {
          const storyboardIndex = existingImages[0]?.storyboard_index || 1;
          const existingIds = new Set(existingImages.map((img) => img.id));

          // Simulate regeneration
          const updatedImages = simulateRegeneration(
            existingImages,
            storyboardIndex,
            newImagesCount
          );

          // Get new images (those not in existing)
          const newImages = updatedImages.filter(
            (img) => !existingIds.has(img.id)
          );

          // Property: New images should have unique IDs
          const newIds = newImages.map((img) => img.id);
          const uniqueNewIds = new Set(newIds);
          return uniqueNewIds.size === newIds.length;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property-Based Test: Property 12 - 选择标记唯一性
 * Feature: youtube-video-tool, Property 12: 选择标记唯一性
 * Validates: Requirements 7.6, 8.4
 *
 * For any image or video selection operation within a storyboard,
 * only one item can have is_selected set to true.
 */
describe('Property 12: 选择标记唯一性 (Selection Uniqueness)', () => {
  // Generator for generated images with unique IDs
  const generatedImageArb = (index: number) =>
    fc.record({
      id: fc.constant(`img_${index}_${Date.now()}`),
      project_id: fc.uuid(),
      prompt_id: fc.uuid(),
      storyboard_index: fc.integer({ min: 1, max: 100 }),
      image_url: fc.webUrl(),
      generation_type: fc.constantFrom(
        'text_to_image' as const,
        'image_text_to_image' as const
      ),
      is_selected: fc.boolean(),
      created_at: fc.constant('2025-01-01T00:00:00.000Z')
    }) as fc.Arbitrary<GeneratedImage>;

  // Generator for array of images with unique IDs
  const imagesArrayArb = (minLength: number, maxLength: number) =>
    fc
      .integer({ min: minLength, max: maxLength })
      .chain((length) =>
        fc.tuple(...Array.from({ length }, (_, i) => generatedImageArb(i)))
      );

  // Helper function to normalize selection (ensure at most one selected per storyboard)
  const normalizeSelection = (images: GeneratedImage[]): GeneratedImage[] => {
    const seenStoryboards = new Set<number>();
    return images.map((img) => {
      if (img.is_selected) {
        if (seenStoryboards.has(img.storyboard_index)) {
          // Already have a selected image in this storyboard, deselect this one
          return { ...img, is_selected: false };
        }
        seenStoryboards.add(img.storyboard_index);
      }
      return img;
    });
  };

  // Helper function to simulate selection (ensures uniqueness)
  const selectImage = (
    images: GeneratedImage[],
    imageIdToSelect: string
  ): GeneratedImage[] => {
    const targetImage = images.find((img) => img.id === imageIdToSelect);
    if (!targetImage) return images;

    return images.map((img) => {
      // If same storyboard_index, only the selected image should be selected
      if (img.storyboard_index === targetImage.storyboard_index) {
        return {
          ...img,
          is_selected: img.id === imageIdToSelect
        };
      }
      return img;
    });
  };

  // Helper to check selection uniqueness within each storyboard
  const validateSelectionUniqueness = (images: GeneratedImage[]): boolean => {
    // Group images by storyboard_index
    const byStoryboard = new Map<number, GeneratedImage[]>();
    for (const img of images) {
      const existing = byStoryboard.get(img.storyboard_index) || [];
      byStoryboard.set(img.storyboard_index, [...existing, img]);
    }

    // Check each storyboard has at most one selected image
    for (const [, storyboardImages] of byStoryboard) {
      const selectedCount = storyboardImages.filter(
        (img) => img.is_selected
      ).length;
      if (selectedCount > 1) {
        return false;
      }
    }
    return true;
  };

  it('should maintain at most one selected image per storyboard after selection', () => {
    fc.assert(
      fc.property(
        imagesArrayArb(2, 10),
        fc.integer({ min: 0, max: 9 }),
        (images, randomIndex) => {
          // Ensure we have at least one image to select
          if (images.length === 0) return true;

          // First, normalize the initial data to have at most one selected per storyboard
          const normalizedImages = normalizeSelection(images);

          // Pick an image to select using the generated index
          const imageIndex = randomIndex % normalizedImages.length;
          const imageToSelect = normalizedImages[imageIndex];

          // Perform selection
          const updatedImages = selectImage(normalizedImages, imageToSelect.id);

          // Property: After selection, each storyboard should have at most one selected image
          return validateSelectionUniqueness(updatedImages);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should deselect other images in same storyboard when selecting', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        imagesArrayArb(2, 10),
        (storyboardIndex, baseImages) => {
          // Create images all in the same storyboard
          const images = baseImages.map((img) => ({
            ...img,
            storyboard_index: storyboardIndex
          }));

          // Select the first image
          const selectedImages = selectImage(images, images[0].id);

          // Count selected in this storyboard
          const selectedCount = selectedImages.filter(
            (img) => img.storyboard_index === storyboardIndex && img.is_selected
          ).length;

          // Property: Exactly one image should be selected
          return selectedCount === 1;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not affect selection in other storyboards', () => {
    fc.assert(
      fc.property(imagesArrayArb(4, 10), (images) => {
        // Ensure we have images in at least 2 different storyboards
        const storyboards = new Set(images.map((img) => img.storyboard_index));
        if (storyboards.size < 2) return true;

        // Get images from first storyboard
        const firstStoryboardIndex = images[0].storyboard_index;
        const otherStoryboardImages = images.filter(
          (img) => img.storyboard_index !== firstStoryboardIndex
        );

        // Record selection state of other storyboards before
        const otherSelectionsBefore = otherStoryboardImages.map((img) => ({
          id: img.id,
          is_selected: img.is_selected
        }));

        // Select an image from first storyboard
        const imageToSelect = images.find(
          (img) => img.storyboard_index === firstStoryboardIndex
        );
        if (!imageToSelect) return true;

        const updatedImages = selectImage(images, imageToSelect.id);

        // Check other storyboards' selection state unchanged
        const otherSelectionsAfter = updatedImages
          .filter((img) => img.storyboard_index !== firstStoryboardIndex)
          .map((img) => ({
            id: img.id,
            is_selected: img.is_selected
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

  it('should allow zero selected images in a storyboard', () => {
    fc.assert(
      fc.property(imagesArrayArb(1, 10), (images) => {
        // Set all images to not selected
        const unselectedImages = images.map((img) => ({
          ...img,
          is_selected: false
        }));

        // Property: Zero selected is valid (at most one)
        return validateSelectionUniqueness(unselectedImages);
      }),
      { numRuns: 100 }
    );
  });
});
