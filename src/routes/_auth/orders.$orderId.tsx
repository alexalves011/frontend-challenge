import { createFileRoute } from '@tanstack/react-router'
import { PageContainer } from '@/components/layout/PageContainer'

export const Route = createFileRoute('/_auth/orders/$orderId')({
  component: () => (
    <PageContainer className="py-24">
      <h1 className="text-2xl font-bold">Pedido</h1>
    </PageContainer>
  ),
})
