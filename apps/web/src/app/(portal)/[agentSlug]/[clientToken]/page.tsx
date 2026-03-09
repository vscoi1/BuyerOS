import { redirect } from "next/navigation";

export default async function ClientPortalPage({
  params,
}: PageProps<"/[agentSlug]/[clientToken]">) {
  const { clientToken } = await params;
  redirect(`/portal/access/${encodeURIComponent(clientToken)}`);
}
