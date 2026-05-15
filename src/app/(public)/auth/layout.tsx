import Header from '@/components/layout/Header'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      {children}
    </div>
  )
}
