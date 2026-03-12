# 組み合わせ生成アルゴリズム仕様書

ダブルス競技（テニス・バドミントン等）の練習セッションにおいて、複数コートへのプレイヤー割り当て・チーム編成を自動生成するアルゴリズム。

## 1. 解決する課題

| 課題 | 説明 |
|------|------|
| 試合数の偏り | 試合数が少ない人を優先的に出場させたい |
| ペアの固定化 | なるべく最近組んでいない人とペアを組みたい |
| 対戦の固定化 | なるべく最近対戦していない人と対戦したい |
| 途中参加者の連続出場 | 途中参加者の試合数不足により、その後の試合を独占してしまう |
| 固定休憩グループ | 休憩に回るメンバーの組み合わせが毎回同じになる |

## 2. 入力

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| `activePlayers` | PracticePlayer の配列 | 現在アクティブな全プレイヤー |
| `maxCourts` | 整数 | 使用可能なコート数 |
| `rounds` | Round の配列 | セッション内の過去のラウンド履歴 |

### PracticePlayer

```
PracticePlayer {
  memberId      -- 一意な識別子
  playerNumber  -- 選択順の番号（1から開始）
  status        -- 'active' | 'rest'
  playedOffset? -- 途中参加時の初期試合数補正（デフォルト: 0）
}
```

### Round

```
Round {
  roundNo  -- ラウンド番号
  courts   -- CourtMatch の配列
  rests    -- 休憩プレイヤーID の配列
}

CourtMatch {
  courtNo -- コート番号
  pairA   -- [memberId, memberId]
  pairB   -- [memberId, memberId]
}
```

## 3. 出力

```
{
  courts -- CourtMatch の配列（使用コート数分）
  rests  -- memberId の配列（休憩メンバー）
}
```

## 4. アルゴリズム概要

**段階的最適化 + 統合評価方式**を採用する。

休憩選出・ペア構築・コート配置をそれぞれ専用アルゴリズムで最適化しつつ、複数の休憩候補に対してパイプライン全体を実行し、総合スコアで最良の候補を選ぶ。これにより、休憩の公平性とペア/対戦の多様性を同時に最適化できる。

```
全体フロー:

1. 統計値を算出する（calculatePlayerStats）
2. 休憩候補を INTEGRATED_CANDIDATE_COUNT 個生成する（findTopRestCombinations）
3. 各候補に対して:
   a. ペアを構築する（buildPairs）
   b. コートに配置する（buildCourtsFromPairs）
   c. 総合スコアを算出する（evaluateCandidate）
4. 最低スコア（=最良）の候補を採用する
```

### 4.1. 特例: 4人1コート

4人ちょうどの場合、全員が毎回出場するため、3パターンの固定ローテーションを採用する。

```
パターン0: {p1, p2} vs {p3, p4}
パターン1: {p1, p3} vs {p2, p4}
パターン2: {p1, p4} vs {p2, p3}

使用パターン = rounds.length % 3
```

## 5. 履歴から算出する統計値

組み合わせ生成に先立ち、`rounds` から以下の統計値を算出する（`calculatePlayerStats`）。

### 5.1. プレイヤー別統計

| 値 | 算出方法 |
|----|---------|
| `playedCount` | プレイヤーが参加した試合数（`playedOffset`による補正を含む） |
| `restCount` | プレイヤーが休憩した回数 |
| `consecRest` | 最大連続休憩ストリーク |
| `recentPartners` | 直近5件のパートナー履歴 |
| `recentOpponents` | 直近5件の対戦相手履歴 |

### 5.2. recency penalty（直近性ペナルティ）

ペア/対戦の多様性評価には、全履歴のカウントではなく**直近の履歴に基づく減衰ペナルティ**を使用する。直近のペア/対戦ほど強いペナルティを与え、古いものは自然に減衰する。

```
recencyPenalty(history, target, base, decay, minimum) =
  index = history の中で target が最後に出現した位置
  index が見つからない → 0
  distance = history.length - index  // 1 = 最も直近
  penalty = base - (distance - 1) × decay
  return max(penalty, minimum)
```

**ペアペナルティ（パートナー重複）:**
```
computePairPenalty(A, B) =
    recencyPenalty(A.recentPartners, B, 30, 6, 6)
  + recencyPenalty(B.recentPartners, A, 30, 6, 6)
```

**対戦ペナルティ（対戦相手重複）:**
```
computeMatchPenalty(pairA, pairB) =
  for each (a, b) in pairA × pairB:
    sum += recencyPenalty(a.recentOpponents, b, 12, 3, 2)
    sum += recencyPenalty(b.recentOpponents, a, 12, 3, 2)
```

### 5.3. 対戦頻度マップ

全履歴から個人間の対戦回数をカウントした `opponentFrequency` マップも構築する。recency penalty は直近5件のみを見るのに対し、こちらは全履歴に基づく累積頻度で、コート配置の最適化で使用する。

## 6. 休憩候補の生成

### 6.1. 休憩候補プールの構築（collectRestCandidates）

休憩候補となるプレイヤーのプールを構築する。

```
プールの構築基準:
1. 試合数が多い順 → 休憩数が少ない順 → 前回・前々回の休憩実績順でソート
2. 上位 max(restSlots + 4, ceil(players.length / 2)) 人を候補に追加
3. 追加条件:
   - 試合数が全体最大のプレイヤー
   - 休憩数が全体最小のプレイヤー
```

### 6.2. 休憩組み合わせのスコアリング（scoreRestCombination）

各休憩組み合わせに対してペナルティスコア（低いほど良い）を算出する。

```
scoreRestCombination(restCombo) =
  for each player in allPlayers:
    // 予測試合数・休憩数を計算（この組み合わせが採用された場合）
    predictedPlayed = willRest ? basePlayed : basePlayed + 1
    predictedRest   = willRest ? baseRest + 1 : baseRest

    if willRest:
      // 試合数不足ペナルティ（DEFICIT_CAPで上限制限）
      deficit = min(max(avgPlayed - basePlayed, 0), DEFICIT_CAP)
      score += LOW_PLAYED_REST_PENALTY × deficit

      // 連続休憩ペナルティ
      if predictedStreak >= 2:
        score += CONSECUTIVE_REST_PENALTY × (predictedStreak - 1) × multiplier

      // 直近休憩重複ペナルティ（前々回、3回前も対象）
      score += RECENT_OVERLAP_PENALTY  // 前々回と重複した場合
      score += OLDER_OVERLAP_PENALTY   // 3回前と重複した場合

  // 分散ベースの公平性スコア
  score += variance(predictedPlayed) × PLAYED_VARIANCE_WEIGHT(320)
  score += range(predictedPlayed)    × PLAYED_RANGE_WEIGHT(140)
  score += variance(predictedRest)   × REST_VARIANCE_WEIGHT(28)
  score += range(predictedRest)      × REST_RANGE_WEIGHT(18)

  // 休憩グループの完全一致ペナルティ
  if restCombo == lastRestSet:  score += REPEAT_SET_PENALTY × 4
  if restCombo == prevRestSet:  score += REPEAT_SET_PENALTY
  if restCombo == olderRestSet: score += REPEAT_SET_PENALTY / 2
```

### 6.3. トップN候補の抽出（findTopRestCombinations）

バックトラッキングで全組み合わせを探索し、スコア上位 `INTEGRATED_CANDIDATE_COUNT`（デフォルト: 5）個の休憩パターンを保持する。

```
findTopRestCombinations(candidateIds, restSlots, topN):
  topCombos = []  // {combo, score} のソート済みリスト

  backtrack(start):
    if buffer.length == restSlots:
      score = scoreRestCombination(buffer)
      if topCombos.length < topN or score < worstTopScore:
        topCombos に追加し、スコア順にソート
        topN を超えたら最下位を除去
      return

    for i = start to candidateIds.length:
      buffer.push(candidateIds[i])
      backtrack(i + 1)
      buffer.pop()

  return topCombos のコンボ部分
```

## 7. ペア構築（buildPairs）

出場プレイヤーからペアを構築する。`PAIR_SELECTION_ATTEMPTS`（デフォルト: 6）回の試行で最良のペアリングを選ぶ。

```
buildPairs(playerIds, stats):
  byNeed = playerIds を playedCount 昇順でソート

  for attempt = 0 to PAIR_SELECTION_ATTEMPTS:
    ordering = attempt == 0 ? byNeed : shuffle(byNeed)

    while unused.size > 0:
      base = ordering で最初の未使用プレイヤー
      others = 残りの未使用プレイヤー

      // recency penalty でパートナー候補をスコアリング
      candidates = others.map(p => {
        cost = computePairPenalty(base, p)
        orderScore = cost + random(0, 0.01)
      }).sort(by orderScore)

      // 上位3人（RESTRICTED_PARTNER_CANDIDATES）からランダムに選択
      chosen = random(candidates[0..2])
      pair = [base, chosen]

    if totalScore < bestScore: bestPairs = attemptPairs

  return bestPairs
```

## 8. コート配置（buildCourtsFromPairs）

構築されたペアをコートに2ペアずつ割り当てる。バックトラッキングで全ペア組み合わせを探索し、対戦ペナルティが最小の配置を選ぶ。

```
buildCourtsFromPairs(pairs, stats, opponentFrequency):
  // ペア同士の組み合わせをバックトラックで探索
  search(remaining, current, score):
    if remaining is empty:
      if score < bestScore: update best
      return

    firstPair = remaining[0]
    for secondPair in remaining[1..]:
      matchPenalty = computeMatchPenalty(firstPair, secondPair)
                   + sumOpponentFrequency(firstPair, secondPair) × OPPONENT_FREQUENCY_WEIGHT
      jitter = random(0, 0.001)

      if score + matchPenalty + jitter >= bestScore: 枝刈り（skip）

      search(remaining - {firstPair, secondPair},
             current + {firstPair vs secondPair},
             score + matchPenalty + jitter)

  return bestArrangement
```

## 9. 統合評価（evaluateCandidate）

各候補（休憩パターン＋ペア構築＋コート配置の結果）を総合スコアで評価する。スコアが低いほど良い。

```
evaluateCandidate(restIds, courts, stats, restContext, opponentFrequency) =
    restScore  × REST_SCORE_WEIGHT(1.0)
  + pairScore  × PAIR_SCORE_WEIGHT(0.3)
  + matchScore × MATCH_SCORE_WEIGHT(0.3)
```

| スコア要素 | 算出方法 |
|-----------|---------|
| `restScore` | `scoreRestCombination` の結果（休憩の公平性） |
| `pairScore` | 全コートの `computePairPenalty` の合計（ペアの多様性） |
| `matchScore` | 全コートの `computeMatchPenalty` + `sumOpponentFrequency × OPPONENT_FREQUENCY_WEIGHT` の合計（対戦の多様性） |

**重みの設計意図:**
- `REST_SCORE_WEIGHT(1.0)` >> `PAIR_SCORE_WEIGHT(0.3)` = `MATCH_SCORE_WEIGHT(0.3)`: 休憩の公平性を最優先しつつ、ペア/対戦の質が同等の候補間では多様性の高い方を選択する。

## 10. パラメータ一覧

### 10.1. ペア・対戦ペナルティパラメータ

| パラメータ | 値 | 説明 |
|-----------|-----|------|
| `MAX_RECENT_RECORDS` | 5 | 直近履歴の保持件数 |
| `PARTNER_PENALTY_BASE` | 30 | ペアペナルティの基本値 |
| `PARTNER_PENALTY_DECAY` | 6 | ペアペナルティの減衰率 |
| `PARTNER_PENALTY_MIN` | 6 | ペアペナルティの最小値 |
| `OPPONENT_PENALTY_BASE` | 12 | 対戦ペナルティの基本値 |
| `OPPONENT_PENALTY_DECAY` | 3 | 対戦ペナルティの減衰率 |
| `OPPONENT_PENALTY_MIN` | 2 | 対戦ペナルティの最小値 |
| `OPPONENT_FREQUENCY_WEIGHT` | 4 | 全履歴対戦頻度の重み |

### 10.2. ペア構築パラメータ

| パラメータ | 値 | 説明 |
|-----------|-----|------|
| `PAIR_SELECTION_ATTEMPTS` | 6 | ペア構築の試行回数 |
| `RESTRICTED_PARTNER_CANDIDATES` | 3 | パートナー候補の上位N人から選択 |
| `COURT_MATCH_JITTER` | 0.001 | コート配置のタイブレーク用ランダム値 |

### 10.3. 休憩選定パラメータ

| パラメータ | 値 | 説明 |
|-----------|-----|------|
| `REST_CANDIDATE_BUFFER` | 4 | 休憩候補プールの追加枠 |
| `PLAYED_VARIANCE_WEIGHT` | 320 | 予測試合数の分散に対する重み |
| `PLAYED_RANGE_WEIGHT` | 140 | 予測試合数の範囲に対する重み |
| `REST_VARIANCE_WEIGHT` | 28 | 予測休憩数の分散に対する重み |
| `REST_RANGE_WEIGHT` | 18 | 予測休憩数の範囲に対する重み |
| `LOW_PLAYED_REST_PENALTY` | 90 | 試合数不足プレイヤーを休ませるペナルティ（×deficit） |
| `CONSECUTIVE_REST_PENALTY` | 180 | 連続休憩ペナルティ |
| `RECENT_OVERLAP_PENALTY` | 36 | 前々回の休憩メンバーとの重複ペナルティ |
| `OLDER_OVERLAP_PENALTY` | 16 | 3回前の休憩メンバーとの重複ペナルティ |
| `REPEAT_SET_PENALTY` | 220 | 休憩グループ完全一致のペナルティ |
| `REST_SELECTION_JITTER` | 0.0001 | 休憩選定のタイブレーク用ランダム値 |
| `DEFICIT_CAP` | 2 | 試合数不足ボーナスの上限 |

### 10.4. 統合評価パラメータ

| パラメータ | 値 | 説明 |
|-----------|-----|------|
| `INTEGRATED_CANDIDATE_COUNT` | 5 | 生成する休憩候補の数 |
| `REST_SCORE_WEIGHT` | 1.0 | 休憩公平性スコアの重み |
| `PAIR_SCORE_WEIGHT` | 0.3 | ペアペナルティスコアの重み |
| `MATCH_SCORE_WEIGHT` | 0.3 | 対戦ペナルティスコアの重み |

### 10.5. 重みの設計意図

**休憩選定スコア:**

- `PLAYED_VARIANCE_WEIGHT(320)` >> `REST_VARIANCE_WEIGHT(28)`: 試合数の公平性を休憩数の公平性より大幅に優先する。試合数は「楽しさ」に直結するため。
- `CONSECUTIVE_REST_PENALTY(180)`: 2連続休憩のペナルティが高く設定されており、連続休憩を強く抑止する。ただし `participationRatio > 1.5` の場合は乗数が0になり無効化される（大人数時は連続休憩が不可避なため）。
- `REPEAT_SET_PENALTY(220)`: 前回と完全に同じ休憩グループに対するペナルティ。×4（前回）、×1（前々回）、×0.5（3回前）と減衰する。
- `DEFICIT_CAP(2)`: 途中参加者の `avgPlayed - basePlayed` を最大2に制限。これにより途中参加者が短期間で試合を独占するのを防ぐ。

**recency penalty（ペア/対戦）:**

- `PARTNER_PENALTY_BASE(30)` > `OPPONENT_PENALTY_BASE(12)`: ペアの重複をより強くペナルティ化する。同じパートナーとの連続は、同じ対戦相手との連続より体験として悪い。
- 減衰モデルにより、直近1試合前のペア（ペナルティ30）と5試合前のペア（ペナルティ6）では5倍の差がつく。全履歴のカウントではなく直近の偏りに反応する。

**統合評価:**

- `REST_SCORE_WEIGHT(1.0)` >> `PAIR/MATCH_SCORE_WEIGHT(0.3)`: 休憩の公平性を最優先にしつつ、休憩スコアが同等の候補間ではペア/対戦の多様性で差別化する。

## 11. エッジケース

### 11.1. 初回生成（履歴なし）

全統計値が0のため、休憩選定は分散ベースで均等化される。ペア/対戦もランダムに近い結果となる。

### 11.2. プレイヤー数がちょうど4人×コート数

全員が出場し、休憩メンバーはいない。休憩候補は1つ（空配列）のみ生成され、ペア構築・コート配置の最適化のみとなる。

### 11.3. プレイヤー数が4人未満

コートを構成できないため、全員を休憩として返す（エラーではない）。

### 11.4. コート数に対してプレイヤーが不足

実際に使用するコート数を削減する。

```
actualCourtCount = min(maxCourts, floor(players.length / 4))
```

### 11.5. 途中参加

途中参加者は `playedOffset` で既存メンバーの平均に近い初期値を設定できる。`DEFICIT_CAP(2)` により、試合数不足ペナルティの影響は最大でも `LOW_PLAYED_REST_PENALTY × 2 = 180` に制限され、途中参加者が試合を独占するのを防ぐ。

### 11.6. 途中離脱

離脱したプレイヤーを `activePlayers` から除外して生成する。履歴上の統計は残るが、候補生成の対象外となる。

### 11.7. 参加比率に応じた制約緩和

`participationRatio = players.length / (courtsToUse × 4)` が1.5を超え、かつプレイヤー数がコート定員のちょうど2倍でない（または全員の試合数が同じ）場合、以下のペナルティ乗数が0になる:
- 連続休憩ペナルティ
- 直近休憩重複ペナルティ

これにより、大人数時に不可避な連続休憩をペナルティ化しない。
