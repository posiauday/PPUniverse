import { prisma } from "@ppu/db";
import { NextResponse } from "next/server";
import { errorMonitoring } from "../../../lib/error-monitoring";

/**
 * Unauthenticated on purpose (load balancers/uptime monitors call this,
 * not a signed-in user) and deliberately NOT wrapped in withObservability's
 * full request-start/request-end logging — this endpoint gets polled
 * frequently and a log line per poll would drown out logs that actually
 * matter. Errors still go to error monitoring since a failing health check
 * is worth knowing about, just not worth a routine log line either way.
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", checks: { database: "ok" } });
  } catch (error) {
    errorMonitoring.captureException(error, { route: "GET /api/health" });
    return NextResponse.json({ status: "error", checks: { database: "error" } }, { status: 503 });
  }
}
