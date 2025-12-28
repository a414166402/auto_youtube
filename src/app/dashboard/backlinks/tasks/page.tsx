'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Heading } from '@/components/ui/heading';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
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
import { useToast } from '@/components/ui/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from '@/components/ui/tooltip';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { BacklinkTask } from '@/types/backlinks';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import {
  CalendarIcon,
  CheckIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
  XIcon,
  RefreshCwIcon
} from 'lucide-react';
import {
  previewAutomationTemplate,
  createTaskFromAutomation,
  listBacklinkTasks,
  deleteBacklinkTask
} from '@/lib/api/backlinks';
import PageContainer from '@/components/layout/page-container';
import { useLanguage } from '@/contexts/LanguageContext';

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

// Form schema for task creation
const taskFormSchema = z.object({
  backlink_url: z.string().url({ message: 'Please enter a valid URL' }),
  target_site: z.string().url({ message: 'Please enter a valid URL' }),
  scheduled_time: z.string().optional(),
  scheduled_date: z.date().optional(),
  custom_fields: z.record(z.string()).optional()
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

export default function TasksPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t, locale } = useLanguage();

  const [tasks, setTasks] = useState<BacklinkTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Add a ref to track if the component has already mounted to prevent double API calls
  const isFirstRender = useRef(true);

  // Form for task creation
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      backlink_url: '',
      target_site: '',
      scheduled_time: '',
      scheduled_date: undefined,
      custom_fields: {}
    }
  });

  // Create a fetchTasks function that can be reused
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      // 使用API获取任务列表
      const data = await listBacklinkTasks({
        status: statusFilter !== 'all' ? statusFilter : undefined
      });

      // 转换API数据格式到组件使用的格式，并过滤掉deleted状态的任务
      const transformedTasks: BacklinkTask[] = data.data
        .filter((task: any) => task.status.toLowerCase() !== 'deleted')
        .map((task: any) => ({
          id: task.id,
          backlink_url: task.backlink_url,
          target_site: task.target_site,
          status: task.status.toLowerCase() as BacklinkTask['status'],
          scheduled_time: task.scheduled_time || '',
          created_at: task.created_at,
          custom_fields: task.custom_fields || {},
          error_message: task.error_message,
          job_id: task.job_id,
          scheduler_status: task.scheduler_status
        }));

      setTasks(transformedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('tasks.fetch_error')
      });
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, toast, t]);

  // Fetch tasks on mount using the fetchTasks function, but only on first render
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      fetchTasks();
    }
  }, [fetchTasks]);

  // Handle preview button click
  const handlePreview = async () => {
    const backlinkUrl = form.getValues('backlink_url');
    if (!backlinkUrl) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('tasks.url_required')
      });
      return;
    }

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
      form.setValue(
        'scheduled_time',
        defaultScheduledTime.toISOString().slice(0, 16)
      );

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
        // 如果没有选择时间，参数中不传递 scheduled_time
        scheduledTime = undefined;
      }

      const requestData: any = {
        backlink_url: values.backlink_url,
        target_site: values.target_site,
        custom_fields: values.custom_fields || {}
      };

      // 只有当scheduledTime有值时，才添加到请求数据中
      if (scheduledTime) {
        requestData.scheduled_time = scheduledTime;
      }

      console.log('Sending task creation request:', requestData);
      const response = await createTaskFromAutomation(requestData);

      console.log('Task creation response:', response);

      // 检查返回的数据结构，判断是否成功创建任务
      if (response.status === 'created' || response.task_id) {
        toast({
          title: t('common.success'),
          description: t('tasks.create_success')
        });
        setDialogOpen(false);
        form.reset();
        fetchTasks();
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

  // Task actions
  const handleCancelTask = (taskId: number) => {
    const updatedTasks = tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            status: 'failed' as 'pending' | 'running' | 'completed' | 'failed',
            progress: 0
          }
        : task
    );
    setTasks(updatedTasks);

    toast({
      title: t('tasks.cancelled'),
      description: t('tasks.task_cancelled').replace('{id}', taskId.toString())
    });
  };

  const handleRetryTask = (taskId: number) => {
    const updatedTasks = tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            status: 'pending' as 'pending' | 'running' | 'completed' | 'failed',
            progress: 0
          }
        : task
    );
    setTasks(updatedTasks);

    toast({
      title: t('tasks.retry_title'),
      description: t('tasks.task_retry').replace('{id}', taskId.toString())
    });
  };

  const handlePauseTask = (taskId: number) => {
    const updatedTasks = tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            status: 'pending' as 'pending' | 'running' | 'completed' | 'failed'
          }
        : task
    );
    setTasks(updatedTasks);

    toast({
      title: t('tasks.pause_title'),
      description: t('tasks.task_paused').replace('{id}', taskId.toString())
    });
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await deleteBacklinkTask(taskId);

      // 从列表中删除任务
      setTasks(tasks.filter((task) => task.id !== taskId));

      toast({
        title: t('tasks.delete_title'),
        description: t('tasks.task_deleted').replace('{id}', taskId.toString())
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('tasks.delete_error')
      });
    }
  };

  // Get status variant for badge
  const getStatusVariant = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'completed':
      case 'done':
        return 'success';
      case 'running':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'failed':
        return 'destructive';
      case 'todo':
        return 'outline';
      case 'deleted':
        return 'outline';
      default:
        return 'outline';
    }
  };

  // Render task status badge
  const renderStatusBadge = (status: string, errorMessage?: string | null) => {
    const variant = getStatusVariant(status);
    // 确保状态键存在，如果不存在则使用原始状态名
    const statusKey = status.toLowerCase();

    if (errorMessage) {
      return (
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <Badge variant={variant} className='cursor-help capitalize'>
              {t(`tasks.status.${statusKey}`, { fallback: statusKey })}
            </Badge>
          </TooltipTrigger>
          <TooltipContent
            side='top'
            sideOffset={5}
            className='z-[9999] w-[800px] max-w-[800px] rounded-md bg-black p-4 text-white shadow-xl'
            style={{ maxWidth: '800px', width: '800px', zIndex: 9999 }}
          >
            <div className='mb-2 text-sm font-bold'>
              {t('tasks.error_message')}:
            </div>
            <div className='max-h-[300px] overflow-auto text-xs break-words break-all'>
              {errorMessage}
            </div>
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <Badge variant={variant} className='capitalize'>
        {t(`tasks.status.${statusKey}`, { fallback: statusKey })}
      </Badge>
    );
  };

  // Filtered tasks
  const filteredTasks = tasks.filter(
    (task) =>
      task.backlink_url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.target_site.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageContainer>
      <TooltipProvider>
        <div className='container mx-auto space-y-6'>
          <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
            <Heading
              title={t('tasks.title')}
              description={t('tasks.description')}
            />

            <div className='flex flex-col gap-2 sm:flex-row'>
              <Button onClick={() => setDialogOpen(true)} className='gap-2'>
                <PlusIcon className='h-4 w-4' />
                {t('tasks.create_new')}
              </Button>
              <Button variant='outline' onClick={fetchTasks} className='gap-2'>
                <RefreshCwIcon className='h-4 w-4' />
                {t('common.refresh')}
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('tasks.list')}</CardTitle>
              <CardDescription>{t('tasks.list_description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='mb-4 flex flex-col gap-2 md:flex-row'>
                <div className='relative flex-1'>
                  <SearchIcon className='text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4' />
                  <Input
                    type='search'
                    placeholder={t('tasks.search_placeholder')}
                    className='pl-8'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className='w-full md:w-[200px]'>
                    <SelectValue placeholder={t('tasks.filter_by_status')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>{t('tasks.status.all')}</SelectItem>
                    <SelectItem value='todo'>
                      {t('tasks.status.todo')}
                    </SelectItem>
                    <SelectItem value='pending'>
                      {t('tasks.status.pending')}
                    </SelectItem>
                    <SelectItem value='running'>
                      {t('tasks.status.running')}
                    </SelectItem>
                    <SelectItem value='completed'>
                      {t('tasks.status.completed')}
                    </SelectItem>
                    <SelectItem value='done'>
                      {t('tasks.status.done')}
                    </SelectItem>
                    <SelectItem value='failed'>
                      {t('tasks.status.failed')}
                    </SelectItem>
                    <SelectItem value='deleted'>
                      {t('tasks.status.deleted')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='rounded-md border'>
                {loading ? (
                  <div className='flex items-center justify-center py-6'>
                    <RefreshCwIcon className='mr-2 h-4 w-4 animate-spin' />
                    <span>{t('common.loading')}</span>
                  </div>
                ) : filteredTasks.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('tasks.id')}</TableHead>
                        <TableHead>{t('tasks.source')}</TableHead>
                        <TableHead>{t('tasks.target')}</TableHead>
                        <TableHead>{t('tasks.status_label')}</TableHead>
                        <TableHead>{t('tasks.scheduled')}</TableHead>
                        <TableHead>{t('tasks.created')}</TableHead>
                        <TableHead className='text-right'>
                          {t('common.actions')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell>{task.id}</TableCell>
                          <TableCell className='max-w-[200px] truncate font-medium'>
                            <a
                              href={task.backlink_url}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='hover:underline'
                            >
                              {task.backlink_url}
                            </a>
                          </TableCell>
                          <TableCell className='max-w-[200px] truncate'>
                            {task.target_site}
                          </TableCell>
                          <TableCell>
                            {renderStatusBadge(task.status, task.error_message)}
                          </TableCell>
                          <TableCell>
                            {task.scheduled_time
                              ? new Date(task.scheduled_time).toLocaleString(
                                  'zh-CN',
                                  {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false
                                  }
                                )
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {new Date(task.created_at).toLocaleString('zh-CN', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                              hour12: false
                            })}
                          </TableCell>
                          <TableCell className='text-right'>
                            <div className='flex justify-end space-x-2'>
                              {task.status === 'failed' && (
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  onClick={() => handleRetryTask(task.id)}
                                  title={t('tasks.retry')}
                                >
                                  <PlayIcon className='h-4 w-4' />
                                </Button>
                              )}
                              {task.status === 'pending' && (
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  onClick={() => handleCancelTask(task.id)}
                                  title={t('tasks.cancel')}
                                >
                                  <XIcon className='h-4 w-4' />
                                </Button>
                              )}
                              {task.status === 'running' && (
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  onClick={() => handlePauseTask(task.id)}
                                  title={t('tasks.pause')}
                                >
                                  <PauseIcon className='h-4 w-4' />
                                </Button>
                              )}
                              <Button
                                variant='ghost'
                                size='icon'
                                onClick={() => handleDeleteTask(task.id)}
                                title={t('tasks.delete')}
                              >
                                <TrashIcon className='h-4 w-4' />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className='flex flex-col items-center justify-center py-8'>
                    <div className='text-center'>
                      <XIcon className='text-muted-foreground mx-auto mb-2 h-8 w-8' />
                      <p className='text-muted-foreground'>
                        {t('tasks.no_tasks')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className='sm:max-w-[600px]'>
              <DialogHeader>
                <DialogTitle>{t('tasks.create_title')}</DialogTitle>
                <DialogDescription>
                  {t('tasks.create_description')}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form
                  className='space-y-4 pt-4'
                  onSubmit={form.handleSubmit(onSubmit)}
                >
                  <FormField
                    control={form.control}
                    name='backlink_url'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('tasks.backlink_url')}</FormLabel>
                        <FormControl>
                          <div className='flex gap-2'>
                            <Input {...field} />
                            <Button
                              type='button'
                              variant='outline'
                              onClick={handlePreview}
                              disabled={previewLoading}
                            >
                              {previewLoading ? (
                                <RefreshCwIcon className='mr-2 h-4 w-4 animate-spin' />
                              ) : null}
                              {t('tasks.preview')}
                            </Button>
                          </div>
                        </FormControl>
                        <FormDescription>
                          {t('tasks.backlink_url_description')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                              <div className='flex items-center gap-2'>
                                <DateTimePicker
                                  date={field.value}
                                  onDateChange={(date) => {
                                    console.log(
                                      'DateTimePicker - 选择的日期:',
                                      date
                                    );
                                    field.onChange(date);
                                    if (date) {
                                      const isoDateString = date
                                        .toISOString()
                                        .slice(0, 16);
                                      console.log(
                                        'DateTimePicker - ISO日期字符串:',
                                        isoDateString
                                      );
                                      form.setValue(
                                        'scheduled_time',
                                        isoDateString
                                      );
                                    } else {
                                      console.log('DateTimePicker - 清除日期');
                                      form.setValue('scheduled_time', '');
                                    }
                                  }}
                                  placeholder={t('tasks.scheduled_time')}
                                />
                                <Button
                                  type='button'
                                  variant='outline'
                                  size='icon'
                                  onClick={() => {
                                    console.log('清除按钮点击 - 清除日期');
                                    form.setValue('scheduled_date', undefined);
                                    form.setValue('scheduled_time', '');
                                  }}
                                >
                                  <XIcon className='h-4 w-4' />
                                </Button>
                              </div>
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
                                    <Input
                                      {...field}
                                      value={field.value || ''}
                                    />
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
                        setDialogOpen(false);
                        setPreviewData(null);
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
      </TooltipProvider>
    </PageContainer>
  );
}
