/** Build an authorized composition buffer. Raster artwork is decoded and drawn directly;
 * vector SVG is a separate layer, avoiding Safari's asynchronous nested-SVG image loading. */
export async function compositionPixels(
  group: SVGGElement,
  height: number,
  box = { x: 0, y: 0, width: 1000, height },
  resolution = 1000,
) {
  const clone = group.cloneNode(true) as SVGGElement,
    canvas = document.createElement('canvas')
  canvas.width = Math.max(
    1,
    Math.min(
      4096,
      Math.ceil(resolution),
      Math.floor(Math.sqrt((8_000_000 * box.width) / box.height)),
    ),
  )
  canvas.height = Math.max(
    1,
    Math.ceil((canvas.width * box.height) / box.width),
  )
  const context = canvas.getContext('2d', { willReadFrequently: true })!
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  for (const node of clone.querySelectorAll('image')) {
    const href = node.getAttribute('href')
    if (!href) {
      node.remove()
      continue
    }
    const response = await fetch(href)
    if (!response.ok)
      throw Error('Artwork could not be sampled. Retry when loaded.')
    const url = URL.createObjectURL(await response.blob())
    try {
      const image = new Image()
      image.src = url
      await image.decode()
      context.save()
      context.setTransform(
        canvas.width / box.width,
        0,
        0,
        canvas.height / box.height,
        (-box.x * canvas.width) / box.width,
        (-box.y * canvas.height) / box.height,
      )
      context.drawImage(
        image,
        Number(node.getAttribute('x') || 0),
        Number(node.getAttribute('y') || 0),
        Number(node.getAttribute('width') || 1000),
        Number(node.getAttribute('height') || height),
      )
      context.restore()
    } finally {
      URL.revokeObjectURL(url)
    }
    node.remove()
  }
  clone.querySelector(':scope > rect')?.remove()
  const source = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}" viewBox="${box.x} ${box.y} ${box.width} ${box.height}"><defs><clipPath id="studio-frame"><rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}"/></clipPath></defs>${new XMLSerializer().serializeToString(clone)}</svg>`
  const url = URL.createObjectURL(new Blob([source], { type: 'image/svg+xml' }))
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
  } finally {
    URL.revokeObjectURL(url)
  }
  return {
    sample(x: number, y: number) {
      const [r, g, b] = context.getImageData(
        Math.max(
          0,
          Math.min(
            canvas.width - 1,
            Math.round(((x - box.x) * canvas.width) / box.width),
          ),
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
}
