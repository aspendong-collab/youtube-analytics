/**
 * 谈判服务相关类型定义
 */

/**
 * 谈判
 */
export interface Negotiation {
  id: string;
  userId: string;
  influencerId: string;
  campaignId?: string;
  threadId?: string;
  status: 'draft' | 'proposed' | 'countered' | 'accepted' | 'rejected' | 'expired' | 'cancelled';
  type: 'compensation' | 'deliverables' | 'timeline' | 'terms' | 'custom';
  terms: {
    compensation?: {
      type: 'fixed' | 'cpv' | 'cpa' | 'cpm' | 'revenue_share' | 'hybrid';
      amount?: number;
      rate?: number;
      currency?: string;
    };
    deliverables?: Array<{
      type: 'video' | 'stream' | 'post' | 'story' | 'other';
      quantity: number;
      specifications?: string;
    }>;
    timeline?: {
      startDate?: Date;
      endDate?: Date;
      milestones?: Array<{
        name: string;
        dueDate: Date;
        completed: boolean;
      }>;
    };
    additionalTerms?: Array<{
      title: string;
      description: string;
    }>;
  };
  proposedBy: 'user' | 'influencer';
  proposedAt: Date;
  expiresAt?: Date;
  respondedAt?: Date;
  respondedBy?: 'user' | 'influencer';
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt?: Date;
  completedAt?: Date;
}

/**
 * 谈判提案
 */
export interface NegotiationProposal {
  id: string;
  negotiationId: string;
  version: number;
  proposedBy: 'user' | 'influencer';
  terms: Negotiation['terms'];
  notes?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  respondedAt?: Date;
}

/**
 * 谈判历史记录
 */
export interface NegotiationHistory {
  id: string;
  negotiationId: string;
  action: 'created' | 'proposed' | 'countered' | 'accepted' | 'rejected' | 'expired' | 'cancelled' | 'updated';
  actor: 'user' | 'influencer' | 'system';
  actorId: string;
  details: Record<string, any>;
  createdAt: Date;
}
