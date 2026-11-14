import HomePage from "@/components/home/HomePage";
import { homeMetadata } from "@/lib/localeSeo";

export const metadata = homeMetadata("tr");

export default function Page() {
  return <HomePage />;
}
