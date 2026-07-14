import { NotificationList } from "@/features/notifications/components";

export default function NotificationsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-foreground text-3xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground text-sm">
          Updates from orchestration runs and other platform events.
        </p>
      </div>
      <NotificationList />
    </div>
  );
}
