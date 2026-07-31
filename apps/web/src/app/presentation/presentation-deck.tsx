"use client";

import {
  ArrowDown,
  ArrowRight,
  BarChart3,
  Check,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Code2,
  Database,
  ExternalLink,
  GitBranch,
  GitMerge,
  Globe2,
  Layers3,
  Mail,
  Maximize,
  Play,
  RefreshCw,
  ShieldCheck,
  UploadCloud,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import styles from "./presentation.module.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.eventure.cloud/api/v1";

const slides = [
  {
    section: "Opening",
    rubric: "Project overview",
    tone: "paper",
    note: "Introduce this as a technical mini-project presentation. State the two-person ownership split immediately. The purpose is to explain what was built, how the parts connect, and how we verified the result.",
  },
  {
    section: "Scope",
    rubric: "Assignment brief",
    tone: "paper",
    note: "Summarize the assignment as one connected system: event discovery, customer transactions, and organizer operations. We will map implementation evidence to every evaluation category, including both scoring tables in the brief.",
  },
  {
    section: "Responsibility",
    rubric: "Individual assessment",
    tone: "paper",
    note: "Be explicit about ownership. htandiono presents Feature 1. awanstywn presents Feature 2. Shared contracts, database boundaries, reviews, integration tests, and release work were coordinated by both contributors.",
  },
  {
    section: "System flow",
    rubric: "End-to-end behavior",
    tone: "paper",
    note: "Follow the customer and organizer journeys from opposite sides. Their shared boundary is Transaction: Feature 1 creates and restores it, while Feature 2 reviews payment and reports on it.",
  },
  {
    section: "Architecture",
    rubric: "Libraries and connections",
    tone: "ink",
    note: "Trace one request through Next.js, the shared contract, Express middleware, a service, Prisma, and PostgreSQL. Storage and email are side effects performed through Supabase Storage and Nodemailer with Resend.",
  },
  {
    section: "Database",
    rubric: "Relational design",
    tone: "paper",
    note: "The source schema contains 12 models, exceeding the minimum of seven. Explain the two join models and the shared Transaction boundary. Money is whole rupiah, timestamps are UTC, and soft deletion uses deletedAt.",
  },
  {
    section: "Feature 1",
    rubric: "htandiono",
    tone: "paper",
    note: "htandiono explains discovery and search, event resource CRUD, checkout calculations, payment deadlines, rollback, and reviews. Mention backend pagination and the 350 millisecond debounce as measurable requirements.",
  },
  {
    section: "Feature 2",
    rubric: "awanstywn",
    tone: "paper",
    note: "awanstywn explains authentication and RBAC, referrals and expiring rewards, profile uploads and password recovery, organizer decisions, analytics, attendee lists, and email notifications.",
  },
  {
    section: "Transaction safety",
    rubric: "SQL transactions",
    tone: "paper",
    note: "Explain the permitted state transitions. Checkout reserves seats and benefits atomically. Expiry, cancellation, and rejection reuse one compensating transaction so seats, points, coupons, and voucher usage cannot drift apart.",
  },
  {
    section: "API reference",
    rubric: "45 implemented routes",
    tone: "ink",
    note: "This is a quick-reference slide, not a slide to read line by line. Use the three tabs when an examiner asks where a behavior is exposed. Every path is verified from the Express router source and is relative to /api/v1.",
  },
  {
    section: "API example",
    rubric: "Request and response",
    tone: "paper",
    note: "Show the public GET example first, then explain the authenticated checkout body and Bearer or httpOnly-cookie authentication. Run the live checks to prove this presentation origin can call the deployed API.",
  },
  {
    section: "Evidence",
    rubric: "Scoring matrix",
    tone: "paper",
    note: "Map evidence to frontend, backend, core flow, testing, readiness, understanding, and presentation. The supplied PDF contains two different percentage allocations, so we cover every named category rather than relying on one total.",
  },
  {
    section: "Deployment and demo",
    rubric: "Production readiness",
    tone: "paper",
    note: "Explain the production topology, then use the five-step demo path. Keep the live demo focused: discovery, checkout state, organizer decision, dashboard evidence, and one API check.",
  },
  {
    section: "Defense",
    rubric: "Code understanding",
    tone: "teal",
    note: "Close with ownership and code understanding. Each contributor should explain one design choice, one failure path, and one possible improvement in their own feature. Invite the examiner to choose a route, flow, or code module.",
  },
] as const;

type ApiFamilyId = "public" | "customer" | "organizer";
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface ApiRoute {
  method: HttpMethod;
  path: string;
  purpose: string;
}

interface ApiFamily {
  id: ApiFamilyId;
  label: string;
  count: number;
  groups: Array<{ name: string; routes: ApiRoute[] }>;
}

const apiFamilies: ApiFamily[] = [
  {
    id: "public",
    label: "Public + account",
    count: 17,
    groups: [
      {
        name: "Health and catalog",
        routes: [
          { method: "GET", path: "/health", purpose: "Service status" },
          { method: "GET", path: "/events", purpose: "Search and paginate" },
          { method: "GET", path: "/events/categories", purpose: "Category filter data" },
          { method: "GET", path: "/events/:slug", purpose: "Event details" },
          { method: "GET", path: "/events/:slug/reviews", purpose: "Event reviews" },
        ],
      },
      {
        name: "Authentication",
        routes: [
          { method: "POST", path: "/auth/register", purpose: "Create account" },
          { method: "POST", path: "/auth/login", purpose: "Start session" },
          { method: "POST", path: "/auth/logout", purpose: "End session" },
          { method: "POST", path: "/auth/forgot-password", purpose: "Send reset email" },
          { method: "POST", path: "/auth/reset-password", purpose: "Apply reset token" },
        ],
      },
      {
        name: "Authenticated profile",
        routes: [
          { method: "GET", path: "/users/me", purpose: "Read profile" },
          { method: "PATCH", path: "/users/me", purpose: "Profile/avatar update" },
          { method: "PATCH", path: "/users/me/password", purpose: "Change password" },
          { method: "GET", path: "/users/me/points", purpose: "Points ledger" },
          { method: "GET", path: "/users/me/coupons", purpose: "Coupon wallet" },
          { method: "GET", path: "/users/me/referrals", purpose: "Referral history" },
          { method: "GET", path: "/users/me/orders", purpose: "Account orders" },
        ],
      },
    ],
  },
  {
    id: "customer",
    label: "Customer flow",
    count: 9,
    groups: [
      {
        name: "Checkout and orders",
        routes: [
          { method: "POST", path: "/transactions", purpose: "Create checkout" },
          { method: "GET", path: "/transactions", purpose: "List orders" },
          { method: "GET", path: "/transactions/options", purpose: "Points/coupons" },
          { method: "GET", path: "/transactions/:transactionId", purpose: "Order details" },
          {
            method: "POST",
            path: "/transactions/:transactionId/payment-proof",
            purpose: "Upload proof",
          },
          {
            method: "POST",
            path: "/transactions/:transactionId/cancel",
            purpose: "Cancel and restore",
          },
        ],
      },
      {
        name: "Post-attendance review",
        routes: [
          { method: "POST", path: "/transactions/:transactionId/review", purpose: "Create" },
          { method: "PUT", path: "/transactions/:transactionId/review", purpose: "Update" },
          { method: "DELETE", path: "/transactions/:transactionId/review", purpose: "Soft delete" },
        ],
      },
    ],
  },
  {
    id: "organizer",
    label: "Organizer flow",
    count: 19,
    groups: [
      {
        name: "Events",
        routes: [
          { method: "GET", path: "/organizer/events", purpose: "List owned events" },
          { method: "POST", path: "/organizer/events", purpose: "Create event" },
          { method: "GET", path: "/organizer/events/:eventId", purpose: "Read event" },
          { method: "PUT", path: "/organizer/events/:eventId", purpose: "Update event" },
          { method: "DELETE", path: "/organizer/events/:eventId", purpose: "Soft delete event" },
        ],
      },
      {
        name: "Ticket types",
        routes: [
          { method: "GET", path: "/organizer/events/:eventId/tickets", purpose: "List" },
          { method: "POST", path: "/organizer/events/:eventId/tickets", purpose: "Create" },
          {
            method: "PUT",
            path: "/organizer/events/:eventId/tickets/:ticketId",
            purpose: "Update",
          },
          {
            method: "DELETE",
            path: "/organizer/events/:eventId/tickets/:ticketId",
            purpose: "Soft delete",
          },
        ],
      },
      {
        name: "Event vouchers",
        routes: [
          { method: "GET", path: "/organizer/events/:eventId/vouchers", purpose: "List" },
          { method: "POST", path: "/organizer/events/:eventId/vouchers", purpose: "Create" },
          {
            method: "PUT",
            path: "/organizer/events/:eventId/vouchers/:voucherId",
            purpose: "Update",
          },
          {
            method: "DELETE",
            path: "/organizer/events/:eventId/vouchers/:voucherId",
            purpose: "Soft delete",
          },
        ],
      },
      {
        name: "Operations and analytics",
        routes: [
          { method: "GET", path: "/organizer/transactions", purpose: "Proof queue" },
          { method: "PATCH", path: "/organizer/transactions/:id/accept", purpose: "Accept proof" },
          {
            method: "PATCH",
            path: "/organizer/transactions/:id/reject",
            purpose: "Reject and restore",
          },
          {
            method: "PATCH",
            path: "/organizer/transactions/:id/attend",
            purpose: "Mark attendance",
          },
          { method: "GET", path: "/dashboard/statistics", purpose: "Aggregated metrics" },
          { method: "GET", path: "/dashboard/events/:id/attendees", purpose: "Attendee list" },
        ],
      },
    ],
  },
];

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
  const [apiFamily, setApiFamily] = useState<ApiFamilyId>("public");
  const [apiState, setApiState] = useState<"idle" | "running" | "success" | "error">("idle");
  const [apiResult, setApiResult] = useState<ApiResult | null>(null);
  const [apiError, setApiError] = useState("");
  const touchStart = useRef<number | null>(null);
  const activeSlide = slides[current] ?? slides[0];
  const activeApiFamily = apiFamilies.find((family) => family.id === apiFamily)!;

  const goTo = useCallback((index: number) => {
    setCurrent(Math.min(Math.max(index, 0), slides.length - 1));
  }, []);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const previous = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["BUTTON", "INPUT", "A", "TEXTAREA", "SELECT"].includes(target.tagName)) return;

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
          <section className={`${styles.slide} ${styles.cover}`} aria-labelledby="slide-0-title">
            <div className={styles.coverMark} aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <p className={styles.kicker}>Fullstack Web Development Mini Project</p>
            <h1 id="slide-0-title">Eventure</h1>
            <p className={styles.coverSubtitle}>
              Technical presentation &amp; implementation defense
            </p>
            <div className={styles.coverRule} />
            <div className={styles.coverMeta}>
              <div>
                <span>Feature 1</span>
                <strong>htandiono</strong>
              </div>
              <div>
                <span>Feature 2</span>
                <strong>awanstywn</strong>
              </div>
              <div>
                <span>Production</span>
                <strong>eventure.cloud</strong>
              </div>
            </div>
            <p className={styles.coverFoot}>
              Two contributors · one shared TypeScript architecture · deployed on Vercel
            </p>
          </section>
        );
      case 1:
        return (
          <section className={styles.slide} aria-labelledby="slide-1-title">
            <SlideHeading
              eyebrow="01 · Assignment scope"
              title="The brief asks for one connected event system"
              id="slide-1-title"
            />
            <div className={styles.scopeLayout}>
              <div className={styles.scopeStatement}>
                <p className={styles.lead}>
                  Customers discover and buy tickets. Organizers publish events, review payment, and
                  measure results.
                </p>
                <div className={styles.scopePath}>
                  <span>Discover</span>
                  <ArrowRight />
                  <span>Checkout</span>
                  <ArrowRight />
                  <span>Operate</span>
                  <ArrowRight />
                  <span>Evaluate</span>
                </div>
              </div>
              <div className={styles.rubricGrid}>
                {[
                  ["Frontend", "Responsive UX, states, validation"],
                  ["Backend", "REST, RBAC, errors, relations"],
                  ["Core flow", "Transactions, dashboard, upload, email"],
                  ["Testing", "Unit and integration evidence"],
                  ["Readiness", "Git, docs, security, deployment"],
                  ["Understanding", "Individual code defense"],
                ].map(([title, detail], index) => (
                  <article key={title}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <strong>{title}</strong>
                      <p>{detail}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
            <Takeaway>
              Our presentation follows the implementation flow, then maps it back to the scoring
              matrix.
            </Takeaway>
          </section>
        );
      case 2:
        return (
          <section className={styles.slide} aria-labelledby="slide-2-title">
            <SlideHeading
              eyebrow="02 · Team responsibility"
              title="Ownership stays clear at every shared boundary"
              id="slide-2-title"
            />
            <div
              className={styles.branchMap}
              role="img"
              aria-label="Develop branches into Feature 1 and Feature 2, both return through reviewed pull requests, then develop is released to main"
            >
              <div className={styles.branchSource}>
                <small>Shared baseline</small>
                <strong>develop</strong>
              </div>
              <div className={styles.branchAction}>
                <GitBranch />
                <span>branch</span>
              </div>
              <div className={styles.parallelBranches}>
                <div className={styles.featureOneBranch}>
                  <span>Feature 1</span>
                  <strong>events + transactions</strong>
                </div>
                <div className={styles.featureTwoBranch}>
                  <span>Feature 2</span>
                  <strong>accounts + dashboard</strong>
                </div>
              </div>
              <div className={styles.branchAction}>
                <GitMerge />
                <span>reviewed PRs</span>
              </div>
              <div className={styles.branchDevelop}>
                <small>Integration + CI</small>
                <strong>develop</strong>
              </div>
              <div className={styles.branchAction}>
                <ArrowRight />
                <span>release PR</span>
              </div>
              <div className={styles.branchMain}>
                <small>Production</small>
                <strong>main</strong>
              </div>
            </div>
            <div className={styles.ownershipStrip}>
              <div>
                <span>Feature 1 / htandiono</span>
                <strong>Discovery · CRUD · checkout · lifecycle · reviews</strong>
              </div>
              <div>
                <span>Feature 2 / awanstywn</span>
                <strong>Auth · rewards · profile · operations · analytics</strong>
              </div>
              <div>
                <span>Shared review</span>
                <strong>Contracts · Prisma · rollback · CI · release</strong>
              </div>
            </div>
          </section>
        );
      case 3:
        return (
          <section className={styles.slide} aria-labelledby="slide-3-title">
            <SlideHeading
              eyebrow="03 · End-to-end flow"
              title="Two user journeys meet at the transaction"
              id="slide-3-title"
            />
            <div className={styles.flowBoard}>
              <FlowLane
                label="Customer"
                owner="Feature 1 + account access"
                steps={[
                  "Search events",
                  "Choose ticket",
                  "Apply benefit",
                  "Upload proof",
                  "Attend & review",
                ]}
                accent="coral"
              />
              <div className={styles.flowBoundary}>
                <span>Shared boundary</span>
                <strong>Transaction</strong>
                <p>
                  Status, ticket items, payment proof, points, coupon and review stay relationally
                  connected.
                </p>
              </div>
              <FlowLane
                label="Organizer"
                owner="Feature 1 resources + Feature 2 operations"
                steps={[
                  "Publish event",
                  "Manage inventory",
                  "Review payment",
                  "Mark attendance",
                  "Read analytics",
                ]}
                accent="teal"
              />
            </div>
            <Takeaway>
              Frontend actions call the same API contracts; role checks decide which journey can
              continue.
            </Takeaway>
          </section>
        );
      case 4:
        return (
          <section
            className={`${styles.slide} ${styles.darkSlide}`}
            aria-labelledby="slide-4-title"
          >
            <SlideHeading
              eyebrow="04 · System architecture"
              title="Each library has one clear responsibility"
              id="slide-4-title"
              light
            />
            <div className={styles.architectureFlow}>
              <ArchitectureNode
                icon={<Globe2 />}
                label="Browser"
                title="Next.js + React"
                detail="Routes, forms, responsive UI, React Query"
              />
              <ArrowRight className={styles.archArrow} />
              <ArchitectureNode
                icon={<ShieldCheck />}
                label="HTTP boundary"
                title="Express + Zod"
                detail="REST, validation, JWT, RBAC, error contract"
              />
              <ArrowRight className={styles.archArrow} />
              <ArchitectureNode
                icon={<Layers3 />}
                label="Business logic"
                title="Services"
                detail="Rules, deadlines, calculations, aggregations"
              />
              <ArrowRight className={styles.archArrow} />
              <ArchitectureNode
                icon={<Database />}
                label="Persistence"
                title="Prisma + PostgreSQL"
                detail="Relations, transactions, soft delete, seed"
              />
            </div>
            <div className={styles.integrationGrid}>
              <Integration
                icon={<Code2 />}
                title="@eventure/shared"
                detail="TypeScript types and Zod contracts shared by web and API"
              />
              <Integration
                icon={<UploadCloud />}
                title="Supabase Storage"
                detail="Multer-validated avatars and payment proofs"
              />
              <Integration
                icon={<Mail />}
                title="Nodemailer + Resend"
                detail="HTML account and transaction email after commit"
              />
              <Integration
                icon={<BarChart3 />}
                title="Recharts"
                detail="Organizer metrics returned by backend aggregation"
              />
            </div>
          </section>
        );
      case 5:
        return (
          <section className={styles.slide} aria-labelledby="slide-5-title">
            <SlideHeading
              eyebrow="05 · Database design"
              title="12 related models support the complete lifecycle"
              id="slide-5-title"
            />
            <div
              className={styles.erdDiagram}
              role="img"
              aria-label="Simplified Eventure entity relationship diagram centered on User, Transaction, and Event"
            >
              <div className={styles.erdCore}>
                <ErdNode name="User" detail="customer or organizer" tone="teal" />
                <div className={styles.erdConnector}>
                  <span>1</span>
                  <div>
                    <b>purchases</b>
                    <ArrowRight />
                  </div>
                  <span>many</span>
                </div>
                <ErdNode
                  name="Transaction"
                  detail="status · total · deadlines"
                  tone="gold"
                  shared
                />
                <div className={styles.erdConnector}>
                  <span>many</span>
                  <div>
                    <b>belongs to</b>
                    <ArrowRight />
                  </div>
                  <span>1</span>
                </div>
                <ErdNode name="Event" detail="organizer · category · capacity" tone="coral" />
              </div>
              <div className={styles.erdRelationGrid}>
                <ErdRelation
                  label="Catalog"
                  relation="Category 1 → many Event → many TicketType / Voucher"
                  entities={["Category", "TicketType", "Voucher"]}
                />
                <ErdRelation
                  label="Ticket selection"
                  relation="Transaction ↔ TicketType through TransactionItem"
                  entities={["TransactionItem", "TicketType"]}
                />
                <ErdRelation
                  label="Rewards"
                  relation="User ↔ Coupon through UserCoupon; points use a ledger"
                  entities={["Coupon", "UserCoupon", "PointLedger"]}
                />
                <ErdRelation
                  label="Payment outcome"
                  relation="Transaction has at most one proof and one review"
                  entities={["PaymentProof", "Review"]}
                />
              </div>
            </div>
            <Takeaway>
              <b>Transaction</b> is the shared seam; money stays in whole rupiah and main records
              use soft deletion.
            </Takeaway>
          </section>
        );
      case 6:
        return (
          <section className={styles.slide} aria-labelledby="slide-6-title">
            <SlideHeading
              eyebrow="06 · Feature 1 / htandiono"
              title="From event discovery to a completed review"
              id="slide-6-title"
            />
            <div className={styles.featureLayout}>
              <div className={styles.featureSequence}>
                <NumberedStep
                  number="1"
                  title="Discover"
                  detail="350 ms search debounce, category and city filters, sorting, backend pagination, empty state."
                />
                <NumberedStep
                  number="2"
                  title="Publish"
                  detail="Organizer CRUD for events, ticket types and limited vouchers with soft deletion."
                />
                <NumberedStep
                  number="3"
                  title="Purchase"
                  detail="Capacity checks, IDR totals, points, coupons and vouchers inside a Prisma transaction."
                />
                <NumberedStep
                  number="4"
                  title="Complete"
                  detail="Proof deadline, status tracking, cancellation/expiry restoration, attendance-gated review."
                />
              </div>
              <EvidencePanel
                label="Implementation evidence"
                items={[
                  "Public event query service",
                  "Organizer resource services",
                  "Checkout and lifecycle services",
                  "Focused web and API tests",
                ]}
                footer="Primary presenter: htandiono"
              />
            </div>
          </section>
        );
      case 7:
        return (
          <section className={styles.slide} aria-labelledby="slide-7-title">
            <SlideHeading
              eyebrow="07 · Feature 2 / awanstywn"
              title="Secure accounts drive organizer operations"
              id="slide-7-title"
            />
            <div className={styles.featureLayout}>
              <div className={styles.featureSequence}>
                <NumberedStep
                  number="1"
                  title="Authenticate"
                  detail="Registration, bcrypt hashing, JWT cookies/Bearer token, RBAC and protected layouts."
                />
                <NumberedStep
                  number="2"
                  title="Reward"
                  detail="Immutable referral codes, expiring 10,000-point credits and expiring referral coupons."
                />
                <NumberedStep
                  number="3"
                  title="Manage profile"
                  detail="Profile edits, password change/reset and validated cloud avatar replacement."
                />
                <NumberedStep
                  number="4"
                  title="Operate"
                  detail="Payment decision, attendance, three metrics, two Recharts charts, filters and HTML email."
                />
              </div>
              <EvidencePanel
                label="Implementation evidence"
                items={[
                  "Auth middleware and services",
                  "Profile/reward routes",
                  "Dashboard aggregation service",
                  "Upload and email adapters",
                ]}
                footer="Primary presenter: awanstywn"
                tone="teal"
              />
            </div>
          </section>
        );
      case 8:
        return (
          <section className={styles.slide} aria-labelledby="slide-8-title">
            <SlideHeading
              eyebrow="08 · Transaction safety"
              title="The state machine prevents invalid payment outcomes"
              id="slide-8-title"
            />
            <div className={styles.stateMachine}>
              <Status name="WAITING_FOR_PAYMENT" detail="Checkout reserves inventory" tone="gold" />
              <div className={styles.branchColumn}>
                <Transition label="proof ≤ 2 hours" />
                <Transition label="no proof" reverse />
                <Transition label="customer cancels" reverse />
              </div>
              <div className={styles.stateColumn}>
                <Status name="WAITING_FOR_CONFIRMATION" detail="Organizer has 3 days" tone="teal" />
                <div className={styles.smallStates}>
                  <Status name="EXPIRED" detail="restore" tone="muted" />
                  <Status name="CANCELED" detail="restore" tone="muted" />
                </div>
              </div>
              <div className={styles.branchColumn}>
                <Transition label="accept" />
                <Transition label="reject" reverse />
                <Transition label="timeout" reverse />
              </div>
              <div className={styles.stateColumn}>
                <Status name="DONE" detail="email + attendance" tone="ink" />
                <div className={styles.smallStates}>
                  <Status name="REJECTED" detail="restore" tone="coral" />
                  <Status name="CANCELED" detail="restore" tone="muted" />
                </div>
              </div>
            </div>
            <div className={styles.atomicBand}>
              <Database />
              <div>
                <strong>One Prisma transaction</strong>
                <p>
                  Status + seats + points + coupon + voucher usage commit together, or all changes
                  roll back.
                </p>
              </div>
            </div>
          </section>
        );
      case 9:
        return (
          <section
            className={`${styles.slide} ${styles.darkSlide}`}
            aria-labelledby="slide-9-title"
          >
            <SlideHeading
              eyebrow="09 · API quick reference"
              title="45 routes are grouped by who may call them"
              id="slide-9-title"
              light
            />
            <div className={styles.apiReferenceHeader}>
              <code>{API_URL}</code>
              <span>All paths below are relative to /api/v1</span>
            </div>
            <div className={styles.apiTabs} role="tablist" aria-label="API route families">
              {apiFamilies.map((family) => (
                <button
                  key={family.id}
                  type="button"
                  role="tab"
                  aria-selected={family.id === apiFamily}
                  className={family.id === apiFamily ? styles.activeApiTab : undefined}
                  onClick={() => setApiFamily(family.id)}
                >
                  {family.label}
                  <span>{family.count}</span>
                </button>
              ))}
            </div>
            <div
              className={styles.routeGroups}
              role="tabpanel"
              aria-label={`${activeApiFamily.label} routes`}
            >
              {activeApiFamily.groups.map((group) => (
                <section key={group.name} className={styles.routeGroup}>
                  <h3>{group.name}</h3>
                  {group.routes.map((route) => (
                    <RouteRow key={`${route.method}-${route.path}`} route={route} />
                  ))}
                </section>
              ))}
            </div>
          </section>
        );
      case 10:
        return (
          <section className={styles.slide} aria-labelledby="slide-10-title">
            <SlideHeading
              eyebrow="10 · Example call"
              title="The response contract stays predictable across routes"
              id="slide-10-title"
            />
            <div className={styles.apiExampleLayout}>
              <div className={styles.codePanel}>
                <div>
                  <span className={styles.methodGet}>GET</span>
                  <strong>Search published events</strong>
                </div>
                <pre>
                  <code>{`curl "${API_URL}/events?search=music&city=Jakarta&sort=startsAt&order=asc&page=1&limit=6"`}</code>
                </pre>
                <pre className={styles.responseCode}>
                  <code>{`{
  success: true,
  message: "Events retrieved",
  data: { data: EventSummary[], total: number,
          page: number, totalPages: number, limit: number }
}`}</code>
                </pre>
                <div className={styles.authExample}>
                  <span className={styles.methodPost}>POST</span>
                  <code>/transactions</code>
                  <p>
                    Bearer or httpOnly JWT · body: eventId, items[], voucherCode?, userCouponId?,
                    pointsToUse
                  </p>
                </div>
              </div>
              <div className={styles.liveCheck}>
                <div className={styles.liveCheckTitle}>
                  <Play />
                  <div>
                    <strong>Production API check</strong>
                    <span>Health + published catalog</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void runApiCheck()}
                  disabled={apiState === "running"}
                >
                  <RefreshCw className={apiState === "running" ? styles.spin : undefined} />
                  {apiState === "running" ? "Checking..." : "Run live checks"}
                </button>
                {apiState === "idle" && (
                  <p className={styles.liveHint}>
                    Runs two safe GET requests without leaving the deck.
                  </p>
                )}
                {apiState === "error" && <p className={styles.apiError}>{apiError}</p>}
                {apiState === "success" && apiResult && (
                  <div className={styles.apiResults}>
                    <Metric
                      value={apiResult.health === "ok" ? "Healthy" : apiResult.health}
                      label={`${apiResult.latency} ms round trip`}
                    />
                    <Metric
                      value={String(apiResult.eventCount)}
                      label="published events returned by API"
                    />
                    <Metric
                      value={apiResult.cities.join(" · ") || "No cities"}
                      label={`first: ${apiResult.firstEvent}`}
                      small
                    />
                    <small>
                      {new Date(apiResult.timestamp).toLocaleString("en-GB", {
                        timeZone: "Asia/Jakarta",
                      })}{" "}
                      WIB
                    </small>
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      case 11:
        return (
          <section className={styles.slide} aria-labelledby="slide-11-title">
            <SlideHeading
              eyebrow="11 · Evaluation evidence"
              title="Each scoring area has a concrete verification point"
              id="slide-11-title"
            />
            <div className={styles.evidenceMatrix}>
              <EvidenceRow
                area="Frontend"
                evidence="Responsive Next.js UI, form states, 350 ms search debounce"
                source="Web tests + build"
              />
              <EvidenceRow
                area="Backend"
                evidence="45 REST routes, Zod, JWT/RBAC, uniform errors, soft delete"
                source="API tests + lint"
              />
              <EvidenceRow
                area="Core features"
                evidence="SQL lifecycle, dashboard charts, cloud upload, HTML email"
                source="Service tests + live flow"
              />
              <EvidenceRow
                area="Testing"
                evidence="Vitest, Testing Library, Supertest, PostgreSQL CI"
                source="CI workflow"
              />
              <EvidenceRow
                area="Readiness"
                evidence="Atomic Git history, README/ERD, env-only secrets, deployment"
                source="GitHub + Vercel"
              />
              <EvidenceRow
                area="Understanding"
                evidence="Named owner, design reason, edge case and improvement"
                source="Individual defense"
              />
            </div>
            <p className={styles.rubricNote}>
              The brief contains two percentage allocations; this deck deliberately covers every
              named category in both tables.
            </p>
          </section>
        );
      case 12:
        return (
          <section className={styles.slide} aria-labelledby="slide-12-title">
            <SlideHeading
              eyebrow="12 · Production and demo"
              title="The live demo follows the same path as the architecture"
              id="slide-12-title"
            />
            <div className={styles.productionLayout}>
              <div className={styles.deployStack}>
                <DeployNode
                  icon={<Globe2 />}
                  title="eventure.cloud"
                  detail="Next.js web · Vercel"
                />
                <ArrowDown />
                <DeployNode
                  icon={<Code2 />}
                  title="api.eventure.cloud"
                  detail="Express serverless API · Vercel"
                />
                <ArrowDown />
                <div className={styles.deploySplit}>
                  <DeployNode
                    icon={<Database />}
                    title="PostgreSQL"
                    detail="Supabase database"
                    compact
                  />
                  <DeployNode icon={<Cloud />} title="Storage" detail="Supabase objects" compact />
                  <DeployNode icon={<Mail />} title="Email" detail="Resend SMTP" compact />
                </div>
              </div>
              <ol className={styles.demoRunbook}>
                <li>
                  <span>01</span>
                  <div>
                    <strong>Discover</strong>
                    <p>Search and filter an Indonesian event.</p>
                  </div>
                </li>
                <li>
                  <span>02</span>
                  <div>
                    <strong>Checkout</strong>
                    <p>Show pricing and the payment deadline.</p>
                  </div>
                </li>
                <li>
                  <span>03</span>
                  <div>
                    <strong>Operate</strong>
                    <p>Review proof and mark attendance.</p>
                  </div>
                </li>
                <li>
                  <span>04</span>
                  <div>
                    <strong>Measure</strong>
                    <p>Open summary cards and both charts.</p>
                  </div>
                </li>
                <li>
                  <span>05</span>
                  <div>
                    <strong>Verify</strong>
                    <p>Run the API check from slide 10.</p>
                  </div>
                </li>
              </ol>
            </div>
            <div className={styles.productionLinks}>
              <a href="https://eventure.cloud" target="_blank" rel="noreferrer">
                Open application <ExternalLink />
              </a>
              <a href={`${API_URL}/health`} target="_blank" rel="noreferrer">
                Open API health <ExternalLink />
              </a>
            </div>
          </section>
        );
      default:
        return (
          <section
            className={`${styles.slide} ${styles.closeSlide}`}
            aria-labelledby="slide-13-title"
          >
            <p className={styles.kicker}>13 · Code understanding</p>
            <h2 id="slide-13-title">We can explain the code we own—and the seams we share.</h2>
            <div className={styles.defenseGrid}>
              <div>
                <span>htandiono</span>
                <strong>Feature 1</strong>
                <p>Discovery · resources · checkout · lifecycle · reviews</p>
              </div>
              <div>
                <span>awanstywn</span>
                <strong>Feature 2</strong>
                <p>Auth · rewards · profile · operations · analytics</p>
              </div>
              <div>
                <span>Both</span>
                <strong>Integration</strong>
                <p>Contracts · data boundary · testing · release</p>
              </div>
            </div>
            <div className={styles.questionPrompt}>
              <span>Project reference</span>
              <p>Find the full source of truth on our Github Repository linked below.</p>
            </div>
            <div className={styles.closeLinks}>
              <a href="https://eventure.cloud" target="_blank" rel="noreferrer">
                eventure.cloud <ExternalLink />
              </a>
              <a
                href="https://github.com/htandiono/mini-project-event-management-platform"
                target="_blank"
                rel="noreferrer"
              >
                GitHub repository <GitBranch />
              </a>
            </div>
          </section>
        );
    }
  }

  return (
    <div
      className={styles.deck}
      data-tone={activeSlide.tone}
      onTouchStart={(event) => {
        touchStart.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        if (touchStart.current == null) return;
        const distance =
          (event.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current;
        if (Math.abs(distance) > 60) {
          if (distance < 0) next();
          else previous();
        }
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
            title="Toggle speaker notes (N)"
          >
            N <span>Notes</span>
          </button>
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            title="Full screen (F)"
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
              key={`${slide.section}-${index}`}
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

function Takeaway({ children }: { children: ReactNode }) {
  return (
    <div className={styles.takeaway}>
      <ArrowRight />
      <p>{children}</p>
    </div>
  );
}

function FlowLane({
  label,
  owner,
  steps,
  accent,
}: {
  label: string;
  owner: string;
  steps: string[];
  accent: "coral" | "teal";
}) {
  return (
    <div className={`${styles.flowLane} ${styles[accent]}`}>
      <div>
        <strong>{label}</strong>
        <span>{owner}</span>
      </div>
      <ol>
        {steps.map((step, index) => (
          <li key={step}>
            <span>{index + 1}</span>
            <p>{step}</p>
            {index < steps.length - 1 && <ArrowRight />}
          </li>
        ))}
      </ol>
    </div>
  );
}

function ArchitectureNode({
  icon,
  label,
  title,
  detail,
}: {
  icon: ReactNode;
  label: string;
  title: string;
  detail: string;
}) {
  return (
    <article className={styles.architectureNode}>
      <div>
        {icon}
        <span>{label}</span>
      </div>
      <h3>{title}</h3>
      <p>{detail}</p>
    </article>
  );
}

function Integration({ icon, title, detail }: { icon: ReactNode; title: string; detail: string }) {
  return (
    <div className={styles.integration}>
      <span>{icon}</span>
      <div>
        <strong>{title}</strong>
        <p>{detail}</p>
      </div>
    </div>
  );
}

function ErdNode({
  name,
  detail,
  tone,
  shared = false,
}: {
  name: string;
  detail: string;
  tone: "teal" | "gold" | "coral";
  shared?: boolean;
}) {
  return (
    <div className={`${styles.erdNode} ${styles[tone]} ${shared ? styles.erdShared : ""}`}>
      <span>{shared ? "shared model" : "entity"}</span>
      <strong>{name}</strong>
      <small>{detail}</small>
    </div>
  );
}

function ErdRelation({
  label,
  relation,
  entities,
}: {
  label: string;
  relation: string;
  entities: string[];
}) {
  return (
    <article className={styles.erdRelation}>
      <span>{label}</span>
      <strong>{relation}</strong>
      <div>
        {entities.map((entity) => (
          <code key={entity}>{entity}</code>
        ))}
      </div>
    </article>
  );
}

function NumberedStep({
  number,
  title,
  detail,
}: {
  number: string;
  title: string;
  detail: string;
}) {
  return (
    <div className={styles.numberedStep}>
      <span>{number}</span>
      <div>
        <strong>{title}</strong>
        <p>{detail}</p>
      </div>
    </div>
  );
}

function EvidencePanel({
  label,
  items,
  footer,
  tone = "coral",
}: {
  label: string;
  items: string[];
  footer: string;
  tone?: "coral" | "teal";
}) {
  return (
    <aside className={`${styles.evidencePanel} ${styles[tone]}`}>
      <span>{label}</span>
      <ul>
        {items.map((item) => (
          <li key={item}>
            <Check />
            {item}
          </li>
        ))}
      </ul>
      <strong>{footer}</strong>
    </aside>
  );
}

function Status({
  name,
  detail,
  tone,
}: {
  name: string;
  detail: string;
  tone: "gold" | "teal" | "ink" | "coral" | "muted";
}) {
  return (
    <div className={`${styles.status} ${styles[tone]}`}>
      <strong>{name}</strong>
      <span>{detail}</span>
    </div>
  );
}

function Transition({ label, reverse = false }: { label: string; reverse?: boolean }) {
  return (
    <div className={`${styles.transition} ${reverse ? styles.reverse : ""}`}>
      <span>{label}</span>
      <ArrowRight />
    </div>
  );
}

function RouteRow({ route }: { route: ApiRoute }) {
  return (
    <div className={styles.routeRow}>
      <span className={styles[`method${route.method}`]}>{route.method}</span>
      <code>{route.path}</code>
      <p>{route.purpose}</p>
    </div>
  );
}

function Metric({
  value,
  label,
  small = false,
}: {
  value: string;
  label: string;
  small?: boolean;
}) {
  return (
    <div className={`${styles.metric} ${small ? styles.metricSmall : ""}`}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function EvidenceRow({
  area,
  evidence,
  source,
}: {
  area: string;
  evidence: string;
  source: string;
}) {
  return (
    <div className={styles.evidenceRow}>
      <strong>{area}</strong>
      <p>{evidence}</p>
      <span>
        <Check />
        {source}
      </span>
    </div>
  );
}

function DeployNode({
  icon,
  title,
  detail,
  compact = false,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
  compact?: boolean;
}) {
  return (
    <div className={`${styles.deployNode} ${compact ? styles.deployNodeCompact : ""}`}>
      <span>{icon}</span>
      <div>
        <strong>{title}</strong>
        <p>{detail}</p>
      </div>
    </div>
  );
}
