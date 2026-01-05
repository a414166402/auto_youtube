import { redirect } from 'next/navigation';

export default function DashboardPage() {
  // Redirect to the YouTube projects page when accessing the dashboard root
  redirect('/dashboard/youtube/projects');
}
