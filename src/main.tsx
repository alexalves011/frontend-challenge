import './styles.css'

/**
 * O engine.io-client (socket.io-client) captura `globalThis.WebSocket` ao ser avaliado e o MSW só
 * aplica o patch no `worker.start()`. Por isso o app é importado sob demanda, depois dos mocks
 * (a inicialização do MSW entra na Etapa 3).
 */
async function bootstrap() {
  const { renderApp } = await import('./app')
  renderApp()
}

void bootstrap()
