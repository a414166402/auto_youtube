export interface BacklinkData {
  source_url: string;
  target_url: string;
  anchor?: string;
  page_ascore?: number;
  nofollow?: boolean;
  first_seen?: string;
  last_seen?: string;
  extra?: Record<string, any>;
  // Add UI-specific fields
  weight?: number;
  automation_support?: boolean;
  type?: string;
}

export interface BacklinkRecord {
  domain: string;
  url: string;
  data: BacklinkData[];
}

export interface BacklinkTypeUpdate {
  backlink_domain: string;
  type: string;
}

export interface AutomationJsonUpload {
  curl_command: string;
  custom_fields: Record<string, any>;
  backlink_url: string;
}

export interface BacklinkTaskCreate {
  backlink_url: string;
  target_site: string;
  scheduled_time?: string;
  user_id?: number;
  custom_fields: Record<string, any>;
}

export interface RescheduleRequest {
  scheduled_time: string;
}

export interface BacklinkTask {
  id: number;
  backlink_url: string;
  target_site: string;
  status:
    | 'pending'
    | 'running'
    | 'completed'
    | 'failed'
    | 'done'
    | 'todo'
    | 'deleted';
  scheduled_time: string;
  created_at: string;
  user_id?: number;
  custom_fields: Record<string, any>;
  error_message?: string;
  job_id?: string;
  scheduler_status?: {
    next_run_time: string | null;
    is_scheduled: boolean;
  };
}

export interface AutomationPreviewResponse {
  backlink_domain: string;
  backlink_url: string;
  api_url: string;
  custom_fields: Record<string, any>;
  custom_fields_count: number;
}

export type BacklinkType = 'comment' | 'registration_comment' | 'captcha';

export interface FetchBacklinksParams {
  url: string;
}

export interface ListBacklinksParams {
  domain: string;
  iframe_exclude?: boolean;
  start_date?: string;
  end_date?: string;
  only_dofollow?: boolean;
  min_weight?: number;
  max_weight?: number;
  only_automation?: boolean;
  type_filter?: string;
  page?: number;
  page_size?: number;
  sort_by?: string;
  tree_format?: boolean;
  collapse_by?: string;
}

export interface ListTasksParams {
  status?: string;
  user_id?: number;
  limit?: number;
  offset?: number;
}
