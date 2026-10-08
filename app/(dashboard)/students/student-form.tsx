"use client";

import { Pencil, Plus } from "lucide-react";
import { ModalForm } from "@/components/ui/modal";
import { Field, Input } from "@/components/ui/field";
import { toDateInputValue } from "@/lib/format";
import type { ActionState } from "@/lib/action-state";
import { SubjectFields, type SubjectSuggestion } from "./subject-fields";

type Student = {
  id: number;
  name: string;
  phone: string | null;
  birthDate: Date | string | null;
};

export function StudentForm({
  action,
  student,
  subjects = [],
}: {
  action: (fd: FormData) => Promise<ActionState>;
  student?: Student;
  subjects?: SubjectSuggestion[];
}) {
  const editing = !!student;

  return (
    <ModalForm
      title={editing ? "تعديل بيانات الطالب" : "إضافة طالب"}
      action={action}
      submitLabel={editing ? "حفظ التعديلات" : "إضافة"}
      trigger={
        editing ? (
          <Pencil className="size-4" />
        ) : (
          <>
            <Plus className="size-4" /> إضافة طالب
          </>
        )
      }
      triggerVariant={editing ? "ghost" : "primary"}
      triggerSize={editing ? "icon" : "md"}
    >
      {(errors) => (
        <>
          {editing && <input type="hidden" name="id" value={student!.id} />}
          <Field label="اسم الطالب" required error={errors.name}>
            <Input name="name" defaultValue={student?.name} placeholder="الاسم الكامل" />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="رقم الهاتف" error={errors.phone}>
              <Input name="phone" defaultValue={student?.phone ?? ""} placeholder="07XXXXXXXXX" />
            </Field>
            <Field label="المواليد" error={errors.birthDate}>
              <Input type="date" name="birthDate" defaultValue={toDateInputValue(student?.birthDate)} />
            </Field>
          </div>

          {!editing && (
            <SubjectFields suggestions={subjects} error={errors.subjects} />
          )}
        </>
      )}
    </ModalForm>
  );
}
