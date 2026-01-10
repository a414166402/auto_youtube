// 主体配置 - 支持角色、物品、场景三种类型
// 全局主体库：存储主体图片和名称，所有项目共享
// 项目级映射：每个项目单独配置"角色A/物品B/场景C对应哪个全局主体"

// ============ 类型定义 ============

// 主体类型
export type SubjectType = 'character' | 'object' | 'scene';

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

// 全局主体定义
export interface GlobalSubject {
  id: string; // 唯一ID，格式: `${type}_${identifier}`，如 "character_A"
  type: SubjectType; // 主体类型
  identifier: string; // 标识符 A-Z
  name: string; // 主体名称
  imageData?: string; // Base64 图片数据
}

// 全局主体库（按类型分组）
export interface GlobalSubjectLibrary {
  character: GlobalSubject[];
  object: GlobalSubject[];
  scene: GlobalSubject[];
}

// 项目级主体映射
// key: 完整引用（如 "角色A"、"物品B"）
// value: 全局主体ID（如 "character_A"）
export interface ProjectSubjectMapping {
  [fullRef: string]: string | null;
}

// ============ 常量 ============

// 可用的标识符列表 A-Z
export const AVAILABLE_IDENTIFIERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// IndexedDB 配置
const DB_NAME = 'youtube_subject_db';
const DB_VERSION = 2; // 升级版本以支持新结构
const STORE_NAME = 'subjects';

// localStorage keys
const PROJECT_MAPPINGS_KEY_PREFIX = 'youtube_project_subject_mappings_';

// ============ 默认值 ============

export const DEFAULT_SUBJECT_LIBRARY: GlobalSubjectLibrary = {
  character: [],
  object: [],
  scene: []
};

// ============ IndexedDB 操作 ============

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('IndexedDB not available on server'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 删除旧的 store（如果存在）
      if (db.objectStoreNames.contains('characters')) {
        db.deleteObjectStore('characters');
      }

      // 创建新的 store
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('type', 'type', { unique: false });
      }
    };
  });
}

// 从 IndexedDB 加载全局主体库
export async function loadGlobalSubjectLibraryAsync(): Promise<GlobalSubjectLibrary> {
  if (typeof window === 'undefined') {
    return DEFAULT_SUBJECT_LIBRARY;
  }

  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const subjects = request.result as GlobalSubject[];
        const library: GlobalSubjectLibrary = {
          character: [],
          object: [],
          scene: []
        };

        for (const subject of subjects) {
          if (library[subject.type]) {
            library[subject.type].push(subject);
          }
        }

        // 按标识符排序
        for (const type of Object.keys(library) as SubjectType[]) {
          library[type].sort((a, b) =>
            a.identifier.localeCompare(b.identifier)
          );
        }

        resolve(library);
      };
      request.onerror = () => {
        console.error('Failed to load from IndexedDB:', request.error);
        resolve(DEFAULT_SUBJECT_LIBRARY);
      };
    });
  } catch (error) {
    console.error('Failed to open IndexedDB:', error);
    return DEFAULT_SUBJECT_LIBRARY;
  }
}

// 同步加载（返回默认值，用于初始渲染）
export function loadGlobalSubjectLibrary(): GlobalSubjectLibrary {
  return DEFAULT_SUBJECT_LIBRARY;
}

// 保存单个主体到 IndexedDB
export async function saveSubjectAsync(subject: GlobalSubject): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.put(subject);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to save subject:', error);
    throw error;
  }
}

// 删除主体
export async function deleteSubjectAsync(id: string): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to delete subject:', error);
    throw error;
  }
}

// 保存整个主体库
export async function saveGlobalSubjectLibraryAsync(
  library: GlobalSubjectLibrary
): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    // 清空并重新写入
    await new Promise<void>((resolve, reject) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    });

    const allSubjects = [
      ...library.character,
      ...library.object,
      ...library.scene
    ];

    for (const subject of allSubjects) {
      await new Promise<void>((resolve, reject) => {
        const putRequest = store.put(subject);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      });
    }
  } catch (error) {
    console.error('Failed to save library:', error);
    throw error;
  }
}

// ============ 主体操作辅助函数 ============

// 生成主体ID
export function generateSubjectId(
  type: SubjectType,
  identifier: string
): string {
  return `${type}_${identifier}`;
}

// 解析主体ID
export function parseSubjectId(
  id: string
): { type: SubjectType; identifier: string } | null {
  const parts = id.split('_');
  if (parts.length !== 2) return null;
  const [type, identifier] = parts;
  if (!['character', 'object', 'scene'].includes(type)) return null;
  return { type: type as SubjectType, identifier };
}

// 获取下一个可用的标识符
export function getNextIdentifier(
  existingSubjects: GlobalSubject[]
): string | null {
  const usedIdentifiers = new Set(existingSubjects.map((s) => s.identifier));
  for (const id of AVAILABLE_IDENTIFIERS) {
    if (!usedIdentifiers.has(id)) {
      return id;
    }
  }
  return null; // 已用完所有标识符
}

// 检查是否可以添加新主体（必须按顺序）
export function canAddSubject(existingSubjects: GlobalSubject[]): boolean {
  if (existingSubjects.length === 0) return true;
  if (existingSubjects.length >= 26) return false; // A-Z 最多26个

  // 检查是否按顺序
  const sortedIdentifiers = existingSubjects.map((s) => s.identifier).sort();

  for (let i = 0; i < sortedIdentifiers.length; i++) {
    if (sortedIdentifiers[i] !== AVAILABLE_IDENTIFIERS[i]) {
      return false; // 不连续
    }
  }

  return true;
}

// 检查是否可以删除主体（只能删除最后一个）
export function canDeleteSubject(
  existingSubjects: GlobalSubject[],
  identifier: string
): boolean {
  if (existingSubjects.length === 0) return false;

  const sortedSubjects = [...existingSubjects].sort((a, b) =>
    a.identifier.localeCompare(b.identifier)
  );

  return sortedSubjects[sortedSubjects.length - 1].identifier === identifier;
}

// 创建新主体
export function createSubject(
  type: SubjectType,
  identifier: string,
  name: string = ''
): GlobalSubject {
  return {
    id: generateSubjectId(type, identifier),
    type,
    identifier,
    name,
    imageData: undefined
  };
}

// 更新主体名称
export function updateSubjectName(
  library: GlobalSubjectLibrary,
  id: string,
  name: string
): GlobalSubjectLibrary {
  const parsed = parseSubjectId(id);
  if (!parsed) return library;

  return {
    ...library,
    [parsed.type]: library[parsed.type].map((s) =>
      s.id === id ? { ...s, name } : s
    )
  };
}

// 更新主体图片
export function updateSubjectImage(
  library: GlobalSubjectLibrary,
  id: string,
  imageData: string | undefined
): GlobalSubjectLibrary {
  const parsed = parseSubjectId(id);
  if (!parsed) return library;

  return {
    ...library,
    [parsed.type]: library[parsed.type].map((s) =>
      s.id === id ? { ...s, imageData } : s
    )
  };
}

// 添加主体到库
export function addSubjectToLibrary(
  library: GlobalSubjectLibrary,
  subject: GlobalSubject
): GlobalSubjectLibrary {
  return {
    ...library,
    [subject.type]: [...library[subject.type], subject].sort((a, b) =>
      a.identifier.localeCompare(b.identifier)
    )
  };
}

// 从库中删除主体
export function removeSubjectFromLibrary(
  library: GlobalSubjectLibrary,
  id: string
): GlobalSubjectLibrary {
  const parsed = parseSubjectId(id);
  if (!parsed) return library;

  return {
    ...library,
    [parsed.type]: library[parsed.type].filter((s) => s.id !== id)
  };
}

// ============ 项目级映射 ============

// 加载项目级主体映射
export function loadProjectSubjectMapping(
  projectId: string
): ProjectSubjectMapping {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const stored = localStorage.getItem(
      PROJECT_MAPPINGS_KEY_PREFIX + projectId
    );
    if (stored) {
      return JSON.parse(stored) as ProjectSubjectMapping;
    }
  } catch (error) {
    console.error('Failed to load project mapping:', error);
  }

  return {};
}

// 保存项目级主体映射
export function saveProjectSubjectMapping(
  projectId: string,
  mapping: ProjectSubjectMapping
): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(
      PROJECT_MAPPINGS_KEY_PREFIX + projectId,
      JSON.stringify(mapping)
    );
  } catch (error) {
    console.error('Failed to save project mapping:', error);
  }
}

// 更新项目级单个映射
export function updateProjectSubjectMapping(
  mapping: ProjectSubjectMapping,
  fullRef: string, // 如 "角色A"、"物品B"
  subjectId: string | null
): ProjectSubjectMapping {
  return { ...mapping, [fullRef]: subjectId };
}

// 删除项目级主体映射
export function deleteProjectSubjectMapping(projectId: string): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(PROJECT_MAPPINGS_KEY_PREFIX + projectId);
  } catch (error) {
    console.error('Failed to delete project mapping:', error);
  }
}

// ============ 提示词解析 ============

// 从提示词中提取所有主体引用
// 格式: 角色A、角色B、物品A、物品B、场景A、场景B 等
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

// 解析完整引用为类型和标识符
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

// 生成完整引用
export function generateFullRef(type: SubjectType, identifier: string): string {
  return `${SUBJECT_TYPE_LABELS[type]}${identifier}`;
}

// ============ 辅助函数 ============

// 将文件转换为 Base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 根据项目映射和全局主体库，获取完整引用对应的主体信息
export function getSubjectForRef(
  fullRef: string,
  projectMapping: ProjectSubjectMapping,
  library: GlobalSubjectLibrary
): GlobalSubject | null {
  const subjectId = projectMapping[fullRef];
  if (!subjectId) return null;

  const parsed = parseSubjectId(subjectId);
  if (!parsed) return null;

  return library[parsed.type].find((s) => s.id === subjectId) || null;
}

// 验证项目中引用的主体是否都已配置图片
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
    if (!subject?.imageData) {
      missingRefs.push(ref);
    }
  }

  return {
    valid: missingRefs.length === 0 && unmappedRefs.length === 0,
    missingRefs,
    unmappedRefs
  };
}

// 获取项目中已配置的主体列表（有映射且有图片）
export function getConfiguredSubjectsForProject(
  projectMapping: ProjectSubjectMapping,
  library: GlobalSubjectLibrary
): { fullRef: string; subject: GlobalSubject }[] {
  const result: { fullRef: string; subject: GlobalSubject }[] = [];

  for (const [fullRef, subjectId] of Object.entries(projectMapping)) {
    if (!subjectId) continue;

    const subject = getSubjectForRef(fullRef, projectMapping, library);
    if (subject?.imageData) {
      result.push({ fullRef, subject });
    }
  }

  return result;
}

// 获取主体显示名称
export function getSubjectDisplayName(
  fullRef: string,
  projectMapping: ProjectSubjectMapping,
  library: GlobalSubjectLibrary
): string {
  const subject = getSubjectForRef(fullRef, projectMapping, library);
  if (subject?.name) {
    return `${fullRef}: ${subject.name}`;
  }
  return fullRef;
}

// 获取库中所有有图片的主体
export function getSubjectsWithImages(
  library: GlobalSubjectLibrary
): GlobalSubject[] {
  return [...library.character, ...library.object, ...library.scene].filter(
    (s) => !!s.imageData
  );
}

// 获取特定类型的有图片主体
export function getSubjectsWithImagesByType(
  library: GlobalSubjectLibrary,
  type: SubjectType
): GlobalSubject[] {
  return library[type].filter((s) => !!s.imageData);
}
