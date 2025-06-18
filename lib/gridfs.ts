import { getDatabase } from './mongodb'
import { GridFSBucket, ObjectId } from 'mongodb'

// Criar bucket do GridFS
export async function getGridFSBucket() {
  console.log('🗄️ Conectando ao GridFS...')
  const db = await getDatabase()
  const bucket = new GridFSBucket(db, { bucketName: 'images' })
  console.log('✅ GridFS bucket criado')
  return bucket
}

// Upload de imagem para GridFS
export async function uploadImageToGridFS(
  buffer: Buffer, 
  filename: string, 
  contentType: string
): Promise<{ id: string; filename: string }> {
  console.log('📤 Iniciando upload para GridFS:', { filename, contentType, bufferSize: buffer.length })
  
  try {
    const bucket = await getGridFSBucket()
    
    return new Promise((resolve, reject) => {
      console.log('🔄 Criando upload stream...')
      const uploadStream = bucket.openUploadStream(filename, {
        metadata: { contentType }
      })
      
      uploadStream.on('error', (error) => {
        console.error('❌ Erro no upload stream:', error)
        reject(error)
      })
      
      uploadStream.on('finish', () => {
        console.log('✅ Upload stream finalizado. ID:', uploadStream.id)
        resolve({
          id: uploadStream.id.toString(),
          filename: filename
        })
      })
      
      console.log('📝 Escrevendo buffer no stream...')
      // Escrever o buffer no stream
      uploadStream.write(buffer)
      uploadStream.end()
      console.log('✅ Buffer escrito e stream finalizado')
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
  console.log('📥 Fazendo download do GridFS:', id)
  
  try {
    const bucket = await getGridFSBucket()
    const objectId = new ObjectId(id)
    
    // Buscar metadados do arquivo
    console.log('🔍 Buscando metadados do arquivo...')
    const files = await bucket.find({ _id: objectId }).toArray()
    if (files.length === 0) {
      console.log('❌ Arquivo não encontrado:', id)
      return null
    }
    
    const file = files[0]
    console.log('✅ Arquivo encontrado:', file.filename)
    
    const downloadStream = bucket.openDownloadStream(objectId)
    
    // Converter stream para buffer
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = []
      
      downloadStream.on('data', (chunk: Buffer) => {
        chunks.push(chunk)
      })
      
      downloadStream.on('end', () => {
        console.log('✅ Download concluído')
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
  console.log('🗑️ Deletando do GridFS:', id)
  
  try {
    const bucket = await getGridFSBucket()
    const objectId = new ObjectId(id)
    
    await bucket.delete(objectId)
    console.log('✅ Arquivo deletado com sucesso')
    return true
  } catch (error) {
    console.error('❌ Erro ao deletar do GridFS:', error)
    return false
  }
} 