import { getTranslations } from 'next-intl/server'
import React from 'react'

import Button from '@/components/Button'

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

export default async function Page() {
  await sleep(2000)
  const t = await getTranslations('List')

  return (
    <div>
      {t('desc')}

      <Button />
    </div>
  )
}
