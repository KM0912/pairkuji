'use client';

import { useState, useMemo } from 'react';
import type { Member } from '@/types/member';
import type { SessionWinRate } from '@/lib/statsCalculator';
import { getDisplayName } from '@/lib/utils';

interface WinRateTrendChartProps {
  memberMap: Map<number, Member>;
  sessionWinRates: SessionWinRate[];
}

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const SVG_WIDTH = 320;
const SVG_HEIGHT = 180;
const PADDING = { top: 20, right: 16, bottom: 28, left: 36 };
const CHART_WIDTH = SVG_WIDTH - PADDING.left - PADDING.right;
const CHART_HEIGHT = SVG_HEIGHT - PADDING.top - PADDING.bottom;

export function WinRateTrendChart({
  memberMap,
  sessionWinRates,
}: WinRateTrendChartProps) {
  // 全プレイヤーIDを抽出
  const allPlayerIds = useMemo(() => {
    const ids = new Set<number>();
    for (const session of sessionWinRates) {
      Array.from(session.playerRates.keys()).forEach((id) => {
        ids.add(id);
      });
    }
    return Array.from(ids).sort((a, b) => a - b);
  }, [sessionWinRates]);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    () => new Set(allPlayerIds.slice(0, 5))
  );

  if (sessionWinRates.length === 0) {
    return (
      <div className="text-caption text-muted-foreground">
        勝率推移を表示するには2回以上のセッションが必要です。
      </div>
    );
  }

  const togglePlayer = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const sessionCount = sessionWinRates.length;
  const xStep = sessionCount > 1 ? CHART_WIDTH / (sessionCount - 1) : CHART_WIDTH / 2;

  // Y軸のグリッドライン（0%, 25%, 50%, 75%, 100%）
  const yGridLines = [0, 25, 50, 75, 100];

  return (
    <div className="space-y-4">
      <div className="text-small text-muted-foreground">
        セッションごとの勝率推移
      </div>

      {/* SVGグラフ */}
      <div className="bg-card rounded-lg border border-border p-2 overflow-x-auto">
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="w-full h-auto max-h-[220px]"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Y軸グリッド */}
          {yGridLines.map((val) => {
            const y = PADDING.top + CHART_HEIGHT - (val / 100) * CHART_HEIGHT;
            return (
              <g key={val}>
                <line
                  x1={PADDING.left}
                  y1={y}
                  x2={PADDING.left + CHART_WIDTH}
                  y2={y}
                  stroke="hsl(var(--border))"
                  strokeWidth={0.5}
                  strokeDasharray={val === 0 || val === 100 ? '' : '2,2'}
                />
                <text
                  x={PADDING.left - 4}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fill="hsl(var(--muted-foreground))"
                  fontSize={9}
                >
                  {val}%
                </text>
              </g>
            );
          })}

          {/* X軸ラベル */}
          {sessionWinRates.map((session, i) => {
            const x =
              sessionCount > 1
                ? PADDING.left + i * xStep
                : PADDING.left + CHART_WIDTH / 2;
            return (
              <text
                key={i}
                x={x}
                y={SVG_HEIGHT - 6}
                textAnchor="middle"
                fill="hsl(var(--muted-foreground))"
                fontSize={9}
              >
                #{session.sessionIndex}
              </text>
            );
          })}

          {/* 各プレイヤーの折れ線 */}
          {allPlayerIds
            .filter((id) => selectedIds.has(id))
            .map((playerId, colorIdx) => {
              const color = CHART_COLORS[colorIdx % CHART_COLORS.length]!;
              const points: Array<{ x: number; y: number }> = [];

              for (let i = 0; i < sessionWinRates.length; i++) {
                const rate = sessionWinRates[i]!.playerRates.get(playerId);
                if (rate == null) continue;

                const x =
                  sessionCount > 1
                    ? PADDING.left + i * xStep
                    : PADDING.left + CHART_WIDTH / 2;
                const y =
                  PADDING.top + CHART_HEIGHT - rate * CHART_HEIGHT;
                points.push({ x, y });
              }

              if (points.length === 0) return null;

              const polylinePoints = points
                .map((p) => `${p.x},${p.y}`)
                .join(' ');

              return (
                <g key={playerId}>
                  <polyline
                    points={polylinePoints}
                    fill="none"
                    stroke={color}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {points.map((p, j) => (
                    <circle
                      key={j}
                      cx={p.x}
                      cy={p.y}
                      r={3}
                      fill={color}
                    />
                  ))}
                </g>
              );
            })}
        </svg>
      </div>

      {/* プレイヤー選択チップ */}
      <div className="flex flex-wrap gap-1.5">
        {allPlayerIds.map((id, i) => {
          const name = getDisplayName(memberMap, id);
          const isSelected = selectedIds.has(id);
          const color = isSelected
            ? CHART_COLORS[
                allPlayerIds
                  .filter((pid) => selectedIds.has(pid))
                  .indexOf(id) % CHART_COLORS.length
              ]
            : undefined;

          return (
            <button
              key={id}
              onClick={() => togglePlayer(id)}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-fast ${
                isSelected
                  ? 'bg-primary/10 text-foreground border border-primary/30'
                  : 'bg-muted text-muted-foreground border border-border'
              }`}
            >
              {isSelected && color && (
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
              )}
              {name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
