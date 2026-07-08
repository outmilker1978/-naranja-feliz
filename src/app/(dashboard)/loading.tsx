export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto w-full px-6 py-8">
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-zinc-200 rounded" />
        <div className="h-4 w-96 bg-zinc-100 rounded" />
        <div className="grid grid-cols-3 gap-4">
          <div className="h-32 bg-zinc-100 rounded-xl" />
          <div className="h-32 bg-zinc-100 rounded-xl" />
          <div className="h-32 bg-zinc-100 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
