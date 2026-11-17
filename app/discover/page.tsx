import { DiscoverScreen } from "@/components/discover/discover-screen";
import { demoResetEnabled } from "@/lib/demo";

export const dynamic = "force-dynamic";

export default function DiscoverPage() {
  return <DiscoverScreen canReset={demoResetEnabled()} />;
}
