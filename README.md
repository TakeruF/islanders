# Islanders

Capacitor + Next.js (App Router) で組んだ Android 向け **Live Update / 流体云** ダッシュボード。

4 モジュール（ユーザー単位で ON/OFF 可）:

| Module     | Native source                                  | Live Update style                |
|------------|------------------------------------------------|----------------------------------|
| Charging   | `BatteryManager` + `ACTION_BATTERY_CHANGED`    | `ProgressStyle` + 状態チップ      |
| Thermal    | `PowerManager.getCurrentThermalStatus` + sysfs | `ProgressStyle` + 警告色チップ    |
| Calculator | JS 入力をネイティブへ push                      | `BigTextStyle` + 結果チップ       |
| Currency   | open.er-api.com fetcher                         | 標準 + レート/変化率チップ         |

## ColorOS 流体云について

公式 SDK は無いため、本実装は **Android 公式 Live Update API**
([android.com/develop/ui/compose/notifications/live-update](https://developer.android.com/develop/ui/compose/notifications/live-update))
で近似する方針を取っています。Android 16+ ROM では `setRequestPromotedOngoing` /
`setShortCriticalText` を呼ぶことで ColorOS 側が自動的に流体云カプセルへ昇格させます
（promote 可否は ROM 側の判断）。

重要な公式制約（コード上で守っている点）:

- `setCustomContentView` (RemoteViews) は Live Update では **使用禁止** → 採用していません。
- `setColorized(true)` は **不可** → 使っていません。
- 通知チャネルは `IMPORTANCE_MIN` 以上必須 → `IMPORTANCE_HIGH` で作成。
- ステータスチップ幅は 96 dp 制限。`setShortCriticalText` には最大 7 文字を目安に文字列を入れています。

## セットアップ

```bash
pnpm install
pnpm exec cap add android       # 初回のみ。既存 android/ にマージされる
pnpm sync:android               # next build → next export → cap sync
pnpm open:android               # Android Studio で開く
```

Android Studio で実行 → ColorOS 機なら自動的に流体云カプセルに表示されます。
それ以外の Android 16+ 機種はステータスバーチップとして表示。Android 16 未満は
通常の persistent notification として表示されます（チップ昇格はスキップ）。

## ディレクトリ

```
app/                  Next.js (App Router) — UI
src/services          Zustand store + モジュール毎ロジック
src/plugins/islander-bridge   Capacitor プラグイン定義 (TS)
src/lib               純粋ロジック (充電プロトコル判定など)
android/app/src/main/java/com/islanders/app/
  ├ island/           Battery/Thermal/Poster/Service/Channels
  └ plugin/           Capacitor Plugin (IslanderBridgePlugin.kt)
```

## バッテリー消費

- `charging` は 1500ms 既定。`enableModule({ pollMs: 3000 })` で延ばせます。
- `thermal` は 4000ms 既定。sysfs アクセスはキャッシュしたゾーン一覧で 1 ファイル/poll。
- `currency` は 60 秒。レスポンスを `localStorage` に 5 分キャッシュ。
- `calculator` はイベント駆動（poll 無し）。

## 注意

- Android 16 (API 36) 未満では `setRequestPromotedOngoing` / `setShortCriticalText` /
  `Notification.ProgressStyle` は呼ばれず、通常の通知にフォールバックします。
- ColorOS 内部の `oplus.app.*` API はホワイトリスト署名検証で弾かれるため使用していません。
- 急速充電プロトコル判定は瞬時電力ベースのヒューリスティック。プロトコル negotiation は
  公開 API では取得不可です。
