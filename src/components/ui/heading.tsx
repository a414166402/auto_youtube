import { cn } from '@/lib/utils';

export interface HeadingProps {
  title: string;
  description?: string;
  className?: string;
}

export function Heading({ title, description, className }: HeadingProps) {
  return (
    <div className={cn('space-y-1', className)}>
      <h1 className='text-2xl font-bold tracking-tight'>{title}</h1>
      {description && (
        <p className='text-muted-foreground text-sm'>{description}</p>
      )}
    </div>
  );
}
