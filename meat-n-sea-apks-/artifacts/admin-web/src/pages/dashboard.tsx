import { useGetAdminDailyReport, useGetAnalyticsSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign, ShoppingCart, Users, Store, AlertCircle } from "lucide-react";

function formatPaise(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function StatCard({
  title,
  value,
  icon: Icon,
  sub,
  accent,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
  accent?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
            <p className={`mt-1 text-2xl font-bold ${accent ?? "text-foreground"}`}>{value}</p>
            {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-4 h-4 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: report, isLoading: reportLoading, error: reportError } = useGetAdminDailyReport();
  const { data: analytics, isLoading: analyticsLoading } = useGetAnalyticsSummary();

  return (
    <div className="p-8">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Today's performance at a glance</p>
      </div>

      {reportError && (
        <div className="mb-5 flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Could not load report. The API may still be connecting to the database.
        </div>
      )}

      {reportLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="h-4 bg-muted rounded animate-pulse w-24 mb-2" />
                <div className="h-7 bg-muted rounded animate-pulse w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : report ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Orders Today" value={report.totalOrders} icon={ShoppingCart} />
          <StatCard
            title="Gross Revenue"
            value={formatPaise(report.grossRevenuePaise)}
            icon={DollarSign}
            accent="text-primary"
          />
          <StatCard
            title="Platform Fee"
            value={formatPaise(report.platformFeePaise)}
            icon={TrendingUp}
            accent="text-accent"
          />
          <StatCard title="Total Vendors" value={report.totalVendors ?? "—"} icon={Store} />
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top vendor */}
        {report?.topVendorName && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Top Vendor Today
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                  <Store className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{report.topVendorName}</p>
                  <p className="text-xs text-muted-foreground">Most orders today</p>
                </div>
                <Badge variant="secondary" className="ml-auto">Top Performer</Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order status breakdown */}
        {report?.statusBreakdown && report.statusBreakdown.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Order Status Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {report.statusBreakdown.map((s) => (
                <div key={s._id} className="flex items-center justify-between text-sm">
                  <span className="text-foreground capitalize">{s._id?.replace(/_/g, " ")}</span>
                  <Badge variant="outline">{s.count}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Analytics trend */}
        {!analyticsLoading && analytics?.orderTrend && analytics.orderTrend.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                7-Day Order Trend
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {analytics.orderTrend.map((d) => (
                  <div key={d._id} className="flex items-center gap-4 text-sm">
                    <span className="w-24 text-muted-foreground shrink-0">{d._id}</span>
                    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.max(4, ((d.orders ?? 0) / Math.max(...(analytics.orderTrend?.map((x) => x.orders ?? 0) ?? [1]))) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="w-12 text-right font-medium text-foreground">{d.orders}</span>
                    <span className="w-24 text-right text-muted-foreground">{formatPaise(d.revenuePaise ?? 0)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
