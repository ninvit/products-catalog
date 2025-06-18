import { NextRequest, NextResponse } from 'next/server'
import { uploadImageToGridFS } from '@/lib/gridfs'

export async function POST(request: NextRequest) {
  console.log('🔍 Upload API chamada')
  
  try {
    console.log('📋 Processando formData...')
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    console.log('📁 Arquivo recebido:', file ? file.name : 'nenhum arquivo')
    
    if (!file) {
      console.log('❌ Nenhum arquivo enviado')
      return NextResponse.json(
        { success: false, error: 'Nenhum arquivo foi enviado' },
        { status: 400 }
      )
    }

    console.log('📊 Verificando tipo de arquivo:', file.type)
    
    // Verificar se é uma imagem
    if (!file.type.startsWith('image/')) {
      console.log('❌ Tipo de arquivo inválido:', file.type)
      return NextResponse.json(
        { success: false, error: 'Apenas arquivos de imagem são permitidos' },
        { status: 400 }
      )
    }

    console.log('📏 Verificando tamanho:', file.size)
    
    // Verificar tamanho do arquivo (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.log('❌ Arquivo muito grande:', file.size)
      return NextResponse.json(
        { success: false, error: 'Arquivo muito grande. Máximo 5MB' },
        { status: 400 }
      )
    }

    try {
      console.log('🔄 Convertendo para buffer...')
      // Converter arquivo para buffer
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      console.log('📝 Criando nome único...')
      // Criar nome único para o arquivo
      const timestamp = Date.now()
      const fileExtension = file.name.split('.').pop() || 'jpg'
      const uniqueFilename = `${timestamp}-${Math.random().toString(36).substring(7)}.${fileExtension}`
      
      console.log('☁️ Fazendo upload para GridFS...')
      // Upload para GridFS
      const result = await uploadImageToGridFS(buffer, uniqueFilename, file.type)
      
      console.log('✅ Upload concluído:', result)
      
      // Gerar URL para acessar a imagem
      const imageUrl = `/api/images/${result.id}`

      return NextResponse.json({
        success: true,
        data: {
          url: imageUrl,
          filename: result.filename,
          id: result.id,
          type: 'gridfs'
        }
      })
    } catch (uploadError) {
      console.error('❌ Erro no upload para GridFS:', uploadError)
      return NextResponse.json(
        { success: false, error: `Erro ao salvar a imagem: ${uploadError}` },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('❌ Erro geral no upload:', error)
    return NextResponse.json(
      { success: false, error: `Erro interno: ${error}` },
      { status: 500 }
    )
  }
} 