import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const searchParams = request.nextUrl.searchParams;
    const contactId = searchParams.get("c"); // Expected format: ?c=contact_id
    
    // 1. Find the link
    const link = await db.link.findUnique({
      where: { slug },
    });

    if (!link) {
      return new NextResponse("Link not found", { status: 404 });
    }

    // 2. Log the click (async, fire and forget)
    // We don't await this to speed up the redirect
    db.click.create({
      data: {
        linkId: link.id,
        contactId: contactId,
        ip: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    }).then(() => {
      // Optional: Increment campaign click count if needed, 
      // but we can just count clicks relations
      if (link.campaignId) {
        db.campaign.update({
          where: { id: link.campaignId },
          data: { clickedCount: { increment: 1 } }
        }).catch(err => console.error("Failed to update click count", err));
      }
    }).catch(err => console.error("Failed to log click", err));

    // 3. Redirect to original URL
    return NextResponse.redirect(link.originalUrl);
    
  } catch (error) {
    console.error("Link redirect error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
