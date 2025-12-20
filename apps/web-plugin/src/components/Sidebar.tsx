import type { Invoice } from '@receipt-app/shared';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useRef } from 'react';

interface Props {
  selectedId: string | null;
  onSelect: (invoice: Invoice) => void;
}

export function Sidebar({ selectedId, onSelect }: Props) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch List
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: api.getInvoices,
  });

  // 2. Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: api.uploadReceipt,
    onSuccess: (newInvoice) => {
      // Refresh the list automatically
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      // Auto-select the new item
      onSelect(newInvoice);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  return (
    <aside className="w-80 bg-white border-r border-gray-200 flex flex-col h-full flex-shrink-0">
      
      {/* Header with Upload */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Incoming Queue
          </h2>
          {/* Status Indicators */}
          {isLoading && <span className="text-xs text-blue-500">Syncing...</span>}
          {uploadMutation.isPending && <span className="text-xs text-purple-600 font-bold animate-pulse">AI Processing...</span>}
        </div>

        {/* Upload Button */}
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*,.pdf"
          onChange={handleFileChange}
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadMutation.isPending}
          className="w-full py-2 px-3 bg-white border border-gray-300 rounded text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-blue-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <span>☁️</span> 
          {uploadMutation.isPending ? 'Scanning Receipt...' : 'Upload Receipt'}
        </button>
      </div>

      {/* List Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Optimistic / Loading State for Upload */}
        {uploadMutation.isPending && (
          <div className="p-4 border-b border-purple-100 bg-purple-50 animate-pulse">
            <div className="h-4 bg-purple-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-purple-200 rounded w-3/4"></div>
          </div>
        )}

        {invoices?.map((invoice) => (
          <div
            key={invoice.id}
            onClick={() => onSelect(invoice)}
            className={`
              p-4 border-b border-gray-100 cursor-pointer transition-colors duration-150
              ${selectedId === invoice.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50 border-l-4 border-l-transparent'}
            `}
          >
            <div className="flex justify-between items-start mb-1">
              <span className="font-semibold text-gray-800 text-sm">
                {invoice.vendor}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                invoice.status === 'review' 
                  ? 'bg-red-100 text-red-600' 
                  : 'bg-green-100 text-green-600'
              }`}>
                {invoice.status}
              </span>
            </div>
            
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>{invoice.date}</span>
              <span className="font-mono font-medium text-gray-700">
                ${invoice.amount.toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}