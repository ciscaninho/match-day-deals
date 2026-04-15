import { Badge } from "@/components/ui/badge";
import type { TicketStatus } from "@/data/matches";

const statusConfig: Record<TicketStatus, { label: string; className: string }> = {
  on_sale: { label: "On Sale", className: "bg-ticket-available text-primary-foreground" },
  not_released: { label: "Coming Soon", className: "bg-ticket-soon text-accent-foreground" },
  sold_out: { label: "Sold Out", className: "bg-ticket-soldout text-primary-foreground" },
};

export const TicketStatusBadge = ({ status }: { status: TicketStatus }) => {
  const config = statusConfig[status];
  return (
    <Badge className={`${config.className} text-xs font-semibold border-0`}>
      {config.label}
    </Badge>
  );
};
