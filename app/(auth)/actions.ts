import { signIn } from "next-auth/react";
import { actionError, type ActionState } from "@/lib/action-helpers";
import { redirect } from "next/navigation";

type LoginFields = {
  email: string;
  password: string;
};

type SignUpFields = {
  name: string;
  email: string;
  password: string;
};

export async function loginEmail(
  _prevState: ActionState<LoginFields>,
  data: FormData,
): Promise<ActionState<LoginFields>> {
  const email = String(data.get("email") || "");
  const password = String(data.get("password") || "");
  console.log(email, password);

  if (!email || !password) {
    return actionError("Email and password are required", {
      email,
      password,
    });
  }

  const result = await signIn("credentials", {
    email,
    password,
    redirect: false,
  });

  if (result?.error) {
    return actionError("Invalid email or password", {
      email,
    });
  }

  redirect("/");
}

export async function signUpEmail(
  _prevState: ActionState<SignUpFields>,
  data: FormData,
): Promise<ActionState<SignUpFields>> {
  const name = String(data.get("name") || "");
  const email = String(data.get("email") || "");
  const password = String(data.get("password") || "");

  if (!email || !password || !name) {
    return actionError("All fields are required", {
      email,
      name,
    });
  }

  const result = await fetch("/api/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      email,
      password,
    }),
  });

  if (!result.ok) {
    const error = await result.json();

    return actionError(error.message || "Sign up failed", {
      email,
      name,
    });
  }

  redirect("/login");
}
