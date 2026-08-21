"use client";

import { useActionState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { Field, FormSection, inputClass } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { createUser, updateUserRole, deleteUser, type SettingsFormState } from "@/lib/actions/settings";
import { roleLabels } from "@/lib/labels";
import { UserRole } from "@/generated/prisma/enums";
import type { UserModel as User } from "@/generated/prisma/models";

function RoleSelect({ user, currentUserId }: { user: User; currentUserId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const disabled = user.id === currentUserId;

  return (
    <select
      defaultValue={user.role}
      disabled={disabled || isPending}
      onChange={(e) => {
        startTransition(async () => {
          await updateUserRole(user.id, e.target.value);
          router.refresh();
        });
      }}
      className={`${inputClass} max-w-[180px]`}
      title={disabled ? "Vous ne pouvez pas modifier votre propre rôle" : undefined}
    >
      {Object.values(UserRole).map((role) => (
        <option key={role} value={role}>
          {roleLabels[role]}
        </option>
      ))}
    </select>
  );
}

function NewUserForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<SettingsFormState, FormData>(async (prevState, formData) => {
    const result = await createUser(prevState, formData);
    if (result.success) {
      router.refresh();
      formRef.current?.reset();
    }
    return result;
  }, {});

  return (
    <form ref={formRef} action={formAction} className="max-w-2xl">
      <FormSection title="Ajouter un utilisateur">
        <Field label="Nom" htmlFor="new-name" required error={state.fieldErrors?.name}>
          <input id="new-name" name="name" required className={inputClass} />
        </Field>
        <Field label="Email" htmlFor="new-email" required error={state.fieldErrors?.email}>
          <input id="new-email" name="email" type="email" required className={inputClass} />
        </Field>
        <Field label="Mot de passe" htmlFor="new-password" required error={state.fieldErrors?.password}>
          <input id="new-password" name="password" type="password" required minLength={8} className={inputClass} />
        </Field>
        <Field label="Rôle" htmlFor="new-role" required error={state.fieldErrors?.role}>
          <select id="new-role" name="role" defaultValue={UserRole.VIEWER} className={inputClass}>
            {Object.values(UserRole).map((role) => (
              <option key={role} value={role}>
                {roleLabels[role]}
              </option>
            ))}
          </select>
        </Field>
      </FormSection>
      {state.error && <p className="mb-3 text-sm text-[var(--color-critical)]">{state.error}</p>}
      {state.success && <p className="mb-3 text-sm text-[var(--color-low)]">{state.success}</p>}
      <Button type="submit" variant="primary" disabled={pending}>
        {pending ? "Création..." : "+ Ajouter un utilisateur"}
      </Button>
    </form>
  );
}

export function UsersManager({
  users,
  currentUserId,
  canManage,
}: {
  users: User[];
  currentUserId: string;
  canManage: boolean;
}) {
  return (
    <div>
      <Table>
        <Thead>
          <Th>Nom</Th>
          <Th>Email</Th>
          <Th>Rôle</Th>
          {canManage && <Th />}
        </Thead>
        <Tbody>
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <Td className="font-medium text-[var(--color-text)]">
                {user.name} {user.id === currentUserId && <span className="text-[var(--color-text-secondary)]">(vous)</span>}
              </Td>
              <Td className="text-[var(--color-text-secondary)]">{user.email}</Td>
              <Td>
                {canManage ? (
                  <RoleSelect user={user} currentUserId={currentUserId} />
                ) : (
                  roleLabels[user.role]
                )}
              </Td>
              {canManage && (
                <Td className="text-right">
                  {user.id !== currentUserId && (
                    <DeleteButton
                      action={deleteUser}
                      id={user.id}
                      confirmMessage={`Supprimer l'utilisateur "${user.name}" ?`}
                    />
                  )}
                </Td>
              )}
            </tr>
          ))}
        </Tbody>
      </Table>

      {canManage && (
        <div className="mt-6">
          <NewUserForm />
        </div>
      )}
    </div>
  );
}
