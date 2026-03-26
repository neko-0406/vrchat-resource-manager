import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '@radix-ui/react-label';

interface AppSetting {
  asset_data_folder: string;
}

export default function AppSettingPage() {
  const [setting, setSetting] = useState<AppSetting>({ asset_data_folder: '' });
  const [isLoading, setIsLoading] = useState(true);

  // 設定の読み込み
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await invoke<AppSetting>('get_config');
        setSetting(config);
      } catch (error) {
        console.error('Failed to load config:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadConfig();
  }, []);

  // フォルダ選択ダイアログ
  const handleSelectFolder = async () => {
    try {
      const selected = await openDialog({
        directory: true,
        multiple: false,
        title: 'アセット保存先フォルダを選択',
      });
      if (selected && typeof selected === 'string') {
        setSetting({ ...setting, asset_data_folder: selected });
      }
    } catch (error) {
      console.error('Failed to open dialog:', error);
    }
  };

  // 保存処理
  const handleSave = async () => {
    try {
      await invoke('save_config', { config: setting });
      alert('設定を保存しました。');
    } catch (error) {
      console.error('Failed to save config:', error);
      alert('保存に失敗しました。');
    }
  };

  if (isLoading) {
    return <div className='p-8'>読み込み中...</div>;
  }

  return (
    <div className='flex flex-col gap-6 p-8'>
      <h1 className='text-3xl font-bold'>アプリ設定</h1>

      <Card>
        <CardHeader>
          <CardTitle>基本設定</CardTitle>
          <CardDescription>アプリケーションの基本的な動作設定を行います。</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='asset-path'>アセット保存先フォルダ</Label>
            <div className='flex gap-2'>
              <Input
                id='asset-path'
                value={setting.asset_data_folder}
                onChange={(e) => setSetting({ ...setting, asset_data_folder: e.target.value })}
                placeholder='フォルダパスを選択してください'
                readOnly
              />
              <Button variant='outline' onClick={handleSelectFolder}>
                参照...
              </Button>
            </div>
            <p className='text-xs text-muted-foreground'>VRChatのアセット（UnityPackage等）が保存される基準となるフォルダです。</p>
          </div>

          <div className='pt-4'>
            <Button onClick={handleSave} className='w-full sm:w-auto'>
              設定を保存
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
