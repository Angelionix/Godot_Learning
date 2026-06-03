"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { SKILL_AXES } from "@/lib/gamification";
import type { UserProgressSummary } from "@/repositories/progress.repository";

interface SkillRadarProps {
  data: UserProgressSummary;
  className?: string;
}

/**
 * Radar chart showing skill proficiency across 6 axes.
 * Each axis represents a skill domain, scored 0-100 based on project completion.
 */
export function SkillRadar({ data, className }: SkillRadarProps) {
  const radarData = SKILL_AXES.map((axis) => {
    // Calculate skill score based on completed chapters in related projects
    let totalChapters = 0;
    let completedChapters = 0;

    for (const proj of data.projectProgress) {
      if (axis.projects.includes(proj.projectSlug)) {
        totalChapters += proj.totalChapters;
        completedChapters += proj.completedChapters;
      }
    }

    const score = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

    return {
      skill: axis.label,
      score,
      fullMark: 100,
    };
  });

  const hasAnyActivity = radarData.some((d) => d.score > 0);

  return (
    <div className={className}>
      <div className="w-full h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid
              stroke="hsl(var(--border))"
              strokeDasharray="3 3"
            />
            <PolarAngleAxis
              dataKey="skill"
              tick={{
                fontSize: 10,
                fill: "hsl(var(--muted-foreground))",
              }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={false}
              axisLine={false}
            />
            <Radar
              name="Навыки"
              dataKey="score"
              stroke="#478CBF"
              fill="#478CBF"
              fillOpacity={hasAnyActivity ? 0.25 : 0.05}
              strokeWidth={2}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value: number) => [`${value}%`, "Прогресс"]}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
