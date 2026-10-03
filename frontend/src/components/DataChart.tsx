import { useId } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CountRow } from "../types";

export default function DataChart({
  title,
  description,
  rows,
  unit = "Researchers",
}: {
  title: string;
  description: string;
  rows: CountRow[];
  unit?: string;
}) {
  const id = useId();
  return (
    <section className="chart-card" aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      <p>{description}</p>
      <div className="chart-visual" aria-hidden="true">
        <ResponsiveContainer
          width="100%"
          height={Math.max(220, rows.length * 34)}
        >
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ top: 8, right: 28, bottom: 0, left: 0 }}
          >
            <CartesianGrid horizontal={false} stroke="#e7e8e3" />
            <XAxis
              type="number"
              allowDecimals={false}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={165}
              tick={{ fontSize: 12, fill: "#46564e" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip cursor={{ fill: "#f0f3ed" }} />
            <Bar
              dataKey="count"
              name={unit}
              fill="#357663"
              radius={[0, 3, 3, 0]}
              barSize={16}
              isAnimationActive={false}
              label={{ position: "right", fill: "#345449", fontSize: 12 }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <details>
        <summary>View data table</summary>
        <table>
          <caption>
            {title} — {unit.toLowerCase()} per category
          </caption>
          <thead>
            <tr>
              <th scope="col">Category</th>
              <th scope="col">{unit}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name}>
                <th scope="row">{row.name}</th>
                <td>{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}
