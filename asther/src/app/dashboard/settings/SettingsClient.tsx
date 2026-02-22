"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { updateProfile, changePassword } from "@/app/actions/settings";
import Toast from "@/components/Toast";

interface SettingsClientProps {
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export default function SettingsClient({ user }: SettingsClientProps) {
  const [profileMessage, setProfileMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  async function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage(null);

    const formData = new FormData(e.currentTarget);
    const result = await updateProfile(formData);

    if (result.error) {
      setProfileMessage({ type: "error", text: result.error });
    } else {
      setProfileMessage({ type: "success", text: "Profile updated successfully" });
    }
    setProfileLoading(false);
  }

  async function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage(null);

    const formData = new FormData(e.currentTarget);
    const result = await changePassword(formData);

    if (result.error) {
      setPasswordMessage({ type: "error", text: result.error });
    } else {
      setPasswordMessage({ type: "success", text: "Password changed successfully" });
      e.currentTarget.reset();
    }
    setPasswordLoading(false);
  }

  return (
    <div className="space-y-6" suppressHydrationWarning>
      {profileMessage && (
        <Toast
          message={profileMessage.text}
          type={profileMessage.type}
          onClose={() => setProfileMessage(null)}
        />
      )}
      {passwordMessage && (
        <Toast
          message={passwordMessage.text}
          type={passwordMessage.type}
          onClose={() => setPasswordMessage(null)}
        />
      )}
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Settings</h1>
        <p className="text-sm text-stone-500 mt-1">
          Manage your account settings and preferences
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <div className="bg-white border border-stone-200 rounded-lg p-5">
          <h2 className="text-lg font-medium text-stone-900 mb-4">Profile</h2>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="loginEmail"
                className="block text-sm font-medium text-stone-700 mb-1"
              >
                Login Email
              </label>
              <input
                type="text"
                id="loginEmail"
                value={user.email}
                disabled
                className="w-full px-3 py-2 bg-stone-100 border border-stone-200 rounded-lg text-stone-500 text-sm cursor-not-allowed"
              />
              <p className="text-xs text-stone-400 mt-1">Login email cannot be changed</p>
            </div>

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-stone-700 mb-1"
              >
                Display Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                defaultValue={user.name}
                placeholder="Enter your display name"
                suppressHydrationWarning
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-stone-900 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              suppressHydrationWarning
              className="px-4 py-2 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {profileLoading ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </div>

        {/* Password Settings */}
        <div className="bg-white border border-stone-200 rounded-lg p-5">
          <h2 className="text-lg font-medium text-stone-900 mb-4">Change Password</h2>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="currentPassword"
                className="block text-sm font-medium text-stone-700 mb-1"
              >
                Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                required
                suppressHydrationWarning
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-stone-900 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
              />
            </div>

            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-stone-700 mb-1"
              >
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                required
                minLength={6}
                suppressHydrationWarning
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-stone-900 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
              />
              <p className="text-xs text-stone-400 mt-1">Minimum 6 characters</p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-stone-700 mb-1"
              >
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                required
                minLength={6}
                suppressHydrationWarning
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-stone-900 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              suppressHydrationWarning
              className="px-4 py-2 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {passwordLoading ? "Changing..." : "Change Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
