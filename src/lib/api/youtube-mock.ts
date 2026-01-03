// Mock data for YouTube module - 用于本地开发调试
// 注意：当USE_MOCK_DATA=false时，这些mock数据不会被使用
// 前端会直接调用FastAPI后端API

// 旧版类型定义（仅用于mock数据兼容）
interface MockVideoProject {
  id: string;
  name: string;
  youtube_url: string;
  status: string;
  video_path?: string;
  thumbnail_url?: string;
  duration?: number;
  created_at: string;
  updated_at: string;
  source_storyboard_count?: number;
  innovation_storyboard_count?: number;
  prompt_version?: 'v1' | 'v2';
}

interface MockStoryboard {
  id: string;
  project_id: string;
  index: number;
  start_time: number;
  end_time: number;
  start_frame_url: string;
  end_frame_url: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface MockPrompt {
  id: string;
  project_id: string;
  storyboard_id: string;
  storyboard_index: number;
  text_to_image: string;
  image_to_video: string;
  character_refs?: string[];
  version: 'v1' | 'v2';
  is_edited: boolean;
  edit_history?: {
    timestamp: string;
    text_to_image: string;
    image_to_video: string;
    edit_type: 'manual' | 'ai_regenerate';
  }[];
  created_at: string;
  updated_at: string;
}

interface MockCharacterMapping {
  id: string;
  project_id: string;
  number: number;
  identifier: string;
  name?: string;
  reference_image_url?: string;
}

interface MockGeneratedImage {
  id: string;
  project_id: string;
  prompt_id: string;
  storyboard_index: number;
  image_url: string;
  generation_type: 'text_to_image' | 'image_text_to_image';
  is_selected: boolean;
  created_at: string;
}

interface MockGeneratedVideo {
  id: string;
  project_id: string;
  prompt_id: string;
  storyboard_index: number;
  source_image_id: string;
  video_url: string;
  is_selected: boolean;
  created_at: string;
}

interface MockGenerationTask {
  id: string;
  project_id: string;
  task_type: string;
  status: string;
  progress: number;
  total_items: number;
  completed_items: number;
  failed_items: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

interface MockStructuredPromptData {
  project_id: string;
  project_name: string;
  total_innovation_storyboards: number;
  character_mappings: MockCharacterMapping[];
  prompts: {
    storyboard_index: number;
    text_to_image: string;
    image_to_video: string;
    character_refs: string[];
    character_images: Record<string, string>;
  }[];
}

// 模拟项目数据 - 覆盖所有状态阶段，确保每个工作流步骤都有可触发的入口
export const mockProjects: MockVideoProject[] = [
  // ========== 完成状态 ==========
  // 1. 已完成 - completed（所有步骤都已完成）
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

  // ========== 视频生成阶段 ==========
  // 2. 生成视频中 - generating_videos（视频生成进行中）
  {
    id: 'proj_002',
    name: '旅行Vlog制作',
    youtube_url: 'https://www.youtube.com/watch?v=abc123xyz',
    status: 'generating_videos',
    video_path: '/storage/videos/proj_002.mp4',
    thumbnail_url: 'https://picsum.photos/seed/proj2/320/180',
    duration: 485,
    created_at: '2025-12-26T14:00:00Z',
    updated_at: '2025-12-28T16:00:00Z',
    source_storyboard_count: 22,
    innovation_storyboard_count: 18,
    prompt_version: 'v2'
  },
  // 3. 图片就绪 - images_ready（可触发"开始生成视频"）
  {
    id: 'proj_003',
    name: '美食教程 - 可开始视频生成',
    youtube_url: 'https://www.youtube.com/watch?v=food123',
    status: 'images_ready',
    video_path: '/storage/videos/proj_003.mp4',
    thumbnail_url: 'https://picsum.photos/seed/proj3/320/180',
    duration: 245,
    created_at: '2025-12-27T09:00:00Z',
    updated_at: '2025-12-28T10:00:00Z',
    source_storyboard_count: 10,
    innovation_storyboard_count: 12,
    prompt_version: 'v1'
  },

  // ========== 图片生成阶段 ==========
  // 4. 生成图片中 - generating_images（图片生成进行中）
  {
    id: 'proj_004',
    name: '健身训练指南',
    youtube_url: 'https://www.youtube.com/watch?v=fitness456',
    status: 'generating_images',
    video_path: '/storage/videos/proj_004.mp4',
    thumbnail_url: 'https://picsum.photos/seed/proj4/320/180',
    duration: 600,
    created_at: '2025-12-28T08:00:00Z',
    updated_at: '2025-12-28T08:30:00Z',
    source_storyboard_count: 8,
    innovation_storyboard_count: 10,
    prompt_version: 'v1'
  },
  // 5. 提示词就绪 - prompts_ready（可触发"开始生成图片"）
  {
    id: 'proj_005',
    name: '编程教学 - 可开始图片生成',
    youtube_url: 'https://www.youtube.com/watch?v=coding789',
    status: 'prompts_ready',
    video_path: '/storage/videos/proj_005.mp4',
    thumbnail_url: 'https://picsum.photos/seed/proj5/320/180',
    duration: 720,
    created_at: '2025-12-28T09:00:00Z',
    updated_at: '2025-12-28T11:00:00Z',
    source_storyboard_count: 12,
    innovation_storyboard_count: 14,
    prompt_version: 'v2'
  },

  // ========== 提示词编辑阶段 ==========
  // 6. 生成提示词中 - generating_prompts（提示词生成进行中）
  {
    id: 'proj_006',
    name: '音乐MV制作',
    youtube_url: 'https://www.youtube.com/watch?v=music101',
    status: 'generating_prompts',
    video_path: '/storage/videos/proj_006.mp4',
    thumbnail_url: 'https://picsum.photos/seed/proj6/320/180',
    duration: 240,
    created_at: '2025-12-28T10:00:00Z',
    updated_at: '2025-12-28T10:30:00Z',
    source_storyboard_count: 6,
    innovation_storyboard_count: undefined
  },
  // 7. 分镜解析完成 - parsed（可触发"生成提示词"，已有分镜数据）
  {
    id: 'proj_007',
    name: '游戏攻略 - 可开始提示词生成（已解析分镜）',
    youtube_url: 'https://www.youtube.com/watch?v=game202',
    status: 'parsed',
    video_path: '/storage/videos/proj_007.mp4',
    thumbnail_url: 'https://picsum.photos/seed/proj7/320/180',
    duration: 900,
    created_at: '2025-12-28T11:00:00Z',
    updated_at: '2025-12-28T12:00:00Z',
    source_storyboard_count: 20,
    innovation_storyboard_count: undefined
  },

  // ========== 分镜解析阶段 ==========
  // 8. 解析分镜中 - parsing（分镜解析进行中）
  {
    id: 'proj_008',
    name: '产品开箱视频',
    youtube_url: 'https://www.youtube.com/watch?v=unbox303',
    status: 'parsing',
    video_path: '/storage/videos/proj_008.mp4',
    thumbnail_url: 'https://picsum.photos/seed/proj8/320/180',
    duration: 420,
    created_at: '2025-12-28T12:00:00Z',
    updated_at: '2025-12-28T12:15:00Z',
    source_storyboard_count: undefined,
    innovation_storyboard_count: undefined
  },
  // 9. 下载完成 - downloaded（可触发"解析分镜"和"生成提示词"两个入口）
  {
    id: 'proj_009',
    name: '摄影技巧 - 可开始分镜解析或提示词生成',
    youtube_url: 'https://www.youtube.com/watch?v=photo404',
    status: 'downloaded',
    video_path: '/storage/videos/proj_009.mp4',
    thumbnail_url: 'https://picsum.photos/seed/proj9/320/180',
    duration: 540,
    created_at: '2025-12-28T13:00:00Z',
    updated_at: '2025-12-28T13:30:00Z',
    source_storyboard_count: undefined,
    innovation_storyboard_count: undefined
  },

  // ========== 视频下载阶段 ==========
  // 10. 下载中 - downloading（视频下载进行中）
  {
    id: 'proj_010',
    name: '设计灵感分享',
    youtube_url: 'https://www.youtube.com/watch?v=design505',
    status: 'downloading',
    thumbnail_url: 'https://picsum.photos/seed/proj10/320/180',
    created_at: '2025-12-28T14:00:00Z',
    updated_at: '2025-12-28T14:05:00Z',
    source_storyboard_count: undefined,
    innovation_storyboard_count: undefined
  },
  // 11. 刚创建 - created（可触发"开始下载"）
  {
    id: 'proj_011',
    name: '新项目 - 可开始下载',
    youtube_url: 'https://www.youtube.com/watch?v=new606',
    status: 'created',
    thumbnail_url: undefined,
    created_at: '2025-12-28T15:00:00Z',
    updated_at: '2025-12-28T15:00:00Z',
    source_storyboard_count: undefined,
    innovation_storyboard_count: undefined
  },

  // ========== 特殊状态 ==========
  // 12. 失败 - failed
  {
    id: 'proj_012',
    name: '失败的项目',
    youtube_url: 'https://www.youtube.com/watch?v=fail707',
    status: 'failed',
    thumbnail_url: 'https://picsum.photos/seed/proj12/320/180',
    created_at: '2025-12-28T16:00:00Z',
    updated_at: '2025-12-28T16:30:00Z',
    source_storyboard_count: undefined,
    innovation_storyboard_count: undefined
  },

  // ========== YouTube Shorts 示例 ==========
  // 13. Shorts视频 - created（测试Shorts URL支持）
  {
    id: 'proj_013',
    name: 'Shorts短视频 - 可开始下载',
    youtube_url: 'https://www.youtube.com/shorts/x9w0JTA7lq8',
    status: 'created',
    thumbnail_url: undefined,
    created_at: '2025-12-28T17:00:00Z',
    updated_at: '2025-12-28T17:00:00Z',
    source_storyboard_count: undefined,
    innovation_storyboard_count: undefined
  }
];

// ========== 辅助函数：根据项目状态生成对应的数据 ==========

// 生成分镜数据的辅助函数
function generateStoryboardsForProject(
  projectId: string,
  count: number
): MockStoryboard[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `sb_${projectId}_${String(i + 1).padStart(3, '0')}`,
    project_id: projectId,
    index: i + 1,
    start_time: i * 20,
    end_time: (i + 1) * 20 + 2,
    start_frame_url: `https://picsum.photos/seed/${projectId}_frame${i * 2}/400/225`,
    end_frame_url: `https://picsum.photos/seed/${projectId}_frame${i * 2 + 1}/400/225`,
    description:
      i % 3 === 0
        ? `分镜 ${i + 1} 的内容描述：主角在场景中进行动作...`
        : undefined,
    created_at: '2025-12-25T10:30:00Z',
    updated_at: '2025-12-28T12:00:00Z'
  }));
}

// 生成提示词数据的辅助函数
function generatePromptsForProject(
  projectId: string,
  count: number,
  version: 'v1' | 'v2' = 'v1'
): MockPrompt[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `prompt_${projectId}_${String(i + 1).padStart(3, '0')}`,
    project_id: projectId,
    storyboard_id: `sb_${projectId}_${String(i + 1).padStart(3, '0')}`,
    storyboard_index: i + 1,
    text_to_image: `A cinematic shot of scene ${i + 1}, soft natural lighting, minimalist design, 8K resolution, professional photography style`,
    image_to_video: `Camera slowly pans across scene ${i + 1}, smooth motion, cinematic feel, 24fps`,
    character_refs: i % 4 === 0 ? ['A'] : i % 4 === 1 ? ['A', 'B'] : undefined,
    version,
    is_edited: i % 5 === 0,
    edit_history:
      i % 5 === 0
        ? [
            {
              timestamp: '2025-12-27T14:00:00Z',
              text_to_image: 'Original text to image prompt...',
              image_to_video: 'Original image to video prompt...',
              edit_type: 'manual' as const
            }
          ]
        : undefined,
    created_at: '2025-12-26T10:00:00Z',
    updated_at: '2025-12-28T14:00:00Z'
  }));
}

// 生成图片数据的辅助函数
function generateImagesForProject(
  projectId: string,
  promptCount: number,
  allSelected: boolean = false
): MockGeneratedImage[] {
  const images: MockGeneratedImage[] = [];
  for (let i = 0; i < promptCount; i++) {
    const imageCount = 3; // 每个提示词生成3张图片
    for (let j = 0; j < imageCount; j++) {
      images.push({
        id: `img_${projectId}_${i + 1}_${j + 1}`,
        project_id: projectId,
        prompt_id: `prompt_${projectId}_${String(i + 1).padStart(3, '0')}`,
        storyboard_index: i + 1,
        image_url: `https://picsum.photos/seed/${projectId}_gen${i}_${j}/512/512`,
        generation_type:
          i % 4 === 0 || i % 4 === 1
            ? 'image_text_to_image'
            : ('text_to_image' as const),
        is_selected: allSelected ? j === 0 : false, // 如果allSelected，每个分镜选中第一张
        created_at: '2025-12-28T10:00:00Z'
      });
    }
  }
  return images;
}

// 生成视频数据的辅助函数
function generateVideosForProject(
  projectId: string,
  promptCount: number
): MockGeneratedVideo[] {
  const videos: MockGeneratedVideo[] = [];
  for (let i = 0; i < promptCount; i++) {
    const videoCount = 2; // 每个分镜生成2个视频
    for (let j = 0; j < videoCount; j++) {
      videos.push({
        id: `vid_${projectId}_${i + 1}_${j + 1}`,
        project_id: projectId,
        prompt_id: `prompt_${projectId}_${String(i + 1).padStart(3, '0')}`,
        storyboard_index: i + 1,
        source_image_id: `img_${projectId}_${i + 1}_1`,
        video_url: `https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4`,
        is_selected: j === 0, // 每个分镜选中第一个视频
        created_at: '2025-12-28T12:00:00Z'
      });
    }
  }
  return videos;
}

// 生成角色映射数据的辅助函数
function generateCharacterMappingsForProject(
  projectId: string
): MockCharacterMapping[] {
  return [
    {
      id: `char_${projectId}_001`,
      project_id: projectId,
      number: 1,
      identifier: 'A',
      name: '主角',
      reference_image_url: `https://picsum.photos/seed/${projectId}_charA/200/200`
    },
    {
      id: `char_${projectId}_002`,
      project_id: projectId,
      number: 2,
      identifier: 'B',
      name: '配角',
      reference_image_url: `https://picsum.photos/seed/${projectId}_charB/200/200`
    },
    {
      id: `char_${projectId}_003`,
      project_id: projectId,
      number: 3,
      identifier: 'C',
      name: '助手'
    },
    {
      id: `char_${projectId}_004`,
      project_id: projectId,
      number: 4,
      identifier: 'D',
      name: ''
    }
  ];
}

// ========== 根据项目状态生成对应的 Mock 数据 ==========

// 模拟分镜数据 - 只有 parsed 及之后状态的项目才有分镜数据
export const mockStoryboards: MockStoryboard[] = [
  // proj_001 (completed) - 15个分镜
  ...generateStoryboardsForProject('proj_001', 15),
  // proj_002 (generating_videos) - 18个分镜
  ...generateStoryboardsForProject('proj_002', 18),
  // proj_003 (images_ready) - 12个分镜
  ...generateStoryboardsForProject('proj_003', 12),
  // proj_004 (generating_images) - 10个分镜
  ...generateStoryboardsForProject('proj_004', 10),
  // proj_005 (prompts_ready) - 14个分镜
  ...generateStoryboardsForProject('proj_005', 14),
  // proj_006 (generating_prompts) - 6个分镜（正在生成提示词，分镜已有）
  ...generateStoryboardsForProject('proj_006', 6),
  // proj_007 (parsed) - 20个分镜
  ...generateStoryboardsForProject('proj_007', 20)
];

// 模拟提示词数据 - 只有 prompts_ready 及之后状态的项目才有提示词数据
export const mockPrompts: MockPrompt[] = [
  // proj_001 (completed) - 15个提示词
  ...generatePromptsForProject('proj_001', 15, 'v1'),
  // proj_002 (generating_videos) - 18个提示词
  ...generatePromptsForProject('proj_002', 18, 'v2'),
  // proj_003 (images_ready) - 12个提示词
  ...generatePromptsForProject('proj_003', 12, 'v1'),
  // proj_004 (generating_images) - 10个提示词
  ...generatePromptsForProject('proj_004', 10, 'v1'),
  // proj_005 (prompts_ready) - 14个提示词
  ...generatePromptsForProject('proj_005', 14, 'v2')
];

// 模拟角色映射 - 所有有提示词的项目都有角色映射
export const mockCharacterMappings: MockCharacterMapping[] = [
  ...generateCharacterMappingsForProject('proj_001'),
  ...generateCharacterMappingsForProject('proj_002'),
  ...generateCharacterMappingsForProject('proj_003'),
  ...generateCharacterMappingsForProject('proj_004'),
  ...generateCharacterMappingsForProject('proj_005')
];

// 模拟生成的图片 - 只有 images_ready 及之后状态的项目才有图片数据
export const mockGeneratedImages: MockGeneratedImage[] = [
  // proj_001 (completed) - 15个分镜的图片，全部已选择
  ...generateImagesForProject('proj_001', 15, true),
  // proj_002 (generating_videos) - 18个分镜的图片，全部已选择
  ...generateImagesForProject('proj_002', 18, true),
  // proj_003 (images_ready) - 12个分镜的图片，全部已选择
  ...generateImagesForProject('proj_003', 12, true),
  // proj_004 (generating_images) - 部分图片（5个分镜已生成）
  ...generateImagesForProject('proj_004', 5, false)
];

// 模拟生成的视频 - 只有 completed 状态的项目才有完整视频数据
export const mockGeneratedVideos: MockGeneratedVideo[] = [
  // proj_001 (completed) - 15个分镜的视频
  ...generateVideosForProject('proj_001', 15),
  // proj_002 (generating_videos) - 部分视频（10个分镜已生成）
  ...generateVideosForProject('proj_002', 10)
];

// 模拟生成任务
export const mockGenerationTask: MockGenerationTask = {
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
export const mockStructuredPromptData: MockStructuredPromptData = {
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
    const newProject: MockVideoProject = {
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
      (s) => s.project_id === projectId
    );
    return {
      data: storyboards,
      total: storyboards.length,
      page: 1,
      page_size: 100
    };
  },

  async updateStoryboard(storyboardId: string, data: Partial<MockStoryboard>) {
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
    const prompts = mockPrompts.filter((p) => p.project_id === projectId);
    return { data: prompts, total: prompts.length, page: 1, page_size: 100 };
  },

  async updatePrompt(promptId: string, data: Partial<MockPrompt>) {
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
    return mockCharacterMappings.filter((c) => c.project_id === projectId);
  },

  async updateCharacterMappings(
    projectId: string,
    mappings: Partial<MockCharacterMapping>[]
  ) {
    await delay(500);
    return { success: true, mappings };
  },

  // 图片生成
  async getGeneratedImages(projectId: string, storyboardIndex?: number) {
    await delay(400);
    let images = mockGeneratedImages.filter((i) => i.project_id === projectId);
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
    let videos = mockGeneratedVideos.filter((v) => v.project_id === projectId);
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
  async generateVideos(projectId: string, promptIds?: string[]) {
    await delay(500);
    return {
      task_id: `gen_videos_${projectId}`,
      status: 'running',
      total_items: promptIds?.length || 15,
      message: '开始生成视频'
    };
  }
};

// 是否使用mock数据的开关
// 设置为false以使用真实的FastAPI后端
export const USE_MOCK_DATA = false;
