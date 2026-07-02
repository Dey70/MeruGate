import { createClient } from "@/lib/supabase/server";
import { ChatWindow } from "@/components/chat/chat-window";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ topicId?: string }>;
}) {
  const { topicId } = await searchParams;

  let topicTitle: string | undefined;
  if (topicId) {
    const supabase = await createClient();
    const { data } = await supabase.from("topics").select("title").eq("id", topicId).maybeSingle();
    topicTitle = data?.title;
  }

  return <ChatWindow topicId={topicId} topicTitle={topicTitle} />;
}
