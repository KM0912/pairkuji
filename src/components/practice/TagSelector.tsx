'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Tag, X, Plus } from 'lucide-react';
import { usePracticeStore } from '@/lib/stores/practiceStore';
import { getUniqueTags } from '@/lib/statsCalculator';
import { IconBadge } from '@/components/ui/IconBadge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface TagSelectorProps {
  value: string[];
  onChange: (tags: string[]) => void;
}

export function TagSelector({ value, onChange }: TagSelectorProps) {
  const { sessions, loadSessions } = usePracticeStore();
  const [inputValue, setInputValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pastTags = useMemo(() => getUniqueTags(sessions), [sessions]);

  // Past tags not yet selected
  const availablePastTags = useMemo(
    () => pastTags.filter((t) => !value.includes(t)),
    [pastTags, value]
  );

  // Filtered suggestions while typing
  const suggestions = useMemo(() => {
    if (!inputValue.trim()) return availablePastTags;
    const term = inputValue.trim().toLowerCase();
    return availablePastTags.filter((tag) => tag.toLowerCase().includes(term));
  }, [availablePastTags, inputValue]);

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || value.includes(trimmed)) return;
    onChange([...value, trimmed]);
    setInputValue('');
    setIsAdding(false);
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Escape') {
      setInputValue('');
      setIsAdding(false);
    }
  };

  const startAdding = () => {
    setIsAdding(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex items-center gap-2">
            <IconBadge icon={Tag} className="text-primary" />
            <h3 className="text-base font-semibold text-foreground">
              タグ
            </h3>
            <span className="text-xs text-muted-foreground font-normal">
              任意
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Selected tags */}
        {value.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {value.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-1 text-xs font-medium"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                  aria-label={`${tag}を削除`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Past tag suggestions (unselected ones) */}
        {!isAdding && availablePastTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {availablePastTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => addTag(tag)}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 text-muted-foreground px-2.5 py-1 text-xs font-medium hover:bg-muted hover:text-foreground transition-colors"
              >
                <Plus className="w-3 h-3" />
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Add new tag */}
        {isAdding ? (
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                if (inputValue.trim()) {
                  addTag(inputValue);
                } else {
                  setIsAdding(false);
                }
              }}
              placeholder="タグ名を入力してEnter"
              className="w-full border rounded-lg px-3 py-2 bg-card border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[40px]"
              aria-label="新しいタグ"
            />
            {suggestions.length > 0 && inputValue.trim() && (
              <ul className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-level-2 max-h-32 overflow-y-auto">
                {suggestions.map((tag) => (
                  <li key={tag}>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => addTag(tag)}
                    >
                      {tag}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={startAdding}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            <Plus className="w-3.5 h-3.5" />
            新しいタグを追加
          </button>
        )}
      </CardContent>
    </Card>
  );
}
