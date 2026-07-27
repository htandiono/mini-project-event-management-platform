"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionsApi, type OrganizerTransactionItem } from "@/lib/api/transactions.api";
import { dashboardApi } from "@/lib/api/dashboard.api";
import { formatIdr } from "@/lib/currency";
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Eye,
  Users,
  Search,
  Filter,
  X,
  ExternalLink,
} from "lucide-react";

export default function OrganizerOrdersPage() {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [viewingAttendeesEventId, setViewingAttendeesEventId] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["organizer-orders", selectedStatus],
    queryFn: () =>
      transactionsApi.listTransactions(
        selectedStatus === "ALL" ? undefined : { status: selectedStatus },
      ),
  });

  const { data: attendeesData, isLoading: isLoadingAttendees } = useQuery({
    queryKey: ["event-attendees", viewingAttendeesEventId?.id],
    queryFn: () =>
      viewingAttendeesEventId
        ? dashboardApi.getAttendees(viewingAttendeesEventId.id)
        : Promise.resolve({ items: [], total: 0, page: 1, limit: 10 }),
    enabled: !!viewingAttendeesEventId,
  });

  const acceptMutation = useMutation({
    mutationFn: (id: string) => transactionsApi.acceptProof(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizer-orders"] });
      queryClient.invalidateQueries({ queryKey: ["organizer-statistics"] });
      setSuccessMsg("Transaction accepted! Confirmation email sent to customer.");
      setErrorMsg(null);
    },
    onError: (err: unknown) => {
      const error = err as { message?: string };
      setErrorMsg(error.message || "Failed to accept transaction.");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      transactionsApi.rejectProof(id, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizer-orders"] });
      queryClient.invalidateQueries({ queryKey: ["organizer-statistics"] });
      setSuccessMsg(
        "Transaction rejected. Points, coupons, and seats restored! Notification email sent to customer.",
      );
      setErrorMsg(null);
      setRejectingOrderId(null);
      setRejectionReason("");
    },
    onError: (err: unknown) => {
      const error = err as { message?: string };
      setErrorMsg(error.message || "Failed to reject transaction.");
    },
  });

  const filteredOrders = (transactions || []).filter((order) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (order.code || order.invoiceNumber || "").toLowerCase().includes(term) ||
      order.customer.name.toLowerCase().includes(term) ||
      order.customer.email.toLowerCase().includes(term) ||
      order.event.name.toLowerCase().includes(term)
    );
  });

  const getStatusBadge = (status: OrganizerTransactionItem["status"]) => {
    switch (status) {
      case "WAITING_FOR_CONFIRMATION":
        return (
          <span
            className="badge"
            style={{ background: "rgba(229, 170, 61, 0.15)", color: "var(--color-gold)" }}
          >
            Needs Review
          </span>
        );
      case "DONE":
        return (
          <span
            className="badge"
            style={{ background: "rgba(23, 109, 101, 0.15)", color: "var(--color-teal)" }}
          >
            Accepted / Paid
          </span>
        );
      case "REJECTED":
        return (
          <span
            className="badge"
            style={{ background: "rgba(201, 79, 67, 0.15)", color: "var(--color-primary)" }}
          >
            Rejected
          </span>
        );
      case "WAITING_FOR_PAYMENT":
        return (
          <span
            className="badge"
            style={{ background: "rgba(101, 112, 121, 0.15)", color: "var(--color-muted)" }}
          >
            Awaiting Upload
          </span>
        );
      default:
        return (
          <span
            className="badge"
            style={{ background: "rgba(101, 112, 121, 0.15)", color: "var(--color-muted)" }}
          >
            {status}
          </span>
        );
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: "1.8rem", margin: "0 0 0.5rem 0" }}>
          Order Verifications & Transactions
        </h1>
        <p style={{ color: "var(--color-muted)", margin: 0 }}>
          Review uploaded payment proofs, approve ticket sales, and inspect event attendee lists.
        </p>
      </div>

      {errorMsg && (
        <div
          style={{
            padding: "1rem",
            background: "rgba(201, 79, 67, 0.1)",
            border: "1px solid var(--color-primary)",
            borderRadius: "var(--radius-sm)",
            color: "var(--color-primary)",
          }}
        >
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div
          style={{
            padding: "1rem",
            background: "rgba(23, 109, 101, 0.1)",
            border: "1px solid var(--color-teal)",
            borderRadius: "var(--radius-sm)",
            color: "var(--color-teal)",
          }}
        >
          {successMsg}
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--color-surface)",
          padding: "1.25rem",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-line)",
        }}
      >
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          <Filter size={16} style={{ color: "var(--color-muted)" }} />
          {[
            { label: "All Orders", value: "ALL" },
            { label: "Needs Review", value: "WAITING_FOR_CONFIRMATION" },
            { label: "Accepted (Done)", value: "DONE" },
            { label: "Rejected", value: "REJECTED" },
            { label: "Awaiting Upload", value: "WAITING_FOR_PAYMENT" },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setSelectedStatus(tab.value)}
              style={{
                padding: "0.5rem 0.9rem",
                borderRadius: "var(--radius-sm)",
                border: "1px solid",
                borderColor:
                  selectedStatus === tab.value ? "var(--color-ink)" : "var(--color-line)",
                background:
                  selectedStatus === tab.value ? "var(--color-ink)" : "var(--color-canvas)",
                color: selectedStatus === tab.value ? "white" : "var(--color-ink)",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: selectedStatus === tab.value ? "600" : "400",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", position: "relative" }}>
          <Search
            size={16}
            style={{ position: "absolute", left: "0.75rem", color: "var(--color-muted)" }}
          />
          <input
            type="text"
            placeholder="Search code, customer, event..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ paddingLeft: "2.5rem", minWidth: "16rem", fontSize: "0.85rem" }}
          />
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--color-muted)" }}>
          Loading transactions...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="empty-state" style={{ textAlign: "center", padding: "4rem" }}>
          <ClipboardCheck
            size={48}
            style={{ color: "var(--color-muted)", margin: "0 auto 1rem auto" }}
          />
          <h3 style={{ margin: "0 0 0.5rem 0" }}>No Transactions Found</h3>
          <p style={{ color: "var(--color-muted)", margin: 0 }}>
            No ticket orders match your current filter criteria.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-line)",
                borderRadius: "var(--radius-md)",
                padding: "1.5rem",
                boxShadow: "var(--shadow-soft)",
                display: "grid",
                gridTemplateColumns: "minmax(200px, 1.5fr) minmax(180px, 1fr) auto auto",
                gap: "1.5rem",
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "0.3rem",
                  }}
                >
                  <span style={{ fontWeight: "700", fontFamily: "monospace", fontSize: "0.95rem" }}>
                    {order.code || order.invoiceNumber}
                  </span>
                  {getStatusBadge(order.status)}
                </div>
                <h4
                  style={{ margin: "0 0 0.2rem 0", fontSize: "1.05rem", color: "var(--color-ink)" }}
                >
                  {order.event.name}
                </h4>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-muted)" }}>
                  Ordered on {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div>
                <span
                  style={{ fontSize: "0.75rem", color: "var(--color-muted)", display: "block" }}
                >
                  Customer
                </span>
                <strong style={{ display: "block", fontSize: "0.95rem" }}>
                  {order.customer.name}
                </strong>
                <span style={{ fontSize: "0.85rem", color: "var(--color-muted)" }}>
                  {order.customer.email}
                </span>
              </div>

              <div style={{ textAlign: "right" }}>
                <span
                  style={{ fontSize: "0.75rem", color: "var(--color-muted)", display: "block" }}
                >
                  Total Paid
                </span>
                <strong style={{ fontSize: "1.15rem", color: "var(--color-gold)" }}>
                  {formatIdr(order.finalAmount ?? order.total ?? 0)}
                </strong>
                {order.items && order.items.length > 0 && (
                  <span
                    style={{ fontSize: "0.75rem", color: "var(--color-muted)", display: "block" }}
                  >
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)} ticket(s)
                  </span>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  minWidth: "140px",
                }}
              >
                {order.paymentProof ? (
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedProof(
                        order.paymentProof?.imageUrl || order.paymentProof?.fileUrl || "",
                      )
                    }
                    className="button"
                    style={{
                      background: "rgba(23, 109, 101, 0.1)",
                      color: "var(--color-teal)",
                      border: "1px solid var(--color-teal)",
                      padding: "0.4rem 0.8rem",
                      fontSize: "0.82rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.3rem",
                      cursor: "pointer",
                    }}
                  >
                    <Eye size={14} /> View Proof
                  </button>
                ) : (
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--color-muted)",
                      textAlign: "center",
                      fontStyle: "italic",
                    }}
                  >
                    No proof uploaded
                  </span>
                )}

                <button
                  type="button"
                  onClick={() =>
                    setViewingAttendeesEventId({ id: order.eventId, name: order.event.name })
                  }
                  className="button"
                  style={{
                    background: "var(--color-canvas)",
                    border: "1px solid var(--color-line)",
                    color: "var(--color-ink)",
                    padding: "0.4rem 0.8rem",
                    fontSize: "0.82rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.3rem",
                    cursor: "pointer",
                  }}
                >
                  <Users size={14} /> Attendees
                </button>

                {order.status === "WAITING_FOR_CONFIRMATION" && (
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.3rem" }}>
                    <button
                      type="button"
                      disabled={acceptMutation.isPending}
                      onClick={() => acceptMutation.mutate(order.id)}
                      className="button button--primary"
                      style={{
                        background: "var(--color-teal)",
                        borderColor: "var(--color-teal)",
                        flex: 1,
                        padding: "0.4rem",
                        fontSize: "0.8rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.2rem",
                      }}
                      title="Accept Order"
                    >
                      <CheckCircle2 size={14} /> Accept
                    </button>
                    <button
                      type="button"
                      disabled={rejectMutation.isPending}
                      onClick={() => setRejectingOrderId(order.id)}
                      className="button"
                      style={{
                        background: "var(--color-primary)",
                        color: "white",
                        borderColor: "var(--color-primary)",
                        flex: 1,
                        padding: "0.4rem",
                        fontSize: "0.8rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.2rem",
                        cursor: "pointer",
                      }}
                      title="Reject Order"
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedProof && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
          }}
          onClick={() => setSelectedProof(null)}
        >
          <div
            style={{
              background: "white",
              padding: "1rem",
              borderRadius: "var(--radius-lg)",
              maxWidth: "80vw",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem", color: "var(--color-ink)" }}>
                Payment Transfer Receipt
              </h3>
              <button
                type="button"
                onClick={() => setSelectedProof(null)}
                style={{ background: "transparent", border: "0", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ overflow: "auto", maxHeight: "70vh", textAlign: "center" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedProof}
                alt="Payment Proof"
                style={{ maxWidth: "100%", maxHeight: "65vh", borderRadius: "var(--radius-sm)" }}
              />
            </div>
            <div style={{ textAlign: "right" }}>
              <a
                href={selectedProof}
                target="_blank"
                rel="noreferrer"
                className="button"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  fontSize: "0.85rem",
                }}
              >
                <ExternalLink size={14} /> Open Original in New Tab
              </a>
            </div>
          </div>
        </div>
      )}

      {rejectingOrderId && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
          }}
        >
          <div
            style={{
              background: "var(--color-surface)",
              padding: "2rem",
              borderRadius: "var(--radius-lg)",
              maxWidth: "32rem",
              width: "100%",
              boxShadow: "var(--shadow-soft)",
              border: "1px solid var(--color-line)",
            }}
          >
            <h3 style={{ margin: "0 0 0.5rem 0", color: "var(--color-primary)" }}>
              Reject Transaction
            </h3>
            <p style={{ color: "var(--color-muted)", fontSize: "0.9rem", marginBottom: "1rem" }}>
              Rejecting this transaction will automatically restore the customer&apos;s used points,
              coupons, and event seat inventory. An email notification will be sent immediately.
            </p>
            <div className="form-group">
              <label className="form-label" htmlFor="rejectionReason">
                Rejection Reason (will be included in customer email)
              </label>
              <textarea
                id="rejectionReason"
                rows={3}
                className="form-input"
                placeholder="e.g. Receipt image is blurry, transfer amount does not match invoice IDR total..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
            <div
              style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "flex-end",
                marginTop: "1.5rem",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setRejectingOrderId(null);
                  setRejectionReason("");
                }}
                className="button"
                style={{ background: "var(--color-canvas)", border: "1px solid var(--color-line)" }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!rejectionReason.trim() || rejectMutation.isPending}
                onClick={() =>
                  rejectMutation.mutate({ id: rejectingOrderId, reason: rejectionReason })
                }
                className="button"
                style={{
                  background: "var(--color-primary)",
                  color: "white",
                  border: "1px solid var(--color-primary)",
                }}
              >
                {rejectMutation.isPending ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingAttendeesEventId && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
          }}
          onClick={() => setViewingAttendeesEventId(null)}
        >
          <div
            style={{
              background: "var(--color-surface)",
              padding: "2rem",
              borderRadius: "var(--radius-lg)",
              maxWidth: "42rem",
              width: "100%",
              maxHeight: "80vh",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
              boxShadow: "var(--shadow-soft)",
              border: "1px solid var(--color-line)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: "0", fontSize: "1.3rem", color: "var(--color-ink)" }}>
                  Attendee List
                </h3>
                <span
                  style={{ fontSize: "0.85rem", color: "var(--color-gold)", fontWeight: "600" }}
                >
                  {viewingAttendeesEventId.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewingAttendeesEventId(null)}
                style={{ background: "transparent", border: "0", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            {isLoadingAttendees ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-muted)" }}>
                Loading attendee roster...
              </div>
            ) : !attendeesData?.items || attendeesData.items.length === 0 ? (
              <div style={{ padding: "3rem", textAlign: "center", color: "var(--color-muted)" }}>
                <Users size={36} style={{ margin: "0 auto 0.5rem auto", opacity: 0.5 }} />
                <p style={{ margin: 0 }}>No confirmed attendees yet for this event.</p>
              </div>
            ) : (
              <div style={{ overflow: "auto", maxHeight: "55vh" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--color-line)", textAlign: "left" }}>
                      <th style={{ padding: "0.75rem" }}>Attendee Name</th>
                      <th style={{ padding: "0.75rem" }}>Email</th>
                      <th style={{ padding: "0.75rem" }}>Ticket Type</th>
                      <th style={{ padding: "0.75rem", textAlign: "center" }}>Qty</th>
                      <th style={{ padding: "0.75rem", textAlign: "right" }}>Total Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendeesData.items.map((att, idx) => (
                      <tr
                        key={`${att.customerEmail}-${idx}`}
                        style={{
                          borderBottom: "1px solid var(--color-line)",
                          background: idx % 2 === 0 ? "transparent" : "var(--color-canvas)",
                        }}
                      >
                        <td style={{ padding: "0.75rem", fontWeight: "600" }}>
                          {att.customerName}
                        </td>
                        <td style={{ padding: "0.75rem", color: "var(--color-muted)" }}>
                          {att.customerEmail}
                        </td>
                        <td style={{ padding: "0.75rem" }}>{att.ticketTypeName}</td>
                        <td style={{ padding: "0.75rem", textAlign: "center" }}>{att.quantity}</td>
                        <td
                          style={{
                            padding: "0.75rem",
                            textAlign: "right",
                            fontWeight: "700",
                            color: "var(--color-gold)",
                          }}
                        >
                          {formatIdr(att.totalPaid)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div
              style={{
                textAlign: "right",
                borderTop: "1px solid var(--color-line)",
                paddingTop: "1rem",
              }}
            >
              <button
                type="button"
                onClick={() => setViewingAttendeesEventId(null)}
                className="button"
                style={{ background: "var(--color-canvas)", border: "1px solid var(--color-line)" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
