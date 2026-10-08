import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import { prisma } from "@/lib/prisma";
import { formatDateShort } from "@/lib/format";
import { ADMIN_ROLE } from "@/lib/labels";
import { parsePermissions, permissionLabel } from "@/lib/permissions";
import { AdminForm } from "./admin-form";
import { createAdmin, updateAdmin, deleteAdmin } from "./actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const admins = await prisma.admin.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div>
      <PageHeader
        title="المستخدمون"
        subtitle="إضافة مستخدمي النظام وتحديد صلاحياتهم"
        actions={<AdminForm action={createAdmin} />}
      />

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>المستخدمون ({admins.length})</CardTitle>
        </CardHeader>
        <Table>
          <THead>
            <TR>
              <TH>الاسم</TH>
              <TH>اسم المستخدم</TH>
              <TH>النوع</TH>
              <TH>الصلاحيات</TH>
              <TH>الحالة</TH>
              <TH>تاريخ الإضافة</TH>
              <TH className="text-center">إجراءات</TH>
            </TR>
          </THead>
          <TBody>
            {admins.length === 0 && <EmptyRow colSpan={7} message="لا يوجد مستخدمون بعد" />}
            {admins.map((a) => {
              const role = ADMIN_ROLE[a.role];
              const perms = parsePermissions(a.permissions);
              return (
                <TR key={a.id}>
                  <TD className="font-medium text-slate-800">{a.name}</TD>
                  <TD className="tnum text-slate-500" dir="ltr">
                    {a.username}
                  </TD>
                  <TD>
                    <Badge tone={role?.tone ?? "neutral"}>{role?.label ?? a.role}</Badge>
                  </TD>
                  <TD>
                    {a.role === "SUPER_ADMIN" ? (
                      <Badge tone="primary">جميع الصلاحيات</Badge>
                    ) : perms.length === 0 ? (
                      <span className="text-xs text-slate-400">لا توجد صلاحيات</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {perms.map((p) => (
                          <Badge key={p} tone="info">
                            {permissionLabel(p)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TD>
                  <TD>
                    <Badge tone={a.active ? "success" : "neutral"}>
                      {a.active ? "مفعّل" : "معطّل"}
                    </Badge>
                  </TD>
                  <TD className="tnum text-slate-500">{formatDateShort(a.createdAt)}</TD>
                  <TD>
                    <div className="flex items-center justify-center gap-1">
                      <AdminForm
                        action={updateAdmin}
                        admin={{
                          id: a.id,
                          name: a.name,
                          username: a.username,
                          phone: a.phone,
                          role: a.role,
                          permissions: perms,
                          active: a.active,
                        }}
                      />
                      <ConfirmDelete action={deleteAdmin} id={a.id} />
                    </div>
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
