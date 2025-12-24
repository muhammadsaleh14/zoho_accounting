import { Building2, UserCircle, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@receipt-app/shared/api/client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner"; // <--- Direct import

export function Header() {
  const syncMutation = useMutation({
    mutationFn: api.triggerMasterSync,
    onSuccess: () => {
      // Sonner API: toast(title, { description: ... })
      toast.success("Sync Started", {
        description: "Updating Vendors and Accounts in the background...",
      });
    },
    onError: () => {
      toast.error("Sync Failed", {
        description: "Could not connect to backend.",
      });
    },
  });

  return (
    <header className="h-16 bg-slate-900 text-white flex items-center justify-between px-6 shadow-md z-30 flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="bg-blue-600 p-2 rounded-lg">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight">Finance AI</h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white"
        >
          {syncMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Sync Master Data
        </Button>

        <div className="h-6 w-px bg-slate-700 mx-2" />

        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-200">Admin</p>
          </div>
          <UserCircle className="w-9 h-9 text-slate-400" />
        </div>
      </div>
    </header>
  );
}
