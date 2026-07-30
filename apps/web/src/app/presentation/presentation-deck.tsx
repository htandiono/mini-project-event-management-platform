"use client";

import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Database,
  ExternalLink,
  GitBranch,
  Mail,
  Maximize,
  Play,
  RefreshCw,
  Search,
  ShieldCheck,
  Smartphone,
  TestTube2,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import styles from "./presentation.module.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.eventure.cloud/api/v1";

const slides = [
  {
    section: "Opening",
    rubric: "Project overview",
    note: "Open by framing Eventure as a real production system, not a collection of isolated assignment screens. Introduce both contributors, then promise live evidence later in the deck.",
  },
  {
    section: "Product",
    rubric: "Core features",
    note: "Explain the two user journeys. The customer journey creates demand; the organizer journey supplies and operates events. Every later technical decision supports one of these journeys.",
  },
  {
    section: "Ownership",
    rubric: "Individual assessment",
    note: "Be explicit: htandiono owns Feature 1, awanstywn owns Feature 2. Shared contracts, database changes, integration testing, and production release were reviewed together.",
  },
  {
    section: "Feature 1",
    rubric: "Frontend + core flow",
    note: "This is htandiono's primary section. Demonstrate discovery, organizer event resources, transactional checkout, lifecycle deadlines, rollback, and post-attendance reviews.",
  },
  {
    section: "Feature 2",
    rubric: "Auth + dashboard",
    note: "This is awanstywn's primary section. Cover authentication, referral rewards, profile management, organizer operations, analytics, cloud uploads, and notification email.",
  },
  {
    section: "Requirements",
    rubric: "Seven core requirements",
    note: "Walk around the seven numbered requirements. Emphasize that they meet inside one end-to-end product flow rather than existing as unrelated checklist items.",
  },
  {
    section: "Transactions",
    rubric: "SQL transactions + edge cases",
    note: "Explain why status changes cannot be skipped. Point out the two-hour proof deadline, three-day organizer deadline, and single atomic restoration operation for seats and benefits.",
  },
  {
    section: "Architecture",
    rubric: "Backend evaluation",
    note: "Trace one request from Next.js through Express validation and services to Prisma and Supabase. Mention Resend email after commit and exact-origin CORS.",
  },
  {
    section: "Frontend",
    rubric: "Frontend evaluation 20%",
    note: "Connect design polish to measurable behaviors: four responsive targets, semantic controls, visible focus, loading, error, empty, and success states, plus 350 ms debounce.",
  },
  {
    section: "Backend",
    rubric: "Backend evaluation 20%",
    note: "Explain the layered structure, Zod validation, JWT and RBAC, uniform errors, soft deletion, serializable writes, and environment-only secrets.",
  },
  {
    section: "Evidence",
    rubric: "Testing + readiness",
    note: "Use the numbers as evidence, not decoration. Distinguish seeded records from currently published upcoming events. Mention PostgreSQL CI as the database-backed release gate.",
  },
  {
    section: "Live proof",
    rubric: "Production stability",
    note: "Run both checks. Narrate the endpoint, response time, health contract, and event cities. This proves the deployed frontend can call the deployed API from the presentation origin.",
  },
  {
    section: "Live product",
    rubric: "Demo flow",
    note: "Use the embedded application for a short discovery walkthrough. Open a new tab only if you need authentication or a wider organizer workflow.",
  },
  {
    section: "Defense",
    rubric: "Code understanding",
    note: "Route questions to the primary owner, then explain shared seams together. Each presenter should explain why the design was chosen, the edge cases, and one improvement they would make next.",
  },
  {
    section: "Close",
    rubric: "Presentation",
    note: "Resolve the opening: Eventure is deployed, testable, documented, and owned. Invite the examiner to choose a live flow or ask for a code-level explanation.",
  },
] as const;

interface HealthBody {
  success: boolean;
  message: string;
  data: { status: string; timestamp: string };
}

interface EventItem {
  city: string;
  name: string;
}

interface EventsBody {
  success: boolean;
  data: {
    data: EventItem[];
    total: number;
  };
}

interface ApiResult {
  cities: string[];
  eventCount: number;
  firstEvent: string;
  health: string;
  latency: number;
  timestamp: string;
}

export function PresentationDeck() {
  const [current, setCurrent] = useState(0);
  const [notesOpen, setNotesOpen] = useState(false);
  const [apiState, setApiState] = useState<"idle" | "running" | "success" | "error">("idle");
  const [apiResult, setApiResult] = useState<ApiResult | null>(null);
  const [apiError, setApiError] = useState("");
  const touchStart = useRef<number | null>(null);
  const activeSlide = slides[current] ?? slides[0];
  const isDarkSlide = [0, 9, 11, 14].includes(current);

  const goTo = useCallback((index: number) => {
    setCurrent(Math.min(Math.max(index, 0), slides.length - 1));
  }, []);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const previous = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["BUTTON", "INPUT", "A"].includes(target.tagName)) return;

      if (["ArrowRight", "PageDown", " "].includes(event.key)) {
        event.preventDefault();
        next();
      }
      if (["ArrowLeft", "PageUp"].includes(event.key)) {
        event.preventDefault();
        previous();
      }
      if (event.key === "Home") goTo(0);
      if (event.key === "End") goTo(slides.length - 1);
      if (event.key.toLowerCase() === "n") setNotesOpen((open) => !open);
      if (event.key.toLowerCase() === "f") void toggleFullscreen();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goTo, next, previous]);

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      // Browsers can deny fullscreen without a direct user gesture.
    }
  }

  async function runApiCheck() {
    setApiState("running");
    setApiError("");
    const startedAt = performance.now();

    try {
      const [healthResponse, eventsResponse] = await Promise.all([
        fetch(`${API_URL}/health`, { cache: "no-store" }),
        fetch(`${API_URL}/events?limit=24`, { cache: "no-store" }),
      ]);

      if (!healthResponse.ok || !eventsResponse.ok) {
        throw new Error(`API returned ${healthResponse.status}/${eventsResponse.status}`);
      }

      const health = (await healthResponse.json()) as HealthBody;
      const events = (await eventsResponse.json()) as EventsBody;
      const cities = [...new Set(events.data.data.map((event) => event.city))].sort();

      setApiResult({
        cities,
        eventCount: events.data.total,
        firstEvent: events.data.data[0]?.name ?? "No upcoming events",
        health: health.data.status,
        latency: Math.round(performance.now() - startedAt),
        timestamp: health.data.timestamp,
      });
      setApiState("success");
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "The API check could not be completed.");
      setApiState("error");
    }
  }

  function renderSlide() {
    switch (current) {
      case 0:
        return (
          <section
            className={`${styles.slide} ${styles.heroSlide}`}
            aria-labelledby="slide-title-0"
          >
            <div className={styles.heroTicket} aria-hidden="true">
              <span>ADMIT TWO</span>
              <strong>EV</strong>
              <small>JKT · BDG · SBY</small>
            </div>
            <div className={styles.heroCopy}>
              <p className={styles.kicker}>Mini Project · Production Walkthrough</p>
              <h1 id="slide-title-0">Eventure</h1>
              <p className={styles.heroLead}>
                A production-ready event platform built for meaningful moments across Indonesia.
              </p>
              <div className={styles.heroByline}>
                <span>Feature 1 · htandiono</span>
                <span>Feature 2 · awanstywn</span>
              </div>
            </div>
            <p className={styles.heroHint}>Press → to begin</p>
          </section>
        );
      case 1:
        return (
          <section className={styles.slide} aria-labelledby="slide-title-1">
            <SlideHeading
              eyebrow="The product"
              title="One platform, two complete journeys."
              id="slide-title-1"
            />
            <div className={styles.journeyGrid}>
              <div className={styles.journey}>
                <span className={styles.journeyNumber}>01</span>
                <Users aria-hidden="true" />
                <h3>Attendees discover a moment</h3>
                <p>
                  Search Indonesian events, compare tickets, apply benefits, upload payment proof,
                  track status, then review after attending.
                </p>
                <div className={styles.flowLine}>
                  Discover <ArrowRight /> Checkout <ArrowRight /> Attend
                </div>
              </div>
              <div className={`${styles.journey} ${styles.journeyDark}`}>
                <span className={styles.journeyNumber}>02</span>
                <Cloud aria-hidden="true" />
                <h3>Organizers run the whole room</h3>
                <p>
                  Create events and inventory, launch vouchers, review proof, monitor attendees, and
                  understand revenue over time.
                </p>
                <div className={styles.flowLine}>
                  Publish <ArrowRight /> Operate <ArrowRight /> Learn
                </div>
              </div>
            </div>
          </section>
        );
      case 2:
        return (
          <section className={styles.slide} aria-labelledby="slide-title-2">
            <SlideHeading
              eyebrow="Shared responsibility"
              title="Two owners. One shared contract."
              id="slide-title-2"
            />
            <div className={styles.ownershipStage}>
              <article className={styles.ownerColumn}>
                <p className={styles.ownerLabel}>Feature 1 · htandiono</p>
                <h3>Events and transactions</h3>
                <ul>
                  <li>Discovery, details, search, filters</li>
                  <li>Event, ticket, and voucher CRUD</li>
                  <li>Checkout, deadlines, rollback</li>
                  <li>Attendance-gated reviews</li>
                </ul>
              </article>
              <div className={styles.sharedSpine}>
                <GitBranch aria-hidden="true" />
                <span>Shared contracts</span>
                <span>Prisma schema</span>
                <span>Integration tests</span>
                <span>Release review</span>
              </div>
              <article className={`${styles.ownerColumn} ${styles.ownerColumnTeal}`}>
                <p className={styles.ownerLabel}>Feature 2 · awanstywn</p>
                <h3>Accounts and operations</h3>
                <ul>
                  <li>JWT authentication and RBAC</li>
                  <li>Referrals, rewards, profiles</li>
                  <li>Organizer dashboard and proof decisions</li>
                  <li>Cloud uploads and email</li>
                </ul>
              </article>
            </div>
            <p className={styles.takeaway}>
              Primary ownership stays visible; integration seams are reviewed together.
            </p>
          </section>
        );
      case 3:
        return (
          <section className={styles.slide} aria-labelledby="slide-title-3">
            <div className={styles.featureIntro}>
              <span className={styles.featureIndex}>01</span>
              <div>
                <p className={styles.kicker}>htandiono · Feature 1</p>
                <h2 id="slide-title-3">
                  The customer flow stays consistent from search to review.
                </h2>
              </div>
            </div>
            <div className={styles.featureRail}>
              <FeatureBeat
                number="01"
                title="Find"
                detail="350 ms debounce, backend search, category, city, sort, pagination"
              />
              <FeatureBeat
                number="02"
                title="Publish"
                detail="Organizer-scoped event, ticket type, and voucher lifecycle"
              />
              <FeatureBeat
                number="03"
                title="Purchase"
                detail="IDR pricing, points, coupon, voucher, capacity reservation"
              />
              <FeatureBeat
                number="04"
                title="Resolve"
                detail="Six statuses, deadlines, complete compensation, attended reviews"
              />
            </div>
            <div className={styles.evidenceStrip}>
              <strong>26 documented development steps</strong>
              <span>Serializable checkout</span>
              <span>One-time rollback guard</span>
              <span>Responsive customer and organizer UI</span>
            </div>
          </section>
        );
      case 4:
        return (
          <section className={styles.slide} aria-labelledby="slide-title-4">
            <div className={styles.featureIntro}>
              <span className={`${styles.featureIndex} ${styles.featureIndexTeal}`}>02</span>
              <div>
                <p className={styles.kicker}>awanstywn · Feature 2</p>
                <h2 id="slide-title-4">Identity becomes a trusted organizer workspace.</h2>
              </div>
            </div>
            <div className={styles.featureTwoLayout}>
              <div className={styles.featureTwoPath}>
                <FeatureBeat
                  number="01"
                  title="Enter securely"
                  detail="Registration, login/logout, hashing, JWT, protected routes, RBAC"
                />
                <FeatureBeat
                  number="02"
                  title="Grow through referrals"
                  detail="Immutable codes, 10,000 points, expiring coupons, profile controls"
                />
                <FeatureBeat
                  number="03"
                  title="Operate events"
                  detail="Proof decisions, attendees, summary metrics, date-filtered charts"
                />
                <FeatureBeat
                  number="04"
                  title="Communicate"
                  detail="Supabase-hosted images and asynchronous HTML email via Resend"
                />
              </div>
              <div className={styles.dashboardSketch} aria-label="Organizer dashboard summary">
                <div className={styles.dashboardTop}>
                  <span>Organizer pulse</span>
                  <span>Jul 2026</span>
                </div>
                <div className={styles.metricRow}>
                  <strong>3</strong>
                  <span>summary metrics</span>
                </div>
                <div className={styles.chartBars}>
                  {[42, 68, 51, 88, 74, 96].map((height, index) => (
                    <i key={index} style={{ height: `${height}%` }} />
                  ))}
                </div>
                <small>Backend COUNT · SUM · AVG · GROUP BY</small>
              </div>
            </div>
          </section>
        );
      case 5:
        return (
          <section className={styles.slide} aria-labelledby="slide-title-5">
            <SlideHeading
              eyebrow="Core requirements · 20%"
              title="All seven requirements meet inside one production flow."
              id="slide-title-5"
            />
            <div className={styles.requirementOrbit}>
              <div className={styles.requirementCore}>
                <strong>Eventure</strong>
                <span>end to end</span>
              </div>
              <Requirement number="1" label="Auth + RBAC" className={styles.reqOne} />
              <Requirement number="2" label="CRUD + relations" className={styles.reqTwo} />
              <Requirement number="3" label="Search + pagination" className={styles.reqThree} />
              <Requirement number="4" label="Transactional flow" className={styles.reqFour} />
              <Requirement number="5" label="Dashboard + charts" className={styles.reqFive} />
              <Requirement number="6" label="Cloud upload" className={styles.reqSix} />
              <Requirement number="7" label="HTML mailer" className={styles.reqSeven} />
            </div>
            <p className={styles.takeaway}>
              The demo sequence proves the relationships between requirements—not just their
              presence.
            </p>
          </section>
        );
      case 6:
        return (
          <section className={styles.slide} aria-labelledby="slide-title-6">
            <SlideHeading
              eyebrow="The critical business flow"
              title="Every transaction has a guarded next state."
              id="slide-title-6"
            />
            <div className={styles.statusFlow}>
              <Status name="Waiting for payment" tone="gold" />
              <ArrowRight />
              <Status name="Waiting for confirmation" tone="coral" />
              <ArrowRight />
              <Status name="Done" tone="teal" />
            </div>
            <div className={styles.branchFlow}>
              <div>
                <span>2 hours</span>
                <strong>Expired</strong>
                <small>No proof uploaded</small>
              </div>
              <div>
                <span>User action</span>
                <strong>Canceled</strong>
                <small>Before proof review</small>
              </div>
              <div>
                <span>Organizer</span>
                <strong>Rejected</strong>
                <small>Proof not accepted</small>
              </div>
              <div>
                <span>3 days</span>
                <strong>Canceled</strong>
                <small>No organizer decision</small>
              </div>
            </div>
            <div className={styles.rollbackCallout}>
              <RefreshCw aria-hidden="true" />
              <p>
                <strong>One atomic compensation path</strong> restores seats, ticket inventory,
                voucher usage, coupons, and points exactly once.
              </p>
              <span>Prisma transaction + conditional status update</span>
            </div>
          </section>
        );
      case 7:
        return (
          <section className={styles.slide} aria-labelledby="slide-title-7">
            <SlideHeading
              eyebrow="System architecture"
              title="Each layer has one job—and one testable boundary."
              id="slide-title-7"
            />
            <div className={styles.architecture}>
              <ArchitectureLayer
                icon={<Smartphone />}
                label="Experience"
                title="Next.js + TypeScript"
                detail="Responsive UI, protected pages, typed API client"
              />
              <ArrowRight className={styles.archArrow} />
              <ArchitectureLayer
                icon={<ShieldCheck />}
                label="Application"
                title="Express + Zod"
                detail="REST routes, JWT/RBAC, validation, uniform errors"
              />
              <ArrowRight className={styles.archArrow} />
              <ArchitectureLayer
                icon={<Database />}
                label="Data"
                title="Prisma + PostgreSQL"
                detail="13 entities, relationships, soft delete, SQL transactions"
              />
            </div>
            <div className={styles.integrationBand}>
              <span>
                <Cloud /> Supabase database + storage
              </span>
              <span>
                <Mail /> Nodemailer + Resend
              </span>
              <span>
                <GitBranch /> GitHub Actions + protected main
              </span>
              <span>
                <Cloud /> Vercel web + API
              </span>
            </div>
          </section>
        );
      case 8:
        return (
          <section className={styles.slide} aria-labelledby="slide-title-8">
            <SlideHeading
              eyebrow="Frontend evaluation · 20%"
              title="Polish is a behavior, not a screenshot."
              id="slide-title-8"
            />
            <div className={styles.qualityComposition}>
              <div className={styles.typeSpecimen}>
                <span>Events worth showing up for</span>
                <strong>Find your next great story.</strong>
                <p>Editorial display type meets restrained, readable interface copy.</p>
              </div>
              <div className={styles.qualityList}>
                <QualityItem
                  icon={<Search />}
                  title="350 ms debounce"
                  detail="Stale requests cancel; search stays on the backend."
                />
                <QualityItem
                  icon={<Smartphone />}
                  title="Four responsive targets"
                  detail="375, 768, 1024, and 1440 px behavior is documented."
                />
                <QualityItem
                  icon={<CheckCircle2 />}
                  title="Every UI state"
                  detail="Loading, empty, error, confirmation, and success paths."
                />
                <QualityItem
                  icon={<ShieldCheck />}
                  title="Accessible by design"
                  detail="Semantic structure, labels, focus, keyboard, reduced motion."
                />
              </div>
            </div>
          </section>
        );
      case 9:
        return (
          <section
            className={`${styles.slide} ${styles.backendSlide}`}
            aria-labelledby="slide-title-9"
          >
            <SlideHeading
              eyebrow="Backend evaluation · 20%"
              title="Business rules live behind the API boundary."
              id="slide-title-9"
              light
            />
            <div className={styles.codeWindow}>
              <div className={styles.codeChrome}>
                <i />
                <i />
                <i />
                <span>checkout.service.ts</span>
              </div>
              <pre>
                <code>
                  <span>validate</span>(input){"\n"}
                  <span>authorize</span>(customer){"\n"}
                  <span>transaction</span>(async tx =&gt; {"{"}
                  {"\n"} reserveAndRedeem(tx){"\n"} persistInvoice(tx){"\n"}
                  {"}"}) // commit or rollback
                </code>
              </pre>
            </div>
            <div className={styles.backendPrinciples}>
              <div>
                <strong>Secure</strong>
                <span>JWT, RBAC, hashing, exact-origin CORS, environment secrets</span>
              </div>
              <div>
                <strong>Consistent</strong>
                <span>Zod validation, global handler, standard success/error envelope</span>
              </div>
              <div>
                <strong>Recoverable</strong>
                <span>Serializable writes, rollback, cloud cleanup, idempotent transitions</span>
              </div>
            </div>
          </section>
        );
      case 10:
        return (
          <section className={styles.slide} aria-labelledby="slide-title-10">
            <SlideHeading
              eyebrow="Testing + industry readiness"
              title="The evidence is repeatable—from commit to production."
              id="slide-title-10"
            />
            <div className={styles.numberStage}>
              <BigNumber value="66" label="database-independent tests" />
              <BigNumber value="39" label="seeded Indonesian events" />
              <BigNumber value="40" label="realistic transaction states" />
              <BigNumber value="85+" label="meaningful commits" />
            </div>
            <div className={styles.readinessLine}>
              <span>
                <TestTube2 /> PostgreSQL migrations and integration suites gate CI
              </span>
              <span>
                <GitBranch /> Feature branches → develop → reviewed main
              </span>
              <span>
                <Cloud /> Production on Vercel + Supabase
              </span>
            </div>
            <p className={styles.rubricNote}>
              Rubric note: the overview assigns Industry Readiness and Code Understanding 15% each;
              detailed pages also score Presentation separately. This walkthrough covers all three.
            </p>
          </section>
        );
      case 11:
        return (
          <section
            className={`${styles.slide} ${styles.apiSlide}`}
            aria-labelledby="slide-title-11"
          >
            <SlideHeading
              eyebrow="Live production proof"
              title="Test the deployed API without leaving the deck."
              id="slide-title-11"
              light
            />
            <div className={styles.apiConsole}>
              <div className={styles.apiConsoleHeader}>
                <div>
                  <span className={styles.liveDot} /> api.eventure.cloud
                </div>
                <button
                  type="button"
                  onClick={() => void runApiCheck()}
                  disabled={apiState === "running"}
                >
                  {apiState === "running" ? <RefreshCw className={styles.spinning} /> : <Play />}
                  {apiState === "running" ? "Running checks…" : "Run live checks"}
                </button>
              </div>
              <div className={styles.endpointList}>
                <code>GET /api/v1/health</code>
                <code>GET /api/v1/events?limit=24</code>
              </div>
              <div className={styles.apiResult} aria-live="polite">
                {apiState === "idle" && (
                  <p>
                    Ready. The check calls the public production endpoints and summarizes the real
                    response.
                  </p>
                )}
                {apiState === "running" && <p>Contacting Vercel and the Supabase-backed API…</p>}
                {apiState === "error" && (
                  <p className={styles.apiError}>Check failed: {apiError}</p>
                )}
                {apiState === "success" && apiResult && (
                  <>
                    <div>
                      <span>API</span>
                      <strong>{apiResult.health === "ok" ? "Healthy" : apiResult.health}</strong>
                    </div>
                    <div>
                      <span>Round trip</span>
                      <strong>{apiResult.latency} ms</strong>
                    </div>
                    <div>
                      <span>Published events</span>
                      <strong>{apiResult.eventCount}</strong>
                    </div>
                    <p>
                      <b>Cities:</b> {apiResult.cities.join(" · ")}
                    </p>
                    <p>
                      <b>Next result:</b> {apiResult.firstEvent}
                    </p>
                  </>
                )}
              </div>
            </div>
          </section>
        );
      case 12:
        return (
          <section className={styles.slide} aria-labelledby="slide-title-12">
            <div className={styles.liveDemoHeader}>
              <div>
                <p className={styles.kicker}>Live product</p>
                <h2 id="slide-title-12">The production app is inside the presentation.</h2>
              </div>
              <a href="https://eventure.cloud" target="_blank" rel="noreferrer">
                Open full screen <ExternalLink />
              </a>
            </div>
            <div className={styles.browserFrame}>
              <div className={styles.browserChrome}>
                <i />
                <i />
                <i />
                <span>eventure.cloud</span>
              </div>
              <iframe
                src="https://eventure.cloud"
                title="Live Eventure production application"
                loading="lazy"
              />
            </div>
          </section>
        );
      case 13:
        return (
          <section className={styles.slide} aria-labelledby="slide-title-13">
            <SlideHeading
              eyebrow="Individual code understanding"
              title="Each answer starts with an owner—and ends at the shared seam."
              id="slide-title-13"
            />
            <div className={styles.defenseGrid}>
              <article>
                <span>Ask htandiono</span>
                <h3>Why is checkout serializable?</h3>
                <p>To prevent overselling and double redemption under concurrent requests.</p>
                <h3>How does rollback stay idempotent?</h3>
                <p>A conditional status transition ensures compensation runs once.</p>
              </article>
              <article>
                <span>Ask awanstywn</span>
                <h3>Where is authorization enforced?</h3>
                <p>
                  Backend middleware and role guards protect sensitive APIs; the frontend also
                  blocks mismatched pages.
                </p>
                <h3>Why aggregate dashboard data in SQL?</h3>
                <p>COUNT, SUM, AVG, and GROUP BY keep calculation authoritative and scalable.</p>
              </article>
              <article className={styles.sharedDefense}>
                <span>Ask both</span>
                <h3>How were conflicting features merged safely?</h3>
                <p>
                  Shared DTOs and Prisma contracts were agreed first, merged into develop, then
                  verified together before production.
                </p>
              </article>
            </div>
          </section>
        );
      default:
        return (
          <section
            className={`${styles.slide} ${styles.closingSlide}`}
            aria-labelledby="slide-title-14"
          >
            <p className={styles.kicker}>The takeaway</p>
            <h2 id="slide-title-14">
              Ready to defend.
              <br />
              Not just ready to demo.
            </h2>
            <p>
              Eventure connects thoughtful product design, guarded business logic, clear ownership,
              repeatable tests, and a verified production release.
            </p>
            <div className={styles.closingLinks}>
              <a href="https://eventure.cloud" target="_blank" rel="noreferrer">
                eventure.cloud <ExternalLink />
              </a>
              <a href="https://api.eventure.cloud/api/v1/health" target="_blank" rel="noreferrer">
                API health <ExternalLink />
              </a>
              <a
                href="https://github.com/htandiono/mini-project-event-management-platform"
                target="_blank"
                rel="noreferrer"
              >
                GitHub repository <ExternalLink />
              </a>
            </div>
            <div className={styles.closingMark}>E</div>
          </section>
        );
    }
  }

  return (
    <div
      className={styles.deck}
      data-dark={isDarkSlide}
      onTouchStart={(event) => {
        touchStart.current = event.changedTouches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        const start = touchStart.current;
        const end = event.changedTouches[0]?.clientX;
        if (start == null || end == null) return;
        if (start - end > 60) next();
        if (end - start > 60) previous();
        touchStart.current = null;
      }}
    >
      <header className={styles.deckHeader}>
        <div className={styles.deckBrand}>
          <span>E</span>
          <strong>Eventure</strong>
        </div>
        <div className={styles.sectionLabel}>
          <span>{activeSlide.section}</span>
          <small>{activeSlide.rubric}</small>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            onClick={() => setNotesOpen((open) => !open)}
            aria-pressed={notesOpen}
          >
            N <span>Notes</span>
          </button>
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            aria-label="Toggle full screen"
          >
            <Maximize />
          </button>
        </div>
      </header>

      <main className={styles.stage}>{renderSlide()}</main>

      <nav className={styles.deckControls} aria-label="Presentation navigation">
        <button
          type="button"
          onClick={previous}
          disabled={current === 0}
          aria-label="Previous slide"
        >
          <ChevronLeft />
        </button>
        <div className={styles.slideDots}>
          {slides.map((slide, index) => (
            <button
              key={slide.section + index}
              type="button"
              className={index === current ? styles.activeDot : undefined}
              onClick={() => goTo(index)}
              aria-label={`Go to slide ${index + 1}: ${slide.section}`}
              aria-current={index === current ? "step" : undefined}
            />
          ))}
        </div>
        <span className={styles.counter}>
          <b>{String(current + 1).padStart(2, "0")}</b> / {String(slides.length).padStart(2, "0")}
        </span>
        <button
          type="button"
          onClick={next}
          disabled={current === slides.length - 1}
          aria-label="Next slide"
        >
          <ChevronRight />
        </button>
      </nav>

      <div className={styles.progress} aria-hidden="true">
        <span style={{ width: `${((current + 1) / slides.length) * 100}%` }} />
      </div>
      <p className={styles.srStatus} aria-live="polite">
        Slide {current + 1} of {slides.length}: {activeSlide.section}
      </p>

      {notesOpen && (
        <aside className={styles.notes} aria-label="Speaker notes">
          <div>
            <span>Speaker note · {String(current + 1).padStart(2, "0")}</span>
            <button
              type="button"
              onClick={() => setNotesOpen(false)}
              aria-label="Close speaker notes"
            >
              <X />
            </button>
          </div>
          <p>{activeSlide.note}</p>
          <small>Keyboard: ← → navigate · N notes · F full screen · Home/End jump</small>
        </aside>
      )}
    </div>
  );
}

function SlideHeading({
  eyebrow,
  title,
  id,
  light = false,
}: {
  eyebrow: string;
  title: string;
  id: string;
  light?: boolean;
}) {
  return (
    <div className={`${styles.slideHeading} ${light ? styles.slideHeadingLight : ""}`}>
      <p>{eyebrow}</p>
      <h2 id={id}>{title}</h2>
    </div>
  );
}

function FeatureBeat({ number, title, detail }: { number: string; title: string; detail: string }) {
  return (
    <div className={styles.featureBeat}>
      <span>{number}</span>
      <strong>{title}</strong>
      <p>{detail}</p>
    </div>
  );
}

function Requirement({
  number,
  label,
  className,
}: {
  number: string;
  label: string;
  className?: string;
}) {
  return (
    <div className={`${styles.requirement} ${className ?? ""}`}>
      <span>{number}</span>
      <strong>{label}</strong>
    </div>
  );
}

function Status({ name, tone }: { name: string; tone: "gold" | "coral" | "teal" }) {
  const toneClass =
    {
      gold: styles.statusGold,
      coral: styles.statusCoral,
      teal: styles.statusTeal,
    }[tone] ?? "";

  return (
    <div className={`${styles.status} ${toneClass}`}>
      <span>{name}</span>
    </div>
  );
}

function ArchitectureLayer({
  icon,
  label,
  title,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  title: string;
  detail: string;
}) {
  return (
    <article className={styles.architectureLayer}>
      <div>
        {icon}
        <span>{label}</span>
      </div>
      <h3>{title}</h3>
      <p>{detail}</p>
    </article>
  );
}

function QualityItem({
  icon,
  title,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div className={styles.qualityItem}>
      <span>{icon}</span>
      <div>
        <strong>{title}</strong>
        <p>{detail}</p>
      </div>
    </div>
  );
}

function BigNumber({ value, label }: { value: string; label: string }) {
  return (
    <div className={styles.bigNumber}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
