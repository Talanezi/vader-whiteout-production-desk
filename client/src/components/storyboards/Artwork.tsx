import { useEffect, useRef, useState } from 'react'
import { useMedia } from '../../lib/storyboards/useMedia'
import { DrawingObjects } from './Studio'
import { StudioGlyph } from './StudioControls'
import type { Annotation } from '../../lib/storyboards/model'
import { artworkFrame, type ArtworkFrame } from '../../lib/storyboards/framing'
import DotsLoader from '../whiteout/DotsLoader'
export default function Artwork({
  documentId,
  assetId,
  label,
  thumbnail = true,
  drawing,
  drawingHeight = 562.5,
  frame,
}: {
  documentId: string
  assetId?: string
  label: string
  thumbnail?: boolean
  drawing?: Annotation[]
  drawingHeight?: number
  frame?: ArtworkFrame | null
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
  const [sourceHeight, setSourceHeight] = useState(drawingHeight)
  useEffect(() => {
    if (!url) return
    let alive = true
    const image = new Image()
    image.onload = () =>
      alive && setSourceHeight((1000 * image.height) / image.width)
    image.src = url
    return () => {
      alive = false
    }
  }, [url])
  const height = assetId ? sourceHeight : drawingHeight,
    box = artworkFrame(height, frame)
  return (
    <span ref={host} className="sb-artwork-preview">
      {drawing && !assetId ? (
        <svg
          className="sb-native-art"
          viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`}
          role="img"
          aria-label={label}
        >
          <rect {...box} fill="white" />
          <DrawingObjects objects={drawing} height={height} />
        </svg>
      ) : assetId ? (
        error ? (
          <span role="alert">Artwork unavailable</span>
        ) : url ? (
          frame || drawing?.length ? (
            <svg
              className="sb-native-art"
              viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`}
              role="img"
              aria-label={label}
            >
              <rect {...box} fill="white" />
              <image href={url} width="1000" height={height} />
              {drawing && <DrawingObjects objects={drawing} height={height} />}
            </svg>
          ) : (
            <img src={url} alt={label} loading="lazy" draggable={false} />
          )
        ) : (
          <DotsLoader />
        )
      ) : (
        <span className="sb-drawing-empty">
          <StudioGlyph name="pen" />
        </span>
      )}
    </span>
  )
}
