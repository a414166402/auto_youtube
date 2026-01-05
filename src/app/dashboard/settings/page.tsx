'use client';

import PageContainer from '@/components/layout/page-container';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function SettingsPage() {
  const { locale, changeLocale, t } = useLanguage();

  return (
    <PageContainer>
      <div className='container mx-auto py-10'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold tracking-tight'>
            {t('settings.title')}
          </h1>
          <p className='text-muted-foreground'>{t('settings.description')}</p>
        </div>

        <div className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.language')}</CardTitle>
              <CardDescription>
                Select your preferred language for the interface
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid gap-6'>
                <div className='grid gap-3'>
                  <Label htmlFor='language'>{t('settings.language')}</Label>
                  <Select value={locale} onValueChange={changeLocale}>
                    <SelectTrigger id='language' className='w-[180px]'>
                      <SelectValue>
                        {locale === 'en'
                          ? t('settings.english')
                          : t('settings.chinese')}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='en'>
                        {t('settings.english')}
                      </SelectItem>
                      <SelectItem value='zh'>
                        {t('settings.chinese')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
