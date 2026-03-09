"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_USERS, type DemoUserId } from "@/lib/demo-users";

export async function loginAction(userId: string): Promise<void> {
  const validUser = DEMO_USERS[userId as DemoUserId];
  if (!validUser) {
    throw new Error("Invalid demo user");
  }

  const cookieStore = await cookies();
  cookieStore.set("buyeros-session", userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  redirect("/overview");
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("buyeros-session");
  redirect("/login");
}
