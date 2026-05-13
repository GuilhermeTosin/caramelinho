import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Search, MapPin, Star, SlidersHorizontal, PawPrint, Map as MapIcon, List, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAllBusinesses, buildBusinessUrl, BUSINESS_CATEGORIES, COUNTRIES } from "@/services/businesses";
import type { BusinessFrontend } from "@/types/database";
import MapView from "@/components/MapView";
import { useAuth } from "@/contexts/AuthContext";

export default function SearchResults() {
  const navigate = useNavigate();
  const { session, unreadMessages } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const categoryFilter = searchParams.get("categoria") || "";
  const cityFilter = searchParams.get("cidade") || "";
  const countryFilter = searchParams.get("pais") || "";

  const [searchInput, setSearchInput] = useState(query);
  const [showMap, setShowMap] = useState(false);
  const [allBusinesses, setAllBusinesses] = useState<BusinessFrontend[]>([]);

  useEffect(() => {
    getAllBusinesses().then(setAllBusinesses);
  }, []);

  const results = useMemo(() => {
    let filtered = allBusinesses;

    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q) ||
          b.services.some((s) => s.toLowerCase().includes(q)) ||
          b.address.city.toLowerCase().includes(q)
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter((b) => b.category.toLowerCase().includes(categoryFilter.toLowerCase()));
    }

    if (cityFilter) {
      filtered = filtered.filter((b) => b.address.city.toLowerCase().includes(cityFilter.toLowerCase()));
    }

    if (countryFilter) {
      filtered = filtered.filter((b) => b.address.countryCode.toLowerCase() === countryFilter.toLowerCase());
    }

    return filtered;
  }, [query, categoryFilter, cityFilter, countryFilter, allBusinesses]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchInput.trim()) params.set("q", searchInput.trim());
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 caramelo-gradient rounded-full flex items-center justify-center">
                <PawPrint className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg">
                <span className="caramelo-text-gradient">Caramelinho</span>
                <span className="text-foreground">.com</span>
              </span>
            </a>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por nome, serviço, cidade..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-12 pr-14 h-12 text-base rounded-xl border-2 border-border bg-white"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <Button type="submit" size="sm" className="caramelo-gradient text-white border-0">
                Farejar
              </Button>
            </div>
          </div>
        </form>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
          <Select
            value={categoryFilter}
            onValueChange={(v) => {
              const params = new URLSearchParams(searchParams);
              if (v) params.set("categoria", v);
              else params.delete("categoria");
              setSearchParams(params);
            }}
          >
            <SelectTrigger className="w-[220px] h-9 text-sm">
              <SelectValue placeholder="Todas as categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {BUSINESS_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat.split("(")[0].trim()}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={countryFilter}
            onValueChange={(v) => {
              const params = new URLSearchParams(searchParams);
              if (v) params.set("pais", v);
              else params.delete("pais");
              setSearchParams(params);
            }}
          >
            <SelectTrigger className="w-[160px] h-9 text-sm">
              <SelectValue placeholder="Todos os países" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os países</SelectItem>
              {Object.entries(COUNTRIES).map(([code, country]) => (
                <SelectItem key={code} value={code}>{country.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant={showMap ? "default" : "outline"}
              size="sm"
              onClick={() => setShowMap(true)}
              className="h-9"
            >
              <MapIcon className="w-4 h-4 mr-1" />
              Mapa
            </Button>
            <Button
              variant={!showMap ? "default" : "outline"}
              size="sm"
              onClick={() => setShowMap(false)}
              className="h-9"
            >
              <List className="w-4 h-4 mr-1" />
              Lista
            </Button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          {results.length} negócio{results.length !== 1 ? "s" : ""} encontrado{results.length !== 1 ? "s" : ""}
          {query && <> para "<strong>{query}</strong>"</>}
        </p>

        {showMap && (
          <div className="mb-8 rounded-xl overflow-hidden border border-border h-[400px]">
            <MapView
              businesses={results}
              center={
                results.length > 0
                  ? { lat: results[0].address.lat, lng: results[0].address.lng }
                  : { lat: 45.5, lng: -73.6 }
              }
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((biz) => (
            <Link key={biz.id} to={buildBusinessUrl(biz)} className="group">
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
                  <p className="text-sm text-muted-foreground line-clamp-2">{biz.description}</p>
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

        {results.length === 0 && (
          <div className="text-center py-20">
            <PawPrint className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Nenhum resultado encontrado</h2>
            <p className="text-muted-foreground mb-6">O Caramelinho não achou nada com esses critérios.</p>
            <Button onClick={() => navigate("/")}>
              <PawPrint className="w-4 h-4 mr-2" />
              Voltar ao Início
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
