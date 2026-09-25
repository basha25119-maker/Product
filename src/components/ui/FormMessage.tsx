export function FormMessage({ error, success }: { error?: string; success?: string }) {
  if (!error && !success) return null;
  return (
    <p className={`mb-4 rounded-lg px-3 py-2 text-sm ${error ? "bg-danger/10 text-danger" : "bg-success/10 text-success"}`}>
      {error || success}
    </p>
  );
}
