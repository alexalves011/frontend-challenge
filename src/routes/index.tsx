import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Page,
})

function Page() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-2xl font-bold text-primary">Kurio</h1>
    </main>
  )
}
