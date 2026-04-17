'use client';

import { useQuery } from '@tanstack/react-query';

/**
 * Example component demonstrating TanStack Query usage
 * This is a simple example that fetches data from a mock API
 */
export function QueryExample() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['example'],
    queryFn: async () => {
      // Example API call - replace with your actual API
      const response = await fetch('https://api.example.com/data');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    },
    enabled: false, // Set to true when you have a real API endpoint
  });

  if (isLoading) {
    return (
      <div className="rounded-lg border p-4">
        <h3 className="mb-2 text-lg font-semibold">TanStack Query Example</h3>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border p-4">
        <h3 className="mb-2 text-lg font-semibold">TanStack Query Example</h3>
        <p className="text-sm text-destructive">
          Error: {(error as Error).message}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-2 text-lg font-semibold">TanStack Query Example</h3>
      <p className="text-sm text-muted-foreground">
        Query is disabled. Enable it by setting `enabled: true` and providing a
        real API endpoint.
      </p>
      {data && (
        <pre className="mt-2 rounded bg-muted p-2 text-xs">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
