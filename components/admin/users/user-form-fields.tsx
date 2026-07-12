import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLES, type UserRole } from "@/lib/tables/users/types";

export function UserFormFields({
  withPassword,
  defaultName,
  defaultEmail,
  role,
  onRoleChange,
}: {
  withPassword?: boolean;
  defaultName?: string;
  defaultEmail?: string;
  role: UserRole;
  onRoleChange: (role: UserRole) => void;
}) {
  return (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label>Name</Label>
        <Input name="name" defaultValue={defaultName} required />
      </div>
      <div className="grid gap-2">
        <Label>Email</Label>
        <Input name="email" type="email" defaultValue={defaultEmail} required />
      </div>
      {withPassword && (
        <div className="grid gap-2">
          <Label>Password</Label>
          <Input name="password" type="password" required />
        </div>
      )}
      <div className="grid gap-2">
        <Label>Role</Label>
        <Select value={role} onValueChange={(v) => onRoleChange(v as UserRole)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
