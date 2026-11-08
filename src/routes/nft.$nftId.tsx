import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { PageContainer } from '@/components/layout/PageContainer'
import { editionIdSchema } from '@/schemas/nft'

export const Route = createFileRoute('/nft/$nftId')({
  validateSearch: z.object({ edition: editionIdSchema.optional().catch(undefined) }),
  component: () => (
    <PageContainer className="py-24">
      <h1 className="text-2xl font-bold">Detalhe do NFT</h1>
    </PageContainer>
  ),
})
