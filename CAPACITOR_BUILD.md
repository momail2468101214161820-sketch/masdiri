# 📱 صوت البلد — بناء تطبيق APK حقيقي عبر Capacitor

تم تجهيز مشروع Capacitor الكامل. اتبع الخطوات التالية على جهازك (Windows / Mac / Linux).

## المتطلبات (مرة واحدة)

- **Node.js 20+** و **Git** مثبتين.
- **Android Studio** (مع Android SDK 34+ و JDK 17). [تحميل](https://developer.android.com/studio)
- لـ iOS فقط: **Mac + Xcode 15+**.

---

## الخطوات الكاملة (نسخ ولصق)

### 1) نقل المشروع إلى جهازك

```bash
# في Lovable: اضغط GitHub → Connect → Create Repository
git clone https://github.com/<your-user>/<your-repo>.git
cd <your-repo>
npm install
```

### 2) إضافة منصة أندرويد

```bash
npx cap add android
npx cap update android
```

> لـ iOS (يحتاج Mac):
> ```bash
> npx cap add ios && npx cap update ios
> ```

### 3) بناء الويب ومزامنته مع التطبيق الأصلي

```bash
npm run build
npx cap sync
```

> 🔁 كرر هذين الأمرين بعد أي تعديل تسحبه من Lovable (`git pull`).

### 4) فتح Android Studio وإنشاء APK

```bash
npx cap open android
```

داخل Android Studio:

1. انتظر اكتمال Gradle Sync (أول مرة قد تستغرق دقائق).
2. من القائمة العلوية: **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
3. عند اكتمال البناء، اضغط **locate** في الإشعار. ستجد الملف في:
   ```
   android/app/build/outputs/apk/debug/app-debug.apk
   ```
4. انقل هذا الملف إلى أي هاتف أندرويد وافتحه للتثبيت (فعّل "تثبيت من مصادر غير معروفة").

### 5) (اختياري) APK موقّع للتوزيع / Play Store

داخل Android Studio:

1. **Build → Generate Signed Bundle / APK**
2. اختر **APK** → **Next**
3. أنشئ **Keystore جديد** (احفظه! ستحتاجه لكل تحديث) → املأ البيانات
4. اختر **release** → اضغط **Finish**
5. الملف الناتج:
   ```
   android/app/build/outputs/apk/release/app-release.apk
   ```

---

## التشغيل على جهاز/محاكي مباشرة

```bash
# جهاز فعلي موصول USB أو محاكي مفتوح
npx cap run android
```

---

## ⚙️ ملاحظات مهمة عن إعداد المشروع

- `capacitor.config.ts` مُهيّأ بـ **Hot-Reload مباشر** من سيرفر Lovable — أي تعديل تنشره في Lovable يظهر فوراً في التطبيق المثبّت على الموبايل دون إعادة بناء.
- لو أردت تطبيقاً يعمل **بدون إنترنت** (يحمل ويب التطبيق داخل APK)، احذف قسم `server` من `capacitor.config.ts` ثم أعد:
  ```bash
  npm run build && npx cap sync android
  ```
- لتغيير الأيقونة وشاشة البداية: ضع الصور في `android/app/src/main/res/` أو استخدم:
  ```bash
  npm i -D @capacitor/assets
  npx capacitor-assets generate --android
  ```
- بعد أي تحديث للأكواد:
  ```bash
  git pull && npm install && npm run build && npx cap sync
  ```

---

## 📚 الدليل الرسمي

[Mobile development with Lovable + Capacitor (Blog)](https://lovable.dev/blog/mobile-development-with-capacitor)
