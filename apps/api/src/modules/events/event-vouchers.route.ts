import { prisma } from "@eventure/database";
import type { ApiSuccess, OrganizerVoucherSummary } from "@eventure/shared";
import { Router } from "express";

import { asyncHandler } from "../../lib/async-handler.js";
import { requireRequestUser } from "../../lib/request-user.js";
import { entityIdSchema, voucherInputSchema } from "./event.schemas.js";
import {
  createEventVoucher,
  deleteEventVoucher,
  listEventVouchers,
  updateEventVoucher,
} from "./event-vouchers.service.js";

export const eventVouchersRouter = Router({ mergeParams: true });

eventVouchersRouter.get(
  "/",
  asyncHandler(async (request, response) => {
    const organizer = requireRequestUser(response.locals, "ORGANIZER");
    const eventId = entityIdSchema.parse(request.params.eventId);
    const vouchers = await listEventVouchers(prisma, organizer.id, eventId);
    const body: ApiSuccess<OrganizerVoucherSummary[]> = {
      success: true,
      message: "Event vouchers retrieved",
      data: vouchers,
    };

    response.json(body);
  }),
);

eventVouchersRouter.post(
  "/",
  asyncHandler(async (request, response) => {
    const organizer = requireRequestUser(response.locals, "ORGANIZER");
    const eventId = entityIdSchema.parse(request.params.eventId);
    const input = voucherInputSchema.parse(request.body);
    const voucher = await createEventVoucher(prisma, organizer.id, eventId, input);
    const body: ApiSuccess<OrganizerVoucherSummary> = {
      success: true,
      message: "Voucher created",
      data: voucher,
    };

    response.status(201).json(body);
  }),
);

eventVouchersRouter.put(
  "/:voucherId",
  asyncHandler(async (request, response) => {
    const organizer = requireRequestUser(response.locals, "ORGANIZER");
    const eventId = entityIdSchema.parse(request.params.eventId);
    const voucherId = entityIdSchema.parse(request.params.voucherId);
    const input = voucherInputSchema.parse(request.body);
    const voucher = await updateEventVoucher(prisma, organizer.id, eventId, voucherId, input);
    const body: ApiSuccess<OrganizerVoucherSummary> = {
      success: true,
      message: "Voucher updated",
      data: voucher,
    };

    response.json(body);
  }),
);

eventVouchersRouter.delete(
  "/:voucherId",
  asyncHandler(async (request, response) => {
    const organizer = requireRequestUser(response.locals, "ORGANIZER");
    const eventId = entityIdSchema.parse(request.params.eventId);
    const voucherId = entityIdSchema.parse(request.params.voucherId);
    await deleteEventVoucher(prisma, organizer.id, eventId, voucherId);

    response.status(204).send();
  }),
);
