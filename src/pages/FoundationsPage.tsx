import { Link } from 'react-router-dom'

const colorCards = [
  { category: 'Background', name: 'Base', bgClass: 'bg-bg-base', borderClass: 'border border-border-subtle' },
  { category: 'Background', name: 'Surface', bgClass: 'bg-bg-surface', borderClass: 'border border-border-subtle' },
  { category: 'Background', name: 'Raised', bgClass: 'bg-bg-raised', borderClass: 'border border-border-subtle' },
  { category: 'Brand', name: 'Primary', bgClass: 'bg-brand-primary' },
  { category: 'Brand', name: 'Indigo', bgClass: 'bg-brand-indigo' },
  { category: 'Text', name: 'Primary', bgClass: 'bg-text-primary' },
  { category: 'Text', name: 'Secondary', bgClass: 'bg-text-secondary' },
  { category: 'Border', name: 'Subtle', bgClass: 'bg-border-subtle' },
  { category: 'Status', name: 'Success', bgClass: 'bg-status-success' },
  { category: 'Status', name: 'Warning', bgClass: 'bg-status-warning' },
  { category: 'Status', name: 'Danger', bgClass: 'bg-status-danger' },
]

export function FoundationsPage() {
  return (
    <div className="min-h-screen bg-bg-base text-text-primary p-6 sm:p-12 lg:p-16 flex flex-col gap-8 font-sans">
      {/* Header */}
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-xs text-brand-light hover:underline">
            ← Voltar para Login
          </Link>
        </div>
        <h1 className="text-display font-bold text-text-primary tracking-tight">
          TakeToo — Design Foundations
        </h1>
        <p className="text-body text-text-secondary max-w-3xl">
          Revisão audiovisual sem ruído: feedback preciso, aprovação rápida e contexto em cada frame.
        </p>
      </header>

      {/* Semantic color palette */}
      <section className="flex flex-col gap-3">
        <span className="text-xs uppercase tracking-wider text-text-secondary font-medium">
          Semantic Color Palette
        </span>
        <div className="flex flex-wrap gap-4 items-center">
          {colorCards.map((item) => (
            <div
              key={`${item.category}-${item.name}`}
              className="w-[104px] h-[126px] bg-bg-surface rounded-md p-[10px] flex flex-col justify-between border border-border-subtle/40 hover:border-brand-primary/50 transition-colors shadow-sm"
            >
              <div
                className={`w-[84px] h-[64px] rounded-sm shadow-inner ${item.bgClass} ${item.borderClass ?? ''}`}
              />
              <div className="flex flex-col">
                <span className="text-[9px] text-text-secondary leading-tight truncate">
                  {item.category}
                </span>
                <span className="text-[11px] font-medium text-text-primary leading-tight truncate">
                  {item.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Typography */}
      <section className="flex flex-col gap-3 max-w-5xl">
        <span className="text-xs uppercase tracking-wider text-text-secondary font-medium">
          Typography Scale
        </span>
        <div className="bg-bg-surface rounded-lg p-6 flex flex-col gap-4 border border-border-subtle/50">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-border-subtle/40 pb-3 gap-1">
            <span className="text-xs text-text-secondary font-mono">Display (32px / Bold)</span>
            <p className="text-display font-bold text-text-primary">
              Projetos em movimento
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-border-subtle/40 pb-3 gap-1">
            <span className="text-xs text-text-secondary font-mono">Heading (24px / Semibold)</span>
            <p className="text-heading font-semibold text-text-primary">
              Revisão do cliente
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-border-subtle/40 pb-3 gap-1">
            <span className="text-xs text-text-secondary font-mono">Body (16px / Regular)</span>
            <p className="text-body font-normal text-text-primary">
              Feedback no segundo exato, sem mensagens perdidas.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
            <span className="text-xs text-text-secondary font-mono">Timecode (14px / Medium)</span>
            <span className="text-timecode font-medium text-text-primary bg-bg-raised px-2 py-1 rounded border border-border-subtle font-mono">
              02:18
            </span>
          </div>
        </div>
      </section>

      {/* Radii foundations */}
      <section className="flex flex-col sm:flex-row gap-6 max-w-5xl">
        <div className="flex-1 bg-bg-surface rounded-lg p-5 border border-border-subtle/40 flex flex-col gap-3">
          <span className="text-xs uppercase tracking-wider text-text-secondary font-medium">
            Radii Tokens (Tailwind)
          </span>
          <div className="flex items-center gap-4 text-xs font-mono text-text-secondary">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-bg-raised border border-border-subtle rounded-sm" />
              <span>rounded-sm (10px)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-bg-raised border border-border-subtle rounded-md" />
              <span>rounded-md (14px)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-bg-raised border border-border-subtle rounded-lg" />
              <span>rounded-lg (16px)</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
