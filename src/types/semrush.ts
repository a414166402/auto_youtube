/**
 * Semrush配置更新接口
 */
export interface SemrushConfigUpdate {
  token?: string;
  uname?: string;
  param?: string;
  key?: string;
  config?: string;
  lang?: string;
  base_url?: string;
}

/**
 * Semrush配置返回接口
 */
export interface SemrushConfig {
  uname: string;
  param: string;
  key: string;
  lang: string;
  base_url: string;
  token_status: string;
  config_status: string;
  config_content: {
    chat: {
      node: string;
      lang: string;
    };
    semrush: {
      node: string;
      lang: string;
    };
  };
  config_raw: string;
  default_config_example: {
    chat: {
      node: string;
      lang: string;
    };
    semrush: {
      node: string;
      lang: string;
    };
  };
}

/**
 * Semrush测试响应接口
 */
export interface SemrushTestResponse {
  status: string;
  message: string;
  test_domain: string;
  sample_records: number;
  config_valid: boolean;
}

/**
 * Semrush配置更新响应接口
 */
export interface SemrushUpdateResponse {
  status: string;
  message: string;
  updated_fields: string[];
  persistence: string;
  memory: string;
}
