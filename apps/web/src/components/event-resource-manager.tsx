"use client";

import type {
  OrganizerEventDetail,
  OrganizerVoucherSummary,
  TicketTypeInput,
  TicketTypeSummary,
  VoucherInput,
} from "@eventure/shared";
import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";

import {
  ApiClientError,
  createEventTicket,
  createEventVoucher,
  deleteEventTicket,
  deleteEventVoucher,
  getEventTickets,
  getEventVouchers,
  getOrganizerEvent,
  updateEventTicket,
  updateEventVoucher,
} from "@/lib/api-client";
import { formatIdr } from "@/lib/currency";

import styles from "./organizer-resources.module.css";

interface EventResourceManagerProps {
  eventId: string;
}

interface TicketFormState {
  name: string;
  description: string;
  price: string;
  capacity: string;
  salesStartAt: string;
  salesEndAt: string;
}

const emptyTicketForm: TicketFormState = {
  name: "",
  description: "",
  price: "",
  capacity: "",
  salesStartAt: "",
  salesEndAt: "",
};

interface VoucherFormState {
  code: string;
  name: string;
  discountType: "percent" | "amount";
  discountValue: string;
  usageLimit: string;
  startsAt: string;
  endsAt: string;
}

const emptyVoucherForm: VoucherFormState = {
  code: "",
  name: "",
  discountType: "percent",
  discountValue: "",
  usageLimit: "",
  startsAt: "",
  endsAt: "",
};

function localDateTime(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function ticketToForm(ticket: TicketTypeSummary): TicketFormState {
  return {
    name: ticket.name,
    description: ticket.description ?? "",
    price: String(ticket.price),
    capacity: String(ticket.capacity),
    salesStartAt: localDateTime(ticket.salesStartAt),
    salesEndAt: localDateTime(ticket.salesEndAt),
  };
}

function formToTicket(form: TicketFormState, isFree: boolean): TicketTypeInput {
  return {
    name: form.name,
    description: form.description || null,
    price: isFree ? 0 : Number(form.price),
    capacity: Number(form.capacity),
    salesStartAt: form.salesStartAt ? new Date(form.salesStartAt).toISOString() : null,
    salesEndAt: form.salesEndAt ? new Date(form.salesEndAt).toISOString() : null,
  };
}

function voucherToForm(voucher: OrganizerVoucherSummary): VoucherFormState {
  const usesPercent = voucher.discountPercent != null;
  return {
    code: voucher.code,
    name: voucher.name,
    discountType: usesPercent ? "percent" : "amount",
    discountValue: String(voucher.discountPercent ?? voucher.discountAmount ?? ""),
    usageLimit: String(voucher.usageLimit),
    startsAt: localDateTime(voucher.startsAt),
    endsAt: localDateTime(voucher.endsAt),
  };
}

function formToVoucher(form: VoucherFormState): VoucherInput {
  return {
    code: form.code.toUpperCase(),
    name: form.name,
    discountPercent: form.discountType === "percent" ? Number(form.discountValue) : null,
    discountAmount: form.discountType === "amount" ? Number(form.discountValue) : null,
    usageLimit: Number(form.usageLimit),
    startsAt: new Date(form.startsAt).toISOString(),
    endsAt: new Date(form.endsAt).toISOString(),
  };
}

export function EventResourceManager({ eventId }: EventResourceManagerProps) {
  const [event, setEvent] = useState<OrganizerEventDetail | null>(null);
  const [tickets, setTickets] = useState<TicketTypeSummary[]>([]);
  const [vouchers, setVouchers] = useState<OrganizerVoucherSummary[]>([]);
  const [ticketForm, setTicketForm] = useState(emptyTicketForm);
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);
  const [voucherForm, setVoucherForm] = useState(emptyVoucherForm);
  const [editingVoucherId, setEditingVoucherId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getOrganizerEvent(eventId)
      .then(async (eventData) => {
        const [ticketData, voucherData] = await Promise.all([
          getEventTickets(eventId),
          eventData.isFree ? Promise.resolve([]) : getEventVouchers(eventId),
        ]);
        setEvent(eventData);
        setTickets(ticketData);
        setVouchers(voucherData);
      })
      .catch((reason: unknown) => {
        if (reason instanceof ApiClientError && reason.status === 401) setNeedsLogin(true);
        else setError(reason instanceof Error ? reason.message : "Unable to load event resources");
      })
      .finally(() => setLoading(false));
  }, [eventId]);

  async function saveTicket(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
    if (!event) return;
    const action = editingTicketId ? "update this ticket type" : "create this ticket type";
    if (!window.confirm(`Confirm that you want to ${action}?`)) return;
    setWorking(true);
    setError("");

    try {
      const input = formToTicket(ticketForm, event.isFree);
      const saved = editingTicketId
        ? await updateEventTicket(eventId, editingTicketId, input)
        : await createEventTicket(eventId, input);
      setTickets((current) =>
        editingTicketId
          ? current.map((ticket) => (ticket.id === saved.id ? saved : ticket))
          : [...current, saved].sort((left, right) => left.price - right.price),
      );
      setTicketForm(emptyTicketForm);
      setEditingTicketId(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save ticket type");
    } finally {
      setWorking(false);
    }
  }

  async function removeTicket(ticketId: string) {
    if (!window.confirm("Delete this unsold ticket type?")) return;
    setWorking(true);
    setError("");

    try {
      await deleteEventTicket(eventId, ticketId);
      setTickets((current) => current.filter((ticket) => ticket.id !== ticketId));
      if (editingTicketId === ticketId) {
        setEditingTicketId(null);
        setTicketForm(emptyTicketForm);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to delete ticket type");
    } finally {
      setWorking(false);
    }
  }

  async function saveVoucher(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
    const action = editingVoucherId ? "update this event voucher" : "create this event voucher";
    if (!window.confirm(`Confirm that you want to ${action}?`)) return;
    setWorking(true);
    setError("");

    try {
      const input = formToVoucher(voucherForm);
      const saved = editingVoucherId
        ? await updateEventVoucher(eventId, editingVoucherId, input)
        : await createEventVoucher(eventId, input);
      setVouchers((current) =>
        editingVoucherId
          ? current.map((voucher) => (voucher.id === saved.id ? saved : voucher))
          : [saved, ...current],
      );
      setVoucherForm(emptyVoucherForm);
      setEditingVoucherId(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save voucher");
    } finally {
      setWorking(false);
    }
  }

  async function removeVoucher(voucherId: string) {
    if (!window.confirm("Soft-delete this event voucher?")) return;
    setWorking(true);
    setError("");

    try {
      await deleteEventVoucher(eventId, voucherId);
      setVouchers((current) => current.filter((voucher) => voucher.id !== voucherId));
      if (editingVoucherId === voucherId) {
        setEditingVoucherId(null);
        setVoucherForm(emptyVoucherForm);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to delete voucher");
    } finally {
      setWorking(false);
    }
  }

  if (loading) return <p className={`shell ${styles.page}`}>Loading ticket setup...</p>;

  if (needsLogin) {
    return (
      <section className={`shell ${styles.page}`}>
        <div className={styles.message}>
          <p>Log in as the event organizer to manage ticket inventory.</p>
          <Link className="button button--primary" href="/login">
            Organizer login
          </Link>
        </div>
      </section>
    );
  }

  if (!event) {
    return (
      <section className={`shell ${styles.page}`}>
        <p className={`${styles.message} ${styles.error}`}>{error || "Event not found"}</p>
      </section>
    );
  }

  return (
    <section className={`shell ${styles.page}`}>
      <Link className={styles.back} href="/organizer/events">
        ← Back to my events
      </Link>
      <header className={styles.heading}>
        <div>
          <p className="eyebrow">Ticket setup</p>
          <h1>{event.name}</h1>
        </div>
        <span>
          {event.availableSeats} of {event.capacity} event seats available
        </span>
      </header>

      {error ? (
        <p className={`${styles.message} ${styles.error}`} role="alert">
          {error}
        </p>
      ) : null}

      <div className={styles.layout}>
        <section className={styles.panel}>
          <h2>Ticket types</h2>
          {tickets.length === 0 ? (
            <p className={styles.muted}>Add at least one ticket before publishing this event.</p>
          ) : null}
          <div className={styles.list}>
            {tickets.map((ticket) => (
              <article className={styles.item} key={ticket.id}>
                <div className={styles.itemHeader}>
                  <h3>{ticket.name}</h3>
                  <strong>{ticket.price === 0 ? "Free" : formatIdr(ticket.price)}</strong>
                </div>
                <p>
                  {ticket.availableSeats} of {ticket.capacity} available
                </p>
                <div className={styles.actions}>
                  <button
                    className="button button--ghost"
                    type="button"
                    disabled={working}
                    onClick={() => {
                      setEditingTicketId(ticket.id);
                      setTicketForm(ticketToForm(ticket));
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="button button--ghost"
                    type="button"
                    disabled={working}
                    onClick={() => removeTicket(ticket.id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.panel}>
          <h2>{editingTicketId ? "Edit ticket type" : "Add ticket type"}</h2>
          <form className={styles.form} onSubmit={saveTicket}>
            <label className={styles.field}>
              <span>Name</span>
              <input
                required
                minLength={2}
                maxLength={80}
                value={ticketForm.name}
                onChange={(changeEvent) =>
                  setTicketForm({ ...ticketForm, name: changeEvent.target.value })
                }
              />
            </label>
            <label className={styles.field}>
              <span>Description (optional)</span>
              <textarea
                maxLength={500}
                value={ticketForm.description}
                onChange={(changeEvent) =>
                  setTicketForm({ ...ticketForm, description: changeEvent.target.value })
                }
              />
            </label>
            <label className={styles.field}>
              <span>Price in IDR</span>
              <input
                required
                type="number"
                min={0}
                disabled={event.isFree}
                value={event.isFree ? "0" : ticketForm.price}
                onChange={(changeEvent) =>
                  setTicketForm({ ...ticketForm, price: changeEvent.target.value })
                }
              />
            </label>
            <label className={styles.field}>
              <span>Capacity</span>
              <input
                required
                type="number"
                min={1}
                max={event.capacity}
                value={ticketForm.capacity}
                onChange={(changeEvent) =>
                  setTicketForm({ ...ticketForm, capacity: changeEvent.target.value })
                }
              />
            </label>
            <label className={styles.field}>
              <span>Sales start (optional)</span>
              <input
                type="datetime-local"
                value={ticketForm.salesStartAt}
                onChange={(changeEvent) =>
                  setTicketForm({ ...ticketForm, salesStartAt: changeEvent.target.value })
                }
              />
            </label>
            <label className={styles.field}>
              <span>Sales end (optional)</span>
              <input
                type="datetime-local"
                value={ticketForm.salesEndAt}
                onChange={(changeEvent) =>
                  setTicketForm({ ...ticketForm, salesEndAt: changeEvent.target.value })
                }
              />
            </label>
            <div className={styles.actions}>
              <button className="button button--primary" type="submit" disabled={working}>
                {working ? "Saving..." : editingTicketId ? "Update ticket" : "Add ticket"}
              </button>
              {editingTicketId ? (
                <button
                  className="button button--ghost"
                  type="button"
                  onClick={() => {
                    setEditingTicketId(null);
                    setTicketForm(emptyTicketForm);
                  }}
                >
                  Cancel edit
                </button>
              ) : null}
            </div>
          </form>
        </section>
      </div>

      <div className={`${styles.layout} ${styles.voucherSection}`}>
        <section className={styles.panel}>
          <h2>Event vouchers</h2>
          {event.isFree ? (
            <p className={styles.muted}>Free events do not need discount vouchers.</p>
          ) : vouchers.length === 0 ? (
            <p className={styles.muted}>No limited-time vouchers configured.</p>
          ) : null}
          <div className={styles.list}>
            {vouchers.map((voucher) => (
              <article className={styles.item} key={voucher.id}>
                <div className={styles.itemHeader}>
                  <h3>{voucher.code}</h3>
                  <strong>
                    {voucher.discountPercent
                      ? `${voucher.discountPercent}% off`
                      : `${formatIdr(voucher.discountAmount ?? 0)} off`}
                  </strong>
                </div>
                <p>
                  {voucher.name} · {voucher.usedCount} of {voucher.usageLimit} redeemed
                </p>
                <div className={styles.actions}>
                  <button
                    className="button button--ghost"
                    type="button"
                    disabled={working}
                    onClick={() => {
                      setEditingVoucherId(voucher.id);
                      setVoucherForm(voucherToForm(voucher));
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="button button--ghost"
                    type="button"
                    disabled={working}
                    onClick={() => removeVoucher(voucher.id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {!event.isFree ? (
          <section className={styles.panel}>
            <h2>{editingVoucherId ? "Edit voucher" : "Add event voucher"}</h2>
            <form className={styles.form} onSubmit={saveVoucher}>
              <label className={styles.field}>
                <span>Voucher code</span>
                <input
                  required
                  minLength={3}
                  maxLength={30}
                  value={voucherForm.code}
                  onChange={(changeEvent) =>
                    setVoucherForm({ ...voucherForm, code: changeEvent.target.value.toUpperCase() })
                  }
                />
              </label>
              <label className={styles.field}>
                <span>Name</span>
                <input
                  required
                  minLength={3}
                  maxLength={100}
                  value={voucherForm.name}
                  onChange={(changeEvent) =>
                    setVoucherForm({ ...voucherForm, name: changeEvent.target.value })
                  }
                />
              </label>
              <label className={styles.field}>
                <span>Discount type</span>
                <select
                  value={voucherForm.discountType}
                  onChange={(changeEvent) =>
                    setVoucherForm({
                      ...voucherForm,
                      discountType: changeEvent.target.value as VoucherFormState["discountType"],
                    })
                  }
                >
                  <option value="percent">Percentage</option>
                  <option value="amount">Fixed IDR</option>
                </select>
              </label>
              <label className={styles.field}>
                <span>Discount value</span>
                <input
                  required
                  type="number"
                  min={1}
                  max={voucherForm.discountType === "percent" ? 100 : 1_000_000_000}
                  value={voucherForm.discountValue}
                  onChange={(changeEvent) =>
                    setVoucherForm({ ...voucherForm, discountValue: changeEvent.target.value })
                  }
                />
              </label>
              <label className={styles.field}>
                <span>Usage limit</span>
                <input
                  required
                  type="number"
                  min={1}
                  max={100_000}
                  value={voucherForm.usageLimit}
                  onChange={(changeEvent) =>
                    setVoucherForm({ ...voucherForm, usageLimit: changeEvent.target.value })
                  }
                />
              </label>
              <label className={styles.field}>
                <span>Starts</span>
                <input
                  required
                  type="datetime-local"
                  value={voucherForm.startsAt}
                  onChange={(changeEvent) =>
                    setVoucherForm({ ...voucherForm, startsAt: changeEvent.target.value })
                  }
                />
              </label>
              <label className={styles.field}>
                <span>Ends</span>
                <input
                  required
                  type="datetime-local"
                  value={voucherForm.endsAt}
                  onChange={(changeEvent) =>
                    setVoucherForm({ ...voucherForm, endsAt: changeEvent.target.value })
                  }
                />
              </label>
              <div className={styles.actions}>
                <button className="button button--primary" type="submit" disabled={working}>
                  {working ? "Saving..." : editingVoucherId ? "Update voucher" : "Add voucher"}
                </button>
                {editingVoucherId ? (
                  <button
                    className="button button--ghost"
                    type="button"
                    onClick={() => {
                      setEditingVoucherId(null);
                      setVoucherForm(emptyVoucherForm);
                    }}
                  >
                    Cancel edit
                  </button>
                ) : null}
              </div>
            </form>
          </section>
        ) : null}
      </div>
    </section>
  );
}
