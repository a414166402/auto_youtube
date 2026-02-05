// 主体配置 - 支持角色、物品、场景三种类型
// V2: 全局主体库改为服务端存储，通过 API 管理
// 项目级映射：存储在项目 JSONB 的 subject_mappings 字段
// 注意：identifier 字段已废弃，主体通过 UUID 标识

import type { Subject, SubjectType } from '@/types/youtube';

// ============ 重新导出类型（兼容旧代码）============
export type { SubjectType } from '@/types/youtube';

// ============ 常量 ============

// 主体类型中文名称映射
export const SUBJECT_TYPE_LABELS: Record<SubjectType, string> = {
  character: '角色',
  object: '物品',
  scene: '场景'
};

// 主体类型图标（用于UI展示）
export const SUBJECT_TYPE_ICONS: Record<SubjectType, string> = {
  character: '👤',
  object: '📦',
  scene: '🏞️'
};

// ============ 类型定义 ============

// GlobalSubject 作为 Subject 的别名（兼容旧代码）
export interface GlobalSubject {
  id: string;
  type: SubjectType;
  identifier: string; // 已废弃，保留兼容
  name: string;
  description?: string | null; // 主体描述
  imageData?: string; // 兼容旧代码，实际使用 image_url
  image_url?: string; // 新字段
}

// 全局主体库（按类型分组）- 用于前端状态管理
export interface GlobalSubjectLibrary {
  character: GlobalSubject[];
  object: GlobalSubject[];
  scene: GlobalSubject[];
}

// 项目级主体映射
// key: 提示词中的引用（如 "角色A"、"物品B"）
// value: 全局主体UUID
export interface ProjectSubjectMapping {
  [ref: string]: string | null;
}

// ============ 默认值 ============

export const DEFAULT_SUBJECT_LIBRARY: GlobalSubjectLibrary = {
  character: [],
  object: [],
  scene: []
};

// ============ Subject 转换函数 ============

/**
 * 将后端 Subject 转换为前端 GlobalSubject 格式
 */
export function subjectToGlobalSubject(subject: Subject): GlobalSubject {
  return {
    id: subject.id,
    type: subject.type,
    identifier: subject.identifier || '', // 兼容旧数据
    name: subject.name || '',
    description: subject.description, // 添加描述字段
    imageData: subject.image_url, // 兼容旧代码
    image_url: subject.image_url
  };
}

/**
 * 将后端 Subject 数组转换为 GlobalSubjectLibrary 格式
 */
export function subjectsToLibrary(subjects: Subject[]): GlobalSubjectLibrary {
  const library: GlobalSubjectLibrary = {
    character: [],
    object: [],
    scene: []
  };

  for (const subject of subjects) {
    const globalSubject = subjectToGlobalSubject(subject);
    if (library[subject.type]) {
      library[subject.type].push(globalSubject);
    }
  }

  return library;
}

// ============ 提示词解析 ============

/**
 * 从提示词中提取所有主体引用
 * 格式: 角色A、角色B、物品A、物品B、场景A、场景B 等
 */
export function extractSubjectRefs(prompt: string): string[] {
  const refs: string[] = [];
  const pattern = /(角色|物品|场景)([A-Z])/g;
  let match;

  while ((match = pattern.exec(prompt)) !== null) {
    const fullRef = match[0]; // 如 "角色A"
    if (!refs.includes(fullRef)) {
      refs.push(fullRef);
    }
  }

  return refs;
}

/**
 * 解析完整引用为类型和标识符
 */
export function parseFullRef(
  fullRef: string
): { type: SubjectType; identifier: string } | null {
  const match = fullRef.match(/^(角色|物品|场景)([A-Z])$/);
  if (!match) return null;

  const typeMap: Record<string, SubjectType> = {
    角色: 'character',
    物品: 'object',
    场景: 'scene'
  };

  return {
    type: typeMap[match[1]],
    identifier: match[2]
  };
}

/**
 * 生成完整引用
 */
export function generateFullRef(type: SubjectType, identifier: string): string {
  return `${SUBJECT_TYPE_LABELS[type]}${identifier}`;
}

// ============ 项目级映射辅助函数 ============

/**
 * 更新项目级单个映射
 */
export function updateProjectSubjectMapping(
  mapping: ProjectSubjectMapping,
  ref: string, // 如 "角色A"、"物品B"
  subjectId: string | null
): ProjectSubjectMapping {
  return { ...mapping, [ref]: subjectId };
}

/**
 * 根据项目映射和全局主体库，获取引用对应的主体信息
 */
export function getSubjectForRef(
  ref: string,
  projectMapping: ProjectSubjectMapping,
  library: GlobalSubjectLibrary
): GlobalSubject | null {
  const subjectId = projectMapping[ref];
  if (!subjectId) return null;

  // 在所有类型中查找
  for (const type of ['character', 'object', 'scene'] as SubjectType[]) {
    const found = library[type].find((s) => s.id === subjectId);
    if (found) return found;
  }

  return null;
}

/**
 * 根据 UUID 获取主体
 */
export function getSubjectById(
  id: string,
  library: GlobalSubjectLibrary
): GlobalSubject | null {
  for (const type of ['character', 'object', 'scene'] as SubjectType[]) {
    const found = library[type].find((s) => s.id === id);
    if (found) return found;
  }
  return null;
}

/**
 * 验证项目中引用的主体是否都已配置图片
 */
export function validateSubjectRefs(
  refs: string[],
  projectMapping: ProjectSubjectMapping,
  library: GlobalSubjectLibrary
): { valid: boolean; missingRefs: string[]; unmappedRefs: string[] } {
  const missingRefs: string[] = [];
  const unmappedRefs: string[] = [];

  for (const ref of refs) {
    const subjectId = projectMapping[ref];
    if (!subjectId) {
      unmappedRefs.push(ref);
      continue;
    }

    const subject = getSubjectForRef(ref, projectMapping, library);
    const hasImage = subject?.imageData || subject?.image_url;
    if (!hasImage) {
      missingRefs.push(ref);
    }
  }

  return {
    valid: missingRefs.length === 0 && unmappedRefs.length === 0,
    missingRefs,
    unmappedRefs
  };
}

/**
 * 获取项目中已配置的主体列表（有映射且有图片）
 */
export function getConfiguredSubjectsForProject(
  projectMapping: ProjectSubjectMapping,
  library: GlobalSubjectLibrary
): { ref: string; subject: GlobalSubject }[] {
  const result: { ref: string; subject: GlobalSubject }[] = [];

  for (const [ref, subjectId] of Object.entries(projectMapping)) {
    if (!subjectId) continue;

    const subject = getSubjectForRef(ref, projectMapping, library);
    const hasImage = subject?.imageData || subject?.image_url;
    if (hasImage) {
      result.push({ ref, subject });
    }
  }

  return result;
}

/**
 * 获取主体显示名称
 */
export function getSubjectDisplayName(subject: GlobalSubject): string {
  return subject.name || '未命名';
}

/**
 * 获取库中所有有图片的主体
 */
export function getSubjectsWithImages(
  library: GlobalSubjectLibrary
): GlobalSubject[] {
  return [...library.character, ...library.object, ...library.scene].filter(
    (s) => !!(s.imageData || s.image_url)
  );
}

/**
 * 获取特定类型的有图片主体
 */
export function getSubjectsWithImagesByType(
  library: GlobalSubjectLibrary,
  type: SubjectType
): GlobalSubject[] {
  return library[type].filter((s) => !!(s.imageData || s.image_url));
}

/**
 * 获取主体的图片URL（兼容 imageData 和 image_url）
 */
export function getSubjectImageUrl(subject: GlobalSubject): string | undefined {
  return subject.image_url || subject.imageData;
}

// ============ 已废弃的函数（保留空实现以兼容旧代码）============

/** @deprecated 使用 API 替代 */
export async function loadGlobalSubjectLibraryAsync(): Promise<GlobalSubjectLibrary> {
  console.warn(
    'loadGlobalSubjectLibraryAsync is deprecated. Use getSubjects API instead.'
  );
  return DEFAULT_SUBJECT_LIBRARY;
}

/** @deprecated 使用 API 替代 */
export function loadGlobalSubjectLibrary(): GlobalSubjectLibrary {
  return DEFAULT_SUBJECT_LIBRARY;
}

/** @deprecated 使用 API 替代 */
export async function saveGlobalSubjectLibraryAsync(
  _library: GlobalSubjectLibrary
): Promise<void> {
  console.warn(
    'saveGlobalSubjectLibraryAsync is deprecated. Use subject API instead.'
  );
}

/** @deprecated 项目映射现在存储在项目 JSONB 中 */
export function loadProjectSubjectMapping(
  _projectId: string
): ProjectSubjectMapping {
  console.warn(
    'loadProjectSubjectMapping is deprecated. Use project.data.subject_mappings instead.'
  );
  return {};
}

/** @deprecated 项目映射现在存储在项目 JSONB 中 */
export function saveProjectSubjectMapping(
  _projectId: string,
  _mapping: ProjectSubjectMapping
): void {
  console.warn(
    'saveProjectSubjectMapping is deprecated. Use updateProject API instead.'
  );
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
