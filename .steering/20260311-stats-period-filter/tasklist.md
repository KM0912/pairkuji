# タスクリスト

## フェーズ1: フィルタロジック

- [x] statsCalculator.tsにPeriodFilterType型とfilterSessions関数を追加
- [x] statsCalculator.test.tsにfilterSessionsのテストを追加

## フェーズ2: UIコンポーネント

- [x] PeriodFilter.tsxを作成

## フェーズ3: 統合

- [x] stats/page.tsxにフィルタ状態管理を追加し、filteredSessionsを全計算に適用

## フェーズ4: 品質チェック

- [x] `npm run test:run`
- [x] `npm run lint`
- [x] `npm run type-check`
- [x] `npm run build`

---

## 実装後の振り返り

### 実装完了日
2026-03-11

### 計画と実績の差分

**計画と異なった点**:
- 計画通りに完了。変更なし。

### 学んだこと

**技術的な学び**:
- フィルタロジックを純粋関数として分離したことで、ページ側はuseMemoの入力を切り替えるだけで済んだ

### 次回への改善提案
- カスタム日付範囲が必要になった場合はdayjsを活用して日付ピッカーを検討
