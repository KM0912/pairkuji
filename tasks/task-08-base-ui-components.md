# 基底UIコンポーネント実装

## 作業内容
再利用可能な基底UIコンポーネントの実装

## 実装ファイル
- `src/components/ui/Button.tsx`
- `src/components/ui/Card.tsx`  
- `src/components/ui/Modal.tsx`
- `src/components/ui/Sheet.tsx` - モバイル用ボトムシート
- `src/components/ui/Input.tsx`
- `src/components/ui/Badge.tsx`

## 必要な仕様
- Tailwind CSSベース
- 体育館用大きめフォント（text-lg以上）
- アクセシビリティ対応
- レスポンシブデザイン
- 一貫したデザインシステム

## 実装例
```typescript
// Button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

// Card.tsx  
interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

// Modal.tsx
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}
```

## デザイン要件
- カードは大きめのタッチターゲット（44px以上）
- コントラスト比4.5:1以上
- フォーカス表示対応
- モバイルファースト設計

## チェックリスト
- [ ] `src/components/ui/` ディレクトリ作成
- [ ] Buttonコンポーネント実装
- [ ] Cardコンポーネント実装
- [ ] Modal/Sheetコンポーネント実装
- [ ] Inputコンポーネント実装
- [ ] Badgeコンポーネント実装
- [ ] 各コンポーネントのexport設定
- [ ] アクセシビリティ確認