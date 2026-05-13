import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Search, MapPin, Star, Store, Briefcase, ChevronRight, PawPrint, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { siteContent, MASCOT_PHRASES } from "@/data/siteContent";
import { getAllBusinesses, buildBusinessUrl } from "@/services/businesses";
import type { BusinessFrontend } from "@/types/database";
import { useAuth } from "@/contexts/AuthContext";

const CATEGORIES = [
  { name: "Alimentação", icon: "🍽️", count: 12 },
  { name: "Saúde & Beleza", icon: "💇", count: 8 },
  { name: "Automotivo", icon: "🔧", count: 6 },
  { name: "Construção", icon: "🏗️", count: 5 },
  { name: "Advocacia", icon: "⚖️", count: 4 },
  { name: "Educação", icon: "📚", count: 7 },
];

const POPULAR_CITIES = [
  { name: "Montreal", flag: "🇨🇦", count: 48 },
  { name: "Toronto", flag: "🇨🇦", count: 35 },
  { name: "Lisboa", flag: "🇵🇹", count: 28 },
  { name: "Boston", flag: "🇺🇸", count: 22 },
  { name: "Tóquio", flag: "🇯🇵", count: 15 },
  { name: "Londres", flag: "🇬🇧", count: 19 },
];

export default function Home() {
  const navigate = useNavigate();
  const { session, unreadMessages } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [featuredBusinesses, setFeaturedBusinesses] = useState<BusinessFrontend[]>([]);

  useEffect(() => {
    getAllBusinesses().then(setFeaturedBusinesses);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/buscar?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const [mascotPhrase] = useState(() => MASCOT_PHRASES[Math.floor(Math.random() * MASCOT_PHRASES.length)]);

  return (
    <div className="min-h-screen">
      {/* Header/Nav */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 caramelo-gradient rounded-full flex items-center justify-center">
                <PawPrint className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight">
                <span className="caramelo-text-gradient">Caramelinho</span>
                <span className="text-foreground">.com</span>
              </span>
            </a>
            <nav className="hidden sm:flex items-center gap-6">
              <a href="/buscar" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Buscar Negócios
              </a>
              <a href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Para Empresários
              </a>
            </nav>
            <div className="flex items-center gap-2">
              {session ? (
                <>
                  <Link to="/perfil">
                    <Button variant="ghost" size="sm" className="relative">
                      <MessageCircle className="w-4 h-4" />
                      {unreadMessages > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                          {unreadMessages > 9 ? "9+" : unreadMessages}
                        </span>
                      )}
                    </Button>
                  </Link>
                  <Link to="/perfil">
                    <Button variant="outline" size="sm">
                      <PawPrint className="w-3.5 h-3.5 mr-1" />
                      {session.name.split(" ")[0]}
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/entrar">
                    <Button variant="outline" size="sm">Entrar</Button>
                  </Link>
                  <Link to="/cadastro">
                    <Button size="sm" className="caramelo-gradient text-white border-0">Cadastrar</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 caramelo-gradient opacity-5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-200/20 via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-28 relative">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium">
              <PawPrint className="w-4 h-4 mr-1.5 inline-block text-amber-600" />
              {mascotPhrase}
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-tight">
              {siteContent.heroTitle}
            </h1>
            <p className="mt-5 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {siteContent.heroSubtitle}
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mt-10 max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={siteContent.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-36 h-14 text-base rounded-xl border-2 border-border focus-visible:border-primary bg-white shadow-soft"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
                  <Button type="submit" size="lg" className="h-10 rounded-lg px-6 caramelo-gradient hover:opacity-90 text-white border-0">
                    Farejar
                  </Button>
                </div>
              </div>
            </form>

            {/* Quick tags */}
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {["Padaria", "Mecânico", "Dentista", "Advogado", "Restaurante", "Cabeleireiro"].map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setSearchQuery(tag);
                    navigate(`/buscar?q=${encodeURIComponent(tag)}`);
                  }}
                  className="px-3 py-1.5 text-sm rounded-full bg-secondary text-secondary-foreground hover:bg-amber-100 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-border bg-secondary/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { label: "Negócios Cadastrados", value: "350+", icon: Store },
              { label: "Cidades Atendidas", value: "120+", icon: MapPin },
              { label: "Países", value: "15+", icon: Briefcase },
              { label: "Avaliações", value: "2.5K+", icon: Star },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-1">
                <stat.icon className="w-5 h-5 text-amber-600" />
                <span className="text-2xl font-bold text-foreground">{stat.value}</span>
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground">Categorias</h2>
          <p className="mt-3 text-muted-foreground">Navegue por categoria para encontrar o que precisa</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              onClick={() => navigate(`/buscar?categoria=${encodeURIComponent(cat.name)}`)}
              className="flex flex-col items-center gap-3 p-6 rounded-xl bg-card border border-border card-hover"
            >
              <span className="text-3xl">{cat.icon}</span>
              <span className="font-medium text-sm">{cat.name}</span>
              <span className="text-xs text-muted-foreground">{cat.count} negócios</span>
            </button>
          ))}
        </div>
      </section>

      {/* Featured Businesses */}
      <section className="bg-secondary/30 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Negócios em Destaque</h2>
              <p className="mt-2 text-muted-foreground">Recomendados pelo Caramelinho</p>
            </div>
            <Button variant="outline" onClick={() => navigate("/buscar")}>
              Ver Todos <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredBusinesses.slice(0, 6).map((biz) => (
              <Link
                key={biz.id}
                to={buildBusinessUrl(biz)}
                className="group"
              >
                <Card className="overflow-hidden border-border card-hover h-full">
                  <div className="aspect-[16/9] bg-muted relative overflow-hidden">
                    <img
                      src={biz.heroImage || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80"}
                      alt={biz.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <Badge className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm text-foreground border-0">
                      {biz.category.split("(")[0].trim()}
                    </Badge>
                    {biz.averageRating > 0 && (
                      <Badge className="absolute top-3 right-3 bg-amber-500 text-white border-0 gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        {biz.averageRating.toFixed(1)}
                      </Badge>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      {biz.logoUrl && (
                        <img src={biz.logoUrl} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-border" />
                      )}
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground truncate group-hover:text-amber-600 transition-colors">
                          {biz.name}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                          <MapPin className="w-3 h-3 shrink-0" />
                          {biz.address.city}, {biz.address.country}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {biz.description}
                    </p>
                    {biz.services.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {biz.services.slice(0, 3).map((svc) => (
                          <span key={svc} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                            {svc}
                          </span>
                        ))}
                        {biz.services.length > 3 && (
                          <span className="text-xs text-muted-foreground">+{biz.services.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {featuredBusinesses.length === 0 && (
            <div className="text-center py-12">
              <PawPrint className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum negócio encontrado ainda.</p>
              <p className="text-sm text-muted-foreground mt-1">Seja o primeiro a cadastrar!</p>
            </div>
          )}
        </div>
      </section>

      {/* Cities Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground">Cidades Populares</h2>
          <p className="mt-3 text-muted-foreground">Descubra negócios brasileiros pelo mundo</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {POPULAR_CITIES.map((city) => (
            <button
              key={city.name}
              onClick={() => navigate(`/buscar?cidade=${encodeURIComponent(city.name)}`)}
              className="flex flex-col items-center gap-2 p-5 rounded-xl bg-card border border-border card-hover"
            >
              <span className="text-2xl">{city.flag}</span>
              <span className="font-medium text-sm">{city.name}</span>
              <span className="text-xs text-muted-foreground">{city.count} negócios</span>
            </button>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-foreground text-background py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <PawPrint className="w-8 h-8" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Tem um negócio?</h2>
          <p className="text-lg text-white/70 mb-8 max-w-2xl mx-auto">
            Cadastre seu negócio no Caramelinho e seja encontrado por milhares de brasileiros espalhados pelo mundo!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" onClick={() => navigate("/cadastro")}>
              Criar Conta Gratuita
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => navigate("/dashboard")}>
              Saber Mais
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 caramelo-gradient rounded-full flex items-center justify-center">
                <PawPrint className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold">
                <span className="caramelo-text-gradient">Caramelinho</span>
                <span className="text-foreground">.com</span>
              </span>
            </div>
            <nav className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="/buscar" className="hover:text-foreground transition-colors">Buscar</a>
              <a href="/dashboard" className="hover:text-foreground transition-colors">Para Empresários</a>
              <a href="/entrar" className="hover:text-foreground transition-colors">Entrar</a>
            </nav>
            <p className="text-sm text-muted-foreground">
              © 2024 Caramelinho.com — Conectando brasileiros pelo mundo
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
