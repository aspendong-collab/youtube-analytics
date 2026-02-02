"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { signOut } from "next-auth/react";

interface User {
  id: string;
  email: string;
  name: string;
  status: string;
  createdAt: string;
}

export default function UserApprovalPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session && session.user.role !== "admin") {
      toast.error("无权限访问此页面");
      router.push("/");
    } else if (session && session.user.role === "admin") {
      loadPendingUsers();
    }
  }, [session, status, router]);

  const loadPendingUsers = async () => {
    try {
      const response = await fetch("/api/users/pending");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      toast.error("加载待审核用户失败");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    setProcessingId(userId);
    try {
      const response = await fetch(`/api/users/${userId}/approve`, {
        method: "POST",
      });

      if (response.ok) {
        toast.success("用户审核通过");
        loadPendingUsers();
      } else {
        const data = await response.json();
        toast.error(data.error || "审核失败");
      }
    } catch (error) {
      toast.error("审核失败，请稍后重试");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (userId: string) => {
    setProcessingId(userId);
    try {
      const response = await fetch(`/api/users/${userId}/reject`, {
        method: "POST",
      });

      if (response.ok) {
        toast.success("用户已拒绝");
        loadPendingUsers();
      } else {
        const data = await response.json();
        toast.error(data.error || "操作失败");
      }
    } catch (error) {
      toast.error("操作失败，请稍后重试");
    } finally {
      setProcessingId(null);
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[#86868B]">加载中...</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1D1D1F] mb-2">
            用户审核
          </h1>
          <p className="text-sm text-[#86868B]">
            管理和审核新注册的用户
          </p>
        </div>
        <Button
          onClick={handleLogout}
          variant="outline"
        >
          退出登录
        </Button>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-[#1D1D1F] mb-4">
          待审核用户 ({users.length})
        </h2>

        {isLoading ? (
          <div className="text-center py-8 text-[#86868B]">
            加载中...
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-[#86868B]">
            暂无待审核用户
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 bg-[#F5F5F7] rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium text-[#1D1D1F]">
                      {user.name}
                    </h3>
                    <Badge variant="secondary">待审核</Badge>
                  </div>
                  <p className="text-sm text-[#86868B]">
                    {user.email}
                  </p>
                  <p className="text-xs text-[#86868B] mt-1">
                    注册时间: {new Date(user.createdAt).toLocaleString("zh-CN")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleApprove(user.id)}
                    disabled={processingId === user.id}
                    className="bg-[#34C759] hover:bg-[#2DB050] text-white"
                    size="sm"
                  >
                    {processingId === user.id ? "处理中..." : "通过"}
                  </Button>
                  <Button
                    onClick={() => handleReject(user.id)}
                    disabled={processingId === user.id}
                    variant="outline"
                    size="sm"
                  >
                    {processingId === user.id ? "处理中..." : "拒绝"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
