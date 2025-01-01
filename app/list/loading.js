import { useTranslations } from 'next-intl'
import React from 'react'

export default function Loading() {
  const t = useTranslations('List')

  return (
    <div>{t('loading')}</div>
  )
}
