import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ImagemDTO } from '../api/types.ts'
import { ImagePicker } from '../components/ImagePicker.tsx'
import { imagensService } from '../services/imagens.service.ts'

export function ImagensPage() {
  const [selected, setSelected] = useState<ImagemDTO | null>(null)
  const [, setBusy] = useState(false)
  const preview = useQuery({ queryKey: ['image-preview', selected?.id], queryFn: () => imagensService.visualizar(selected!.id), enabled: !!selected, retry: false, staleTime: 5 * 60 * 1000 })
  return <div className="mx-auto w-full max-w-5xl pb-10"><header><h1 className="text-[28px] font-bold">Imagens</h1><p className="mt-1 text-sm text-[#A8B0C0]">Envie imagens para sua biblioteca e publique nos projetos quando estiverem prontas.</p></header>
    {selected && <section className="mt-5 rounded-2xl border border-[#343946] bg-[#07090D] p-3"><div className="mb-3 flex items-center justify-between gap-3"><h2 className="truncate text-sm font-semibold">{selected.nome}</h2><button type="button" onClick={() => setSelected(null)} className="min-h-11 px-3 text-sm text-[#A78BFA]">Fechar prévia</button></div>{preview.data && <img src={preview.data.url} alt={selected.nome} referrerPolicy="no-referrer" className="max-h-[65dvh] w-full object-contain" />}{preview.isError && <p role="alert" className="text-sm text-red-300">Não foi possível carregar a prévia.</p>}</section>}
    <ImagePicker selected={selected} onSelected={setSelected} onBusyChange={setBusy} />
  </div>
}
