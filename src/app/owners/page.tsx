'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

interface Owner {
  id: number;
  name: string;
  email: string | null;
  videos: number;
  status: 'active' | 'inactive';
}

export default function OwnersPage() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newOwner, setNewOwner] = useState({ name: '', email: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 加载负责人数据
  useEffect(() => {
    loadOwners();
  }, []);

  const loadOwners = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/owners');
      if (!response.ok) {
        throw new Error('加载失败');
      }
      const data = await response.json();
      setOwners(data.owners || []);
    } catch (error) {
      console.error('加载负责人失败:', error);
      toast.error('加载失败', {
        description: '无法加载负责人列表',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOwner.name.trim()) {
      toast.error('输入错误', {
        description: '姓名不能为空',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/owners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOwner),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '添加失败');
      }

      const data = await response.json();
      toast.success('添加成功', {
        description: data.message || '负责人添加成功',
      });

      setNewOwner({ name: '', email: '' });
      setIsAddDialogOpen(false);
      loadOwners();
    } catch (error) {
      console.error('添加负责人失败:', error);
      toast.error('添加失败', {
        description: error instanceof Error ? error.message : '未知错误',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOwner = async (id: number) => {
    try {
      const response = await fetch(`/api/owners/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('删除失败');
      }

      toast.success('删除成功', {
        description: '负责人删除成功',
      });
      loadOwners();
    } catch (error) {
      console.error('删除负责人失败:', error);
      toast.error('删除失败', {
        description: '无法删除该负责人',
      });
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1D1D1F]">负责人管理</h1>
          <p className="text-sm text-[#86868B] mt-1">管理视频负责人信息</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#007AFF] hover:bg-[#0066CC]">
              添加负责人
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加新负责人</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddOwner} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">姓名</Label>
                <Input
                  id="name"
                  placeholder="输入负责人姓名"
                  value={newOwner.name}
                  onChange={(e) => setNewOwner({ ...newOwner, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="输入邮箱地址"
                  value={newOwner.email}
                  onChange={(e) => setNewOwner({ ...newOwner, email: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  className="bg-[#007AFF] hover:bg-[#0066CC]"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '添加中...' : '添加'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  取消
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-6 bg-white shadow-sm border-[rgba(0,0,0,0.08)]">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-[#86868B]">加载中...</div>
          </div>
        ) : owners.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="text-[#86868B]">暂无负责人数据</div>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-[#007AFF] hover:bg-[#0066CC]"
            >
              添加第一个负责人
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[#86868B]">姓名</TableHead>
                <TableHead className="text-[#86868B]">邮箱</TableHead>
                <TableHead className="text-[#86868B]">视频数量</TableHead>
                <TableHead className="text-[#86868B]">状态</TableHead>
                <TableHead className="text-[#86868B]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {owners.map((owner) => (
                <TableRow key={owner.id}>
                  <TableCell className="font-medium">{owner.name}</TableCell>
                  <TableCell>{owner.email || '-'}</TableCell>
                  <TableCell>{owner.videos}</TableCell>
                  <TableCell>
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: owner.status === 'active' ? 'rgba(52, 211, 153, 0.1)' : 'rgba(156, 163, 175, 0.1)',
                        color: owner.status === 'active' ? 'rgb(22, 163, 74)' : 'rgb(75, 85, 99)',
                      }}
                    >
                      {owner.status === 'active' ? '活跃' : '停用'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteOwner(owner.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      删除
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
