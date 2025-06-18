import { getDatabase } from './mongodb'
import { GridFSBucket, ObjectId } from 'mongodb'

// Criar bucket do GridFS
export async function getGridFSBucket() {
  const db = await getDatabase()
  const bucket = new GridFSBucket(db, { bucketName: 'images' })
  return bucket
}

// Upload de imagem para GridFS
export async function uploadImageToGridFS(
  buffer: Buffer, 
  filename: string, 
  contentType: string
): Promise<{ id: string; filename: string }> {
  try {
    const bucket = await getGridFSBucket()
    
    return new Promise((resolve, reject) => {
      const uploadStream = bucket.openUploadStream(filename, {
        metadata: { contentType }
      })
      
      uploadStream.on('error', (error) => {
        console.error('❌ Erro no upload stream:', error)
        reject(error)
      })
      
      uploadStream.on('finish', () => {
        resolve({
          id: uploadStream.id.toString(),
          filename: filename
        })
      })
      
      // Escrever o buffer no stream
      uploadStream.write(buffer)
      uploadStream.end()
    })
  } catch (error) {
    console.error('❌ Erro ao fazer upload para GridFS:', error)
    throw new Error(`Erro no upload: ${error}`)
  }
}

// Download de imagem do GridFS
export async function downloadImageFromGridFS(id: string): Promise<{
  buffer: Buffer;
  contentType: string;
  filename: string;
} | null> {
  try {
    const bucket = await getGridFSBucket()
    const objectId = new ObjectId(id)
    
    // Buscar metadados do arquivo
    const files = await bucket.find({ _id: objectId }).toArray()
    if (files.length === 0) {
      return null
    }
    
    const file = files[0]
    
    const downloadStream = bucket.openDownloadStream(objectId)
    
    // Converter stream para buffer
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = []
      
      downloadStream.on('data', (chunk: Buffer) => {
        chunks.push(chunk)
      })
      
      downloadStream.on('end', () => {
        const buffer = Buffer.concat(chunks)
        resolve({
          buffer,
          contentType: file.metadata?.contentType || 'image/jpeg',
          filename: file.filename
        })
      })
      
      downloadStream.on('error', (error) => {
        console.error('❌ Erro no download stream:', error)
        reject(error)
      })
    })
  } catch (error) {
    console.error('❌ Erro ao fazer download do GridFS:', error)
    return null
  }
}

// Deletar imagem do GridFS
export async function deleteImageFromGridFS(id: string): Promise<boolean> {
  try {
    const bucket = await getGridFSBucket()
    const objectId = new ObjectId(id)
    
    await bucket.delete(objectId)
    return true
  } catch (error) {
    console.error('❌ Erro ao deletar do GridFS:', error)
    return false
  }
} 