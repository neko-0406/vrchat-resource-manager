import { useEffect, useState, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Package, ShoppingCart, Tag as TagIcon, FolderOpen, Check, ExternalLink, Calendar, Info, Filter, X, Trash2, AlertTriangle, Loader2 } from "lucide-react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

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
  const [selectedFilterTags, setSelectedFilterTags] = useState<string[]>([]);
  const [filterMode, setFilterMode] = useState<'AND' | 'OR'>('AND');
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewingAsset, setViewingAsset] = useState<Asset | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const handleDeleteAssets = async () => {
    if (selectedIds.length === 0) return;

    try {
      setIsDeleting(true);
      await invoke("delete_assets", { assetIds: selectedIds });
      
      // 一覧を再読み込み
      await loadAssets();
      // 選択をクリア
      setSelectedIds([]);
      // ダイアログを閉じる
      setShowDeleteConfirm(false);
      alert(`${selectedIds.length}件のアセットを削除しました。`);
    } catch (error) {
      console.error("Failed to delete assets:", error);
      alert(`削除に失敗しました: ${error}`);
    } finally {
      setIsDeleting(false);
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

  const toggleFilterTag = (tag: string) => {
    setSelectedFilterTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // 全アセットから一意のタグリストを取得
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    assets.forEach(asset => asset.tags.forEach(tag => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [assets]);

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      // テキスト検索 (AND条件)
      const searchContent = `${asset.name} ${asset.shop_name || ""} ${asset.tags.join(" ")} ${asset.category || ""}`.toLowerCase();
      const matchesText = searchContent.includes(searchQuery.toLowerCase());
      
      if (!matchesText) return false;

      // タグフィルタ (AND/OR条件)
      if (selectedFilterTags.length === 0) return true;

      if (filterMode === 'AND') {
        return selectedFilterTags.every(tag => asset.tags.includes(tag));
      } else {
        return selectedFilterTags.some(tag => asset.tags.includes(tag));
      }
    });
  }, [assets, searchQuery, selectedFilterTags, filterMode]);

  return (
    <div className="flex flex-col h-full space-y-4 p-4 overflow-hidden relative">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold leading-none">アセット一覧</h1>
          {selectedFilterTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
              {selectedFilterTags.map(tag => (
                <Badge key={tag} variant="secondary" className="px-1.5 py-0 h-5 text-[10px] gap-1">
                  {tag}
                  <button onClick={() => toggleFilterTag(tag)} className="hover:text-destructive">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              ))}
              <button 
                onClick={() => setSelectedFilterTags([])}
                className="text-[10px] text-muted-foreground hover:text-primary underline px-1"
              >
                クリア
              </button>
            </div>
          )}
        </div>
        
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
                <div className="w-px h-3.5 bg-primary/20 mx-1" />
                <button 
                  className="hover:text-destructive font-semibold text-[11px] flex items-center gap-1" 
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-3 w-3" />
                  削除
                </button>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1.5 bg-muted/50 p-1 rounded-lg border">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={selectedFilterTags.length > 0 ? "secondary" : "ghost"} size="sm" className="h-7 px-2 gap-1.5 text-xs">
                  <Filter className="h-3.5 w-3.5" />
                  <span>タグ</span>
                  {selectedFilterTags.length > 0 && (
                    <Badge variant="default" className="h-4 min-w-4 px-1 text-[9px] flex items-center justify-center">
                      {selectedFilterTags.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm flex items-center gap-2">
                      <TagIcon className="h-3.5 w-3.5" />
                      タグで絞り込み
                    </h4>
                    <div className="flex bg-muted rounded-md p-0.5 border">
                      <button
                        onClick={() => setFilterMode('AND')}
                        className={`text-[10px] px-2 py-0.5 rounded transition-all ${filterMode === 'AND' ? 'bg-background shadow-sm font-bold' : 'text-muted-foreground'}`}
                      >
                        AND
                      </button>
                      <button
                        onClick={() => setFilterMode('OR')}
                        className={`text-[10px] px-2 py-0.5 rounded transition-all ${filterMode === 'OR' ? 'bg-background shadow-sm font-bold' : 'text-muted-foreground'}`}
                      >
                        OR
                      </button>
                    </div>
                  </div>
                  
                  <div className="max-h-[300px] overflow-y-auto pr-1">
                    <div className="flex flex-wrap gap-1.5">
                      {allTags.length > 0 ? (
                        allTags.map(tag => (
                          <button
                            key={tag}
                            onClick={() => toggleFilterTag(tag)}
                            className={`flex items-center px-2 py-1 rounded-md text-xs transition-colors border ${
                              selectedFilterTags.includes(tag)
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-muted/50 hover:bg-muted border-transparent"
                            }`}
                          >
                            {tag}
                          </button>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground italic p-2">タグが見つかりません</p>
                      )}
                    </div>
                  </div>
                  
                  {selectedFilterTags.length > 0 && (
                    <div className="flex justify-end pt-2 border-t mt-2">
                      <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={() => setSelectedFilterTags([])}>
                        リセット
                      </Button>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <Separator orientation="vertical" className="h-4" />

            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={handleSelectAll}>
              {selectedIds.length === filteredAssets.length && filteredAssets.length > 0 ? "選択解除" : "すべて選択"}
            </Button>
          </div>

          <div className="relative w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="検索..."
              className="pl-9 h-9"
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

      {/* 削除確認ダイアログ */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle>アセットの削除</DialogTitle>
            </div>
            <DialogDescription>
              選択された {selectedIds.length} 件のアセットを削除しますか？
              <br />
              <strong className="text-destructive">この操作により、データベースのレコードだけでなく、OS上のアセットフォルダも完全に削除されます。</strong>
              この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={handleDeleteAssets} disabled={isDeleting} className="gap-2">
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              削除する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
