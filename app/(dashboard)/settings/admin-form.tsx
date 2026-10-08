"use client";

import { useState } from "react";
import { Pencil, ShieldCheck, UserPlus } from "lucide-react";
import { ModalForm } from "@/components/ui/modal";
import { Field, Input, Select, Label } from "@/components/ui/field";
import { PERMISSIONS } from "@/lib/permissions";
import type { ActionState } from "@/lib/action-state";

type Role = "SUPER_ADMIN" | "ADMIN";

type Admin = {
  id: number;
  name: string;
  username: string;
  phone: string | null;
  role: Role;
  permissions: string[];
  active: boolean;
};

export function AdminForm({
  action,
  admin,
}: {
  action: (fd: FormData) => Promise<ActionState>;
  admin?: Admin;
}) {
  const editing = !!admin;
  const [role, setRole] = useState<Role>(admin?.role ?? "ADMIN");

  return (
    <ModalForm
      title={editing ? "تعديل مستخدم" : "إضافة مستخدم"}
      action={action}
      submitLabel={editing ? "حفظ التعديلات" : "إضافة"}
      trigger={
        editing ? (
          <Pencil className="size-4" />
        ) : (
          <>
            <UserPlus className="size-4" /> إضافة مستخدم
          </>
        )
      }
      triggerVariant={editing ? "ghost" : "primary"}
      triggerSize={editing ? "icon" : "md"}
    >
      {(errors) => (
        <>
          {editing && <input type="hidden" name="id" value={admin!.id} />}

          <div className="mb-1 flex items-center gap-2 rounded-xl bg-[var(--color-primary-soft)] p-3 text-sm text-[var(--color-primary)]">
            <ShieldCheck className="size-4 shrink-0" />
            <span>يتم تخزين كلمة المرور بشكل مُشفّر ولا يمكن استرجاعها.</span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="الاسم" required error={errors.name}>
              <Input name="name" defaultValue={admin?.name} placeholder="الاسم الكامل" />
            </Field>
            <Field label="اسم المستخدم" required error={errors.username}>
              <Input name="username" defaultValue={admin?.username} placeholder="username" dir="ltr" />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="رقم الهاتف" error={errors.phone}>
              <Input name="phone" defaultValue={admin?.phone ?? ""} placeholder="07XXXXXXXXX" />
            </Field>
            <Field label="نوع المستخدم" required error={errors.role}>
              <Select
                name="role"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
              >
                <option value="SUPER_ADMIN">مدير عام</option>
                <option value="ADMIN">أدمن</option>
              </Select>
            </Field>
          </div>

          {/* الصلاحيات */}
          {role === "SUPER_ADMIN" ? (
            <div className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-slate-50 p-3 text-sm text-slate-600">
              <ShieldCheck className="size-4 shrink-0 text-[var(--color-primary)]" />
              المدير العام يملك جميع الصلاحيات تلقائياً.
            </div>
          ) : (
            <div>
              <Label>الصلاحيات</Label>
              <div className="space-y-1.5 rounded-lg border border-[var(--color-border)] p-3">
                {PERMISSIONS.map((p) => (
                  <label
                    key={p.key}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      name="permissions"
                      value={p.key}
                      defaultChecked={admin?.permissions?.includes(p.key)}
                      className="size-4 rounded border-[var(--color-border)] accent-[var(--color-primary)]"
                    />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          <Field
            label={editing ? "كلمة مرور جديدة (اترك الحقل فارغاً للإبقاء)" : "كلمة المرور"}
            required={!editing}
            error={errors.password}
          >
            <Input
              name="password"
              type="password"
              placeholder="••••••"
              dir="ltr"
              autoComplete="new-password"
            />
          </Field>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="active"
              defaultChecked={admin?.active ?? true}
              className="size-4 rounded border-[var(--color-border)] accent-[var(--color-primary)]"
            />
            الحساب مفعّل
          </label>
        </>
      )}
    </ModalForm>
  );
}
