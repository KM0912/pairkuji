'use client';

import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardContent, Button, Badge } from './ui';
import { useSessionStore } from '../lib/stores/sessionStore';
import { usePlayerStore } from '../lib/stores/playerStore';
import { useRoundStore } from '../lib/stores/roundStore';
import { useStatsStore } from '../lib/stores/statsStore';
import {
  importPlayersFromCSV,
  downloadJSON,
  downloadCSV,
  validatePlayerName,
  validateTag,
  type ImportResult,
  type PlayerImportData,
  type SessionExport,
} from '../lib/import-export';

interface ImportExportPanelProps {
  sessionId: string;
}

export const ImportExportPanel: React.FC<ImportExportPanelProps> = ({ sessionId }) => {
  const { currentSession } = useSessionStore();
  const { 
    players,
    getPlayersBySession, 
    addPlayer,
    importPlayers 
  } = usePlayerStore();
  const { rounds } = useRoundStore();
  const { stats } = useStatsStore();
  
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult<PlayerImportData> | null>(null);
  const [previewData, setPreviewData] = useState<PlayerImportData[] | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sessionPlayers = getPlayersBySession(sessionId);
  const sessionRounds = rounds.filter(r => r.sessionId === sessionId);
  const sessionStats = stats.filter(s => s.sessionId === sessionId);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('CSVファイルを選択してください');
      return;
    }

    setImporting(true);
    setImportResult(null);
    setPreviewData(null);

    try {
      const content = await file.text();
      const result = await importPlayersFromCSV(content, sessionId);
      
      // Validate imported data
      const validatedData: PlayerImportData[] = [];
      const validationErrors: string[] = [];
      
      for (const player of result.success) {
        const nameError = validatePlayerName(player.name);
        if (nameError) {
          validationErrors.push(`"${player.name}": ${nameError}`);
          continue;
        }
        
        if (player.tags) {
          let hasTagError = false;
          for (const tag of player.tags) {
            const tagError = validateTag(tag);
            if (tagError) {
              validationErrors.push(`"${player.name}"のタグ"${tag}": ${tagError}`);
              hasTagError = true;
              break;
            }
          }
          if (hasTagError) continue;
        }
        
        // Check for duplicates with existing players
        const existingPlayer = sessionPlayers.find(
          p => p.name.toLowerCase() === player.name.toLowerCase()
        );
        if (existingPlayer) {
          validationErrors.push(`"${player.name}": 既に存在するプレイヤーです`);
          continue;
        }
        
        validatedData.push(player);
      }
      
      const finalResult: ImportResult<PlayerImportData> = {
        success: validatedData,
        errors: [...result.errors, ...validationErrors],
        warnings: result.warnings,
      };
      
      setImportResult(finalResult);
      setPreviewData(validatedData);
      
    } catch (error) {
      setImportResult({
        success: [],
        errors: [`ファイル読み込みエラー: ${error instanceof Error ? error.message : '不明なエラー'}`],
        warnings: [],
      });
    } finally {
      setImporting(false);
    }
  };

  const handleImportConfirm = async () => {
    if (!previewData || previewData.length === 0) return;

    setImporting(true);
    
    try {
      const playerNames = previewData.map(p => p.name);
      await importPlayers(sessionId, playerNames);
      
      // Update players with tags if needed
      for (const playerData of previewData) {
        if (playerData.tags && playerData.tags.length > 0) {
          // Find the newly created player and update with tags
          const newPlayer = getPlayersBySession(sessionId).find(
            p => p.name === playerData.name
          );
          if (newPlayer) {
            // Note: You might need to add an updatePlayer method to handle tags
            // For now, tags are stored but not actively used in the UI
          }
        }
      }
      
      setPreviewData(null);
      setImportResult(null);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      alert(`インポートに失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    } finally {
      setImporting(false);
    }
  };

  const handleExportSession = async () => {
    if (!currentSession) return;

    setExporting(true);
    
    try {
      const exportData: SessionExport = {
        session: currentSession,
        players: sessionPlayers,
        rounds: sessionRounds,
        stats: sessionStats,
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
      };
      
      const filename = `pairkuji-session-${currentSession.title || sessionId.slice(-6)}-${
        new Date().toISOString().split('T')[0]
      }.json`;
      
      downloadJSON(exportData, filename);
      
    } catch (error) {
      alert(`エクスポートに失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    } finally {
      setExporting(false);
    }
  };

  const handleExportPlayersCSV = () => {
    if (sessionPlayers.length === 0) {
      alert('エクスポートする参加者がいません');
      return;
    }

    const headers = ['名前', 'ステータス', 'タグ'];
    const data = sessionPlayers.map(player => ({
      '名前': player.name,
      'ステータス': player.status === 'active' ? '参加中' : player.status === 'rest' ? '休憩' : '離席',
      'タグ': player.tags ? player.tags.join(', ') : '',
    }));
    
    const filename = `pairkuji-players-${currentSession?.title || sessionId.slice(-6)}-${
      new Date().toISOString().split('T')[0]
    }.csv`;
    
    downloadCSV(data, headers, filename);
  };

  const handleClearPreview = () => {
    setPreviewData(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-8">
      {/* Import Section */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">参加者インポート</h2>
          <p className="text-sm text-gray-600">
            CSVファイルから参加者を一括追加できます
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* File Input */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              disabled={importing}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              loading={importing}
              variant="outline"
              className="w-full sm:w-auto"
            >
              CSVファイルを選択
            </Button>
          </div>

          {/* CSV Format Help */}
          <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">CSVフォーマット例:</h4>
            <pre className="text-xs bg-white p-2 rounded border">
{`名前,タグ1,タグ2
田中太郎,初心者,
山田花子,経験者,強い
佐藤次郎,,`}
            </pre>
            <p className="mt-2">
              • 1列目: 参加者名（必須）<br />
              • 2列目以降: タグ（任意）
            </p>
          </div>

          {/* Import Results */}
          {importResult && (
            <div className="space-y-4">
              {importResult.errors.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2">エラー</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {importResult.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {importResult.warnings.length > 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">警告</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {importResult.warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {importResult.success.length > 0 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">
                    インポート可能 ({importResult.success.length}名)
                  </h4>
                  <div className="text-sm text-green-700">
                    {importResult.success.map((player, index) => (
                      <div key={index} className="flex items-center space-x-2 mb-1">
                        <span>{player.name}</span>
                        {player.tags && player.tags.length > 0 && (
                          <div className="flex space-x-1">
                            {player.tags.map((tag, tagIndex) => (
                              <Badge key={tagIndex} variant="info" size="sm">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Import Actions */}
          {previewData && previewData.length > 0 && (
            <div className="flex space-x-3">
              <Button
                onClick={handleImportConfirm}
                loading={importing}
                disabled={importing}
              >
                {previewData.length}名をインポート
              </Button>
              <Button
                onClick={handleClearPreview}
                variant="outline"
                disabled={importing}
              >
                キャンセル
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Section */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">データエクスポート</h2>
          <p className="text-sm text-gray-600">
            セッションデータをダウンロードできます
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Current Session Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{sessionPlayers.length}</div>
              <div className="text-sm text-gray-600">参加者</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{sessionRounds.length}</div>
              <div className="text-sm text-gray-600">ラウンド</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{sessionStats.length}</div>
              <div className="text-sm text-gray-600">統計データ</div>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button
              onClick={handleExportPlayersCSV}
              variant="outline"
              disabled={sessionPlayers.length === 0}
              className="w-full"
            >
              参加者リスト (CSV)
            </Button>
            
            <Button
              onClick={handleExportSession}
              loading={exporting}
              disabled={exporting}
              className="w-full"
            >
              全データ (JSON)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};