import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4 text-center">
      <p className="text-6xl font-bold text-primary/20">404</p>
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        The page you're looking for doesn't exist, or you don't have access to it.
      </p>
      <Link href="/" className="mt-2 text-sm font-medium text-accent hover:underline">
        Go home
      </Link>
    </div>
  );
}
