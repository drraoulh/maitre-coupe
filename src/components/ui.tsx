import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Icon } from './Icon'
import { initials } from '../lib/utils'

/** Image avec repli élégant si le lien est cassé ou absent. */
export function Img({ src, alt, className }: { src: string | null | undefined; alt: string; className?: string }) {
  const [broken, setBroken] = useState(false)
  useEffect(() => setBroken(false), [src])
  if (!src || broken) {
    return (
      <div className={`img-fallback ${className ?? ''}`} role="img" aria-label={alt}>
        <Icon name="scissors" size={34} />
      </div>
    )
  }
  return <img src={src} alt={alt} className={className} loading="lazy" onError={() => setBroken(true)} />
}

export function Avatar({ name, url, size = 40 }: { name: string; url: string | null; size?: number }) {
  return url ? (
    <img src={url} alt={name} className="avatar" style={{ width: size, height: size }} />
  ) : (
    <span className="avatar avatar-initials" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {initials(name)}
    </span>
  )
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Fermer">
            <Icon name="x" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

export function Spinner() {
  return <div className="spinner" aria-label="Chargement" />
}

export function Empty({ icon = 'scissors', title, children }: { icon?: string; title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <Icon name={icon} size={36} />
      <p className="empty-title">{title}</p>
      {children}
    </div>
  )
}

/** Sélecteur d'image : envoie le fichier et renvoie l'URL obtenue. */
export function ImagePicker({
  value,
  onChange,
  upload,
  label = 'Photo',
}: {
  value: string | null
  onChange: (url: string | null) => void
  upload: (f: File) => Promise<string>
  label?: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  return (
    <div className="field">
      <span className="label">{label}</span>
      <div className="image-picker">
        {value ? <Img src={value} alt="Aperçu" className="image-preview" /> : <div className="image-preview image-empty"><Icon name="image" size={28} /></div>}
        <div className="image-picker-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => ref.current?.click()} disabled={busy}>
            {busy ? 'Envoi…' : value ? 'Changer' : 'Choisir une photo'}
          </button>
          {value && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange(null)}>
              Retirer
            </button>
          )}
          {err && <span className="error-text">{err}</span>}
        </div>
        <input
          ref={ref}
          type="file"
          accept="image/*"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (!f) return
            setBusy(true)
            setErr('')
            try {
              onChange(await upload(f))
            } catch (x) {
              setErr(x instanceof Error ? x.message : 'Envoi impossible')
            } finally {
              setBusy(false)
            }
          }}
        />
      </div>
    </div>
  )
}
