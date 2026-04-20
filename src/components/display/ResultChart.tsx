import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
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
      <ResponsiveContainer height={360} width="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
          <CartesianGrid horizontal={false} stroke="rgba(0, 0, 0, 0.06)" />
          <XAxis allowDecimals={false} axisLine={false} tickLine={false} type="number" />
          <YAxis
            axisLine={false}
            dataKey="name"
            tickLine={false}
            type="category"
            width={180}
          />
          <Tooltip cursor={{ fill: 'rgba(0, 0, 0, 0.04)' }} />
          <Bar dataKey="value" radius={[0, 10, 10, 0]}>
            {data.map((entry, index) => (
              <Cell key={`${entry.name}-${entry.value}`} fill={fills[index % fills.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
