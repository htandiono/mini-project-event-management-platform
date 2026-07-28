import { TransactionDetails } from "@/components/transaction-details";

interface TransactionPageProps {
  params: Promise<{ transactionId: string }>;
}

export default async function TransactionPage({ params }: TransactionPageProps) {
  const { transactionId } = await params;
  return <TransactionDetails transactionId={transactionId} />;
}
