# Internationalization Guide - Traditional Chinese Translation

## Overview

This guide provides a comprehensive roadmap for converting the Christian Platform from English to Traditional Chinese (繁體中文).

### Documentation Files

This repository includes three detailed documentation files to guide the translation process:

1. **UI_TEXT_INVENTORY.md** - Complete inventory of all user-facing text in the codebase
2. **TRANSLATION_QUICK_REFERENCE.md** - Quick reference guide with prioritized translation list
3. **TRANSLATION_STRING_MAPPING.md** - Detailed line-by-line mapping of every string requiring translation

---

## Quick Start

### For Translators

1. Start with **TRANSLATION_QUICK_REFERENCE.md** - provides priority order and high-level overview
2. Use **TRANSLATION_STRING_MAPPING.md** for exact file locations and line numbers
3. Create translations in JSON files following the recommended structure
4. Test each page in both English and Traditional Chinese

### For Developers

1. Review **UI_TEXT_INVENTORY.md** for architecture overview
2. Choose an i18n framework (recommended: i18next)
3. Create folder structure: `src/locales/en/` and `src/locales/zh-TW/`
4. Extract hardcoded strings using the mappings provided
5. Implement language switching component
6. Test translations across all pages

---

## Current Status

### Main Platform (Priority: HIGH)
- **Landing Page**: 10 strings to translate
- **Login Page**: 12 strings to translate
- **Register Page**: 40+ strings to translate
- **Dashboard**: 11 strings to translate
- **Module Configuration**: 37 strings to translate
- **Components**: 6 strings to translate
- **Status**: 0% complete - all in English

### Backend API (Priority: MEDIUM)
- **Auth Controller**: 9 error/success messages
- **Status**: 0% complete - all in English

### Modules (Priority: MEDIUM)
- **Church-Admin**: Partially in Traditional Chinese already
- **Culture/Christianity/Bible-Know/Roll-Call**: To be reviewed per module
- **Status**: Mixed - church-admin partially done

---

## Recommended Implementation Approach

### Phase 1: Setup (1-2 hours)
- [ ] Install i18next and dependencies
- [ ] Create localization folder structure
- [ ] Create English translation files (.json)
- [ ] Set up i18n configuration in main-platform

### Phase 2: Backend Translations (1 hour)
- [ ] Translate backend API messages
- [ ] Update authController.ts to use translations (optional or apply consistently)

### Phase 3: Frontend Translations (4-6 hours)
- [ ] Create Traditional Chinese translation files
- [ ] Translate all strings from TRANSLATION_STRING_MAPPING.md
- [ ] Update components to use i18n hook/function

### Phase 4: Integration (2-3 hours)
- [ ] Wrap hardcoded strings with translation calls
- [ ] Create language selector component
- [ ] Add language preference persistence (localStorage/auth store)
- [ ] Test all pages in both languages

### Phase 5: Testing & QA (2 hours)
- [ ] Verify all strings translated
- [ ] Test dynamic content ({name}, {email}, etc.)
- [ ] Check responsive layout in both languages
- [ ] Test language switching
- [ ] Cross-browser testing

### Phase 6: Module Translations (Variable)
- [ ] Review each module for UI text
- [ ] Ensure consistent terminology across modules
- [ ] Test module loading with language preference

---

## Recommended i18n Framework: i18next

### Installation

```bash
cd main-platform
npm install i18next react-i18next i18next-browser-languagedetector
```

### Folder Structure

```
main-platform/src/
├── locales/
│   ├── en/
│   │   ├── common.json      # Navigation, headers, general
│   │   ├── auth.json        # Login, Register, auth messages
│   │   ├── dashboard.json   # Dashboard specific strings
│   │   └── modules.json     # Module names, descriptions, features
│   └── zh-TW/
│       ├── common.json
│       ├── auth.json
│       ├── dashboard.json
│       └── modules.json
├── config/
│   └── i18n.ts             # i18next configuration
├── hooks/
│   └── useTranslation.ts    # Custom translation hook (if needed)
└── components/
    ├── LanguageSwitcher.tsx  # NEW - Language selector component
    └── ...
```

### Sample i18n Configuration

```typescript
// src/config/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from '../locales/en/common.json';
import enAuth from '../locales/en/auth.json';
import enDashboard from '../locales/en/dashboard.json';
import enModules from '../locales/en/modules.json';

import zhCommon from '../locales/zh-TW/common.json';
import zhAuth from '../locales/zh-TW/auth.json';
import zhDashboard from '../locales/zh-TW/dashboard.json';
import zhModules from '../locales/zh-TW/modules.json';

const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    dashboard: enDashboard,
    modules: enModules,
  },
  'zh-TW': {
    common: zhCommon,
    auth: zhAuth,
    dashboard: zhDashboard,
    modules: zhModules,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

export default i18n;
```

### Component Usage Example

```typescript
// Before
<h1>Welcome back</h1>
<p>Don't have an account? <Link to="/register">Sign up for free</Link></p>

// After
import { useTranslation } from 'react-i18next';

function LoginPage() {
  const { t } = useTranslation('auth');
  
  return (
    <h1>{t('login.welcome')}</h1>
    <p>
      {t('login.noAccount')} 
      <Link to="/register">{t('login.signUpFree')}</Link>
    </p>
  );
}
```

---

## Translation File Format

### Example: locales/en/auth.json
```json
{
  "login": {
    "heading": "Welcome back",
    "noAccount": "Don't have an account?",
    "signUpFree": "Sign up for free",
    "emailLabel": "Email address",
    "emailPlaceholder": "you@example.com",
    "passwordLabel": "Password",
    "passwordPlaceholder": "••••••••",
    "signingIn": "Signing in...",
    "submitButton": "Sign in",
    "backToHome": "← Back to home",
    "errors": {
      "loginFailed": "Login failed. Please try again."
    }
  }
}
```

### Example: locales/zh-TW/auth.json
```json
{
  "login": {
    "heading": "歡迎回來",
    "noAccount": "還沒有帳戶？",
    "signUpFree": "免費註冊",
    "emailLabel": "電子郵件地址",
    "emailPlaceholder": "你的郵箱@example.com",
    "passwordLabel": "密碼",
    "passwordPlaceholder": "••••••••",
    "signingIn": "正在登入...",
    "submitButton": "登入",
    "backToHome": "← 返回首頁",
    "errors": {
      "loginFailed": "登入失敗。請再試一次。"
    }
  }
}
```

---

## Translation Tips

### Terminology Consistency

| English | Traditional Chinese | Context |
|---------|------------------|---------|
| Christian Community | 基督信仰社群 | Brand/platform name |
| Christian Platform | 基督教平台 | Platform name |
| Theology | 神學 | Religious study |
| Bible Learning | 聖經學習 | Educational context |
| Sermon | 講道 | Religious content |
| Faith | 信仰 | Spiritual concept |
| Church | 教會 | Religious institution |
| Seekers | 尋求者 | Audience type |
| Scholars | 學者 | Audience type |
| Students | 學生 | Audience type |
| Leaders | 領導者 | Audience type |

### Guidelines

1. **Maintain brand voice**: Keep tone professional but warm and accessible
2. **Consistency**: Use the same translations for repeated terms
3. **Cultural appropriateness**: Adapt phrasing for Traditional Chinese speakers
4. **Testing**: Always test in context to ensure readability
5. **Variable handling**: Use template syntax like `{{name}}` for dynamic content
6. **Button text**: Keep short and action-oriented
7. **Error messages**: Clear and helpful

---

## String Count Summary

| Section | Count | Translation Time |
|---------|-------|------------------|
| Landing Page | 10 | 20 minutes |
| Login Page | 12 | 25 minutes |
| Register Page | 40+ | 1 hour |
| Dashboard | 11 | 20 minutes |
| Module Config | 37 | 1 hour |
| Components | 6 | 15 minutes |
| Backend API | 9 | 15 minutes |
| **TOTAL** | **~125** | **~4 hours** |

---

## Testing Checklist

- [ ] All strings extracted and placed in translation files
- [ ] No hardcoded English strings remaining in production code
- [ ] Language selector working properly
- [ ] Language preference persists across page reloads
- [ ] Dynamic content ({name}, {email}) renders correctly in both languages
- [ ] All pages tested in English
- [ ] All pages tested in Traditional Chinese
- [ ] Responsive design still works in both languages
- [ ] Mobile view tested
- [ ] Backend error messages match frontend translations
- [ ] Module navigation displays correct language
- [ ] All features functional in both languages

---

## Alternative to i18next: Simple Custom Solution

If you prefer a lighter-weight solution without external libraries:

### Approach: Context + JSON Files

1. Create `src/locales/translations.json`
2. Create `src/context/LanguageContext.tsx`
3. Create `src/hooks/useTranslation.ts`
4. Implement language switching in a component
5. Wrap app with `<LanguageProvider>`

This approach requires more code but has zero external i18n dependencies.

---

## File Locations Summary

**Documentation**:
- `UI_TEXT_INVENTORY.md` - Complete inventory and architecture
- `TRANSLATION_QUICK_REFERENCE.md` - Priority list and tips
- `TRANSLATION_STRING_MAPPING.md` - Line-by-line file references

**Source Files to Modify**:
- `main-platform/src/pages/public/Landing.tsx`
- `main-platform/src/pages/public/Login.tsx`
- `main-platform/src/pages/public/Register.tsx`
- `main-platform/src/pages/dashboard/Dashboard.tsx`
- `main-platform/src/config/modules.ts`
- `main-platform/src/components/layout/Layout.tsx`
- `main-platform/src/components/CanvasModuleCard.tsx`
- `backend-api/src/controllers/authController.ts`

---

## Next Steps

1. **Read** `TRANSLATION_STRING_MAPPING.md` for exact file references
2. **Create** translation files following the recommended structure
3. **Translate** using the terminology guide provided
4. **Implement** i18n framework in main-platform
5. **Test** all pages in both languages
6. **Deploy** with language switching enabled

---

## Support & Resources

For questions about:
- **File locations**: See `TRANSLATION_STRING_MAPPING.md`
- **Priority**: See `TRANSLATION_QUICK_REFERENCE.md`
- **Architecture**: See `UI_TEXT_INVENTORY.md`
- **i18next**: https://www.i18next.com/
- **React i18next**: https://react.i18next.com/

---

## Version History

- **v1.0** (2025-10-27): Initial documentation created
  - Comprehensive UI text inventory
  - File-by-file string mapping
  - i18n implementation guide
  - Translation checklist and timeline

---

Last Updated: 2025-10-27
Status: Documentation Complete - Ready for Translation
