'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function OwnersPage() {
  const [owners, setOwners] = useState([
    { id: 1, name: '张三', email: 'zhangsan@example.com', videos: 12, status: 'active' },
    { id: 2, name: '李四', email: 'lisi@example.com', videos: 8, status: 'active' },
    { id: 3, name: '王五', email: 'wangwu@example.com', videos: 15, status: 'active' },
  ]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newOwner, setNewOwner] = useState({ name: '', email: '' });

  const handleAddOwner = (e: React.FormEvent) => {
    e.preventDefault();
    const owner = {
      id: owners.length + 1,
      ...newOwner,
      videos: 0,
      status: 'active',
    };
    setOwners([...owners, owner]);
    setNewOwner({ name: '', email: '' });
    setIsAddDialogOpen(false);
  };

  const handleDeleteOwner = (id: number) => {
    setOwners(owners.filter(owner => owner.id !== id));
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
            <Button className="bg-[#007AFF] hover:bg-[#0066CC]">添加负责人</Button>
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
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="bg-[#007AFF] hover:bg-[#0066CC]">
                  添加
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  取消
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-6 bg-white shadow-sm border-[rgba(0,0,0,0.08)]">
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
                <TableCell>{owner.email}</TableCell>
                <TableCell>{owner.videos}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
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
      </Card>
    </div>
  );
}
