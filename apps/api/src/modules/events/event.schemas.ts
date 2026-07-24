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

export type ParsedEventListQuery = z.infer<typeof eventListQuerySchema>;
