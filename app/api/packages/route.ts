import { NextResponse } from 'next/server';
import { getPublicPackages } from '@/lib/pricing-source';
export async function GET(){ return NextResponse.json({ packages: await getPublicPackages(), source:'unified-pricing' }); }
