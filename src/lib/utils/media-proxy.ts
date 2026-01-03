/**
 * 媒体代理工具
 * 用于解决外部图片/视频的CORS问题
 */

/**
 * 判断URL是否需要代理
 * 本地URL和已知安全域名不需要代理
 */
function needsProxy(url: string): boolean {
  if (!url) return false;

  // 相对路径不需要代理
  if (url.startsWith('/')) return false;

  // data URL不需要代理
  if (url.startsWith('data:')) return false;

  // blob URL不需要代理
  if (url.startsWith('blob:')) return false;

  try {
    const parsedUrl = new URL(url);

    // 本地开发环境不需要代理
    if (
      parsedUrl.hostname === 'localhost' ||
      parsedUrl.hostname === '127.0.0.1'
    ) {
      return false;
    }

    // 已知安全的CDN域名不需要代理
    const safeDomains = [
      'picsum.photos',
      'images.unsplash.com',
      'via.placeholder.com',
      'placehold.co'
    ];

    if (safeDomains.some((domain) => parsedUrl.hostname.includes(domain))) {
      return false;
    }

    // 其他外部URL需要代理
    return true;
  } catch {
    return false;
  }
}

/**
 * 获取代理后的媒体URL
 * @param url 原始URL
 * @returns 代理URL或原始URL
 */
export function getProxiedMediaUrl(url: string): string {
  if (!url) return url;

  if (!needsProxy(url)) {
    return url;
  }

  // 使用代理路由
  return `/api/proxy/media?url=${encodeURIComponent(url)}`;
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
