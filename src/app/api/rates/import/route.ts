import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'Please upload a CSV file' }, { status: 400 })
    }

    const content = await file.text()
    const lines = content.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV file must have at least a header and one data row' }, { status: 400 })
    }

    // Parse CSV
    const header = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase())
    const dataLines = lines.slice(1)

    console.log('CSV Header:', header)

    // Find column indices - be flexible with column names
    const getColumnIndex = (possibleNames: string[]) => {
      for (const name of possibleNames) {
        const index = header.findIndex(h => h.includes(name))
        if (index !== -1) return index
      }
      return -1
    }

    const countryIndex = getColumnIndex(['country', 'destination', 'region'])
    const codeIndex = getColumnIndex(['code', 'prefix', 'dial_code', 'country_code'])
    const rateIndex = getColumnIndex(['rate', 'price', 'cost', 'per_minute'])
    const currencyIndex = getColumnIndex(['currency', 'curr'])

    console.log('Column indices:', { countryIndex, codeIndex, rateIndex, currencyIndex })

    if (countryIndex === -1 || codeIndex === -1 || rateIndex === -1) {
      return NextResponse.json({ 
        error: 'CSV must contain columns for country, country code, and rate. Found columns: ' + header.join(', ')
      }, { status: 400 })
    }

    let imported = 0
    let errors = []

    for (let i = 0; i < dataLines.length; i++) {
      try {
        const line = dataLines[i]
        if (!line.trim()) continue

        // Parse CSV line (handle quoted fields)
        const columns = []
        let current = ''
        let inQuotes = false
        
        for (let j = 0; j < line.length; j++) {
          const char = line[j]
          if (char === '"') {
            inQuotes = !inQuotes
          } else if (char === ',' && !inQuotes) {
            columns.push(current.trim())
            current = ''
          } else {
            current += char
          }
        }
        columns.push(current.trim()) // Add the last column

        if (columns.length <= Math.max(countryIndex, codeIndex, rateIndex)) {
          errors.push(`Row ${i + 2}: Not enough columns`)
          continue
        }

        const country = columns[countryIndex]?.replace(/"/g, '').trim()
        const countryCode = columns[codeIndex]?.replace(/"/g, '').trim()
        const rateStr = columns[rateIndex]?.replace(/"/g, '').trim()
        const currency = currencyIndex !== -1 ? columns[currencyIndex]?.replace(/"/g, '').trim() || 'USD' : 'USD'

        if (!country || !countryCode || !rateStr) {
          errors.push(`Row ${i + 2}: Missing required data`)
          continue
        }

        const rate = parseFloat(rateStr)
        if (isNaN(rate) || rate < 0) {
          errors.push(`Row ${i + 2}: Invalid rate: ${rateStr}`)
          continue
        }

        // Create or update rate
        // Use composite unique key (countryCode + callerIdCountry)
        await prisma.callRate.upsert({
          where: {
            countryCode_callerIdCountry: {
              countryCode,
              callerIdCountry: countryCode,
            }
          },
          update: {
            country,
            rate,
            currency,
            updatedAt: new Date()
          },
          create: {
            country,
            countryCode,
            callerIdCountry: countryCode,
            rate,
            currency,
            isActive: true
          }
        })

        imported++
      } catch (error) {
        errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    console.log(`Import complete: ${imported} rates imported, ${errors.length} errors`)

    return NextResponse.json({
      imported,
      errors: errors.length > 0 ? errors.slice(0, 10) : [], // Return first 10 errors
      message: `Successfully imported ${imported} rates${errors.length > 0 ? ` with ${errors.length} errors` : ''}`
    })

  } catch (error) {
    console.error('Error importing CSV:', error)
    return NextResponse.json({ 
      error: 'Failed to process CSV file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}