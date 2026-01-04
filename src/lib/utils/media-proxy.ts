/**
 * 媒体代理工具
 * 用于解决外部图片/视频的CORS问题
 *
 * 所有后端媒体文件都通过 Next.js API 代理访问，避免 CORS 问题
 */

/**
 * 判断URL是否是后端媒体路径
 * 后端媒体路径以 /media/ 开头
 */
function isBackendMediaPath(url: string): boolean {
  if (!url) return false;
  return url.startsWith('/media/');
}

/**
 * 获取代理后的媒体URL
 * @param url 原始URL（相对路径如 /media/youtube/...）
 * @returns 代理URL
 */
export function getProxiedMediaUrl(url: string): string {
  if (!url) return url;

  // data URL 和 blob URL 不需要代理
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  // 后端媒体路径通过代理访问
  if (isBackendMediaPath(url)) {
    return `/api/proxy/media?url=${encodeURIComponent(url)}`;
  }

  // 其他URL直接返回
  return url;
}

/**
 * 获取代理后的图片URL
 */
export function getProxiedImageUrl(url: string): string {
  return getProxiedMediaUrl(url);
}

/**
 * 获取代理后的视频URL
 */
export function getProxiedVideoUrl(url: string): string {
  return getProxiedMediaUrl(url);
}
