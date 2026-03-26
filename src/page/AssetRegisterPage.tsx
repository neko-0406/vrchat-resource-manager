import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent } from '../components/ui/card';
import { Image as ImageIcon, Link, Search, X, Package } from 'lucide-react';
import { open as openDialog } from '@tauri-apps/plugin-dialog';

export default function AssetRegisterPage() {
  const [assetUrl, setAssetUrl] = useState('');
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

  // TODO: スクレイピングによる情報取得の呼び出し
  const handleFetchInfo = async () => {
    if (!assetUrl) return;
    console.log('Fetching info from:', assetUrl);
    // 今後ここにinvoke('scrape_booth', { url: assetUrl })などを実装予定
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

  return (
    <div className='flex h-full flex-col p-8 gap-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-3xl font-bold'>アセット登録</h1>
        <Button size='lg' disabled={!assetInfo.name}>
          アセットを登録
        </Button>
      </div>

      {/* URL入力エリア */}
      <Card className='bg-muted/50'>
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

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1'>
        {/* 左側: 画像プレビュー */}
        <div className='flex flex-col gap-4'>
          <Label>サムネイル画像</Label>
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
          <Button variant='outline' onClick={handleSelectImage}>
            画像をアップロード
          </Button>
        </div>

        {/* 右側: アセット情報フォーム */}
        <div className='flex flex-col gap-6 overflow-y-auto pr-2'>
          <div className='grid gap-4'>
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
              />
            </div>

            <div className='grid gap-2'>
              <Label>登録するファイル (ZIP)</Label>
              <div className='space-y-2'>
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
                <Button variant='outline' className='w-full border-dashed' onClick={handleSelectFiles}>
                  ファイルを指定...
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
