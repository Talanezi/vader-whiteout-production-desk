import wasmUrl from './whiteout_studio_engine.wasm?url'
export const VECTORCRAFT_REVISION = '639c9d6ce989dd638ba3488cc26e36d907022bcb'
export type Geometry = {
  path: string
  bounds: [number, number, number, number]
  fill: boolean
  engine: string
}
export type EngineRequest = {
  op: string
  points?: number[][]
  width?: number
  path?: string
  matrix?: number[]
}
type Kernel = {
  memory: WebAssembly.Memory
  reserve_input: (length: number) => number
  run: () => number
  output_ptr: () => number
  output_len: () => number
}
export type StudioEngine = { geometry: (request: EngineRequest) => Geometry }
let loading: Promise<StudioEngine> | undefined
export function loadStudioEngine(): Promise<StudioEngine> {
  if (!loading)
    loading = (async () => {
      const response = await fetch(wasmUrl)
      if (!response.ok)
        throw Error(
          'The drawing engine could not be loaded. Retry when connected.',
        )
      const { instance } = await WebAssembly.instantiate(
        await response.arrayBuffer(),
        {},
      )
      const kernel = instance.exports as unknown as Kernel
      return {
        geometry(request: EngineRequest) {
          const input = new TextEncoder().encode(JSON.stringify(request))
          if (input.length > 1_000_000)
            throw Error('This drawing operation is too large.')
          const ptr = kernel.reserve_input(input.length)
          if (!ptr)
            throw Error('The drawing engine could not allocate this operation.')
          new Uint8Array(kernel.memory.buffer, ptr, input.length).set(input)
          const success = kernel.run()
          const result = JSON.parse(
            new TextDecoder().decode(
              new Uint8Array(
                kernel.memory.buffer,
                kernel.output_ptr(),
                kernel.output_len(),
              ),
            ),
          )
          if (!success) throw Error(result.error || 'Drawing operation failed.')
          return result as Geometry
        },
      }
    })().catch((error) => {
      loading = undefined
      throw error
    })
  return loading
}
