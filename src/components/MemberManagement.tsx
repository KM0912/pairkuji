'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, Button, Input, Badge, ConfirmModal } from './ui';
import { useMemberStore } from '../lib/stores/memberStore';
import type { Member } from '../types';

export const MemberManagement: React.FC = () => {
  const { 
    members, 
    loadAllMembers, 
    createMember, 
    updateMember, 
    deleteMember, 
    isLoading, 
    error 
  } = useMemberStore();
  
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; member: Member | null }>({
    isOpen: false,
    member: null,
  });
  const [formData, setFormData] = useState({
    name: '',
    tags: [] as string[],
    isActive: true,
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    loadAllMembers();
  }, [loadAllMembers]);

  useEffect(() => {
    if (editingMember) {
      setFormData({
        name: editingMember.name,
        tags: editingMember.tags || [],
        isActive: editingMember.isActive,
      });
    }
  }, [editingMember]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) return;

    try {
      if (editingMember) {
        await updateMember(editingMember.id, {
          name: formData.name.trim(),
          tags: formData.tags.length > 0 ? formData.tags : undefined,
          isActive: formData.isActive,
        });
        setEditingMember(null);
      } else {
        await createMember({
          name: formData.name.trim(),
          tags: formData.tags.length > 0 ? formData.tags : undefined,
          isActive: formData.isActive,
        });
        setIsAddingMember(false);
      }
      
      setFormData({ name: '', tags: [], isActive: true });
      setTagInput('');
    } catch (error) {
      console.error('Failed to save member:', error);
    }
  };

  const handleCancel = () => {
    setIsAddingMember(false);
    setEditingMember(null);
    setFormData({ name: '', tags: [], isActive: true });
    setTagInput('');
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleDeleteClick = (member: Member) => {
    setDeleteModal({ isOpen: true, member });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.member) return;

    try {
      await deleteMember(deleteModal.member.id);
      setDeleteModal({ isOpen: false, member: null });
    } catch (error) {
      console.error('Failed to delete member:', error);
    }
  };

  const activeMembers = members.filter(m => m.isActive);
  const inactiveMembers = members.filter(m => !m.isActive);

  if (isLoading && members.length === 0) {
    return (
      <Card>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">選手管理</h2>
        <Button
          onClick={() => setIsAddingMember(true)}
          disabled={isAddingMember || editingMember !== null}
        >
          選手を追加
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Add/Edit Form */}
      {(isAddingMember || editingMember) && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">
              {editingMember ? '選手情報編集' : '新規選手追加'}
            </h3>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="選手名"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="選手名を入力"
                required
                fullWidth
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  タグ（任意）
                </label>
                <div className="flex space-x-2 mb-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="例：上級、左利き"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddTag}
                    disabled={!tagInput.trim()}
                  >
                    追加
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
                      >
                        {tag} ×
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                  アクティブ（参加可能）
                </label>
              </div>

              <div className="flex space-x-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                >
                  キャンセル
                </Button>
                <Button type="submit" loading={isLoading}>
                  {editingMember ? '更新' : '追加'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Active Members */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">
            アクティブな選手 ({activeMembers.length}名)
          </h3>
        </CardHeader>
        <CardContent>
          {activeMembers.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              アクティブな選手がいません
            </p>
          ) : (
            <div className="space-y-3">
              {activeMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-semibold text-gray-900">{member.name}</h4>
                      {member.tags && member.tags.length > 0 && (
                        <div className="flex space-x-1">
                          {member.tags.map((tag) => (
                            <Badge key={tag} variant="default" size="sm">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      登録日: {new Date(member.createdAt).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingMember(member)}
                      disabled={isAddingMember || editingMember !== null}
                    >
                      編集
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteClick(member)}
                      disabled={isAddingMember || editingMember !== null}
                    >
                      削除
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inactive Members */}
      {inactiveMembers.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">
              非アクティブな選手 ({inactiveMembers.length}名)
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inactiveMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-semibold text-gray-600">{member.name}</h4>
                      <Badge variant="warning" size="sm">非アクティブ</Badge>
                      {member.tags && member.tags.length > 0 && (
                        <div className="flex space-x-1">
                          {member.tags.map((tag) => (
                            <Badge key={tag} variant="default" size="sm">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      登録日: {new Date(member.createdAt).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingMember(member)}
                      disabled={isAddingMember || editingMember !== null}
                    >
                      編集
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteClick(member)}
                      disabled={isAddingMember || editingMember !== null}
                    >
                      削除
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, member: null })}
        onConfirm={handleDeleteConfirm}
        title="選手削除"
        message={`「${deleteModal.member?.name}」を削除しますか？この操作は取り消せません。`}
        confirmText="削除"
        cancelText="キャンセル"
        variant="danger"
        loading={isLoading}
      />
    </div>
  );
};