import { NextRequest, NextResponse } from 'next/server'
import { downloadImageFromGridFS } from '@/lib/gridfs'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const imageId = params.id
    
    if (!imageId) {
      return NextResponse.json(
        { success: false, error: 'ID da imagem não fornecido' },
        { status: 400 }
      )
    }

    // Buscar imagem no GridFS
    const imageData = await downloadImageFromGridFS(imageId)
    
    if (!imageData) {
      return NextResponse.json(
        { success: false, error: 'Imagem não encontrada' },
        { status: 404 }
      )
    }

    // Retornar imagem com headers corretos
    return new NextResponse(imageData.buffer, {
      status: 200,
      headers: {
        'Content-Type': imageData.contentType,
        'Content-Length': imageData.buffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache por 1 ano
        'Content-Disposition': `inline; filename="${imageData.filename}"`
      }
    })
  } catch (error) {
    console.error('Erro ao servir imagem:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 