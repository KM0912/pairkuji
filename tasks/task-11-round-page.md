# ラウンド進行ページ実装

## 作業内容
メインのカードUI画面とラウンド制御機能の実装

## 実装ファイル
- `src/app/session/[id]/round/[n]/page.tsx`
- `src/components/SessionHeader.tsx`
- `src/components/CourtCard.tsx`
- `src/components/RestPanel.tsx`
- `src/components/RoundControls.tsx`

## 必要な機能
- コート別対戦カード表示
- 休憩者一覧表示
- プレイヤー手動入れ替え
- タイマー表示・制御
- ラウンド確定・巻き戻し・再生成

## レイアウト構成
```tsx
// page.tsx の構造
export default function RoundPage({ params }) {
  return (
    <div className="container mx-auto p-4">
      <SessionHeader sessionId={params.id} roundNo={params.n} />
      
      {/* コート一覧 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courts.map(court => (
          <CourtCard key={court.courtNo} court={court} />
        ))}
      </div>
      
      {/* 休憩者パネル */}
      <RestPanel rests={rests} />
      
      {/* ラウンド制御 */}
      <RoundControls sessionId={params.id} roundNo={params.n} />
    </div>
  );
}
```

## CourtCardの要件
- チーム対戦表示
- プレイヤー名・タグ表示
- ドラッグ&ドロップ対応（将来用）
- タップで入れ替えメニュー

## SessionHeaderの要件  
- セッション名・ラウンド表示
- タイマー表示
- 次ラウンド生成ボタン

## RoundControlsの要件
- 確定ボタン
- 巻き戻しボタン
- 再生成ボタン
- 各操作の確認ダイアログ

## チェックリスト
- [ ] `src/app/session/[id]/round/[n]/page.tsx` 実装
- [ ] SessionHeaderコンポーネント実装
- [ ] CourtCardコンポーネント実装
- [ ] RestPanelコンポーネント実装
- [ ] RoundControlsコンポーネント実装
- [ ] ラウンドストア連携
- [ ] 手動調整機能実装
- [ ] 確認ダイアログ実装