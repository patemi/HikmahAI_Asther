"use server";

import { db, schema } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const user = await getSession();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const email = formData.get("email") as string;
  const name = formData.get("name") as string;

  if (!email) {
    return { error: "Email is required" };
  }

  try {
    // Check if email is already taken by another user
    const existingUser = await db.query.users.findFirst({
      where: eq(schema.users.email, email),
    });

    if (existingUser && existingUser.id !== user.id) {
      return { error: "Email is already taken" };
    }

    await db
      .update(schema.users)
      .set({
        email,
        name: name || null,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, user.id));

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    console.error("Update profile error:", error);
    return { error: "Failed to update profile" };
  }
}

export async function changePassword(formData: FormData) {
  const user = await getSession();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "All fields are required" };
  }

  if (newPassword !== confirmPassword) {
    return { error: "New passwords do not match" };
  }

  if (newPassword.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  try {
    // Verify current password
    const dbUser = await db.query.users.findFirst({
      where: eq(schema.users.id, user.id),
    });

    if (!dbUser) {
      return { error: "User not found" };
    }

    const validPassword = await bcrypt.compare(currentPassword, dbUser.passwordHash);
    if (!validPassword) {
      return { error: "Current password is incorrect" };
    }

    // Update password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await db
      .update(schema.users)
      .set({
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, user.id));

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    console.error("Change password error:", error);
    return { error: "Failed to change password" };
  }
}
