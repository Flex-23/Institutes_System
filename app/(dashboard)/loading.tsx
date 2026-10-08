import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center text-slate-400">
      <Loader2 className="size-8 animate-spin" />
    </div>
  );
}
