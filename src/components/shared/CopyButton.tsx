'use client'

import { Copy, Check } from 'lucide-react'
import { useState } from 'react'

export default function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      title="Kodu kopyala"
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: copied ? 'var(--green)' : 'var(--gold)', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
    >
      {copied ? <Check size={15} /> : <Copy size={15} />}
    </button>
  )
}
