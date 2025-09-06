# トップページ実装

## 作業内容
新規セッション作成・既存セッション管理のメインページ実装

## 実装ファイル
- `src/app/page.tsx`
- `src/components/NewSessionForm.tsx`
- `src/components/SessionList.tsx`

## 必要な機能
- 新規セッション作成フォーム
- 既存セッション一覧表示
- セッション選択・削除
- 最近のセッション表示

## レイアウト構成
```tsx
// page.tsx の構造
export default function HomePage() {
  return (
    <div className="container mx-auto p-4">
      <h1>pairkuji</h1>
      
      {/* 新規セッション作成 */}
      <NewSessionForm />
      
      {/* 既存セッション一覧 */}
      <SessionList />
    </div>
  );
}
```

## NewSessionFormの要件
- セッション名（オプション）
- コート数選択（2-6）
- 1試合時間設定（分）
- バリデーション
- 作成後は setup ページへリダイレクト

## SessionListの要件  
- セッション一覧表示
- 最終更新日時表示
- 参加者数表示
- 継続・削除ボタン
- 空の場合のメッセージ

## チェックリスト
- [ ] `src/app/page.tsx` 実装
- [ ] `src/components/NewSessionForm.tsx` 実装
- [ ] `src/components/SessionList.tsx` 実装
- [ ] セッションストア連携
- [ ] フォームバリデーション実装
- [ ] ルーティング実装
- [ ] レスポンシブ対応確認