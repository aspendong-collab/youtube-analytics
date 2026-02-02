export default function HealthPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Health Check</h1>
      <p className="mt-4">System is running normally.</p>
      <div className="mt-4 space-y-2">
        <p><strong>NEXTAUTH_URL:</strong> {process.env.NEXTAUTH_URL || 'Not set'}</p>
        <p><strong>NEXTAUTH_SECRET:</strong> {process.env.NEXTAUTH_SECRET ? 'Set (hidden)' : 'Not set'}</p>
      </div>
    </div>
  );
}
