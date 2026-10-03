import { AlertCircle, RotateCw } from "lucide-react";

export function Loading({
  label = "Loading research data…",
}: {
  label?: string;
}) {
  return (
    <div className="status loading" role="status">
      <span className="loading-dot" />
      {label}
    </div>
  );
}
export function ErrorState({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <div className="status error" role="alert">
      <AlertCircle size={22} />
      <div>
        <h2>We couldn’t load this information</h2>
        <p>{message}</p>
        {retry && (
          <button className="text-button" onClick={retry}>
            <RotateCw size={15} /> Try again
          </button>
        )}
      </div>
    </div>
  );
}
