'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// 格式化为YYYY-MM-DD格式，使用本地时区而不是UTC时区
function formatLocalDate(date: Date): string {
  return (
    date.getFullYear() +
    '-' +
    String(date.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(date.getDate()).padStart(2, '0')
  );
}
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Heading } from '@/components/ui/heading';
import PageContainer from '@/components/layout/page-container';
import {
  CalendarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DownloadIcon,
  ExternalLinkIcon,
  FilterIcon,
  InfoIcon,
  RefreshCwIcon,
  SearchIcon,
  CopyIcon,
  PlusIcon,
  XIcon
} from 'lucide-react';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import {
  listBacklinks,
  getAllBacklinkDomains,
  previewAutomationTemplate,
  getAutomationReadyUrls
} from '@/lib/api/backlinks';
import { BacklinkData } from '@/types/backlinks';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { createTaskFromAutomation } from '@/lib/api/backlinks';
import { useLanguage } from '@/contexts/LanguageContext';

// 定义新的外链类型
const BACKLINK_TYPES = [
  {
    value: 'comment',
    label: 'Comment Only',
    description: 'Pure comment backlinks without registration'
  },
  {
    value: 'registration_comment',
    label: 'Registration + Comment',
    description: 'Links requiring registration before commenting'
  },
  {
    value: 'captcha',
    label: 'Captcha Verification',
    description: 'Links requiring captcha verification'
  },
  {
    value: 'unknown',
    label: 'Unknown Type',
    description: 'Backlinks with unknown type'
  }
];

// Form schema for task creation
const taskFormSchema = z.object({
  target_site: z.string().url({ message: 'Please enter a valid URL' }),
  scheduled_time: z.string().optional(),
  scheduled_date: z.date().optional(),
  custom_fields: z.record(z.string()).optional()
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

export default function BacklinksListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { t, locale } = useLanguage();

  const [selectedDomain, setSelectedDomain] = useState<string>(
    searchParams.get('domain') || ''
  );
  const [domains, setDomains] = useState<string[]>(['crazycattle3d.io']);
  const [backlinks, setBacklinks] = useState<BacklinkData[]>([]);
  const [totalBacklinks, setTotalBacklinks] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [selectedBacklink, setSelectedBacklink] = useState<BacklinkData | null>(
    null
  );
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [automationReadyUrls, setAutomationReadyUrls] = useState<string[]>([]);

  // Form for task creation
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      target_site: '',
      scheduled_time: '',
      scheduled_date: undefined,
      custom_fields: {}
    }
  });

  // Filter states
  const [iframeFilter, setIframeFilter] = useState(false);
  const [dofollowFilter, setDofollowFilter] = useState(false);
  const [automationFilter, setAutomationFilter] = useState(false);
  const [weightRange, setWeightRange] = useState([0, 100]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string>('date');
  const [treeFormat, setTreeFormat] = useState<boolean>(false);
  const [collapseBy, setCollapseBy] = useState<string>('month');

  // 添加统计信息状态
  const [stats, setStats] = useState<{
    dofollow_count: number;
    automation_ready_count: number;
    score_distribution: {
      score_0_30: number;
      score_31_60: number;
      score_61_100: number;
    };
  }>({
    dofollow_count: 0,
    automation_ready_count: 0,
    score_distribution: {
      score_0_30: 0,
      score_31_60: 0,
      score_61_100: 0
    }
  });

  // 添加树状结构数据状态
  const [treeData, setTreeData] = useState<any>(null);

  // 加载域名列表
  useEffect(() => {
    const fetchDomains = async () => {
      try {
        const result = await getAllBacklinkDomains();
        if (result.domains && result.domains.length > 0) {
          setDomains(result.domains);

          // 如果URL中没有指定域名且列表非空，则默认选择第一个域名
          if (!selectedDomain && result.domains.length > 0) {
            setSelectedDomain(result.domains[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching domains:', error);
        toast({
          variant: 'destructive',
          title: '错误',
          description: '获取域名列表失败'
        });
      }
    };

    fetchDomains();
  }, [selectedDomain, toast]);

  // 获取自动化就绪的URLs列表
  useEffect(() => {
    if (!selectedDomain) return;

    const fetchAutomationReadyUrls = async () => {
      try {
        const data = await getAutomationReadyUrls(selectedDomain);
        setAutomationReadyUrls(data.urls || []);
      } catch (error) {
        console.error('Error fetching automation ready URLs:', error);
        setAutomationReadyUrls([]);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to fetch automation ready URLs'
        });
      }
    };

    fetchAutomationReadyUrls();
  }, [selectedDomain, toast]);

  // 获取统一的API参数函数，确保所有请求使用相同的日期处理逻辑
  const getBacklinksParams = (page: number) => {
    return {
      domain: selectedDomain,
      iframe_exclude: iframeFilter,
      only_dofollow: dofollowFilter,
      min_weight: weightRange[0],
      max_weight: weightRange[1],
      only_automation: automationFilter,
      type_filter: typeFilter.length > 0 ? typeFilter.join(',') : undefined,
      start_date: dateRange?.from
        ? formatLocalDate(new Date(dateRange.from))
        : undefined,
      end_date: dateRange?.to
        ? formatLocalDate(new Date(dateRange.to))
        : undefined,
      page: page,
      page_size: treeFormat ? 1000 : 100,
      sort_by: sortBy,
      tree_format: treeFormat,
      collapse_by: treeFormat ? collapseBy : undefined
    };
  };

  // 获取数据
  const fetchData = async () => {
    if (!selectedDomain) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a domain first'
      });
      return;
    }

    setLoading(true);
    try {
      // 使用统一的参数处理函数
      const params = getBacklinksParams(currentPage);
      console.log('Date filter (Local timezone):', {
        startDate: params.start_date,
        endDate: params.end_date
      });
      console.log('Fetching backlinks with page:', currentPage);

      const data = await listBacklinks(params);

      console.log('Backlinks data received:', data);

      // 处理不同格式的响应数据
      if (treeFormat && data.format === 'tree') {
        console.log(
          'Tree data structure example keys:',
          Object.keys(data.data || {})
        );
        setTreeData(data.data || {});
        setBacklinks([]);
      } else {
        setTreeData(null);
        setBacklinks(data.data || []);
      }

      setTotalBacklinks(data.total || 0);
      setTotalPages(data.total_pages || 1);

      // 更新统计信息
      if (data.stats) {
        setStats(data.stats);
      }

      setCurrentPage(data.current_page || currentPage);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching backlinks:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch backlinks'
      });
      setBacklinks([]);
      setTreeData(null);
      setTotalBacklinks(0);
      setTotalPages(1);
      setLoading(false);
    }
  };

  // 修改handleSearch函数使用统一的参数处理方式
  const handleSearch = () => {
    // 每次搜索都重置页码
    setCurrentPage(1);

    // 设置加载状态
    setLoading(true);
    // 清空当前数据，以便显示加载状态
    setBacklinks([]);
    setTreeData(null);

    // 直接调用API获取第1页数据，而不是使用fetchData函数
    setTimeout(() => {
      // 构建参数，强制使用页码1
      const params = getBacklinksParams(1);

      console.log(
        'Search button clicked: Fetching page 1 with params:',
        params
      );

      listBacklinks(params)
        .then((data) => {
          console.log('Backlinks data received for search (page 1):', data);

          // 处理不同格式的响应数据
          if (treeFormat && data.format === 'tree') {
            setTreeData(data.data || {});
            setBacklinks([]);
          } else {
            setTreeData(null);
            setBacklinks(data.data || []);
          }

          setTotalBacklinks(data.total || 0);
          setTotalPages(data.total_pages || 1);

          // 更新统计信息
          if (data.stats) {
            setStats(data.stats);
          }

          setLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching backlinks:', error);
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to fetch backlinks'
          });
          setBacklinks([]);
          setTreeData(null);
          setTotalBacklinks(0);
          setTotalPages(1);
          setLoading(false);
        });
    }, 0);
  };

  // Navigate to fetch page
  const handleFetchNew = () => {
    router.push('/dashboard/backlinks/fetch');
  };

  // Refresh current data - 现在通过Search按钮触发
  const handleRefresh = () => {
    if (!selectedDomain) return;

    toast({
      title: 'Refreshing data',
      description: `Updating backlinks for ${selectedDomain}`
    });

    fetchData();
  };

  // Handle preview button click
  const handlePreview = async (backlinkUrl: string) => {
    setPreviewLoading(true);
    try {
      const data = await previewAutomationTemplate(backlinkUrl);
      setPreviewData(data);

      // Update form with preview data
      form.setValue('target_site', data.custom_fields.url || '');
      form.setValue('custom_fields', data.custom_fields);

      // 设置默认的计划时间（可选）
      const defaultScheduledTime = new Date();
      defaultScheduledTime.setMinutes(defaultScheduledTime.getMinutes()); // 默认设置为现在
      form.setValue('scheduled_date', defaultScheduledTime);

      toast({
        title: t('common.success'),
        description: t('tasks.preview_success')
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('tasks.preview_error')
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  // Create new task
  const onSubmit = async (values: TaskFormValues) => {
    if (!selectedBacklink) return;

    try {
      // 获取时区偏移量（分钟）
      const tzOffsetMinutes = new Date().getTimezoneOffset();
      // 时区偏移量（小时，带符号）
      const tzOffsetHours = -tzOffsetMinutes / 60; // 注意：getTimezoneOffset返回的是相反数
      const tzOffsetSign = tzOffsetHours >= 0 ? '+' : '-';
      const tzOffsetHoursAbs = Math.abs(tzOffsetHours);
      const tzOffsetString = `${tzOffsetSign}${String(tzOffsetHoursAbs).padStart(2, '0')}:00`;

      // 构建ISO8601格式的时间字符串，包含时区信息
      let scheduledTime;

      if (values.scheduled_date) {
        // 克隆日期对象以避免修改原始对象
        const date = new Date(values.scheduled_date);

        // 直接构建ISO8601格式的时间字符串，确保时分秒都被正确保留
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        scheduledTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${tzOffsetString}`;

        console.log('Selected date components:', {
          year,
          month,
          day,
          hours,
          minutes,
          seconds,
          timezone: tzOffsetString
        });
        console.log('Selected date (local):', date.toString());
        console.log('Manually formatted date with timezone:', scheduledTime);
      } else {
        // 如果没有选择时间，使用当前时间
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        scheduledTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${tzOffsetString}`;
      }

      const response = await createTaskFromAutomation({
        backlink_url: selectedBacklink.source_url,
        target_site: values.target_site,
        custom_fields: values.custom_fields || {},
        scheduled_time: scheduledTime
      });

      console.log('Task creation response:', response);

      // 检查返回的数据结构，判断是否成功创建任务
      if (response.status === 'created' || response.task_id) {
        toast({
          title: t('common.success'),
          description: t('tasks.create_success')
        });

        form.reset();
        setTaskDialogOpen(false);
        setPreviewData(null);
        setSelectedBacklink(null);
      } else {
        toast({
          variant: 'destructive',
          title: t('common.error'),
          description: t('tasks.create_error')
        });
      }
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('tasks.create_error')
      });
    }
  };

  // Copy URL to clipboard
  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: t('common.copy'),
      description: t('notifications.url_copied')
    });
  };

  // Handle create task click
  const handleCreateTask = async (backlink: BacklinkData) => {
    setSelectedBacklink(backlink);
    setTaskDialogOpen(true);
    await handlePreview(backlink.source_url);
  };

  // Get weight color based on value
  const getWeightColor = (weight: number) => {
    if (weight <= 30) return 'text-red-500';
    if (weight <= 60) return 'text-yellow-500';
    return 'text-green-500';
  };

  // Get weight range for statistics
  const getWeightRange = (data: BacklinkData[]) => {
    if (!data || data.length === 0) return { min: 0, max: 100 };

    const weights = data.map((item) => getBacklinkWeight(item));
    return {
      min: Math.min(...weights),
      max: Math.max(...weights)
    };
  };

  // 从API返回数据中获取权重
  const getBacklinkWeight = (backlink: BacklinkData): number => {
    // 优先使用page_ascore，如果不存在则回退到weight字段
    return (
      backlink.extra?.page_ascore ||
      backlink.page_ascore ||
      backlink.weight ||
      0
    );
  };

  // 获取外链类型，兼容API返回的数据格式
  const getBacklinkType = (backlink: BacklinkData): string => {
    // 根据API返回的字段判断类型
    if (backlink.type === 'registration_comment') {
      return 'registration_comment';
    } else if (backlink.type === 'captcha') {
      return 'captcha';
    } else if (backlink.type === 'comment') {
      return 'comment';
    } else {
      return 'unknown';
    }
  };

  // 检测自动化支持函数
  const hasAutomationSupport = (backlink: BacklinkData): boolean => {
    // 检查URL是否在自动化就绪列表中
    return automationReadyUrls.includes(backlink.source_url);
  };

  // 获取外链类型样式
  const getBacklinkTypeStyle = (type: string): React.CSSProperties => {
    switch (type) {
      case 'comment':
        return {
          backgroundColor: '#3b82f6',
          borderColor: '#3b82f6',
          color: 'white'
        }; // 蓝色
      case 'registration_comment':
        return {
          backgroundColor: '#9333ea',
          borderColor: '#9333ea',
          color: 'white'
        }; // 紫色
      case 'captcha':
        return {
          backgroundColor: '#f97316',
          borderColor: '#f97316',
          color: 'white'
        }; // 橙色
      case 'unknown':
        return {
          backgroundColor: '#6b7280',
          borderColor: '#6b7280',
          color: 'white'
        }; // 灰色
      default:
        return {
          backgroundColor: '#6b7280',
          borderColor: '#6b7280',
          color: 'white'
        }; // 灰色
    }
  };

  // Filter backlinks by search query
  const filteredBacklinks = backlinks.filter(
    (backlink) =>
      backlink.source_url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (backlink.anchor &&
        backlink.anchor.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <PageContainer>
      <div className='container mx-auto space-y-6'>
        <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
          <Heading
            title={t('backlinks.title')}
            description={t('backlinks.description')}
          />

          <div className='flex flex-col gap-2 sm:flex-row'>
            <Button onClick={handleFetchNew} className='gap-2'>
              <ExternalLinkIcon className='h-4 w-4' />
              <span>{t('backlinks.getNew')}</span>
            </Button>
            <Button
              variant='outline'
              onClick={handleRefresh}
              disabled={!selectedDomain || loading}
              className='gap-2'
            >
              <RefreshCwIcon className='h-4 w-4' />
              <span>{t('common.refresh')}</span>
            </Button>
          </div>
        </div>

        <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
          <Card>
            <CardHeader>
              <CardTitle>{t('backlinks.stats')}</CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <span className='text-muted-foreground text-sm'>
                    {t('backlinks.totalBacklinks')}
                  </span>
                  <span className='text-lg font-bold'>{totalBacklinks}</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-muted-foreground text-sm'>
                    {t('backlinks.dofollowLinks')}
                  </span>
                  <span className='font-medium'>
                    {stats.dofollow_count}(
                    {totalBacklinks > 0
                      ? Math.round(
                          (stats.dofollow_count / totalBacklinks) * 100
                        )
                      : 0}
                    %)
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-muted-foreground text-sm'>
                    {t('backlinks.automationReady')}
                  </span>
                  <span className='font-medium'>
                    {stats.automation_ready_count}(
                    {totalBacklinks > 0
                      ? Math.round(
                          (stats.automation_ready_count / totalBacklinks) * 100
                        )
                      : 0}
                    %)
                  </span>
                </div>
              </div>

              <div>
                <h4 className='mb-2 text-sm font-medium'>
                  {t('backlinks.weightDistribution')}
                </h4>
                <div className='space-y-3'>
                  <div className='space-y-1'>
                    <div className='flex items-center justify-between text-xs'>
                      <span className='font-medium text-green-500'>
                        {t('backlinks.high')} (61-100)
                      </span>
                      <span>{stats.score_distribution.score_61_100}</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <div className='h-2 w-full overflow-hidden rounded-full bg-gray-200'>
                        <div
                          className='h-full bg-green-500'
                          style={{
                            width: `${
                              totalBacklinks > 0
                                ? (stats.score_distribution.score_61_100 /
                                    totalBacklinks) *
                                  100
                                : 0
                            }%`
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className='space-y-1'>
                    <div className='flex items-center justify-between text-xs'>
                      <span className='font-medium text-yellow-500'>
                        {t('backlinks.medium')} (31-60)
                      </span>
                      <span>{stats.score_distribution.score_31_60}</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <div className='h-2 w-full overflow-hidden rounded-full bg-gray-200'>
                        <div
                          className='h-full bg-yellow-500'
                          style={{
                            width: `${
                              totalBacklinks > 0
                                ? (stats.score_distribution.score_31_60 /
                                    totalBacklinks) *
                                  100
                                : 0
                            }%`
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className='space-y-1'>
                    <div className='flex items-center justify-between text-xs'>
                      <span className='font-medium text-red-500'>
                        {t('backlinks.low')} (0-30)
                      </span>
                      <span>{stats.score_distribution.score_0_30}</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <div className='h-2 w-full overflow-hidden rounded-full bg-gray-200'>
                        <div
                          className='h-full bg-red-500'
                          style={{
                            width: `${
                              totalBacklinks > 0
                                ? (stats.score_distribution.score_0_30 /
                                    totalBacklinks) *
                                  100
                                : 0
                            }%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('backlinks.typeBreakdown')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                {BACKLINK_TYPES.map((type) => (
                  <div
                    key={type.value}
                    className='flex items-center justify-between'
                  >
                    <div className='flex items-center gap-2'>
                      <Badge variant='outline'>
                        {t(
                          `backlinks.${type.value === 'registration_comment' ? 'registration' : type.value}`
                        )}
                      </Badge>
                    </div>
                    <span>
                      {treeFormat && treeData
                        ? Object.keys(treeData).reduce((count, period) => {
                            return (
                              count +
                              Object.keys(
                                treeData[period].domains || {}
                              ).reduce((domainCount, domain) => {
                                return (
                                  domainCount +
                                  (
                                    treeData[period].domains[domain].links || []
                                  ).filter(
                                    (link: any) =>
                                      getBacklinkType({
                                        source_url: link.source_url,
                                        type: link.type,
                                        extra: link.extra
                                      } as BacklinkData) === type.value
                                  ).length
                                );
                              }, 0)
                            );
                          }, 0)
                        : backlinks.filter(
                            (b) => getBacklinkType(b) === type.value
                          ).length}
                    </span>
                  </div>
                ))}

                {backlinks.length === 0 && (
                  <div className='text-muted-foreground py-2 text-center text-sm'>
                    {t('backlinks.noData')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className='flex flex-1 flex-col'>
          <CardHeader className='pb-3'>
            <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
              <div className='space-y-1'>
                <CardTitle>{t('backlinks.title')}</CardTitle>
                <CardDescription>
                  {selectedDomain
                    ? `Showing backlinks for ${selectedDomain} (${totalBacklinks} total)`
                    : 'Select a domain to view backlinks'}
                </CardDescription>
              </div>

              <div className='flex flex-row items-center gap-2'>
                <Select
                  value={selectedDomain}
                  onValueChange={setSelectedDomain}
                >
                  <SelectTrigger className='w-[180px]'>
                    <SelectValue placeholder={t('backlinks.selectDomain')} />
                  </SelectTrigger>
                  <SelectContent>
                    {domains.map((domain) => (
                      <SelectItem key={domain} value={domain}>
                        {domain}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <div className='border-t px-6 py-3'>
            <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
              <div className='relative max-w-sm'>
                <SearchIcon className='text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4' />
                <Input
                  type='search'
                  placeholder='Search backlinks...'
                  className='pl-8'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className='flex flex-row gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setFilterOpen(!filterOpen)}
                  className='gap-2'
                >
                  <FilterIcon className='h-4 w-4' />
                  <span>{t('backlinks.filters_title')}</span>
                  {filterOpen ? (
                    <ChevronUpIcon className='h-4 w-4' />
                  ) : (
                    <ChevronDownIcon className='h-4 w-4' />
                  )}
                </Button>

                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleSearch}
                  className='gap-2'
                >
                  <SearchIcon className='h-4 w-4' />
                  <span>{t('common.search')}</span>
                </Button>
              </div>
            </div>

            <Collapsible
              open={filterOpen}
              onOpenChange={setFilterOpen}
              className='mt-4'
            >
              <CollapsibleContent className='space-y-4'>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>
                      {t('backlinks.filter_options')}
                    </label>
                    <div className='space-y-2'>
                      <div className='flex items-center space-x-2'>
                        <Checkbox
                          id='iframe-filter'
                          checked={iframeFilter}
                          onCheckedChange={(checked) =>
                            setIframeFilter(checked as boolean)
                          }
                        />
                        <label
                          htmlFor='iframe-filter'
                          className='cursor-pointer text-sm'
                        >
                          {t('backlinks.exclude_iframes')}
                        </label>
                      </div>
                      <div className='flex items-center space-x-2'>
                        <Checkbox
                          id='dofollow-filter'
                          checked={dofollowFilter}
                          onCheckedChange={(checked) =>
                            setDofollowFilter(checked as boolean)
                          }
                        />
                        <label
                          htmlFor='dofollow-filter'
                          className='cursor-pointer text-sm'
                        >
                          {t('backlinks.only_dofollow')}
                        </label>
                      </div>
                      <div className='flex items-center space-x-2'>
                        <Checkbox
                          id='automation-filter'
                          checked={automationFilter}
                          onCheckedChange={(checked) =>
                            setAutomationFilter(checked as boolean)
                          }
                        />
                        <label
                          htmlFor='automation-filter'
                          className='cursor-pointer text-sm'
                        >
                          {t('backlinks.only_automation')}
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>
                      {t('backlinks.sort_by')}
                    </label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('backlinks.select_sort')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='date'>
                          {t('backlinks.date')}
                        </SelectItem>
                        <SelectItem value='weight'>
                          {t('backlinks.weight')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>
                      {t('backlinks.data_format')}
                    </label>
                    <div className='flex items-center space-x-2'>
                      <Checkbox
                        id='tree-format'
                        checked={treeFormat}
                        onCheckedChange={(checked) =>
                          setTreeFormat(checked as boolean)
                        }
                      />
                      <label
                        htmlFor='tree-format'
                        className='cursor-pointer text-sm'
                      >
                        {t('backlinks.enable_tree')}
                      </label>
                    </div>

                    {treeFormat && (
                      <div className='mt-2'>
                        <Select
                          value={collapseBy}
                          onValueChange={setCollapseBy}
                        >
                          <SelectTrigger className='w-full'>
                            <SelectValue
                              placeholder={t('backlinks.select_collapse')}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='month'>
                              {t('backlinks.by_month')}
                            </SelectItem>
                            <SelectItem value='day'>
                              {t('backlinks.by_day')}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>
                      {t('backlinks.weight_range')}
                    </label>
                    <Slider
                      value={weightRange}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={setWeightRange}
                      className='py-4'
                    />
                    <div className='text-muted-foreground flex justify-between text-xs'>
                      <span>{weightRange[0]}</span>
                      <span>{weightRange[1]}</span>
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>
                      {t('backlinks.discoveryDate')}
                    </label>
                    <DateRangePicker
                      dateRange={dateRange}
                      onDateRangeChange={setDateRange}
                      placeholder={t('backlinks.select_date_range')}
                    />
                  </div>

                  <div className='space-y-2 md:col-span-3'>
                    <label className='text-sm font-medium'>
                      {t('backlinks.backlinksType')}
                    </label>
                    <div className='flex flex-wrap gap-2'>
                      {BACKLINK_TYPES.map((type) => (
                        <Badge
                          key={type.value}
                          variant={
                            typeFilter.includes(type.value)
                              ? 'default'
                              : 'outline'
                          }
                          className='cursor-pointer'
                          onClick={() => {
                            if (typeFilter.includes(type.value)) {
                              setTypeFilter(
                                typeFilter.filter((t) => t !== type.value)
                              );
                            } else {
                              setTypeFilter([...typeFilter, type.value]);
                            }
                          }}
                          title={type.description}
                        >
                          {t(
                            `backlinks.${type.value === 'registration_comment' ? 'registration' : type.value}`
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <div className='border-t'>
            <div
              className='overflow-y-auto'
              style={{ maxHeight: treeFormat ? 'none' : '50vh' }}
            >
              {treeFormat && treeData ? (
                // 树状结构视图
                <div className='p-4'>
                  {Object.keys(treeData)
                    .sort((a, b) => a.localeCompare(b))
                    .map((period) => (
                      <Collapsible
                        key={period}
                        className='mb-6 overflow-hidden rounded-md border'
                      >
                        <CollapsibleTrigger className='bg-muted/30 hover:bg-muted/50 flex w-full items-center justify-between p-4'>
                          <div className='flex items-center gap-2'>
                            <h3 className='text-lg font-medium'>{period}</h3>
                            <Badge variant='outline' className='ml-2'>
                              {treeData[period].stats.domain_count} 个域名
                            </Badge>
                            <Badge variant='outline' className='ml-2'>
                              {treeData[period].stats.total_links} 个链接
                            </Badge>
                          </div>
                          <ChevronDownIcon className='h-5 w-5' />
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className='space-y-4 p-4'>
                            {Object.keys(treeData[period].domains)
                              .sort((a, b) => {
                                // 根据sortBy的值决定排序方式
                                if (sortBy === 'weight') {
                                  // 按平均权重降序
                                  return (
                                    treeData[period].domains[b].stats
                                      .avg_weight -
                                    treeData[period].domains[a].stats.avg_weight
                                  );
                                } else {
                                  // 默认按链接数量降序
                                  return (
                                    treeData[period].domains[b].stats
                                      .link_count -
                                    treeData[period].domains[a].stats.link_count
                                  );
                                }
                              })
                              .map((domain) => (
                                <Collapsible
                                  key={domain}
                                  className='overflow-hidden rounded-md border'
                                >
                                  <CollapsibleTrigger className='hover:bg-muted/20 flex w-full items-center justify-between p-3'>
                                    <div className='flex items-center gap-2'>
                                      <h4 className='font-medium'>{domain}</h4>
                                      <Badge variant='outline' className='ml-2'>
                                        {
                                          treeData[period].domains[domain].stats
                                            .link_count
                                        }{' '}
                                        个链接
                                      </Badge>
                                      <Badge
                                        variant='outline'
                                        className={cn(
                                          'ml-2',
                                          getWeightColor(
                                            treeData[period].domains[domain]
                                              .stats.avg_weight
                                          )
                                        )}
                                      >
                                        平均权重:{' '}
                                        {Math.round(
                                          treeData[period].domains[domain].stats
                                            .avg_weight
                                        )}
                                      </Badge>
                                      <Badge
                                        variant={
                                          treeData[period].domains[domain]
                                            .links[0]?.extra?.nofollow
                                            ? 'outline'
                                            : 'default'
                                        }
                                        className='ml-2'
                                      >
                                        {treeData[period].domains[domain]
                                          .links[0]?.extra?.nofollow
                                          ? 'nofollow'
                                          : 'dofollow'}
                                      </Badge>
                                      {/* 添加Type信息 */}
                                      {(() => {
                                        const type = getBacklinkType({
                                          source_url: domain,
                                          // 使用链接的type属性，确保正确传递
                                          type:
                                            treeData[period].domains[domain]
                                              .links[0]?.type || '',
                                          extra:
                                            treeData[period].domains[domain]
                                              .links[0]?.extra || {}
                                        } as BacklinkData);
                                        return (
                                          <Badge
                                            style={getBacklinkTypeStyle(type)}
                                            className='ml-2'
                                          >
                                            {t(
                                              `backlinks.${type === 'registration_comment' ? 'registration' : type}`
                                            )}
                                          </Badge>
                                        );
                                      })()}
                                      {/* 如果有自动化支持，显示Automation标签 */}
                                      {treeData[period].domains[
                                        domain
                                      ].links.some((link: any) =>
                                        hasAutomationSupport({
                                          source_url: link.source_url
                                        } as BacklinkData)
                                      ) && (
                                        <Badge
                                          variant='destructive'
                                          className='ml-2'
                                        >
                                          {t('backlinks.automation_badge')}
                                        </Badge>
                                      )}
                                    </div>
                                    <ChevronDownIcon className='h-4 w-4' />
                                  </CollapsibleTrigger>
                                  <CollapsibleContent>
                                    <Table>
                                      <TableHeader className='bg-background sticky top-0 z-10'>
                                        <TableRow>
                                          <TableHead>
                                            {t('backlinks.url')}
                                          </TableHead>
                                          <TableHead>
                                            {t('backlinks.anchor_text')}
                                          </TableHead>
                                          <TableHead>
                                            {t('backlinks.discovered')}
                                          </TableHead>
                                          <TableHead>
                                            {t('backlinks.follow')}
                                          </TableHead>
                                          <TableHead>
                                            {t('backlinks.weight')}
                                          </TableHead>
                                          <TableHead>
                                            {t('backlinks.type')}
                                          </TableHead>
                                          <TableHead className='text-right'>
                                            {t('common.actions')}
                                          </TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {treeData[period].domains[
                                          domain
                                        ].links.map(
                                          (backlink: any, index: number) => (
                                            <TableRow key={index}>
                                              <TableCell className='max-w-[200px] truncate font-medium'>
                                                <a
                                                  href={backlink.source_url}
                                                  target='_blank'
                                                  rel='noopener noreferrer'
                                                  className='flex items-center hover:underline'
                                                >
                                                  {backlink.source_url}
                                                  <ExternalLinkIcon className='ml-1 inline h-3 w-3' />
                                                </a>
                                              </TableCell>
                                              <TableCell className='max-w-[150px] truncate'>
                                                {backlink.anchor || '-'}
                                              </TableCell>
                                              <TableCell>
                                                {new Date(
                                                  backlink.first_seen ||
                                                    Date.now()
                                                ).toLocaleDateString()}
                                              </TableCell>
                                              <TableCell>
                                                <Badge
                                                  variant={
                                                    backlink.extra?.nofollow
                                                      ? 'outline'
                                                      : 'default'
                                                  }
                                                >
                                                  {backlink.extra?.nofollow
                                                    ? t('backlinks.nofollow')
                                                    : t('backlinks.dofollow')}
                                                </Badge>
                                              </TableCell>
                                              <TableCell>
                                                <span
                                                  className={cn(
                                                    'font-medium',
                                                    getWeightColor(
                                                      backlink.extra
                                                        ?.page_ascore || 0
                                                    )
                                                  )}
                                                >
                                                  {Math.round(
                                                    backlink.extra
                                                      ?.page_ascore || 0
                                                  )}
                                                </span>
                                              </TableCell>
                                              <TableCell>
                                                {(() => {
                                                  const type = getBacklinkType({
                                                    source_url:
                                                      backlink.source_url,
                                                    // 确保type属性正确传递
                                                    type: backlink.type || '',
                                                    extra: backlink.extra || {}
                                                  } as BacklinkData);
                                                  return (
                                                    <Badge
                                                      style={getBacklinkTypeStyle(
                                                        type
                                                      )}
                                                    >
                                                      {t(
                                                        `backlinks.${type === 'registration_comment' ? 'registration' : type}`
                                                      )}
                                                    </Badge>
                                                  );
                                                })()}
                                              </TableCell>
                                              <TableCell className='text-right'>
                                                <div className='flex justify-end gap-2'>
                                                  <Button
                                                    variant='ghost'
                                                    size='icon'
                                                    onClick={() =>
                                                      handleCopyUrl(
                                                        backlink.source_url
                                                      )
                                                    }
                                                    title={t(
                                                      'backlinks.copy_url_tooltip'
                                                    )}
                                                  >
                                                    <CopyIcon className='h-4 w-4' />
                                                  </Button>
                                                  {hasAutomationSupport({
                                                    source_url:
                                                      backlink.source_url
                                                  } as BacklinkData) && (
                                                    <Button
                                                      variant='ghost'
                                                      size='icon'
                                                      onClick={() =>
                                                        handleCreateTask({
                                                          source_url:
                                                            backlink.source_url
                                                        } as BacklinkData)
                                                      }
                                                      title={t(
                                                        'backlinks.create_task_tooltip'
                                                      )}
                                                    >
                                                      <PlusIcon className='h-4 w-4' />
                                                    </Button>
                                                  )}
                                                </div>
                                              </TableCell>
                                            </TableRow>
                                          )
                                        )}
                                      </TableBody>
                                    </Table>
                                  </CollapsibleContent>
                                </Collapsible>
                              ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                </div>
              ) : (
                // 普通列表视图
                <Table>
                  <TableHeader className='bg-background sticky top-0 z-10'>
                    <TableRow>
                      <TableHead>{t('backlinks.url')}</TableHead>
                      <TableHead>{t('backlinks.anchor_text')}</TableHead>
                      <TableHead>{t('backlinks.discovered')}</TableHead>
                      <TableHead>{t('backlinks.follow')}</TableHead>
                      <TableHead>{t('backlinks.weight')}</TableHead>
                      <TableHead>{t('backlinks.type')}</TableHead>
                      <TableHead className='text-right'>
                        {t('common.actions')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className='py-8 text-center'>
                          <div className='flex items-center justify-center space-x-2'>
                            <RefreshCwIcon className='h-5 w-5 animate-spin' />
                            <span>{t('common.loading_backlinks')}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredBacklinks.length > 0 ? (
                      filteredBacklinks.map((backlink, index) => (
                        <TableRow key={index}>
                          <TableCell className='max-w-[200px] truncate font-medium'>
                            <a
                              href={backlink.source_url}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='flex items-center hover:underline'
                            >
                              {backlink.source_url}
                              <ExternalLinkIcon className='ml-1 inline h-3 w-3' />
                            </a>
                          </TableCell>
                          <TableCell className='max-w-[150px] truncate'>
                            {backlink.anchor || '-'}
                          </TableCell>
                          <TableCell>
                            {new Date(
                              backlink.first_seen || Date.now()
                            ).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                backlink.nofollow || backlink.extra?.nofollow
                                  ? 'outline'
                                  : 'default'
                              }
                            >
                              {backlink.nofollow || backlink.extra?.nofollow
                                ? t('backlinks.nofollow')
                                : t('backlinks.dofollow')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                'font-medium',
                                getWeightColor(getBacklinkWeight(backlink))
                              )}
                            >
                              {Math.round(getBacklinkWeight(backlink))}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              style={getBacklinkTypeStyle(
                                getBacklinkType(backlink)
                              )}
                            >
                              {t(
                                `backlinks.${getBacklinkType(backlink) === 'registration_comment' ? 'registration' : getBacklinkType(backlink)}`
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className='text-right'>
                            <div className='flex justify-end gap-2'>
                              <Button
                                variant='ghost'
                                size='icon'
                                onClick={() =>
                                  handleCopyUrl(backlink.source_url)
                                }
                                title={t('backlinks.copy_url_tooltip')}
                              >
                                <CopyIcon className='h-4 w-4' />
                              </Button>
                              {hasAutomationSupport(backlink) && (
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  onClick={() => handleCreateTask(backlink)}
                                  title={t('backlinks.create_task_tooltip')}
                                >
                                  <PlusIcon className='h-4 w-4' />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className='py-8 text-center'>
                          <div className='flex flex-col items-center justify-center'>
                            <XIcon className='mb-2 h-5 w-5' />
                            <span>{t('backlinks.noData')}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>

          {totalPages > 1 && (
            <div className='flex items-center justify-between border-t px-4 py-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => {
                  if (currentPage > 1) {
                    // 先更新页码（减1）
                    const newPage = currentPage - 1;
                    setCurrentPage(newPage);

                    // 设置加载状态
                    setLoading(true);
                    // 清空当前数据，以便显示加载状态
                    if (treeFormat) {
                      setTreeData(null);
                    } else {
                      setBacklinks([]);
                    }

                    // 使用新页码直接调用fetchData函数
                    setTimeout(() => {
                      // 确保使用更新后的页码
                      const params = getBacklinksParams(newPage);

                      console.log(
                        'Fetching previous page with params:',
                        params
                      );

                      listBacklinks(params)
                        .then((data) => {
                          console.log(
                            'Backlinks data received for page',
                            newPage,
                            data
                          );

                          // 处理不同格式的响应数据
                          if (treeFormat && data.format === 'tree') {
                            setTreeData(data.data || {});
                            setBacklinks([]);
                          } else {
                            setTreeData(null);
                            setBacklinks(data.data || []);
                          }

                          setTotalBacklinks(data.total || 0);
                          setTotalPages(data.total_pages || 1);

                          // 更新统计信息
                          if (data.stats) {
                            setStats(data.stats);
                          }

                          setLoading(false);
                        })
                        .catch((error) => {
                          console.error('Error fetching backlinks:', error);
                          toast({
                            variant: 'destructive',
                            title: 'Error',
                            description: 'Failed to fetch backlinks'
                          });
                          setBacklinks([]);
                          setTreeData(null);
                          setTotalBacklinks(0);
                          setTotalPages(1);
                          setLoading(false);
                        });
                    }, 0);
                  }
                }}
                disabled={currentPage === 1 || loading}
              >
                {t('common.previous')}
              </Button>
              <div className='text-muted-foreground text-sm'>
                {t('common.page_of')
                  .replace('{current}', currentPage.toString())
                  .replace('{total}', totalPages.toString())}
              </div>
              <Button
                variant='outline'
                size='sm'
                onClick={() => {
                  if (currentPage < totalPages) {
                    // 先更新页码（加1）
                    const newPage = currentPage + 1;
                    setCurrentPage(newPage);

                    // 设置加载状态
                    setLoading(true);
                    // 清空当前数据，以便显示加载状态
                    if (treeFormat) {
                      setTreeData(null);
                    } else {
                      setBacklinks([]);
                    }

                    // 使用新页码直接调用fetchData函数
                    setTimeout(() => {
                      // 确保使用更新后的页码
                      const params = getBacklinksParams(newPage);

                      console.log('Fetching next page with params:', params);

                      listBacklinks(params)
                        .then((data) => {
                          console.log(
                            'Backlinks data received for page',
                            newPage,
                            data
                          );

                          // 处理不同格式的响应数据
                          if (treeFormat && data.format === 'tree') {
                            setTreeData(data.data || {});
                            setBacklinks([]);
                          } else {
                            setTreeData(null);
                            setBacklinks(data.data || []);
                          }

                          setTotalBacklinks(data.total || 0);
                          setTotalPages(data.total_pages || 1);

                          // 更新统计信息
                          if (data.stats) {
                            setStats(data.stats);
                          }

                          setLoading(false);
                        })
                        .catch((error) => {
                          console.error('Error fetching backlinks:', error);
                          toast({
                            variant: 'destructive',
                            title: 'Error',
                            description: 'Failed to fetch backlinks'
                          });
                          setBacklinks([]);
                          setTreeData(null);
                          setTotalBacklinks(0);
                          setTotalPages(1);
                          setLoading(false);
                        });
                    }, 0);
                  }
                }}
                disabled={currentPage === totalPages || loading}
              >
                {t('common.next')}
              </Button>
            </div>
          )}
        </Card>

        {/* Create Task Dialog */}
        <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
          <DialogContent className='sm:max-w-[600px]'>
            <DialogHeader>
              <DialogTitle>{t('tasks.create_title')}</DialogTitle>
              <DialogDescription>
                {t('tasks.create_description')}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className='space-y-4 pt-4'
              >
                {previewData && (
                  <>
                    <FormField
                      control={form.control}
                      name='target_site'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('tasks.target_site')}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder='https://yourdomain.com'
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            {t('tasks.target_site_description')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='scheduled_date'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('tasks.scheduled_time')}</FormLabel>
                          <FormControl>
                            <DateTimePicker
                              date={field.value}
                              onDateChange={(date) => field.onChange(date)}
                              placeholder={t('tasks.scheduled_time')}
                            />
                          </FormControl>
                          <FormDescription>
                            {t('tasks.scheduled_time_description')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className='space-y-4'>
                      <h4 className='text-sm font-medium'>
                        {t('tasks.custom_fields')}
                      </h4>
                      {Object.entries(previewData.custom_fields).map(
                        ([key, value]) => (
                          <FormField
                            key={key}
                            control={form.control}
                            name={`custom_fields.${key}`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className='capitalize'>
                                  {key.replace(/_/g, ' ')}
                                </FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )
                      )}
                    </div>
                  </>
                )}

                <DialogFooter>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => {
                      setTaskDialogOpen(false);
                      setPreviewData(null);
                      setSelectedBacklink(null);
                      form.reset();
                    }}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button type='submit' disabled={!previewData}>
                    {t('tasks.create_button')}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </PageContainer>
  );
}
