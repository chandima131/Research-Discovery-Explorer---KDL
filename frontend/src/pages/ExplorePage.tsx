import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import DataChart from "../components/DataChart";
import { ErrorState, Loading } from "../components/Status";
import { api } from "../services/api";
import { useResource } from "../hooks/useResource";

export default function ExplorePage() {
  const resource = useResource(
    useCallback((signal: AbortSignal) => api.overview(signal), []),
  );
  const [expertiseLimit, setExpertiseLimit] = useState(10);
  const data = resource.data;
  return (
    <div className="page explore-page">
      <div className="page-intro">
        <p className="eyebrow">THE RESEARCH LANDSCAPE</p>
        <h1>A wider view of expertise</h1>
        <p>
          Explore the disciplines, connections and publication patterns in our
          synthetic dataset.
        </p>
      </div>
      {resource.loading && <Loading />}
      {resource.error && (
        <ErrorState message={resource.error} retry={resource.retry} />
      )}
      {data && (
        <>
          <div className="metric-grid">
            {[
              [data.researchers, "Researchers"],
              [data.departments, "Departments"],
              [data.themes, "Research themes"],
              [data.publications, "Publications"],
            ].map(([value, label]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <p className="small-copy exploration-note">
            Counts describe the demonstration dataset, not research quality or
            institutional performance. Researchers can belong to more than one
            theme or expertise area. Every chart has a data table.
          </p>
          <div className="charts-grid">
            <DataChart
              title="Researchers by department"
              description="Each profile belongs to one department."
              rows={data.by_department}
            />
            <DataChart
              title="Researchers by research theme"
              description="Shared themes reveal interests across departments."
              rows={data.by_theme}
            />
            <div>
              <div className="chart-control">
                <label htmlFor="expertise-count">Expertise areas shown</label>
                <select
                  id="expertise-count"
                  value={expertiseLimit}
                  onChange={(e) => setExpertiseLimit(Number(e.target.value))}
                >
                  <option value={10}>Top 10</option>
                  <option value={100}>All areas</option>
                </select>
              </div>
              <DataChart
                title="Most common expertise areas"
                description="Number of profiles associated with each expertise area."
                rows={data.by_expertise.slice(0, expertiseLimit)}
              />
            </div>
            <DataChart
              title="Publication activity by year"
              description="Fictional publications grouped by their publication year."
              rows={data.by_year}
              unit="Publications"
            />
          </div>
          <div className="explore-next">
            <h2>Follow the connections</h2>
            <p>
              See how researchers share themes and expertise across disciplines.
            </p>
            <Link className="button secondary" to="/network">
              Explore the research network →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
