import { Flag, Receipt, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ExpenseReviewButtons, FlagReviewButtons, VetReviewButtons } from "@/components/admin/review-buttons";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireRole } from "@/lib/auth";
import { formatMoney, timeAgo } from "@/lib/format";
import { getAdminStats, listOpenFlags, listPendingExpenses, listPendingVets } from "@/lib/queries/admin";

export const metadata: Metadata = { title: "Admin" };

async function Body() {
  await requireRole(["admin"], "/admin");
  const [stats, vets, flags, expenses] = await Promise.all([
    getAdminStats(),
    listPendingVets(),
    listOpenFlags(),
    listPendingExpenses(),
  ]);

  const tiles = [
    { label: "Open cases", value: stats.openCases },
    { label: "Resolved", value: stats.resolvedCases },
    { label: "Community", value: stats.users },
    { label: "General fund", value: formatMoney(Math.max(0, stats.generalBalanceCents)) },
    { label: "Spent on treatment", value: formatMoney(stats.approvedSpentCents) },
    { label: "Covered by general fund", value: formatMoney(stats.coveredByGeneralCents) },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Admin</h1>
        <p className="text-muted-foreground">Verify vets, moderate reports, and approve spending.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {tiles.map((t) => (
          <Card key={t.label} className="py-4">
            <CardContent className="px-4">
              <div className="text-2xl font-semibold">{t.value}</div>
              <div className="text-xs text-muted-foreground">{t.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        General fund balance is donations to the fund minus case spending that wasn&apos;t covered by per-case donations.
        {stats.receiptsBackedPct}% of approved spending has a receipt.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5" /> Vet verification
            {vets.length > 0 && <Badge variant="secondary">{vets.length}</Badge>}
          </CardTitle>
          <CardDescription>License numbers and uploaded documents before a vet can take a slot.</CardDescription>
        </CardHeader>
        <CardContent>
          {vets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending vets.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vet</TableHead>
                  <TableHead>License</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {vets.map((v) => (
                  <TableRow key={v.userId}>
                    <TableCell>
                      <Link href={`/profile/${v.userId}`} className="font-medium hover:underline">
                        {v.name}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {v.city} · {v.email}
                      </div>
                      {v.rejectedReason && (
                        <div className="text-xs text-destructive">Previously declined: {v.rejectedReason}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {v.licenseNumber}
                      {v.clinicName ? <div className="text-xs text-muted-foreground">{v.clinicName}</div> : null}
                    </TableCell>
                    <TableCell>
                      {v.licenseDocUrl ? (
                        <a href={v.licenseDocUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                          View
                        </a>
                      ) : (
                        <span className="text-muted-foreground">None yet</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <VetReviewButtons userId={v.userId} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="size-5" /> Flagged cases
            {flags.length > 0 && <Badge variant="secondary">{flags.length}</Badge>}
          </CardTitle>
          <CardDescription>Dismiss noise, or hide a report that shouldn&apos;t stay public.</CardDescription>
        </CardHeader>
        <CardContent>
          {flags.length === 0 ? (
            <p className="text-sm text-muted-foreground">No open flags.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {flags.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>
                      <Link href={`/cases/${f.caseId}`} className="font-medium hover:underline">
                        {f.caseTitle}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        Reported by {f.reporterName} · flagged by {f.flaggerName} · {timeAgo(f.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs whitespace-normal">{f.reason}</TableCell>
                    <TableCell className="text-right">
                      <FlagReviewButtons flagId={f.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="size-5" /> Expenses
            {expenses.length > 0 && <Badge variant="secondary">{expenses.length}</Badge>}
          </CardTitle>
          <CardDescription>Approved amounts are added to the case&apos;s published spend.</CardDescription>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing waiting for review.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Expense</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      <div className="font-medium">
                        {formatMoney(e.amountCents)} · {e.description}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {e.submitterName} on{" "}
                        <Link href={`/cases/${e.caseId}`} className="hover:underline">
                          {e.caseTitle}
                        </Link>{" "}
                        · {timeAgo(e.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {e.receiptUrl ? (
                        <a href={e.receiptUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                          Receipt
                        </a>
                      ) : (
                        <span className="text-muted-foreground">No receipt</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <ExpenseReviewButtons expenseId={e.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
        <Body />
      </Suspense>
    </div>
  );
}
