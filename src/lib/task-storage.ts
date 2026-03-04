/**
 * 任务ID持久化工具
 * 用于在localStorage中保存和恢复任务ID，支持页面刷新后状态恢复
 */

const STORAGE_PREFIX = 'youtube_tasks_';

/**
 * 保存任务ID列表到localStorage
 */
export function saveTaskIds(projectId: string, taskIds: string[]): void {
  if (typeof window === 'undefined') return;

  const key = `${STORAGE_PREFIX}${projectId}`;
  try {
    localStorage.setItem(key, JSON.stringify(taskIds));
  } catch (error) {
    console.error('保存任务ID失败:', error);
  }
}

/**
 * 从localStorage加载任务ID列表
 */
export function loadTaskIds(projectId: string): string[] {
  if (typeof window === 'undefined') return [];

  const key = `${STORAGE_PREFIX}${projectId}`;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('加载任务ID失败:', error);
    return [];
  }
}

/**
 * 添加任务ID到localStorage
 */
export function addTaskId(projectId: string, taskId: string): void {
  const taskIds = loadTaskIds(projectId);
  if (!taskIds.includes(taskId)) {
    taskIds.push(taskId);
    saveTaskIds(projectId, taskIds);
  }
}

/**
 * 从localStorage移除任务ID
 */
export function removeTaskId(projectId: string, taskId: string): void {
  const taskIds = loadTaskIds(projectId);
  const filtered = taskIds.filter((id) => id !== taskId);
  if (filtered.length !== taskIds.length) {
    saveTaskIds(projectId, filtered);
  }
}

/**
 * 批量移除任务ID
 */
export function removeTaskIds(
  projectId: string,
  taskIdsToRemove: string[]
): void {
  const taskIds = loadTaskIds(projectId);
  const filtered = taskIds.filter((id) => !taskIdsToRemove.includes(id));
  saveTaskIds(projectId, filtered);
}

/**
 * 清除项目的所有任务ID
 */
export function clearTaskIds(projectId: string): void {
  if (typeof window === 'undefined') return;

  const key = `${STORAGE_PREFIX}${projectId}`;
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('清除任务ID失败:', error);
  }
}

/**
 * 检查是否有未完成的任务
 */
export function hasUnfinishedTasks(projectId: string): boolean {
  return loadTaskIds(projectId).length > 0;
}
