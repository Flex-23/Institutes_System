"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ok, fail, type ActionState } from "@/lib/action-state";
import { hashPassword } from "@/lib/auth";
import { PERMISSION_KEYS } from "@/lib/permissions";

const baseSchema = z.object({
  name: z.string().trim().min(2, "الاسم مطلوب"),
  username: z
    .string()
    .trim()
    .min(3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل")
    .regex(/^[A-Za-z0-9_.-]+$/, "أحرف إنجليزية وأرقام فقط"),
  phone: z.string().trim().optional().or(z.literal("")),
  role: z.enum(["SUPER_ADMIN", "ADMIN"]),
  active: z.boolean(),
});

function fieldErrors(e: z.ZodError) {
  const errors: Record<string, string> = {};
  for (const i of e.issues) errors[String(i.path[0])] = i.message;
  return errors;
}

function common(formData: FormData) {
  return {
    name: formData.get("name"),
    username: formData.get("username"),
    phone: formData.get("phone"),
    role: formData.get("role"),
    active: formData.get("active") === "on" || formData.get("active") === "true",
  };
}

/// يحدّد صلاحيات المستخدم: المدير العام يملك الكل، والأدمن حسب اختيار المدير
function resolvePermissions(formData: FormData, role: string): string {
  if (role === "SUPER_ADMIN") return PERMISSION_KEYS.join(",");
  const valid = new Set<string>(PERMISSION_KEYS);
  const chosen = formData
    .getAll("permissions")
    .map(String)
    .filter((k) => valid.has(k));
  return [...new Set(chosen)].join(",");
}

export async function createAdmin(formData: FormData): Promise<ActionState> {
  const parsed = baseSchema
    .extend({ password: z.string().min(6, "كلمة المرور 6 أحرف على الأقل") })
    .safeParse({ ...common(formData), password: formData.get("password") });
  if (!parsed.success) return fail("تحقّق من الحقول", fieldErrors(parsed.error));
  const d = parsed.data;

  try {
    await prisma.admin.create({
      data: {
        name: d.name,
        username: d.username,
        phone: d.phone || null,
        role: d.role,
        permissions: resolvePermissions(formData, d.role),
        active: d.active,
        passwordHash: hashPassword(d.password),
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return fail("تحقّق من الحقول", { username: "اسم المستخدم مستخدم مسبقاً" });
    }
    throw e;
  }

  revalidatePath("/settings");
  return ok("تمت إضافة المستخدم بنجاح");
}

export async function updateAdmin(formData: FormData): Promise<ActionState> {
  const id = Number(formData.get("id"));
  const password = String(formData.get("password") ?? "");
  const schema = password
    ? baseSchema.extend({ password: z.string().min(6, "كلمة المرور 6 أحرف على الأقل") })
    : baseSchema;
  const parsed = schema.safeParse({ ...common(formData), password: password || undefined });
  if (!parsed.success) return fail("تحقّق من الحقول", fieldErrors(parsed.error));
  const d = parsed.data;

  const data: Prisma.AdminUpdateInput = {
    name: d.name,
    username: d.username,
    phone: d.phone || null,
    role: d.role,
    permissions: resolvePermissions(formData, d.role),
    active: d.active,
  };
  if (password) data.passwordHash = hashPassword(password);

  try {
    await prisma.admin.update({ where: { id }, data });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return fail("تحقّق من الحقول", { username: "اسم المستخدم مستخدم مسبقاً" });
    }
    throw e;
  }

  revalidatePath("/settings");
  return ok("تم تعديل بيانات المستخدم");
}

export async function deleteAdmin(formData: FormData): Promise<ActionState> {
  const id = Number(formData.get("id"));
  const total = await prisma.admin.count();
  if (total <= 1) return fail("لا يمكن حذف آخر مستخدم في النظام");
  await prisma.admin.delete({ where: { id } });
  revalidatePath("/settings");
  return ok("تم حذف المستخدم");
}
