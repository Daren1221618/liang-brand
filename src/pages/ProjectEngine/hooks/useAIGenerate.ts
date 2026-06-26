import { useState, useRef, useCallback } from 'react';
import { message } from 'antd';
import * as storage from '../../../storage';
import type { ModelProvider } from '../../../ai';
import { streamGenerate } from '../../../ai';

interface UseAIGenerateParams {
  projectId: string;
  engineType: string;
  selectedModel: ModelProvider | 'auto';
  selectedKnowledgeIds: string[];
  onSetActive: (id: string) => void;
  refresh: () => void;
}

export function useAIGenerate({
  projectId, engineType, selectedModel, selectedKnowledgeIds,
  onSetActive, refresh,
}: UseAIGenerateParams) {
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [streamContent, setStreamContent] = useState('');
  const abortRef = useRef<(() => void) | null>(null);

  const handleAIGenerate = useCallback((dId: string, isRegenerate = false) => {
    (async () => {
      const project = await storage.getProject(projectId);
      const deliverable = project?.deliverables.find(d => d.id === dId);
      if (!deliverable) return;

      // 更新状态为 AI 生成中
      storage.updateDeliverable(projectId, dId, { status: 'ai_generating' });
      refresh();
      setGeneratingId(dId);
      setStreamContent('');
      onSetActive(dId);

      const scenario = isRegenerate ? 'deliverable_optimize' : 'deliverable_generate';

      // 调用真实 AI API（SSE 流式）
      const abort = streamGenerate({
        projectId,
        deliverableId: dId,
        deliverableName: deliverable.name,
        engineType: engineType || 'competition',
        scenario,
        provider: selectedModel === 'auto' ? undefined : selectedModel,
        knowledgeFileIds: selectedKnowledgeIds,
        existingContent: isRegenerate ? deliverable.content : undefined,
      }, {
        onModel: (provider, model) => {
          message.info(`使用 ${provider} / ${model} 生成中...`);
        },
        onToken: (token) => {
          setStreamContent(prev => prev + token);
        },
        onComplete: () => {
          setGeneratingId(null);
          setStreamContent('');
          abortRef.current = null;
          refresh();
          message.success('AI生成完成');
        },
        onError: (error) => {
          setGeneratingId(null);
          setStreamContent('');
          abortRef.current = null;
          // 回滚状态
          storage.updateDeliverable(projectId, dId, {
            status: deliverable.versions?.length > 0 ? 'draft' : 'pending',
          });
          refresh();
          message.error(`AI生成失败: ${error}`);
        },
      });

      abortRef.current = abort;
      message.info('AI正在生成内容...');
    })();
  }, [projectId, engineType, selectedModel, selectedKnowledgeIds, onSetActive, refresh]);

  const handleStopGenerate = useCallback(() => {
    if (abortRef.current) {
      abortRef.current();
      abortRef.current = null;
      if (generatingId) {
        (async () => {
          const project = await storage.getProject(projectId);
          const deliverable = project?.deliverables.find(d => d.id === generatingId);
          if (deliverable) {
            storage.updateDeliverable(projectId, generatingId, {
              status: deliverable.versions?.length > 0 ? 'draft' : 'pending',
            });
          }
          setGeneratingId(null);
          setStreamContent('');
          refresh();
          message.info('已停止生成');
        })();
      }
    }
  }, [projectId, generatingId, refresh]);

  return { generatingId, streamContent, handleAIGenerate, handleStopGenerate };
}
