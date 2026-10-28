'use client';

import { useEffect, useState, useMemo } from 'react';
import type { Member } from '@/types/member';
import type { SessionWinRate } from '@/lib/statsCalculator';
import { getDisplayName } from '@/lib/utils';

interface WinRateTrendChartProps {
  memberMap: Map<number, Member>;
  sessionWinRates: SessionWinRate[];
}

const MAX_TREND_PLAYERS = 5;

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const LINE_STYLES: Array<{ dash?: string; marker: 'circle' | 'square' | 'triangle' | 'diamond' | 'bar' }> = [
  { marker: 'circle' },
  { dash: '7 4', marker: 'square' },
  { dash: '2 3', marker: 'triangle' },
  { dash: '8 3 2 3', marker: 'diamond' },
  { dash: '1 3', marker: 'bar' },
];

const SVG_WIDTH = 320;
const SVG_HEIGHT = 180;
const PADDING = { top: 20, right: 64, bottom: 28, left: 36 };
const CHART_WIDTH = SVG_WIDTH - PADDING.left - PADDING.right;
const CHART_HEIGHT = SVG_HEIGHT - PADDING.top - PADDING.bottom;

function shortName(name: string): string {
  return name.length > 6 ? `${name.slice(0, 5)}…` : name;
}

const LABEL_MIN_Y = PADDING.top + 6;
const LABEL_MAX_Y = PADDING.top + CHART_HEIGHT - 6;

function spreadEndLabels<T extends { x: number; y: number }>(labels: T[]): T[] {
  const sorted = [...labels].sort((a, b) => a.y - b.y);
  const placed: number[] = [];
  for (const label of sorted) {
    let y = Math.min(Math.max(label.y, LABEL_MIN_Y), LABEL_MAX_Y);
    const previous = placed[placed.length - 1];
    if (previous != null && y < previous + 11) y = previous + 11;
    if (y > LABEL_MAX_Y) {
      const overflow = y - LABEL_MAX_Y;
      for (let index = 0; index < placed.length; index += 1) {
        placed[index] = Math.max(LABEL_MIN_Y, placed[index]! - overflow);
      }
      y = LABEL_MAX_Y;
    }
    placed.push(y);
  }
  return sorted.map((label, index) => ({
    ...label,
    x: Math.min(Math.max(label.x, PADDING.left), SVG_WIDTH - 52),
    y: placed[index] ?? label.y,
  }));
}

function Marker({
  kind,
  x,
  y,
  color,
}: {
  kind: (typeof LINE_STYLES)[number]['marker'];
  x: number;
  y: number;
  color: string;
}) {
  if (kind === 'square') {
    return <rect x={x - 3} y={y - 3} width={6} height={6} fill={color} />;
  }
  if (kind === 'triangle') {
    return <polygon points={`${x},${y - 4} ${x - 4},${y + 3} ${x + 4},${y + 3}`} fill={color} />;
  }
  if (kind === 'diamond') {
    return <polygon points={`${x},${y - 4} ${x + 4},${y} ${x},${y + 4} ${x - 4},${y}`} fill={color} />;
  }
  if (kind === 'bar') {
    return <rect x={x - 1.5} y={y - 4} width={3} height={8} fill={color} />;
  }
  return <circle cx={x} cy={y} r={3} fill={color} />;
}

export function WinRateTrendChart({
  memberMap,
  sessionWinRates,
}: WinRateTrendChartProps) {
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
    () => new Set(allPlayerIds.slice(0, MAX_TREND_PLAYERS))
  );
  const playerKey = allPlayerIds.join(',');

  useEffect(() => {
    const ids = playerKey ? playerKey.split(',').map((id) => Number(id)) : [];
    setSelectedIds((prev) => {
      const previous = Array.from(prev);
      const stale = previous.some((id) => !ids.includes(id));
      if (!stale) return prev;
      const valid = previous.filter((id) => ids.includes(id));
      if (valid.length === 0) return new Set(ids.slice(0, MAX_TREND_PLAYERS));
      return new Set(valid);
    });
  }, [playerKey]);

  if (sessionWinRates.length === 0) {
    return (
      <div className="text-caption text-muted-foreground">
        試合結果を記録すると、勝率の推移が表示されます。
      </div>
    );
  }

  const togglePlayer = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        return next;
      }
      if (next.size >= MAX_TREND_PLAYERS) return prev;
      next.add(id);
      return next;
    });
  };

  const sessionCount = sessionWinRates.length;
  const xStep = sessionCount > 1 ? CHART_WIDTH / (sessionCount - 1) : CHART_WIDTH / 2;
  const yGridLines = [0, 25, 50, 75, 100];
  const selectedIdsInOrder = allPlayerIds.filter((id) => selectedIds.has(id));
  const selectedNames = selectedIdsInOrder.map((id) => getDisplayName(memberMap, id));
  const chartLabel = `勝率の推移。${sessionCount}回分。${selectedNames.join('、') || '選手未選択'}`;

  return (
    <div className="space-y-4">
      <div className="text-small text-muted-foreground">
        セッションごとの勝率推移。線は{MAX_TREND_PLAYERS}人までで、線の種類と端の名前でも区別します。
      </div>

      <div className="bg-card rounded-lg border border-border p-2 overflow-x-auto">
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="w-full h-auto max-h-[220px]"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={chartLabel}
        >
          <title>{chartLabel}</title>
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
                  strokeDasharray={val === 0 || val === 100 ? undefined : '2,2'}
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

          {sessionWinRates.map((session, i) => {
            const x =
              sessionCount > 1
                ? PADDING.left + i * xStep
                : PADDING.left + CHART_WIDTH / 2;
            return (
              <text
                key={session.sessionIndex}
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

          {(() => {
            const endLabels: Array<{
              playerId: number;
              x: number;
              y: number;
              name: string;
              color: string;
            }> = [];
            const lines = selectedIdsInOrder.map((playerId, colorIdx) => {
            const color = CHART_COLORS[colorIdx % CHART_COLORS.length]!;
            const style = LINE_STYLES[colorIdx % LINE_STYLES.length]!;
            const points: Array<{ x: number; y: number }> = [];

            for (let i = 0; i < sessionWinRates.length; i++) {
              const rate = sessionWinRates[i]!.playerRates.get(playerId);
              if (rate == null) continue;

              const x =
                sessionCount > 1
                  ? PADDING.left + i * xStep
                  : PADDING.left + CHART_WIDTH / 2;
              const y = PADDING.top + CHART_HEIGHT - rate * CHART_HEIGHT;
              points.push({ x, y });
            }

            if (points.length === 0) return null;

            const last = points[points.length - 1]!;
            const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
            endLabels.push({
              playerId,
              x: last.x + 4,
              y: last.y,
              name: shortName(getDisplayName(memberMap, playerId)),
              color,
            });

            return (
              <g key={playerId}>
                <polyline
                  points={polylinePoints}
                  fill="none"
                  stroke={color}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={style.dash}
                />
                {points.map((p, j) => (
                  <Marker key={j} kind={style.marker} x={p.x} y={p.y} color={color} />
                ))}
              </g>
            );
          });
            return (
              <>
                {lines}
                {spreadEndLabels(endLabels).map((label) => (
                  <text
                    key={label.playerId}
                    x={label.x}
                    y={label.y}
                    fill={label.color}
                    fontSize={8}
                    dominantBaseline="middle"
                  >
                    {label.name}
                  </text>
                ))}
              </>
            );
          })()}
        </svg>
      </div>

      {selectedIds.size >= MAX_TREND_PLAYERS && (
        <p className="text-xs text-muted-foreground">
          同時に{MAX_TREND_PLAYERS}人までです。表示中の選手を外すと追加できます。
        </p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {allPlayerIds.map((id) => {
          const name = getDisplayName(memberMap, id);
          const isSelected = selectedIds.has(id);
          const colorIndex = selectedIdsInOrder.indexOf(id);
          const color = isSelected
            ? CHART_COLORS[colorIndex % CHART_COLORS.length]
            : undefined;
          const atCap = !isSelected && selectedIds.size >= MAX_TREND_PLAYERS;

          return (
            <button
              key={id}
              type="button"
              aria-pressed={isSelected}
              disabled={atCap}
              onClick={() => togglePlayer(id)}
              className={`inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-xs font-medium transition-all duration-fast disabled:opacity-40 ${
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
