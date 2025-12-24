import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Trash2, Plus } from "lucide-react";
import type { Invoice } from "@receipt-app/shared";
import { api } from "@/shared/api/client";
import { useMutation, useQuery } from "@tanstack/react-query";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

// 1. Zod Schema
const lineItemSchema = z.object({
  description: z.string().min(1, "Description required"),
  accountId: z.string().min(1, "Account required"),
  // We use z.number() here. We will handle the string-to-number conversion in the Input component
  quantity: z.number().min(0.01, "Qty must be > 0"),
  rate: z.number().min(0, "Rate must be positive"),
  customerId: z.string().optional(),
});

const billSchema = z.object({
  vendor: z.string(),
  billNumber: z.string().min(1, "Bill # required"),
  billDate: z.string(),
  dueDate: z.string(),
  subject: z.string().optional(),
  lineItems: z.array(lineItemSchema),
});

type BillFormValues = z.infer<typeof billSchema>;

interface Props {
  invoice: Invoice;
  onSuccess: () => void;
}

export function BillEditForm({ invoice, onSuccess }: Props) {
  const { data: accounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: api.getChartOfAccounts,
  });

  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: api.getCustomers,
  });

  const approveMutation = useMutation({
    mutationFn: api.approveInvoice,
    onSuccess: (data) => {
      if (data.status === "success") {
        alert("Approved!");
        onSuccess();
      } else {
        alert("Error: " + data.message);
      }
    },
  });

  const form = useForm<BillFormValues>({
    resolver: zodResolver(billSchema),
    defaultValues: {
      vendor: invoice.vendor,
      billNumber: invoice.invoiceNumber || "",
      billDate: invoice.date || new Date().toISOString().split("T")[0],
      dueDate: invoice.date || new Date().toISOString().split("T")[0],
      subject: "",
      lineItems: [
        {
          description: "Extracted Item",
          accountId: "",
          quantity: 1, // Number
          rate: invoice.amount, // Number
          customerId: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lineItems",
  });

  function onSubmit(data: BillFormValues) {
    const total = data.lineItems.reduce(
      (acc, item) => acc + item.quantity * item.rate,
      0
    );

    approveMutation.mutate({
      id: invoice.id,
      vendor: data.vendor,
      billNumber: data.billNumber,
      billDate: data.billDate,
      dueDate: data.dueDate,
      subject: data.subject || "",
      lineItems: data.lineItems,
      adjustment: 0,
      amount: total,
      orderNumber: "",
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="vendor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor</FormLabel>
                  <FormControl>
                    <Input {...field} readOnly className="bg-gray-100" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="billNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bill #</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="billDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bill Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="font-semibold text-sm text-gray-700">
              Item Details
            </div>
            <div className="text-xs font-mono text-gray-500">
              Subtotal:{" "}
              {form
                .watch("lineItems")
                .reduce(
                  (acc, curr) =>
                    acc +
                    (Number(curr.quantity) || 0) * (Number(curr.rate) || 0),
                  0
                )
                .toFixed(2)}
            </div>
          </div>

          {fields.map((field, index) => (
            <div
              key={field.id}
              className="flex flex-col md:flex-row gap-2 items-start p-2 border rounded-lg bg-white shadow-sm"
            >
              <FormField
                control={form.control}
                name={`lineItems.${index}.description`}
                render={({ field }) => (
                  <FormItem className="flex-1 min-w-[150px]">
                    <FormControl>
                      <Input placeholder="Description" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`lineItems.${index}.accountId`}
                render={({ field }) => (
                  <FormItem className="w-full md:w-48">
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts?.map((acc) => (
                          <SelectItem
                            key={acc.account_id}
                            value={acc.account_id}
                          >
                            {acc.account_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`lineItems.${index}.customerId`}
                render={({ field }) => (
                  <FormItem className="w-full md:w-40">
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Customer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">-- None --</SelectItem>
                        {customers?.map((c: any) => (
                          <SelectItem key={c.contact_id} value={c.contact_id}>
                            {c.contact_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              {/* RATE: Notice the use of valueAsNumber to help TS/Zod match types */}
              <FormField
                control={form.control}
                name={`lineItems.${index}.quantity`}
                render={({ field }) => (
                  <FormItem className="w-20">
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Qty"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`lineItems.${index}.rate`}
                render={({ field }) => (
                  <FormItem className="w-24">
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Rate"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                className="mt-1 hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({
                description: "",
                accountId: "",
                quantity: 1,
                rate: 0,
                customerId: "",
              })
            }
          >
            <Plus className="w-4 h-4 mr-2" /> Add Line
          </Button>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => onSuccess()}>
            Cancel
          </Button>
          <Button type="submit" disabled={approveMutation.isPending}>
            {approveMutation.isPending ? "Processing..." : "Approve Bill"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
