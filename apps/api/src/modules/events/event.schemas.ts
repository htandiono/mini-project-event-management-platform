import { z } from "zod";

export const eventListQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  category: z.string().trim().max(80).optional(),
  city: z.string().trim().max(80).optional(),
  sort: z.enum(["startsAt", "price", "name"]).default("startsAt"),
  order: z.enum(["asc", "desc"]).default("asc"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(24).default(9),
});

export const eventSlugSchema = z.string().trim().min(1).max(160);

export const entityIdSchema = z.string().trim().min(1).max(40);

export const eventInputSchema = z
  .object({
    categoryId: entityIdSchema,
    name: z.string().trim().min(3).max(120),
    description: z.string().trim().min(20).max(5_000),
    venue: z.string().trim().min(2).max(160),
    address: z.string().trim().min(5).max(240),
    city: z.string().trim().min(2).max(80),
    province: z.string().trim().min(2).max(80),
    startsAt: z.iso.datetime(),
    endsAt: z.iso.datetime(),
    capacity: z.number().int().positive().max(100_000),
    isFree: z.boolean(),
    thumbnailUrl: z.url().nullable().optional(),
    status: z.enum(["DRAFT", "PUBLISHED"]),
  })
  .superRefine((event, context) => {
    if (new Date(event.endsAt) <= new Date(event.startsAt)) {
      context.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "Event end time must be after its start time",
      });
    }
  });

export const ticketTypeInputSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    description: z.string().trim().max(500).nullable().optional(),
    price: z.number().int().min(0).max(1_000_000_000),
    capacity: z.number().int().positive().max(100_000),
    salesStartAt: z.iso.datetime().nullable().optional(),
    salesEndAt: z.iso.datetime().nullable().optional(),
  })
  .superRefine((ticket, context) => {
    if (
      ticket.salesStartAt &&
      ticket.salesEndAt &&
      new Date(ticket.salesEndAt) <= new Date(ticket.salesStartAt)
    ) {
      context.addIssue({
        code: "custom",
        path: ["salesEndAt"],
        message: "Ticket sales end time must be after its start time",
      });
    }
  });

export type ParsedEventListQuery = z.infer<typeof eventListQuerySchema>;
