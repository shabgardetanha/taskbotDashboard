// Internationalization system for TaskBot Persian
// Supports Persian (fa) and English (en) with RTL/LTR support

export type SupportedLocale = 'fa' | 'en'

export type TranslationKey =
  // Common UI
  | 'common.save'
  | 'common.cancel'
  | 'common.delete'
  | 'common.edit'
  | 'common.add'
  | 'common.search'
  | 'common.loading'
  | 'common.error'
  | 'common.success'
  | 'common.warning'
  | 'common.info'
  | 'common.retry'
  | 'common.back'
  | 'common.next'
  | 'common.previous'
  | 'common.close'
  | 'common.open'
  | 'common.yes'
  | 'common.no'

  // Navigation
  | 'nav.dashboard'
  | 'nav.kanban'
  | 'nav.calendar'
  | 'nav.analytics'
  | 'nav.settings'
  | 'nav.templates'
  | 'nav.search'
  | 'nav.help'

  // Dashboard
  | 'dashboard.title'
  | 'dashboard.welcome'
  | 'dashboard.tasks_today'
  | 'dashboard.tasks_completed'
  | 'dashboard.tasks_pending'
  | 'dashboard.recent_activity'

  // Tasks
  | 'task.create'
  | 'task.edit'
  | 'task.delete'
  | 'task.title'
  | 'task.description'
  | 'task.due_date'
  | 'task.priority'
  | 'task.priority_low'
  | 'task.priority_medium'
  | 'task.priority_high'
  | 'task.status'
  | 'task.status_todo'
  | 'task.status_in_progress'
  | 'task.status_done'
  | 'task.assignee'
  | 'task.labels'
  | 'task.comments'
  | 'task.attachments'

  // Settings
  | 'settings.title'
  | 'settings.profile'
  | 'settings.notifications'
  | 'settings.appearance'
  | 'settings.language'
  | 'settings.timezone'
  | 'settings.date_format'

  // Errors
  | 'error.network'
  | 'error.server'
  | 'error.not_found'
  | 'error.unauthorized'
  | 'error.validation'
  | 'error.unknown'

  // Accessibility
  | 'a11y.skip_to_main'
  | 'a11y.loading'
  | 'a11y.error_occurred'
  | 'a11y.page_loaded'

// Translation dictionaries
const translations = {
  fa: {
    // Common UI
    'common.save': 'ذخیره',
    'common.cancel': 'لغو',
    'common.delete': 'حذف',
    'common.edit': 'ویرایش',
    'common.add': 'افزودن',
    'common.search': 'جستجو',
    'common.loading': 'در حال بارگذاری...',
    'common.error': 'خطا',
    'common.success': 'موفقیت',
    'common.warning': 'هشدار',
    'common.info': 'اطلاعات',
    'common.retry': 'تلاش مجدد',
    'common.back': 'بازگشت',
    'common.next': 'بعدی',
    'common.previous': 'قبلی',
    'common.close': 'بستن',
    'common.open': 'باز کردن',
    'common.yes': 'بله',
    'common.no': 'خیر',

    // Navigation
    'nav.dashboard': 'داشبورد',
    'nav.kanban': 'کانبان',
    'nav.calendar': 'تقویم',
    'nav.analytics': 'آمار',
    'nav.settings': 'تنظیمات',
    'nav.templates': 'قالب‌ها',
    'nav.search': 'جستجو',
    'nav.help': 'راهنما',

    // Dashboard
    'dashboard.title': 'داشبورد',
    'dashboard.welcome': 'خوش آمدید',
    'dashboard.tasks_today': 'وظایف امروز',
    'dashboard.tasks_completed': 'وظایف تکمیل شده',
    'dashboard.tasks_pending': 'وظایف در انتظار',
    'dashboard.recent_activity': 'فعالیت‌های اخیر',

    // Tasks
    'task.create': 'ایجاد وظیفه',
    'task.edit': 'ویرایش وظیفه',
    'task.delete': 'حذف وظیفه',
    'task.title': 'عنوان',
    'task.description': 'توضیحات',
    'task.due_date': 'تاریخ سررسید',
    'task.priority': 'اولویت',
    'task.priority_low': 'کم',
    'task.priority_medium': 'متوسط',
    'task.priority_high': 'زیاد',
    'task.status': 'وضعیت',
    'task.status_todo': 'در انتظار',
    'task.status_in_progress': 'در حال انجام',
    'task.status_done': 'تکمیل شده',
    'task.assignee': 'مسئول',
    'task.labels': 'برچسب‌ها',
    'task.comments': 'نظرات',
    'task.attachments': 'پیوست‌ها',

    // Settings
    'settings.title': 'تنظیمات',
    'settings.profile': 'پروفایل',
    'settings.notifications': 'اعلان‌ها',
    'settings.appearance': 'ظاهر',
    'settings.language': 'زبان',
    'settings.timezone': 'منطقه زمانی',
    'settings.date_format': 'فرمت تاریخ',

    // Errors
    'error.network': 'خطای شبکه',
    'error.server': 'خطای سرور',
    'error.not_found': 'یافت نشد',
    'error.unauthorized': 'دسترسی غیرمجاز',
    'error.validation': 'خطای اعتبارسنجی',
    'error.unknown': 'خطای ناشناخته',

    // Accessibility
    'a11y.skip_to_main': 'رفتن به محتوای اصلی',
    'a11y.loading': 'در حال بارگذاری',
    'a11y.error_occurred': 'خطایی رخ داده است',
    'a11y.page_loaded': 'صفحه بارگذاری شد',
  } as const,

  en: {
    // Common UI
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.search': 'Search',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.warning': 'Warning',
    'common.info': 'Info',
    'common.retry': 'Retry',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.close': 'Close',
    'common.open': 'Open',
    'common.yes': 'Yes',
    'common.no': 'No',

    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.kanban': 'Kanban',
    'nav.calendar': 'Calendar',
    'nav.analytics': 'Analytics',
    'nav.settings': 'Settings',
    'nav.templates': 'Templates',
    'nav.search': 'Search',
    'nav.help': 'Help',

    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.welcome': 'Welcome',
    'dashboard.tasks_today': 'Tasks Today',
    'dashboard.tasks_completed': 'Tasks Completed',
    'dashboard.tasks_pending': 'Tasks Pending',
    'dashboard.recent_activity': 'Recent Activity',

    // Tasks
    'task.create': 'Create Task',
    'task.edit': 'Edit Task',
    'task.delete': 'Delete Task',
    'task.title': 'Title',
    'task.description': 'Description',
    'task.due_date': 'Due Date',
    'task.priority': 'Priority',
    'task.priority_low': 'Low',
    'task.priority_medium': 'Medium',
    'task.priority_high': 'High',
    'task.status': 'Status',
    'task.status_todo': 'To Do',
    'task.status_in_progress': 'In Progress',
    'task.status_done': 'Done',
    'task.assignee': 'Assignee',
    'task.labels': 'Labels',
    'task.comments': 'Comments',
    'task.attachments': 'Attachments',

    // Settings
    'settings.title': 'Settings',
    'settings.profile': 'Profile',
    'settings.notifications': 'Notifications',
    'settings.appearance': 'Appearance',
    'settings.language': 'Language',
    'settings.timezone': 'Timezone',
    'settings.date_format': 'Date Format',

    // Errors
    'error.network': 'Network Error',
    'error.server': 'Server Error',
    'error.not_found': 'Not Found',
    'error.unauthorized': 'Unauthorized',
    'error.validation': 'Validation Error',
    'error.unknown': 'Unknown Error',

    // Accessibility
    'a11y.skip_to_main': 'Skip to main content',
    'a11y.loading': 'Loading',
    'a11y.error_occurred': 'An error occurred',
    'a11y.page_loaded': 'Page loaded',
  } as const,
} as const

// Locale configuration
export const localeConfig = {
  fa: {
    name: 'فارسی',
    direction: 'rtl' as const,
    flag: '🇮🇷',
    dateLocale: 'fa-IR',
    numberLocale: 'fa-IR',
  },
  en: {
    name: 'English',
    direction: 'ltr' as const,
    flag: '🇺🇸',
    dateLocale: 'en-US',
    numberLocale: 'en-US',
  },
} as const

// Translation function
export function t(key: TranslationKey, locale: SupportedLocale = 'fa'): string {
  const translation = translations[locale]?.[key]
  if (!translation) {
    console.warn(`Translation missing for key: ${key} in locale: ${locale}`)
    return key
  }
  return translation
}

// Get locale direction
export function getLocaleDirection(locale: SupportedLocale): 'rtl' | 'ltr' {
  return localeConfig[locale].direction
}

// Format date according to locale
export function formatDate(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions,
  locale: SupportedLocale = 'fa'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat(localeConfig[locale].dateLocale, options).format(dateObj)
}

// Format number according to locale
export function formatNumber(
  number: number,
  options?: Intl.NumberFormatOptions,
  locale: SupportedLocale = 'fa'
): string {
  return new Intl.NumberFormat(localeConfig[locale].numberLocale, options).format(number)
}

// Pluralization helper (basic implementation)
export function pluralize(
  count: number,
  singular: string,
  plural: string,
  locale: SupportedLocale = 'fa'
): string {
  if (locale === 'en') {
    return count === 1 ? singular : plural
  }

  // Persian doesn't have plural forms like English
  return singular
}

// Validation messages
export const validationMessages = {
  fa: {
    required: 'این فیلد الزامی است',
    email: 'ایمیل معتبر وارد کنید',
    minLength: (min: number) => `حداقل ${min} کاراکتر وارد کنید`,
    maxLength: (max: number) => `حداکثر ${max} کاراکتر وارد کنید`,
    pattern: 'فرمت وارد شده صحیح نیست',
  },
  en: {
    required: 'This field is required',
    email: 'Please enter a valid email',
    minLength: (min: number) => `Please enter at least ${min} characters`,
    maxLength: (max: number) => `Please enter no more than ${max} characters`,
    pattern: 'The entered format is invalid',
  },
} as const

export function getValidationMessage(
  type: keyof typeof validationMessages.fa,
  locale: SupportedLocale = 'fa',
  ...args: [number] | []
): string {
  const message = validationMessages[locale][type]
  if (typeof message === 'function') {
    return message(...args)
  }
  return message
}
