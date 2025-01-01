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
