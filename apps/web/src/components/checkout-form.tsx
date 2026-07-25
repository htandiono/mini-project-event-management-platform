"use client";

import type { CheckoutOptions, TicketTypeSummary } from "@eventure/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { ApiClientError, createCheckout, getCheckoutOptions } from "@/lib/api-client";
import { formatIdr } from "@/lib/currency";

import styles from "./event-details.module.css";

interface CheckoutFormProps {
  eventId: string;
  eventName: string;
  tickets: TicketTypeSummary[];
}

export function CheckoutForm({ eventId, eventName, tickets }: CheckoutFormProps) {
  const router = useRouter();
  const [started, setStarted] = useState(false);
  const [options, setOptions] = useState<CheckoutOptions | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [voucherCode, setVoucherCode] = useState("");
  const [userCouponId, setUserCouponId] = useState("");
  const [pointsToUse, setPointsToUse] = useState(0);
  const [loading, setLoading] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [error, setError] = useState("");

  const subtotal = tickets.reduce(
    (sum, ticket) => sum + ticket.price * (quantities[ticket.id] ?? 0),
    0,
  );

  async function startCheckout() {
    setStarted(true);
    setLoading(true);
    setError("");

    try {
      setOptions(await getCheckoutOptions());
    } catch (reason) {
      if (reason instanceof ApiClientError && reason.status === 401) setNeedsLogin(true);
      else setError(reason instanceof Error ? reason.message : "Unable to start checkout");
    } finally {
      setLoading(false);
    }
  }

  async function submitCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const items = Object.entries(quantities)
      .filter(([, quantity]) => quantity > 0)
      .map(([ticketTypeId, quantity]) => ({ ticketTypeId, quantity }));

    if (items.length === 0) {
      setError("Choose at least one ticket.");
      return;
    }

    if (!window.confirm(`Confirm your registration for ${eventName}?`)) return;

    setLoading(true);
    setError("");

    try {
      const transaction = await createCheckout({
        eventId,
        items,
        voucherCode: voucherCode || undefined,
        userCouponId: userCouponId || undefined,
        pointsToUse,
      });
      router.push(`/transactions/${transaction.id}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  }

  if (!started) {
    return (
      <button className={`button button--primary ${styles.checkoutStart}`} onClick={startCheckout}>
        Register for this event
      </button>
    );
  }

  if (loading && !options) return <p className={styles.muted}>Preparing checkout...</p>;

  if (needsLogin) {
    return (
      <div className={styles.loginPrompt}>
        <p>Log in as a customer to reserve tickets and use your points or coupons.</p>
        <Link className="button button--primary" href="/login">
          Log in to continue
        </Link>
      </div>
    );
  }

  if (!options) {
    return (
      <p className={styles.checkoutError} role="alert">
        {error || "Checkout is unavailable."}
      </p>
    );
  }

  return (
    <form className={styles.checkoutForm} onSubmit={submitCheckout}>
      <h3>Your order</h3>
      {tickets.map((ticket) => (
        <label className={styles.quantityRow} key={ticket.id}>
          <span>
            <strong>{ticket.name}</strong>
            <br />
            <small>{ticket.price === 0 ? "Free" : formatIdr(ticket.price)}</small>
          </span>
          <select
            aria-label={`${ticket.name} quantity`}
            value={quantities[ticket.id] ?? 0}
            onChange={(changeEvent) =>
              setQuantities((current) => ({
                ...current,
                [ticket.id]: Number(changeEvent.target.value),
              }))
            }
          >
            {Array.from({ length: Math.min(10, ticket.availableSeats) + 1 }, (_, quantity) => (
              <option key={quantity} value={quantity}>
                {quantity}
              </option>
            ))}
          </select>
        </label>
      ))}

      <label className={styles.checkoutField}>
        <span>Event voucher code (optional)</span>
        <input
          value={voucherCode}
          maxLength={30}
          onChange={(changeEvent) => setVoucherCode(changeEvent.target.value.toUpperCase())}
        />
      </label>

      {options.coupons.length > 0 ? (
        <label className={styles.checkoutField}>
          <span>My coupon (optional)</span>
          <select
            value={userCouponId}
            onChange={(changeEvent) => setUserCouponId(changeEvent.target.value)}
          >
            <option value="">No coupon</option>
            {options.coupons.map((coupon) => (
              <option key={coupon.id} value={coupon.id}>
                {coupon.name} · {coupon.discountPercent}% off
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {options.pointBalance > 0 ? (
        <label className={styles.checkoutField}>
          <span>Points to use · {formatIdr(options.pointBalance)} available</span>
          <input
            type="number"
            min={0}
            max={options.pointBalance}
            value={pointsToUse}
            onChange={(changeEvent) => setPointsToUse(Number(changeEvent.target.value))}
          />
        </label>
      ) : null}

      <div className={styles.checkoutSummary}>
        <span>Ticket subtotal</span>
        <strong>{subtotal === 0 ? "Free" : formatIdr(subtotal)}</strong>
      </div>
      {error ? (
        <p className={styles.checkoutError} role="alert">
          {error}
        </p>
      ) : null}
      <button className="button button--primary" type="submit" disabled={loading}>
        {loading ? "Creating order..." : "Confirm checkout"}
      </button>
    </form>
  );
}
