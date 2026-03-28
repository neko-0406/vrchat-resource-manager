import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent } from '../components/ui/card';
import { Image as ImageIcon, Link, Search, X, Package, Loader2 } from 'lucide-react';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';

interface ScrapedBoothInfo {
  name: string;
  description: string;
  shop_name: string;
  category: string;
  thumbnail_base64: string | null;
  tags: string[];
}

export default function AssetRegisterPage() {
  const [assetUrl, setAssetUrl] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [thumbnailBase64, setThumbnailBase64] = useState<string | null>(null);
  const [assetInfo, setAssetInfo] = useState({
    name: '',
    shopName: '',
    category: '',
    description: '',
    version: '',
    tags: [] as string[],
  });
  const [files, setFiles] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  // タグの追加
  const handleAddTag = () => {
    const trimmedTag = newTag.trim();
    if (!trimmedTag || assetInfo.tags.includes(trimmedTag)) return;
    setAssetInfo({
      ...assetInfo,
      tags: [...assetInfo.tags, trimmedTag],
    });
    setNewTag('');
  };

  // タグの削除
  const handleRemoveTag = (tagToRemove: string) => {
    setAssetInfo({
      ...assetInfo,
      tags: assetInfo.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  // スクレイピングによる情報取得
  const handleFetchInfo = async () => {
    if (!assetUrl || isFetching) return;

    setIsFetching(true);
    try {
      const info = await invoke<ScrapedBoothInfo>('scrape_booth', { url: assetUrl });
      
      setAssetInfo({
        ...assetInfo,
        name: info.name,
        shopName: info.shop_name,
        category: info.category,
        description: info.description,
        tags: info.tags,
      });

      if (info.thumbnail_base64) {
        setThumbnailBase64(info.thumbnail_base64);
      }
    } catch (error) {
      console.error('Failed to fetch info:', error);
      alert('情報の取得に失敗しました。URLを確認してください。');
    } finally {
      setIsFetching(false);
    }
  };

  // ファイル選択 (ZIPファイル)
  const handleSelectFiles = async () => {
    const selected = await openDialog({
      multiple: true,
      filters: [{ name: 'Zip Files', extensions: ['zip'] }],
    });
    if (selected && Array.isArray(selected)) {
      setFiles([...files, ...selected]);
    } else if (selected && typeof selected === 'string') {
      setFiles([...files, selected]);
    }
  };

  // 画像選択 (手動)
  const handleSelectImage = async () => {
    const selected = await openDialog({
      multiple: false,
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }],
    });
    if (selected && typeof selected === 'string') {
      // 本来はRust側で読み込んでBase64に変換するか、フロントでFileReaderを使う
      // ここではパスだけ取得し、フロントでのプレビューは将来的に実装
      console.log('Selected image:', selected);
    }
  };

  // アセット登録処理
  const handleRegister = async () => {
    if (!assetInfo.name || isFetching || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await invoke('register_asset', {
        request: {
          name: assetInfo.name,
          description: assetInfo.description,
          shop_name: assetInfo.shopName,
          category: assetInfo.category,
          version: assetInfo.version,
          original_url: assetUrl,
          thumbnail_base64: thumbnailBase64,
          tags: assetInfo.tags,
          file_paths: files,
        },
      });

      alert('アセットを登録しました。');
      
      // 入力をリセット
      setAssetUrl('');
      setThumbnailBase64(null);
      setAssetInfo({
        name: '',
        shopName: '',
        category: '',
        description: '',
        version: '',
        tags: [],
      });
      setFiles([]);
    } catch (error) {
      console.error('Failed to register asset:', error);
      alert('登録に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='flex h-full max-h-screen flex-col overflow-hidden p-8 gap-6'>
      <div className='flex items-center justify-between shrink-0'>
        <h1 className='text-3xl font-bold'>アセット登録</h1>
        <Button size='lg' disabled={!assetInfo.name || isFetching || isSubmitting} onClick={handleRegister}>
          {isSubmitting ? <Loader2 className='mr-2 size-4 animate-spin' /> : null}
          {isSubmitting ? '登録中...' : 'アセットを登録'}
        </Button>
      </div>

      {/* URL入力エリア */}
      <Card className='bg-muted/50 shrink-0'>
        <CardContent className='pt-6'>
          <div className='flex gap-2 items-end'>
            <div className='grid gap-2 flex-1'>
              <Label htmlFor='booth-url'>BoothのURLから情報を取得</Label>
              <div className='relative'>
                <Link className='absolute left-2.5 top-2.5 size-4 text-muted-foreground' />
                <Input
                  id='booth-url'
                  placeholder='https://booth.pm/ja/items/...'
                  className='pl-9'
                  value={assetUrl}
                  onChange={(e) => setAssetUrl(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={handleFetchInfo} disabled={!assetUrl}>
              <Search className='mr-2 size-4' />
              情報取得
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-0'>
        {/* 左側: 画像プレビュー */}
        <div className='flex flex-col gap-4 min-h-0'>
          <Label shrink-0>サムネイル画像</Label>
          <div
            className='relative aspect-square w-full overflow-hidden rounded-xl border-2 border-dashed border-muted bg-muted/20 flex items-center justify-center cursor-pointer hover:bg-muted/30 transition-colors'
            onClick={handleSelectImage}
          >
            {thumbnailBase64 ? (
              <img
                src={`data:image/png;base64,${thumbnailBase64}`}
                alt='Preview'
                className='h-full w-full object-contain'
              />
            ) : (
              <div className='flex flex-col items-center gap-2 text-muted-foreground'>
                <ImageIcon className='size-12 opacity-50' />
                <span>クリックして画像を選択、またはURLから自動取得</span>
              </div>
            )}
          </div>
          <Button variant='outline' onClick={handleSelectImage} className='shrink-0'>
            画像をアップロード
          </Button>
        </div>

        {/* 右側: アセット情報フォーム */}
        <div className='flex flex-col gap-6 overflow-hidden px-1 pr-4 min-h-0'>
          {/* 基本情報エリア (スクロールさせず固定) */}
          <div className='grid gap-4 shrink-0 pr-2'>
            <div className='grid gap-2'>
              <Label htmlFor='name'>アセット名</Label>
              <Input
                id='name'
                value={assetInfo.name}
                onChange={(e) => setAssetInfo({ ...assetInfo, name: e.target.value })}
                placeholder='アセット名を入力してください'
              />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div className='grid gap-2'>
                <Label htmlFor='shop'>ショップ名</Label>
                <Input
                  id='shop'
                  value={assetInfo.shopName}
                  onChange={(e) => setAssetInfo({ ...assetInfo, shopName: e.target.value })}
                  placeholder='ショップ名'
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='category'>カテゴリ</Label>
                <Input
                  id='category'
                  value={assetInfo.category}
                  onChange={(e) => setAssetInfo({ ...assetInfo, category: e.target.value })}
                  placeholder='例: Avatar, Prop, Shader'
                />
              </div>
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='version'>バージョン</Label>
              <Input
                id='version'
                value={assetInfo.version}
                onChange={(e) => setAssetInfo({ ...assetInfo, version: e.target.value })}
                placeholder='1.0.0'
              />
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='description'>説明</Label>
              <Textarea
                id='description'
                rows={4}
                value={assetInfo.description}
                onChange={(e) => setAssetInfo({ ...assetInfo, description: e.target.value })}
                placeholder='アセットに関するメモ'
                className='resize-none'
              />
            </div>

            <div className='grid gap-2'>
              <Label>タグ</Label>
              <div className='flex flex-wrap gap-2 mb-1 max-h-[80px] overflow-y-auto p-1 border rounded-md bg-muted/10'>
                {assetInfo.tags.length > 0 ? (
                  assetInfo.tags.map((tag) => (
                    <div
                      key={tag}
                      className='flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium border border-border shadow-xs h-fit'
                    >
                      {tag}
                      <button
                        type='button'
                        onClick={() => handleRemoveTag(tag)}
                        className='hover:text-destructive transition-colors ml-1'
                      >
                        <X className='size-3' />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className='text-xs text-muted-foreground italic py-1 px-1'>タグが設定されていません</p>
                )}
              </div>
              <div className='flex gap-2'>
                <Input
                  placeholder='タグを追加...'
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className='h-9'
                />
                <Button variant='outline' size='sm' onClick={handleAddTag} className='h-9'>
                  追加
                </Button>
              </div>
            </div>
          </div>

          {/* ZIPファイル一覧エリア (独立してスクロール) */}
          <div className='flex flex-col gap-2 flex-1 min-h-0'>
            <Label className='shrink-0'>登録するファイル (ZIP)</Label>
            <div className='flex-1 overflow-y-auto space-y-2 p-1 border rounded-md bg-muted/10 min-h-[100px]'>
              {files.map((file, index) => (
                <div key={index} className='flex items-center gap-2 p-2 rounded-md bg-muted border text-sm'>
                  <Package className='size-4 text-muted-foreground shrink-0' />
                  <span className='flex-1 truncate'>{file}</span>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='size-7'
                    onClick={() => setFiles(files.filter((_, i) => i !== index))}
                  >
                    <X className='size-4' />
                  </Button>
                </div>
              ))}
              {files.length === 0 && (
                <p className='text-xs text-muted-foreground italic p-2'>ファイルが選択されていません</p>
              )}
            </div>
            <Button variant='outline' className='w-full border-dashed shrink-0' onClick={handleSelectFiles}>
              ファイルを指定...
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
