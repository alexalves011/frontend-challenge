import { Cpu } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const panelButton =
  'h-9 w-full rounded-xl border border-[#3d6fff]/40 bg-[#0d1528] px-3 text-left text-[13px] font-medium text-[#d7e6ff] transition-colors hover:bg-[#15213a] disabled:opacity-50'

/**
 * Console de simulação do backend. Opera via window.__appSimulation (camada de mocks),
 * que altera o db e emite pelo Socket.IO mockado — nunca mexe no cache da UI.
 */
export function DevPanel() {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const mock = typeof window !== 'undefined' ? window.__appSimulation : undefined

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  if (!mock) return null

  const firstItem = () => mock.cartFirstItem()
  const withCartItem = (action: (nftId: string, editionId: NonNullable<ReturnType<typeof firstItem>>['editionId']) => void) => () => {
    const item = firstItem()
    if (item) action(item.nftId, item.editionId)
  }

  return (
    <div ref={rootRef} className="fixed right-4 bottom-24 z-50 flex flex-col items-end gap-3 md:right-6 md:bottom-6">
      {open && (
        <div
          role="dialog"
          aria-labelledby="simulation-title"
          aria-describedby="simulation-desc"
          className="w-[min(calc(100vw-2rem),20.5rem)] rounded-2xl border border-[#2f7dff]/45 bg-[#101827]/95 p-4 text-[#eef3fb] shadow-2xl shadow-black/50 backdrop-blur-md"
        >
          <div className="mb-3">
            <p id="simulation-title" className="text-sm font-bold text-[#5eb1ff]">
              Console de simulação
            </p>
            <p id="simulation-desc" className="mt-1 text-xs text-[#8b9bb8]">
              MSW + Socket.IO. Trocar o cenário recarrega a página.
            </p>
          </div>
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="dev-scenario" className="text-xs text-[#8b9bb8]">
                Cenário
              </label>
              <select
                id="dev-scenario"
                className="h-9 rounded-xl border border-[#3d6fff]/40 bg-[#0d1528] px-2 text-sm text-[#d7e6ff]"
                defaultValue={mock.getScenario()}
                onChange={(event) => {
                  mock.setScenario(event.target.value as Parameters<typeof mock.setScenario>[0])
                  window.location.reload()
                }}
              >
                {Object.entries(mock.scenarios).map(([id, label]) => (
                  <option key={id} value={id}>
                    {id === 'default' ? 'Simular Latência Realista' : label}
                  </option>
                ))}
              </select>
            </div>
            <button type="button" className={panelButton} onClick={withCartItem((nftId, editionId) => mock.changePrice(nftId, editionId))}>
              Injetar Inflação (Item 1)
            </button>
            <button type="button" className={panelButton} onClick={withCartItem((nftId, editionId) => mock.sellOut(nftId, editionId))}>
              Forçar Sold-Out (Item 1)
            </button>
            <button type="button" className={panelButton} onClick={() => mock.duplicateLastEvent()}>
              Redeliver Último Evento
            </button>
            <button type="button" className={panelButton} onClick={withCartItem((nftId) => mock.emitStaleEvent(nftId))}>
              Emitir Evento Stale
            </button>
            <button type="button" className={panelButton} onClick={() => mock.dropSocket()}>
              Drop da Conexão Socket
            </button>
            <button type="button" className={panelButton} onClick={() => mock.expireSessions()}>
              Invalidar Sessão Ativa
            </button>
            <button
              type="button"
              className="h-9 w-full rounded-xl border border-[#ff6b7a]/40 bg-[#2a1216] px-3 text-left text-[13px] font-medium text-[#ffb3bb] transition-colors hover:bg-[#3a181e]"
              onClick={() => {
                mock.reset()
                window.location.assign('/')
              }}
            >
              Restaurar Snapshot Inicial
            </button>
          </div>
        </div>
      )}
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={open ? 'Fechar console de simulação' : 'Abrir console de simulação'}
        onClick={() => setOpen((current) => !current)}
        className="grid size-12 place-items-center rounded-full border border-[#5eb1ff]/50 bg-[#2f7dff] text-[#06101f] opacity-90 shadow-lg shadow-[#2f7dff]/30 hover:opacity-100"
      >
        <Cpu aria-hidden="true" className="size-5" />
      </button>
    </div>
  )
}
