'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function GroupsPage() {
  const [groups, setGroups] = useState([
    { id: 1, name: '科技评测', description: '科技产品评测视频', videos: 25 },
    { id: 2, name: '生活记录', description: '日常生活Vlog', videos: 18 },
    { id: 3, name: '教程系列', description: '各类教程视频', videos: 32 },
  ]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });

  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    const group = {
      id: groups.length + 1,
      ...newGroup,
      videos: 0,
    };
    setGroups([...groups, group]);
    setNewGroup({ name: '', description: '' });
    setIsAddDialogOpen(false);
  };

  const handleDeleteGroup = (id: number) => {
    setGroups(groups.filter(group => group.id !== id));
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1D1D1F]">分组管理</h1>
          <p className="text-sm text-[#86868B] mt-1">管理视频分组信息</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#007AFF] hover:bg-[#0066CC]">添加分组</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加新分组</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddGroup} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">分组名称</Label>
                <Input
                  id="name"
                  placeholder="输入分组名称"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">分组描述</Label>
                <Input
                  id="description"
                  placeholder="输入分组描述"
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
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
              <TableHead className="text-[#86868B]">分组名称</TableHead>
              <TableHead className="text-[#86868B]">描述</TableHead>
              <TableHead className="text-[#86868B]">视频数量</TableHead>
              <TableHead className="text-[#86868B]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((group) => (
              <TableRow key={group.id}>
                <TableCell className="font-medium">{group.name}</TableCell>
                <TableCell>{group.description}</TableCell>
                <TableCell>{group.videos}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteGroup(group.id)}
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
