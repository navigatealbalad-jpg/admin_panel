/**
 * GLB Sign Generator for Navigate Al-Balad
 * 
 * Generates an AR Information Panel GLB model.
 * The panel features a modern design floating in AR space.
 * It displays only the Arabic Name and Description.
 */

const CATEGORY_COLORS_HEX: Record<string, [string, string]> = {
    historical: ['#DAA520', '#B8860B'],
    mosque: ['#2E8B57', '#006400'],
    museum: ['#4169E1', '#00008B'],
    market: ['#D2691E', '#8B4513'],
    gate: ['#800080', '#4B0082'],
    square: ['#00CED1', '#008B8B'],
    other: ['#808080', '#404040'],
}

interface SignGlbOptions {
    nameEn: string
    nameAr: string
    descriptionEn?: string
    descriptionAr?: string
    category?: string
    landmarkId?: string
    elevation?: number // New: Height off ground in meters
}

async function generateSignTexture(options: SignGlbOptions): Promise<Uint8Array> {
    const { nameAr, descriptionAr = '', category = 'other' } = options
    const width = 512
    const height = 512
    const [color1, color2] = CATEGORY_COLORS_HEX[category] || CATEGORY_COLORS_HEX.other

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas context not supported')

    // BG Gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, color1)
    gradient.addColorStop(1, color2)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    // Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 15
    ctx.strokeRect(7, 7, width - 14, height - 14)

    // Content Box
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
    ctx.fillRect(20, 20, width - 40, height - 40)

    // Text Setup
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillStyle = '#FFFFFF'

    // Title (Arabic)
    ctx.font = 'bold 50px Arial'
    ctx.shadowColor = 'rgba(0,0,0,0.5)'
    ctx.shadowBlur = 4
    ctx.fillText(nameAr, width / 2, 50)

    // Divider
    ctx.shadowBlur = 0
    ctx.beginPath()
    ctx.moveTo(60, 110)
    ctx.lineTo(width - 60, 110)
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 2
    ctx.stroke()

    // Description (Arabic Multi-line)
    ctx.font = '24px Arial'
    const maxWidth = width - 80
    const lineHeight = 35
    const words = descriptionAr.split(' ')
    let line = ''
    let y = 140

    ctx.direction = 'rtl'
    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' '
        const metrics = ctx.measureText(testLine)
        if (metrics.width > maxWidth && n > 0) {
            ctx.fillText(line, width / 2, y)
            line = words[n] + ' '
            y += lineHeight
        } else {
            line = testLine
        }
    }
    ctx.fillText(line, width / 2, y)

    // Category
    ctx.direction = 'ltr'
    ctx.font = 'italic 18px Arial'
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.textBaseline = 'bottom'
    ctx.fillText(category.toUpperCase(), width / 2, height - 30)

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            if (blob) blob.arrayBuffer().then(buf => resolve(new Uint8Array(buf)))
            else resolve(new Uint8Array(0))
        }, 'image/png')
    })
}

function toFloat32Array(arr: number[][]): Float32Array {
    const count = arr.reduce((acc, val) => acc + val.length, 0)
    const out = new Float32Array(count)
    let offset = 0
    for (const v of arr) {
        out.set(v, offset)
        offset += v.length
    }
    return out
}

export async function createSignGlb(options: SignGlbOptions): Promise<ArrayBuffer> {
    const {
        nameEn, nameAr, descriptionEn = '', descriptionAr = '',
        category = 'other', landmarkId = '', elevation = 1.6
    } = options

    // 1. Texture
    const imagePngBuffer = await generateSignTexture(options)
    if (imagePngBuffer.length === 0) throw new Error('Texture generation failed')

    // 2. Geometry
    const positions: number[][] = []
    const normals: number[][] = []
    const uvs: number[][] = []
    const indices: number[] = []

    const hw = 0.5, hh = 0.5, d = 0.03
    const by = elevation // Use custom elevation (Y position)

    const addFace = (v: number[][], n: number[], map: boolean) => {
        const base = positions.length
        positions.push(...v)
        normals.push(n, n, n, n)
        if (map) uvs.push([0, 0], [1, 0], [1, 1], [0, 1])
        else uvs.push([0, 0], [0, 0], [0, 0], [0, 0])
        indices.push(base, base + 2, base + 1, base, base + 3, base + 2)
    }

    addFace([[-hw, by + hh, d], [hw, by + hh, d], [hw, by - hh, d], [-hw, by - hh, d]], [0, 0, 1], true) // Front
    addFace([[-hw, by + hh, -d], [hw, by + hh, -d], [hw, by - hh, -d], [-hw, by - hh, -d]], [0, 0, -1], false) // Back
    addFace([[-hw, by + hh, -d], [hw, by + hh, -d], [hw, by + hh, d], [-hw, by + hh, d]], [0, 1, 0], false) // Top
    addFace([[-hw, by - hh, d], [hw, by - hh, d], [hw, by - hh, -d], [-hw, by - hh, -d]], [0, -1, 0], false) // Bottom
    addFace([[-hw, by + hh, -d], [-hw, by + hh, d], [-hw, by - hh, d], [-hw, by - hh, -d]], [-1, 0, 0], false) // Left
    addFace([[hw, by + hh, d], [hw, by + hh, -d], [hw, by - hh, -d], [hw, by - hh, d]], [1, 0, 0], false) // Right

    // 3. Buffers
    const posFlat = toFloat32Array(positions)
    const norFlat = toFloat32Array(normals)
    const uvFlat = toFloat32Array(uvs)
    const idxArr = new Uint16Array(indices)

    const pad4 = (b: Uint8Array) => {
        const p = (4 - (b.byteLength % 4)) % 4
        if (!p) return b
        const n = new Uint8Array(b.byteLength + p)
        n.set(b)
        return n
    }

    const posBytes = pad4(new Uint8Array(posFlat.buffer))
    const norBytes = pad4(new Uint8Array(norFlat.buffer))
    const uvBytes = pad4(new Uint8Array(uvFlat.buffer))
    const idxBytes = pad4(new Uint8Array(idxArr.buffer))
    const imgBytes = pad4(new Uint8Array(imagePngBuffer))

    const buffers = [posBytes, norBytes, uvBytes, idxBytes, imgBytes]

    // Calculate offsets
    const bufferViews: any[] = []
    let binOffset = 0
    buffers.forEach((b, i) => {
        bufferViews.push({
            buffer: 0,
            byteOffset: binOffset,
            byteLength: b.byteLength,
            ...(i < 4 ? { target: (i === 3 ? 34963 : 34962) } : {})
        })
        binOffset += b.byteLength
    })

    const imageBV = bufferViews.length - 1
    const totalBinLength = binOffset

    // 4. Accessors
    const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity]
    for (let i = 0; i < posFlat.length; i += 3) {
        min[0] = Math.min(min[0], posFlat[i])
        min[1] = Math.min(min[1], posFlat[i + 1])
        min[2] = Math.min(min[2], posFlat[i + 2])
        max[0] = Math.max(max[0], posFlat[i])
        max[1] = Math.max(max[1], posFlat[i + 1])
        max[2] = Math.max(max[2], posFlat[i + 2])
    }

    // 5. GLTF JSON
    const gltf = {
        asset: { version: '2.0' },
        scene: 0,
        scenes: [{ nodes: [0] }],
        nodes: [{
            mesh: 0,
            name: 'InfoPanel',
            extras: { landmark_id: landmarkId, name_en: nameEn, name_ar: nameAr, category }
        }],
        meshes: [{
            primitives: [{
                attributes: { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 },
                indices: 3,
                material: 0
            }]
        }],
        materials: [{
            pbrMetallicRoughness: { baseColorTexture: { index: 0 }, metallicFactor: 0.1, roughnessFactor: 0.5 },
            doubleSided: true
        }],
        textures: [{ source: 0 }],
        images: [{ bufferView: imageBV, mimeType: 'image/png' }],
        accessors: [
            { bufferView: 0, componentType: 5126, count: positions.length, type: 'VEC3', min, max },
            { bufferView: 1, componentType: 5126, count: positions.length, type: 'VEC3' },
            { bufferView: 2, componentType: 5126, count: positions.length, type: 'VEC2' },
            { bufferView: 3, componentType: 5123, count: indices.length, type: 'SCALAR' }
        ],
        bufferViews,
        buffers: [{ byteLength: totalBinLength }]
    }

    // 6. Assembly with Correct JSON Padding
    const rawJson = new TextEncoder().encode(JSON.stringify(gltf))
    const jsonPadding = (4 - (rawJson.byteLength % 4)) % 4
    const jsonPaddedLength = rawJson.byteLength + jsonPadding

    // Create correct-sized buffer for JSON
    const jsonChunkData = new Uint8Array(jsonPaddedLength)
    jsonChunkData.set(rawJson)
    for (let i = rawJson.length; i < jsonPaddedLength; i++) jsonChunkData[i] = 0x20 // Space padding

    const fileLength = 12 + 8 + jsonPaddedLength + 8 + totalBinLength
    const glb = new ArrayBuffer(fileLength)
    const view = new DataView(glb)
    const bin = new Uint8Array(glb)

    let o = 0
    // Header
    view.setUint32(o, 0x46546C67, true); o += 4
    view.setUint32(o, 2, true); o += 4
    view.setUint32(o, fileLength, true); o += 4

    // JSON Chunk
    view.setUint32(o, jsonPaddedLength, true); o += 4
    view.setUint32(o, 0x4E4F534A, true); o += 4
    bin.set(jsonChunkData, o); o += jsonPaddedLength

    // BIN Chunk
    view.setUint32(o, totalBinLength, true); o += 4
    view.setUint32(o, 0x004E4942, true); o += 4

    // Payload
    buffers.forEach(b => {
        bin.set(b, o)
        o += b.byteLength
    })

    return glb
}

export async function uploadGlbToStorage(supabase: any, glbBuffer: ArrayBuffer, filename: string): Promise<string | null> {
    const blob = new Blob([glbBuffer], { type: 'model/gltf-binary' })
    const { error } = await supabase.storage.from('landmark-models').upload(filename, blob, { contentType: 'model/gltf-binary', upsert: true })
    if (error) { console.error(error); return null }
    return supabase.storage.from('landmark-models').getPublicUrl(filename).data.publicUrl
}

export async function saveLandmarkModel(supabase: any, landmarkId: string, modelUrl: string): Promise<boolean> {
    await supabase.from('landmark_media').delete().eq('landmark_id', landmarkId).eq('media_type', '3d_model')
    const { error } = await supabase.from('landmark_media').insert({ landmark_id: landmarkId, media_type: '3d_model', url: modelUrl, caption_ar: 'لوحة', is_primary: true })
    return !error
}
