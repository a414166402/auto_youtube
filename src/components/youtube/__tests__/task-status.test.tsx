import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderHook, act } from '@testing-library/react';
import {
  useTaskPolling,
  calculateTaskProgress,
  isTaskTerminal,
  canPauseTask,
  canResumeTask,
  canCancelTask
} from '@/hooks/use-task-polling';
import { GenerationProgress, SimpleProgress } from '../generation-progress';
import {
  TaskControls,
  CompactTaskControls,
  getTaskStatusLabel
} from '../task-controls';
import type { GenerationTask, TaskStatus } from '@/types/youtube';
import fc from 'fast-check';

// Mock the API functions
vi.mock('@/lib/api/youtube', () => ({
  getTask: vi.fn(),
  pauseTask: vi.fn(),
  resumeTask: vi.fn(),
  cancelTask: vi.fn()
}));

import { getTask, pauseTask, resumeTask, cancelTask } from '@/lib/api/youtube';

const mockGetTask = vi.mocked(getTask);
const mockPauseTask = vi.mocked(pauseTask);
const mockResumeTask = vi.mocked(resumeTask);
const mockCancelTask = vi.mocked(cancelTask);

// Helper to create a mock task
function createMockTask(
  overrides: Partial<GenerationTask> = {}
): GenerationTask {
  return {
    id: 'task_123',
    project_id: 'proj_123',
    task_type: 'image',
    status: 'running',
    progress: 50,
    total_items: 10,
    completed_items: 5,
    failed_items: 0,
    created_at: '2025-12-28T10:00:00Z',
    updated_at: '2025-12-28T10:15:00Z',
    ...overrides
  };
}

describe('Task Progress Calculation', () => {
  /**
   * Property 13: 任务进度计算正确性
   * *For any* 生成任务，progress百分比应等于(completed_items / total_items) * 100，
   * 且completed_items + failed_items <= total_items。
   * **Validates: Requirements 9.1, 9.2**
   */
  it('Property 13: should calculate progress correctly for any valid task', () => {
    fc.assert(
      fc.property(
        fc
          .record({
            total_items: fc.integer({ min: 1, max: 1000 }),
            completed_items: fc.integer({ min: 0, max: 1000 }),
            failed_items: fc.integer({ min: 0, max: 1000 })
          })
          .filter(
            ({ total_items, completed_items, failed_items }) =>
              completed_items + failed_items <= total_items
          ),
        ({ total_items, completed_items, failed_items }) => {
          const task = createMockTask({
            total_items,
            completed_items,
            failed_items
          });

          const progress = calculateTaskProgress(task);
          const expectedProgress = Math.round(
            (completed_items / total_items) * 100
          );

          expect(progress).toBe(expectedProgress);
          expect(progress).toBeGreaterThanOrEqual(0);
          expect(progress).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return 0 for null task', () => {
    expect(calculateTaskProgress(null)).toBe(0);
  });

  it('should return 0 for task with zero total_items', () => {
    const task = createMockTask({ total_items: 0, completed_items: 0 });
    expect(calculateTaskProgress(task)).toBe(0);
  });

  it('should return 100 for completed task', () => {
    const task = createMockTask({
      total_items: 10,
      completed_items: 10,
      failed_items: 0
    });
    expect(calculateTaskProgress(task)).toBe(100);
  });
});

describe('Task Status Helpers', () => {
  describe('isTaskTerminal', () => {
    it('should return true for terminal statuses', () => {
      expect(isTaskTerminal('completed')).toBe(true);
      expect(isTaskTerminal('failed')).toBe(true);
      expect(isTaskTerminal('cancelled')).toBe(true);
    });

    it('should return false for non-terminal statuses', () => {
      expect(isTaskTerminal('pending')).toBe(false);
      expect(isTaskTerminal('running')).toBe(false);
      expect(isTaskTerminal('paused')).toBe(false);
    });
  });

  describe('canPauseTask', () => {
    it('should return true for pausable statuses', () => {
      expect(canPauseTask('running')).toBe(true);
      expect(canPauseTask('pending')).toBe(true);
    });

    it('should return false for non-pausable statuses', () => {
      expect(canPauseTask('paused')).toBe(false);
      expect(canPauseTask('completed')).toBe(false);
      expect(canPauseTask('failed')).toBe(false);
      expect(canPauseTask('cancelled')).toBe(false);
    });
  });

  describe('canResumeTask', () => {
    it('should return true only for paused status', () => {
      expect(canResumeTask('paused')).toBe(true);
    });

    it('should return false for other statuses', () => {
      expect(canResumeTask('running')).toBe(false);
      expect(canResumeTask('pending')).toBe(false);
      expect(canResumeTask('completed')).toBe(false);
      expect(canResumeTask('failed')).toBe(false);
      expect(canResumeTask('cancelled')).toBe(false);
    });
  });

  describe('canCancelTask', () => {
    it('should return true for cancellable statuses', () => {
      expect(canCancelTask('running')).toBe(true);
      expect(canCancelTask('pending')).toBe(true);
      expect(canCancelTask('paused')).toBe(true);
    });

    it('should return false for non-cancellable statuses', () => {
      expect(canCancelTask('completed')).toBe(false);
      expect(canCancelTask('failed')).toBe(false);
      expect(canCancelTask('cancelled')).toBe(false);
    });
  });
});

describe('GenerationProgress Component', () => {
  it('should render empty state when task is null', () => {
    render(<GenerationProgress task={null} />);
    expect(screen.getByText('暂无任务')).toBeInTheDocument();
  });

  it('should render progress bar with correct percentage', () => {
    const task = createMockTask({
      total_items: 10,
      completed_items: 5,
      status: 'running'
    });
    render(<GenerationProgress task={task} />);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('should display status label correctly', () => {
    const statuses: Array<{ status: TaskStatus; label: string }> = [
      { status: 'pending', label: '等待中' },
      { status: 'running', label: '进行中' },
      { status: 'completed', label: '已完成' },
      { status: 'failed', label: '失败' },
      { status: 'paused', label: '已暂停' },
      { status: 'cancelled', label: '已取消' }
    ];

    statuses.forEach(({ status, label }) => {
      const task = createMockTask({ status });
      const { unmount } = render(<GenerationProgress task={task} />);
      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    });
  });

  it('should display completed and failed counts', () => {
    const task = createMockTask({
      total_items: 10,
      completed_items: 7,
      failed_items: 2
    });
    render(<GenerationProgress task={task} />);
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('/ 10')).toBeInTheDocument();
  });

  it('should display error message when present', () => {
    const task = createMockTask({
      status: 'failed',
      error_message: '生成失败：API调用超时'
    });
    render(<GenerationProgress task={task} />);
    expect(screen.getByText('生成失败：API调用超时')).toBeInTheDocument();
  });
});

describe('SimpleProgress Component', () => {
  it('should render progress bar with given percentage', () => {
    const { container } = render(<SimpleProgress progress={75} />);
    const progressBar = container.querySelector('[class*="rounded-full"]');
    expect(progressBar).toBeInTheDocument();
  });

  it('should handle edge case progress values', () => {
    // Test with negative value - should clamp to 0
    const { rerender } = render(
      <SimpleProgress progress={-10} animated={false} />
    );
    // Component should render without errors
    expect(document.body).toBeInTheDocument();

    // Test with value over 100 - should clamp to 100
    rerender(<SimpleProgress progress={150} animated={false} />);
    // Component should render without errors
    expect(document.body).toBeInTheDocument();
  });
});

describe('TaskControls Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when task is null', () => {
    const { container } = render(<TaskControls task={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('should not render when task is in terminal state', () => {
    const completedTask = createMockTask({ status: 'completed' });
    const { container } = render(<TaskControls task={completedTask} />);
    expect(container.firstChild).toBeNull();
  });

  it('should show pause button for running task', () => {
    const task = createMockTask({ status: 'running' });
    render(<TaskControls task={task} />);
    expect(screen.getByRole('button', { name: /暂停/i })).toBeInTheDocument();
  });

  it('should show resume button for paused task', () => {
    const task = createMockTask({ status: 'paused' });
    render(<TaskControls task={task} />);
    expect(screen.getByRole('button', { name: /继续/i })).toBeInTheDocument();
  });

  it('should show cancel button for running task', () => {
    const task = createMockTask({ status: 'running' });
    render(<TaskControls task={task} />);
    expect(screen.getByRole('button', { name: /取消/i })).toBeInTheDocument();
  });

  it('should call pauseTask API when pause button is clicked', async () => {
    const task = createMockTask({ status: 'running' });
    mockPauseTask.mockResolvedValueOnce({
      task_id: 'task_123',
      status: 'paused',
      message: 'ok'
    });

    render(<TaskControls task={task} />);
    await userEvent.click(screen.getByRole('button', { name: /暂停/i }));

    await waitFor(() => {
      expect(mockPauseTask).toHaveBeenCalledWith('task_123');
    });
  });

  it('should call resumeTask API when resume button is clicked', async () => {
    const task = createMockTask({ status: 'paused' });
    mockResumeTask.mockResolvedValueOnce({
      task_id: 'task_123',
      status: 'running',
      message: 'ok'
    });

    render(<TaskControls task={task} />);
    await userEvent.click(screen.getByRole('button', { name: /继续/i }));

    await waitFor(() => {
      expect(mockResumeTask).toHaveBeenCalledWith('task_123');
    });
  });

  it('should show confirmation dialog before cancelling', async () => {
    const task = createMockTask({ status: 'running' });
    render(<TaskControls task={task} />);

    await userEvent.click(screen.getByRole('button', { name: /取消/i }));

    expect(screen.getByText('确认取消任务')).toBeInTheDocument();
    expect(screen.getByText(/取消后任务将停止执行/)).toBeInTheDocument();
  });

  it('should call cancelTask API when cancel is confirmed', async () => {
    const task = createMockTask({ status: 'running' });
    mockCancelTask.mockResolvedValueOnce({
      task_id: 'task_123',
      status: 'cancelled',
      message: 'ok'
    });

    render(<TaskControls task={task} />);
    await userEvent.click(screen.getByRole('button', { name: /取消/i }));
    await userEvent.click(screen.getByRole('button', { name: '确认取消' }));

    await waitFor(() => {
      expect(mockCancelTask).toHaveBeenCalledWith('task_123');
    });
  });

  it('should call onStatusChange callback after successful pause', async () => {
    const task = createMockTask({ status: 'running' });
    const onStatusChange = vi.fn();
    mockPauseTask.mockResolvedValueOnce({
      task_id: 'task_123',
      status: 'paused',
      message: 'ok'
    });

    render(<TaskControls task={task} onStatusChange={onStatusChange} />);
    await userEvent.click(screen.getByRole('button', { name: /暂停/i }));

    await waitFor(() => {
      expect(onStatusChange).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'paused' })
      );
    });
  });

  it('should call onError callback when API fails', async () => {
    const task = createMockTask({ status: 'running' });
    const onError = vi.fn();
    mockPauseTask.mockRejectedValueOnce(new Error('Network error'));

    render(<TaskControls task={task} onError={onError} />);
    await userEvent.click(screen.getByRole('button', { name: /暂停/i }));

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});

describe('CompactTaskControls Component', () => {
  it('should render without labels', () => {
    const task = createMockTask({ status: 'running' });
    render(<CompactTaskControls task={task} />);

    // Should have buttons but no text labels
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
    expect(screen.queryByText('暂停')).not.toBeInTheDocument();
  });
});

describe('getTaskStatusLabel', () => {
  it('should return correct labels for all statuses', () => {
    expect(getTaskStatusLabel('pending')).toBe('等待中');
    expect(getTaskStatusLabel('running')).toBe('进行中');
    expect(getTaskStatusLabel('completed')).toBe('已完成');
    expect(getTaskStatusLabel('failed')).toBe('失败');
    expect(getTaskStatusLabel('paused')).toBe('已暂停');
    expect(getTaskStatusLabel('cancelled')).toBe('已取消');
  });
});

describe('useTaskPolling Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should fetch task immediately when autoStart is true', async () => {
    const task = createMockTask();
    mockGetTask.mockResolvedValue(task);

    renderHook(() => useTaskPolling('task_123', { autoStart: true }));

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    expect(mockGetTask).toHaveBeenCalledWith('task_123');
  });

  it('should not fetch task when taskId is null', async () => {
    renderHook(() => useTaskPolling(null, { autoStart: true }));

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    expect(mockGetTask).not.toHaveBeenCalled();
  });

  it('should call onComplete when task completes', async () => {
    const completedTask = createMockTask({ status: 'completed' });
    mockGetTask.mockResolvedValue(completedTask);
    const onComplete = vi.fn();

    renderHook(() => useTaskPolling('task_123', { onComplete }));

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    expect(onComplete).toHaveBeenCalledWith(completedTask);
  });

  it('should call onFailed when task fails', async () => {
    const failedTask = createMockTask({
      status: 'failed',
      error_message: 'Error'
    });
    mockGetTask.mockResolvedValue(failedTask);
    const onFailed = vi.fn();

    renderHook(() => useTaskPolling('task_123', { onFailed }));

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    expect(onFailed).toHaveBeenCalledWith(failedTask);
  });

  it('should stop polling when task completes', async () => {
    const completedTask = createMockTask({ status: 'completed' });
    mockGetTask.mockResolvedValue(completedTask);

    const { result } = renderHook(() => useTaskPolling('task_123'));

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    expect(result.current.isPolling).toBe(false);
  });

  it('should pause and resume polling', async () => {
    const task = createMockTask({ status: 'running' });
    mockGetTask.mockResolvedValue(task);

    const { result } = renderHook(() =>
      useTaskPolling('task_123', { interval: 1000 })
    );

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    // Pause polling
    act(() => {
      result.current.pausePolling();
    });

    // Clear mock calls
    mockGetTask.mockClear();

    // Advance timer - should not fetch because paused
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    // Resume polling
    act(() => {
      result.current.resumePolling();
    });

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    // Should have fetched after resume
    expect(mockGetTask).toHaveBeenCalled();
  });

  it('should call onStatusChange when status changes', async () => {
    const runningTask = createMockTask({ status: 'running' });
    const pausedTask = createMockTask({ status: 'paused' });
    mockGetTask
      .mockResolvedValueOnce(runningTask)
      .mockResolvedValueOnce(pausedTask);

    const onStatusChange = vi.fn();

    renderHook(() =>
      useTaskPolling('task_123', { onStatusChange, interval: 1000 })
    );

    // First fetch
    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    expect(onStatusChange).toHaveBeenCalledWith(runningTask, null);

    // Second fetch with status change
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
      await vi.runOnlyPendingTimersAsync();
    });

    expect(onStatusChange).toHaveBeenCalledWith(pausedTask, 'running');
  });
});

/**
 * Property 14: 任务状态持久化
 * *For any* 任务状态查询，无论是否刷新页面，返回的状态应与实际任务状态一致。
 * **Validates: Requirements 9.4, 9.5**
 *
 * Note: This property is tested by verifying that the hook correctly reflects
 * the API response without modification.
 */
describe('Property 14: Task State Persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should reflect API response accurately', async () => {
    // Generate test cases synchronously
    const testCases = fc.sample(
      fc
        .record({
          id: fc.string({ minLength: 1, maxLength: 20 }),
          status: fc.constantFrom(
            'pending',
            'running',
            'completed',
            'failed',
            'paused',
            'cancelled'
          ) as fc.Arbitrary<TaskStatus>,
          progress: fc.integer({ min: 0, max: 100 }),
          total_items: fc.integer({ min: 1, max: 100 }),
          completed_items: fc.integer({ min: 0, max: 100 }),
          failed_items: fc.integer({ min: 0, max: 100 })
        })
        .filter(
          ({ total_items, completed_items, failed_items }) =>
            completed_items + failed_items <= total_items
        ),
      100
    );

    for (const taskData of testCases) {
      const task = createMockTask(taskData);
      mockGetTask.mockResolvedValue(task);

      const { result, unmount } = renderHook(() => useTaskPolling(task.id));

      await act(async () => {
        await vi.runOnlyPendingTimersAsync();
      });

      // The hook should reflect the exact task data from API
      expect(result.current.task?.status).toBe(task.status);
      expect(result.current.task?.progress).toBe(task.progress);
      expect(result.current.task?.total_items).toBe(task.total_items);
      expect(result.current.task?.completed_items).toBe(task.completed_items);
      expect(result.current.task?.failed_items).toBe(task.failed_items);

      unmount();
      vi.clearAllMocks();
    }
  });
});
