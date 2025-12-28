import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectCard } from '../project-card';
import {
  CreateProjectDialog,
  validateYoutubeUrl
} from '../create-project-dialog';
import type { VideoProject } from '@/types/youtube';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn()
  }),
  useSearchParams: () => ({
    get: vi.fn().mockReturnValue(null),
    toString: vi.fn().mockReturnValue('')
  })
}));

// Mock the API functions
vi.mock('@/lib/api/youtube', () => ({
  createProject: vi.fn(),
  getProjects: vi.fn(),
  deleteProject: vi.fn()
}));

// Mock the toast hook
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
    toasts: [],
    dismiss: vi.fn()
  })
}));

describe('YouTube URL Validation', () => {
  it('should accept valid youtube.com URLs', () => {
    expect(
      validateYoutubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    ).toBe(true);
    expect(validateYoutubeUrl('https://youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
      true
    );
    expect(
      validateYoutubeUrl('http://www.youtube.com/watch?v=dQw4w9WgXcQ')
    ).toBe(true);
  });

  it('should accept valid youtu.be URLs', () => {
    expect(validateYoutubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
    expect(validateYoutubeUrl('http://youtu.be/dQw4w9WgXcQ')).toBe(true);
  });

  it('should accept URLs with additional parameters', () => {
    expect(
      validateYoutubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=120')
    ).toBe(true);
  });

  it('should reject invalid URLs', () => {
    expect(validateYoutubeUrl('https://vimeo.com/123456')).toBe(false);
    expect(validateYoutubeUrl('not a url')).toBe(false);
    expect(validateYoutubeUrl('')).toBe(false);
    expect(validateYoutubeUrl('https://youtube.com/watch?v=short')).toBe(false); // ID too short
  });
});

describe('ProjectCard', () => {
  const mockProject: VideoProject = {
    id: 'proj_123',
    name: '测试项目',
    youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    status: 'created',
    created_at: '2025-12-28T10:00:00Z',
    updated_at: '2025-12-28T10:00:00Z',
    source_storyboard_count: 15,
    innovation_storyboard_count: 12
  };

  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render project name and status', () => {
    render(<ProjectCard project={mockProject} onDelete={mockOnDelete} />);

    expect(screen.getByText('测试项目')).toBeInTheDocument();
    expect(screen.getByText('已创建')).toBeInTheDocument();
  });

  it('should render storyboard counts', () => {
    render(<ProjectCard project={mockProject} onDelete={mockOnDelete} />);

    expect(screen.getByText('源视频: 15 个分镜')).toBeInTheDocument();
    expect(screen.getByText('微创新: 12 个分镜')).toBeInTheDocument();
  });

  it('should show "--" when storyboard counts are undefined', () => {
    const projectWithoutStoryboards = {
      ...mockProject,
      source_storyboard_count: undefined,
      innovation_storyboard_count: undefined
    };
    render(
      <ProjectCard
        project={projectWithoutStoryboards}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('源视频: --')).toBeInTheDocument();
    expect(screen.getByText('微创新: --')).toBeInTheDocument();
  });

  it('should navigate to project detail on card click', async () => {
    render(<ProjectCard project={mockProject} onDelete={mockOnDelete} />);

    const cardTitle = screen.getByText('测试项目');
    await userEvent.click(cardTitle);

    expect(mockPush).toHaveBeenCalledWith(
      '/dashboard/youtube/project/proj_123'
    );
  });

  it('should display different status badges correctly', () => {
    const statuses = [
      { status: 'completed', label: '已完成' },
      { status: 'failed', label: '失败' },
      { status: 'downloading', label: '下载中' }
    ] as const;

    statuses.forEach(({ status, label }) => {
      const { unmount } = render(
        <ProjectCard
          project={{ ...mockProject, status }}
          onDelete={mockOnDelete}
        />
      );
      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    });
  });
});

describe('CreateProjectDialog', () => {
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the create button', () => {
    render(<CreateProjectDialog onSuccess={mockOnSuccess} />);

    expect(
      screen.getByRole('button', { name: /创建项目/i })
    ).toBeInTheDocument();
  });

  it('should open dialog when button is clicked', async () => {
    render(<CreateProjectDialog onSuccess={mockOnSuccess} />);

    await userEvent.click(screen.getByRole('button', { name: /创建项目/i }));

    expect(screen.getByText('创建新项目')).toBeInTheDocument();
    expect(screen.getByLabelText(/项目名称/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/YouTube视频URL/i)).toBeInTheDocument();
  });

  it('should show validation error for empty project name', async () => {
    render(<CreateProjectDialog onSuccess={mockOnSuccess} />);

    await userEvent.click(screen.getByRole('button', { name: /创建项目/i }));

    // Try to submit without filling the form
    const submitButton = screen.getByRole('button', { name: '创建' });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('请输入项目名称')).toBeInTheDocument();
    });
  });

  it('should show validation error for invalid YouTube URL', async () => {
    render(<CreateProjectDialog onSuccess={mockOnSuccess} />);

    await userEvent.click(screen.getByRole('button', { name: /创建项目/i }));

    const nameInput = screen.getByLabelText(/项目名称/i);
    const urlInput = screen.getByLabelText(/YouTube视频URL/i);

    await userEvent.type(nameInput, '测试项目');
    await userEvent.type(urlInput, 'invalid-url');

    const submitButton = screen.getByRole('button', { name: '创建' });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('请输入有效的YouTube视频URL')
      ).toBeInTheDocument();
    });
  });

  it('should close dialog when cancel button is clicked', async () => {
    render(<CreateProjectDialog onSuccess={mockOnSuccess} />);

    await userEvent.click(screen.getByRole('button', { name: /创建项目/i }));
    expect(screen.getByText('创建新项目')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '取消' }));

    await waitFor(() => {
      expect(screen.queryByText('创建新项目')).not.toBeInTheDocument();
    });
  });
});
