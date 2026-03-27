import { useEffect, useState, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Package, ShoppingCart, Tag as TagIcon } from "lucide-react";

interface Asset {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  original_url: string | null;
  thumbnail_base64: string | null;
  version: string | null;
  created_at: string;
  updated_at: string;
  shop_name: string | null;
  tags: string[];
}

export default function AssetPage(): React.ReactNode {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      setLoading(true);
      const data = await invoke<Asset[]>("get_assets");
      setAssets(data);
    } catch (error) {
      console.error("Failed to fetch assets:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const searchContent = `${asset.name} ${asset.shop_name || ""} ${asset.tags.join(" ")} ${asset.category || ""}`.toLowerCase();
      return searchContent.includes(searchQuery.toLowerCase());
    });
  }, [assets, searchQuery]);

  return (
    <div className="flex flex-col h-full space-y-4 p-4 overflow-hidden">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">アセット一覧</h1>
        <div className="relative w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="アセット、ショップ、タグで検索..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 pr-2">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-video bg-muted" />
                <CardHeader className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Package className="h-12 w-12 mb-2 opacity-20" />
            <p>アセットが見つかりませんでした</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
            {filteredAssets.map((asset) => (
              <Card key={asset.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-video relative bg-muted border-b overflow-hidden group">
                  {asset.thumbnail_base64 ? (
                    <img
                      src={`data:image/png;base64,${asset.thumbnail_base64}`}
                      alt={asset.name}
                      className="object-cover w-full h-full transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Package className="h-12 w-12 opacity-20" />
                    </div>
                  )}
                  {asset.category && (
                    <div className="absolute top-2 right-2">
                      <div className="bg-black/50 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                        {asset.category}
                      </div>
                    </div>
                  )}
                </div>
                <CardHeader className="p-3 space-y-1">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-sm font-bold line-clamp-1 flex-1">
                      {asset.name}
                    </CardTitle>
                    {asset.version && (
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        v{asset.version}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <ShoppingCart className="h-3 w-3 mr-1" />
                    <span className="line-clamp-1">{asset.shop_name || "Unknown Shop"}</span>
                  </div>
                </CardHeader>
                <CardContent className="px-3 pb-3 pt-0">
                  <div className="flex flex-wrap gap-1 mt-1">
                    {asset.tags.slice(0, 3).map((tag) => (
                      <div
                        key={tag}
                        className="flex items-center bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded text-[10px]"
                      >
                        <TagIcon className="h-2 w-2 mr-1" />
                        {tag}
                      </div>
                    ))}
                    {asset.tags.length > 3 && (
                      <div className="text-[10px] text-muted-foreground px-1">
                        +{asset.tags.length - 3}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
