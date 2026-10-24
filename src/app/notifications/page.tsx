import type { Metadata } from "next";
import { NotificationList } from "./notification-list";

export const metadata: Metadata = { title: "Notifications" };

export default function NotificationsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground">New cases near you, updates on cases you follow, and badges you earn.</p>
      </div>
      <NotificationList />
    </div>
  );
}
