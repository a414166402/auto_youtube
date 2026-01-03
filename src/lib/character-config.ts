// 角色配置 - 分为全局角色库和项目级映射
// 全局角色库：存储角色图片和名称，所有项目共享
// 项目级映射：每个项目单独配置"角色A/B/C对应哪个全局角色"

// ============ 全局角色库 ============

export interface GlobalCharacter {
  id: number; // 角色ID 1-6
  name: string; // 角色名称
  imageData?: string; // Base64 图片数据
}

// 默认的6个全局角色
export const DEFAULT_GLOBAL_CHARACTERS: GlobalCharacter[] = [
  { id: 1, name: '' },
  { id: 2, name: '' },
  { id: 3, name: '' },
  { id: 4, name: '' },
  { id: 5, name: '' },
  { id: 6, name: '' }
];

// IndexedDB 配置
const DB_NAME = 'youtube_character_db';
const DB_VERSION = 1;
const STORE_NAME = 'characters';

// localStorage keys (仅用于项目映射，数据量小)
const PROJECT_MAPPINGS_KEY_PREFIX = 'youtube_project_character_mappings_';

// 打开 IndexedDB 数据库
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
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

// 从 IndexedDB 加载全局角色库（异步）
export async function loadGlobalCharactersAsync(): Promise<GlobalCharacter[]> {
  if (typeof window === 'undefined') {
    return DEFAULT_GLOBAL_CHARACTERS;
  }

  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const characters = request.result as GlobalCharacter[];
        if (characters.length === 6) {
          // 按 id 排序
          characters.sort((a, b) => a.id - b.id);
          resolve(characters);
        } else {
          resolve(DEFAULT_GLOBAL_CHARACTERS);
        }
      };
      request.onerror = () => {
        console.error('Failed to load from IndexedDB:', request.error);
        resolve(DEFAULT_GLOBAL_CHARACTERS);
      };
    });
  } catch (error) {
    console.error('Failed to open IndexedDB:', error);
    return DEFAULT_GLOBAL_CHARACTERS;
  }
}

// 同步加载（返回默认值，用于初始渲染避免 hydration 问题）
export function loadGlobalCharacters(): GlobalCharacter[] {
  return DEFAULT_GLOBAL_CHARACTERS;
}

// 保存全局角色库到 IndexedDB（异步）
export async function saveGlobalCharactersAsync(
  characters: GlobalCharacter[]
): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    // 清空并重新写入所有角色
    await new Promise<void>((resolve, reject) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    });

    for (const character of characters) {
      await new Promise<void>((resolve, reject) => {
        const putRequest = store.put(character);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      });
    }
  } catch (error) {
    console.error('Failed to save to IndexedDB:', error);
    throw error;
  }
}

// 兼容旧的同步 API（内部调用异步版本）
export function saveGlobalCharacters(characters: GlobalCharacter[]): void {
  saveGlobalCharactersAsync(characters).catch((error) => {
    console.error('Failed to save global characters:', error);
  });
}

// 更新全局角色名称
export function updateGlobalCharacterName(
  characters: GlobalCharacter[],
  id: number,
  name: string
): GlobalCharacter[] {
  return characters.map((c) => (c.id === id ? { ...c, name } : c));
}

// 更新全局角色图片
export function updateGlobalCharacterImage(
  characters: GlobalCharacter[],
  id: number,
  imageData: string | undefined
): GlobalCharacter[] {
  return characters.map((c) => (c.id === id ? { ...c, imageData } : c));
}

// 获取有图片的全局角色列表
export function getCharactersWithImages(
  characters: GlobalCharacter[]
): GlobalCharacter[] {
  return characters.filter((c) => !!c.imageData);
}

// ============ 项目级角色映射 ============

// 提示词中使用的角色标识
export const PROMPT_IDENTIFIERS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;
export type PromptIdentifier = (typeof PROMPT_IDENTIFIERS)[number];

// 项目级角色映射：角色标识 -> 全局角色ID
export interface ProjectCharacterMapping {
  [identifier: string]: number | null; // null 表示未映射
}

// 默认项目映射（全部未映射）
export const DEFAULT_PROJECT_MAPPING: ProjectCharacterMapping = {
  A: null,
  B: null,
  C: null,
  D: null,
  E: null,
  F: null
};

// 加载项目级角色映射
export function loadProjectMapping(projectId: string): ProjectCharacterMapping {
  if (typeof window === 'undefined') {
    return DEFAULT_PROJECT_MAPPING;
  }

  try {
    const stored = localStorage.getItem(
      PROJECT_MAPPINGS_KEY_PREFIX + projectId
    );
    if (stored) {
      const mapping = JSON.parse(stored) as ProjectCharacterMapping;
      // 确保所有标识都存在
      return { ...DEFAULT_PROJECT_MAPPING, ...mapping };
    }
  } catch (error) {
    console.error('Failed to load project mapping:', error);
  }

  return DEFAULT_PROJECT_MAPPING;
}

// 保存项目级角色映射
export function saveProjectMapping(
  projectId: string,
  mapping: ProjectCharacterMapping
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
export function updateProjectMapping(
  mapping: ProjectCharacterMapping,
  identifier: PromptIdentifier,
  globalCharacterId: number | null
): ProjectCharacterMapping {
  return { ...mapping, [identifier]: globalCharacterId };
}

// 删除项目级角色映射（项目删除时调用）
export function deleteProjectMapping(projectId: string): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(PROJECT_MAPPINGS_KEY_PREFIX + projectId);
  } catch (error) {
    console.error('Failed to delete project mapping:', error);
  }
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

// 根据项目映射和全局角色库，获取角色标识对应的角色信息
export function getCharacterForIdentifier(
  identifier: string,
  projectMapping: ProjectCharacterMapping,
  globalCharacters: GlobalCharacter[]
): GlobalCharacter | null {
  const globalId = projectMapping[identifier];
  if (globalId === null || globalId === undefined) {
    return null;
  }
  return globalCharacters.find((c) => c.id === globalId) || null;
}

// 验证项目中引用的角色是否都已配置图片
export function validateCharacterRefs(
  refs: string[],
  projectMapping: ProjectCharacterMapping,
  globalCharacters: GlobalCharacter[]
): { valid: boolean; missingRefs: string[]; unmappedRefs: string[] } {
  const missingRefs: string[] = [];
  const unmappedRefs: string[] = [];

  for (const ref of refs) {
    const globalId = projectMapping[ref];
    if (globalId === null || globalId === undefined) {
      unmappedRefs.push(ref);
      continue;
    }

    const character = globalCharacters.find((c) => c.id === globalId);
    if (!character?.imageData) {
      missingRefs.push(ref);
    }
  }

  return {
    valid: missingRefs.length === 0 && unmappedRefs.length === 0,
    missingRefs,
    unmappedRefs
  };
}

// 获取项目中已配置的角色列表（有映射且有图片）
export function getConfiguredCharactersForProject(
  projectMapping: ProjectCharacterMapping,
  globalCharacters: GlobalCharacter[]
): { identifier: PromptIdentifier; character: GlobalCharacter }[] {
  const result: { identifier: PromptIdentifier; character: GlobalCharacter }[] =
    [];

  for (const identifier of PROMPT_IDENTIFIERS) {
    const globalId = projectMapping[identifier];
    if (globalId !== null && globalId !== undefined) {
      const character = globalCharacters.find((c) => c.id === globalId);
      if (character?.imageData) {
        result.push({ identifier, character });
      }
    }
  }

  return result;
}

// 获取角色显示名称
export function getCharacterDisplayName(
  identifier: string,
  projectMapping: ProjectCharacterMapping,
  globalCharacters: GlobalCharacter[]
): string {
  const character = getCharacterForIdentifier(
    identifier,
    projectMapping,
    globalCharacters
  );
  if (character?.name) {
    return `${identifier}: ${character.name}`;
  }
  return identifier;
}
