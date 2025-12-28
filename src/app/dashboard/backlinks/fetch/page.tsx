'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  FormMessage,
  FormDescription
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Heading } from '@/components/ui/heading';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { fetchBacklinks } from '@/lib/api/backlinks';
import { useToast } from '@/components/ui/use-toast';
import { BacklinkRecord } from '@/types/backlinks';
import { Loader2 } from 'lucide-react';
import PageContainer from '@/components/layout/page-container';
import { useLanguage } from '@/contexts/LanguageContext';

const apiFormSchema = z.object({
  url: z.string().url({ message: 'Please enter a valid URL' })
});

type ApiFormValues = z.infer<typeof apiFormSchema>;

export default function FetchBacklinksPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('api');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();

  // Fetch history data on component mount
  useEffect(() => {
    const fetchHistoryData = async () => {
      try {
        // In a real app, you would fetch history data from an API
        // For now, we'll leave this empty until we have an endpoint
        // that returns the list of domains that have been fetched
      } catch (err) {
        console.error('Failed to fetch history data', err);
      }
    };

    fetchHistoryData();
  }, []);

  // Form for API fetch
  const apiForm = useForm<ApiFormValues>({
    resolver: zodResolver(apiFormSchema),
    defaultValues: {
      url: ''
    }
  });

  // Handle API fetch submission
  const onApiSubmit = async (values: ApiFormValues) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await fetchBacklinks({ url: values.url });
      setSuccess(t('fetch.success_message'));
      toast({
        title: t('common.success'),
        description: t('notifications.backlinks_fetched').replace(
          '{count}',
          result.count.toString()
        )
      });

      // Update history data (would come from API in real app)
      const newEntry = {
        domain: result.domain,
        url: values.url,
        count: result.count,
        date: new Date().toISOString(),
        method: 'API'
      };

      setHistoryData((prev) => [newEntry, ...prev]);

      // Reset form
      apiForm.reset();
    } catch (err) {
      console.error('Error fetching backlinks:', err);
      setError(t('fetch.error_message'));
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('notifications.fetch_error')
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle CSV upload
  const handleCsvUpload = async (files: File[]) => {
    if (files.length === 0) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', files[0]);
      formData.append('url', apiForm.getValues('url') || '');

      // In a real app, you would call the API to upload the CSV
      // const response = await fetch('/api/backlinks/upload', {
      //   method: 'POST',
      //   body: formData,
      // })
      // const result = await response.json()

      // For now, we'll simulate success
      setTimeout(() => {
        setSuccess(t('fetch.csv_success'));
        toast({
          title: t('common.success'),
          description: t('notifications.csv_uploaded')
        });

        // Update history data (would come from API in real app)
        const newEntry = {
          domain: new URL(apiForm.getValues('url') || 'https://example.com')
            .hostname,
          url: apiForm.getValues('url') || 'https://example.com',
          count: Math.floor(Math.random() * 1000),
          date: new Date().toISOString(),
          method: 'CSV'
        };

        setHistoryData((prev) => [newEntry, ...prev]);
        setLoading(false);
      }, 1500);
    } catch (err) {
      console.error('Error uploading CSV:', err);
      setError(t('fetch.csv_error'));
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('notifications.csv_error')
      });
      setLoading(false);
    }
  };

  // View details of a backlink record
  const viewDetails = (domain: string) => {
    router.push(
      `/dashboard/backlinks/list?domain=${encodeURIComponent(domain)}`
    );
  };

  return (
    <PageContainer>
      <div className='container mx-auto space-y-8'>
        <Heading
          title={t('fetch.title')}
          description={t('fetch.description')}
        />

        <div className='grid gap-6 md:grid-cols-2'>
          <Card className='col-span-2 md:col-span-1'>
            <CardHeader>
              <CardTitle>{t('fetch.get_data_title')}</CardTitle>
              <CardDescription>
                {t('fetch.get_data_description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className='w-full'
              >
                <TabsList className='grid w-full grid-cols-2'>
                  <TabsTrigger value='api'>{t('fetch.api_fetch')}</TabsTrigger>
                  <TabsTrigger value='csv'>{t('fetch.csv_upload')}</TabsTrigger>
                </TabsList>
                <TabsContent value='api' className='space-y-4 pt-4'>
                  <Form {...apiForm}>
                    <form
                      onSubmit={apiForm.handleSubmit(onApiSubmit)}
                      className='space-y-4'
                    >
                      <FormField
                        control={apiForm.control}
                        name='url'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('fetch.target_url')}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t('fetch.url_placeholder')}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type='submit' disabled={loading}>
                        {loading ? (
                          <>
                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            {t('common.fetching')}
                          </>
                        ) : (
                          t('fetch.fetch_button')
                        )}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
                <TabsContent value='csv' className='space-y-4 pt-4'>
                  <div className='flex flex-col gap-4'>
                    <FormField
                      control={apiForm.control}
                      name='url'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t('fetch.target_url_optional')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t('fetch.url_placeholder')}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            {t('fetch.url_description')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className='grid w-full items-center gap-1.5'>
                      <label className='text-sm leading-none font-medium'>
                        {t('fetch.upload_csv_label')}
                      </label>
                      <div className='mt-2'>
                        <div className='flex w-full items-center justify-center'>
                          <label className='bg-muted/50 hover:bg-muted/70 flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed'>
                            <div className='flex flex-col items-center justify-center pt-5 pb-6'>
                              <svg
                                className='text-muted-foreground mb-4 h-8 w-8'
                                aria-hidden='true'
                                xmlns='http://www.w3.org/2000/svg'
                                fill='none'
                                viewBox='0 0 20 16'
                              >
                                <path
                                  stroke='currentColor'
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth='2'
                                  d='M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2'
                                />
                              </svg>
                              <p className='text-muted-foreground mb-2 text-sm'>
                                <span className='font-semibold'>
                                  {t('fetch.upload_prompt')}
                                </span>
                              </p>
                              <p className='text-muted-foreground text-xs'>
                                {t('fetch.csv_only')}
                              </p>
                            </div>
                            <Input
                              id='dropzone-file'
                              type='file'
                              accept='.csv'
                              disabled={loading}
                              className='hidden'
                              onChange={(e) => {
                                if (
                                  e.target.files &&
                                  e.target.files.length > 0
                                ) {
                                  handleCsvUpload(Array.from(e.target.files));
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                    <Button
                      type='button'
                      disabled={loading}
                      onClick={() =>
                        document
                          .querySelector<HTMLInputElement>('input[type="file"]')
                          ?.click()
                      }
                    >
                      {loading ? (
                        <>
                          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                          {t('common.uploading')}
                        </>
                      ) : (
                        t('fetch.upload_button')
                      )}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
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

          <Card className='col-span-2 md:col-span-1'>
            <CardHeader>
              <CardTitle>{t('fetch.recent_fetches')}</CardTitle>
              <CardDescription>
                {t('fetch.history_description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historyData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('backlinks.domain')}</TableHead>
                      <TableHead>{t('backlinks.date')}</TableHead>
                      <TableHead>{t('fetch.method')}</TableHead>
                      <TableHead>{t('navigation.backlinks')}</TableHead>
                      <TableHead className='text-right'>
                        {t('common.actions')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyData.map((record, index) => (
                      <TableRow key={index}>
                        <TableCell className='font-medium'>
                          {record.domain}
                        </TableCell>
                        <TableCell>
                          {new Date(record.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              record.method === 'API' ? 'default' : 'outline'
                            }
                          >
                            {record.method}
                          </Badge>
                        </TableCell>
                        <TableCell>{record.count}</TableCell>
                        <TableCell className='text-right'>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => viewDetails(record.domain)}
                          >
                            {t('common.view')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className='flex h-40 flex-col items-center justify-center text-center'>
                  <p className='text-muted-foreground'>
                    No backlink data fetched yet
                  </p>
                  <p className='text-muted-foreground mt-1 text-sm'>
                    Use the form on the left to get started
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
