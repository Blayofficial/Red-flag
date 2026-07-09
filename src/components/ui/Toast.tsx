interface ToastProps {
  message: string;
}

export function Toast({ message }: ToastProps) {
  return (
    <div className="fixed bottom-4 right-4 rounded-md border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm text-neutral-100 shadow-lg">
      {message}
    </div>
  );
}
