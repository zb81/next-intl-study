# 使用 next-intl 在 Next.js 应用中开启国际化

目前 Next.js 推荐的路由方式是 App Router，所以本文不再介绍 Pages Router，感兴趣的请阅读官方文档 [next-intl Pages Router](https://next-intl.dev/docs/getting-started/pages-router)。

[next-intl](https://next-intl.dev/docs/getting-started) 为 App Router 提供了两种配置选项：
- 带有路由：使用路由片段 locale 或者域名，例如 `/en/about` 和 `en.example.com/about`。
- 不带路由：基于用户设置。

由于第一种方式在后续的路由跳转必须携带 locale 参数，比较不方便，因此本文选择介绍第二种不带路由的方式。

## 一、准备工作

使用 pnpm 创建项目

```sh
pnpm create next-app
```

<img alt="项目选项" src="https://cdn.zb81.icu/36bb3fe785450246cd9f4a096f3f695caa914a04a11ce639c5b0b66c77f4caad.png" />  


运行项目，本文在此页面上进行配置

<img alt="初始页面" src="https://cdn.zb81.icu/09bc4f4fef69433862379bb1f8501d4bcdcd0d7b246997387e2b336d5b571b12.png" />  

## 二、安装和配置

### 1. 安装 next-intl

```sh
pnpm add next-intl
```

### 2. 在根目录创建 `messages` 文件夹，并在此文件夹下创建 `zh.json` 和 `en.json`

> `Home` 为命名空间，后面需要用到，可以在 json 中声明多个，表示不同场景。

- en.json

```json
{
  "Home": {
    "step1": "Get started by editing",
    "step2": "Save and see your changes instantly.",
    "deploy": "Deploy now",
    "docs": "Read our docs",
    "learn": "Learn",
    "examples": "Examples",
    "goto": "Go to"
  },
  "List": {
    "loading": "Loading...",
    "desc": "There is nothing here.",
    "text": "Click me"
  }
}
```

- zh.json

```json
{
  "Home": {
    "step1": "开始编辑",
    "step2": "保存并立即查看您的更改。",
    "deploy": "现在部署",
    "docs": "阅读文档",
    "learn": "学习",
    "examples": "例子",
    "goto": "前往"
  },
  "List": {
    "loading": "加载中...",
    "desc": "这里什么也没有。",
    "text": "点击我"
  }
}
```

### 3. 配置 `next.config.mjs`

```js
import createNextIntlPlugin from 'next-intl/plugin';
 
const withNextIntl = createNextIntlPlugin();
 
/** @type {import('next').NextConfig} */
const nextConfig = {};
 
export default withNextIntl(nextConfig);
```

### 4. 创建 `i18n/config.js`，保存配置

```js
// 系统支持的语言列表
export const locales = ['en', 'zh']

export const defaultLocale = 'en'
```

### 5. 创建 `i18n/service.js`，获取、设置区域

next-intl 在 cookie 中设置了 `NEXT_LOCALE` 字段，用来保存区域配置。

获取区域配置优先级如下：
- 从 cookies 中读取 `NEXT_LOCALE`，有值则直接返回
- 从 headers 中读取解析 `accept-language`，并判断是否在系统支持的语言中

```js
'use server';

import { cookies, headers } from 'next/headers';

import { defaultLocale, locales } from './config';

const COOKIE_NAME = 'NEXT_LOCALE';

export async function getUserLocale() {
  // 读取 cookie
  const locale = (await cookies()).get(COOKIE_NAME)?.value
  if (locale) return locale

  // 读取请求头 accept-language
  const acceptLanguage = (await headers()).get('accept-language')

  // 解析请求头
  const parsedLocale = acceptLanguage?.split(',')[0].split('-')[0]

  // 如果不在系统支持的语言列表，使用默认语言
  return locales.includes(parsedLocale) ? parsedLocale : defaultLocale;
}

export async function setUserLocale(locale) {
  (await cookies()).set(COOKIE_NAME, locale);
}
```

### 6. 创建 `i18n/request.js`，返回国际化配置

```js
import { getRequestConfig } from 'next-intl/server';

import { getUserLocale } from './service'

export default getRequestConfig(async () => {
  const locale = await getUserLocale()

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
```

### 7. 修改 `app/layout.js`

使用 `getLocale` 和 `getMessages` 可以获取 `i18n/request.js` 返回的语言配置，将 locale 设置到 html 的 lang 属性，将 messages 传递给 `NextIntlClientProvider`。

```jsx
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default async function RootLayout({ children }) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

## 三、使用

### 同步服务端组件与客户端组件

> 文本数量较少的情况下，建议将文本通过 props 传递给客户端组件。在客户端组件中调用 `useTranslations` 会将 next-intl 代码打包进客户端 js 中，导致 bundle 体积增大，影响加载性能。

1. 调用 `useTranslations`，传入命名空间
```js
const t = useTranslations('Home')
```
2. 在 jsx 中调用
```js
<p>{t('docs')}</p>
```

### 异步服务端组件

```js
import { getTranslations } from 'next-intl/server'

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

export default async function Page() {
  await sleep(2000)
  const t = await getTranslations('List')

  return (
    <div>
      {t('desc')}
    </div>
  )
}
```

> 关于其他更多用法，例如插值语法、富文本、HTML 标记、数组、数字格式、日期时间格式等，请参考文档 [https://next-intl.dev/docs/usage/messages](https://next-intl.dev/docs/usage/messages)。

## 四、语言切换

创建 `components/LocaleSwitcher.js` 组件，并在 `app/page.js` 中引入

```jsx
'use client'

import { useTransition } from 'react'

import { setUserLocale } from '@/i18n/service'
import { defaultLocale } from '@/i18n/config';

export default function LocaleSwitcher({ defaultValue = defaultLocale }) {
  const [isPending, startTransition] = useTransition();

  function onChange(locale) {
    startTransition(() => {
      setUserLocale(locale);
    });
  }

  return (
    <select
      className="bg-transparent"
      disabled={isPending}
      defaultValue={defaultValue}
      onChange={e => onChange(e.target.value)}
    >
      <option className="bg-gray-600" value='en'>English</option>
      <option className="bg-gray-600" value='zh'>中文</option>
    </select>
  )
}
```

由于我们之前在 Server Action `setUserLocale` 中通过 cookies 设置了语言区域，Next.js 会将新的 cookie 和 DOM 返回给客户端。

<img alt="RSC Payload" src="https://cdn.zb81.icu/44c50bdb87c64ab57410a51b13347082cb34b9af35dfbffa41673592e86d55d7.png" />  

效果如下：

<img alt="切换语言效果图" src="https://cdn.zb81.icu/327368ecec59b2623afaebcd44b563d1cee41b9602329f1613ec988496d08125.gif" />  

## 五、最后

在线预览地址：[https://next-intl-study.vercel.app/](https://next-intl-study.vercel.app/)

完整代码仓库：[https://github.com/zb81/next-intl-study](https://github.com/zb81/next-intl-study)
