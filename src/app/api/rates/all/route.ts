import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const callerIdCountry = searchParams.get('callerIdCountry');

    let whereClause: any = {};
    if (callerIdCountry) {
      whereClause = { callerIdCountry: callerIdCountry };
    }

    const rates = await prisma.callRate.findMany({
      where: whereClause,
      orderBy: [
        { isActive: 'desc' },
        { callerIdCountry: 'asc' } as any,
        { country: 'asc' }
      ]
    })

    return NextResponse.json(rates)
  } catch (error) {
    console.error('Error fetching rates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { rateId, isActive } = await request.json()

    const updatedRate = await prisma.callRate.update({
      where: { id: rateId },
      data: { 
        isActive,
        updatedAt: new Date()
      }
    })

    return NextResponse.json(updatedRate)
  } catch (error) {
    console.error('Error updating rate:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { rateId } = await request.json()

    await prisma.callRate.delete({
      where: { id: rateId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting rate:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}