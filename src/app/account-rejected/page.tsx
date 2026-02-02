"use client";

import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

export default function AccountRejectedPage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7] p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="text-6xl mb-4">❌</div>
        <h1 className="text-2xl font-semibold text-[#1D1D1F] mb-4">
          审核未通过
        </h1>
        <p className="text-[#86868B] mb-6">
          很抱歉，您的账号审核未通过。如需更多信息，请联系管理员。
        </p>
        <div className="bg-[#F5F5F7] p-4 rounded-lg mb-6 text-left">
          <p className="text-sm text-[#86868B] mb-2">
            <strong>注册信息：</strong>
          </p>
          <p className="text-sm text-[#1D1D1F]">姓名：{session?.user.name}</p>
          <p className="text-sm text-[#1D1D1F]">邮箱：{session?.user.email}</p>
        </div>
        <Button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full"
        >
          退出登录
        </Button>
      </Card>
    </div>
  );
}
