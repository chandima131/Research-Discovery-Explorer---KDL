import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { useResource } from "../hooks/useResource";
import { ErrorState, Loading } from "../components/Status";

export default function NetworkPage() {
  const [theme, setTheme] = useState("");
  const resource = useResource(
    useCallback(
      (signal: AbortSignal) =>
        api.search(new URLSearchParams({ limit: "60" }), signal),
      [],
    ),
  );
  const catalog = useResource(
    useCallback((signal: AbortSignal) => api.catalog(signal), []),
  );
  const selected = theme || String(catalog.data?.themes[0]?.id ?? "");
  const people =
    resource.data?.items
      .map((x) => x.researcher)
      .filter((r) => r.themes.some((t) => t.id === Number(selected))) ?? [];
  const themeName =
    catalog.data?.themes.find((x) => x.id === Number(selected))?.name ?? "";
  const expertise = [
    ...new Set(people.flatMap((r) => r.expertise.map((x) => x.name))),
  ];
  return (
    <div className="page network-page">
      <div className="page-intro">
        <p className="eyebrow">IDEAS DON’T LIVE IN ISOLATION</p>
        <h1>Research is connected</h1>
        <p>
          Choose a theme to see its researchers and the expertise they share.
        </p>
      </div>
      <div className="network-toolbar">
        <label htmlFor="network-theme">Research theme</label>
        <select
          id="network-theme"
          value={selected}
          onChange={(e) => setTheme(e.target.value)}
          disabled={!catalog.data}
        >
          {catalog.data?.themes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <span>
          {people.length} researchers · {expertise.length} expertise areas
        </span>
      </div>
      {(resource.loading || catalog.loading) && <Loading />}
      {(resource.error || catalog.error) && (
        <ErrorState
          message={resource.error || catalog.error}
          retry={() => {
            resource.retry();
            catalog.retry();
          }}
        />
      )}
      {resource.data && catalog.data && (
        <>
          <section className="network-panel" aria-labelledby="network-heading">
            <h2 id="network-heading">Connections around {themeName}</h2>
            <p>
              A line means a researcher lists this theme or expertise. Positions
              and distances have no statistical meaning. The table below gives
              every relationship.
            </p>
            <div className="network-legend">
              <span>● Researcher</span>
              <span>◇ Research theme</span>
              <span>□ Expertise</span>
            </div>
            <svg
              className="network-svg"
              viewBox="0 0 1000 620"
              role="img"
              aria-label={`Network of ${people.length} fictional researchers connected to ${themeName}. Full relationships are listed in the table below.`}
            >
              {people.map((r, i) => {
                const angle = (i / people.length) * Math.PI * 2;
                const x = 500 + Math.cos(angle) * 260,
                  y = 310 + Math.sin(angle) * 205;
                return (
                  <g key={r.id}>
                    <line x1="500" y1="310" x2={x} y2={y} stroke="#bed0c4" />
                    <circle cx={x} cy={y} r="7" fill="#285c4b" />
                    <text
                      x={x + (x > 500 ? 14 : -14)}
                      y={y + 5}
                      textAnchor={x > 500 ? "start" : "end"}
                      fill="#284c40"
                      fontSize="13"
                    >
                      {r.name.replace("Dr ", "")}
                    </text>
                  </g>
                );
              })}
              {expertise.slice(0, 6).map((name, i) => {
                const x = 110 + i * 156,
                  y = i % 2 === 0 ? 40 : 585;
                const related = people.filter((r) =>
                  r.expertise.some((e) => e.name === name),
                );
                return (
                  <g key={name}>
                    {related.map((r) => {
                      const j = people.indexOf(r),
                        angle = (j / people.length) * Math.PI * 2;
                      return (
                        <line
                          key={r.id}
                          x1={x}
                          y1={y}
                          x2={500 + Math.cos(angle) * 260}
                          y2={310 + Math.sin(angle) * 205}
                          stroke="#cbbf9f"
                          strokeDasharray="3 5"
                        />
                      );
                    })}
                    <rect
                      x={x - 5}
                      y={y - 5}
                      width="10"
                      height="10"
                      fill="#927b47"
                    />
                    <text
                      x={x}
                      y={y + (y < 100 ? -14 : 25)}
                      textAnchor="middle"
                      fontSize="11"
                      fill="#665b40"
                    >
                      {name}
                    </text>
                  </g>
                );
              })}
              <rect
                x="390"
                y="280"
                width="220"
                height="60"
                rx="30"
                fill="#174d42"
              />
              <text
                x="500"
                y="315"
                textAnchor="middle"
                fill="#fff"
                fontSize="15"
              >
                ◇ {themeName}
              </text>
            </svg>
            <p className="small-copy">
              The graph shows up to six expertise areas to stay readable. The
              table includes all areas.
            </p>
          </section>
          <section className="network-table">
            <h2>All connections in this theme</h2>
            <div className="table-scroll">
              <table>
                <caption>
                  Researchers associated with {themeName}, and their expertise
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Researcher</th>
                    <th scope="col">Department</th>
                    <th scope="col">Expertise areas</th>
                  </tr>
                </thead>
                <tbody>
                  {people.map((r) => (
                    <tr key={r.id}>
                      <th scope="row">
                        <Link to={`/researchers/${r.id}`}>{r.name}</Link>
                      </th>
                      <td>{r.department.name}</td>
                      <td>{r.expertise.map((x) => x.name).join(" · ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
