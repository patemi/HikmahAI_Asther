export async function register() {
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.NODE_ENV !== "test"
  ) {
    const { runMaintenance } = await import("@/lib/maintenance");
    const timer = setInterval(
      () => {
        void runMaintenance().catch(() =>
          console.error(
            "[Maintenance] Cleanup failed; will retry on the next interval.",
          ),
        );
      },
      60 * 60 * 1000,
    );
    timer.unref();
  }
}
