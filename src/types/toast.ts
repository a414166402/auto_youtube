import * as React from 'react';

export type ToastProps = {
  variant?: 'default' | 'destructive' | 'success' | 'outline' | 'secondary';
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
};

export type ToastActionElement = React.ReactElement;
