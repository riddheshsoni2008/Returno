import { redirect } from 'next/navigation';

export default async function JoinLegacyPage(props) {
  const params = await props.params;
  const campaignId = params.campaignId;
  redirect(`/join/campaign/${campaignId}`);
}
