import { createFileRoute } from '@tanstack/react-router'
import { PageContainer } from '@/components/layout/PageContainer'
import { redirectSearchSchema } from '@/lib/redirect'

export const Route = createFileRoute('/_auth/wallets')({
  validateSearch: redirectSearchSchema,
  component: () => (
    <PageContainer className="py-24">
      <h1 className="text-2xl font-bold">Carteiras</h1>
    </PageContainer>
  ),
})
