import { NextResponse } from "next/server";
import { validateSession } from "@/server/auth/session-service";
import { predictCertificationRisk } from "@/server/intelligence/certification-risk-predictor";

export async function POST(request: Request) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { changeType, materialChange, loadCaseChange, allowableChangePercent, aircraft } = body;

    const riskAnalysis = await predictCertificationRisk({
      changeType: changeType || "Fatigue Allowable Change",
      materialChange: Boolean(materialChange),
      loadCaseChange: Boolean(loadCaseChange),
      allowableChangePercent: Number(allowableChangePercent) || 15,
      aircraft: aircraft || "B787",
    });

    return NextResponse.json({ data: riskAnalysis });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
