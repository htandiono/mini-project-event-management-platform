"use client";

import type { CategorySummary, EventSummary, PaginatedData } from "@eventure/shared";
import { useEffect, useState } from "react";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getCategories, getEvents } from "@/lib/api-client";

import { EventCard } from "./event-card";
import { EmptyState } from "./ui/empty-state";
import styles from "./event-browser.module.css";

const emptyResult: PaginatedData<EventSummary> = {
  data: [],
  total: 0,
  page: 1,
  totalPages: 0,
  limit: 9,
};

type SortValue = "startsAt:asc" | "startsAt:desc" | "name:asc" | "price:asc" | "price:desc";

function splitSort(value: SortValue) {
  if (value === "startsAt:desc") return { sort: "startsAt" as const, order: "desc" as const };
  if (value === "name:asc") return { sort: "name" as const, order: "asc" as const };
  if (value === "price:asc") return { sort: "price" as const, order: "asc" as const };
  if (value === "price:desc") return { sort: "price" as const, order: "desc" as const };
  return { sort: "startsAt" as const, order: "asc" as const };
}

interface EventBrowserProps {
  initialSearch?: string;
  initialCity?: string;
}

export function EventBrowser({ initialSearch = "", initialCity = "" }: EventBrowserProps) {
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState("");
  const [city, setCity] = useState(initialCity);
  const [sortValue, setSortValue] = useState<SortValue>("startsAt:asc");
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [result, setResult] = useState(emptyResult);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);
  const { sort, order } = splitSort(sortValue);

  useEffect(() => {
    const controller = new AbortController();
    getCategories(controller.signal)
      .then(setCategories)
      .catch((reason: unknown) => {
        if (!(reason instanceof DOMException && reason.name === "AbortError")) setCategories([]);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    getEvents(
      {
        search: debouncedSearch || undefined,
        category: category || undefined,
        city: city || undefined,
        sort,
        order,
        page,
        limit: 9,
      },
      controller.signal,
    )
      .then(setResult)
      .catch((reason: unknown) => {
        if (!(reason instanceof DOMException && reason.name === "AbortError")) {
          setError(reason instanceof Error ? reason.message : "Unable to load events");
          setResult(emptyResult);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [category, city, debouncedSearch, order, page, sort]);

  function updateFilter(update: () => void) {
    setLoading(true);
    setError("");
    update();
    setPage(1);
  }

  function changePage(nextPage: number) {
    setLoading(true);
    setError("");
    setPage(nextPage);
  }

  return (
    <section className={`shell ${styles.page}`}>
      <header className={styles.intro}>
        <p className="eyebrow">Discover Indonesia</p>
        <h1>Find an event for your calendar.</h1>
        <p>
          Search by name or venue, narrow the city and category, then sort the results your way.
        </p>
      </header>

      <div className={styles.filters} aria-label="Event filters">
        <label className={styles.field}>
          <span>Search events</span>
          <input
            type="search"
            value={search}
            placeholder="Music, workshop, venue..."
            onChange={(event) => updateFilter(() => setSearch(event.target.value))}
          />
        </label>
        <label className={styles.field}>
          <span>Category</span>
          <select
            value={category}
            onChange={(event) => updateFilter(() => setCategory(event.target.value))}
          >
            <option value="">All categories</option>
            {categories.map((option) => (
              <option key={option.id} value={option.slug}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span>City</span>
          <input
            value={city}
            placeholder="Any city"
            onChange={(event) => updateFilter(() => setCity(event.target.value))}
          />
        </label>
        <label className={styles.field}>
          <span>Sort</span>
          <select
            value={sortValue}
            onChange={(event) => updateFilter(() => setSortValue(event.target.value as SortValue))}
          >
            <option value="startsAt:asc">Soonest</option>
            <option value="startsAt:desc">Latest</option>
            <option value="name:asc">Name A-Z</option>
            <option value="price:asc">Lowest price</option>
            <option value="price:desc">Highest price</option>
          </select>
        </label>
      </div>

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      <div className={styles.resultBar} aria-live="polite">
        <p className={styles.resultMeta}>
          {loading ? "Finding events..." : `${result.total} event${result.total === 1 ? "" : "s"}`}
        </p>
      </div>

      {loading ? (
        <p className={styles.loading}>Loading upcoming events...</p>
      ) : result.data.length === 0 ? (
        <EmptyState
          title="No events found"
          description="Try a broader search, another city, or clear one of the filters."
        />
      ) : (
        <div className="event-grid">
          {result.data.map((event, index) => (
            <EventCard
              key={event.id}
              event={event}
              accent={(["coral", "teal", "gold"] as const)[index % 3] ?? "coral"}
            />
          ))}
        </div>
      )}

      {result.totalPages > 1 ? (
        <nav className={styles.pagination} aria-label="Event result pages">
          <button
            className="button button--ghost"
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => changePage(Math.max(1, page - 1))}
          >
            Previous
          </button>
          <span>
            Page {result.page} of {result.totalPages}
          </span>
          <button
            className="button button--ghost"
            type="button"
            disabled={page >= result.totalPages || loading}
            onClick={() => changePage(page + 1)}
          >
            Next
          </button>
        </nav>
      ) : null}
    </section>
  );
}
