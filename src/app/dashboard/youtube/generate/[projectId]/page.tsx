'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Image,
  Video,
  Loader2,
  RefreshCw,
  Download,
  CheckCircle,
  Play,
  Users,
  ZoomIn,
  Pencil,
  Save,
  Trash2,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  getProject,
  updateProject,
  generateImage,
  generateVideo,
  cleanupMedia,
  updateProjectAspectRatio
} from '@/lib/api/youtube';
import {
  loadGlobalSubjectLibraryAsync,
  loadProjectSubjectMapping,
  getSubjectForRef,
  parseFullRef,
  type GlobalSubjectLibrary,
  type ProjectSubjectMapping,
  SUBJECT_TYPE_ICONS,
  DEFAULT_SUBJECT_LIBRARY
} from '@/lib/subject-config';
import { VideoPlayer } from '@/components/youtube/video-player';
import { AspectRatioSelector } from '@/components/youtube/aspect-ratio-selector';
import type {
  ProjectResponse,
  GeneratedImage,
  GeneratedVideo,
  AspectRatio
} from '@/types/youtube';

interface GeneratePageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default function GeneratePage({ params }: GeneratePageProps) {
  const { projectId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const initialTab = searchParams.get('tab') === 'video' ? 'video' : 'image';

  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [subjectLibrary, setSubjectLibrary] = useState<GlobalSubjectLibrary>(
    DEFAULT_SUBJECT_LIBRARY
  );
  const [projectMapping, setProjectMapping] = useState<ProjectSubjectMapping>(
    {}
  );

  // 图片比例状态
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [savingAspectRatio, setSavingAspectRatio] = useState(false);

  // 生成状态 - 使用 Set 支持多个并发生成
  const [generatingImageIndices, setGeneratingImageIndices] = useState<
    Set<number>
  >(new Set());
  const [generatingVideoIndices, setGeneratingVideoIndices] = useState<
    Set<number>
  >(new Set());

  // 预览状态
  const [previewImage, setPreviewImage] = useState<GeneratedImage | null>(null);
  const [previewImageOpen, setPreviewImageOpen] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<GeneratedVideo | null>(null);
  const [previewVideoOpen, setPreviewVideoOpen] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  // 提示词编辑状态（图片生成）
  const [editingPromptIndex, setEditingPromptIndex] = useState<number | null>(
    null
  );
  const [editedPrompt, setEditedPrompt] = useState<string>('');
  const [savingPrompt, setSavingPrompt] = useState(false);

  // 视频提示词编辑状态
  const [editingVideoPromptIndex, setEditingVideoPromptIndex] = useState<
    number | null
  >(null);
  const [editedVideoPrompt, setEditedVideoPrompt] = useState<string>('');
  const [savingVideoPrompt, setSavingVideoPrompt] = useState(false);

  // 清理状态
  const [cleaningImages, setCleaningImages] = useState(false);
  const [cleaningVideos, setCleaningVideos] = useState(false);

  // 下载状态
  const [downloadingVideos, setDownloadingVideos] = useState(false);
  const [downloadingImages, setDownloadingImages] = useState(false);

  // 下载勾选状态（前端状态，与服务器选择分开）
  // key: `${storyboardIndex}-${imageIndex}` 或 `${storyboardIndex}-${videoIndex}`
  const [downloadSelectedImages, setDownloadSelectedImages] = useState<
    Set<string>
  >(new Set());
  const [downloadSelectedVideos, setDownloadSelectedVideos] = useState<
    Set<string>
  >(new Set());

  // 注意：分镜参考选择现在存储在 storyboard.ref_storyboard_indexes 中，不再使用本地状态

  // 加载数据
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const projectData = await getProject(projectId);
      setProject(projectData);

      // 设置图片比例
      setAspectRatio(projectData.data.aspect_ratio || '9:16');

      // 加载全局主体库和项目映射
      const library = await loadGlobalSubjectLibraryAsync();
      setSubjectLibrary(library);
      const mapping = loadProjectSubjectMapping(projectId);
      setProjectMapping(mapping);

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据失败');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 更新图片比例
  const handleAspectRatioChange = async (newRatio: AspectRatio) => {
    if (!project || newRatio === aspectRatio) return;

    setSavingAspectRatio(true);
    try {
      await updateProjectAspectRatio(projectId, newRatio);
      setAspectRatio(newRatio);
      toast({
        title: '已更新',
        description: `图片比例已设置为 ${newRatio === '9:16' ? '竖屏 9:16' : '横屏 16:9'}`
      });
    } catch (err) {
      toast({
        title: '更新失败',
        description: err instanceof Error ? err.message : '更新图片比例失败',
        variant: 'destructive'
      });
    } finally {
      setSavingAspectRatio(false);
    }
  };

  // 生成单个分镜图片
  const handleGenerateImage = async (storyboardIndex: number) => {
    if (!project) return;

    const storyboard = project.data.storyboards[storyboardIndex];
    if (!storyboard) return;

    // 添加到生成中集合
    setGeneratingImageIndices((prev) => new Set(prev).add(storyboardIndex));
    try {
      // 获取主体引用图片（Base64数据）
      // 重要：按照 character_refs 数组的顺序获取图片，顺序会影响图文生图接口的上传顺序
      const characterImages: string[] = [];
      if (storyboard.character_refs && storyboard.character_refs.length > 0) {
        // 按 character_refs 数组顺序遍历，确保上传顺序与 JSON 中的顺序一致
        for (let i = 0; i < storyboard.character_refs.length; i++) {
          const ref = storyboard.character_refs[i];
          // 通过项目映射找到全局主体
          const subject = getSubjectForRef(ref, projectMapping, subjectLibrary);
          if (subject?.imageData) {
            characterImages.push(subject.imageData);
          }
        }
      }

      // 注意：ref_storyboard_indexes 已存储在 storyboard 中，后端会自动读取
      const result = await generateImage(projectId, {
        storyboard_index: storyboardIndex,
        character_images:
          characterImages.length > 0 ? characterImages : undefined,
        aspect_ratio: aspectRatio
      });

      if (result.success) {
        toast({
          title: '生成成功',
          description: `分镜 #${storyboardIndex + 1} 图片已生成`
        });
        loadData();
      } else {
        toast({
          title: '生成失败',
          description: result.error || '图片生成失败',
          variant: 'destructive'
        });
      }
    } catch (err) {
      toast({
        title: '生成失败',
        description: err instanceof Error ? err.message : '图片生成失败',
        variant: 'destructive'
      });
    } finally {
      // 从生成中集合移除
      setGeneratingImageIndices((prev) => {
        const next = new Set(prev);
        next.delete(storyboardIndex);
        return next;
      });
    }
  };

  // 生成单个分镜视频
  const handleGenerateVideo = async (storyboardIndex: number) => {
    if (!project) return;

    const storyboard = project.data.storyboards[storyboardIndex];
    if (!storyboard) return;

    // 检查是否有选中的图片
    if (storyboard.selected_image_index === null) {
      toast({
        title: '请先选择图片',
        description: '需要先选择一张图片作为视频生成的源图片',
        variant: 'destructive'
      });
      return;
    }

    // 添加到生成中集合
    setGeneratingVideoIndices((prev) => new Set(prev).add(storyboardIndex));
    try {
      const result = await generateVideo(projectId, {
        storyboard_index: storyboardIndex
      });

      if (result.success) {
        toast({
          title: '生成成功',
          description: `分镜 #${storyboardIndex + 1} 视频已生成`
        });
        loadData();
      } else {
        toast({
          title: '生成失败',
          description: result.error || '视频生成失败',
          variant: 'destructive'
        });
      }
    } catch (err) {
      toast({
        title: '生成失败',
        description: err instanceof Error ? err.message : '视频生成失败',
        variant: 'destructive'
      });
    } finally {
      // 从生成中集合移除
      setGeneratingVideoIndices((prev) => {
        const next = new Set(prev);
        next.delete(storyboardIndex);
        return next;
      });
    }
  };

  // 选择图片（服务器选择，用于后续流程）
  const handleSelectImage = async (
    storyboardIndex: number,
    imageIndex: number
  ) => {
    if (!project) return;

    // 如果已经是选中状态，不触发接口
    const currentSelected =
      project.data.storyboards[storyboardIndex]?.selected_image_index;
    if (currentSelected === imageIndex) return;

    try {
      const storyboards = [...project.data.storyboards];
      storyboards[storyboardIndex] = {
        ...storyboards[storyboardIndex],
        selected_image_index: imageIndex
      };

      await updateProject(projectId, { storyboards });
      loadData();

      toast({
        title: '已选择',
        description: `分镜 #${storyboardIndex + 1} 图片已选择`
      });
    } catch (err) {
      toast({
        title: '选择失败',
        description: err instanceof Error ? err.message : '选择图片失败',
        variant: 'destructive'
      });
    }
  };

  // 选择视频（服务器选择，用于后续流程）
  const handleSelectVideo = async (
    storyboardIndex: number,
    videoIndex: number
  ) => {
    if (!project) return;

    // 如果已经是选中状态，不触发接口
    const currentSelected =
      project.data.storyboards[storyboardIndex]?.selected_video_index;
    if (currentSelected === videoIndex) return;

    try {
      const storyboards = [...project.data.storyboards];
      storyboards[storyboardIndex] = {
        ...storyboards[storyboardIndex],
        selected_video_index: videoIndex
      };

      await updateProject(projectId, { storyboards });
      loadData();

      toast({
        title: '已选择',
        description: `分镜 #${storyboardIndex + 1} 视频已选择`
      });
    } catch (err) {
      toast({
        title: '选择失败',
        description: err instanceof Error ? err.message : '选择视频失败',
        variant: 'destructive'
      });
    }
  };

  // 打开图片预览
  const handlePreviewImage = (image: GeneratedImage, e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewImage(image);
    setImageDimensions(null);
    setPreviewImageOpen(true);
  };

  // 图片加载完成后获取尺寸
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
  };

  // 打开视频播放
  const handlePlayVideo = (video: GeneratedVideo, e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewVideo(video);
    setPreviewVideoOpen(true);
  };

  // 批量生成所有图片
  const handleGenerateAllImages = async () => {
    if (!project) return;

    for (let i = 0; i < project.data.storyboards.length; i++) {
      const sb = project.data.storyboards[i];
      if (sb.images.length === 0) {
        await handleGenerateImage(i);
      }
    }
  };

  // 批量生成所有视频
  const handleGenerateAllVideos = async () => {
    if (!project) return;

    for (let i = 0; i < project.data.storyboards.length; i++) {
      const sb = project.data.storyboards[i];
      if (sb.selected_image_index !== null && sb.videos.length === 0) {
        await handleGenerateVideo(i);
      }
    }
  };

  // 清理未选中的图片
  const handleCleanupImages = async () => {
    if (!project) return;

    setCleaningImages(true);
    try {
      const result = await cleanupMedia(projectId, 'images');
      if (result.success) {
        toast({
          title: '清理完成',
          description: `已删除 ${result.deleted_images} 张未选中图片，释放 ${result.freed_size}`
        });
        loadData();
      } else {
        toast({
          title: '清理失败',
          description: result.errors.join(', ') || '清理图片失败',
          variant: 'destructive'
        });
      }
    } catch (err) {
      toast({
        title: '清理失败',
        description: err instanceof Error ? err.message : '清理图片失败',
        variant: 'destructive'
      });
    } finally {
      setCleaningImages(false);
    }
  };

  // 清理未选中的视频
  const handleCleanupVideos = async () => {
    if (!project) return;

    setCleaningVideos(true);
    try {
      const result = await cleanupMedia(projectId, 'videos');
      if (result.success) {
        toast({
          title: '清理完成',
          description: `已删除 ${result.deleted_videos} 个未选中视频，释放 ${result.freed_size}`
        });
        loadData();
      } else {
        toast({
          title: '清理失败',
          description: result.errors.join(', ') || '清理视频失败',
          variant: 'destructive'
        });
      }
    } catch (err) {
      toast({
        title: '清理失败',
        description: err instanceof Error ? err.message : '清理视频失败',
        variant: 'destructive'
      });
    } finally {
      setCleaningVideos(false);
    }
  };

  // 切换图片下载勾选
  const toggleImageDownloadSelect = (
    storyboardIndex: number,
    imageIndex: number
  ) => {
    const key = `${storyboardIndex}-${imageIndex}`;
    setDownloadSelectedImages((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // 切换视频下载勾选
  const toggleVideoDownloadSelect = (
    storyboardIndex: number,
    videoIndex: number
  ) => {
    const key = `${storyboardIndex}-${videoIndex}`;
    setDownloadSelectedVideos((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // 全选/取消全选图片下载
  const toggleAllImagesDownloadSelect = () => {
    if (!project) return;
    const allKeys: string[] = [];
    project.data.storyboards.forEach((sb, sbIndex) => {
      sb.images.forEach((_, imgIndex) => {
        allKeys.push(`${sbIndex}-${imgIndex}`);
      });
    });

    if (downloadSelectedImages.size === allKeys.length) {
      setDownloadSelectedImages(new Set());
    } else {
      setDownloadSelectedImages(new Set(allKeys));
    }
  };

  // 全选/取消全选视频下载
  const toggleAllVideosDownloadSelect = () => {
    if (!project) return;
    const allKeys: string[] = [];
    project.data.storyboards.forEach((sb, sbIndex) => {
      sb.videos.forEach((_, vidIndex) => {
        allKeys.push(`${sbIndex}-${vidIndex}`);
      });
    });

    if (downloadSelectedVideos.size === allKeys.length) {
      setDownloadSelectedVideos(new Set());
    } else {
      setDownloadSelectedVideos(new Set(allKeys));
    }
  };

  // 下载勾选的图片
  const handleDownloadSelectedImages = async () => {
    if (!project) return;

    if (downloadSelectedImages.size === 0) {
      toast({
        title: '无可下载图片',
        description: '请先勾选要下载的图片',
        variant: 'destructive'
      });
      return;
    }

    const selectedImages: { url: string; name: string }[] = [];
    downloadSelectedImages.forEach((key) => {
      const [sbIndex, imgIndex] = key.split('-').map(Number);
      const sb = project.data.storyboards[sbIndex];
      const img = sb?.images[imgIndex];
      if (img) {
        selectedImages.push({
          url: img.url,
          name: `${project.data.name}_分镜${sbIndex + 1}_图片${imgIndex + 1}.png`
        });
      }
    });

    setDownloadingImages(true);
    try {
      for (const image of selectedImages) {
        const response = await fetch(image.url);
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = image.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      toast({
        title: '下载完成',
        description: `已下载 ${selectedImages.length} 张图片`
      });
    } catch (err) {
      toast({
        title: '下载失败',
        description: err instanceof Error ? err.message : '下载图片失败',
        variant: 'destructive'
      });
    } finally {
      setDownloadingImages(false);
    }
  };

  // 下载勾选的视频
  const handleDownloadSelectedVideos = async () => {
    if (!project) return;

    if (downloadSelectedVideos.size === 0) {
      toast({
        title: '无可下载视频',
        description: '请先勾选要下载的视频',
        variant: 'destructive'
      });
      return;
    }

    const selectedVideos: { url: string; name: string }[] = [];
    downloadSelectedVideos.forEach((key) => {
      const [sbIndex, vidIndex] = key.split('-').map(Number);
      const sb = project.data.storyboards[sbIndex];
      const vid = sb?.videos[vidIndex];
      if (vid) {
        selectedVideos.push({
          url: vid.url,
          name: `${project.data.name}_分镜${sbIndex + 1}_视频${vidIndex + 1}.mp4`
        });
      }
    });

    setDownloadingVideos(true);
    try {
      for (const video of selectedVideos) {
        const response = await fetch(video.url);
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = video.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      toast({
        title: '下载完成',
        description: `已下载 ${selectedVideos.length} 个视频`
      });
    } catch (err) {
      toast({
        title: '下载失败',
        description: err instanceof Error ? err.message : '下载视频失败',
        variant: 'destructive'
      });
    } finally {
      setDownloadingVideos(false);
    }
  };

  // 更新分镜角色引用
  const handleUpdateCharacterRefs = async (
    storyboardIndex: number,
    refs: string[]
  ) => {
    if (!project) return;

    try {
      const storyboards = [...project.data.storyboards];
      storyboards[storyboardIndex] = {
        ...storyboards[storyboardIndex],
        character_refs: refs.length > 0 ? refs : null
      };

      await updateProject(projectId, { storyboards });

      // 更新本地状态
      setProject({
        ...project,
        data: {
          ...project.data,
          storyboards
        }
      });

      toast({
        title: '已更新',
        description:
          refs.length > 0
            ? `分镜 #${storyboardIndex + 1} 角色引用已更新为: ${refs.join(', ')}`
            : `分镜 #${storyboardIndex + 1} 已切换为文生图模式`
      });
    } catch (err) {
      toast({
        title: '更新失败',
        description: err instanceof Error ? err.message : '更新角色引用失败',
        variant: 'destructive'
      });
    }
  };

  // 更新分镜参考索引（多选）
  const handleUpdateRefStoryboardIndexes = async (
    storyboardIndex: number,
    refIndexes: number[]
  ) => {
    if (!project) return;

    try {
      const storyboards = [...project.data.storyboards];
      storyboards[storyboardIndex] = {
        ...storyboards[storyboardIndex],
        ref_storyboard_indexes: refIndexes.length > 0 ? refIndexes : null
      };

      await updateProject(projectId, { storyboards });

      // 更新本地状态
      setProject({
        ...project,
        data: {
          ...project.data,
          storyboards
        }
      });

      toast({
        title: '已更新',
        description:
          refIndexes.length > 0
            ? `分镜 #${storyboardIndex + 1} 参考分镜已更新`
            : `分镜 #${storyboardIndex + 1} 已清除参考分镜`
      });
    } catch (err) {
      toast({
        title: '更新失败',
        description: err instanceof Error ? err.message : '更新参考分镜失败',
        variant: 'destructive'
      });
    }
  };

  // 开始编辑提示词
  const handleStartEditPrompt = (
    storyboardIndex: number,
    currentPrompt: string
  ) => {
    setEditingPromptIndex(storyboardIndex);
    setEditedPrompt(currentPrompt || '');
  };

  // 保存提示词
  const handleSavePrompt = async (storyboardIndex: number) => {
    if (!project) return;

    setSavingPrompt(true);
    try {
      const storyboards = [...project.data.storyboards];
      storyboards[storyboardIndex] = {
        ...storyboards[storyboardIndex],
        text_to_image: editedPrompt
      };

      await updateProject(projectId, { storyboards });

      // 更新本地状态
      setProject({
        ...project,
        data: {
          ...project.data,
          storyboards
        }
      });

      setEditingPromptIndex(null);
      setEditedPrompt('');

      toast({
        title: '已保存',
        description: `分镜 #${storyboardIndex + 1} 提示词已更新`
      });
    } catch (err) {
      toast({
        title: '保存失败',
        description: err instanceof Error ? err.message : '保存提示词失败',
        variant: 'destructive'
      });
    } finally {
      setSavingPrompt(false);
    }
  };

  // 取消编辑提示词
  const handleCancelEditPrompt = () => {
    setEditingPromptIndex(null);
    setEditedPrompt('');
  };

  // 开始编辑视频提示词
  const handleStartEditVideoPrompt = (
    storyboardIndex: number,
    currentPrompt: string
  ) => {
    setEditingVideoPromptIndex(storyboardIndex);
    setEditedVideoPrompt(currentPrompt || '');
  };

  // 保存视频提示词
  const handleSaveVideoPrompt = async (storyboardIndex: number) => {
    if (!project) return;

    setSavingVideoPrompt(true);
    try {
      const storyboards = [...project.data.storyboards];
      storyboards[storyboardIndex] = {
        ...storyboards[storyboardIndex],
        image_to_video: editedVideoPrompt
      };

      await updateProject(projectId, { storyboards });

      // 更新本地状态
      setProject({
        ...project,
        data: {
          ...project.data,
          storyboards
        }
      });

      setEditingVideoPromptIndex(null);
      setEditedVideoPrompt('');

      toast({
        title: '已保存',
        description: `分镜 #${storyboardIndex + 1} 视频提示词已更新`
      });
    } catch (err) {
      toast({
        title: '保存失败',
        description: err instanceof Error ? err.message : '保存视频提示词失败',
        variant: 'destructive'
      });
    } finally {
      setSavingVideoPrompt(false);
    }
  };

  // 取消编辑视频提示词
  const handleCancelEditVideoPrompt = () => {
    setEditingVideoPromptIndex(null);
    setEditedVideoPrompt('');
  };

  // 获取有效的主体映射（有映射且有图片的）
  const getValidSubjectMappings = () => {
    const result: {
      fullRef: string;
      subject: (typeof subjectLibrary.character)[0];
    }[] = [];

    // 遍历所有映射
    for (const [fullRef, subjectId] of Object.entries(projectMapping)) {
      if (!subjectId) continue;
      const subject = getSubjectForRef(fullRef, projectMapping, subjectLibrary);
      if (subject?.imageData) {
        result.push({ fullRef, subject });
      }
    }

    return result;
  };

  // 计算进度
  const getImageProgress = () => {
    if (!project) return { selected: 0, total: 0 };
    const storyboards = project.data.storyboards;
    const selected = storyboards.filter(
      (sb) => sb.selected_image_index !== null
    ).length;
    return { selected, total: storyboards.length };
  };

  const getVideoProgress = () => {
    if (!project) return { selected: 0, total: 0 };
    const storyboards = project.data.storyboards;
    const selected = storyboards.filter(
      (sb) => sb.selected_video_index !== null
    ).length;
    return { selected, total: storyboards.length };
  };

  if (loading) {
    return (
      <div className='container mx-auto'>
        <div className='flex h-64 items-center justify-center'>
          <Loader2 className='text-muted-foreground h-8 w-8 animate-spin' />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className='container mx-auto'>
        <div className='flex h-64 flex-col items-center justify-center gap-4'>
          <p className='text-destructive'>{error || '项目不存在'}</p>
          <Button
            variant='outline'
            onClick={() => router.push('/dashboard/youtube/projects')}
          >
            返回项目列表
          </Button>
        </div>
      </div>
    );
  }

  const storyboards = project.data.storyboards;
  const imageProgress = getImageProgress();
  const videoProgress = getVideoProgress();

  return (
    <div className='container mx-auto space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Button
            variant='ghost'
            size='icon'
            onClick={() =>
              router.push(`/dashboard/youtube/project/${projectId}`)
            }
          >
            <ArrowLeft className='h-4 w-4' />
          </Button>
          <div>
            <h1 className='text-2xl font-bold'>素材生成</h1>
            <p className='text-muted-foreground text-sm'>{project.data.name}</p>
          </div>
        </div>
        <AspectRatioSelector
          value={aspectRatio}
          onChange={handleAspectRatioChange}
          disabled={savingAspectRatio || generatingImageIndices.size > 0}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value='image' className='gap-2'>
            <Image className='h-4 w-4' />
            图片生成
          </TabsTrigger>
          <TabsTrigger value='video' className='gap-2'>
            <Video className='h-4 w-4' />
            视频生成
          </TabsTrigger>
        </TabsList>

        {/* Image Generation Tab */}
        <TabsContent value='image' className='space-y-6'>
          {/* Progress */}
          <div className='bg-card space-y-4 rounded-lg border p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium'>生成进度</p>
                <p className='text-muted-foreground text-xs'>
                  已选择: {imageProgress.selected}/{imageProgress.total} 个分镜
                  {generatingImageIndices.size > 0 &&
                    ` (${generatingImageIndices.size} 个生成中)`}
                </p>
              </div>
              <div className='flex items-center gap-2'>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={handleCleanupImages}
                  disabled={cleaningImages || generatingImageIndices.size > 0}
                  className='gap-1'
                >
                  {cleaningImages ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <Trash2 className='h-4 w-4' />
                  )}
                  清理未选中
                </Button>
                <Button
                  size='sm'
                  onClick={handleGenerateAllImages}
                  disabled={generatingImageIndices.size > 0}
                  className='gap-1'
                >
                  {generatingImageIndices.size > 0 ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <RefreshCw className='h-4 w-4' />
                  )}
                  批量生成
                </Button>
              </div>
            </div>
            <Progress
              value={
                (imageProgress.selected / Math.max(imageProgress.total, 1)) *
                100
              }
              className='h-2'
            />
          </div>

          {/* Storyboard Cards - 4列网格布局 */}
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
            {storyboards.map((storyboard, index) => (
              <Card key={index} className='flex flex-col'>
                <CardHeader className='pb-2'>
                  <div className='flex items-center justify-between'>
                    <CardTitle className='text-sm'>
                      分镜 #{storyboard.index + 1}
                    </CardTitle>
                    {storyboard.selected_image_index !== null && (
                      <Badge variant='default' className='gap-1 text-xs'>
                        <CheckCircle className='h-3 w-3' />
                        已选
                      </Badge>
                    )}
                  </div>
                  {/* 主体参考图展示 - 按 character_refs 数组顺序展示，顺序影响上传顺序 */}
                  {/* 以及选择的分镜参考图展示（支持多选） */}
                  {(storyboard.character_refs &&
                    storyboard.character_refs.length > 0) ||
                  (storyboard.ref_storyboard_indexes &&
                    storyboard.ref_storyboard_indexes.length > 0) ? (
                    <div className='mt-1 flex flex-wrap items-center gap-1'>
                      {/* 主体参考图 */}
                      {storyboard.character_refs &&
                        storyboard.character_refs.map((ref, refIndex) => {
                          const subject = getSubjectForRef(
                            ref,
                            projectMapping,
                            subjectLibrary
                          );
                          const parsed = parseFullRef(ref);
                          const icon = parsed
                            ? SUBJECT_TYPE_ICONS[parsed.type]
                            : '❓';
                          return subject?.imageData ? (
                            <img
                              key={`subject-${refIndex}-${ref}`}
                              src={subject.imageData}
                              alt={`${ref} (第${refIndex + 1}个)`}
                              className='h-6 w-auto rounded border object-contain'
                              title={`${subject.name || ref} (上传顺序: ${refIndex + 1})`}
                            />
                          ) : (
                            <Badge
                              key={`subject-${refIndex}-${ref}`}
                              variant='outline'
                              className='text-[10px]'
                            >
                              {icon} {ref}
                            </Badge>
                          );
                        })}
                      {/* 分镜参考图（多选） */}
                      {storyboard.ref_storyboard_indexes &&
                        storyboard.ref_storyboard_indexes.map((refIdx) => {
                          const refStoryboard = storyboards[refIdx];
                          if (
                            !refStoryboard ||
                            refStoryboard.selected_image_index === null
                          )
                            return null;
                          const refImage =
                            refStoryboard.images[
                              refStoryboard.selected_image_index
                            ];
                          if (!refImage) return null;
                          return (
                            <img
                              key={`ref-${refIdx}`}
                              src={refImage.url}
                              alt={`参考分镜 #${refIdx + 1}`}
                              className='h-6 w-auto rounded border border-dashed border-blue-400 object-contain'
                              title={`参考分镜 #${refIdx + 1} (场景一致性)`}
                            />
                          );
                        })}
                    </div>
                  ) : (
                    <Badge
                      variant='secondary'
                      className='mt-1 w-fit text-[10px]'
                    >
                      文生图
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className='flex flex-1 flex-col space-y-3'>
                  {/* 提示词编辑区域 */}
                  <div className='space-y-1'>
                    {editingPromptIndex === index ? (
                      <div className='space-y-2'>
                        <Textarea
                          value={editedPrompt}
                          onChange={(e) => setEditedPrompt(e.target.value)}
                          className='min-h-[60px] resize-none text-xs'
                          placeholder='输入提示词...'
                        />
                        <div className='flex gap-1'>
                          <Button
                            size='sm'
                            className='h-6 flex-1 gap-1 text-xs'
                            onClick={() => handleSavePrompt(index)}
                            disabled={savingPrompt}
                          >
                            {savingPrompt ? (
                              <Loader2 className='h-3 w-3 animate-spin' />
                            ) : (
                              <Save className='h-3 w-3' />
                            )}
                            保存
                          </Button>
                          <Button
                            size='sm'
                            variant='outline'
                            className='h-6 text-xs'
                            onClick={handleCancelEditPrompt}
                            disabled={savingPrompt}
                          >
                            取消
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className='flex items-start gap-1'>
                        <p className='text-muted-foreground line-clamp-3 flex-1 text-xs'>
                          {storyboard.text_to_image || '暂无提示词'}
                        </p>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-5 w-5 flex-shrink-0 p-0'
                          onClick={() =>
                            handleStartEditPrompt(
                              index,
                              storyboard.text_to_image || ''
                            )
                          }
                        >
                          <Pencil className='h-3 w-3' />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* 角色选择按钮 */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant='outline'
                        size='sm'
                        className='h-7 w-full gap-1 text-xs'
                      >
                        <Users className='h-3 w-3' />
                        选择角色
                        {storyboard.character_refs &&
                          storyboard.character_refs.length > 0 && (
                            <Badge
                              variant='secondary'
                              className='ml-1 h-4 px-1 text-[10px]'
                            >
                              {storyboard.character_refs.length}
                            </Badge>
                          )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className='w-64' align='center'>
                      <div className='space-y-3'>
                        <div className='text-sm font-medium'>选择主体引用</div>
                        <p className='text-muted-foreground text-xs'>
                          选择主体后将使用「图文生图」模式（最多3个）
                        </p>
                        {getValidSubjectMappings().length === 0 ? (
                          <p className='text-muted-foreground py-2 text-xs'>
                            暂无可用主体，请先在Settings页面配置参考图
                          </p>
                        ) : (
                          <div className='space-y-2'>
                            {getValidSubjectMappings().map(
                              ({ fullRef, subject }) => {
                                const currentRefs =
                                  storyboard.character_refs || [];
                                const isChecked = currentRefs.includes(fullRef);
                                const canSelect =
                                  isChecked || currentRefs.length < 3;
                                const parsed = parseFullRef(fullRef);
                                const icon = parsed
                                  ? SUBJECT_TYPE_ICONS[parsed.type]
                                  : '❓';

                                return (
                                  <div
                                    key={fullRef}
                                    className='flex items-center gap-2'
                                  >
                                    <Checkbox
                                      id={`subject-${index}-${fullRef}`}
                                      checked={isChecked}
                                      disabled={!canSelect}
                                      onCheckedChange={(checked) => {
                                        const newRefs = checked
                                          ? [...currentRefs, fullRef]
                                          : currentRefs.filter(
                                              (r) => r !== fullRef
                                            );
                                        handleUpdateCharacterRefs(
                                          index,
                                          newRefs
                                        );
                                      }}
                                    />
                                    <Label
                                      htmlFor={`subject-${index}-${fullRef}`}
                                      className='flex cursor-pointer items-center gap-2 text-sm'
                                    >
                                      {subject.imageData && (
                                        <img
                                          src={subject.imageData}
                                          alt={fullRef}
                                          className='h-6 w-6 rounded object-cover'
                                        />
                                      )}
                                      <span>
                                        {icon} {fullRef}
                                      </span>
                                    </Label>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        )}
                        {storyboard.character_refs &&
                          storyboard.character_refs.length > 0 && (
                            <Button
                              variant='ghost'
                              size='sm'
                              className='w-full text-xs'
                              onClick={() =>
                                handleUpdateCharacterRefs(index, [])
                              }
                            >
                              清除所有主体
                            </Button>
                          )}
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* 选择分镜按钮（多选） */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant='outline'
                        size='sm'
                        className='h-7 w-full gap-1 text-xs'
                      >
                        <Layers className='h-3 w-3' />
                        选择分镜
                        {storyboard.ref_storyboard_indexes &&
                          storyboard.ref_storyboard_indexes.length > 0 && (
                            <Badge
                              variant='secondary'
                              className='ml-1 h-4 px-1 text-[10px]'
                            >
                              {storyboard.ref_storyboard_indexes.length}
                            </Badge>
                          )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className='w-72' align='center'>
                      <div className='space-y-3'>
                        <div className='text-sm font-medium'>选择参考分镜</div>
                        <p className='text-muted-foreground text-xs'>
                          选择其他分镜的已选中图片作为场景参考，保持风格一致性（可多选）
                        </p>
                        {/* 获取有已选中图片的其他分镜 */}
                        {(() => {
                          const availableStoryboards = storyboards.filter(
                            (sb) =>
                              sb.index !== index &&
                              sb.selected_image_index !== null &&
                              sb.images.length > 0
                          );
                          if (availableStoryboards.length === 0) {
                            return (
                              <p className='text-muted-foreground py-2 text-xs'>
                                暂无可用分镜，请先在其他分镜中选择图片
                              </p>
                            );
                          }
                          const currentRefs =
                            storyboard.ref_storyboard_indexes || [];
                          return (
                            <div className='max-h-48 space-y-2 overflow-y-auto'>
                              {availableStoryboards.map((sb) => {
                                const selectedImage =
                                  sb.images[sb.selected_image_index!];
                                const isSelected = currentRefs.includes(
                                  sb.index
                                );
                                return (
                                  <div
                                    key={sb.index}
                                    className={`flex cursor-pointer items-center gap-2 rounded border p-2 transition-colors ${
                                      isSelected
                                        ? 'border-primary bg-primary/10'
                                        : 'hover:border-primary/50'
                                    }`}
                                    onClick={() => {
                                      const newRefs = isSelected
                                        ? currentRefs.filter(
                                            (r) => r !== sb.index
                                          )
                                        : [...currentRefs, sb.index];
                                      handleUpdateRefStoryboardIndexes(
                                        index,
                                        newRefs
                                      );
                                    }}
                                  >
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={() => {
                                        const newRefs = isSelected
                                          ? currentRefs.filter(
                                              (r) => r !== sb.index
                                            )
                                          : [...currentRefs, sb.index];
                                        handleUpdateRefStoryboardIndexes(
                                          index,
                                          newRefs
                                        );
                                      }}
                                    />
                                    {selectedImage && (
                                      <img
                                        src={selectedImage.url}
                                        alt={`分镜 ${sb.index + 1}`}
                                        className='h-10 w-10 rounded object-cover'
                                      />
                                    )}
                                    <span className='text-sm'>
                                      分镜 #{sb.index + 1}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                        {storyboard.ref_storyboard_indexes &&
                          storyboard.ref_storyboard_indexes.length > 0 && (
                            <Button
                              variant='ghost'
                              size='sm'
                              className='w-full text-xs'
                              onClick={() => {
                                handleUpdateRefStoryboardIndexes(index, []);
                              }}
                            >
                              清除选择
                            </Button>
                          )}
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* 图片网格 - 水平滚动 */}
                  <div className='mt-auto'>
                    {storyboard.images.length > 0 ? (
                      <div className='flex gap-1 overflow-x-auto pb-1'>
                        {storyboard.images.map((image, imgIndex) => (
                          <div
                            key={imgIndex}
                            className={`group relative h-40 flex-shrink-0 cursor-pointer overflow-hidden rounded border-2 ${
                              storyboard.selected_image_index === imgIndex
                                ? 'border-primary'
                                : 'border-transparent hover:border-gray-300'
                            }`}
                            onClick={() => handleSelectImage(index, imgIndex)}
                          >
                            <img
                              src={image.url}
                              alt={`图片 ${imgIndex + 1}`}
                              className='h-full w-auto object-contain'
                            />
                            {storyboard.selected_image_index === imgIndex && (
                              <div className='bg-primary absolute top-0.5 right-0.5 rounded-full p-0.5'>
                                <CheckCircle className='h-2.5 w-2.5 text-white' />
                              </div>
                            )}
                            {/* 下载勾选框 - 左上角 */}
                            <div
                              className='absolute top-1 left-1 z-10'
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Checkbox
                                checked={downloadSelectedImages.has(
                                  `${index}-${imgIndex}`
                                )}
                                onCheckedChange={() =>
                                  toggleImageDownloadSelect(index, imgIndex)
                                }
                                className='data-[state=checked]:bg-primary h-4 w-4 border-white bg-white/80'
                              />
                            </div>
                            {/* 悬停时显示预览按钮 */}
                            <div className='absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100'>
                              <button
                                onClick={(e) => handlePreviewImage(image, e)}
                                className='rounded-full bg-white/90 p-1.5 transition-colors hover:bg-white'
                                aria-label='预览图片'
                              >
                                <ZoomIn className='h-3 w-3 text-gray-800' />
                              </button>
                            </div>
                          </div>
                        ))}
                        {/* 重新生成按钮 */}
                        <div
                          className='bg-muted flex h-40 w-40 flex-shrink-0 cursor-pointer items-center justify-center rounded border-2 border-dashed hover:bg-gray-100'
                          onClick={() => handleGenerateImage(index)}
                        >
                          {generatingImageIndices.has(index) ? (
                            <Loader2 className='h-4 w-4 animate-spin' />
                          ) : (
                            <RefreshCw className='text-muted-foreground h-4 w-4' />
                          )}
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleGenerateImage(index)}
                        disabled={generatingImageIndices.has(index)}
                        className='h-8 w-full text-xs'
                      >
                        {generatingImageIndices.has(index) ? (
                          <Loader2 className='mr-1 h-3 w-3 animate-spin' />
                        ) : (
                          <Image className='mr-1 h-3 w-3' />
                        )}
                        生成图片
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Bottom Actions */}
          <div className='flex items-center justify-between border-t pt-4'>
            <Button
              variant='outline'
              onClick={() =>
                router.push(`/dashboard/youtube/prompts/${projectId}`)
              }
              className='gap-1'
            >
              <ChevronLeft className='h-4 w-4' />
              返回上一步: 提示词编辑
            </Button>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={toggleAllImagesDownloadSelect}
              >
                {downloadSelectedImages.size > 0 &&
                downloadSelectedImages.size ===
                  storyboards.reduce((acc, sb) => acc + sb.images.length, 0)
                  ? '取消全选'
                  : '全选'}
              </Button>
              <Button
                variant='outline'
                disabled={
                  downloadSelectedImages.size === 0 || downloadingImages
                }
                className='gap-1'
                onClick={handleDownloadSelectedImages}
              >
                {downloadingImages ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <Download className='h-4 w-4' />
                )}
                下载勾选图片 ({downloadSelectedImages.size})
              </Button>
              <Button
                onClick={() => setActiveTab('video')}
                disabled={imageProgress.selected === 0}
                className='gap-1'
              >
                继续下一步: 视频生成
                <ChevronRight className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Video Generation Tab */}
        <TabsContent value='video' className='space-y-6'>
          {/* Progress */}
          <div className='bg-card space-y-4 rounded-lg border p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium'>生成进度</p>
                <p className='text-muted-foreground text-xs'>
                  已选择: {videoProgress.selected}/{videoProgress.total} 个分镜
                  {generatingVideoIndices.size > 0 &&
                    ` (${generatingVideoIndices.size} 个生成中)`}
                </p>
              </div>
              <div className='flex items-center gap-2'>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={handleCleanupVideos}
                  disabled={cleaningVideos || generatingVideoIndices.size > 0}
                  className='gap-1'
                >
                  {cleaningVideos ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <Trash2 className='h-4 w-4' />
                  )}
                  清理未选中
                </Button>
                <Button
                  size='sm'
                  onClick={handleGenerateAllVideos}
                  disabled={
                    generatingVideoIndices.size > 0 ||
                    imageProgress.selected === 0
                  }
                  className='gap-1'
                >
                  {generatingVideoIndices.size > 0 ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <RefreshCw className='h-4 w-4' />
                  )}
                  批量生成
                </Button>
              </div>
            </div>
            <Progress
              value={
                (videoProgress.selected / Math.max(videoProgress.total, 1)) *
                100
              }
              className='h-2'
            />
          </div>

          {/* No selected images warning */}
          {imageProgress.selected === 0 && (
            <div className='bg-muted/50 flex h-32 flex-col items-center justify-center gap-2 rounded-lg border'>
              <Image className='text-muted-foreground h-8 w-8' />
              <p className='text-muted-foreground'>
                请先在图片生成页面选择源图片
              </p>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setActiveTab('image')}
              >
                返回图片生成
              </Button>
            </div>
          )}

          {/* Storyboard Video Cards - 4列网格布局 */}
          {imageProgress.selected > 0 && (
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
              {storyboards.map((storyboard, index) => {
                const hasSelectedImage =
                  storyboard.selected_image_index !== null;
                const selectedImage = hasSelectedImage
                  ? storyboard.images[storyboard.selected_image_index!]
                  : null;

                return (
                  <Card
                    key={index}
                    className={`flex flex-col ${!hasSelectedImage ? 'opacity-50' : ''}`}
                  >
                    <CardHeader className='pb-2'>
                      <div className='flex items-center justify-between'>
                        <CardTitle className='text-sm'>
                          分镜 #{storyboard.index + 1}
                        </CardTitle>
                        <div className='flex items-center gap-1'>
                          {storyboard.selected_video_index !== null && (
                            <Badge variant='default' className='gap-1 text-xs'>
                              <CheckCircle className='h-3 w-3' />
                              已选
                            </Badge>
                          )}
                          {!hasSelectedImage && (
                            <Badge variant='destructive' className='text-xs'>
                              缺图
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className='flex flex-1 flex-col space-y-3'>
                      {/* 源图片 */}
                      {selectedImage && (
                        <div className='h-12 flex-shrink-0 overflow-hidden rounded'>
                          <img
                            src={selectedImage.url}
                            alt='源图片'
                            className='h-full w-auto object-contain'
                          />
                        </div>
                      )}

                      {/* 视频提示词编辑区域 */}
                      <div className='space-y-1'>
                        {editingVideoPromptIndex === index ? (
                          <div className='space-y-2'>
                            <Textarea
                              value={editedVideoPrompt}
                              onChange={(e) =>
                                setEditedVideoPrompt(e.target.value)
                              }
                              className='min-h-[60px] resize-none text-xs'
                              placeholder='输入视频提示词...'
                            />
                            <div className='flex gap-1'>
                              <Button
                                size='sm'
                                className='h-6 flex-1 gap-1 text-xs'
                                onClick={() => handleSaveVideoPrompt(index)}
                                disabled={savingVideoPrompt}
                              >
                                {savingVideoPrompt ? (
                                  <Loader2 className='h-3 w-3 animate-spin' />
                                ) : (
                                  <Save className='h-3 w-3' />
                                )}
                                保存
                              </Button>
                              <Button
                                size='sm'
                                variant='outline'
                                className='h-6 text-xs'
                                onClick={handleCancelEditVideoPrompt}
                                disabled={savingVideoPrompt}
                              >
                                取消
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className='flex items-start gap-1'>
                            <p className='text-muted-foreground line-clamp-3 flex-1 text-xs'>
                              {storyboard.image_to_video || '暂无视频提示词'}
                            </p>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='h-5 w-5 flex-shrink-0 p-0'
                              onClick={() =>
                                handleStartEditVideoPrompt(
                                  index,
                                  storyboard.image_to_video || ''
                                )
                              }
                            >
                              <Pencil className='h-3 w-3' />
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* 视频网格 - 水平滚动 */}
                      <div className='mt-auto'>
                        {hasSelectedImage && storyboard.videos.length > 0 ? (
                          <div className='flex gap-1 overflow-x-auto pb-1'>
                            {storyboard.videos.map((video, vidIndex) => (
                              <div
                                key={vidIndex}
                                className={`group relative h-40 w-[90px] flex-shrink-0 cursor-pointer overflow-hidden rounded border-2 ${
                                  storyboard.selected_video_index === vidIndex
                                    ? 'border-primary'
                                    : 'border-transparent hover:border-gray-300'
                                }`}
                                onClick={() =>
                                  handleSelectVideo(index, vidIndex)
                                }
                              >
                                <video
                                  src={video.url}
                                  className='h-full w-full object-cover'
                                />
                                <div className='absolute inset-0 flex items-center justify-center bg-black/30'>
                                  <Play className='h-4 w-4 text-white' />
                                </div>
                                {storyboard.selected_video_index ===
                                  vidIndex && (
                                  <div className='bg-primary absolute top-0.5 right-0.5 rounded-full p-0.5'>
                                    <CheckCircle className='h-2.5 w-2.5 text-white' />
                                  </div>
                                )}
                                {/* 下载勾选框 - 左上角 */}
                                <div
                                  className='absolute top-1 left-1 z-10'
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Checkbox
                                    checked={downloadSelectedVideos.has(
                                      `${index}-${vidIndex}`
                                    )}
                                    onCheckedChange={() =>
                                      toggleVideoDownloadSelect(index, vidIndex)
                                    }
                                    className='data-[state=checked]:bg-primary h-4 w-4 border-white bg-white/80'
                                  />
                                </div>
                                {/* 悬停时显示播放按钮 */}
                                <div className='absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100'>
                                  <button
                                    onClick={(e) => handlePlayVideo(video, e)}
                                    className='rounded-full bg-white/90 p-2 transition-colors hover:bg-white'
                                    aria-label='播放视频'
                                  >
                                    <Play className='h-4 w-4 fill-gray-800 text-gray-800' />
                                  </button>
                                </div>
                              </div>
                            ))}
                            {/* 重新生成按钮 */}
                            <div
                              className='bg-muted flex h-40 w-[90px] flex-shrink-0 cursor-pointer items-center justify-center rounded border-2 border-dashed hover:bg-gray-100'
                              onClick={() => handleGenerateVideo(index)}
                            >
                              {generatingVideoIndices.has(index) ? (
                                <Loader2 className='h-4 w-4 animate-spin' />
                              ) : (
                                <RefreshCw className='text-muted-foreground h-4 w-4' />
                              )}
                            </div>
                          </div>
                        ) : hasSelectedImage ? (
                          <Button
                            onClick={() => handleGenerateVideo(index)}
                            disabled={generatingVideoIndices.has(index)}
                            className='h-8 w-full text-xs'
                          >
                            {generatingVideoIndices.has(index) ? (
                              <Loader2 className='mr-1 h-3 w-3 animate-spin' />
                            ) : (
                              <Video className='mr-1 h-3 w-3' />
                            )}
                            生成视频
                          </Button>
                        ) : (
                          <p className='text-muted-foreground text-center text-xs'>
                            请先选择源图片
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Bottom Actions */}
          <div className='flex items-center justify-between border-t pt-4'>
            <Button
              variant='outline'
              onClick={() => setActiveTab('image')}
              className='gap-1'
            >
              <ChevronLeft className='h-4 w-4' />
              返回上一步: 图片生成
            </Button>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={toggleAllVideosDownloadSelect}
              >
                {downloadSelectedVideos.size > 0 &&
                downloadSelectedVideos.size ===
                  storyboards.reduce((acc, sb) => acc + sb.videos.length, 0)
                  ? '取消全选'
                  : '全选'}
              </Button>
              <Button
                disabled={
                  downloadSelectedVideos.size === 0 || downloadingVideos
                }
                className='gap-1'
                onClick={handleDownloadSelectedVideos}
              >
                {downloadingVideos ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <Download className='h-4 w-4' />
                )}
                下载勾选视频 ({downloadSelectedVideos.size})
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* 图片预览对话框 - 自适应尺寸 */}
      <Dialog open={previewImageOpen} onOpenChange={setPreviewImageOpen}>
        <DialogContent className='flex max-h-[95vh] max-w-[95vw] flex-col p-0'>
          <DialogHeader className='flex-shrink-0 p-4 pb-2'>
            <DialogTitle>图片预览</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <>
              <div className='flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-black/5 p-4'>
                <img
                  src={previewImage.url}
                  alt='图片预览'
                  className='max-h-[calc(95vh-120px)] max-w-full object-contain'
                  onLoad={handleImageLoad}
                />
              </div>
              <div className='text-muted-foreground flex flex-shrink-0 items-center justify-between border-t p-4 text-sm'>
                <span>
                  类型:{' '}
                  {previewImage.generation_type === 'text_to_image'
                    ? '文生图'
                    : '图文生图'}
                </span>
                {imageDimensions && (
                  <span>
                    尺寸: {imageDimensions.width} × {imageDimensions.height}
                  </span>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 视频播放器 */}
      <VideoPlayer
        video={previewVideo}
        open={previewVideoOpen}
        onOpenChange={setPreviewVideoOpen}
        title='视频预览'
      />
    </div>
  );
}
