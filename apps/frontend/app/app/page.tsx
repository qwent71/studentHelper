export default function AppPage() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {["Recent Chats", "Study Progress", "Upcoming Tasks"].map((title) => (
        <div
          key={title}
          className="bg-card text-card-foreground rounded-lg border p-5 md:p-4"
        >
          <h3 className="text-sm font-medium">{title}</h3>
          <p className="text-muted-foreground mt-2 text-2xl font-bold">
            &mdash;
          </p>
          <p className="text-muted-foreground mt-1 text-xs">Coming soon</p>
        </div>
      ))}
    </div>
  );
}
