import { createFileRoute } from '@tanstack/react-router'
import { PageContainer } from '@/components/layout/PageContainer'

export const Route = createFileRoute('/_auth/profile')({
  component: () => (
    <PageContainer className="py-24">
      <h1 className="text-2xl font-bold">Perfil do colecionador</h1>
    </PageContainer>
  ),
})
