'use client'

import { useTranslations } from "next-intl"

export default function Button() {
  const t = useTranslations('List')
  return (
    <button onClick={() => alert(t('text'))}>{t('text')}</button>
  )
}
