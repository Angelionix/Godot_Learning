import { NextResponse } from "next/server";
import { getProgressForUser, markChapterComplete } from "@/repositories/progress.repository";

const DEFAULT_USER_ID = "default-user";

export async function GET() {
  try {
    const progress = await getProgressForUser(DEFAULT_USER_ID);
    return NextResponse.json(progress);
  } catch (error) {
    console.error("Error fetching progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectSlug, chapterSlug } = body;

    if (!projectSlug || !chapterSlug) {
      return NextResponse.json(
        { error: "projectSlug and chapterSlug are required" },
        { status: 400 }
      );
    }

    const result = await markChapterComplete(projectSlug, chapterSlug, DEFAULT_USER_ID);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error marking chapter complete:", error);
    return NextResponse.json(
      { error: "Failed to mark chapter complete" },
      { status: 500 }
    );
  }
}
