import type { Metadata } from "next";

import { TransactionList } from "@/components/transaction-list";

export const metadata: Metadata = { title: "My transactions" };

export default function TransactionsPage() {
  return <TransactionList />;
}
