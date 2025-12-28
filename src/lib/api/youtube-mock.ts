// Mock data for YouTube module - 用于本地开发调试
import type {
  VideoProject,
  Storyboard,
  Prompt,
  CharacterMapping,
  GeneratedImage,
  GeneratedVideo,
  GenerationTask,
  StructuredPromptData
} from '@/types/youtube';

// 模拟项目数据
export const mockProjects: VideoProject[] = [
  {
    id: 'proj_001',
    name: '科技产品评测视频',
    youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    status: 'completed',
    video_path: '/storage/videos/proj_001.mp4',
    thumbnail_url: 'https://picsum.photos/seed/proj1/320/180',
    duration: 332,
    created_at: '2025-12-25T10:00:00Z',
    updated_at: '2025-12-28T15:30:00Z',
    source_storyboard_count: 15,
    innovation_storyboard_count: 15,
    prompt_version: 'v1'
  },
  {
    id: 'proj_002',
    name: '旅行Vlog制作',
    youtube_url: 'https://www.youtube.com/watch?v=abc123xyz',
    status: 'generating_images',
    video_path: '/storage/videos/proj_002.mp4',
    thumbnail_url: 'https://picsum.photos/seed/proj2/320/180',
    duration: 485,
    created_at: '2025-12-26T14:00:00Z',
    updated_at: '2025-12-28T16:00:00Z',
    source_storyboard_count: 22,
    innovation_storyboard_count: 18,
    prompt_version: 'v2'
  },
  {
    id: 'proj_003',
    name: '美食教程',
    youtube_url: 'https://www.youtube.com/watch?v=food123',
    status: 'prompts_ready',
    thumbnail_url: 'https://picsum.photos/seed/proj3/320/180',
    duration: 245,
    created_at: '2025-12-27T09:00:00Z',
    updated_at: '2025-12-28T10:00:00Z',
    source_storyboard_count: 10,
    innovation_storyboard_count: 12,
    prompt_version: 'v1'
  },
  {
    id: 'proj_004',
    name: '健身训练指南',
    youtube_url: 'https://www.youtube.com/watch?v=fitness456',
    status: 'downloaded',
    thumbnail_url: 'https://picsum.photos/seed/proj4/320/180',
    duration: 600,
    created_at: '2025-12-28T08:00:00Z',
    updated_at: '2025-12-28T08:30:00Z',
    source_storyboard_count: 0,
    innovation_storyboard_count: undefined
  }
];

// 模拟分镜数据
export const mockStoryboards: Storyboard[] = Array.from(
  { length: 15 },
  (_, i) => ({
    id: `sb_${String(i + 1).padStart(3, '0')}`,
    project_id: 'proj_001',
    index: i + 1,
    start_time: i * 20,
    end_time: (i + 1) * 20 + 2,
    start_frame_url: `https://picsum.photos/seed/frame${i * 2}/400/225`,
    end_frame_url: `https://picsum.photos/seed/frame${i * 2 + 1}/400/225`,
    description:
      i % 3 === 0
        ? `分镜 ${i + 1} 的内容描述：主角在场景中进行动作...`
        : undefined,
    created_at: '2025-12-25T10:30:00Z',
    updated_at: '2025-12-28T12:00:00Z'
  })
);

// 模拟提示词数据
export const mockPrompts: Prompt[] = mockStoryboards.map((sb, i) => ({
  id: `prompt_${String(i + 1).padStart(3, '0')}`,
  project_id: 'proj_001',
  storyboard_id: sb.id,
  storyboard_index: sb.index,
  text_to_image: `A cinematic shot of a modern tech workspace, soft natural lighting from large windows, minimalist design with clean lines, 8K resolution, professional photography style, scene ${i + 1}`,
  image_to_video: `Camera slowly pans across the scene, revealing details of the environment, smooth motion, cinematic feel, 24fps, scene ${i + 1}`,
  character_refs: i % 4 === 0 ? ['A'] : i % 4 === 1 ? ['A', 'B'] : undefined,
  version: 'v1',
  is_edited: i % 5 === 0,
  edit_history:
    i % 5 === 0
      ? [
          {
            timestamp: '2025-12-27T14:00:00Z',
            text_to_image: 'Original text to image prompt...',
            image_to_video: 'Original image to video prompt...',
            edit_type: 'manual'
          }
        ]
      : undefined,
  created_at: '2025-12-26T10:00:00Z',
  updated_at: '2025-12-28T14:00:00Z'
}));

// 模拟角色映射
export const mockCharacterMappings: CharacterMapping[] = [
  {
    id: 'char_001',
    project_id: 'proj_001',
    number: 1,
    identifier: 'A',
    name: '主角 - 科技博主',
    reference_image_url: 'https://picsum.photos/seed/charA/200/200'
  },
  {
    id: 'char_002',
    project_id: 'proj_001',
    number: 2,
    identifier: 'B',
    name: '嘉宾',
    reference_image_url: 'https://picsum.photos/seed/charB/200/200'
  },
  {
    id: 'char_003',
    project_id: 'proj_001',
    number: 3,
    identifier: 'C',
    name: '助手'
  },
  {
    id: 'char_004',
    project_id: 'proj_001',
    number: 4,
    identifier: 'D',
    name: ''
  }
];

// 模拟生成的图片
export const mockGeneratedImages: GeneratedImage[] = mockStoryboards.flatMap(
  (sb, sbIndex) => {
    const imageCount = sbIndex < 10 ? 3 : sbIndex < 12 ? 2 : 0;
    return Array.from({ length: imageCount }, (_, imgIndex) => ({
      id: `img_${sb.id}_${imgIndex + 1}`,
      project_id: 'proj_001',
      prompt_id: `prompt_${String(sbIndex + 1).padStart(3, '0')}`,
      storyboard_index: sb.index,
      image_url: `https://picsum.photos/seed/gen${sbIndex}_${imgIndex}/512/512`,
      generation_type:
        sbIndex % 4 === 0 || sbIndex % 4 === 1
          ? 'image_text_to_image'
          : ('text_to_image' as const),
      is_selected: imgIndex === 0 && sbIndex < 8,
      created_at: '2025-12-28T10:00:00Z'
    }));
  }
);

// 模拟生成的视频
export const mockGeneratedVideos: GeneratedVideo[] = mockStoryboards
  .slice(0, 8)
  .flatMap((sb, sbIndex) => {
    const videoCount = sbIndex < 5 ? 2 : 1;
    return Array.from({ length: videoCount }, (_, vidIndex) => ({
      id: `vid_${sb.id}_${vidIndex + 1}`,
      project_id: 'proj_001',
      prompt_id: `prompt_${String(sbIndex + 1).padStart(3, '0')}`,
      storyboard_index: sb.index,
      source_image_id: `img_${sb.id}_1`,
      video_url: `https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4`,
      is_selected: vidIndex === 0 && sbIndex < 5,
      created_at: '2025-12-28T12:00:00Z'
    }));
  });

// 模拟生成任务
export const mockGenerationTask: GenerationTask = {
  id: 'task_img_001',
  project_id: 'proj_001',
  task_type: 'image',
  status: 'running',
  progress: 67,
  total_items: 15,
  completed_items: 10,
  failed_items: 0,
  created_at: '2025-12-28T10:00:00Z',
  updated_at: '2025-12-28T10:15:00Z'
};

// 模拟结构化提示词数据
export const mockStructuredPromptData: StructuredPromptData = {
  project_id: 'proj_001',
  project_name: '科技产品评测视频',
  total_innovation_storyboards: 15,
  character_mappings: mockCharacterMappings,
  prompts: mockPrompts.map((p) => ({
    storyboard_index: p.storyboard_index,
    text_to_image: p.text_to_image,
    image_to_video: p.image_to_video,
    character_refs: p.character_refs || [],
    character_images:
      p.character_refs?.reduce(
        (acc, ref) => {
          const char = mockCharacterMappings.find((c) => c.identifier === ref);
          if (char?.reference_image_url) {
            acc[ref] = char.reference_image_url;
          }
          return acc;
        },
        {} as Record<string, string>
      ) || {}
  }))
};

// 延迟函数，模拟网络请求
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock API 函数
export const mockYoutubeApi = {
  // 项目管理
  async getProjects(page = 1, pageSize = 10) {
    await delay(500);
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return {
      data: mockProjects.slice(start, end),
      total: mockProjects.length,
      page,
      page_size: pageSize
    };
  },

  async getProject(projectId: string) {
    await delay(300);
    const project = mockProjects.find((p) => p.id === projectId);
    if (!project) throw new Error('Project not found');
    return project;
  },

  async createProject(name: string, youtubeUrl: string) {
    await delay(800);
    const newProject: VideoProject = {
      id: `proj_${Date.now()}`,
      name,
      youtube_url: youtubeUrl,
      status: 'created',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockProjects.unshift(newProject);
    return newProject;
  },

  async deleteProject(projectId: string) {
    await delay(500);
    const index = mockProjects.findIndex((p) => p.id === projectId);
    if (index > -1) {
      mockProjects.splice(index, 1);
    }
    return { success: true };
  },

  // 分镜管理
  async getStoryboards(projectId: string) {
    await delay(400);
    const storyboards = mockStoryboards.filter(
      (s) => s.project_id === projectId || projectId === 'proj_001'
    );
    return {
      data: storyboards,
      total: storyboards.length,
      page: 1,
      page_size: 100
    };
  },

  async updateStoryboard(storyboardId: string, data: Partial<Storyboard>) {
    await delay(300);
    const sb = mockStoryboards.find((s) => s.id === storyboardId);
    if (sb) {
      Object.assign(sb, data, { updated_at: new Date().toISOString() });
    }
    return sb;
  },

  // 提示词管理
  async getPrompts(projectId: string) {
    await delay(400);
    const prompts = mockPrompts.filter(
      (p) => p.project_id === projectId || projectId === 'proj_001'
    );
    return { data: prompts, total: prompts.length, page: 1, page_size: 100 };
  },

  async updatePrompt(promptId: string, data: Partial<Prompt>) {
    await delay(300);
    const prompt = mockPrompts.find((p) => p.id === promptId);
    if (prompt) {
      Object.assign(prompt, data, {
        updated_at: new Date().toISOString(),
        is_edited: true
      });
    }
    return prompt;
  },

  async regeneratePrompt(promptId: string, instruction: string) {
    await delay(1500);
    const prompt = mockPrompts.find((p) => p.id === promptId);
    if (prompt) {
      prompt.text_to_image = `[AI重新生成] ${instruction} - ${prompt.text_to_image}`;
      prompt.image_to_video = `[AI重新生成] ${instruction} - ${prompt.image_to_video}`;
      prompt.is_edited = true;
      prompt.updated_at = new Date().toISOString();
    }
    return prompt;
  },

  async exportPrompts(projectId: string) {
    await delay(500);
    return mockStructuredPromptData;
  },

  // 角色映射
  async getCharacterMappings(projectId: string) {
    await delay(300);
    return mockCharacterMappings.filter(
      (c) => c.project_id === projectId || projectId === 'proj_001'
    );
  },

  async updateCharacterMappings(
    projectId: string,
    mappings: Partial<CharacterMapping>[]
  ) {
    await delay(500);
    return { success: true, mappings };
  },

  // 图片生成
  async getGeneratedImages(projectId: string, storyboardIndex?: number) {
    await delay(400);
    let images = mockGeneratedImages.filter(
      (i) => i.project_id === projectId || projectId === 'proj_001'
    );
    if (storyboardIndex !== undefined) {
      images = images.filter((i) => i.storyboard_index === storyboardIndex);
    }
    return { data: images, total: images.length, page: 1, page_size: 100 };
  },

  async selectImage(imageId: string, isSelected: boolean) {
    await delay(200);
    const image = mockGeneratedImages.find((i) => i.id === imageId);
    if (image) {
      // 取消同一分镜下其他图片的选中状态
      mockGeneratedImages
        .filter((i) => i.storyboard_index === image.storyboard_index)
        .forEach((i) => {
          i.is_selected = false;
        });
      image.is_selected = isSelected;
    }
    return image;
  },

  // 视频生成
  async getGeneratedVideos(projectId: string, storyboardIndex?: number) {
    await delay(400);
    let videos = mockGeneratedVideos.filter(
      (v) => v.project_id === projectId || projectId === 'proj_001'
    );
    if (storyboardIndex !== undefined) {
      videos = videos.filter((v) => v.storyboard_index === storyboardIndex);
    }
    return { data: videos, total: videos.length, page: 1, page_size: 100 };
  },

  async selectVideo(videoId: string, isSelected: boolean) {
    await delay(200);
    const video = mockGeneratedVideos.find((v) => v.id === videoId);
    if (video) {
      mockGeneratedVideos
        .filter((v) => v.storyboard_index === video.storyboard_index)
        .forEach((v) => {
          v.is_selected = false;
        });
      video.is_selected = isSelected;
    }
    return video;
  },

  // 任务状态
  async getTaskStatus(taskId: string) {
    await delay(200);
    return { ...mockGenerationTask, id: taskId };
  },

  // 视频下载
  async startDownload(projectId: string) {
    await delay(500);
    return {
      task_id: `download_${projectId}`,
      status: 'downloading',
      message: '开始下载视频'
    };
  },

  // 生成提示词
  async generatePrompts(projectId: string, version: 'v1' | 'v2') {
    await delay(1000);
    return {
      task_id: `gen_prompts_${projectId}`,
      status: 'generating',
      message: '正在生成提示词'
    };
  },

  // 批量生成图片
  async generateImages(projectId: string, storyboardIds?: string[]) {
    await delay(500);
    return {
      task_id: `gen_images_${projectId}`,
      status: 'running',
      total_items: storyboardIds?.length || 15,
      message: '开始生成图片'
    };
  },

  // 批量生成视频
  async generateVideos(projectId: string, storyboardIds?: string[]) {
    await delay(500);
    return {
      task_id: `gen_videos_${projectId}`,
      status: 'running',
      total_items: storyboardIds?.length || 15,
      message: '开始生成视频'
    };
  }
};

// 是否使用mock数据的开关
export const USE_MOCK_DATA = true;
