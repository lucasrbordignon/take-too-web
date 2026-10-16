import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { VersaoDTO } from '../api/types.ts'
import { imagensService } from '../services/imagens.service.ts'

export function VersionImage({ versao, projetoId, portal = false }: { versao: VersaoDTO; projetoId?: string; portal?: boolean }) {
  const [attempt, setAttempt] = useState(0)
  const [failed, setFailed] = useState(false)
  const image = useQuery({ queryKey: ['version-image', portal ? 'portal' : projetoId, versao.id],
    queryFn: () => imagensService.visualizarVersao(versao.id!, projetoId, portal), retry: false,
    staleTime: 5 * 60 * 1000, refetchInterval: 9 * 60 * 1000 })
  return <section aria-label="Imagem da versão" className="w-full overflow-hidden rounded-2xl border border-[#343946] bg-[#07090D] p-3">
    {image.isPending && <p role="status" className="py-12 text-center text-sm text-[#A8B0C0]">Carregando imagem…</p>}
    {image.data && <img key={`${image.data.url}:${attempt}`} src={image.data.url} alt={versao.imagem?.nome ?? 'Imagem para revisão'} referrerPolicy="no-referrer" onLoad={() => setFailed(false)} onError={() => setFailed(true)} className="mx-auto max-h-[65dvh] w-full object-contain" />}
    {(image.isError || failed) && <div role="alert" className="p-3 text-sm text-red-300">Não foi possível carregar a imagem.<button type="button" onClick={() => { setAttempt((value) => value + 1); void image.refetch() }} className="ml-3 min-h-11 rounded-lg bg-[#242832] px-3 text-white">Tentar novamente</button></div>}
  </section>
}
