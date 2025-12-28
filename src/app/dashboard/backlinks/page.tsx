import { redirect } from 'next/navigation';

export default function BacklinksIndexPage() {
  redirect('/dashboard/backlinks/fetch');
}
