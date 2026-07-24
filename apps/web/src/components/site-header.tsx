import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell site-header__inner">
        <Link className="brand" href="/" aria-label="Eventure home">
          <span className="brand__mark" aria-hidden="true">
            E
          </span>
          <span>Eventure</span>
        </Link>

        <nav className="site-nav" aria-label="Primary navigation">
          <Link href="/#discover">Discover</Link>
          <Link href="/organizer/events">Create event</Link>
        </nav>

        <div className="site-header__actions">
          <Link className="button button--ghost" href="/login">
            Log in
          </Link>
          <Link className="button button--primary" href="/register">
            Join Eventure
          </Link>
        </div>
      </div>
    </header>
  );
}
