import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StoryboardCard } from '../storyboard-card';
import { TimeAdjustDialog } from '../time-adjust-dialog';
import type { Storyboard } from '@/types/youtube';

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

describe('StoryboardCard', () => {
  const mockStoryboard: Storyboard = {
    id: 'sb_001',
    project_id: 'proj_123',
    index: 1,
    start_time: 0,
    end_time: 5.5,
    start_frame_url: '/frames/sb_001_start.jpg',
    end_frame_url: '/frames/sb_001_end.jpg',
    description: '主角走进房间',
    created_at: '2025-12-28T10:00:00Z',
    updated_at: '2025-12-28T10:00:00Z'
  };

  const mockOnSaveDescription = vi.fn();
  const mockOnAdjustTime = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render storyboard index and time range', () => {
    render(
      <StoryboardCard
        storyboard={mockStoryboard}
        onSaveDescription={mockOnSaveDescription}
        onAdjustTime={mockOnAdjustTime}
      />
    );

    expect(screen.getByText('分镜 #1')).toBeInTheDocument();
    expect(screen.getByText('00:00 - 00:05')).toBeInTheDocument();
  });

  it('should render description in textarea', () => {
    render(
      <StoryboardCard
        storyboard={mockStoryboard}
        onSaveDescription={mockOnSaveDescription}
        onAdjustTime={mockOnAdjustTime}
      />
    );

    const textarea = screen.getByPlaceholderText('请输入该分镜的内容描述...');
    expect(textarea).toHaveValue('主角走进房间');
  });

  it('should enable save button when description changes', async () => {
    const user = userEvent.setup();
    render(
      <StoryboardCard
        storyboard={mockStoryboard}
        onSaveDescription={mockOnSaveDescription}
        onAdjustTime={mockOnAdjustTime}
      />
    );

    const textarea = screen.getByPlaceholderText('请输入该分镜的内容描述...');
    const saveButton = screen.getByRole('button', { name: /保存/i });

    // Initially disabled
    expect(saveButton).toBeDisabled();

    // Type new description
    await user.clear(textarea);
    await user.type(textarea, '新的描述内容');

    // Now enabled
    expect(saveButton).not.toBeDisabled();
  });

  it('should call onSaveDescription when save button is clicked', async () => {
    const user = userEvent.setup();
    mockOnSaveDescription.mockResolvedValue(undefined);

    render(
      <StoryboardCard
        storyboard={mockStoryboard}
        onSaveDescription={mockOnSaveDescription}
        onAdjustTime={mockOnAdjustTime}
      />
    );

    const textarea = screen.getByPlaceholderText('请输入该分镜的内容描述...');
    await user.clear(textarea);
    await user.type(textarea, '新的描述');

    const saveButton = screen.getByRole('button', { name: /保存/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockOnSaveDescription).toHaveBeenCalledWith('sb_001', '新的描述');
    });
  });

  it('should call onAdjustTime when time button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <StoryboardCard
        storyboard={mockStoryboard}
        onSaveDescription={mockOnSaveDescription}
        onAdjustTime={mockOnAdjustTime}
      />
    );

    const timeButton = screen.getByText('00:00 - 00:05');
    await user.click(timeButton);

    expect(mockOnAdjustTime).toHaveBeenCalledWith(mockStoryboard);
  });

  it('should render placeholder images when frame URLs are missing', () => {
    const storyboardWithoutFrames: Storyboard = {
      ...mockStoryboard,
      start_frame_url: '',
      end_frame_url: ''
    };

    render(
      <StoryboardCard
        storyboard={storyboardWithoutFrames}
        onSaveDescription={mockOnSaveDescription}
        onAdjustTime={mockOnAdjustTime}
      />
    );

    // Should show placeholder icons instead of images
    expect(screen.getByText('首帧')).toBeInTheDocument();
    expect(screen.getByText('尾帧')).toBeInTheDocument();
  });
});

describe('TimeAdjustDialog', () => {
  const mockStoryboard: Storyboard = {
    id: 'sb_001',
    project_id: 'proj_123',
    index: 1,
    start_time: 30,
    end_time: 45.5,
    start_frame_url: '/frames/sb_001_start.jpg',
    end_frame_url: '/frames/sb_001_end.jpg',
    created_at: '2025-12-28T10:00:00Z',
    updated_at: '2025-12-28T10:00:00Z'
  };

  const mockOnOpenChange = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render dialog with storyboard time values', () => {
    render(
      <TimeAdjustDialog
        storyboard={mockStoryboard}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('调整分镜时间')).toBeInTheDocument();
    expect(screen.getByText('分镜 #1 的时间范围')).toBeInTheDocument();

    const startInput = screen.getByLabelText('开始时间');
    const endInput = screen.getByLabelText('结束时间');

    expect(startInput).toHaveValue('00:30.0');
    expect(endInput).toHaveValue('00:45.5');
  });

  it('should show validation error for invalid time format', async () => {
    const user = userEvent.setup();
    render(
      <TimeAdjustDialog
        storyboard={mockStoryboard}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    const startInput = screen.getByLabelText('开始时间');
    await user.clear(startInput);
    await user.type(startInput, 'invalid');

    const saveButton = screen.getByRole('button', { name: '保存' });
    await user.click(saveButton);

    await waitFor(() => {
      expect(
        screen.getByText('请输入有效的时间格式 (MM:SS.ms)')
      ).toBeInTheDocument();
    });
  });

  it('should show validation error when end time is less than start time', async () => {
    const user = userEvent.setup();
    render(
      <TimeAdjustDialog
        storyboard={mockStoryboard}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    const startInput = screen.getByLabelText('开始时间');
    const endInput = screen.getByLabelText('结束时间');

    await user.clear(startInput);
    await user.type(startInput, '01:00.0');
    await user.clear(endInput);
    await user.type(endInput, '00:30.0');

    const saveButton = screen.getByRole('button', { name: '保存' });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('结束时间必须大于开始时间')).toBeInTheDocument();
    });
  });

  it('should call onSave with correct values when form is valid', async () => {
    const user = userEvent.setup();
    mockOnSave.mockResolvedValue(undefined);

    render(
      <TimeAdjustDialog
        storyboard={mockStoryboard}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    const startInput = screen.getByLabelText('开始时间');
    const endInput = screen.getByLabelText('结束时间');

    await user.clear(startInput);
    await user.type(startInput, '01:00.0');
    await user.clear(endInput);
    await user.type(endInput, '01:30.0');

    const saveButton = screen.getByRole('button', { name: '保存' });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith('sb_001', 60, 90);
    });
  });

  it('should call onOpenChange when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TimeAdjustDialog
        storyboard={mockStoryboard}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    const cancelButton = screen.getByRole('button', { name: '取消' });
    await user.click(cancelButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });
});
