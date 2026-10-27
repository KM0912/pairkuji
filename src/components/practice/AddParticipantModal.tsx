import { useState } from 'react';
import { type Member } from '@/types/member';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface AddParticipantModalProps {
  isOpen: boolean;
  availableMembers: Member[];
  onAddParticipants: (memberIds: number[]) => Promise<void>;
  onCreateMember: (name: string) => Promise<number | null>;
  onClose: () => void;
}

export function AddParticipantModal({
  isOpen,
  availableMembers,
  onAddParticipants,
  onCreateMember,
  onClose,
}: AddParticipantModalProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const toggle = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAdd = async () => {
    if (selectedIds.length === 0) return;
    await onAddParticipants(selectedIds);
    setSelectedIds([]);
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name || adding) return;
    setAdding(true);
    setCreateError(null);
    const id = await onCreateMember(name);
    setAdding(false);
    if (id == null) {
      setCreateError('同じ名前の選手がすでにいます');
      return;
    }
    setNewName('');
    setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl border-2 border-border/50 p-6">
        <DialogTitle className="text-lg font-semibold mb-2">参加者を追加</DialogTitle>
        <DialogDescription className="sr-only">練習に参加する選手を選択してください</DialogDescription>
          <form
            className="mb-3 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void handleCreate();
            }}
          >
            <Input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="名前を追加"
              aria-label="名前を追加"
            />
            <Button type="submit" variant="outline" disabled={adding || !newName.trim()}>
              追加
            </Button>
          </form>
          {createError && (
            <p className="mb-3 text-sm text-destructive" role="alert">
              {createError}
            </p>
          )}
          {availableMembers.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              追加できる選手がいません。上の欄から名前を追加できます。
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-auto">
              {availableMembers.map((m) => {
                const id = m.id!;
                const checked = selectedIds.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggle(id)}
                    aria-pressed={checked}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all duration-fast ${
                      checked
                        ? 'bg-primary/10 border-primary/30 shadow-level-1'
                        : 'bg-card border-border hover:bg-muted'
                    }`}
                    title={m.name}
                  >
                    <span className="flex-1 text-left font-medium text-foreground truncate">
                      {m.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          <div className="flex items-center justify-between text-sm text-muted-foreground mt-3">
            <div>選択中: {selectedIds.length} 名</div>
            {availableMembers.length > 0 && (
              <button
                className="underline hover:text-foreground"
                onClick={() =>
                  setSelectedIds(
                    selectedIds.length === availableMembers.length
                      ? []
                      : availableMembers.map((m) => m.id!)
                  )
                }
              >
                {selectedIds.length === availableMembers.length
                  ? '全て解除'
                  : '全て選択'}
              </button>
            )}
          </div>
          <div className="mt-4">
            <p className="text-small text-muted-foreground mb-4">
              途中参加した人は、いま出場できる人のなかで一番試合数が少ない人と同じ試合数からスタートします。次の組み合わせで極端に多く入らないようにするためです。
            </p>
          </div>
          <div className="flex gap-3 pt-4 mt-4 border-t">
            <Button onClick={onClose} className="flex-1" variant="secondary">
              キャンセル
            </Button>
            <Button
              onClick={handleAdd}
              disabled={selectedIds.length === 0}
              className="flex-1"
              variant="default"
            >
              {selectedIds.length > 0
                ? `追加する (${selectedIds.length})`
                : '追加する'}
            </Button>
          </div>
      </DialogContent>
    </Dialog>
  );
}
