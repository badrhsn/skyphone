import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export async function GET() {
  return NextResponse.json({
    hasSecret: !!authOptions.secret,
    secretLength: authOptions.secret?.length || 0,
    debug: authOptions.debug,
    providersCount: authOptions.providers?.length || 0,
    providers: authOptions.providers?.map(p => ({
      id: p.id,
      name: p.name,
      type: p.type,
    })),
    hasSessionCallback: !!authOptions.callbacks?.session,
    hasJwtCallback: !!authOptions.callbacks?.jwt,
    hasSignInCallback: !!authOptions.callbacks?.signIn,
    sessionStrategy: authOptions.session?.strategy,
    signInPage: authOptions.pages?.signIn,
    timestamp: new Date().toISOString(),
  });
}
