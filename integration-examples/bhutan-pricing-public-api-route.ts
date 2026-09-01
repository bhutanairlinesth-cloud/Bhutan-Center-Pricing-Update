/**
 * COPY/ADAPT THIS INSIDE THE EXISTING BHUTAN PRICING PROJECT.
 * This is an integration contract example, not a drop-in route because the
 * exact existing Supabase table/column names were not available in this task.
 */
import { NextResponse } from "next/server";

export async function GET() {
  // 1) Authenticate server-to-server request if you choose to use an API key.
  // 2) Query existing Tour Programs + Retail price calculation.
  // 3) Map ONLY public-safe fields below.
  // 4) Never return costs, margins, Agent price, internal notes or invoice data.

  const packages = [
    {
      id: "program-id-from-db",
      slug: "wonders-of-bhutan",
      name: "Wonders of Bhutan",
      duration: "5 Days / 4 Nights",
      priceFrom: 66500,
      isActive: true,
    },
  ];

  return NextResponse.json({ packages });
}
