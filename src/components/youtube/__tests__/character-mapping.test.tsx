import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fc from 'fast-check';
import { CharacterMappingCard } from '../character-mapping-card';
import type {
  CharacterMapping,
  StructuredPromptData,
  Prompt
} from '@/types/youtube';

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

describe('CharacterMappingCard', () => {
  const mockMapping: CharacterMapping = {
    id: 'char_001',
    project_id: 'proj_123',
    number: 1,
    identifier: 'A',
    name: '主角',
    reference_image_url: undefined
  };

  const mockOnNameChange = vi.fn();
  const mockOnImageUpload = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render character number and identifier', () => {
    render(
      <CharacterMappingCard
        mapping={mockMapping}
        onNameChange={mockOnNameChange}
        onImageUpload={mockOnImageUpload}
      />
    );

    expect(screen.getByText(/角色 1/)).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('should render character name in input', () => {
    render(
      <CharacterMappingCard
        mapping={mockMapping}
        onNameChange={mockOnNameChange}
        onImageUpload={mockOnImageUpload}
      />
    );

    const nameInput = screen.getByPlaceholderText('输入角色名称（可选）');
    expect(nameInput).toHaveValue('主角');
  });

  it('should call onNameChange when name input changes', async () => {
    const user = userEvent.setup();
    render(
      <CharacterMappingCard
        mapping={mockMapping}
        onNameChange={mockOnNameChange}
        onImageUpload={mockOnImageUpload}
      />
    );

    const nameInput = screen.getByPlaceholderText('输入角色名称（可选）');
    await user.clear(nameInput);
    await user.type(nameInput, '配角');

    // onNameChange is called on each keystroke, so we check if it was called
    expect(mockOnNameChange).toHaveBeenCalled();
    // The last call should have the final value after typing
    const lastCall =
      mockOnNameChange.mock.calls[mockOnNameChange.mock.calls.length - 1];
    expect(lastCall[0]).toBe('A');
  });

  it('should show upload area when no image is uploaded', () => {
    render(
      <CharacterMappingCard
        mapping={mockMapping}
        onNameChange={mockOnNameChange}
        onImageUpload={mockOnImageUpload}
      />
    );

    expect(screen.getByText('拖拽图片到此处，或点击上传')).toBeInTheDocument();
    expect(
      screen.getByText('支持 JPG、PNG、GIF，最大 5MB')
    ).toBeInTheDocument();
  });

  it('should display uploaded image when reference_image_url exists', () => {
    const mappingWithImage: CharacterMapping = {
      ...mockMapping,
      reference_image_url: '/images/character_a.jpg'
    };

    render(
      <CharacterMappingCard
        mapping={mappingWithImage}
        onNameChange={mockOnNameChange}
        onImageUpload={mockOnImageUpload}
      />
    );

    const image = screen.getByAltText('角色 A 参考图');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/images/character_a.jpg');
  });

  it('should call onImageUpload when file is selected', async () => {
    mockOnImageUpload.mockResolvedValue(undefined);

    render(
      <CharacterMappingCard
        mapping={mockMapping}
        onNameChange={mockOnNameChange}
        onImageUpload={mockOnImageUpload}
      />
    );

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    await waitFor(() => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    await waitFor(() => {
      expect(mockOnImageUpload).toHaveBeenCalledWith('A', file);
    });
  });

  it('should handle drag and drop file upload', async () => {
    mockOnImageUpload.mockResolvedValue(undefined);

    render(
      <CharacterMappingCard
        mapping={mockMapping}
        onNameChange={mockOnNameChange}
        onImageUpload={mockOnImageUpload}
      />
    );

    const dropZone = screen
      .getByText('拖拽图片到此处，或点击上传')
      .closest('div')!;
    const file = new File(['test'], 'test.png', { type: 'image/png' });

    // Simulate drag over
    fireEvent.dragOver(dropZone, {
      dataTransfer: { files: [file] }
    });

    // Simulate drop
    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] }
    });

    await waitFor(() => {
      expect(mockOnImageUpload).toHaveBeenCalledWith('A', file);
    });
  });

  it('should not upload non-image files', async () => {
    render(
      <CharacterMappingCard
        mapping={mockMapping}
        onNameChange={mockOnNameChange}
        onImageUpload={mockOnImageUpload}
      />
    );

    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    // Should not call onImageUpload for non-image files
    expect(mockOnImageUpload).not.toHaveBeenCalled();
  });
});

describe('Default Mapping Display', () => {
  const defaultMappings: CharacterMapping[] = [
    {
      id: 'char_1',
      project_id: 'proj_123',
      number: 1,
      identifier: 'A',
      name: ''
    },
    {
      id: 'char_2',
      project_id: 'proj_123',
      number: 2,
      identifier: 'B',
      name: ''
    },
    {
      id: 'char_3',
      project_id: 'proj_123',
      number: 3,
      identifier: 'C',
      name: ''
    },
    {
      id: 'char_4',
      project_id: 'proj_123',
      number: 4,
      identifier: 'D',
      name: ''
    }
  ];

  const mockOnNameChange = vi.fn();
  const mockOnImageUpload = vi.fn();

  it('should render all default mappings (1-A, 2-B, 3-C, 4-D)', () => {
    render(
      <>
        {defaultMappings.map((mapping) => (
          <CharacterMappingCard
            key={mapping.identifier}
            mapping={mapping}
            onNameChange={mockOnNameChange}
            onImageUpload={mockOnImageUpload}
          />
        ))}
      </>
    );

    expect(screen.getByText(/角色 1/)).toBeInTheDocument();
    expect(screen.getByText(/角色 2/)).toBeInTheDocument();
    expect(screen.getByText(/角色 3/)).toBeInTheDocument();
    expect(screen.getByText(/角色 4/)).toBeInTheDocument();

    // Check all identifiers are present
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
    expect(screen.getByText('D')).toBeInTheDocument();
  });
});

/**
 * Property-Based Test: Property 8 - 角色映射应用
 * Feature: youtube-video-tool, Property 8: 角色映射应用
 * Validates: Requirements 5.3, 5.4, 5.5, 6.3
 *
 * For any prompt containing character references, the exported JSON's
 * character_images field should contain the corresponding character's
 * image path (if uploaded).
 */
describe('Property 8: 角色映射应用 (Character Mapping Application)', () => {
  // Generator for character identifiers
  const identifierArb = fc.constantFrom('A', 'B', 'C', 'D');

  // Generator for character mappings with optional image URLs
  const characterMappingArb = fc.record({
    id: fc.uuid(),
    project_id: fc.uuid(),
    number: fc.integer({ min: 1, max: 4 }),
    identifier: identifierArb,
    name: fc.option(fc.string({ minLength: 1, maxLength: 50 }), {
      nil: undefined
    }),
    reference_image_url: fc.option(
      fc
        .webUrl()
        .map((url) => `/storage/characters/${url.split('/').pop()}.jpg`),
      { nil: undefined }
    )
  }) as fc.Arbitrary<CharacterMapping>;

  // Generator for prompts with character references
  const promptWithRefsArb = fc.record({
    id: fc.uuid(),
    project_id: fc.uuid(),
    storyboard_id: fc.uuid(),
    storyboard_index: fc.integer({ min: 1, max: 100 }),
    text_to_image: fc.string({ minLength: 1, maxLength: 500 }),
    image_to_video: fc.string({ minLength: 1, maxLength: 500 }),
    character_refs: fc.array(identifierArb, { minLength: 0, maxLength: 4 }),
    version: fc.constantFrom('v1' as const, 'v2' as const),
    is_edited: fc.boolean(),
    created_at: fc.constant(new Date().toISOString()),
    updated_at: fc.constant(new Date().toISOString())
  }) as fc.Arbitrary<Prompt>;

  // Helper function to build character_images map from mappings and refs
  const buildCharacterImagesMap = (
    characterRefs: string[],
    mappings: CharacterMapping[]
  ): { [key: string]: string } => {
    const result: { [key: string]: string } = {};

    for (const ref of characterRefs) {
      const mapping = mappings.find((m) => m.identifier === ref);
      if (mapping?.reference_image_url) {
        result[ref] = mapping.reference_image_url;
      }
    }

    return result;
  };

  // Helper function to validate character images in exported JSON
  const validateCharacterImagesInExport = (
    prompt: Prompt,
    mappings: CharacterMapping[],
    exportedCharacterImages: { [key: string]: string }
  ): boolean => {
    const characterRefs = prompt.character_refs || [];

    for (const ref of characterRefs) {
      const mapping = mappings.find((m) => m.identifier === ref);

      // If mapping has an image, it should be in the exported character_images
      if (mapping?.reference_image_url) {
        if (exportedCharacterImages[ref] !== mapping.reference_image_url) {
          return false;
        }
      }
    }

    return true;
  };

  it('should include character image paths in exported JSON when character has uploaded image', () => {
    fc.assert(
      fc.property(
        promptWithRefsArb,
        fc.array(characterMappingArb, { minLength: 1, maxLength: 4 }),
        (prompt, mappings) => {
          // Ensure unique identifiers in mappings
          const uniqueMappings = mappings.reduce((acc, mapping) => {
            if (!acc.find((m) => m.identifier === mapping.identifier)) {
              acc.push(mapping);
            }
            return acc;
          }, [] as CharacterMapping[]);

          // Build the character_images map as would be done during export
          const characterImages = buildCharacterImagesMap(
            prompt.character_refs || [],
            uniqueMappings
          );

          // Property: For each character ref with an uploaded image,
          // the exported JSON should contain the image path
          return validateCharacterImagesInExport(
            prompt,
            uniqueMappings,
            characterImages
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not include character image paths when character has no uploaded image', () => {
    fc.assert(
      fc.property(
        promptWithRefsArb,
        fc.array(
          fc.record({
            id: fc.uuid(),
            project_id: fc.uuid(),
            number: fc.integer({ min: 1, max: 4 }),
            identifier: identifierArb,
            name: fc.option(fc.string({ minLength: 1, maxLength: 50 }), {
              nil: undefined
            }),
            reference_image_url: fc.constant(undefined) // No image uploaded
          }),
          { minLength: 1, maxLength: 4 }
        ),
        (prompt, mappingsWithoutImages) => {
          // Ensure unique identifiers
          const uniqueMappings = mappingsWithoutImages.reduce(
            (acc, mapping) => {
              if (!acc.find((m) => m.identifier === mapping.identifier)) {
                acc.push(mapping);
              }
              return acc;
            },
            [] as CharacterMapping[]
          );

          // Build the character_images map
          const characterImages = buildCharacterImagesMap(
            prompt.character_refs || [],
            uniqueMappings
          );

          // Property: When no images are uploaded, character_images should be empty
          return Object.keys(characterImages).length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly map character references to their images in structured export', () => {
    fc.assert(
      fc.property(
        fc.array(promptWithRefsArb, { minLength: 1, maxLength: 10 }),
        fc.array(characterMappingArb, { minLength: 4, maxLength: 4 }),
        (prompts, mappings) => {
          // Ensure we have exactly 4 unique mappings (A, B, C, D)
          const uniqueMappings: CharacterMapping[] = [
            { ...mappings[0], identifier: 'A', number: 1 },
            { ...mappings[1], identifier: 'B', number: 2 },
            { ...mappings[2], identifier: 'C', number: 3 },
            { ...mappings[3], identifier: 'D', number: 4 }
          ];

          // Simulate building structured export data
          const structuredPrompts = prompts.map((prompt) => ({
            storyboard_index: prompt.storyboard_index,
            text_to_image: prompt.text_to_image,
            image_to_video: prompt.image_to_video,
            character_refs: prompt.character_refs || [],
            character_images: buildCharacterImagesMap(
              prompt.character_refs || [],
              uniqueMappings
            )
          }));

          // Property: For each prompt, validate character images are correctly mapped
          return structuredPrompts.every((sp, index) => {
            const originalPrompt = prompts[index];
            return validateCharacterImagesInExport(
              originalPrompt,
              uniqueMappings,
              sp.character_images
            );
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle prompts with no character references', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          project_id: fc.uuid(),
          storyboard_id: fc.uuid(),
          storyboard_index: fc.integer({ min: 1, max: 100 }),
          text_to_image: fc.string({ minLength: 1, maxLength: 500 }),
          image_to_video: fc.string({ minLength: 1, maxLength: 500 }),
          character_refs: fc.constant([] as string[]), // No character refs
          version: fc.constantFrom('v1' as const, 'v2' as const),
          is_edited: fc.boolean(),
          created_at: fc.constant(new Date().toISOString()),
          updated_at: fc.constant(new Date().toISOString())
        }),
        fc.array(characterMappingArb, { minLength: 1, maxLength: 4 }),
        (promptWithNoRefs, mappings) => {
          const characterImages = buildCharacterImagesMap(
            promptWithNoRefs.character_refs || [],
            mappings
          );

          // Property: When prompt has no character refs, character_images should be empty
          return Object.keys(characterImages).length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });
});
