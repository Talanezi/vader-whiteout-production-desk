/** Rasterize the real authorized composition, including original pixels and visible vectors. */
export async function compositionPixels(
  group: SVGGElement,
  height: number,
  box = { x: 0, y: 0, width: 1000, height },
) {
  const clone = group.cloneNode(true) as SVGGElement
  for (const image of clone.querySelectorAll('image')) {
    const href = image.getAttribute('href')
    if (!href || href.startsWith('data:')) continue
    const response = await fetch(href)
    if (!response.ok)
      throw Error('Artwork could not be sampled. Retry when loaded.')
    const data = await response.blob()
    const encoded = await new Promise<string>((resolve, reject) => {
      const r = new FileReader()
      r.onload = () => resolve(String(r.result))
      r.onerror = () => reject(Error('Artwork could not be sampled.'))
      r.readAsDataURL(data)
    })
    image.setAttribute('href', encoded)
  }
  const source = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="${(1000 * box.height) / box.width}" viewBox="${box.x} ${box.y} ${box.width} ${box.height}"><defs><clipPath id="studio-frame"><rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}"/></clipPath></defs>${new XMLSerializer().serializeToString(clone)}</svg>`
  const url = URL.createObjectURL(new Blob([source], { type: 'image/svg+xml' }))
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.width = 1000
    canvas.height = Math.ceil((1000 * box.height) / box.width)
    const context = canvas.getContext('2d', { willReadFrequently: true })!
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    return {
      sample(x: number, y: number) {
        const [r, g, b] = context.getImageData(
          Math.max(
            0,
            Math.min(999, Math.round(((x - box.x) * 1000) / box.width)),
          ),
          Math.max(
            0,
            Math.min(
              canvas.height - 1,
              Math.round(((y - box.y) * canvas.height) / box.height),
            ),
          ),
          1,
          1,
        ).data
        return (
          '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
        )
      },
    }
  } finally {
    URL.revokeObjectURL(url)
  }
}
