import { NextRequest, NextResponse } from 'next/server';
import { challengeAttemptSchema } from '@/validators/progress';
import { recordChallengeAttempt, getChallengeAttempts } from '@/repositories/progress.repository';

const DEFAULT_USER_ID = 'default-user';

/**
 * GET /api/challenges — Get challenge attempts for the user
 * Query params: ?projectSlug=...&chapterSlug=...
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectSlug = searchParams.get('projectSlug') || undefined;
    const chapterSlug = searchParams.get('chapterSlug') || undefined;

    const data = await getChallengeAttempts(DEFAULT_USER_ID, projectSlug, chapterSlug);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in GET /api/challenges:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get challenge attempts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/challenges — Submit a challenge attempt
 * Body: { projectSlug, chapterSlug, challengeSlug, code, passed, xp? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = challengeAttemptSchema.parse(body);
    const xpReward = body.xp ?? 10;

    const result = await recordChallengeAttempt(
      DEFAULT_USER_ID,
      validated.projectSlug,
      validated.chapterSlug,
      validated.challengeSlug,
      validated.code,
      validated.passed,
      xpReward
    );

    return NextResponse.json({
      success: result.success,
      passed: result.passed,
      attempts: result.attempts,
      xpEarned: result.xpEarned,
      newBadges: result.newBadges,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Неверные входные данные', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error in POST /api/challenges:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process challenge attempt' },
      { status: 500 }
    );
  }
}
