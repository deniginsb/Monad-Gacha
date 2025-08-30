import { NextResponse } from "next/server";
import { getRevealList } from "../seed/route";

export async function GET() {
  return NextResponse.json(getRevealList());
}

