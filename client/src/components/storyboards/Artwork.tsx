import { useEffect, useRef, useState } from 'react'
import { useMedia } from '../../lib/storyboards/useMedia'
import { DrawingObjects } from './Studio'
import { StudioGlyph } from './StudioControls'
import type { Annotation } from '../../lib/storyboards/model'
import DotsLoader from '../whiteout/DotsLoader'
export default function Artwork({
  documentId,
  assetId,
  label,
  thumbnail = true,
  drawing,
}: {
  documentId: string
  assetId?: string
  label: string
  thumbnail?: boolean
  drawing?: Annotation[]
}) {
  const host = useRef<HTMLSpanElement>(null),
    [visible, setVisible] = useState(false)
  useEffect(() => {
    if (!('IntersectionObserver' in window)) {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '240px' },
    )
    if (host.current) observer.observe(host.current)
    return () => observer.disconnect()
  }, [])
  const { url, error } = useMedia(
    documentId,
    visible ? assetId : undefined,
    thumbnail,
  )
  return (
    <span ref={host} className="sb-artwork-preview">
      {drawing ? <svg className="sb-native-art" viewBox="0 0 1000 562.5" role="img" aria-label={label}><rect width="1000" height="562.5" fill="white"/><DrawingObjects objects={drawing}/></svg> : assetId ? (
        error ? (
          <span role="alert">Artwork unavailable</span>
        ) : url ? (
          <img src={url} alt={label} loading="lazy" draggable={false} />
        ) : (
          <DotsLoader />
        )
      ) : (
        <span className="sb-drawing-empty"><StudioGlyph name="pen"/></span>
      )}
    </span>
  )
}
