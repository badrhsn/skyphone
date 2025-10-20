import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get popular countries with their rates
    // You can modify this query to get actual popular countries based on call volume
    const popularCountries = await prisma.callRate.findMany({
      where: {
        isActive: true,
        countryCode: {
          in: ['+1', '+44', '+91', '+971', '+63', '+234', '+52', '+86', '+81', '+33']
        }
      },
      orderBy: {
        rate: 'asc' // Show cheapest rates first
      },
      take: 8
    });

    // Map country codes to names and flags
    const countryMap: Record<string, { name: string; flag: string }> = {
      '+1': { name: 'United States', flag: '🇺🇸' },
      '+44': { name: 'United Kingdom', flag: '🇬🇧' },
      '+91': { name: 'India', flag: '🇮🇳' },
      '+971': { name: 'UAE', flag: '🇦🇪' },
      '+63': { name: 'Philippines', flag: '🇵🇭' },
      '+234': { name: 'Nigeria', flag: '🇳🇬' },
      '+52': { name: 'Mexico', flag: '🇲🇽' },
      '+86': { name: 'China', flag: '🇨🇳' },
      '+81': { name: 'Japan', flag: '🇯🇵' },
      '+33': { name: 'France', flag: '🇫🇷' }
    };

    const formattedCountries = popularCountries.map(country => ({
      code: country.countryCode,
      name: countryMap[country.countryCode]?.name || country.country,
      flag: countryMap[country.countryCode]?.flag || '🌍',
      rate: country.rate,
      formattedRate: `from $${country.rate.toFixed(3)}/min`,
      currency: country.currency
    }));

    // If we don't have enough countries, add some defaults
    const defaultCountries = [
      { code: '+1', name: 'United States', flag: '🇺🇸', rate: 0.01, formattedRate: 'from $0.010/min', currency: 'USD' },
      { code: '+44', name: 'United Kingdom', flag: '🇬🇧', rate: 0.02, formattedRate: 'from $0.020/min', currency: 'USD' },
      { code: '+91', name: 'India', flag: '🇮🇳', rate: 0.01, formattedRate: 'from $0.010/min', currency: 'USD' },
      { code: '+971', name: 'UAE', flag: '🇦🇪', rate: 0.03, formattedRate: 'from $0.030/min', currency: 'USD' },
      { code: '+63', name: 'Philippines', flag: '🇵🇭', rate: 0.02, formattedRate: 'from $0.020/min', currency: 'USD' }
    ];

    const result = formattedCountries.length >= 5 ? formattedCountries : defaultCountries;

    return NextResponse.json({
      success: true,
      data: result.slice(0, 5) // Return top 5 popular countries
    });
  } catch (error) {
    console.error("Error fetching popular countries:", error);
    
    // Return fallback data
    return NextResponse.json({
      success: false,
      data: [
        { code: '+1', name: 'United States', flag: '🇺🇸', rate: 0.01, formattedRate: 'from $0.010/min', currency: 'USD' },
        { code: '+44', name: 'United Kingdom', flag: '🇬🇧', rate: 0.02, formattedRate: 'from $0.020/min', currency: 'USD' },
        { code: '+91', name: 'India', flag: '🇮🇳', rate: 0.01, formattedRate: 'from $0.010/min', currency: 'USD' },
        { code: '+971', name: 'UAE', flag: '🇦🇪', rate: 0.03, formattedRate: 'from $0.030/min', currency: 'USD' },
        { code: '+63', name: 'Philippines', flag: '🇵🇭', rate: 0.02, formattedRate: 'from $0.020/min', currency: 'USD' }
      ]
    });
  }
}