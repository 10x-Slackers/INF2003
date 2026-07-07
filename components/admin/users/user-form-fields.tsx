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
        <Label htmlFor="user-name">Name</Label>
        <Input id="user-name" name="name" defaultValue={defaultName} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="user-email">Email</Label>
        <Input
          id="user-email"
          name="email"
          type="email"
          defaultValue={defaultEmail}
          required
        />
      </div>
      {withPassword && (
        <div className="grid gap-2">
          <Label htmlFor="user-password">Password</Label>
          <Input id="user-password" name="password" type="password" required />
        </div>
      )}
      <div className="grid gap-2">
        <Label htmlFor="user-role">Role</Label>
        <Select value={role} onValueChange={(v) => onRoleChange(v as UserRole)}>
          <SelectTrigger id="user-role">
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
