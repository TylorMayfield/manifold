import { NextRequest, NextResponse } from "next/server";

// Dynamic import to avoid server-side code during build
async function getLogger() {
  const { logger } = await import("../../../lib/server/utils/logger");
  return logger;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get("level");
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "100");

    const logger = await getLogger();
    let logs = logger.getLogs();

    // Filter by level if specified
    if (level && level !== "all") {
      logs = logs.filter((log) => log.level === level);
    }

    // Filter by category if specified
    if (category && category !== "all") {
      logs = logs.filter((log) => log.category === category);
    }

    // Apply limit
    logs = logs.slice(0, limit);

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Error fetching logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const logger = await getLogger();
    logger.clearLogs();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error clearing logs:", error);
    return NextResponse.json(
      { error: "Failed to clear logs" },
      { status: 500 }
    );
  }
}
