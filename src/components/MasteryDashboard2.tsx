'use client';

import React, { useMemo } from 'react';

interface DomainPoint {
  date: string; // YYYY-MM-DD
  Knowing: number;
  Applying: number;
  Reasoning: number;
}

interface MasteryDashboard2Props {
  historicalData?: DomainPoint[];
  studentName?: string;
  showForecast?: boolean;
}

const MasteryDashboard2: React.FC<MasteryDashboard2Props> = ({
  historicalData = defaultHistoricalData,
  studentName = 'Sebastian',
  showForecast = true,
}) => {
  // Process data for chart
  const { points, dateLabels } = useMemo(() => {
    const sorted = [...historicalData].sort((a, b) => a.date.localeCompare(b.date));
    const points = sorted.map((d, idx) => ({
      ...d,
      index: idx,
    }));
    const domains: ('Knowing' | 'Applying' | 'Reasoning')[] = ['Knowing', 'Applying', 'Reasoning'];
    const dateLabels = sorted.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('en-NZ', { month: 'short', day: 'numeric' });
    });
    return { points, domains, dateLabels };
  }, [historicalData]);

  const domainColors = {
    Knowing: '#3B82F6', // blue
    Applying: '#10B981', // emerald
    Reasoning: '#8B5CF6', // violet
  };

  // Chart dimensions
  const width = 800;
  const height = 400;
  const margin = { top: 20, right: 40, bottom: 40, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Scale functions (simplified, assuming data is 0-100)
  const xScale = (index: number) => {
    if (points.length <= 1) return margin.left + (index * innerWidth);
    return margin.left + (index / (points.length - 1)) * innerWidth;
  };
  const yScale = (value: number) => margin.top + innerHeight - (value / 100) * innerHeight;

  // Calculate trend line (simple linear regression) for each domain
  const trendLines = useMemo(() => {
    const result: Record<string, { slope: number; intercept: number }> = {};
    const n = points.length;
    if (n < 2) return result;

    const xMean = (n - 1) / 2;
    const xVariance = (n * (n - 1) * (n + 1)) / 12; // sum of squared deviations

    (['Knowing', 'Applying', 'Reasoning'] as const).forEach(domain => {
      const yValues = points.map(p => p[domain]);
      const yMean = yValues.reduce((a, b) => a + b, 0) / n;
      let covariance = 0;
      for (let i = 0; i < n; i++) {
        covariance += (i - xMean) * (yValues[i] - yMean);
      }
      const slope = covariance / xVariance;
      const intercept = yMean - slope * xMean;
      result[domain] = { slope, intercept };
    });
    return result;
  }, [points]);

  // Forecast next point (one step ahead)
  const forecastPoints = useMemo(() => {
    if (!showForecast || points.length < 2) return [];
    const nextIndex = points.length;
    const forecast: DomainPoint = {
      date: new Date(new Date(points[points.length - 1].date).getTime() + 86400000).toISOString().split('T')[0],
      Knowing: 0,
      Applying: 0,
      Reasoning: 0,
    };
    (['Knowing', 'Applying', 'Reasoning'] as const).forEach(domain => {
      const trend = trendLines[domain];
      if (trend) {
        forecast[domain] = Math.max(0, Math.min(100, trend.intercept + trend.slope * nextIndex));
      }
    });
    return [forecast];
  }, [points, trendLines, showForecast]);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h3 className="text-2xl font-black uppercase tracking-tight text-gray-900 mb-2">
            Mastery Dashboard 2.0
          </h3>
          <p className="text-gray-600 text-sm font-mono uppercase tracking-widest">
            TIMSS Cognitive Domains – Historical Progress & Forecast
          </p>
        </div>
        <div className="px-4 py-2 bg-[#D4AF37] text-black text-sm font-black uppercase tracking-wider">
          {studentName}
        </div>
      </div>

      {/* Chart container */}
      <div className="overflow-x-auto">
        <svg 
          width={width} 
          height={height} 
          className="w-full max-w-full"
          role="img"
          aria-label="Mastery progress line chart showing TIMSS cognitive domains (Knowing, Applying, Reasoning) over time"
          aria-labelledby="chart-title"
          aria-describedby="chart-desc"
        >
          <title id="chart-title">Mastery Progress Line Chart</title>
          <desc id="chart-desc">
            Line chart displaying mastery percentages across three TIMSS cognitive domains: Knowing (blue), Applying (green), and Reasoning (violet). 
            X‑axis shows dates, Y‑axis shows mastery percentage from 0% to 100%. Forecasted trends are shown as dashed lines.
          </desc>
          {/* Grid lines */}
          {[0, 20, 40, 60, 80, 100].map(y => (
            <g key={y}>
              <line
                x1={margin.left}
                y1={yScale(y)}
                x2={width - margin.right}
                y2={yScale(y)}
                stroke="#333"
                strokeWidth="1"
                strokeDasharray="4"
              />
              <text x={margin.left - 10} y={yScale(y)} textAnchor="end" fill="#999" fontSize="12">
                {y}%
              </text>
            </g>
          ))}

          {/* X-axis labels */}
          {dateLabels.map((label, idx) => (
            <text
              key={idx}
              x={xScale(idx)}
              y={height - 10}
              textAnchor="middle"
              fill="#999"
              fontSize="12"
            >
              {label}
            </text>
          ))}

          {/* Trend lines (forecast) */}
          {showForecast && forecastPoints.map((fp, idx) => (
            <g key={`forecast-${idx}`}>
              {(['Knowing', 'Applying', 'Reasoning'] as const).map(domain => {
                const lastPoint = points[points.length - 1];
                if (!lastPoint) return null;
                const x1 = xScale(points.length - 1);
                const y1 = yScale(lastPoint[domain]);
                const x2 = xScale(points.length);
                const y2 = yScale(fp[domain]);
                return (
                  <line
                    key={domain}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={domainColors[domain]}
                    strokeWidth="2"
                    strokeDasharray="6"
                    opacity="0.7"
                  />
                );
              })}
            </g>
          ))}

          {/* Domain lines */}
          {(['Knowing', 'Applying', 'Reasoning'] as const).map(domain => (
            <g key={domain}>
              {/* Line path */}
              <polyline
                fill="none"
                stroke={domainColors[domain]}
                strokeWidth="3"
                points={points.map((p, idx) => `${xScale(idx)},${yScale(p[domain])}`).join(' ')}
              />
              {/* Points */}
              {points.map((p, idx) => (
                <circle
                  key={`${domain}-${idx}`}
                  cx={xScale(idx)}
                  cy={yScale(p[domain])}
                  r="4"
                  fill={domainColors[domain]}
                  stroke="white"
                  strokeWidth="1"
                />
              ))}
            </g>
          ))}

          {/* Forecast points */}
          {showForecast && forecastPoints.map((fp, idx) => (
            <g key={`forecast-point-${idx}`}>
              {(['Knowing', 'Applying', 'Reasoning'] as const).map(domain => (
                <circle
                  key={domain}
                  cx={xScale(points.length)}
                  cy={yScale(fp[domain])}
                  r="5"
                  fill={domainColors[domain]}
                  stroke="white"
                  strokeWidth="2"
                  opacity="0.8"
                />
              ))}
            </g>
          ))}

          {/* Axes */}
          <line
            x1={margin.left}
            y1={margin.top}
            x2={margin.left}
            y2={height - margin.bottom}
            stroke="#666"
            strokeWidth="2"
          />
          <line
            x1={margin.left}
            y1={height - margin.bottom}
            x2={width - margin.right}
            y2={height - margin.bottom}
            stroke="#666"
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-8 mt-10">
        {(['Knowing', 'Applying', 'Reasoning'] as const).map(domain => (
          <div key={domain} className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: domainColors[domain] }}
            />
            <span className="text-gray-900 font-bold uppercase tracking-tight">{domain}</span>
            <span className="text-gray-600 text-sm">
              {points.length > 0 && `${points[points.length - 1][domain]}%`}
              {trendLines[domain] && (
                <span className="ml-2">
                  {trendLines[domain].slope > 0.5 ? '↗' : trendLines[domain].slope < -0.5 ? '↘' : '→'}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
        {(['Knowing', 'Applying', 'Reasoning'] as const).map(domain => {
          const current = points.length > 0 ? points[points.length - 1][domain] : 0;
          const trend = trendLines[domain];
          const forecast = forecastPoints.length > 0 ? forecastPoints[0][domain] : null;
          return (
            <div key={domain} className="border border-gray-100 p-6">
              <h4 className="text-lg font-black uppercase tracking-tight text-gray-900 mb-4">
                {domain}
              </h4>
              <div className="text-4xl font-black text-gray-900 mb-2">{current}%</div>
              <div className="text-sm text-gray-600 mb-4">
                Current mastery
              </div>
              {trend && (
                <div className="text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="text-zinc-500">Trend slope:</span>
                    <span className={trend.slope > 0 ? 'text-emerald-400' : trend.slope < 0 ? 'text-rose-400' : 'text-gray-600'}>
                      {trend.slope > 0 ? '+' : ''}{trend.slope.toFixed(2)} pts/day
                    </span>
                  </div>
                  {forecast !== null && (
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Forecast (next day):</span>
                      <span className="text-[#D4AF37]">{forecast.toFixed(0)}%</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Interpretation */}
      <div className="mt-12 pt-8 border-t border-gray-100">
        <h4 className="text-lg font-black uppercase tracking-tight text-gray-900 mb-4">
          Insights & Recommendations
        </h4>
        <ul className="space-y-3 text-gray-600 text-sm">
          <li className="flex items-start gap-3">
            <span className="text-[#D4AF37] font-black">✓</span>
            <span>
              <strong>Steady growth in Knowing</strong> indicates strong foundational recall—leverage this for more complex applications.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[#D4AF37] font-black">✓</span>
            <span>
              <strong>Applying domain shows moderate progress</strong>; consider adding more real‑world context to boost transfer.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[#D4AF37] font-black">✓</span>
            <span>
              <strong>Reasoning forecast suggests acceleration</strong>—focus on proof‑based tasks to maintain momentum.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};

// Default mock data (10 days of progress)
const defaultHistoricalData: DomainPoint[] = [
  { date: '2026-03-01', Knowing: 45, Applying: 30, Reasoning: 20 },
  { date: '2026-03-02', Knowing: 48, Applying: 32, Reasoning: 22 },
  { date: '2026-03-03', Knowing: 52, Applying: 35, Reasoning: 25 },
  { date: '2026-03-04', Knowing: 55, Applying: 38, Reasoning: 28 },
  { date: '2026-03-05', Knowing: 58, Applying: 40, Reasoning: 30 },
  { date: '2026-03-06', Knowing: 62, Applying: 43, Reasoning: 32 },
  { date: '2026-03-07', Knowing: 65, Applying: 45, Reasoning: 35 },
  { date: '2026-03-08', Knowing: 68, Applying: 48, Reasoning: 38 },
  { date: '2026-03-09', Knowing: 70, Applying: 50, Reasoning: 40 },
  { date: '2026-03-10', Knowing: 72, Applying: 52, Reasoning: 42 },
];

export default MasteryDashboard2;