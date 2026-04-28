import { LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatItem = {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  iconClassName?: string;
  iconBgClassName?: string;
};

type StatsGridProps = {
  items: StatItem[];
};

export function StatsGrid({ items }: StatsGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.title} className="ctk-stat-card p-0">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{item.title}</CardTitle>
              <div className={cn("rounded-xl p-2", item.iconBgClassName ?? "bg-primary/10")}>
                <Icon className={cn("h-4 w-4 text-primary", item.iconClassName)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-extrabold tracking-tight">{item.value}</div>
              {item.change ? <p className="text-xs text-emerald-600">{item.change}</p> : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
