'use client';

import { useEffect, useRef, useState } from 'react';
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
  countRosterMembers,
  nameMergeConflicts,
  validateBackup,
  type ImportMode,
  type PairkujiBackup,
} from '@/lib/backup';
import { MERGE_SUMMARY, OVERWRITE_SUMMARY } from '@/lib/practiceLabels';
import { db } from '@/lib/db';
import { downloadJson, formatBackupStamp } from '@/lib/downloadJson';
import { loadSafetySnapshot } from '@/lib/safetyBackup';
import { useMemberStore } from '@/lib/stores/memberStore';
import { usePracticeStore } from '@/lib/stores/practiceStore';

type Step =
  | { kind: 'idle' }
  | { kind: 'invalid'; errors: string[] }
  | { kind: 'preview'; data: PairkujiBackup; fileName: string }
  | {
      kind: 'name-conflict';
      data: PairkujiBackup;
      fileName: string;
      local: string[];
      file: string[];
    }
  | {
      kind: 'confirm';
      data: PairkujiBackup;
      mode: ImportMode;
      fileName: string;
      intent: 'import' | 'restore';
    }
  | { kind: 'done'; message: string };

export function DataBackupDialog() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>({ kind: 'idle' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [safety, setSafety] = useState<PairkujiBackup | null>(null);
  const loadMembers = useMemberStore((state) => state.load);
  const loadAllMembers = useMemberStore((state) => state.loadAll);
  const loadPractice = usePracticeStore((state) => state.load);
  const loadSessions = usePracticeStore((state) => state.loadSessions);

  useEffect(() => {
    if (!open) return;
    void loadSafetySnapshot().then(setSafety);
  }, [open]);

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
      downloadJson(`pairkuji-backup-${formatBackupStamp()}.json`, backup);
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
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const beginMerge = async (data: PairkujiBackup, fileName: string) => {
    const existing = await db.members.toArray();
    const conflicts = nameMergeConflicts(existing, data.members);
    if (conflicts.local.length > 0 || conflicts.file.length > 0) {
      setStep({
        kind: 'name-conflict',
        data,
        fileName,
        local: conflicts.local,
        file: conflicts.file,
      });
      return;
    }
    setStep({
      kind: 'confirm',
      data,
      mode: 'merge',
      fileName,
      intent: 'import',
    });
  };

  const handleImport = async () => {
    if (step.kind !== 'confirm') return;
    setBusy(true);
    try {
      if (step.mode === 'replace') {
        const current = await collectBackup();
        downloadJson(
          `pairkuji-backup-before-replace-${formatBackupStamp()}.json`,
          current
        );
      }
      const summary = await applyBackup(step.data, step.mode);
      setSafety(await loadSafetySnapshot());
      await Promise.all([
        loadMembers(),
        loadAllMembers(),
        loadPractice(),
        loadSessions(),
      ]);
      const keepsCurrentPractice = step.mode === 'merge';
      const practiceNote = summary.practiceImported
        ? '進行中の練習も読み込みました。'
        : keepsCurrentPractice
          ? '進行中の練習がある場合は、そちらを残しています。'
          : '進行中の練習はありません。';
      const replaceNote =
        step.mode === 'replace'
          ? '上書きする前のデータをファイルに書き出し、この端末にも退避しました。'
          : '';
      setStep({
        kind: 'done',
        message: `選手${summary.addedMembers}名、履歴${summary.addedSessions}件を読み込みました。${practiceNote}${replaceNote}`,
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
          <span className="text-sm">データ</span>
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
                {step.fileName}：選手
                {countRosterMembers(step.data.members)}
                名、履歴
                {step.data.practiceSessions.length}件
                {step.data.practiceSettings ? '、進行中の練習あり' : ''}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Button
                    type="button"
                    variant="destructiveOutline"
                    className="w-full"
                    onClick={() =>
                      setStep({
                        kind: 'confirm',
                        data: step.data,
                        mode: 'replace',
                        fileName: step.fileName,
                        intent: 'import',
                      })
                    }
                  >
                    上書き
                  </Button>
                  <p className="text-xs text-muted-foreground">{OVERWRITE_SUMMARY}</p>
                </div>
                <div className="space-y-1">
                  <Button
                    type="button"
                    className="w-full"
                    onClick={() => void beginMerge(step.data, step.fileName)}
                  >
                    統合
                  </Button>
                  <p className="text-xs text-muted-foreground">{MERGE_SUMMARY}</p>
                </div>
              </div>
            </div>
          )}

          {step.kind === 'name-conflict' && (
            <div
              role="alert"
              className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 space-y-3"
            >
              {step.local.length > 0 && (
                <p>
                  この端末に同じ名前が2人以上います（{step.local.join('、')}
                  ）。この端末の名簿で、片方の名前を変えてから統合してください。
                </p>
              )}
              {step.file.length > 0 && (
                <p>
                  読み込むファイル（書き出した端末）に同じ名前が2人います（
                  {step.file.join('、')}
                  ）。この端末で改名しても直りません。書き出した端末で片方の名前を変えて、ファイルを作り直してください。
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() =>
                    setStep({
                      kind: 'preview',
                      data: step.data,
                      fileName: step.fileName,
                    })
                  }
                >
                  戻る
                </Button>
              </div>
            </div>
          )}

          {step.kind === 'confirm' && (
            <div className="rounded-lg border border-border p-3 text-sm space-y-3">
              <p>
                {step.intent === 'restore'
                  ? '上書きする直前に退避した内容へ戻します。今の名簿・履歴・練習は、戻す前にファイルへ書き出します。'
                  : step.mode === 'replace'
                    ? `${OVERWRITE_SUMMARY}実行前に、今のデータを自動で書き出します。`
                    : `${MERGE_SUMMARY}進行中の練習がすでにある場合は、ファイル側の練習では上書きしません。`}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() =>
                    step.intent === 'restore'
                      ? setStep({ kind: 'idle' })
                      : setStep({
                          kind: 'preview',
                          data: step.data,
                          fileName: step.fileName,
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

          {safety && step.kind === 'idle' && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={busy}
              onClick={() =>
                setStep({
                  kind: 'confirm',
                  data: safety,
                  mode: 'replace',
                  fileName: '前回の上書き前の退避',
                  intent: 'restore',
                })
              }
            >
              前回の上書き前に戻す
            </Button>
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
