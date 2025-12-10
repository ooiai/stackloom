"use client";

export default function Error({ error }: { error: Error }) {
  return (
    <div className="p-4 bg-red-100 text-red-800">
      <h1 className="text-2xl font-bold mb-2">Something went wrong!</h1>
      <pre className="whitespace-pre-wrap">{error.message}</pre>
    </div>
  );
}
