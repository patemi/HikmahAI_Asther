import DemoClient from "./DemoClient";

export default function DemoPage() {
  const bearerToken = process.env.BEARER_TOKEN || "changeme";

  return <DemoClient bearerToken={bearerToken} />;
}
