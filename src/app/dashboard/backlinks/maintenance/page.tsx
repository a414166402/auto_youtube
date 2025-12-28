'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Heading } from '@/components/ui/heading';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { BacklinkType } from '@/types/backlinks';
import {
  uploadAutomationJson,
  setBacklinkType,
  getAllAutomationConfigs,
  generateAutomationJson
} from '@/lib/api/backlinks';
import {
  ArrowDownToLineIcon,
  ArrowUpToLineIcon,
  CheckIcon,
  EyeIcon,
  PlayIcon,
  RefreshCwIcon,
  TrashIcon,
  XIcon,
  Copy as CopyIcon
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import PageContainer from '@/components/layout/page-container';
import { useLanguage } from '@/contexts/LanguageContext';

// 自动化配置的接口定义
interface AutomationConfig {
  backlink_url: string;
  custom_fields: Record<string, any>;
  updated_at: string;
  backlink_domain: string;
  custom_fields_count: number;
}

export default function MaintenancePage() {
  const { toast } = useToast();
  const { t } = useLanguage();

  const [configs, setConfigs] = useState<AutomationConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingConfigs, setLoadingConfigs] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [domainInput, setDomainInput] = useState('');
  const [selectedType, setSelectedType] = useState<BacklinkType>('comment');

  // 将共享的error和success状态分离为各模块独立的状态
  // 生成JSON模块
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generateSuccess, setGenerateSuccess] = useState<string | null>(null);

  // 上传JSON模块
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // 设置类型模块
  const [typeError, setTypeError] = useState<string | null>(null);
  const [typeSuccess, setTypeSuccess] = useState<string | null>(null);

  // 保留这两个变量用于向后兼容，但不再使用它们
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [selectedConfig, setSelectedConfig] = useState<AutomationConfig | null>(
    null
  );
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [generatingJson, setGeneratingJson] = useState(false);
  const [backlinkUrl, setBacklinkUrl] = useState('');
  const [curlCommand, setCurlCommand] = useState('');
  const [generatedJson, setGeneratedJson] = useState<string>('');

  // Add a ref to track if the component has already mounted to prevent double API calls
  const isFirstRender = useRef(true);

  // 加载自动化配置数据
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;

      const fetchConfigs = async () => {
        setLoadingConfigs(true);
        try {
          const result = await getAllAutomationConfigs();
          if (result.configs) {
            setConfigs(result.configs);
          }
        } catch (err) {
          console.error('获取自动化配置失败:', err);
          toast({
            variant: 'destructive',
            title: t('common.error'),
            description: t('maintenance.fetch_error')
          });
        } finally {
          setLoadingConfigs(false);
        }
      };

      fetchConfigs();
    }
  }, [toast, t]);

  // Create a reusable function to fetch configs
  const fetchConfigsData = async () => {
    setLoadingConfigs(true);
    try {
      const result = await getAllAutomationConfigs();
      if (result.configs) {
        setConfigs(result.configs);
      }
      return true;
    } catch (err) {
      console.error('获取自动化配置失败:', err);
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('maintenance.fetch_error')
      });
      return false;
    } finally {
      setLoadingConfigs(false);
    }
  };

  // 处理JSON数据上传
  const handleJsonUpload = async () => {
    if (!jsonInput.trim()) {
      setError(t('maintenance.json_required'));
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      let jsonData = null;
      try {
        jsonData = JSON.parse(jsonInput);
      } catch (jsonError) {
        throw new Error(t('maintenance.json_format_error'));
      }

      if (!jsonData.backlink_url) {
        throw new Error(t('maintenance.missing_field'));
      }

      const response = await uploadAutomationJson({
        curl_command: jsonData.curl_command || '',
        custom_fields: jsonData.custom_fields || {},
        backlink_url: jsonData.backlink_url
      });

      try {
        const result = await getAllAutomationConfigs();
        if (result.configs) {
          setConfigs(result.configs);
        }
      } catch (err) {
        console.error('刷新配置列表失败:', err);
      }

      setJsonInput('');
      setSuccess(t('maintenance.upload_success'));
      toast({
        title: t('common.success'),
        description: t('maintenance.upload_success')
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : t('maintenance.upload_error');
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: errorMessage
      });
    } finally {
      setUploading(false);
    }
  };

  // 保存反向链接类型
  const handleSaveType = async () => {
    if (!domainInput) {
      setError(t('maintenance.domain_required'));
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await setBacklinkType({
        backlink_domain: domainInput,
        type: selectedType
      });

      setSuccess(
        t('maintenance.type_success', {
          domain: domainInput,
          type: selectedType
        })
      );
      toast({
        title: t('common.success'),
        description: t('maintenance.type_success', {
          domain: domainInput,
          type: selectedType
        })
      });

      setDomainInput('');
    } catch (err) {
      setError(t('maintenance.type_error'));
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('maintenance.type_error')
      });
    } finally {
      setLoading(false);
    }
  };

  // 删除配置
  const handleDeleteConfig = (domain: string) => {
    setConfigs(configs.filter((config) => config.backlink_domain !== domain));
    toast({
      title: t('maintenance.config_deleted'),
      description: t('maintenance.config_deleted_description', { domain })
    });
  };

  // 测试配置
  const handleTestConfig = (domain: string) => {
    toast({
      title: t('maintenance.test_automation'),
      description: t('maintenance.testing_automation', { domain })
    });

    setTimeout(() => {
      toast({
        title: t('maintenance.test_success'),
        description: t('maintenance.test_success_description', { domain })
      });
    }, 2000);
  };

  // 查看详情
  const handleViewDetails = (config: AutomationConfig) => {
    setSelectedConfig(config);
    setDetailsOpen(true);
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('zh-CN');
    } catch (e) {
      return dateString;
    }
  };

  // 生成自动化JSON
  const handleGenerateJson = async () => {
    if (!backlinkUrl || !curlCommand) {
      setGenerateError(t('maintenance.url_curl_required'));
      return;
    }

    setGeneratingJson(true);
    setGenerateError(null);
    setGenerateSuccess(null);

    try {
      // 调用API生成JSON
      const response = await generateAutomationJson({
        backlink_url: backlinkUrl,
        curl_command: curlCommand
      });

      // 格式化JSON为美观的字符串
      const prettyJson = JSON.stringify(response.data, null, 2);
      setGeneratedJson(prettyJson);

      setGenerateSuccess(t('maintenance.generate_success'));
      toast({
        title: t('common.success'),
        description: t('maintenance.generate_success')
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '生成JSON数据失败';
      setGenerateError(errorMessage);
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: errorMessage
      });
    } finally {
      setGeneratingJson(false);
    }
  };

  // 复制生成的JSON数据
  const handleCopyJson = () => {
    navigator.clipboard.writeText(generatedJson);
    toast({
      title: t('maintenance.copied'),
      description: t('maintenance.json_copied')
    });
  };

  return (
    <PageContainer>
      <div className='container mx-auto space-y-8'>
        <Heading
          title={t('maintenance.title')}
          description={t('maintenance.description')}
        />

        <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
          <Card>
            <CardHeader>
              <CardTitle>{t('maintenance.generateJson')}</CardTitle>
              <CardDescription>
                {t('maintenance.generate_description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className='space-y-4'>
                <div className='space-y-2'>
                  <label htmlFor='backlink-url' className='text-sm font-medium'>
                    {t('maintenance.backlink_url')}
                  </label>
                  <Input
                    id='backlink-url'
                    placeholder={t('maintenance.backlink_url_placeholder')}
                    value={backlinkUrl}
                    onChange={(e) => setBacklinkUrl(e.target.value)}
                  />
                  <p className='text-muted-foreground text-xs'>
                    {t('maintenance.backlink_url_description')}
                  </p>
                </div>

                <div className='space-y-2'>
                  <label htmlFor='curl-command' className='text-sm font-medium'>
                    {t('maintenance.curl_command')}
                  </label>
                  <Textarea
                    id='curl-command'
                    placeholder={t('maintenance.curl_placeholder')}
                    value={curlCommand}
                    onChange={(e) => setCurlCommand(e.target.value)}
                    className='max-h-[120px] min-h-[120px] resize-none overflow-y-auto'
                  />
                  <p className='text-muted-foreground text-xs'>
                    {t('maintenance.curl_description')}
                  </p>
                </div>

                <Button
                  type='button'
                  onClick={handleGenerateJson}
                  disabled={generatingJson || !backlinkUrl || !curlCommand}
                  className='w-full'
                >
                  {generatingJson ? (
                    <>
                      <RefreshCwIcon className='mr-2 h-4 w-4 animate-spin' />
                      {t('maintenance.generating')}
                    </>
                  ) : (
                    <>
                      <PlayIcon className='mr-2 h-4 w-4' />
                      {t('maintenance.generate_button')}
                    </>
                  )}
                </Button>
              </form>

              {generatedJson && (
                <div className='mt-6 space-y-2'>
                  <div className='flex items-center justify-between'>
                    <h4 className='text-sm font-medium'>
                      {t('maintenance.generated_json')}
                    </h4>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={handleCopyJson}
                      className='h-8 px-2'
                    >
                      <CopyIcon className='mr-2 h-3 w-3' />
                      {t('common.copy')}
                    </Button>
                  </div>

                  <div className='relative'>
                    <Textarea
                      value={generatedJson}
                      onChange={(e) => setGeneratedJson(e.target.value)}
                      className='max-h-[120px] min-h-[120px] resize-none overflow-y-auto font-mono text-xs'
                    />
                  </div>
                </div>
              )}

              {error && (
                <Alert variant='destructive' className='mt-4'>
                  <XIcon className='h-4 w-4' />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert
                  variant='default'
                  className='mt-4 border-green-500 text-green-500'
                >
                  <CheckIcon className='h-4 w-4' />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('maintenance.uploadJson')}</CardTitle>
              <CardDescription>
                {t('maintenance.upload_description')}
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <label className='text-sm leading-none font-medium'>
                  {t('maintenance.json_data')}
                </label>
                <Textarea
                  placeholder={t('maintenance.json_placeholder')}
                  className='h-[200px] overflow-y-auto font-mono'
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                />
                <p className='text-muted-foreground text-sm'>
                  {t('maintenance.json_description')}
                </p>
              </div>

              <Button
                onClick={handleJsonUpload}
                disabled={uploading || !jsonInput.trim()}
                className='w-full'
              >
                {uploading ? (
                  <>
                    <RefreshCwIcon className='mr-2 h-4 w-4 animate-spin' />
                    {t('maintenance.uploading')}
                  </>
                ) : (
                  <>
                    <ArrowUpToLineIcon className='mr-2 h-4 w-4' />
                    {t('maintenance.upload_button')}
                  </>
                )}
              </Button>
            </CardContent>
            <CardFooter className='flex flex-col items-start'>
              {error && (
                <Alert variant='destructive' className='w-full'>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert className='w-full'>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('maintenance.setType')}</CardTitle>
              <CardDescription>
                {t('maintenance.type_description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className='space-y-4'>
                <div className='space-y-2'>
                  <label htmlFor='domain' className='text-sm font-medium'>
                    {t('maintenance.domain')}
                  </label>
                  <Input
                    id='domain'
                    placeholder={t('maintenance.domainPlaceholder')}
                    value={domainInput}
                    onChange={(e) => setDomainInput(e.target.value)}
                  />
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-medium'>
                    {t('maintenance.link_type')}
                  </label>
                  <Select
                    value={selectedType}
                    onValueChange={(value) =>
                      setSelectedType(value as BacklinkType)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('maintenance.select_type')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='comment'>
                        {t('maintenance.type_comment')}
                      </SelectItem>
                      <SelectItem value='registration_comment'>
                        {t('maintenance.type_registration')}
                      </SelectItem>
                      <SelectItem value='captcha'>
                        {t('maintenance.type_captcha')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <div className='text-muted-foreground mt-1 text-xs'>
                    {selectedType === 'comment' &&
                      t('maintenance.type_comment_desc')}
                    {selectedType === 'registration_comment' &&
                      t('maintenance.type_registration_desc')}
                    {selectedType === 'captcha' &&
                      t('maintenance.type_captcha_desc')}
                  </div>
                </div>

                <Button
                  onClick={handleSaveType}
                  disabled={loading}
                  className='w-full'
                >
                  {loading ? (
                    <>
                      <RefreshCwIcon className='mr-2 h-4 w-4 animate-spin' />
                      {t('maintenance.saving')}
                    </>
                  ) : (
                    <>
                      <CheckIcon className='mr-2 h-4 w-4' />
                      {t('maintenance.save_type')}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className='col-span-1 md:col-span-3'>
            <CardHeader className='flex flex-row items-center justify-between'>
              <div>
                <CardTitle>{t('maintenance.configList')}</CardTitle>
                <CardDescription>
                  {t('maintenance.config_description')}
                </CardDescription>
              </div>
              <Button
                variant='outline'
                size='sm'
                onClick={async () => {
                  const success = await fetchConfigsData();
                  if (success) {
                    toast({
                      title: t('common.success'),
                      description: t('maintenance.refresh_success')
                    });
                  }
                }}
                disabled={loadingConfigs}
              >
                <RefreshCwIcon
                  className={`mr-2 h-4 w-4 ${loadingConfigs ? 'animate-spin' : ''}`}
                />
                {t('maintenance.refresh_list')}
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('maintenance.domain')}</TableHead>
                    <TableHead>{t('maintenance.updated')}</TableHead>
                    <TableHead>{t('maintenance.customFields')}</TableHead>
                    <TableHead className='text-right'>
                      {t('maintenance.actions')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingConfigs ? (
                    <TableRow>
                      <TableCell colSpan={4} className='py-10 text-center'>
                        <RefreshCwIcon className='mx-auto mb-2 h-6 w-6 animate-spin' />
                        <p>{t('maintenance.loading_configs')}</p>
                      </TableCell>
                    </TableRow>
                  ) : configs.length > 0 ? (
                    configs.map((config, index) => (
                      <TableRow key={index}>
                        <TableCell className='font-medium'>
                          <a
                            href={config.backlink_url}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='block max-w-[200px] truncate hover:underline'
                            title={config.backlink_url}
                          >
                            {config.backlink_domain}
                          </a>
                        </TableCell>
                        <TableCell>{formatDate(config.updated_at)}</TableCell>
                        <TableCell>
                          <Badge variant='outline' className='cursor-default'>
                            {config.custom_fields_count}{' '}
                            {t('maintenance.fields')}
                          </Badge>
                        </TableCell>
                        <TableCell className='text-right'>
                          <div className='flex items-center justify-end space-x-2'>
                            <Button
                              variant='ghost'
                              size='icon'
                              onClick={() => handleViewDetails(config)}
                              title={t('maintenance.view_details')}
                            >
                              <EyeIcon className='h-4 w-4' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='icon'
                              onClick={() =>
                                handleTestConfig(config.backlink_domain)
                              }
                              title={t('maintenance.test')}
                            >
                              <PlayIcon className='h-4 w-4' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='icon'
                              onClick={() =>
                                handleDeleteConfig(config.backlink_domain)
                              }
                              title={t('maintenance.delete')}
                            >
                              <TrashIcon className='h-4 w-4' />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className='py-6 text-center'>
                        {t('maintenance.no_configs')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* 详情弹窗 */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className='w-[90vw] max-w-3xl'>
            <DialogHeader>
              <DialogTitle>{t('maintenance.config_details')}</DialogTitle>
              <DialogDescription>
                {t('maintenance.config_details_description', {
                  domain: selectedConfig?.backlink_domain
                })}
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className='mt-4 max-h-[350px]'>
              {selectedConfig ? (
                <div className='space-y-4'>
                  <div className='overflow-hidden rounded-md border'>
                    <div className='bg-muted px-4 py-2 text-sm font-medium'>
                      {t('maintenance.basic_info')}
                    </div>
                    <div className='space-y-2 p-4'>
                      <div className='grid grid-cols-[120px_1fr] gap-1'>
                        <div className='text-muted-foreground text-sm'>
                          {t('maintenance.backlink_url')}:
                        </div>
                        <div className='text-sm break-all'>
                          <a
                            href={selectedConfig.backlink_url}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='text-blue-600 hover:underline'
                          >
                            {selectedConfig.backlink_url}
                          </a>
                        </div>
                      </div>
                      <div className='grid grid-cols-[120px_1fr] gap-1'>
                        <div className='text-muted-foreground text-sm'>
                          {t('maintenance.domain')}:
                        </div>
                        <div className='text-sm'>
                          {selectedConfig.backlink_domain}
                        </div>
                      </div>
                      <div className='grid grid-cols-[120px_1fr] gap-1'>
                        <div className='text-muted-foreground text-sm'>
                          {t('maintenance.updated')}:
                        </div>
                        <div className='text-sm'>
                          {formatDate(selectedConfig.updated_at)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className='overflow-hidden rounded-md border'>
                    <div className='bg-muted px-4 py-2 text-sm font-medium'>
                      {t('maintenance.custom_fields')} (
                      {selectedConfig.custom_fields_count})
                    </div>
                    <div className='space-y-2 p-4'>
                      {Object.entries(selectedConfig.custom_fields).map(
                        ([key, value], i) => (
                          <div
                            key={i}
                            className='grid grid-cols-[120px_1fr] gap-1 border-b pb-2 last:border-0 last:pb-0'
                          >
                            <div className='text-sm font-medium'>{key}:</div>
                            <div className='overflow-hidden text-sm break-words whitespace-normal'>
                              {typeof value === 'string' &&
                              value.includes('href=') ? (
                                <div
                                  dangerouslySetInnerHTML={{ __html: value }}
                                  className='break-words whitespace-normal'
                                />
                              ) : (
                                String(value)
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className='text-muted-foreground py-8 text-center'>
                  {t('maintenance.no_data')}
                </div>
              )}
            </ScrollArea>

            <div className='flex justify-end'>
              <Button variant='outline' onClick={() => setDetailsOpen(false)}>
                {t('common.close')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageContainer>
  );
}
