'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface Video {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string | null;
  channelId: string | null;
  channelTitle: string | null;
  publishDate: string | null;
  totalViews: number | null;
  createdAt: string;
}

interface AnalysisContextType {
  selectedVideo: Video | null;
  setSelectedVideo: (video: Video | null) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (analyzing: boolean) => void;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  return (
    <AnalysisContext.Provider
      value={{
        selectedVideo,
        setSelectedVideo,
        isAnalyzing,
        setIsAnalyzing,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (context === undefined) {
    throw new Error('useAnalysis must be used within an AnalysisProvider');
  }
  return context;
}
