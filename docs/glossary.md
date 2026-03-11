# プロジェクト用語集 (Glossary)

## 概要

このドキュメントは、pairkuji プロジェクト内で使用される用語の定義を管理します。
ドメイン用語・技術用語・UI用語について、コード上の表現との対応を含めて定義します。

**更新日**: 2026-03-11

---

## ドメイン用語

プロジェクト固有のビジネス概念や機能に関する用語。

### メンバー

**定義**: アプリに登録された選手の基本情報。練習参加者の母集団となる。

**コードでの表現**: `Member` 型（`src/types/member.ts`）

**主要フィールド**:
- `id`: 自動採番の一意識別子
- `name`: 選手名
- `isActive`: アクティブ/非アクティブの状態

**英語表記**: Member

**関連用語**: 練習参加者、選手マスター

**説明**: メンバーは「選手マスター」として永続的に管理される。練習ごとにメンバー一覧から当日の参加者を選択する。`isActive` が `false` の場合は非アクティブ状態となり、参加者選択画面に表示されない。

---

### 練習（練習セッション）

**定義**: 1回の練習会全体を表す単位。コート数の設定、参加者の選択、複数ラウンドの進行を含む。

**コードでの表現**: `PracticeSettings` 型（`src/types/practice.ts`）、`practiceStore`（`src/lib/stores/practiceStore.ts`）

**主要フィールド**:
- `courts`: 使用コート数（2〜6面）
- `currentRound`: 現在のラウンド番号（0 = 未開始）
- `startedAt`: 練習開始日時
- `updatedAt`: 最終更新日時

**英語表記**: Practice / Practice Session

**関連用語**: ラウンド、コート、練習参加者

**説明**: アプリは単一練習モデルを採用しており、同時に1つの練習セッションのみ管理する。新しい練習を開始すると既存データはリセットされる。

---

### 練習参加者

**定義**: 当日の練習に参加する選手。メンバーマスターから選択され、練習中の出場/休憩の状態を持つ。

**コードでの表現**: `PracticePlayer` 型（`src/types/practice.ts`）

**主要フィールド**:
- `memberId`: メンバーIDへの参照（主キー）
- `playerNumber`: 選択順に振られる番号（1から開始、UI表示用）
- `status`: `'active'`（出場可）または `'rest'`（一時休憩）
- `playedOffset`: 途中参加時の試合回数補正値

**英語表記**: Practice Player / Participant

**関連用語**: メンバー、プレイヤーステータス、途中参加

**説明**: メンバーマスターと練習参加者は1対多の関係。同一メンバーが複数の練習に参加するが、練習ごとにリセットされる。

---

### プレイヤーステータス

**定義**: 練習参加者の現在の状態。出場可能か一時休憩中かを示す。

**コードでの表現**: `PlayerStatus` 型（`'active' | 'rest'`、`src/types/practice.ts`）

**英語表記**: Player Status

| ステータス | 意味 | 説明 |
|----------|------|------|
| `active` | 出場可 | 次のラウンド生成時に組み合わせ対象となる |
| `rest` | 一時休憩 | 次のラウンド生成時に組み合わせ対象から除外される |

**関連用語**: 練習参加者、休憩者

**説明**: `active` はアルゴリズムの組み合わせ対象に含まれることを意味する。`rest` は主催者が手動で設定する一時的な離脱状態（体調不良・用事等）。アルゴリズムが選定する「休憩者」とは異なる概念。

---

### プレイヤー番号

**定義**: 練習参加者に選択順で付与される通し番号（1から開始）。UI上での識別に使用。

**コードでの表現**: `PracticePlayer.playerNumber`

**英語表記**: Player Number

**関連用語**: 練習参加者

**説明**: メンバーのIDとは別に、練習ごとに振られる表示用の番号。コートカードや掲示画面で選手を素早く識別するために使用する。

---

### ラウンド

**定義**: 同時に行う複数コートの試合セット。1ラウンドで全コートが同時に試合を行い、一部の参加者は休憩となる。

**コードでの表現**: `Round` 型（`src/types/round.ts`）

**主要フィールド**:
- `roundNo`: ラウンド番号（1から開始）
- `courts`: コートごとの対戦情報（`CourtMatch[]`）
- `rests`: 休憩者のメンバーID配列（`number[]`）

**英語表記**: Round

**関連用語**: コート、休憩者、ペア、対戦

**説明**: 練習は複数ラウンドの繰り返しで進行する。各ラウンドは公平性アルゴリズムによって自動生成される。

---

### コート

**定義**: ダブルスの試合が行われる場所。1コートにつき4名（2ペア）が対戦する。

**コードでの表現**: `CourtMatch` 型（`src/types/round.ts`）

**主要フィールド**:
- `courtNo`: コート番号（1から開始）
- `pairA`: ペアAのメンバーID（`[number, number]`）
- `pairB`: ペアBのメンバーID（`[number, number]`）

**英語表記**: Court / Court Match

**関連用語**: ラウンド、ペア、コート識別色

**説明**: コート数は練習設定で2〜6面に設定可能。練習中でも変更できる。各コートには識別色（最大6色）と番号が割り当てられ、色覚多様性に配慮して色と番号を併用する。

---

### ペア

**定義**: 1つのコートで同じチームとして試合する2名の組み合わせ。

**コードでの表現**: `Pair` 型（`[number, number]`、`src/lib/fairnessAlgorithm.ts` 内部）、`CourtMatch.pairA` / `CourtMatch.pairB`

**英語表記**: Pair

**関連用語**: 対戦、ペア重複、ペア頻度統計

**説明**: ペアはメンバーIDの昇順タプルで表現される（例: `[3, 7]`）。公平性アルゴリズムは直近のペア履歴を追跡し、同一ペアの連続登場を回避する。

---

### 対戦

**定義**: 1つのコートで向かい合う2つのペアの組み合わせ。

**コードでの表現**: `CourtMatch` 型の `pairA` vs `pairB`

**英語表記**: Match / Opponent Match

**関連用語**: ペア、対戦重複、対戦頻度統計

**説明**: 対戦はペアA対ペアBの形で表現される。アルゴリズムは個人間の対戦頻度（誰と誰が何回対戦したか）を追跡し、偏りを回避する。

---

### 休憩者

**定義**: あるラウンドで試合に出場せず待機する参加者。参加者数がコート定員を超える場合に発生する。

**コードでの表現**: `Round.rests`（メンバーID配列）

**英語表記**: Rest Player / Resting Player

**関連用語**: ラウンド、連続休憩、プレイヤーステータス

**説明**: 休憩者はアルゴリズムが公平性に基づいて自動選定する。試合回数が多い人、休憩回数が少ない人が優先的に休憩に回される。手動設定の「一時休憩（status = rest）」とは区別される。

---

### 途中参加

**定義**: 練習開始後に新たに参加者を追加すること。

**コードでの表現**: `practiceStore.addParticipant()`、`PracticePlayer.playedOffset`

**英語表記**: Mid-session Join / Late Join

**関連用語**: 試合回数補正（playedOffset）、練習参加者

**説明**: 途中参加者には `playedOffset` が設定され、既存参加者との試合回数差を補正する。これにより、途中参加者が過剰に試合に出場したり、逆に休憩が偏ったりすることを防ぐ。

---

### 入替（交代）

**定義**: 現在のラウンドで、コート上の選手と休憩者を入れ替える操作。

**コードでの表現**: `practiceStore.substitutePlayer(fromMemberId, toMemberId)`

**英語表記**: Substitution

**関連用語**: コート、休憩者

**説明**: 主催者が手動で行う操作。直近のラウンドのコート配置を更新し、指定した2名のプレイヤーを入れ替える。

---

## 公平性アルゴリズム用語

組み合わせ生成アルゴリズムに関する用語。実装は `src/lib/fairnessAlgorithm.ts`。

### 公平性アルゴリズム

**定義**: 試合回数・休憩回数の偏りを最小化し、ペアや対戦の多様性を確保する組み合わせ自動生成の仕組み。

**コードでの表現**: `generateFairRound()` 関数

**英語表記**: Fairness Algorithm

**処理の流れ**:
1. **統計計算**（`calculatePlayerStats`）: 過去ラウンドから各選手の統計を算出
2. **休憩者選定**（`selectRestPlayers`）: 最も公平な休憩者の組み合わせを探索
3. **ペア形成**（`buildPairs`）: 出場者から最適なペアを形成
4. **コート配置**（`buildCourtsFromPairs`）: ペア同士を対戦させるコートを決定

---

### 選手統計

**定義**: 各参加者の試合・休憩に関する累積統計情報。アルゴリズムの判断基準となる。

**コードでの表現**: `PlayerStats` 型（`src/types/stats.ts`）

**主要フィールド**:
- `playedCount`: 出場回数（`playedOffset` を含む）
- `restCount`: 休憩回数
- `consecRest`: 最大連続休憩数
- `recentPartners`: 直近のペア相手履歴（最大5件、最新が末尾）
- `recentOpponents`: 直近の対戦相手履歴（最大5件、最新が末尾）

**英語表記**: Player Stats / Player Statistics

---

### 試合回数補正（playedOffset）

**定義**: 途中参加者に設定される初期試合回数の補正値。既存参加者との公平性を担保する。

**コードでの表現**: `PracticePlayer.playedOffset`

**英語表記**: Played Offset

**計算方法**: 途中参加時点での、出場可能（active）な参加者の最小試合回数を `playedOffset` として設定する。統計計算時に `playedCount` の初期値として加算される。

---

### 連続休憩

**定義**: ある参加者が複数ラウンド連続で休憩者に選定されること。KPIとして連続休憩2回以上の発生率5%以下を目標とする。

**コードでの表現**: `PlayerStats.consecRest`、`CONSECUTIVE_REST_PENALTY`（定数: 180）

**英語表記**: Consecutive Rest

**関連用語**: 休憩者、連続休憩ペナルティ

---

### ペア重複

**定義**: 直近のラウンドで同一ペア（同じ2名の組み合わせ）が再登場すること。

**コードでの表現**: `computePairPenalty()` 関数、`PlayerStats.recentPartners`

**英語表記**: Duplicate Pair / Partner Overlap

**関連用語**: ペア、減衰ペナルティ

---

### 対戦重複

**定義**: 直近のラウンドで同一の対戦相手との対戦が再登場すること。

**コードでの表現**: `computeMatchPenalty()` 関数、`PlayerStats.recentOpponents`

**英語表記**: Duplicate Match / Opponent Overlap

**関連用語**: 対戦、減衰ペナルティ

---

### 減衰ペナルティ

**定義**: ペアや対戦の重複を評価する際に、直近ほど大きく・過去ほど小さくなるペナルティ値。時間経過で重複の影響が薄れる仕組み。

**コードでの表現**: `calculateRecencyPenalty()` 関数

**計算式**:
```
penalty = max(BASE - (distance_from_recent - 1) * DECAY, MINIMUM)
```

**パラメータ（ペア重複）**:
- `PARTNER_PENALTY_BASE`: 30（基本ペナルティ）
- `PARTNER_PENALTY_DECAY`: 6（距離による減衰）
- `PARTNER_PENALTY_MIN`: 6（最小ペナルティ）

**パラメータ（対戦重複）**:
- `OPPONENT_PENALTY_BASE`: 12（基本ペナルティ）
- `OPPONENT_PENALTY_DECAY`: 3（距離による減衰）
- `OPPONENT_PENALTY_MIN`: 2（最小ペナルティ）

**英語表記**: Recency Penalty / Decay Penalty

---

### 休憩者選定スコア

**定義**: 休憩者の組み合わせ候補を評価するための総合スコア。値が小さいほど公平な組み合わせ。

**コードでの表現**: `scoreRestCombination()` 関数

**評価項目と重み**:

| 評価項目 | 定数名 | 重み | 説明 |
|---------|--------|------|------|
| 試合回数分散 | `PLAYED_VARIANCE_WEIGHT` | 320 | 全参加者の試合回数のばらつき |
| 試合回数範囲 | `PLAYED_RANGE_WEIGHT` | 140 | 試合回数の最大-最小の差 |
| 休憩回数分散 | `REST_VARIANCE_WEIGHT` | 28 | 全参加者の休憩回数のばらつき |
| 休憩回数範囲 | `REST_RANGE_WEIGHT` | 18 | 休憩回数の最大-最小の差 |
| 低試合数者休憩 | `LOW_PLAYED_REST_PENALTY` | 90 | 試合回数最少者を休憩にするペナルティ |
| 連続休憩 | `CONSECUTIVE_REST_PENALTY` | 180 | 連続で休憩になるペナルティ |
| 直近休憩重複 | `RECENT_OVERLAP_PENALTY` | 36 | 直前ラウンドの休憩者と重複 |
| 過去休憩重複 | `OLDER_OVERLAP_PENALTY` | 16 | 2-3ラウンド前の休憩者と重複 |
| 同一休憩組 | `REPEAT_SET_PENALTY` | 220 | 休憩者の組み合わせが過去と完全一致 |

**英語表記**: Rest Selection Score

---

### バックトラック探索

**定義**: 休憩者選定やコート配置において、候補の全組み合わせを再帰的に探索し、最適解を求める手法。

**コードでの表現**: `findBestRestCombination()` 関数、`buildCourtsFromPairs()` 内の `search()` 関数

**英語表記**: Backtrack Search

**説明**: 計算量制御のため候補者数を制限し（`REST_CANDIDATE_BUFFER`: 4）、実用的な時間内で完了させる。

---

### 対戦頻度マップ

**定義**: 全ラウンドを通じた個人間の対戦回数を集計したマップ。コート配置の最適化に使用。

**コードでの表現**: `buildOpponentFrequencyMap()` 関数、`OPPONENT_FREQUENCY_WEIGHT`（定数: 4）

**英語表記**: Opponent Frequency Map

**説明**: キーは `"小さいID-大きいID"` 形式の文字列、値は対戦回数。直近履歴の減衰ペナルティとは別に、長期的な対戦偏りも考慮する。

---

### ペア統計

**定義**: ペア（同チーム）の組み合わせ回数を集計した統計データ。

**コードでの表現**: `PairStats` 型、`PairRecord` 型（`src/types/pairs.ts`）

**主要フィールド**:
- `PairRecord.player1`: メンバーID（小さい方）
- `PairRecord.player2`: メンバーID（大きい方）
- `PairRecord.count`: 同ペアになった回数

**英語表記**: Pair Stats / Pair Statistics

---

### 公平性スコア

**定義**: ラウンド全体の公平性を数値化した指標。各種偏りのペナルティを合算したもの。

**コードでの表現**: `FairnessScore` 型（`src/types/stats.ts`）

**主要フィールド**:
- `playedVariance`: 試合回数の分散
- `restVariance`: 休憩回数の分散
- `consecutiveRestPenalty`: 連続休憩ペナルティ
- `duplicatePairCount`: ペア重複数
- `duplicateMatchCount`: 対戦重複数
- `totalScore`: 総合スコア

**英語表記**: Fairness Score

---

### 動的重み調整

**定義**: 参加者数やコート定員との比率に応じて、ペナルティの重み係数を自動的に変更する仕組み。

**コードでの表現**: `buildRestSelectionContext()` 内の `consecutivePenaltyMultiplier` / `recentOverlapMultiplier` / `olderOverlapMultiplier`

**英語表記**: Dynamic Weight Adjustment

**説明**: 参加者数がコート定員の1.5倍を超え、かつ全員の試合回数が同一の場合、連続休憩ペナルティを無効化（乗数を0に）する。多人数時に連続休憩が避けられない状況での不合理なペナルティを防ぐ。

---

## UI・画面用語

ユーザーインターフェースに関する用語。

### トップページ

**定義**: アプリ起動時に表示される画面。新規練習の開始または前回練習の継続を選択する。

**コードでの表現**: `src/app/page.tsx`

**ルート**: `/`

---

### メンバー管理画面

**定義**: 選手マスターの登録・編集・有効化/無効化を行う画面。

**コードでの表現**: `src/app/members/page.tsx`

**ルート**: `/members`

**関連コンポーネント**: `MemberManagement`（注: 現在はページ内に統合されている可能性あり）

---

### 練習設定画面

**定義**: コート数の設定と当日の参加者を選択する画面。

**コードでの表現**: `src/app/practice/page.tsx`

**ルート**: `/practice`

**関連コンポーネント**: `ParticipantSelection`, `CourtSelector`

---

### ラウンド進行画面

**定義**: 現在のラウンドのコート配置を表示し、入替・再生成などの操作を行うメイン画面。

**コードでの表現**: `src/app/practice/round/[n]/page.tsx`（動的ルート）

**ルート**: `/practice/round/:n`

---

### コートカード

**定義**: 1つのコートの対戦情報をカード形式で表示するUIコンポーネント。ペアA対ペアBの選手名とコート番号を表示する。

**コードでの表現**: `CourtCard` コンポーネント（`src/components/practice/CourtManagement.tsx` 内）

**英語表記**: Court Card

---

### 休憩パネル

**定義**: 現在のラウンドで休憩中の参加者一覧を表示するUI領域。

**英語表記**: Rest Panel

---

### フルスクリーン掲示

**定義**: コート割り当てを体育館内で掲示するための大画面表示モード。大きな文字とコート識別色で構成される。

**コードでの表現**: `FullscreenDisplay` コンポーネント（`src/components/practice/FullscreenDisplay.tsx`）

**英語表記**: Fullscreen Display

**関連用語**: コート識別色

---

### コート識別色

**定義**: 各コートに割り当てられる色。最大6面分。色覚多様性に配慮し、色と番号を必ず併用する。

| コート | 色コード |
|--------|----------|
| Court 1 | `#2563EB` |
| Court 2 | `#4F46E5` |
| Court 3 | `#059669` |
| Court 4 | `#0D9488` |
| Court 5 | `#7C3AED` |
| Court 6 | `#0891B2` |

**英語表記**: Court Identification Color

---

### コートセレクター

**定義**: コート数を選択するためのUIコンポーネント。

**コードでの表現**: `CourtSelector` コンポーネント（`src/components/ui/CourtSelector.tsx`）

**英語表記**: Court Selector

---

### 参加者管理

**定義**: 練習中に参加者のステータス変更（active/rest切替）や途中参加を行うためのUI。

**コードでの表現**: `ParticipantManagement` コンポーネント（`src/components/practice/ParticipantManagement.tsx`）

**英語表記**: Participant Management

---

### 統計画面

**定義**: 出場回数・休憩回数・ペア頻度・対戦頻度などの統計情報を一覧表示する画面。

**コードでの表現**: `src/app/stats/page.tsx`

**ルート**: `/stats`

**関連コンポーネント**: `PairStatsPanel`, `OpponentStatsPanel`, `RoundHistory`

---

### ボトムナビゲーション

**定義**: 画面下部に常時表示されるナビゲーションバー。主要画面間の遷移に使用。

**コードでの表現**: `BottomNavigation` コンポーネント（`src/components/layout/BottomNavigation.tsx`）

**英語表記**: Bottom Navigation

---

### 入替ヒント

**定義**: コート上の選手と休憩者の入替を促すUIヒント表示。

**コードでの表現**: `SubstitutionHint` コンポーネント（`src/components/practice/SubstitutionHint.tsx`）

**英語表記**: Substitution Hint

---

## データモデル用語

データベース・データ構造に関する用語。

### IndexedDB

**定義**: ブラウザ内蔵のNoSQLデータベース。本アプリのすべてのデータを永続化する。

**本プロジェクトでの用途**: Dexie.jsを介してメンバー、練習設定、参加者、ラウンドデータを保存。サーバー送信なしのローカル完結。

**関連ファイル**: `src/lib/db.ts`（`PairkujiDB` クラス）

### テーブル構成

| テーブル名 | 主キー | 説明 |
|-----------|--------|------|
| `members` | `++id`（自動採番） | メンバーマスター |
| `practiceSettings` | `id`（固定値: 1） | 練習設定（単一レコード） |
| `practicePlayers` | `memberId` | 練習参加者 |
| `rounds` | `roundNo` | ラウンドデータ |
| `pairStats` | `++id`（自動採番） | ペア統計 |

---

## アーキテクチャ用語

### Zustand ストア

**定義**: 状態管理ライブラリ Zustand を使用した、機能別のステート管理単位。

| ストア名 | ファイル | 責務 |
|---------|--------|------|
| `useMemberStore` | `src/lib/stores/memberStore.ts` | メンバーマスターのCRUD |
| `usePracticeStore` | `src/lib/stores/practiceStore.ts` | 練習設定、参加者管理、ラウンド生成・進行 |

---

### PWA（Progressive Web Application）

**定義**: Webアプリケーションをネイティブアプリのように動作させる技術。

**本プロジェクトでの用途**: オフライン動作、ホーム画面インストール、Service Workerによるキャッシュ。体育館などの通信不安定環境での安定動作を実現。

---

## 略語

### PWA

**正式名称**: Progressive Web Application

**意味**: Service Worker・マニフェストを利用し、オフライン動作やホーム画面インストールを可能にするWebアプリの技術仕様。

### KPI

**正式名称**: Key Performance Indicator

**意味**: 重要業績評価指標。本プロジェクトでは出場回数分散、連続休憩率、生成速度などをクライアント側で計測。

### MVP

**正式名称**: Minimum Viable Product

**意味**: 実用最小限の製品。本プロジェクトではF1〜F8の機能がMVPスコープ。

### CTA

**正式名称**: Call to Action

**意味**: ユーザーに行動を促すUI要素。「次の組み合わせを生成」ボタンなどが該当。
