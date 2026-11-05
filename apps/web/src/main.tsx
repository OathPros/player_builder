import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BrowserRouter,
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
} from 'react-router';
import {
  ApiError,
  AssetsResponse,
  RulesetsResponse,
  type Asset,
} from '@rpg-forge/contracts';
import './styles.css';

function RouteFocus() {
  const { pathname } = useLocation();
  const previousPath = useRef(pathname);
  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    document.querySelector<HTMLElement>('h1')?.focus();
  }, [pathname]);
  return null;
}
function App() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="header-inner">
          <Link className="brand" to="/" aria-label="RPG Forge home">
            <span className="brand-mark" aria-hidden="true">
              ✦
            </span>{' '}
            RPG Forge
          </Link>
          <nav aria-label="Main navigation">
            {[
              ['/', 'Home'],
              ['/library', 'Library'],
              ['/characters', 'Characters'],
            ].map(([to, label]) => (
              <NavLink key={to} to={to!} end={to === '/'}>
                {label}
              </NavLink>
            ))}
          </nav>
          <span className="badge">Foundation preview</span>
        </div>
      </header>
      <main id="main" tabIndex={-1}>
        <RouteFocus />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/library" element={<Library />} />
          <Route path="/characters" element={<Characters />} />
          <Route path="/attribution" element={<Attribution />} />
          <Route
            path="*"
            element={
              <>
                <h1 tabIndex={-1}>Page not found</h1>
                <p>
                  This page does not exist. <Link to="/">Return home</Link>.
                </p>
              </>
            }
          />
        </Routes>
      </main>
      <footer>
        <span>RPG Forge · Foundation sprint · v0.1.0</span>
        <Link to="/attribution">Sources & attribution</Link>
      </footer>
    </>
  );
}
function Home() {
  return (
    <>
      <section className="hero">
        <p className="eyebrow">A foundation for future adventures</p>
        <h1 tabIndex={-1}>
          Every story starts
          <br className="wide-break" /> with a foundation.
        </h1>
        <p className="intro">
          A home for your rules, characters, and ideas. We’re building it one
          verified step at a time.
        </p>
        <div className="actions">
          <Link className="button primary" to="/library">
            Explore the demo library <span aria-hidden="true">→</span>
          </Link>
          <Link className="button secondary" to="/characters">
            Character workspace
          </Link>
        </div>
      </section>
      <aside className="notice" aria-label="Preview limitations">
        <span className="notice-symbol" aria-hidden="true">
          i
        </span>
        <div>
          <strong>You’re viewing the foundation sprint.</strong>
          <p>
            The library contains one synthetic demonstration spell. SRD content,
            character creation, accounts, and AI are not implemented.
          </p>
        </div>
      </aside>
      <section aria-labelledby="workspace-title">
        <div className="section-heading">
          <h2 id="workspace-title">Your workspace</h2>
          <span className="muted">Small beginnings. Clear boundaries.</span>
        </div>
        <div className="cards">
          <article className="card">
            <span className="card-icon" aria-hidden="true">
              ◇
            </span>
            <p className="eyebrow">Browse & read</p>
            <h3>Content library</h3>
            <p>
              Inspect an original demo asset, its version, and its provenance.
              No official SRD content has been imported.
            </p>
            <Link to="/library">
              Open library <span aria-hidden="true">→</span>
            </Link>
          </article>
          <article className="card">
            <span className="card-icon" aria-hidden="true">
              ♙
            </span>
            <p className="eyebrow">Planned</p>
            <h3>Character workspace</h3>
            <p>
              A place for future character drafts and sheets. Creation and
              persistence will arrive in later milestones.
            </p>
            <Link to="/characters">
              View workspace <span aria-hidden="true">→</span>
            </Link>
          </article>
          <article className="card">
            <span className="card-icon" aria-hidden="true">
              ✧
            </span>
            <p className="eyebrow">Not started</p>
            <h3>Rules you can trust</h3>
            <p>
              Deterministic rules and verified source content are the goal.
              Rules automation and AI authoring are not available yet.
            </p>
            <Link to="/attribution">
              Read the source status <span aria-hidden="true">→</span>
            </Link>
          </article>
        </div>
      </section>
    </>
  );
}
async function readJson(response: Response): Promise<unknown> {
  const body: unknown = await response.json();
  if (!response.ok) {
    const error = ApiError.safeParse(body);
    throw new Error(
      error.success
        ? error.data.error.message
        : 'The catalog request failed. Please try again.',
    );
  }
  return body;
}
function Library() {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [cursors, setCursors] = useState<string[]>([]);
  const [retry, setRetry] = useState(0);
  const [state, setState] = useState<{
    loading: boolean;
    data: Asset[];
    next: string | null;
    error: string;
    ruleset: string;
  }>({ loading: true, data: [], next: null, error: '', ruleset: '' });
  const cursor = cursors.at(-1);
  useEffect(() => {
    const controller = new AbortController();
    setState({ loading: true, data: [], next: null, error: '', ruleset: '' });
    const params = new URLSearchParams({ limit: '20' });
    if (query) params.set('q', query);
    if (cursor) params.set('cursor', cursor);
    Promise.all([
      fetch('/api/v1/assets?' + params, { signal: controller.signal })
        .then(readJson)
        .then((data) => AssetsResponse.parse(data)),
      fetch('/api/v1/rulesets', { signal: controller.signal })
        .then(readJson)
        .then((data) => RulesetsResponse.parse(data)),
    ])
      .then(([assets, rulesets]) => {
        if (!controller.signal.aborted)
          setState({
            loading: false,
            data: assets.data,
            next: assets.nextCursor,
            error: '',
            ruleset: rulesets.data
              .map(
                (r) =>
                  `${r.name} ${r.version} — ${r.status}; no content imported`,
              )
              .join(', '),
          });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setState({
            loading: false,
            data: [],
            next: null,
            error:
              error instanceof Error
                ? error.message
                : 'Unable to load the catalog.',
            ruleset: '',
          });
      });
    return () => controller.abort();
  }, [query, cursor, retry]);
  return (
    <>
      <p className="eyebrow">Browse & read</p>
      <h1 tabIndex={-1}>Content library</h1>
      <p className="intro">
        A small catalog to prove the foundation. All available content is
        synthetic and has no executable game mechanics.
      </p>
      <div className="notice">
        <div>
          <strong>Demo content only · SRD import not started</strong>
          <p>
            {state.ruleset ||
              'The D&D 2024 / SRD 5.2.1 ruleset is planned, not implemented.'}
          </p>
        </div>
      </div>
      <form
        className="search"
        onSubmit={(event) => {
          event.preventDefault();
          setCursors([]);
          setQuery(search.trim());
        }}
      >
        <label htmlFor="search">Search demo assets</label>
        <div className="search-controls">
          <input
            id="search"
            type="search"
            maxLength={100}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name"
          />
          <button className="button primary" type="submit">
            Search
          </button>
        </div>
      </form>
      <div role="status" aria-live="polite">
        {state.loading
          ? 'Loading catalog…'
          : state.error
            ? ''
            : `${state.data.length} ${state.data.length === 1 ? 'asset' : 'assets'} on this page`}
      </div>
      {state.error && (
        <div role="alert" className="notice error">
          <div>
            <strong>Catalog unavailable</strong>
            <p>{state.error}</p>
            <button
              className="button secondary"
              onClick={() => setRetry((n) => n + 1)}
            >
              Try again
            </button>
          </div>
        </div>
      )}
      {!state.loading &&
        !state.error &&
        (state.data.length ? (
          <div className="asset-list">
            {state.data.map((asset) => (
              <article className="card asset" key={asset.id}>
                <div className="asset-heading">
                  <span className="badge">Synthetic demo · Not SRD</span>
                  <span className="muted">
                    Spell · version {asset.versionNumber}
                  </span>
                </div>
                <h2>{asset.name}</h2>
                <p>{asset.displayText}</p>
                <dl>
                  <div>
                    <dt>Ruleset pin</dt>
                    <dd>{asset.rulesetId}</dd>
                  </div>
                  <div>
                    <dt>Asset version</dt>
                    <dd>{asset.versionId}</dd>
                  </div>
                  <div>
                    <dt>Source</dt>
                    <dd>{asset.sourceLocator}</dd>
                  </div>
                  <div>
                    <dt>License</dt>
                    <dd>{asset.license}</dd>
                  </div>
                </dl>
                <p className="muted">
                  Demonstration only. Cannot be cast or selected by a character.
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty">
            <h2>No matching demo assets</h2>
            <p>
              Try a different name. The SRD and community libraries are not
              available yet.
            </p>
          </div>
        ))}
      <nav className="pagination" aria-label="Catalog pages">
        <button
          className="button secondary"
          disabled={state.loading || cursors.length === 0}
          onClick={() => setCursors((values) => values.slice(0, -1))}
        >
          Previous page
        </button>
        <button
          className="button secondary"
          disabled={state.loading || !state.next}
          onClick={() => {
            if (state.next) setCursors((values) => [...values, state.next!]);
          }}
        >
          Next page
        </button>
      </nav>
    </>
  );
}
function Characters() {
  return (
    <>
      <p className="eyebrow">Your future party</p>
      <h1 tabIndex={-1}>Character workspace</h1>
      <p className="intro">
        A placeholder for your characters. Character creation, saving, and
        interactive sheets are not implemented.
      </p>
      <section className="empty">
        <span className="empty-icon" aria-hidden="true">
          ♙
        </span>
        <span className="badge">Planned feature</span>
        <h2>No character system yet</h2>
        <p>
          There are no saved characters to display. Accounts and server-side
          rules validation must be built before character creation becomes
          available.
        </p>
        <Link className="button secondary" to="/library">
          Explore the demo library
        </Link>
      </section>
    </>
  );
}
function Attribution() {
  return (
    <>
      <p className="eyebrow">Provenance matters</p>
      <h1 tabIndex={-1}>Sources & attribution</h1>
      <section className="card">
        <h2>Original demonstration content</h2>
        <p>
          The “Synthetic Demo Spark” fixture is original demonstration text
          dedicated under CC0 1.0. It is not SRD content, an official D&D spell,
          a complete homebrew definition, or an executable rule.
        </p>
        <h2>Planned SRD support</h2>
        <p>
          No SRD material has been downloaded, imported, reviewed, mechanically
          mapped, or tested. The configured ruleset is a planning identifier
          only.
        </p>
        <p>
          The authoritative source for future work is{' '}
          <a href="https://www.dndbeyond.com/srd">the official SRD page</a>. SRD
          5.2.1 is licensed under{' '}
          <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>.
          Required source attribution and change notices must be reviewed before
          any future import is published.
        </p>
      </section>
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
