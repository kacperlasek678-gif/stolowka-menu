import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
};

export default function StatCard({
  title,
  value,
  icon: Icon,
  description,
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            {value}
          </p>

          {description && (
            <p className="mt-2 text-xs text-gray-400">
              {description}
            </p>
          )}
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100 text-yellow-700">
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}