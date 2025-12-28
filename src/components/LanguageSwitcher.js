'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from '@/components/ui/select';

export default function LanguageSwitcher() {
  const { locale, changeLocale, t } = useLanguage();

  return (
    <div className='flex items-center gap-2'>
      <Select value={locale} onValueChange={changeLocale}>
        <SelectTrigger className='h-8 w-24'>
          <SelectValue>{locale === 'en' ? 'English' : '中文'}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='en'>{t('settings.english')}</SelectItem>
          <SelectItem value='zh'>{t('settings.chinese')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
