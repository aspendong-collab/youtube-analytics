'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Trash2, Search, Loader2, ShieldCheck, UserClock, UserCheck, ShieldAlert } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
  lastLoginAt: string | null;
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        throw new Error('获取用户列表失败');
      }
    } catch (error) {
      console.error('加载用户列表失败:', error);
      toast.error('加载用户列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/users/${deleteUserId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '删除用户失败');
      }

      const data = await response.json();
      toast.success(data.message || '用户删除成功');

      // 刷新用户列表
      loadUsers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除用户失败';
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
      setDeleteUserId(null);
    }
  };

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive) {
      return <Badge variant="secondary" className="bg-gray-100 text-gray-500">已删除</Badge>;
    }

    switch (status) {
      case 'approved':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <UserCheck className="w-3 h-3 mr-1" />
            已通过
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <UserClock className="w-3 h-3 mr-1" />
            待审核
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <ShieldAlert className="w-3 h-3 mr-1" />
            已拒绝
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === 'admin') {
      return (
        <Badge className="bg-blue-100 text-blue-700">
          <ShieldCheck className="w-3 h-3 mr-1" />
          管理员
        </Badge>
      );
    }
    return <Badge variant="outline">普通用户</Badge>;
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(searchLower) ||
      user.name.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#007AFF]" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[#1D1D1F] mb-2">
            用户管理
          </h1>
          <p className="text-sm text-[#86868B]">
            管理系统用户及其权限
          </p>
        </div>
      </div>

      {/* 搜索框 */}
      <Card className="p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#86868B] w-4 h-4" />
          <Input
            type="text"
            placeholder="搜索用户邮箱或姓名..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* 用户列表 */}
      <Card className="overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#86868B] uppercase tracking-wider">
                  用户信息
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#86868B] uppercase tracking-wider">
                  角色
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#86868B] uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#86868B] uppercase tracking-wider">
                  注册时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#86868B] uppercase tracking-wider">
                  最后登录
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[#86868B] uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#86868B]">
                    {searchQuery ? '未找到匹配的用户' : '暂无用户'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-[#1D1D1F]">{user.name}</div>
                        <div className="text-sm text-[#86868B]">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(user.status, user.isActive)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#86868B]">
                      {new Date(user.createdAt).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#86868B]">
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleString('zh-CN')
                        : '从未登录'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {user.role !== 'admin' && user.isActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteUserId(user.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteUserId !== null} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除用户</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将永久删除该用户，删除后该用户将无法登录系统。此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  删除中...
                </>
              ) : (
                '确认删除'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
