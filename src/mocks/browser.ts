import { setupWorker } from 'msw/browser'
import { resumePendingOrders } from './effects'
import { handlers } from './handlers'
import { initScenario } from './scenarios'

export async function startMocks() {
  initScenario()
  const worker = setupWorker(...handlers)
  await worker.start({ onUnhandledRequest: 'bypass', quiet: true })
  resumePendingOrders()
}
