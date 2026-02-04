'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface MetricsInfoDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function MetricsInfoDialog({ open, onClose }: MetricsInfoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>指标说明</DialogTitle>
          <DialogDescription>
            了解每个指标的含义、取值范围和计算方式
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="card" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="card">卡片指标</TabsTrigger>
            <TabsTrigger value="score">评分系统</TabsTrigger>
          </TabsList>

          {/* 卡片指标说明 */}
          <TabsContent value="card" className="space-y-4 mt-4">
            <MetricCard
              icon="🌍"
              name="国家/地区"
              description="频道主要面向的地区"
              valueRange="🌍 全球"
              detail="根据频道的描述内容、使用语言、发布时间时区等多维度信息智能推断达人主要面向的国家或地区。"
            />

            <MetricCard
              icon="📧"
              name="邮箱状态"
              description="是否能找到联系方式"
              valueRange="✅ 已找到 / ❌ 未找到"
              detail="从频道的描述信息、品牌设置、社交媒体链接中提取或推断联系邮箱。✅表示已找到有效的联系邮箱，❌表示未找到或邮箱无效。"
            />

            <MetricCard
              icon="🗣️"
              name="语种"
              description="视频主要使用的语言"
              valueRange="各种语言代码（如 zh, en, ja, ko）"
              detail="根据视频标题、描述、字幕、音频语言等信息推断频道的语言类型。帮助判断达人的目标受众和内容适用性。"
            />

            <MetricCard
              icon="👥"
              name="订阅数"
              description="频道订阅者数量"
              valueRange="数值（单位：个）"
              detail="统计到最近的订阅者总数，反映达人的受众规模。订阅数是评估达人影响力的核心指标之一。"
            />

            <MetricCard
              icon="📊"
              name="平均播放量"
              description="最近10个视频的平均播放量"
              valueRange="数值（单位：次）"
              detail="计算频道最近发布10个视频的平均观看次数，反映内容目前的受欢迎程度和实时影响力。"
            />

            <MetricCard
              icon="📊"
              name="评分"
              description="综合评分（0-100分）"
              valueRange="0-100分"
              detail="基于受众规模、质量、内容质量、增长趋势等9个维度的综合评估分数。评分越高，合作价值越大。详细评分规则请查看"评分系统"标签页。"
            />

            <MetricCard
              icon="🌟"
              name="等级"
              description="达人分层等级"
              valueRange="Tier 1-4"
              detail="根据综合评分将达人分为4个等级：Tier 1（头部达人，80+分）、Tier 2（中腰部，60-80分）、Tier 3（长尾达人，40-60分）、Tier 4（新兴达人，&lt;40分）。"
            />
          </TabsContent>

          {/* 评分系统说明 */}
          <TabsContent value="score" className="space-y-6 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">评分维度（总分100分）</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {scoreDimensions.map((dimension) => (
                  <div key={dimension.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{dimension.weight}</Badge>
                        <span className="font-medium">{dimension.name}</span>
                      </div>
                      <span className="text-sm text-[#86868B]">
                        最高 {dimension.weight.replace('%', '')} 分
                      </span>
                    </div>
                    <p className="text-sm text-[#86868B]">{dimension.description}</p>
                    <div className="w-full bg-[#E5E5EA] rounded-full h-2">
                      <div
                        className="bg-[#007AFF] h-2 rounded-full"
                        style={{ width: dimension.weight }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Separator />

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">等级划分</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {tierDescriptions.map((tier) => (
                  <div
                    key={tier.name}
                    className="flex items-start gap-3 p-3 bg-[#F5F5F7] rounded-lg"
                  >
                    <Badge className={tier.badgeClass}>{tier.name}</Badge>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">分数范围：</span>
                        <span className="text-sm text-[#007AFF]">{tier.scoreRange}</span>
                      </div>
                      <p className="text-sm text-[#86868B]">{tier.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {tier.features.map((feature, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">评分计算公式</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-[#F5F5F7] p-4 rounded-lg font-mono text-sm">
                  <p className="mb-2">总分 = ∑(各维度分数 × 权重)</p>
                  <p className="text-[#86868B]">
                    示例：某达人受众规模10分（15%权重）+ 受众质量12分（15%权重）+
                    内容质量8分（10%权重）+ ... = 85分
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// 指标卡片组件
function MetricCard({
  icon,
  name,
  description,
  valueRange,
  detail,
}: {
  icon: string;
  name: string;
  description: string;
  valueRange: string;
  detail: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="text-2xl">{icon}</span>
          <span>{name}</span>
        </CardTitle>
        <p className="text-sm text-[#86868B]">{description}</p>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#86868B]">取值范围：</span>
          <Badge variant="secondary">{valueRange}</Badge>
        </div>
        <p className="text-sm text-[#1D1D1F] leading-relaxed">{detail}</p>
      </CardContent>
    </Card>
  );
}

// 评分维度数据
const scoreDimensions = [
  {
    name: '受众规模',
    weight: '15%',
    description: '基于订阅者数量、总播放量等指标评估受众规模大小',
  },
  {
    name: '受众质量',
    weight: '15%',
    description: '基于互动率（点赞+评论/播放）评估受众的活跃度和参与度',
  },
  {
    name: '内容质量',
    weight: '10%',
    description: '基于视频缩略图质量、字幕覆盖率、视频时长等评估内容制作水平',
  },
  {
    name: '一致性',
    weight: '10%',
    description: '基于发布频率和稳定性评估内容发布规律',
  },
  {
    name: '增长率',
    weight: '15%',
    description: '基于视频观看量、订阅数的增长趋势评估发展速度',
  },
  {
    name: '趋势度',
    weight: '10%',
    description: '基于近期表现是否上升评估当前热度',
  },
  {
    name: '潜力',
    weight: '10%',
    description: '基于增长率和当前规模评估未来发展潜力',
  },
  {
    name: '相关性',
    weight: '5%',
    description: '与搜索关键词的相关度匹配程度',
  },
  {
    name: '成本效率',
    weight: '10%',
    description: '互动量与估算成本的比值，评估合作的性价比',
  },
];

// 等级描述数据
const tierDescriptions = [
  {
    name: 'Tier 1',
    badgeClass: 'bg-red-500 text-white hover:bg-red-600',
    scoreRange: '80-100分',
    description: '头部达人，拥有大量受众和高影响力，适合品牌曝光和大型推广活动',
    features: ['高预算需求', '适合品牌曝光', '需定制化方案'],
  },
  {
    name: 'Tier 2',
    badgeClass: 'bg-orange-500 text-white hover:bg-orange-600',
    scoreRange: '60-80分',
    description: '中腰部达人，平衡曝光和转化效果，适合多数推广需求',
    features: ['中等预算', '平衡效果', '联盟佣金'],
  },
  {
    name: 'Tier 3',
    badgeClass: 'bg-yellow-500 text-white hover:bg-yellow-600',
    scoreRange: '40-60分',
    description: '长尾达人，受众精准但规模较小，高转化率，性价比高',
    features: ['低预算', '高转化率', '免费产品+佣金'],
  },
  {
    name: 'Tier 4',
    badgeClass: 'bg-gray-500 text-white hover:bg-gray-600',
    scoreRange: '0-40分',
    description: '新兴达人，受众规模小但增长潜力大，适合长期培养',
    features: ['预算最低', '高成长性', '产品授权'],
  },
];
