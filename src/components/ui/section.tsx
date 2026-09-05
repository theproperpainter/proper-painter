import { cn } from '@/lib/utils'

export function Container({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('mx-auto max-w-6xl px-6', className)}>{children}</div>
}

export function Section({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('py-16 md:py-24', className)}>
      <Container>{children}</Container>
    </section>
  )
}
