import type * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type Option = {
  value: string;
  label: string;
};

export function FormFieldText({
  label,
  name,
  description,
  error,
  ...props
}: React.ComponentProps<typeof Input> & {
  label: string;
  name: string;
  description?: string;
  error?: string;
}) {
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <Input id={name} name={name} aria-invalid={Boolean(error)} {...props} />
      {description && <FieldDescription>{description}</FieldDescription>}
      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
}

export function FormFieldSelect({
  label,
  name,
  options,
  placeholder = "Select",
  error,
  ...props
}: React.ComponentProps<typeof Select> & {
  label: string;
  name: string;
  options: Option[];
  placeholder?: string;
  error?: string;
}) {
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <Select id={name} name={name} aria-invalid={Boolean(error)} {...props}>
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
}

export function SubmitButton({
  pending,
  children,
}: {
  pending?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Working..." : children}
    </Button>
  );
}
