import { useEffect, useState, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Package, ShoppingCart, Tag as TagIcon, FolderOpen, Check, ExternalLink, Calendar, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewingAsset, setViewingAsset] = useState<Asset | null>(null);

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

  const handleOpenFolder = async (id: string) => {
    try {
      await invoke("open_asset_folder", { assetId: id });
    } catch (error) {
      console.error("Failed to open folder:", error);
      alert(`エラー: ${error}`);
    }
  };

  const toggleSelect = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredAssets.length && filteredAssets.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAssets.map(a => a.id));
    }
  };

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const searchContent = `${asset.name} ${asset.shop_name || ""} ${asset.tags.join(" ")} ${asset.category || ""}`.toLowerCase();
      return searchContent.includes(searchQuery.toLowerCase());
    });
  }, [assets, searchQuery]);

  return (
    <div className="flex flex-col h-full space-y-4 p-4 overflow-hidden relative">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">アセット一覧</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center h-9">
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 mr-3 bg-primary/10 text-primary px-3 py-1 rounded-md border border-primary/20 text-xs animate-in fade-in zoom-in duration-200">
                <span className="font-bold">{selectedIds.length}</span>
                <span>件 選択中</span>
                <div className="w-px h-3.5 bg-primary/20 mx-1" />
                <button 
                  className="hover:underline font-semibold text-[11px]" 
                  onClick={() => setSelectedIds([])}
                >
                  解除
                </button>
              </div>
            )}
          </div>
          <Button variant="outline" size="sm" className="h-8 text-[11px] px-3" onClick={handleSelectAll}>
            {selectedIds.length === filteredAssets.length && filteredAssets.length > 0 ? "選択解除" : "すべて選択"}
          </Button>
          <div className="relative w-80 ml-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="アセット、ショップ、タグで検索..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 pr-2">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3">
            {[...Array(12)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-video bg-muted" />
                <CardHeader className="p-2 space-y-2">
                  <div className="h-3 bg-muted rounded w-3/4" />
                  <div className="h-2 bg-muted rounded w-1/2" />
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3 pb-4">
            {filteredAssets.map((asset) => (
              <Card 
                key={asset.id} 
                className={`overflow-hidden transition-all duration-200 cursor-pointer border-2 relative group ${
                  selectedIds.includes(asset.id) 
                    ? "border-primary shadow-md bg-primary/5" 
                    : "hover:shadow-md border-transparent"
                }`}
                onClick={() => setViewingAsset(asset)}
              >
                {/* 選択用のチェックエリア */}
                <div 
                  className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                    selectedIds.includes(asset.id) 
                      ? "bg-primary text-primary-foreground opacity-100" 
                      : "bg-black/20 text-white opacity-0 group-hover:opacity-100 hover:bg-black/40"
                  }`}
                  onClick={(e) => toggleSelect(asset.id, e)}
                >
                  <Check className={`h-4 w-4 ${selectedIds.includes(asset.id) ? "opacity-100" : "opacity-50"}`} />
                </div>

                <div className="aspect-video relative bg-muted border-b overflow-hidden">
                  {asset.thumbnail_base64 ? (
                    <img
                      src={`data:image/png;base64,${asset.thumbnail_base64}`}
                      alt={asset.name}
                      className="object-cover w-full h-full transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Package className="h-8 w-8 opacity-20" />
                    </div>
                  )}
                  {asset.category && (
                    <div className="absolute top-1 right-1">
                      <div className="bg-black/50 backdrop-blur-sm text-white text-[8px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                        {asset.category}
                      </div>
                    </div>
                  )}
                </div>
                <CardHeader className="p-2 space-y-0.5">
                  <div className="flex justify-between items-start gap-1">
                    <CardTitle className="text-[11px] font-bold line-clamp-1 flex-1 leading-tight">
                      {asset.name}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 -mt-0.5 -mr-1 text-muted-foreground hover:text-primary z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenFolder(asset.id);
                      }}
                      title="フォルダを開く"
                    >
                      <FolderOpen className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center text-[10px] text-muted-foreground">
                    <ShoppingCart className="h-2.5 w-2.5 mr-1 shrink-0" />
                    <span className="line-clamp-1">{asset.shop_name || "Unknown Shop"}</span>
                  </div>
                </CardHeader>
                <CardContent className="px-2 pb-2 pt-0">
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {asset.tags.slice(0, 2).map((tag) => (
                      <div
                        key={tag}
                        className="flex items-center bg-secondary text-secondary-foreground px-1 py-0.5 rounded text-[9px]"
                      >
                        <TagIcon className="h-2 w-2 mr-0.5" />
                        {tag}
                      </div>
                    ))}
                    {asset.tags.length > 2 && (
                      <div className="text-[9px] text-muted-foreground px-0.5">
                        +{asset.tags.length - 2}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* アセット詳細ダイアログ */}
      <Dialog open={!!viewingAsset} onOpenChange={(open) => !open && setViewingAsset(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {viewingAsset && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1 uppercase font-bold tracking-wider">
                  <Package className="h-3 w-3" />
                  <span>{viewingAsset.category || "General"}</span>
                  {viewingAsset.version && (
                    <>
                      <Separator orientation="vertical" className="h-3" />
                      <span>v{viewingAsset.version}</span>
                    </>
                  )}
                </div>
                <DialogTitle className="text-2xl font-bold leading-tight">
                  {viewingAsset.name}
                </DialogTitle>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <ShoppingCart className="h-4 w-4 mr-1.5" />
                  <span className="font-medium text-foreground">{viewingAsset.shop_name || "Unknown Shop"}</span>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <div className="space-y-4">
                  <div className="aspect-video relative rounded-lg border bg-muted overflow-hidden">
                    {viewingAsset.thumbnail_base64 ? (
                      <img
                        src={`data:image/png;base64,${viewingAsset.thumbnail_base64}`}
                        alt={viewingAsset.name}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-4xl">
                        <Package className="h-20 w-20 opacity-10" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {viewingAsset.tags.map((tag) => (
                      <div
                        key={tag}
                        className="flex items-center bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs font-medium"
                      >
                        <TagIcon className="h-3 w-3 mr-1" />
                        {tag}
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1.5" />
                      <span>登録日: {new Date(viewingAsset.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold flex items-center gap-1.5">
                      <Info className="h-4 w-4 text-primary" />
                      説明
                    </h4>
                    <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md border min-h-[100px] whitespace-pre-wrap leading-relaxed">
                      {viewingAsset.description || "説明はありません。"}
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <Button 
                      className="w-full justify-start gap-2 h-10 text-sm" 
                      onClick={() => handleOpenFolder(viewingAsset.id)}
                    >
                      <FolderOpen className="h-4 w-4" />
                      フォルダを開く
                    </Button>
                    
                    {viewingAsset.original_url && (
                      <Button variant="outline" className="w-full justify-start gap-2 h-10 text-sm" asChild>
                        <a href={viewingAsset.original_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                          Booth で商品ページを見る
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter className="sm:justify-between border-t pt-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant={selectedIds.includes(viewingAsset.id) ? "default" : "outline"}
                    size="sm"
                    className="gap-1.5"
                    onClick={() => toggleSelect(viewingAsset.id)}
                  >
                    <Check className={`h-4 w-4 ${selectedIds.includes(viewingAsset.id) ? "opacity-100" : "opacity-40"}`} />
                    {selectedIds.includes(viewingAsset.id) ? "選択中" : "選択する"}
                  </Button>
                </div>
                <Button variant="ghost" onClick={() => setViewingAsset(null)}>
                  閉じる
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
