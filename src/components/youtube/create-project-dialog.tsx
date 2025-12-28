'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { createProject } from '@/lib/api/youtube';
import type { VideoProject } from '@/types/youtube';

// YouTube URL validation regex
const youtubeUrlRegex =
  /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]{11}(&.*)?$/;

const formSchema = z.object({
  name: z
    .string()
    .min(1, '请输入项目名称')
    .max(100, '项目名称不能超过100个字符'),
  youtube_url: z
    .string()
    .min(1, '请输入YouTube视频URL')
    .regex(youtubeUrlRegex, '请输入有效的YouTube视频URL')
});

type FormValues = z.infer<typeof formSchema>;

interface CreateProjectDialogProps {
  onSuccess?: (project: VideoProject) => void;
}

export function CreateProjectDialog({ onSuccess }: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      youtube_url: ''
    }
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const project = await createProject(values);
      form.reset();
      setOpen(false);
      onSuccess?.(project);
    } catch (error) {
      console.error('Failed to create project:', error);
      form.setError('root', {
        message: error instanceof Error ? error.message : '创建项目失败，请重试'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className='mr-2 h-4 w-4' />
          创建项目
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>创建新项目</DialogTitle>
          <DialogDescription>
            输入项目名称和YouTube视频URL来创建新的AI视频制作项目
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>项目名称</FormLabel>
                  <FormControl>
                    <Input placeholder='我的视频项目' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='youtube_url'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>YouTube视频URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='https://www.youtube.com/watch?v=xxxxx'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.formState.errors.root && (
              <p className='text-destructive text-sm'>
                {form.formState.errors.root.message}
              </p>
            )}
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                取消
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                )}
                创建
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Export the validation function for testing
export function validateYoutubeUrl(url: string): boolean {
  return youtubeUrlRegex.test(url);
}
