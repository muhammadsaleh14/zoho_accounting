// File: apps/web-plugin/src/components/NotificationDropdown.tsx
export const NotificationDropdown = ({ onClose }: { onClose: () => void }) => (
  <div className="absolute top-12 right-0 w-64 bg-white border rounded-lg shadow-lg z-50 p-4">
    <p className="font-bold">Notifications</p>
    <p className="text-xs text-gray-500 mt-2">No new notifications.</p>
  </div>
);
