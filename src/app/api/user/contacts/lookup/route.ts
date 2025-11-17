import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

/**
 * Contact Lookup API
 * Auto-detect and fetch contact info when calling a number
 */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const phoneNumber = request.nextUrl.searchParams.get("phone");

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number required" },
        { status: 400 }
      );
    }

    // Find contact by phone number
    const contact = await prisma.contact.findFirst({
      where: {
        userId: session.user.id,
        phoneNumber: phoneNumber,
      },
    });

    if (contact) {
      return NextResponse.json({
        success: true,
        found: true,
        contact: {
          id: contact.id,
          name: contact.name,
          phoneNumber: contact.phoneNumber,
          email: contact.email,
          country: contact.country,
          notes: contact.notes,
          lastCalledAt: contact.updatedAt,
        },
      });
    }

    return NextResponse.json({
      success: true,
      found: false,
      message: "Contact not found for this number",
    });
  } catch (error) {
    console.error("❌ [Contact Lookup] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST - Update contact last_called_at
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { phoneNumber, contactId } = body;

    if (!phoneNumber && !contactId) {
      return NextResponse.json(
        { error: "Either phoneNumber or contactId is required" },
        { status: 400 }
      );
    }

    let contact;

    if (contactId) {
      // Update by ID
      contact = await prisma.contact.update({
        where: { id: contactId },
        data: { updatedAt: new Date() },
      });
    } else {
      // Update by phone number
      contact = await prisma.contact.findFirst({
        where: {
          userId: session.user.id,
          phoneNumber,
        },
      });

      if (contact) {
        contact = await prisma.contact.update({
          where: { id: contact.id },
          data: { updatedAt: new Date() },
        });
      }
    }

    if (!contact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      contact: {
        id: contact.id,
        name: contact.name,
        phoneNumber: contact.phoneNumber,
        lastCalledAt: contact.updatedAt,
      },
    });
  } catch (error) {
    console.error("❌ [Contact Update] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
