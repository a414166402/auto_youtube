/**
 * 任务ID持久化工具
 * 用于在localStorage中保存和恢复任务ID，支持页面刷新后状态恢复
 */

const STORAGE_PREFIX = 'youtube_tasks_';

/**
 * 任务元数据
 */
export interface TaskMetadata {
  taskId: string;
  type: 'image' | 'video';
  storyboardIndex: number;
}

/**
 * 保存任务元数据列表到localStorage
 */
export function saveTaskMetadata(
  projectId: string,
  tasks: TaskMetadata[]
): void {
  if (typeof window === 'undefined') return;

  const key = `${STORAGE_PREFIX}${projectId}`;
  try {
    localStorage.setItem(key, JSON.stringify(tasks));
  } catch (error) {
    console.error('保存任务元数据失败:', error);
  }
}

/**
 * 从localStorage加载任务元数据列表
 */
export function loadTaskMetadata(projectId: string): TaskMetadata[] {
  if (typeof window === 'undefined') return [];

  const key = `${STORAGE_PREFIX}${projectId}`;
  try {
    const data = localStorage.getItem(key);
    if (!data) return [];

    const parsed = JSON.parse(data);
    // 兼容旧格式（纯字符串数组）
    if (Array.isArray(parsed) && parsed.length > 0) {
      if (typeof parsed[0] === 'string') {
        // 旧格式，无法恢复元数据，返回空数组
        console.warn('检测到旧格式任务数据，无法恢复loading状态');
        return [];
      }
      return parsed as TaskMetadata[];
    }
    return [];
  } catch (error) {
    console.error('加载任务元数据失败:', error);
    return [];
  }
}

/**
 * 添加任务元数据到localStorage
 */
export function addTaskMetadata(
  projectId: string,
  metadata: TaskMetadata
): void {
  const tasks = loadTaskMetadata(projectId);
  if (!tasks.find((t) => t.taskId === metadata.taskId)) {
    tasks.push(metadata);
    saveTaskMetadata(projectId, tasks);
  }
}

/**
 * 从localStorage移除任务元数据
 */
export function removeTaskMetadata(projectId: string, taskIds: string[]): void {
  const tasks = loadTaskMetadata(projectId);
  const filtered = tasks.filter((t) => !taskIds.includes(t.taskId));
  saveTaskMetadata(projectId, filtered);
}

/**
 * 清除项目的所有任务元数据
 */
export function clearTaskMetadata(projectId: string): void {
  if (typeof window === 'undefined') return;

  const key = `${STORAGE_PREFIX}${projectId}`;
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('清除任务元数据失败:', error);
  }
}

// ============ 向后兼容的旧API ============

/**
 * @deprecated 使用 saveTaskMetadata 替代
 */
export function saveTaskIds(projectId: string, taskIds: string[]): void {
  saveTaskMetadata(
    projectId,
    taskIds.map((id) => ({ taskId: id, type: 'image', storyboardIndex: -1 }))
  );
}

/**
 * @deprecated 使用 loadTaskMetadata 替代
 */
export function loadTaskIds(projectId: string): string[] {
  return loadTaskMetadata(projectId).map((t) => t.taskId);
}

/**
 * @deprecated 使用 addTaskMetadata 替代
 */
export function addTaskId(projectId: string, taskId: string): void {
  addTaskMetadata(projectId, {
    taskId,
    type: 'image',
    storyboardIndex: -1
  });
}

/**
 * @deprecated 使用 removeTaskMetadata 替代
 */
export function removeTaskIds(projectId: string, taskIds: string[]): void {
  removeTaskMetadata(projectId, taskIds);
}

/**
 * 检查是否有未完成的任务
 */
export function hasUnfinishedTasks(projectId: string): boolean {
  return loadTaskMetadata(projectId).length > 0;
}
