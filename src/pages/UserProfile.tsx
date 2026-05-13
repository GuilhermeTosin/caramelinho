import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import {
  PawPrint,
  User,
  Store,
  Star,
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  Send,
  Edit3,
  Save,
  LogOut,
  Clock,
  Search,
  Plus,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { updateProfile } from "@/services/profiles";
import {
  getConversationsForUser,
  getMessagesForConversation,
  sendMessage,
  markConversationAsRead,
} from "@/services/messages";
import {
  getBusinessesByOwner,
  getAllBusinesses,
  buildBusinessUrl,
  updateReview,
  deleteReview,
} from "@/services/businesses";
import type { BusinessFrontend, ConversationFrontend, MessageFrontend, Review } from "@/types/database";

export default function UserProfile() {
  const navigate = useNavigate();
  const { session, user, logout, refreshUnread } = useAuth();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabParam || "perfil");
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editLocation, setEditLocation] = useState("");

  // Messages
  const [conversations, setConversations] = useState<ConversationFrontend[]>([]);
  const [selectedConv, setSelectedConv] = useState<ConversationFrontend | null>(null);
  const [messages, setMessages] = useState<MessageFrontend[]>([]);
  const [messageText, setMessageText] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  // Businesses
  const [myBusinesses, setMyBusinesses] = useState<BusinessFrontend[]>([]);
  const [myReviews, setMyReviews] = useState<(BusinessFrontend["reviews"][0] & { businessName: string; businessSlug: string; businessId: string })[]>([]);

  // Reviews I made (on any business)
  const [givenReviews, setGivenReviews] = useState<(Review & { businessName: string; businessSlug: string; businessId: string })[]>([]);
  const [subAvaliacoesTab, setSubAvaliacoesTab] = useState("recebidas");

  // Edit review state
  const [editingReview, setEditingReview] = useState<{
    review: Review & { businessName: string; businessSlug: string; businessId: string };
    rating: number;
    comment: string;
    saving: boolean;
  } | null>(null);

  // Confirm delete review
  const [confirmDeleteReview, setConfirmDeleteReview] = useState<{
    reviewId: string;
    businessId: string;
  } | null>(null);

  useEffect(() => {
    if (!session) {
      navigate("/entrar?redirect=/perfil");
      return;
    }

    // Load conversations
    getConversationsForUser(session.userId).then(setConversations);

    // Load businesses owned by user
    getBusinessesByOwner(session.userId).then((bizs) => {
      setMyBusinesses(bizs);
      const reviews = bizs.flatMap((b) =>
        b.reviews.map((r) => ({
          ...r,
          businessName: b.name,
          businessSlug: buildBusinessUrl(b),
          businessId: b.id,
        }))
      );
      setMyReviews(reviews);
    });

    // Load all businesses to find reviews made by this user
    getAllBusinesses().then((allBizs) => {
      const given = allBizs.flatMap((b) =>
        b.reviews
          .filter((r) => r.userId === session.userId)
          .map((r) => ({
            ...r,
            businessName: b.name,
            businessSlug: buildBusinessUrl(b),
            businessId: b.id,
          }))
      );
      given.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setGivenReviews(given);
    });
  }, [session, user, navigate]);

  const handleSaveProfile = async () => {
    if (!session) return;
    const success = await updateProfile(session.userId, {
      name: editName,
      bio: editBio,
      phone: editPhone,
      location: editLocation,
    });
    if (success) {
      setIsEditing(false);
      toast.success("Perfil atualizado!");
      refreshUnread();
    } else {
      toast.error("Erro ao atualizar perfil.");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
    toast.success("Você saiu da sua conta.");
  };

  const handleSelectConversation = async (conv: ConversationFrontend) => {
    setSelectedConv(conv);
    const msgs = await getMessagesForConversation(conv.id);
    setMessages(msgs);
    if (session) {
      await markConversationAsRead(conv.id, session.userId);
      refreshUnread();
    }
  };

  const handleSendMessage = async () => {
    if (!session || !selectedConv || !messageText.trim()) return;
    setSendingMsg(true);
    const msg = await sendMessage(selectedConv.id, session.userId, messageText.trim());
    if (msg) {
      setMessages((prev) => [...prev, msg]);
      setMessageText("");
      const convs = await getConversationsForUser(session.userId);
      setConversations(convs);
    }
    setSendingMsg(false);
  };

  // --- Review handlers ---

  const handleStartEditReview = (
    review: Review & { businessName: string; businessSlug: string; businessId: string }
  ) => {
    setEditingReview({
      review,
      rating: review.rating,
      comment: review.comment,
      saving: false,
    });
  };

  const handleSaveEditReview = async () => {
    if (!editingReview) return;
    setEditingReview({ ...editingReview, saving: true });
    const ok = await updateReview(editingReview.review.businessId, editingReview.review.id, {
      rating: editingReview.rating as 1 | 2 | 3 | 4 | 5,
      comment: editingReview.comment,
    });
    if (ok) {
      setGivenReviews((prev) =>
        prev.map((r) =>
          r.id === editingReview.review.id
            ? { ...r, rating: editingReview.rating as 1 | 2 | 3 | 4 | 5, comment: editingReview.comment }
            : r
        )
      );
      toast.success("Avaliação atualizada!");
      setEditingReview(null);
    } else {
      toast.error("Erro ao atualizar avaliação.");
      setEditingReview({ ...editingReview, saving: false });
    }
  };

  const handleDeleteReview = async () => {
    if (!confirmDeleteReview) return;
    const ok = await deleteReview(confirmDeleteReview.businessId, confirmDeleteReview.reviewId);
    if (ok) {
      setGivenReviews((prev) => prev.filter((r) => r.id !== confirmDeleteReview.reviewId));
      toast.success("Avaliação removida!");
      setConfirmDeleteReview(null);
    } else {
      toast.error("Erro ao remover avaliação.");
      setConfirmDeleteReview(null);
    }
  };

  if (!session || !user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-7 h-7 caramelo-gradient rounded-full flex items-center justify-center">
                <PawPrint className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-sm">
                <span className="caramelo-text-gradient">Caramelinho</span>
                <span className="text-foreground">.com</span>
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <Link to="/buscar">
                <Button variant="ghost" size="sm">
                  <Search className="w-4 h-4" />
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-6">
            <TabsList className="bg-secondary/50">
              <TabsTrigger value="perfil" className="gap-2">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Meu Perfil</span>
              </TabsTrigger>
              <TabsTrigger value="negocios" className="gap-2">
                <Store className="w-4 h-4" />
                <span className="hidden sm:inline">Meus Negócios</span>
              </TabsTrigger>
              <TabsTrigger value="avaliacoes" className="gap-2">
                <Star className="w-4 h-4" />
                <span className="hidden sm:inline">Avaliações</span>
              </TabsTrigger>
              <TabsTrigger value="mensagens" className="gap-2">
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Mensagens</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab: Profile */}
          <TabsContent value="perfil">
            <Card className="p-6 border-border max-w-2xl">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <h1 className="text-xl font-bold">{user.name}</h1>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                {!isEditing && (
                  <Button variant="outline" size="sm" onClick={() => {
                    setIsEditing(true);
                    setEditName(user.name);
                    setEditBio(user.bio);
                    setEditPhone(user.phone);
                    setEditLocation(user.location);
                  }}>
                    <Edit3 className="w-3.5 h-3.5 mr-1" />
                    Editar
                  </Button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="editName">Nome</Label>
                    <Input id="editName" value={editName} onChange={(e) => setEditName(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="editBio">Biografia</Label>
                    <Textarea id="editBio" value={editBio} onChange={(e) => setEditBio(e.target.value)} className="mt-1" rows={3} />
                  </div>
                  <div>
                    <Label htmlFor="editPhone">Telefone</Label>
                    <Input id="editPhone" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="editLocation">Localização</Label>
                    <Input id="editLocation" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} className="mt-1" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button onClick={handleSaveProfile}>
                      <Save className="w-4 h-4 mr-1" />
                      Salvar
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  {user.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{user.location}</span>
                    </div>
                  )}
                  {user.bio && (
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Biografia</span>
                      <p className="text-foreground">{user.bio}</p>
                    </div>
                  )}
                  <div className="pt-4 text-xs text-muted-foreground flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    Membro desde {new Date(user.createdAt).toLocaleDateString("pt-BR", { year: "numeric", month: "long" })}
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Tab: My Businesses */}
          <TabsContent value="negocios">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Meus Negócios</h2>
              <Button size="sm" onClick={() => navigate("/dashboard")}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Novo Negócio
              </Button>
            </div>

            {myBusinesses.length === 0 ? (
              <Card className="p-8 text-center border-border">
                <Store className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">Você ainda não cadastrou nenhum negócio.</p>
                <Button onClick={() => navigate("/dashboard")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Cadastrar Negócio
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {myBusinesses.map((biz) => (
                  <Card key={biz.id} className="p-4 border-border flex items-start gap-4">
                    <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-secondary">
                      <img
                        src={biz.logoUrl || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&q=60"}
                        alt={biz.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link to={buildBusinessUrl(biz)} className="font-bold text-foreground hover:text-primary transition-colors">
                        {biz.name}
                      </Link>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {biz.address.city}, {biz.address.countryCode.toUpperCase()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-500" />
                          {biz.averageRating.toFixed(1)} ({biz.reviews.length} avaliações)
                        </span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="flex-shrink-0">
                      {biz.category.split(" (")[0]}
                    </Badge>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tab: Reviews */}
          <TabsContent value="avaliacoes">
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-lg font-bold">Avaliações</h2>
              <Tabs value={subAvaliacoesTab} onValueChange={setSubAvaliacoesTab} className="ml-auto">
                <TabsList>
                  <TabsTrigger value="recebidas" className="text-sm">
                    Recebidas ({myReviews.length})
                  </TabsTrigger>
                  <TabsTrigger value="feitas" className="text-sm">
                    Feitas ({givenReviews.length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {subAvaliacoesTab === "recebidas" && (
              <>
                {myReviews.length === 0 ? (
                  <Card className="p-8 text-center border-border">
                    <Star className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">Seus negócios ainda não receberam avaliações.</p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {myReviews.map((review) => (
                      <Card key={review.id} className="p-4 border-border">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 text-sm">
                              <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                                {review.userName.charAt(0)}
                              </div>
                              <span className="font-medium">{review.userName}</span>
                              <span className="text-muted-foreground">em</span>
                              <Link to={review.businessSlug} className="text-primary hover:underline font-medium">
                                {review.businessName}
                                <ExternalLink className="w-3 h-3 ml-0.5 inline" />
                              </Link>
                            </div>
                          </div>
                          <div className="flex items-center text-amber-500">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? "fill-current" : "text-muted-foreground/20"}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(review.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}

            {subAvaliacoesTab === "feitas" && (
              <>
                {givenReviews.length === 0 ? (
                  <Card className="p-8 text-center border-border">
                    <Star className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">Você ainda não avaliou nenhum negócio.</p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {givenReviews.map((review) => (
                      <Card key={review.id} className="p-4 border-border">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 text-sm">
                              <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                                {review.userName.charAt(0)}
                              </div>
                              <span className="font-medium">Você</span>
                              <span className="text-muted-foreground">em</span>
                              <Link to={review.businessSlug} className="text-primary hover:underline font-medium">
                                {review.businessName}
                                <ExternalLink className="w-3 h-3 ml-0.5 inline" />
                              </Link>
                            </div>
                          </div>
                          <div className="flex items-center text-amber-500">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? "fill-current" : "text-muted-foreground/20"}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(review.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                        <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStartEditReview(review)}
                          >
                            <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive border-destructive/30 hover:bg-destructive/10"
                            onClick={() =>
                              setConfirmDeleteReview({
                                reviewId: review.id,
                                businessId: review.businessId,
                              })
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                            Remover
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Tab: Messages */}
          <TabsContent value="mensagens">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Conversation List */}
              <div className="lg:col-span-1">
                <h2 className="text-lg font-bold mb-4">Conversas</h2>
                {conversations.length === 0 ? (
                  <Card className="p-6 text-center border-border">
                    <MessageCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhuma conversa ainda.</p>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {conversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => handleSelectConversation(conv)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          selectedConv?.id === conv.id
                            ? "bg-amber-100"
                            : "hover:bg-secondary"
                        }`}
                      >
                        <p className="font-medium text-sm truncate">
                          {conv.businessName || "Conversa"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {conv.lastMessage || "Clique para ver mensagens"}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="lg:col-span-2">
                {selectedConv ? (
                  <Card className="border-border h-[500px] flex flex-col">
                    <div className="p-4 border-b border-border">
                      <p className="font-semibold text-sm">
                        {selectedConv.businessName || "Conversa"}
                      </p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.senderId === session.userId ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] p-3 rounded-lg text-sm ${
                              msg.senderId === session.userId
                                ? "bg-amber-500 text-white rounded-br-sm"
                                : "bg-secondary rounded-bl-sm"
                            }`}
                          >
                            <p>{msg.text}</p>
                            <p className={`text-xs mt-1 ${msg.senderId === session.userId ? "text-white/70" : "text-muted-foreground"}`}>
                              {new Date(msg.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      ))}
                      {messages.length === 0 && (
                        <div className="text-center text-sm text-muted-foreground py-8">
                          Nenhuma mensagem ainda. Envie a primeira!
                        </div>
                      )}
                    </div>
                    <div className="p-4 border-t border-border">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSendMessage();
                        }}
                        className="flex gap-2"
                      >
                        <Input
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          placeholder="Digite sua mensagem..."
                          className="flex-1"
                        />
                        <Button type="submit" size="icon" disabled={!messageText.trim() || sendingMsg}>
                          <Send className="w-4 h-4" />
                        </Button>
                      </form>
                    </div>
                  </Card>
                ) : (
                  <Card className="border-border h-[500px] flex items-center justify-center">
                    <div className="text-center">
                      <MessageCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground">Selecione uma conversa</p>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit Review Dialog */}
        <Dialog open={!!editingReview} onOpenChange={(open) => !open && setEditingReview(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Avaliação</DialogTitle>
            </DialogHeader>
            {editingReview && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Avaliação em <span className="font-medium text-foreground">{editingReview.review.businessName}</span>
                </p>

                <div>
                  <Label>Nota</Label>
                  <div className="flex gap-1 mt-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() =>
                          setEditingReview({ ...editingReview, rating: star })
                        }
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= editingReview.rating
                              ? "fill-amber-500 text-amber-500"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-comment">Comentário</Label>
                  <Textarea
                    id="edit-comment"
                    value={editingReview.comment}
                    onChange={(e) =>
                      setEditingReview({ ...editingReview, comment: e.target.value })
                    }
                    placeholder="Escreva seu comentário..."
                    className="mt-1.5"
                    rows={4}
                  />
                </div>

                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setEditingReview(null)}
                    disabled={editingReview.saving}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSaveEditReview}
                    disabled={editingReview.saving || !editingReview.comment.trim()}
                  >
                    {editingReview.saving ? "Salvando..." : "Salvar"}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Confirm Delete Review Dialog */}
        <Dialog open={!!confirmDeleteReview} onOpenChange={(open) => !open && setConfirmDeleteReview(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remover Avaliação</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground py-2">
              Tem certeza que deseja remover esta avaliação? Esta ação não pode ser desfeita.
            </p>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setConfirmDeleteReview(null)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteReview}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remover
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
