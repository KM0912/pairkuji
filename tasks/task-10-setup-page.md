# セットアップページ実装

## 作業内容
参加者管理・セッション設定画面の実装

## 実装ファイル
- `src/app/session/[id]/setup/page.tsx`
- `src/components/PlayerManagement.tsx`
- `src/components/PlayerListSheet.tsx`
- `src/components/SessionSettings.tsx`

## 必要な機能
- 参加者追加・削除・検索
- 参加者出欠ステータス変更
- セッション設定変更
- 参加者インポート（将来用）
- 第1ラウンド開始ボタン

## レイアウト構成
```tsx
// page.tsx の構造
export default function SetupPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto p-4">
      <SessionHeader sessionId={params.id} />
      
      {/* セッション設定 */}
      <SessionSettings sessionId={params.id} />
      
      {/* 参加者管理 */}
      <PlayerManagement sessionId={params.id} />
      
      {/* 開始ボタン */}
      <StartRoundButton sessionId={params.id} />
    </div>
  );
}
```

## PlayerManagementの要件
- 参加者一覧表示（カード形式）
- 追加・削除ボタン
- ステータス切り替え（active/rest/absent）
- 検索・フィルタリング
- 現在の参加者数表示

## SessionSettingsの要件
- コート数変更
- 1試合時間変更
- 設定の即座反映

## チェックリスト
- [ ] `src/app/session/[id]/setup/page.tsx` 実装
- [ ] PlayerManagementコンポーネント実装
- [ ] PlayerListSheetコンポーネント実装
- [ ] SessionSettingsコンポーネント実装
- [ ] プレイヤーストア連携
- [ ] セッションストア連携
- [ ] バリデーション実装
- [ ] ラウンド開始ロジック実装