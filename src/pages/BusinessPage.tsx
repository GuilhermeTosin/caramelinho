import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  MapPin,
  Star,
  Phone,
  Mail,
  Globe,
  Share2,
  ChevronLeft,
  PawPrint,
  ThumbsUp,
  Send,
  MessageCircle,
  Instagram,
  Facebook,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { getBusinessBySlug, getCountryName, getStateName, addReview } from "@/services/businesses";
import { getOrCreateConversation } from "@/services/messages";
import type { BusinessFrontend, Review } from "@/types/database";
import { useAuth } from "@/contexts/AuthContext";
import { Store } from "lucide-react";

export default function BusinessPage() {
  const { countryCode, stateCode, city, businessName } = useParams();
  const navigate = useNavigate();
  const { session, refreshUnread } = useAuth();

  const [business, setBusiness] = useState<BusinessFrontend | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(0);
  const [reviewComment, setReviewComment] = useState("");
  const [sendingReview, setSendingReview] = useState(false);

  useEffect(() => {
    if (countryCode && stateCode && city && businessName) {
      getBusinessBySlug(countryCode, stateCode, city, businessName).then((biz) => {
        setBusiness(biz);
        setLoading(false);
      });
    }
  }, [countryCode, stateCode, city, businessName]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewRating === 0) {
      toast.error("Selecione uma avaliação de 1 a 5 estrelas");
      return;
    }
    if (!business || !session) {
      toast.error("Faça login para avaliar");
      navigate(`/entrar?redirect=/${countryCode}/${stateCode}/${city}/${businessName}`);
      return;
    }

    setSendingReview(true);

    const newReview: Review = {
      id: "rev_" + Date.now().toString(36),
      userId: session.userId,
      userName: session.name,
      rating: reviewRating as 1 | 2 | 3 | 4 | 5,
      comment: reviewComment,
      createdAt: new Date().toISOString(),
    };

    const success = await addReview(business.id, newReview);
    if (success) {
      // Recarregar o negócio para mostrar a nova avaliação
      const updated = await getBusinessBySlug(
        countryCode || "",
        stateCode || "",
        city || "",
        businessName || ""
      );
      if (updated) setBusiness(updated);
      toast.success("Avaliação enviada com sucesso!");
    } else {
      toast.error("Erro ao enviar avaliação.");
    }

    setSendingReview(false);
    setReviewRating(0);
    setReviewComment("");
  };

  const handleSendMessage = async () => {
    if (!session) {
      toast.info("Faça login para enviar mensagem");
      navigate(`/entrar?redirect=/${countryCode}/${stateCode}/${city}/${businessName}`);
      return;
    }
    if (!business) return;

    const conv = await getOrCreateConversation(
      session.userId,
      business.ownerId,
      business.id,
      business.name
    );
    if (conv) {
      refreshUnread();
      navigate("/perfil?tab=mensagens");
      toast.success(`Conversa com ${business.ownerName} iniciada!`);
    } else {
      toast.error("Erro ao iniciar conversa.");
    }
  };

  const handleWhatsApp = () => {
    if (!business?.whatsapp) return;
    const wpp = business.whatsapp.replace(/\s+/g, "").replace(/[^0-9]/g, "");
    const text = encodeURIComponent(`Olá! Vi seu negócio no Caramelinho.com: ${business.name}`);
    window.open(`https://wa.me/${wpp}?text=${text}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <PawPrint className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <PawPrint className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Negócio não encontrado</h1>
          <p className="text-muted-foreground mb-6">O Caramelinho não achou esse negócio.</p>
          <Button onClick={() => navigate("/")}>Voltar ao Início</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Voltar
              </Button>
              <a href="/" className="flex items-center gap-2">
                <div className="w-7 h-7 caramelo-gradient rounded-full flex items-center justify-center">
                  <PawPrint className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-bold text-sm">Caramelinho.com</span>
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copiado!"); }}>
                <Share2 className="w-3.5 h-3.5" />
              </Button>
              {session ? (
                <Link to="/perfil">
                  <Button variant="outline" size="sm">
                    <PawPrint className="w-3.5 h-3.5 mr-1" />
                    {session.name.split(" ")[0]}
                  </Button>
                </Link>
              ) : (
                <Link to="/entrar">
                  <Button variant="outline" size="sm">Entrar</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative h-48 sm:h-64 lg:h-80 bg-muted overflow-hidden">
        <img
          src={business.heroImage || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1400&q=80"}
          alt={business.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8">
          <div className="max-w-7xl mx-auto flex items-end gap-4">
            {business.logoUrl ? (
              <img
                src={business.logoUrl}
                alt={`Logo ${business.name}`}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 border-white shadow-lg object-cover"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-amber-100 flex items-center justify-center border-2 border-white shadow-lg">
                <Store className="w-8 h-8 text-amber-600" />
              </div>
            )}
            <div className="text-white">
              <h1 className="text-xl sm:text-3xl font-bold">{business.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  {business.category.split("(")[0].trim()}
                </Badge>
                {business.averageRating > 0 && (
                  <span className="flex items-center gap-1 text-sm">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    {business.averageRating.toFixed(1)}
                    <span className="text-white/70">({business.reviews.length} avaliações)</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Tabs defaultValue="about" className="w-full">
              <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent h-auto p-0">
                <TabsTrigger value="about" className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent pb-3 px-4">
                  Sobre
                </TabsTrigger>
                <TabsTrigger value="services" className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent pb-3 px-4">
                  Serviços
                </TabsTrigger>
                {business.menu && business.menu.length > 0 && (
                  <TabsTrigger value="menu" className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent pb-3 px-4">
                    Cardápio
                  </TabsTrigger>
                )}
                <TabsTrigger value="photos" className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent pb-3 px-4">
                  Fotos
                </TabsTrigger>
                <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent pb-3 px-4">
                  Avaliações
                </TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="mt-6">
                <h2 className="text-xl font-bold text-foreground mb-3">Sobre {business.name}</h2>
                <p className="text-muted-foreground leading-relaxed">{business.description}</p>
              </TabsContent>

              <TabsContent value="services" className="mt-6">
                <h2 className="text-xl font-bold text-foreground mb-4">Serviços</h2>
                {business.services.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Nenhum serviço listado.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {business.services.map((service) => (
                      <div key={service} className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50">
                        <ThumbsUp className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span className="text-sm">{service}</span>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {business.menu && business.menu.length > 0 && (
                <TabsContent value="menu" className="mt-6">
                  <h2 className="text-xl font-bold text-foreground mb-4">Cardápio</h2>
                  <div className="space-y-3">
                    {business.menu.map((item) => (
                      <div key={item.name} className="flex items-start justify-between p-4 rounded-lg border border-border bg-card">
                        <div>
                          <h3 className="font-semibold text-sm">{item.name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                        </div>
                        <span className="font-bold text-primary text-sm ml-4 flex-shrink-0">{item.price}</span>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              )}

              <TabsContent value="photos" className="mt-6">
                <h2 className="text-xl font-bold text-foreground mb-4">Fotos</h2>
                {business.photos.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Nenhuma foto disponível.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {business.photos.slice(0, 8).map((photo) => (
                      <button
                        key={photo}
                        onClick={() => setSelectedPhoto(photo)}
                        className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer"
                      >
                        <img
                          src={photo}
                          alt={`Foto de ${business.name}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      </button>
                    ))}
                  </div>
                )}

                {selectedPhoto && (
                  <div
                    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                    onClick={() => setSelectedPhoto(null)}
                  >
                    <img
                      src={selectedPhoto}
                      alt="Foto ampliada"
                      className="max-w-full max-h-full rounded-lg object-contain"
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="reviews" className="mt-6">
                <h2 className="text-xl font-bold text-foreground mb-6">Avaliações</h2>

                <Card className="p-5 mb-6 border-border bg-secondary/30">
                  <h3 className="font-semibold text-sm mb-3">Deixe sua avaliação</h3>
                  <form onSubmit={handleReviewSubmit}>
                    <div className="flex items-center gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className={`p-1 transition-colors ${
                            star <= reviewRating ? "text-amber-500" : "text-muted-foreground/30"
                          } hover:text-amber-400`}
                          aria-label={`${star} estrelas`}
                        >
                          <Star className="w-6 h-6 fill-current" />
                        </button>
                      ))}
                      {reviewRating > 0 && (
                        <span className="ml-2 text-sm text-muted-foreground">
                          {reviewRating} de 5 estrelas
                        </span>
                      )}
                    </div>
                    <Textarea
                      placeholder="Conte sua experiência..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="mb-3 min-h-[80px]"
                    />
                    <Button type="submit" size="sm" className="caramelo-gradient text-white border-0" disabled={sendingReview}>
                      {sendingReview ? "Enviando..." : "Enviar Avaliação"}
                    </Button>
                  </form>
                </Card>

                <div className="space-y-4">
                  {business.reviews.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Nenhuma avaliação ainda. Seja o primeiro!</p>
                  ) : (
                    business.reviews.map((review) => (
                      <div key={review.id} className="p-4 rounded-lg border border-border bg-card">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                              {review.userName.charAt(0)}
                            </div>
                            <div>
                              <span className="font-medium text-sm">{review.userName}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                {new Date(review.createdAt).toLocaleDateString("pt-BR")}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center text-amber-500 text-sm">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${
                                  i < review.rating ? "fill-current" : "text-muted-foreground/20"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{review.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Contact Card */}
              <Card className="p-5 border-border">
                <h3 className="font-semibold mb-4">Informações de Contato</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p>{business.address.street}</p>
                      <p className="text-muted-foreground">
                        {business.address.city}, {getStateName(business.address.countryCode, business.address.stateCode)}
                      </p>
                      <p className="text-muted-foreground">{getCountryName(business.address.countryCode)} &mdash; {business.address.postalCode}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <a href={`tel:${business.phone}`} className="text-sm text-primary hover:underline">
                      {business.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <a href={`mailto:${business.email}`} className="text-sm text-primary hover:underline truncate">
                      {business.email}
                    </a>
                  </div>
                  {business.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <a
                        href={business.website.startsWith("http") ? business.website : `https://${business.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline truncate"
                      >
                        {business.website.replace(/^https?:\/\//, "")}
                      </a>
                    </div>
                  )}
                </div>
              </Card>

              {/* Social Media */}
              {(business.instagram || business.facebook || business.whatsapp) && (
                <Card className="p-5 border-border">
                  <h3 className="font-semibold mb-4">Redes Sociais</h3>
                  <div className="space-y-3">
                    {business.instagram && (
                      <a
                        href={`https://instagram.com/${business.instagram.replace("@", "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Instagram className="w-4 h-4 text-pink-600" />
                        {business.instagram}
                      </a>
                    )}
                    {business.facebook && (
                      <a
                        href={`https://facebook.com/${business.facebook}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Facebook className="w-4 h-4 text-blue-600" />
                        {business.facebook}
                      </a>
                    )}
                    {business.whatsapp && (
                      <button
                        onClick={handleWhatsApp}
                        className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors w-full text-left"
                      >
                        <MessageCircle className="w-4 h-4 text-green-600" />
                        {business.whatsapp}
                      </button>
                    )}
                  </div>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  className="w-full caramelo-gradient text-white border-0"
                  onClick={handleSendMessage}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Mensagem
                </Button>
                {business.whatsapp && (
                  <Button
                    variant="outline"
                    className="w-full border-green-600 text-green-600 hover:bg-green-50"
                    onClick={handleWhatsApp}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Falar no WhatsApp
                  </Button>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
