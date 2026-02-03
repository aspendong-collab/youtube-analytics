'use client';

import { AnalysisProvider } from '@/contexts/analysis-context';
import { ReactNode } from 'react';

export default function ContentAnalysisLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AnalysisProvider>{children}</AnalysisProvider>;
}
