import { supabase } from "@/lib/supabase";
import type {
  Conversation,
  ConversationParticipant,
  Message,
  ConversationFrontend,
  MessageFrontend,
} from "@/types/database";

export async function getOrCreateConversation(
  senderId: string,
  receiverId: string,
  businessId?: string,
  businessName?: string
): Promise<ConversationFrontend | null> {
  // Buscar conversa existente entre os dois participantes
  const { data: existing } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", senderId);

  if (existing && existing.length > 0) {
    const senderConvIds = existing.map((cp) => cp.conversation_id);
    const { data: receiverParticipation } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", receiverId)
      .in("conversation_id", senderConvIds);

    if (receiverParticipation && receiverParticipation.length > 0) {
      const convId = receiverParticipation[0].conversation_id;
      const { data: conv } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", convId)
        .maybeSingle();

      if (conv) {
        return toConversationFrontend(conv as Conversation, [senderId, receiverId]);
      }
    }
  }

  // Verificar se o destinatário existe como profile
  const { data: receiverProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", receiverId)
    .maybeSingle();

  if (!receiverProfile) {
    console.error("[getOrCreateConversation] Destinatário não encontrado em profiles:", receiverId);
    return null;
  }

  // Criar nova conversa
  const { data: newConv, error: errConv } = await supabase
    .from("conversations")
    .insert({
      business_id: businessId || null,
      business_name: businessName || null,
    })
    .select()
    .single();

  if (!newConv) {
    console.error("[getOrCreateConversation] Erro ao criar conversa:", errConv);
    return null;
  }

  // Adicionar participantes (um por vez para respeitar RLS)
  const { error: errSender } = await supabase
    .from("conversation_participants")
    .insert({ conversation_id: newConv.id, user_id: senderId });
  if (errSender) {
    console.error("[getOrCreateConversation] Erro ao adicionar remetente:", errSender);
    await supabase.from("conversations").delete().eq("id", newConv.id);
    return null;
  }

  const { error: errReceiver } = await supabase
    .from("conversation_participants")
    .insert({ conversation_id: newConv.id, user_id: receiverId });
  if (errReceiver) {
    console.error("[getOrCreateConversation] Erro ao adicionar destinatário:", errReceiver);
    await supabase.from("conversations").delete().eq("id", newConv.id);
    return null;
  }

  return toConversationFrontend(newConv as Conversation, [senderId, receiverId]);
}

export async function getConversationsForUser(
  userId: string
): Promise<ConversationFrontend[]> {
  const { data: participations } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId);

  if (!participations || participations.length === 0) return [];

  const convIds = participations.map((cp) => cp.conversation_id);

  const { data: conversations } = await supabase
    .from("conversations")
    .select("*")
    .in("id", convIds)
    .order("last_message_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (!conversations) return [];

  // Buscar participantes de todas as conversas
  const { data: allParticipants } = await supabase
    .from("conversation_participants")
    .select("*")
    .in("conversation_id", convIds);

  const participantsByConv = new Map<string, string[]>();
  (allParticipants || []).forEach((cp: ConversationParticipant) => {
    const list = participantsByConv.get(cp.conversation_id) || [];
    list.push(cp.user_id);
    participantsByConv.set(cp.conversation_id, list);
  });

  return (conversations as Conversation[]).map((c) =>
    toConversationFrontend(c, participantsByConv.get(c.id) || [])
  );
}

export async function getMessagesForConversation(
  conversationId: string
): Promise<MessageFrontend[]> {
  const { data: msgs } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (!msgs) return [];

  // Buscar nomes dos remetentes
  const senderIds = [...new Set((msgs as Message[]).map((m) => m.sender_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name")
    .in("id", senderIds);

  const senderNames = new Map(
    (profiles || []).map((p: { id: string; name: string }) => [p.id, p.name])
  );

  return (msgs as Message[]).map((m) => ({
    id: m.id,
    conversationId: m.conversation_id,
    senderId: m.sender_id,
    senderName: senderNames.get(m.sender_id) || "Usuário",
    text: m.text,
    createdAt: m.created_at,
    read: m.read,
  }));
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  text: string
): Promise<MessageFrontend | null> {
  const { data: msg } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      text,
    })
    .select()
    .single();

  if (!msg) return null;

  // Atualizar last_message na conversa
  await supabase
    .from("conversations")
    .update({ last_message: text, last_message_at: new Date().toISOString() })
    .eq("id", conversationId);

  // Buscar nome do remetente
  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", senderId)
    .maybeSingle();

  return {
    id: msg.id,
    conversationId: msg.conversation_id,
    senderId: msg.sender_id,
    senderName: profile?.name || "Usuário",
    text: msg.text,
    createdAt: msg.created_at,
    read: msg.read,
  };
}

export async function markConversationAsRead(
  conversationId: string,
  userId: string
): Promise<void> {
  await supabase
    .from("messages")
    .update({ read: true })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId)
    .eq("read", false);
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { data: participations } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId);

  if (!participations || participations.length === 0) return 0;

  const convIds = participations.map((cp) => cp.conversation_id);

  const { count } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .in("conversation_id", convIds)
    .neq("sender_id", userId)
    .eq("read", false);

  return count || 0;
}

export function getConversationPartner(
  conversation: ConversationFrontend,
  userId: string
): string {
  return conversation.participants.find((p) => p !== userId) || "";
}

function toConversationFrontend(
  conv: Conversation,
  participants: string[]
): ConversationFrontend {
  return {
    id: conv.id,
    participants,
    businessId: conv.business_id || undefined,
    businessName: conv.business_name || undefined,
    lastMessage: conv.last_message || undefined,
    lastMessageAt: conv.last_message_at || undefined,
    createdAt: conv.created_at,
  };
}
