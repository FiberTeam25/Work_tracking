import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import * as Localization from 'expo-localization'

const ar = {
  common: {
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    confirm: 'تأكيد',
    loading: 'جاري التحميل...',
    error: 'حدث خطأ',
    retry: 'إعادة المحاولة',
    offline: 'وضع عدم الاتصال',
    syncing: 'جاري الرفع...',
    synced: 'متزامن',
    pending: 'معلّق',
  },
  task: {
    new: 'تاسك جديد',
    today: 'تاسكات اليوم',
    type: 'نوع التاسك',
    route: 'Route (مسار)',
    node: 'Node (نود)',
    length: 'الطول (متر)',
    quantity: 'الكمية',
    notes: 'ملاحظات',
    photos: 'الصور (min 2)',
    before: 'قبل',
    after: 'بعد',
    submit: 'حفظ التاسك ✓',
    gpsLock: 'جاري تحديد الموقع...',
    gpsWarning: 'تحذير: أنت على بُعد {distance}م من النود المحدد',
    photoRequired: 'يجب إضافة صورتين على الأقل (قبل وبعد)',
    saved: 'تم الحفظ',
    savedMsg: 'تم حفظ التاسك وسيتم رفعه عند توافر الاتصال',
  },
  auth: {
    login: 'تسجيل الدخول',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    submit: 'دخول',
    loggingIn: 'جاري الدخول...',
    errorRequired: 'يرجى إدخال البريد الإلكتروني وكلمة المرور',
    logOut: 'تسجيل الخروج',
  },
}

const en: typeof ar = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    confirm: 'Confirm',
    loading: 'Loading...',
    error: 'An error occurred',
    retry: 'Retry',
    offline: 'Offline Mode',
    syncing: 'Syncing...',
    synced: 'Synced',
    pending: 'Pending',
  },
  task: {
    new: 'New Task',
    today: "Today's Tasks",
    type: 'Task Type',
    route: 'Route',
    node: 'Node',
    length: 'Length (m)',
    quantity: 'Quantity',
    notes: 'Notes',
    photos: 'Photos (min 2)',
    before: 'Before',
    after: 'After',
    submit: 'Save Task ✓',
    gpsLock: 'Getting GPS location...',
    gpsWarning: 'Warning: You are {distance}m away from the selected node',
    photoRequired: 'At least 2 photos required (before & after)',
    saved: 'Saved',
    savedMsg: 'Task saved locally and will sync when connection is available',
  },
  auth: {
    login: 'Sign In',
    email: 'Email',
    password: 'Password',
    submit: 'Sign In',
    loggingIn: 'Signing in...',
    errorRequired: 'Please enter your email and password',
    logOut: 'Sign Out',
  },
}

export function initI18n() {
  const deviceLocale = Localization.getLocales()[0]?.languageCode ?? 'ar'
  const lang = deviceLocale === 'ar' ? 'ar' : 'en'

  i18next.use(initReactI18next).init({
    resources: { ar: { translation: ar }, en: { translation: en } },
    lng: lang,
    fallbackLng: 'ar',
    interpolation: { escapeValue: false },
  })
}
