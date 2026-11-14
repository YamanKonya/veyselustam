import HomePage from "@/components/home/HomePage";
import { homeMetadata } from "@/lib/localeSeo";
import { isLocale } from "@/lib/locale";

export function generateMetadata({ params }: { params: { lang: string } }) {
  return homeMetadata(isLocale(params.lang) ? params.lang : "tr");
}

export default function Page() {
  return <HomePage />;
}
