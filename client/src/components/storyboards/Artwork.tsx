import { useEffect, useRef, useState } from 'react'
import { useMedia } from '../../lib/storyboards/useMedia'
import DotsLoader from '../whiteout/DotsLoader'
export default function Artwork({
  documentId,
  assetId,
  label,
  thumbnail = true,
}: {
  documentId: string
  assetId?: string
  label: string
  thumbnail?: boolean
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
      {assetId ? (
        error ? (
          <span role="alert">Artwork unavailable</span>
        ) : url ? (
          <img src={url} alt={label} loading="lazy" draggable={false} />
        ) : (
          <DotsLoader />
        )
      ) : (
        <span className="sb-empty-art">Add image</span>
      )}
    </span>
  )
}
