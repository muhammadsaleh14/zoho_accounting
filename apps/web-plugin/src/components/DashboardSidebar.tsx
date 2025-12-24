import {
  Search,
  Filter,
  FileText,
  Receipt,
  Landmark,
  Banknote,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { DocumentCategory } from "@receipt-app/shared";

// Define the filter types (can be a category or 'all')
export type FilterType = DocumentCategory | "all";

interface Props {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

export function DashboardSidebar({ activeFilter, onFilterChange }: Props) {
  // Helper to determine button variant based on active state
  const getVariant = (filter: FilterType) =>
    activeFilter === filter ? "secondary" : "ghost";

  const getClasses = (filter: FilterType) =>
    `w-full justify-start ${activeFilter === filter ? "font-bold text-blue-700 bg-blue-50" : "text-gray-600"}`;

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full flex-shrink-0">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Filters
          </h2>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search vendor..."
            className="pl-9 bg-gray-50 border-gray-200"
          />
        </div>

        <div className="space-y-1">
          {/* ALL DOCUMENTS */}
          <Button
            variant={getVariant("all")}
            className={getClasses("all")}
            onClick={() => onFilterChange("all")}
          >
            <FileText className="mr-2 h-4 w-4" />
            All Documents
          </Button>

          {/* BILLS (AP) */}
          <Button
            variant={getVariant("bill")}
            className={getClasses("bill")}
            onClick={() => onFilterChange("bill")}
          >
            <Receipt className="mr-2 h-4 w-4" />
            Bills & Expenses
          </Button>

          {/* BANK STATEMENTS */}
          <Button
            variant={getVariant("bank_statement")}
            className={getClasses("bank_statement")}
            onClick={() => onFilterChange("bank_statement")}
          >
            <Landmark className="mr-2 h-4 w-4" />
            Bank Statements
          </Button>

          {/* INVOICES (AR) */}
          <Button
            variant={getVariant("invoice")}
            className={getClasses("invoice")}
            onClick={() => onFilterChange("invoice")}
          >
            <Banknote className="mr-2 h-4 w-4" />
            Sales Invoices
          </Button>
        </div>
      </div>

      <div className="mt-auto p-4 border-t border-gray-100">
        <Button
          variant="outline"
          className="w-full justify-start text-gray-600"
        >
          <Filter className="mr-2 h-4 w-4" />
          Advanced Filters
        </Button>
      </div>
    </aside>
  );
}
