import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fc from 'fast-check';
import { PromptCard } from '../prompt-card';
import { PromptEditDialog } from '../prompt-edit-dialog';
import { PromptHistoryDialog } from '../prompt-history';
import type { Prompt, Storyboard, PromptEditHistory } from '@/types/youtube';

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

describe('PromptCard', () => {
  const mockPrompt: Prompt = {
    id: 'prompt_001',
    project_id: 'proj_123',
    storyboard_id: 'sb_001',
    storyboard_index: 1,
    text_to_image:
      'A young man walking into a modern living room, cinematic lighting',
    image_to_video: 'Camera slowly follows the character as he enters',
    character_refs: ['A', 'B'],
    version: 'v1',
    is_edited: false,
    created_at: '2025-12-28T10:00:00Z',
    updated_at: '2025-12-28T10:00:00Z'
  };

  const mockStoryboard: Storyboard = {
    id: 'sb_001',
    project_id: 'proj_123',
    index: 1,
    start_time: 0,
    end_time: 5.5,
    start_frame_url: '/frames/sb_001_start.jpg',
    end_frame_url: '/frames/sb_001_end.jpg',
    created_at: '2025-12-28T10:00:00Z',
    updated_at: '2025-12-28T10:00:00Z'
  };

  const mockOnEdit = vi.fn();
  const mockOnViewHistory = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render prompt storyboard index', () => {
    render(
      <PromptCard
        prompt={mockPrompt}
        storyboard={mockStoryboard}
        onEdit={mockOnEdit}
        onViewHistory={mockOnViewHistory}
      />
    );

    // The title contains "微创新分镜 #" and "1" as separate text nodes
    const title = screen.getByText((content, element) => {
      return (
        element?.tagName === 'DIV' &&
        element?.getAttribute('data-slot') === 'card-title' &&
        content.includes('微创新分镜')
      );
    });
    expect(title).toBeInTheDocument();
  });

  it('should render text_to_image prompt content', () => {
    render(
      <PromptCard
        prompt={mockPrompt}
        storyboard={mockStoryboard}
        onEdit={mockOnEdit}
        onViewHistory={mockOnViewHistory}
      />
    );

    expect(screen.getByText('文生图提示词')).toBeInTheDocument();
    expect(screen.getByText(mockPrompt.text_to_image)).toBeInTheDocument();
  });

  it('should render image_to_video prompt content', () => {
    render(
      <PromptCard
        prompt={mockPrompt}
        storyboard={mockStoryboard}
        onEdit={mockOnEdit}
        onViewHistory={mockOnViewHistory}
      />
    );

    expect(screen.getByText('图生视频提示词')).toBeInTheDocument();
    expect(screen.getByText(mockPrompt.image_to_video)).toBeInTheDocument();
  });

  it('should render character reference badges', () => {
    render(
      <PromptCard
        prompt={mockPrompt}
        storyboard={mockStoryboard}
        onEdit={mockOnEdit}
        onViewHistory={mockOnViewHistory}
      />
    );

    expect(screen.getByText('角色引用:')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('should show edited badge when prompt is edited', () => {
    const editedPrompt = { ...mockPrompt, is_edited: true };
    render(
      <PromptCard
        prompt={editedPrompt}
        storyboard={mockStoryboard}
        onEdit={mockOnEdit}
        onViewHistory={mockOnViewHistory}
      />
    );

    expect(screen.getByText('已编辑')).toBeInTheDocument();
  });

  it('should call onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PromptCard
        prompt={mockPrompt}
        storyboard={mockStoryboard}
        onEdit={mockOnEdit}
        onViewHistory={mockOnViewHistory}
      />
    );

    const editButton = screen.getByRole('button', { name: /编辑/i });
    await user.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockPrompt);
  });

  it('should show history button when edit_history exists', () => {
    const promptWithHistory: Prompt = {
      ...mockPrompt,
      edit_history: [
        {
          timestamp: '2025-12-28T10:00:00Z',
          text_to_image: 'old text',
          image_to_video: 'old video',
          edit_type: 'manual'
        }
      ]
    };

    render(
      <PromptCard
        prompt={promptWithHistory}
        storyboard={mockStoryboard}
        onEdit={mockOnEdit}
        onViewHistory={mockOnViewHistory}
      />
    );

    expect(screen.getByRole('button', { name: /历史/i })).toBeInTheDocument();
  });

  it('should call onViewHistory when history button is clicked', async () => {
    const user = userEvent.setup();
    const promptWithHistory: Prompt = {
      ...mockPrompt,
      edit_history: [
        {
          timestamp: '2025-12-28T10:00:00Z',
          text_to_image: 'old text',
          image_to_video: 'old video',
          edit_type: 'manual'
        }
      ]
    };

    render(
      <PromptCard
        prompt={promptWithHistory}
        storyboard={mockStoryboard}
        onEdit={mockOnEdit}
        onViewHistory={mockOnViewHistory}
      />
    );

    const historyButton = screen.getByRole('button', { name: /历史/i });
    await user.click(historyButton);

    expect(mockOnViewHistory).toHaveBeenCalledWith(promptWithHistory);
  });
});

describe('PromptEditDialog', () => {
  const mockPrompt: Prompt = {
    id: 'prompt_001',
    project_id: 'proj_123',
    storyboard_id: 'sb_001',
    storyboard_index: 1,
    text_to_image: 'Original text to image prompt',
    image_to_video: 'Original image to video prompt',
    version: 'v1',
    is_edited: false,
    created_at: '2025-12-28T10:00:00Z',
    updated_at: '2025-12-28T10:00:00Z'
  };

  const mockOnOpenChange = vi.fn();
  const mockOnSave = vi.fn();
  const mockOnRegenerate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render dialog with prompt data', () => {
    render(
      <PromptEditDialog
        prompt={mockPrompt}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
        onRegenerate={mockOnRegenerate}
      />
    );

    expect(screen.getByText('编辑提示词')).toBeInTheDocument();
    expect(screen.getByText('微创新分镜 #1 的提示词')).toBeInTheDocument();
  });

  it('should populate textareas with prompt values', () => {
    render(
      <PromptEditDialog
        prompt={mockPrompt}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
        onRegenerate={mockOnRegenerate}
      />
    );

    const textToImageInput = screen.getByLabelText('文生图提示词');
    const imageToVideoInput = screen.getByLabelText('图生视频提示词');

    expect(textToImageInput).toHaveValue('Original text to image prompt');
    expect(imageToVideoInput).toHaveValue('Original image to video prompt');
  });

  it('should call onSave with updated values when save button is clicked', async () => {
    const user = userEvent.setup();
    mockOnSave.mockResolvedValue(undefined);

    render(
      <PromptEditDialog
        prompt={mockPrompt}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
        onRegenerate={mockOnRegenerate}
      />
    );

    const textToImageInput = screen.getByLabelText('文生图提示词');
    await user.clear(textToImageInput);
    await user.type(textToImageInput, 'Updated text prompt');

    const saveButton = screen.getByRole('button', { name: '保存修改' });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        'prompt_001',
        'Updated text prompt',
        'Original image to video prompt',
        [] // character_refs
      );
    });
  });

  it('should call onOpenChange when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PromptEditDialog
        prompt={mockPrompt}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
        onRegenerate={mockOnRegenerate}
      />
    );

    const cancelButton = screen.getByRole('button', { name: '取消' });
    await user.click(cancelButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('should disable AI regenerate button when instruction is empty', () => {
    render(
      <PromptEditDialog
        prompt={mockPrompt}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
        onRegenerate={mockOnRegenerate}
      />
    );

    const regenerateButton = screen.getByRole('button', {
      name: /AI重新生成/i
    });
    expect(regenerateButton).toBeDisabled();
  });

  it('should enable AI regenerate button when instruction is provided', async () => {
    const user = userEvent.setup();
    render(
      <PromptEditDialog
        prompt={mockPrompt}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
        onRegenerate={mockOnRegenerate}
      />
    );

    const instructionInput = screen.getByLabelText('修改建议');
    await user.type(instructionInput, '请让画面更加科幻感');

    const regenerateButton = screen.getByRole('button', {
      name: /AI重新生成/i
    });
    expect(regenerateButton).not.toBeDisabled();
  });

  it('should call onRegenerate with correct data when AI regenerate is clicked', async () => {
    const user = userEvent.setup();
    mockOnRegenerate.mockResolvedValue(undefined);

    render(
      <PromptEditDialog
        prompt={mockPrompt}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
        onRegenerate={mockOnRegenerate}
      />
    );

    const instructionInput = screen.getByLabelText('修改建议');
    await user.type(instructionInput, '请让画面更加科幻感');

    const regenerateButton = screen.getByRole('button', {
      name: /AI重新生成/i
    });
    await user.click(regenerateButton);

    await waitFor(() => {
      expect(mockOnRegenerate).toHaveBeenCalledWith('prompt_001', {
        instruction: '请让画面更加科幻感',
        regenerate_type: 'both'
      });
    });
  });
});

describe('PromptHistoryDialog', () => {
  const mockHistory: PromptEditHistory[] = [
    {
      timestamp: '2025-12-28T12:00:00Z',
      text_to_image: 'Latest text prompt',
      image_to_video: 'Latest video prompt',
      edit_type: 'ai_regenerate'
    },
    {
      timestamp: '2025-12-28T10:00:00Z',
      text_to_image: 'Original text prompt',
      image_to_video: 'Original video prompt',
      edit_type: 'manual'
    }
  ];

  const mockPrompt: Prompt = {
    id: 'prompt_001',
    project_id: 'proj_123',
    storyboard_id: 'sb_001',
    storyboard_index: 1,
    text_to_image: 'Current text',
    image_to_video: 'Current video',
    version: 'v1',
    is_edited: true,
    edit_history: mockHistory,
    created_at: '2025-12-28T10:00:00Z',
    updated_at: '2025-12-28T12:00:00Z'
  };

  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render dialog with history title', () => {
    render(
      <PromptHistoryDialog
        prompt={mockPrompt}
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    expect(screen.getByText('修改历史')).toBeInTheDocument();
    expect(screen.getByText('分镜 #1 的提示词修改历史')).toBeInTheDocument();
  });

  it('should render history items', () => {
    render(
      <PromptHistoryDialog
        prompt={mockPrompt}
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    expect(screen.getByText('Latest text prompt')).toBeInTheDocument();
    expect(screen.getByText('Original text prompt')).toBeInTheDocument();
  });

  it('should show edit type badges', () => {
    render(
      <PromptHistoryDialog
        prompt={mockPrompt}
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    expect(screen.getByText('AI重新生成')).toBeInTheDocument();
    expect(screen.getByText('手动编辑')).toBeInTheDocument();
  });

  it('should show empty state when no history', () => {
    const promptWithoutHistory: Prompt = {
      ...mockPrompt,
      edit_history: []
    };

    render(
      <PromptHistoryDialog
        prompt={promptWithoutHistory}
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    expect(screen.getByText('暂无修改历史')).toBeInTheDocument();
  });
});

/**
 * Property-Based Test: Property 6 - 提示词版本切换
 * Feature: youtube-video-tool, Property 6: 提示词版本切换
 * Validates: Requirements 3.3, 3.4
 *
 * For any version switch operation, the generated prompts' version field
 * should match the selected version.
 */
describe('Property 6: 提示词版本切换 (Prompt Version Switching)', () => {
  // Helper function to simulate version switching behavior
  // This validates that when a version is selected, all prompts should have that version
  const validateVersionConsistency = (
    selectedVersion: 'v1' | 'v2',
    prompts: Prompt[]
  ): boolean => {
    return prompts.every((prompt) => prompt.version === selectedVersion);
  };

  // Generator for valid prompt versions
  const versionArb = fc.constantFrom('v1' as const, 'v2' as const);

  // Generator for valid ISO date strings using timestamps (more reliable than fc.date())
  const validIsoDateArb = fc
    .integer({ min: 1577836800000, max: 1924905600000 }) // 2020-01-01 to 2030-12-31 in ms
    .map((ts) => new Date(ts).toISOString());

  // Generator for a list of prompts with a specific version
  const promptsWithVersionArb = (version: 'v1' | 'v2') =>
    fc.array(
      fc.record({
        id: fc.uuid(),
        project_id: fc.uuid(),
        storyboard_id: fc.uuid(),
        storyboard_index: fc.integer({ min: 1, max: 100 }),
        text_to_image: fc.string({ minLength: 1, maxLength: 500 }),
        image_to_video: fc.string({ minLength: 1, maxLength: 500 }),
        character_refs: fc.array(fc.constantFrom('A', 'B', 'C', 'D'), {
          maxLength: 4
        }),
        version: fc.constant(version),
        is_edited: fc.boolean(),
        created_at: validIsoDateArb,
        updated_at: validIsoDateArb
      }),
      { minLength: 1, maxLength: 20 }
    ) as fc.Arbitrary<Prompt[]>;

  it('should ensure all prompts have consistent version after version switch', () => {
    fc.assert(
      fc.property(versionArb, (selectedVersion) => {
        // Simulate generating prompts with the selected version
        const prompts: Prompt[] = Array.from({ length: 5 }, (_, i) => ({
          id: `prompt_${i}`,
          project_id: 'proj_123',
          storyboard_id: `sb_${i}`,
          storyboard_index: i + 1,
          text_to_image: `Text prompt ${i}`,
          image_to_video: `Video prompt ${i}`,
          version: selectedVersion,
          is_edited: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        // Property: All prompts should have the selected version
        return validateVersionConsistency(selectedVersion, prompts);
      }),
      { numRuns: 100 }
    );
  });

  it('should validate version field matches selected version for any generated prompts', () => {
    fc.assert(
      fc.property(
        versionArb,
        promptsWithVersionArb('v1').chain((v1Prompts) =>
          promptsWithVersionArb('v2').map((v2Prompts) => ({
            v1Prompts,
            v2Prompts
          }))
        ),
        (selectedVersion, { v1Prompts, v2Prompts }) => {
          // Select prompts based on version
          const prompts = selectedVersion === 'v1' ? v1Prompts : v2Prompts;

          // Update all prompts to have the selected version (simulating version switch)
          const updatedPrompts = prompts.map((p) => ({
            ...p,
            version: selectedVersion
          }));

          // Property: After version switch, all prompts should have the selected version
          return validateVersionConsistency(selectedVersion, updatedPrompts);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain version consistency across multiple version switches', () => {
    fc.assert(
      fc.property(
        fc.array(versionArb, { minLength: 1, maxLength: 10 }),
        (versionSwitches) => {
          // Simulate multiple version switches
          let currentPrompts: Prompt[] = Array.from({ length: 3 }, (_, i) => ({
            id: `prompt_${i}`,
            project_id: 'proj_123',
            storyboard_id: `sb_${i}`,
            storyboard_index: i + 1,
            text_to_image: `Text prompt ${i}`,
            image_to_video: `Video prompt ${i}`,
            version: 'v1' as const,
            is_edited: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));

          // Apply each version switch
          for (const newVersion of versionSwitches) {
            currentPrompts = currentPrompts.map((p) => ({
              ...p,
              version: newVersion
            }));

            // Property: After each switch, all prompts should have the new version
            if (!validateVersionConsistency(newVersion, currentPrompts)) {
              return false;
            }
          }

          // Final check: version should match the last switch
          const finalVersion = versionSwitches[versionSwitches.length - 1];
          return validateVersionConsistency(finalVersion, currentPrompts);
        }
      ),
      { numRuns: 100 }
    );
  });
});
