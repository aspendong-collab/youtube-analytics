'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { getAllLanguages, TOP_LANGUAGES, LANGUAGE_GROUPS } from '@/lib/keyword-extractor/languages';
import { X, ChevronDown, Globe } from 'lucide-react';

interface LanguageSelectorProps {
  selectedLanguages: string[];
  onChange: (languages: string[]) => void;
  maxSelect?: number;
}

export default function LanguageSelector({
  selectedLanguages,
  onChange,
  maxSelect = 5,
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'top' | 'asia' | 'europe'>('all');

  const allLanguages = getAllLanguages();
  const topLanguages = TOP_LANGUAGES.map(code => allLanguages.find(l => l.code === code)).filter(Boolean);
  const asiaLanguages = LANGUAGE_GROUPS.asia.map(code => allLanguages.find(l => l.code === code)).filter(Boolean);
  const europeLanguages = LANGUAGE_GROUPS.europe.map(code => allLanguages.find(l => l.code === code)).filter(Boolean);

  const getFilteredLanguages = () => {
    switch (activeTab) {
      case 'top':
        return topLanguages;
      case 'asia':
        return asiaLanguages;
      case 'europe':
        return europeLanguages;
      default:
        return allLanguages;
    }
  };

  const filteredLanguages = getFilteredLanguages();

  const handleToggle = (code: string) => {
    if (selectedLanguages.includes(code)) {
      onChange(selectedLanguages.filter(l => l !== code));
    } else if (selectedLanguages.length < maxSelect) {
      onChange([...selectedLanguages, code]);
    }
  };

  const handleSelectAll = () => {
    if (selectedLanguages.length === maxSelect) {
      onChange([]);
    } else {
      onChange(TOP_LANGUAGES.slice(0, maxSelect));
    }
  };

  const handleQuickSelect = (group: string) => {
    let languages: string[] = [];
    switch (group) {
      case 'asia':
        languages = LANGUAGE_GROUPS.asia.slice(0, 3);
        break;
      case 'europe':
        languages = LANGUAGE_GROUPS.europe.slice(0, 3);
        break;
      case 'top':
        languages = TOP_LANGUAGES.slice(0, 3);
        break;
      default:
        languages = [];
    }
    onChange(languages.slice(0, maxSelect));
    setIsOpen(false);
  };

  const getLanguageLabel = (code: string) => {
    const lang = allLanguages.find(l => l.code === code);
    return lang ? `${lang.flag} ${lang.nativeName}` : code;
  };

  return (
    <div className="relative">
      {/* 触发按钮 */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between"
      >
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4" />
          {selectedLanguages.length === 0
            ? '选择语言'
            : `已选 ${selectedLanguages.length} 种语言`}
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {/* 已选语言标签 */}
      {selectedLanguages.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedLanguages.map(code => (
            <Badge key={code} variant="secondary" className="gap-1">
              {getLanguageLabel(code)}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggle(code);
                }}
                className="hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* 下拉面板 */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border rounded-lg shadow-lg max-h-96 overflow-hidden">
          {/* 标签页 */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-blue-50 text-blue-600'
                  : 'hover:bg-gray-50'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setActiveTab('top')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'top'
                  ? 'bg-blue-50 text-blue-600'
                  : 'hover:bg-gray-50'
              }`}
            >
              热门
            </button>
            <button
              onClick={() => setActiveTab('asia')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'asia'
                  ? 'bg-blue-50 text-blue-600'
                  : 'hover:bg-gray-50'
              }`}
            >
              亚洲
            </button>
            <button
              onClick={() => setActiveTab('europe')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'europe'
                  ? 'bg-blue-50 text-blue-600'
                  : 'hover:bg-gray-50'
              }`}
            >
              欧洲
            </button>
          </div>

          {/* 语言列表 */}
          <div className="p-4 max-h-64 overflow-y-auto">
            {filteredLanguages.map(lang => (
              <div key={lang.code} className="flex items-center gap-3 py-2">
                <Checkbox
                  id={`lang-${lang.code}`}
                  checked={selectedLanguages.includes(lang.code)}
                  onCheckedChange={() => handleToggle(lang.code)}
                  disabled={
                    !selectedLanguages.includes(lang.code) &&
                    selectedLanguages.length >= maxSelect
                  }
                />
                <Label
                  htmlFor={`lang-${lang.code}`}
                  className="flex-1 cursor-pointer"
                >
                  <span className="mr-2">{lang.flag}</span>
                  <span className="font-medium">{lang.nativeName}</span>
                  <span className="ml-2 text-xs text-gray-500">
                    {lang.videoCount}
                  </span>
                </Label>
              </div>
            ))}
          </div>

          {/* 快速操作 */}
          <div className="flex items-center justify-between p-4 border-t bg-gray-50">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleQuickSelect('asia')}
              >
                🌏 亚洲
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleQuickSelect('europe')}
              >
                🌍 欧洲
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleQuickSelect('top')}
              >
                🔥 热门
              </Button>
            </div>
            <div className="text-xs text-gray-500">
              已选 {selectedLanguages.length} / {maxSelect}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
