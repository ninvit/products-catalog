import { NextRequest, NextResponse } from 'next/server'
import { uploadImageToGridFS } from '@/lib/gridfs'
import { verifyAdminAccess } from '@/lib/admin-middleware'

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await verifyAdminAccess(request)
    if (authResult.error) {
      return authResult.error
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Nenhum arquivo foi enviado' },
        { status: 400 }
      )
    }

    // Verificar se é uma imagem
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'Apenas arquivos de imagem são permitidos' },
        { status: 400 }
      )
    }

    // Verificar tamanho do arquivo (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Arquivo muito grande. Máximo 5MB' },
        { status: 400 }
      )
    }

    try {
      // Converter arquivo para buffer
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      // Criar nome único para o arquivo
      const timestamp = Date.now()
      const fileExtension = file.name.split('.').pop() || 'jpg'
      const uniqueFilename = `${timestamp}-${Math.random().toString(36).substring(7)}.${fileExtension}`
      
      // Upload para GridFS
      const result = await uploadImageToGridFS(buffer, uniqueFilename, file.type)
      
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