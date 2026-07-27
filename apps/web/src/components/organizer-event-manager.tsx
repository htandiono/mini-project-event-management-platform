"use client";

import type {
  CategorySummary,
  EventInput,
  OrganizerEventDetail,
  OrganizerEventSummary,
} from "@eventure/shared";
import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";

import {
  ApiClientError,
  createOrganizerEvent,
  deleteOrganizerEvent,
  getCategories,
  getOrganizerEvent,
  getOrganizerEvents,
  updateOrganizerEvent,
} from "@/lib/api-client";

import { EmptyState } from "./ui/empty-state";
import styles from "./organizer-events.module.css";

interface EventFormState {
  categoryId: string;
  name: string;
  description: string;
  venue: string;
  address: string;
  city: string;
  province: string;
  startsAt: string;
  endsAt: string;
  capacity: string;
  isFree: boolean;
  status: "DRAFT" | "PUBLISHED";
}

const emptyForm: EventFormState = {
  categoryId: "",
  name: "",
  description: "",
  venue: "",
  address: "",
  city: "",
  province: "",
  startsAt: "",
  endsAt: "",
  capacity: "",
  isFree: false,
  status: "DRAFT",
};

function localDateTime(iso: string): string {
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function detailToForm(event: OrganizerEventDetail): EventFormState {
  return {
    categoryId: event.categoryId,
    name: event.name,
    description: event.description,
    venue: event.venue,
    address: event.address,
    city: event.city,
    province: event.province,
    startsAt: localDateTime(event.startsAt),
    endsAt: localDateTime(event.endsAt),
    capacity: String(event.capacity),
    isFree: event.isFree,
    status: event.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
  };
}

function formToInput(form: EventFormState): EventInput {
  return {
    ...form,
    startsAt: new Date(form.startsAt).toISOString(),
    endsAt: new Date(form.endsAt).toISOString(),
    capacity: Number(form.capacity),
  };
}

export function OrganizerEventManager() {
  const [events, setEvents] = useState<OrganizerEventSummary[]>([]);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([getOrganizerEvents(controller.signal), getCategories(controller.signal)])
      .then(([eventData, categoryData]) => {
        setEvents(eventData);
        setCategories(categoryData);
      })
      .catch((reason: unknown) => {
        if (reason instanceof ApiClientError && reason.status === 401) setNeedsLogin(true);
        else if (!(reason instanceof DOMException && reason.name === "AbortError")) {
          setError(reason instanceof Error ? reason.message : "Unable to load organizer events");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm, categoryId: categories[0]?.id ?? "" });
    setShowForm(true);
    setError("");
  }

  async function openEdit(eventId: string) {
    setWorking(true);
    setError("");
    try {
      const event = await getOrganizerEvent(eventId);
      setEditingId(event.id);
      setForm(detailToForm(event));
      setShowForm(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load event");
    } finally {
      setWorking(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const action = editingId ? "save these event changes" : "create this event draft";
    if (!window.confirm(`Confirm that you want to ${action}?`)) return;
    setWorking(true);
    setError("");

    try {
      const saved = editingId
        ? await updateOrganizerEvent(editingId, formToInput(form))
        : await createOrganizerEvent({ ...formToInput(form), status: "DRAFT" });
      setEvents((current) =>
        editingId
          ? current.map((existing) => (existing.id === saved.id ? saved : existing))
          : [saved, ...current],
      );
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save event");
    } finally {
      setWorking(false);
    }
  }

  async function remove(eventId: string) {
    if (!window.confirm("Soft-delete this event? This cannot proceed while payments are active.")) {
      return;
    }
    setWorking(true);
    setError("");

    try {
      await deleteOrganizerEvent(eventId);
      setEvents((current) => current.filter((event) => event.id !== eventId));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to delete event");
    } finally {
      setWorking(false);
    }
  }

  return (
    <section className={`shell ${styles.page}`}>
      <header className={styles.heading}>
        <div>
          <p className="eyebrow">Organizer workspace</p>
          <h1>My events</h1>
        </div>
        {!needsLogin ? (
          <button className="button button--primary" type="button" onClick={openCreate}>
            Create event
          </button>
        ) : null}
      </header>

      {needsLogin ? (
        <div className={styles.message}>
          <p>Log in as an organizer to create and manage events.</p>
          <Link className="button button--primary" href="/login">
            Organizer login
          </Link>
        </div>
      ) : null}
      {error ? (
        <p className={`${styles.message} ${styles.error}`} role="alert">
          {error}
        </p>
      ) : null}

      {showForm ? (
        <section className={styles.formPanel}>
          <h2>{editingId ? "Edit event" : "Create event draft"}</h2>
          <form className={styles.form} onSubmit={submit}>
            <label className={styles.field}>
              <span>Event name</span>
              <input
                required
                minLength={3}
                maxLength={120}
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </label>
            <label className={styles.field}>
              <span>Category</span>
              <select
                required
                value={form.categoryId}
                onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
              >
                <option value="">Choose a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.fullField}>
              <span>Description</span>
              <textarea
                required
                minLength={20}
                maxLength={5_000}
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
            </label>
            <label className={styles.field}>
              <span>Venue</span>
              <input
                required
                value={form.venue}
                onChange={(event) => setForm({ ...form, venue: event.target.value })}
              />
            </label>
            <label className={styles.field}>
              <span>Address</span>
              <input
                required
                value={form.address}
                onChange={(event) => setForm({ ...form, address: event.target.value })}
              />
            </label>
            <label className={styles.field}>
              <span>City</span>
              <input
                required
                value={form.city}
                onChange={(event) => setForm({ ...form, city: event.target.value })}
              />
            </label>
            <label className={styles.field}>
              <span>Province</span>
              <input
                required
                value={form.province}
                onChange={(event) => setForm({ ...form, province: event.target.value })}
              />
            </label>
            <label className={styles.field}>
              <span>Starts</span>
              <input
                required
                type="datetime-local"
                value={form.startsAt}
                onChange={(event) => setForm({ ...form, startsAt: event.target.value })}
              />
            </label>
            <label className={styles.field}>
              <span>Ends</span>
              <input
                required
                type="datetime-local"
                value={form.endsAt}
                onChange={(event) => setForm({ ...form, endsAt: event.target.value })}
              />
            </label>
            <label className={styles.field}>
              <span>Capacity</span>
              <input
                required
                type="number"
                min={1}
                max={100_000}
                value={form.capacity}
                onChange={(event) => setForm({ ...form, capacity: event.target.value })}
              />
            </label>
            {editingId ? (
              <label className={styles.field}>
                <span>Status</span>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm({ ...form, status: event.target.value as EventFormState["status"] })
                  }
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                </select>
              </label>
            ) : null}
            <label className={`${styles.checkbox} ${styles.fullField}`}>
              <input
                type="checkbox"
                checked={form.isFree}
                onChange={(event) => setForm({ ...form, isFree: event.target.checked })}
              />
              <span>This is a free event</span>
            </label>
            <div className={`${styles.actions} ${styles.fullField}`}>
              <button className="button button--primary" type="submit" disabled={working}>
                {working ? "Saving..." : editingId ? "Save event" : "Create draft"}
              </button>
              <button
                className="button button--ghost"
                type="button"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {loading ? <p>Loading organizer events...</p> : null}
      {!loading && !needsLogin && events.length === 0 ? (
        <EmptyState
          title="No events yet"
          description="Create a draft, then add tickets before publishing it."
        />
      ) : null}
      <div className={styles.grid}>
        {events.map((event) => (
          <article className={styles.card} key={event.id}>
            <div className={styles.cardHeader}>
              <h2>{event.name}</h2>
              <span className={styles.status}>{event.status}</span>
            </div>
            <p>
              {event.city} · {event.categoryName}
            </p>
            <p>
              {event.availableSeats} of {event.capacity} seats available · {event.ticketTypeCount}{" "}
              ticket types
            </p>
            <div className={styles.actions}>
              <button
                className="button button--ghost"
                type="button"
                disabled={working}
                onClick={() => openEdit(event.id)}
              >
                Edit
              </button>
              <Link className="button button--ghost" href={`/organizer/events/${event.id}/manage`}>
                Tickets & vouchers
              </Link>
              <button
                className="button button--ghost"
                type="button"
                disabled={working}
                onClick={() => remove(event.id)}
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
