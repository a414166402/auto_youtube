/**
 * 媒体URL工具
 * 直接使用后端返回的图床URL，无需代理
 */

/**
 * 获取图片URL（直接返回原始URL）
 */
export function getProxiedImageUrl(url: string): string {
  return url || '';
}

/**
 * 获取视频URL（直接返回原始URL）
 */
export function getProxiedVideoUrl(url: string): string {
  return url || '';
}
