import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import type { Invoice } from "@receipt-app/shared";

interface Props {
  invoices: Invoice[];
  onReview: (id: string) => void;
}

export function InboxTable({ invoices, onReview }: Props) {
  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vendor</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            {/* Removed the empty Action column header */}
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                No documents found.
              </TableCell>
            </TableRow>
          ) : (
            invoices.map((inv) => (
              <TableRow
                key={inv.id}
                // 1. Make the row clickable
                onClick={() => onReview(inv.id)}
                // 2. Add pointer cursor and hover effect
                className="cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <TableCell className="font-medium">{inv.vendor}</TableCell>
                <TableCell>{inv.date}</TableCell>
                <TableCell className="capitalize">
                  {/* Simple visual tweak for category labels */}
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs font-medium text-gray-700">
                    {inv.category.replace("_", " ")}
                  </span>
                </TableCell>
                <TableCell>
                  {inv.status === "review" && (
                    <Badge
                      variant="destructive"
                      className="flex w-fit items-center gap-1"
                    >
                      <AlertCircle size={12} /> Review
                    </Badge>
                  )}
                  {inv.status === "approved" && (
                    <Badge
                      variant="outline"
                      className="flex w-fit items-center gap-1 text-green-600 border-green-200 bg-green-50"
                    >
                      <CheckCircle2 size={12} /> Approved
                    </Badge>
                  )}
                  {inv.status === "queue" && (
                    <Badge
                      variant="secondary"
                      className="flex w-fit items-center gap-1"
                    >
                      <Clock size={12} /> Queue
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {inv.currency} {inv.amount.toFixed(2)}
                </TableCell>
                {/* Removed the Button Cell */}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
