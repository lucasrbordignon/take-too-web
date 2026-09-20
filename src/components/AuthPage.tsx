import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/useAuth.ts'
import { HealthCheckBadge } from './HealthCheckBadge.tsx'

interface PreviewComment {
  id: string
  timecode: number
  timecodeStr: string
  author: string
  role: 'CLIENTE' | 'DIRETOR'
  text: string
  color: string
}

const PREVIEW_COMMENTS: PreviewComment[] = [
  {
    id: '1',
    timecode: 3,
    timecodeStr: '00:03',
    author: 'Mariana Costa',
    role: 'CLIENTE',
    text: 'Antecipar a entrada da trilha sonora.',
    color: '#F59E0B', // amber
  },
  {
    id: '2',
    timecode: 7,
    timecodeStr: '00:07',
    author: 'Lucas Mendes',
    role: 'DIRETOR',
    text: 'Ajustar gradação de cor na transição.',
    color: '#A78BFA', // purple
  },
]

export function AuthPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login, isLoggingIn } = useAuth()

  const isSessionExpired = searchParams.get('expired') === 'true'
  const returnUrl = searchParams.get('returnUrl')

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Video preview player state
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [videoDuration, setVideoDuration] = useState(10)
  const [videoCurrentTime, setVideoCurrentTime] = useState(0)
  const [isVideoPlaying, setIsVideoPlaying] = useState(true)
  const [isVideoMuted, setIsVideoMuted] = useState(true)
  const [hasVideoError, setHasVideoError] = useState(false)

  // Formata segundos em MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60)
    const remainingSecs = Math.floor(secs % 60)
    return `${String(mins).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`
  }

  // Tenta dar play automático com som mudo (padrão de navegadores modernos)
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      if (video.duration && !isNaN(video.duration)) {
        setVideoDuration(video.duration)
      }
    }

    const handleTimeUpdate = () => {
      setVideoCurrentTime(video.currentTime)
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('timeupdate', handleTimeUpdate)

    const playPromise = video.play()
    if (playPromise !== undefined) {
      playPromise
        .then(() => setIsVideoPlaying(true))
        .catch(() => {
          // Navegador pode requerer interação ou mudo
          setIsVideoPlaying(false)
        })
    }

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('timeupdate', handleTimeUpdate)
    }
  }, [])

  const togglePlay = () => {
    if (!videoRef.current) return
    if (isVideoPlaying) {
      videoRef.current.pause()
      setIsVideoPlaying(false)
    } else {
      videoRef.current.play()
      setIsVideoPlaying(true)
    }
  }

  const toggleMute = () => {
    if (!videoRef.current) return
    videoRef.current.muted = !isVideoMuted
    setIsVideoMuted(!isVideoMuted)
  }

  const seekToTimecode = (seconds: number) => {
    if (!videoRef.current) return
    videoRef.current.currentTime = seconds
    setVideoCurrentTime(seconds)
    if (!isVideoPlaying) {
      videoRef.current.play()
      setIsVideoPlaying(true)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!email.trim() || !senha.trim()) {
      setErrorMessage('Informe seu e-mail e sua senha.')
      return
    }

    try {
      await login({ email, senha })
      if (returnUrl) {
        navigate(decodeURIComponent(returnUrl))
      } else {
        navigate('/projetos')
      }
    } catch (err: unknown) {
      const errObj = err as {
        response?: { data?: { message?: string } | string; status?: number }
        message?: string
      }
      const dataMessage =
        typeof errObj.response?.data === 'object' && errObj.response?.data?.message
          ? errObj.response.data.message
          : typeof errObj.response?.data === 'string'
          ? errObj.response.data
          : null

      setErrorMessage(
        dataMessage ||
          (errObj.response?.status === 401 || errObj.response?.status === 403
            ? 'E-mail ou senha incorretos. Verifique suas credenciais.'
            : errObj.message || 'Erro ao conectar ao servidor. Verifique se o backend está rodando.')
      )
    }
  }

  // Progresso do vídeo em porcentagem
  const progressPercent = videoDuration > 0 ? (videoCurrentTime / videoDuration) * 100 : 0

  return (
    <div className="min-h-screen w-full bg-[#0A0C10] text-[#F8FAFC] flex items-center justify-center font-sans antialiased overflow-x-hidden relative selection:bg-[#8B5CF6]/30 selection:text-white">
      {/* Background ambient lighting effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] sm:w-[700px] h-[500px] sm:h-[700px] rounded-full bg-[#8B5CF6]/10 blur-[130px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] sm:w-[700px] h-[500px] sm:h-[700px] rounded-full bg-[#6366F1]/10 blur-[140px]" />
      </div>

      {/* Real-time backend health check badge */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50">
        <HealthCheckBadge />
      </div>

      {/* Main Container: Full screen with responsive layout across all desktop sizes */}
      <div className="relative z-10 w-full min-h-screen lg:h-screen lg:max-h-screen flex flex-col lg:flex-row items-stretch justify-center">
        
        {/* ======================================================== */}
        {/* LADO ESQUERDO: Showcase Visual + Vídeo em Loop (>= 1024px)*/}
        {/* ======================================================== */}
        <div className="hidden lg:flex w-full lg:w-[48%] xl:w-[50%] 2xl:w-[54%] shrink-0 p-4 lg:p-6 xl:p-8 2xl:p-12 flex-col items-center justify-center relative border-r border-[#2E3440]/40 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#2E3440]/60 [&::-webkit-scrollbar-thumb]:rounded-full">
          
          {/* Centered Content Container for Left Column */}
          <div className="w-full max-w-[460px] lg:max-w-[490px] xl:max-w-[560px] 2xl:max-w-[660px] flex flex-col justify-between h-full max-h-[640px] my-auto">
            
            {/* Top Logo & Brand */}
            <div className="flex items-center gap-2.5 xl:gap-3 shrink-0">
              <div className="w-7 h-7 lg:w-8 lg:h-8 xl:w-9 xl:h-9 rounded-[9px] xl:rounded-[11px] bg-[#8B5CF6]/20 p-1.5 flex items-center justify-center shadow-lg border border-[#8B5CF6]/35 backdrop-blur-md shrink-0">
                <img
                  src="/logo.png"
                  alt="TakeToo Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-[17px] lg:text-[18px] xl:text-[21px] 2xl:text-[23px] leading-tight text-[#F8FAFC] tracking-tight">
                  TakeToo
                </span>
                <span className="text-[8.5px] lg:text-[9px] xl:text-[10.5px] font-medium text-[#A8B0C0] tracking-wider uppercase">
                  Revisão & Aprovação Audiovisual
                </span>
              </div>
            </div>

            {/* Hero Content */}
            <div className="my-auto py-1 lg:py-1.5 xl:py-3 flex flex-col gap-2.5 lg:gap-3 xl:gap-4 w-full">
              <div>
                <h1 className="font-extrabold text-[20px] lg:text-[22px] xl:text-[30px] 2xl:text-[38px] leading-[1.15] text-[#F8FAFC] tracking-tight">
                  Menos mensagens. <br />
                  <span className="bg-gradient-to-r from-[#A78BFA] via-[#C084FC] to-[#E879F9] bg-clip-text text-transparent">
                    Mais criação.
                  </span>
                </h1>
              </div>

              <p className="font-normal text-[11px] lg:text-[11.5px] xl:text-[13.5px] 2xl:text-[14.5px] leading-relaxed text-[#A8B0C0]">
                Centralize versões, comentários conectados ao timecode e aprovações do cliente em uma experiência fluida feita sob medida para produtoras e editores.
              </p>

              {/* Mockup Card do Player de Vídeo Interativo */}
              <div className="w-full bg-[#13161F]/90 backdrop-blur-xl rounded-[12px] xl:rounded-[18px] p-2 lg:p-2.5 xl:p-3.5 2xl:p-4 border border-[#2E3440]/70 shadow-2xl flex flex-col gap-2 lg:gap-2.5 xl:gap-3.5 group">
                
                {/* Top Bar do Mockup */}
                <div className="flex items-center justify-between gap-2 pb-1 border-b border-[#2E3440]/40">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-2 h-2 rounded-full bg-[#EF4444]/80 shrink-0" />
                    <div className="w-2 h-2 rounded-full bg-[#F59E0B]/80 shrink-0" />
                    <div className="w-2 h-2 rounded-full bg-[#10B981]/80 shrink-0" />
                    <span className="font-mono text-[9.5px] lg:text-[10px] xl:text-[11px] text-[#A8B0C0] ml-1 xl:ml-1.5 truncate">
                      Take_03_Corte_Final.mp4
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[8.5px] lg:text-[9px] xl:text-[9.5px] font-semibold px-1.5 py-0.5 rounded-full bg-[#10B981]/15 text-[#34D399] border border-[#10B981]/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
                      Preview Ativo
                    </span>
                  </div>
                </div>

                {/* Área do Vídeo com Player HTML5 Real */}
                <div className="relative w-full aspect-video max-h-[120px] lg:max-h-[135px] xl:max-h-[185px] 2xl:max-h-[250px] bg-[#07090D] rounded-[8px] xl:rounded-[12px] overflow-hidden border border-[#2E3440]/50 flex items-center justify-center">
                  
                  {/* Fallback caso vídeo não consiga carregar */}
                  {hasVideoError ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4 text-center bg-gradient-to-br from-[#12151C] to-[#1E1B2E]">
                      <div className="w-10 h-10 rounded-full bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-[#A78BFA]">
                        🎬
                      </div>
                      <p className="text-xs text-[#A8B0C0]">
                        Player pronto para demonstração de timecodes.
                      </p>
                    </div>
                  ) : (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        loop
                        muted
                        playsInline
                        onError={() => setHasVideoError(true)}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={togglePlay}
                      >
                        {/* Tenta primeiro um vídeo local se o usuário colocar em /preview.mp4 */}
                        <source src="/preview.mp4" type="video/mp4" />
                        {/* Fallback público confiável de demonstração */}
                        <source src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" type="video/mp4" />
                      </video>

                      {/* Overlay com controles rápidos no hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-90 transition-opacity flex flex-col justify-between p-2.5 lg:p-3 pointer-events-none">
                        
                        {/* Botão de som / mute */}
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={toggleMute}
                            className="pointer-events-auto w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur text-white flex items-center justify-center transition-all cursor-pointer border border-white/10"
                            title={isVideoMuted ? 'Desmutar vídeo' : 'Mutar vídeo'}
                          >
                            {isVideoMuted ? (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                <line x1="23" y1="9" x2="17" y2="15" />
                                <line x1="17" y1="9" x2="23" y2="15" />
                              </svg>
                            ) : (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                              </svg>
                            )}
                          </button>
                        </div>

                        {/* Play / Pause button centralizado */}
                        {!isVideoPlaying && (
                          <div className="self-center pointer-events-auto">
                            <button
                              type="button"
                              onClick={togglePlay}
                              className="w-10 h-10 rounded-full bg-[#8B5CF6]/90 hover:bg-[#7C3AED] backdrop-blur flex items-center justify-center text-white shadow-xl hover:scale-105 transition-all cursor-pointer"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8 5V19L19 12L8 5Z" />
                              </svg>
                            </button>
                          </div>
                        )}

                        {/* Informação de timecode HUD */}
                        <div className="flex items-center justify-between text-[9.5px] lg:text-[10px] xl:text-[10.5px] font-mono text-white/90">
                          <span className="bg-black/60 backdrop-blur px-1.5 py-0.5 rounded border border-white/10">
                            {formatTime(videoCurrentTime)} / {formatTime(videoDuration)}
                          </span>
                          <span className="text-[8.5px] lg:text-[9px] text-white/60">
                            Clique para pausar
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Scrubber Bar com Marcadores de Comentário */}
                <div className="flex flex-col gap-1 pt-0.5">
                  <div
                    className="relative w-full h-1.5 xl:h-2 bg-[#1F232D] rounded-full cursor-pointer overflow-visible group/scrubber"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      const pos = (e.clientX - rect.left) / rect.width
                      seekToTimecode(pos * videoDuration)
                    }}
                  >
                    {/* Linha de progresso preenchida */}
                    <div
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] rounded-full transition-all duration-75"
                      style={{ width: `${progressPercent}%` }}
                    />

                    {/* Marcador 00:03 */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        seekToTimecode(3)
                      }}
                      className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 xl:w-3 xl:h-3 rounded-full bg-[#F59E0B] border-2 border-[#13161F] hover:scale-125 transition-transform shadow cursor-pointer z-10"
                      style={{ left: `${(3 / videoDuration) * 100}%` }}
                      title="00:03 - Antecipar a entrada da trilha sonora"
                    />

                    {/* Marcador 00:07 */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        seekToTimecode(7)
                      }}
                      className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 xl:w-3 xl:h-3 rounded-full bg-[#A78BFA] border-2 border-[#13161F] hover:scale-125 transition-transform shadow cursor-pointer z-10"
                      style={{ left: `${(7 / videoDuration) * 100}%` }}
                      title="00:07 - Ajustar gradação de cor na transição"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[8.5px] lg:text-[9px] xl:text-[9.5px] font-mono text-[#788194]">
                    <span>00:00</span>
                    <span className="hidden sm:inline-block">Clique nos marcadores para pular para o feedback</span>
                    <span>{formatTime(videoDuration)}</span>
                  </div>
                </div>

                {/* Lista dos Comentários Conectados aos Marcadores */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 xl:gap-2.5 pt-0.5">
                  {PREVIEW_COMMENTS.map((comm) => {
                    const isActive = Math.abs(videoCurrentTime - comm.timecode) < 1.5
                    return (
                      <div
                        key={comm.id}
                        onClick={() => seekToTimecode(comm.timecode)}
                        className={`p-1.5 lg:p-2 xl:p-2.5 rounded-[8px] xl:rounded-[10px] border transition-all cursor-pointer flex flex-col gap-0.5 min-w-0 ${
                          isActive
                            ? 'bg-[#8B5CF6]/15 border-[#8B5CF6]/40 shadow-sm'
                            : 'bg-[#181C26]/80 border-[#2E3440]/40 hover:bg-[#1E2330]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className="font-mono text-[9px] lg:text-[9.5px] xl:text-[10.5px] font-bold px-1.5 py-0.2 rounded flex items-center gap-1 shrink-0"
                            style={{ color: comm.color }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: comm.color }} />
                            {comm.timecodeStr}
                          </span>
                          <span className="text-[8.5px] lg:text-[9px] xl:text-[9.5px] font-semibold text-[#788194] uppercase tracking-wider truncate">
                            {comm.author}
                          </span>
                        </div>
                        <p className="text-[9.5px] lg:text-[10px] xl:text-[11px] text-[#E2E5EA] leading-tight line-clamp-1 xl:line-clamp-2">
                          {comm.text}
                        </p>
                      </div>
                    );
                  })}
                </div>

              </div>

              {/* Badges de Benefícios */}
              <div className="grid grid-cols-3 gap-2 xl:gap-3 pt-0.5">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[12px] lg:text-[13px] xl:text-[15px] 2xl:text-[17px] font-bold text-[#F8FAFC]">3x</span>
                  <span className="text-[9px] lg:text-[9.5px] xl:text-[10.5px] 2xl:text-[11.5px] text-[#788194] leading-tight">Aprovações mais ágeis</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[12px] lg:text-[13px] xl:text-[15px] 2xl:text-[17px] font-bold text-[#F8FAFC]">100%</span>
                  <span className="text-[9px] lg:text-[9.5px] xl:text-[10.5px] 2xl:text-[11.5px] text-[#788194] leading-tight">Frame a frame exato</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[12px] lg:text-[13px] xl:text-[15px] 2xl:text-[17px] font-bold text-[#F8FAFC]">Zero</span>
                  <span className="text-[9px] lg:text-[9.5px] xl:text-[10.5px] 2xl:text-[11.5px] text-[#788194] leading-tight">Senha para o cliente</span>
                </div>
              </div>

            </div>

            {/* Footer note */}
            <div className="text-[10px] xl:text-[11px] text-[#788194] hidden lg:block pt-1 xl:pt-2 shrink-0">
              © {new Date().getFullYear()} TakeToo · Plataforma Profissional para Criadores Audiovisuais
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* LADO DIREITO: Form de Login do Profissional              */}
        {/* ======================================================== */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-6 xl:p-10 2xl:p-16 relative w-full lg:h-screen overflow-y-auto">
          
          {/* Card do Formulário */}
          <div className="w-full max-w-[400px] lg:max-w-[390px] xl:max-w-[440px] 2xl:max-w-[460px] bg-[#141720]/95 backdrop-blur-2xl rounded-[20px] xl:rounded-[24px] p-6 lg:p-6 xl:p-9 2xl:p-10 border border-[#2E3440]/80 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col justify-between my-auto">
            
            <div>
              {/* Header do Form */}
              <div className="flex flex-col gap-1.5 xl:gap-2 mb-5 xl:mb-7">
                {/* Logo TakeToo em telas < 1024px (Mobile & Tablet) */}
                <div className="flex lg:hidden items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-[12px] bg-[#8B5CF6]/20 p-1.5 flex items-center justify-center shadow border border-[#8B5CF6]/35">
                    <img
                      src="/logo.png"
                      alt="TakeToo Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-[22px] leading-tight text-[#F8FAFC] tracking-tight">
                      TakeToo
                    </span>
                    <span className="text-[11px] font-medium text-[#A8B0C0] tracking-wider uppercase">
                      Revisão & Aprovação Audiovisual
                    </span>
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#C4B5FD] text-[11px] font-semibold w-fit">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Área do Profissional
                </div>

                <h2 className="font-extrabold text-[22px] lg:text-[24px] xl:text-[28px] 2xl:text-[30px] leading-tight text-[#F8FAFC] tracking-tight">
                  Bem-vindo de volta
                </h2>
                <p className="font-normal text-[12px] xl:text-[13px] 2xl:text-[14px] leading-relaxed text-[#A8B0C0]">
                  Entre com suas credenciais para gerenciar seus projetos e versões.
                </p>
              </div>

              {/* Alerta de Sessão Expirada */}
              {isSessionExpired && !errorMessage && (
                <div className="mb-4 xl:mb-5 p-3 xl:p-3.5 rounded-[12px] bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#F59E0B] text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span className="leading-relaxed">
                    Sua sessão expirou por inatividade. Faça login novamente para continuar.
                  </span>
                </div>
              )}

              {/* Alerta de Erro */}
              {errorMessage && (
                <div className="mb-4 xl:mb-5 p-3 xl:p-3.5 rounded-[12px] bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#F87171] text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span className="leading-relaxed">{errorMessage}</span>
                </div>
              )}

              {/* Formulário */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 xl:gap-4">
                
                {/* Campo E-mail */}
                <div className="flex flex-col gap-1 xl:gap-1.5">
                  <label className="font-semibold text-[11px] xl:text-[12px] text-[#C4B5FD]">
                    E-mail profissional
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-[#788194]">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </span>
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="editor@taketoo.com"
                      className="w-full h-[44px] xl:h-[48px] pl-10 pr-3.5 bg-[#1B1F2A] border border-[#2E3440] hover:border-[#3E4554] focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 rounded-[10px] xl:rounded-[12px] font-normal text-[13px] xl:text-[14px] text-[#F8FAFC] placeholder:text-[#5A6275] focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Campo Senha */}
                <div className="flex flex-col gap-1 xl:gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-[11px] xl:text-[12px] text-[#C4B5FD]">
                      Sua senha
                    </label>
                  </div>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-[#788194]">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full h-[44px] xl:h-[48px] pl-10 pr-11 bg-[#1B1F2A] border border-[#2E3440] hover:border-[#3E4554] focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 rounded-[10px] xl:rounded-[12px] font-normal text-[13px] xl:text-[14px] text-[#F8FAFC] placeholder:text-[#5A6275] focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 text-[#788194] hover:text-[#F8FAFC] transition-colors cursor-pointer p-1"
                      title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                    >
                      {showPassword ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Botão de Login */}
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="mt-2 xl:mt-3 w-full h-[44px] xl:h-[48px] bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#6D28D9] active:scale-[0.99] disabled:opacity-50 text-white rounded-[10px] xl:rounded-[12px] font-semibold text-[13px] xl:text-[14px] leading-tight transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25 cursor-pointer"
                >
                  {isLoggingIn ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Autenticando...</span>
                    </>
                  ) : (
                    <>
                      <span>Entrar no TakeToo</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Aviso de Cadastro (sem criar conta por ora) */}
            <div className="mt-8 pt-6 border-t border-[#2E3440]/50 text-center">
              <p className="text-[12px] text-[#788194] leading-relaxed">
                Área de acesso restrito a produtores e editores autorizados. <br />
                O cadastro de novas contas é gerenciado pelo administrador da equipe.
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  )
}
