import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const fills = ['#0075DE', '#6EA8DB', '#A9CCEA', '#D9E8F6', '#E7EFF7'];

type ResultChartProps = {
  data: Array<{
    name: string;
    value: number;
  }>;
};

export function ResultChart({ data }: ResultChartProps) {
  return (
    <div className="result-chart">
      <ResponsiveContainer height={320} width="100%">
        <BarChart data={data}>
          <XAxis axisLine={false} dataKey="name" tickLine={false} />
          <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: 'rgba(0, 0, 0, 0.04)' }} />
          <Bar dataKey="value" radius={[10, 10, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`${entry.name}-${entry.value}`} fill={fills[index % fills.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
