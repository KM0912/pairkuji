'use client';

import { useRef, useState } from 'react';
import { Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  applyBackup,
  collectBackup,
  validateBackup,
  type ImportMode,
  type PairkujiBackup,
} from '@/lib/backup';
import { useMemberStore } from '@/lib/stores/memberStore';
import { usePracticeStore } from '@/lib/stores/practiceStore';

type Step =
  | { kind: 'idle' }
  | { kind: 'invalid'; errors: string[] }
  | { kind: 'preview'; data: PairkujiBackup; fileName: string }
  | { kind: 'confirm'; data: PairkujiBackup; mode: ImportMode }
  | { kind: 'done'; message: string };

export function DataBackupDialog() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>({ kind: 'idle' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const loadMembers = useMemberStore((state) => state.load);
  const loadAllMembers = useMemberStore((state) => state.loadAll);
  const loadPractice = usePracticeStore((state) => state.load);
  const loadSessions = usePracticeStore((state) => state.loadSessions);

  const reset = () => {
    setStep({ kind: 'idle' });
    setMessage(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) reset();
  };

  const handleExport = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const backup = await collectBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const date = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `pairkuji-backup-${date}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setMessage('バックアップを書き出しました');
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : '書き出せませんでした');
    } finally {
      setBusy(false);
    }
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setMessage(null);
    try {
      if (file.size > 20_000_000) {
        setStep({ kind: 'invalid', errors: ['ファイルが大きすぎます'] });
        return;
      }
      const parsed: unknown = JSON.parse(await file.text());
      const result = validateBackup(parsed);
      if (!result.ok) {
        setStep({ kind: 'invalid', errors: result.errors });
        return;
      }
      setStep({ kind: 'preview', data: result.data, fileName: file.name });
    } catch {
      setStep({ kind: 'invalid', errors: ['JSONとして読めませんでした'] });
    }
  };

  const handleImport = async () => {
    if (step.kind !== 'confirm') return;
    setBusy(true);
    try {
      const summary = await applyBackup(step.data, step.mode);
      await Promise.all([
        loadMembers(),
        loadAllMembers(),
        loadPractice(),
        loadSessions(),
      ]);
      const practiceNote = summary.practiceImported
        ? '進行中の練習も読み込みました。'
        : step.mode === 'merge'
          ? '進行中の練習がある場合は、そちらを残しています。'
          : '進行中の練習はありません。';
      setStep({
        kind: 'done',
        message: `選手${summary.addedMembers}名、履歴${summary.addedSessions}件を読み込みました。${practiceNote}`,
      });
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : '読み込めませんでした');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" aria-label="データの書き出しと読み込み">
          <Database className="w-4 h-4" />
          <span className="text-sm hidden sm:inline">データ</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-2xl border-2 border-border/50 p-6">
        <DialogTitle className="text-lg font-semibold">データの引き継ぎ</DialogTitle>
        <DialogDescription>
          名簿・履歴・練習の設定をJSONで書き出し、別の端末で読み込めます。
        </DialogDescription>

        <div className="mt-4 space-y-3">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => void handleExport()}
            disabled={busy}
          >
            JSONを書き出す
          </Button>

          <div>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                void handleFile(file);
              }}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
            >
              JSONを読み込む
            </Button>
          </div>

          {step.kind === 'invalid' && (
            <div role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <p className="font-semibold mb-1">このファイルは読み込めません</p>
              <ul className="list-disc pl-4 space-y-1">
                {step.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {step.kind === 'preview' && (
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm space-y-3">
              <p>
                {step.fileName}：選手{step.data.members.length}名、履歴
                {step.data.practiceSessions.length}件
                {step.data.practiceSettings ? '、進行中の練習あり' : ''}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="destructiveOutline"
                  className="flex-1"
                  onClick={() =>
                    setStep({ kind: 'confirm', data: step.data, mode: 'replace' })
                  }
                >
                  上書き
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={() =>
                    setStep({ kind: 'confirm', data: step.data, mode: 'merge' })
                  }
                >
                  統合
                </Button>
              </div>
            </div>
          )}

          {step.kind === 'confirm' && (
            <div className="rounded-lg border border-border p-3 text-sm space-y-3">
              <p>
                {step.mode === 'replace'
                  ? 'この端末の名簿・履歴・進行中の練習を、ファイルの内容に置き換えます。'
                  : '同じ名前の選手は今の名簿を使い、新しい選手と履歴を足します。進行中の練習がすでにある場合は、ファイル側の練習では置き換えません。'}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() =>
                    setStep({
                      kind: 'preview',
                      data: step.data,
                      fileName: '選択したファイル',
                    })
                  }
                  disabled={busy}
                >
                  戻る
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  variant={step.mode === 'replace' ? 'destructive' : 'default'}
                  onClick={() => void handleImport()}
                  disabled={busy}
                >
                  {busy ? '読み込み中...' : '実行する'}
                </Button>
              </div>
            </div>
          )}

          {step.kind === 'done' && (
            <p className="rounded-lg bg-primary/10 p-3 text-sm text-foreground">
              {step.message}
            </p>
          )}

          {message && (
            <p role="status" className="text-sm text-muted-foreground">
              {message}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
