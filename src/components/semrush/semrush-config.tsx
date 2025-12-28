'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, TestTube, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  getSemrushConfig,
  updateSemrushConfig,
  testSemrushConnection,
  SemrushConfigUpdate
} from '@/lib/api/semrush';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

// 表单验证Schema
const semrushFormSchema = z.object({
  uname: z.string().optional(),
  param: z.string().optional(),
  key: z.string().optional(),
  token: z.string().optional(),
  config: z.string().optional(),
  lang: z.string().optional(),
  base_url: z.string().optional()
});

type SemrushFormValues = z.infer<typeof semrushFormSchema>;

// 定义Semrush配置接口
interface SemrushConfig {
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

export default function SemrushConfigComponent() {
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [configData, setConfigData] = useState<SemrushConfig | null>(null);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useLanguage();

  // 表单初始化
  const form = useForm<SemrushFormValues>({
    resolver: zodResolver(semrushFormSchema),
    defaultValues: {
      uname: '',
      param: '',
      key: '',
      token: '',
      config: '',
      lang: '',
      base_url: ''
    }
  });

  // 加载配置数据
  useEffect(() => {
    const fetchConfig = async () => {
      setIsLoading(true);
      try {
        console.log('正在获取Semrush配置...');
        const data = await getSemrushConfig();
        console.log('获取Semrush配置成功:', data);
        setConfigData(data);

        // 更新表单值
        form.setValue('uname', data.uname || '');
        form.setValue('param', data.param || '');
        form.setValue('key', data.key || '');
        form.setValue('token', data.token || '');
        form.setValue('lang', data.lang || '');
        form.setValue('base_url', data.base_url || '');
        form.setValue('config', data.config_raw || '');
      } catch (error) {
        console.error('获取Semrush配置失败:', error);
        toast({
          variant: 'destructive',
          title: '获取配置失败',
          description: error instanceof Error ? error.message : String(error)
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, []);

  // 保存配置
  const onSubmit = async (values: SemrushFormValues) => {
    setLoading(true);
    try {
      const result = await updateSemrushConfig(values as SemrushConfigUpdate);
      toast({
        title: t('settings.semrush.success'),
        description: t('settings.semrush.config_updated')
      });

      // 重新获取最新配置
      const updatedConfig = await getSemrushConfig();
      setConfigData(updatedConfig);

      // 更新表单值
      form.setValue('uname', updatedConfig.uname || '');
      form.setValue('param', updatedConfig.param || '');
      form.setValue('key', updatedConfig.key || '');
      form.setValue('token', updatedConfig.token || '');
      form.setValue('lang', updatedConfig.lang || '');
      form.setValue('base_url', updatedConfig.base_url || '');
      form.setValue('config', updatedConfig.config_raw || '');
    } catch (error) {
      console.error('更新Semrush配置失败:', error);
      toast({
        variant: 'destructive',
        title: t('settings.semrush.error'),
        description: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setLoading(false);
    }
  };

  // 测试连接
  const handleTestConnection = async () => {
    setTestLoading(true);
    try {
      const result = await testSemrushConnection();
      setTestResult(result);
      setTestDialogOpen(true);
      toast({
        title: t('settings.semrush.test_success'),
        description: result.message
      });
    } catch (error) {
      console.error('测试Semrush连接失败:', error);
      toast({
        variant: 'destructive',
        title: t('settings.semrush.test_error'),
        description: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setTestLoading(false);
    }
  };

  // 获取配置状态的颜色
  const getStatusColor = (status: string) => {
    if (status.includes('已配置') || status.includes('完整')) {
      return 'bg-green-500';
    }
    if (status.includes('部分') || status.includes('缺少')) {
      return 'bg-yellow-500';
    }
    return 'bg-gray-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.semrush.title')}</CardTitle>
        <CardDescription>{t('settings.semrush.description')}</CardDescription>

        {isLoading ? (
          <div className='mt-2 flex items-center space-x-2'>
            <Loader2 className='h-4 w-4 animate-spin' />
            <span className='text-muted-foreground text-sm'>
              {t('common.loading')}
            </span>
          </div>
        ) : configData ? (
          <div className='mt-2 flex flex-wrap gap-2'>
            <Badge variant='outline' className='gap-1'>
              <span>{t('settings.semrush.token_status')}:</span>
              <span
                className={`h-2 w-2 rounded-full ${getStatusColor(configData.token_status)}`}
              ></span>
              <span>{configData.token_status}</span>
            </Badge>
            <Badge variant='outline' className='gap-1'>
              <span>{t('settings.semrush.config_status')}:</span>
              <span
                className={`h-2 w-2 rounded-full ${getStatusColor(configData.config_status)}`}
              ></span>
              <span>{configData.config_status}</span>
            </Badge>
          </div>
        ) : (
          <div className='text-muted-foreground mt-2 text-sm'>
            {t('settings.semrush.error')}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className='flex flex-col items-center justify-center p-8'>
            <Loader2 className='mb-2 h-8 w-8 animate-spin' />
            <p className='text-muted-foreground'>{t('common.loading')}</p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='token'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('settings.semrush.token')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('settings.semrush.token_placeholder')}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='base_url'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('settings.semrush.base_url')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                <FormField
                  control={form.control}
                  name='uname'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('settings.semrush.uname')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='param'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('settings.semrush.param')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='key'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('settings.semrush.key')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid grid-cols-1 gap-4'>
                <FormField
                  control={form.control}
                  name='lang'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('settings.semrush.lang')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='config'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.semrush.config')}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('settings.semrush.config_placeholder')}
                        className='font-mono'
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='flex flex-wrap gap-3'>
                <Button type='submit' disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      {t('settings.semrush.saving')}
                    </>
                  ) : (
                    t('settings.semrush.save')
                  )}
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  onClick={handleTestConnection}
                  disabled={testLoading}
                >
                  {testLoading ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      {t('settings.semrush.testing')}
                    </>
                  ) : (
                    <>
                      <TestTube className='mr-2 h-4 w-4' />
                      {t('settings.semrush.test')}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </CardContent>

      {/* 测试结果对话框 */}
      <AlertDialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <div className='flex items-center gap-2'>
                <Check className='text-green-500' />
                {t('settings.semrush.test_success')}
              </div>
            </AlertDialogTitle>
            <AlertDialogDescription>
              {testResult?.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='py-4'>
            {testResult && (
              <div className='space-y-2'>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>
                    {t('settings.semrush.test_domain')}:
                  </span>
                  <span className='font-medium'>{testResult.test_domain}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>
                    {t('settings.semrush.sample_records')}:
                  </span>
                  <span className='font-medium'>
                    {testResult.sample_records}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>
                    {t('settings.semrush.config_valid')}:
                  </span>
                  <span className='font-medium'>
                    {testResult.config_valid ? (
                      <Check className='text-green-500' />
                    ) : (
                      <span className='text-red-500'>✕</span>
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogAction>{t('common.close')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
