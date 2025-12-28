import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default function DashboardPage() {
  // Redirect to the backlinks page when accessing the dashboard root
  redirect('/dashboard/backlinks');
}
