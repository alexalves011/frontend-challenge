import { createFileRoute } from '@tanstack/react-router'
import { PageContainer } from '@/components/layout/PageContainer'

export const Route = createFileRoute('/cart')({
  component: () => (
    <PageContainer className="py-24">
      <h1 className="text-2xl font-bold">Carrinho</h1>
    </PageContainer>
  ),
})
