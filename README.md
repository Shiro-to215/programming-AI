# 🤖 Programming AI - 競プロ構文アシスタント

Python・C++の構文を高速に質問できるAIアシスタント。Gemini 3.5 Flashを使用した軽量でレスポンシブなWebアプリです。

## ✨ 機能

- **快速応答**: Gemini 3.5 Flashで超高速な構文提案
- **構文保存**: よく使う構文をローカルに保存
- **構文検索**: 保存した構文から素早く検索
- **オフライン対応**: IndexedDB/LocalStorageで完全オフライン機能
- **モバイル対応**: スマホでもPC同様に使用可能
- **複数言語対応**: Python対応、将来的にC++対応予定

## 🚀 クイックスタート

### 前準備

1. **Gemini APIキーを取得**
   - https://ai.google.dev/ にアクセス
   - 「API keys」から「Create API key」をクリック
   - キーをコピー

2. **リポジトリをクローン**
   ```bash
   git clone https://github.com/Shiro-to215/programming-AI.git
   cd programming-AI
   ```

3. **.env ファイルを作成**
   ```bash
   cp .env.example .env
   ```
   `.env` ファイルを編集して、取得したGemini APIキーを設定：
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

### ローカル実行

#### バックエンド (FastAPI)

```bash
# 依存関係をインストール
pip install -r backend/requirements.txt

# FastAPI サーバーを起動
cd backend
python -m uvicorn api.index:app --reload

# http://localhost:8000 でアクセス可能
```

#### フロントエンド

ブラウザで `frontend/index.html` を開くか、簡単なHTTPサーバーで提供：

```bash
cd frontend
python -m http.server 3000
```

ブラウザで http://localhost:3000 にアクセス

### Vercelへのデプロイ

#### 1. Vercelアカウント作成
https://vercel.com にアクセスしてアカウントを作成

#### 2. プロジェクトをインポート
- Vercelダッシュボードで「Add New」→「Project」
- GitHubリポジトリを選択

#### 3. 環境変数を設定
プロジェクト設定の「Environment Variables」で：
- キー: `GEMINI_API_KEY`
- 値: 取得したAPIキー

#### 4. デプロイ
自動でデプロイが開始されます。完了後、Vercelが提供するURLでアクセス可能

## 📁 プロジェクト構成

```
programming-AI/
├── backend/
│   ├── api/
│   │   └── index.py          # FastAPI メインアプリケーション
│   ├── gemini_client.py      # Gemini API クライアント
│   ├── database.py           # SQLite データベース管理
│   └── requirements.txt      # Python依存関係
├── frontend/
│   ├── index.html            # HTMLテンプレート
│   ├── style.css             # UIスタイル（ダークテーマ）
│   ├── script.js             # メインロジック
│   └── db.js                 # IndexedDB管理
├── vercel.json               # Vercelデプロイ設定
├── .env.example              # 環境変数テンプレート
└── README.md                 # このファイル
```

## 🛠️ 技術スタック

### バックエンド
- **FastAPI**: 高速Pythonフレームワーク
- **Google Gemini 3.5 Flash**: 最新LLM
- **SQLite**: 構文データベース

### フロントエンド
- **HTML5 / CSS3 / JavaScript**: 純粋なバニラJS
- **IndexedDB**: オフラインローカルストレージ
- **Responsive Design**: モバイル対応

## 📝 使い方

### 1. 構文を聞く
1. 「構文を聞く」タブを選択
2. 言語を選択（Python / C++）
3. 質問を入力（例：「二分探索のやり方」）
4. 「✨ 構文を聞く」をクリック

### 2. 構文を保存
1. AIの回答が表示されたら「💾 保存」をクリック
2. タイトル、コード、説明、タグを入力
3. 「保存」をクリック

### 3. 構文を検索
1. 「保存済み構文」タブを選択
2. 検索ボックスにキーワードを入力
3. 保存済み構文から該当するものが表示される

## 🔄 API エンドポイント

| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| POST | `/api/ask` | AI に構文を質問（ストリーミング） |
| POST | `/api/save-syntax` | 構文を保存 |
| GET | `/api/syntaxes` | 保存済み構文を取得 |
| GET | `/api/search?q=keyword` | 構文を検索 |
| GET | `/api/syntax/:id` | 特定の構文を取得 |
| PUT | `/api/syntax/:id` | 構文を更新 |
| DELETE | `/api/syntax/:id` | 構文を削除 |

## 🌍 環境変数

| 変数名 | 説明 | 必須 |
|--------|------|------|
| `GEMINI_API_KEY` | Google Gemini API キー | ✅ |
| `API_BASE` | API ベースURL（開発用） | ❌ |

## 🚀 将来の拡張予定

- [ ] C++ 言語対応
- [ ] Java / JavaScript 言語対応
- [ ] クラウド同期機能（ログイン機能）
- [ ] 複数の言語間でのコード変換
- [ ] 実行環境統合（コード実行）
- [ ] UIテーマカスタマイズ
- [ ] PWA対応（オフラインWebアプリ）

## 📝 ライセンス

MIT License - 詳細は LICENSE ファイルを参照

## 🙋 フィードバック・バグ報告

Issues や Pull Requests を歓迎します！

---

**作成者**: Shiro-to215  
**最終更新**: 2026年6月
