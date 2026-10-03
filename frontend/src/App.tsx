import { lazy, Suspense, useEffect, useRef } from "react";
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { ArrowUpRight, Orbit } from "lucide-react";
import Home from "./pages/Home";
import SearchPage from "./pages/SearchPage";
import ProfilePage from "./pages/ProfilePage";
import { Loading } from "./components/Status";
import NetworkPage from "./pages/NetworkPage";
import InformationPage from "./pages/InformationPage";
import { demoMode } from "./services/api";

const ExplorePage = lazy(() => import("./pages/ExplorePage"));

const navigation = [
  ["/", "Home"],
  ["/researchers", "Find Researchers"],
  ["/explore", "Explore"],
  ["/network", "Research Network"],
  ["/methodology", "Methodology"],
];

export default function App() {
  const location = useLocation();
  const initialPath = useRef(location.pathname);
  useEffect(() => {
    const title =
      navigation.find(([path]) => path === location.pathname)?.[1] ??
      (location.pathname.startsWith("/researchers/")
        ? "Researcher profile"
        : location.pathname === "/accessibility"
          ? "Accessibility"
          : "Ethics & Privacy");
    document.title = `${title} · Research Discovery Explorer`;
    if (initialPath.current !== location.pathname) {
      document.querySelector<HTMLElement>("#main-content")?.focus();
      window.scrollTo({ top: 0 });
      initialPath.current = location.pathname;
    }
  }, [location.pathname]);
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="site-header">
        <div className="header-inner">
          <Link
            className="brand"
            to="/"
            aria-label="Research Discovery Explorer home"
          >
            <span className="brand-symbol">
              <Orbit size={27} strokeWidth={1.4} />
            </span>
            <span>
              Research Discovery<span className="brand-small">EXPLORER</span>
            </span>
          </Link>
          <nav aria-label="Main navigation">
            {navigation.map(([path, label]) => (
              <NavLink key={path} to={path} end={path === "/"}>
                {label}
              </NavLink>
            ))}
          </nav>
          <span className="demo-label">
            <span /> Synthetic data
          </span>
        </div>
      </header>
      {demoMode && (
        <div className="preview-banner">
          Offline preview · Fictional data · Keyword matching only. Semantic
          retrieval requires the full backend.
        </div>
      )}
      <main id="main-content" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/researchers" element={<SearchPage />} />
          <Route path="/researchers/:id" element={<ProfilePage />} />
          <Route path="/explore" element={<Suspense fallback={<div className="page"><Loading /></div>}><ExplorePage /></Suspense>} />
          <Route path="/network" element={<NetworkPage />} />
          <Route
            path="/methodology"
            element={<InformationPage kind="methodology" />}
          />
          <Route
            path="/accessibility"
            element={<InformationPage kind="accessibility" />}
          />
          <Route path="/ethics" element={<InformationPage kind="ethics" />} />
          <Route
            path="*"
            element={
              <div className="page prose">
                <p className="eyebrow">404 · Page not found</p>
                <h1>Let’s find your way back.</h1>
                <Link className="button" to="/researchers">
                  Explore researchers
                </Link>
              </div>
            }
          />
        </Routes>
      </main>
      <footer className="site-footer">
        <div className="footer-top">
          <div>
            <Link className="footer-brand" to="/">
              Research Discovery Explorer <ArrowUpRight size={17} />
            </Link>
            <p>
              Exploring research expertise through structured data and semantic
              search
            </p>
          </div>
          <nav aria-label="Footer navigation">
            <Link to="/accessibility">Accessibility</Link>
            <Link to="/ethics">Ethics & Privacy</Link>
            <Link to="/methodology">Methodology</Link>
            <a href="/research-directory.html">Text directory</a>
          </nav>
        </div>
        <div className="footer-bottom">
          <span>An independent research software demonstration.</span>
          <span>Fictional researchers. Real discovery methods.</span>
        </div>
      </footer>
    </>
  );
}
