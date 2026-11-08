import { createFileRoute } from '@tanstack/react-router'
import { PageContainer } from '@/components/layout/PageContainer'
import { nftListParamsSchema } from '@/schemas/nft'

export const Route = createFileRoute('/')({
  validateSearch: nftListParamsSchema,
  component: Page,
})

function Page() {
  return (
    <PageContainer className="py-24">
      <h1 className="text-2xl font-bold text-primary">Kurio</h1>
    </PageContainer>
  )
}
