// ============================================================
// 亮品牌 · 启动阶段工作台
// 品牌自检 + 品牌年谱 双模块
// ============================================================

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Typography, Button, Space, Tag, Tabs, Row, Col,
  Input, Select, Form, Divider, message, Tooltip, Badge,
  Timeline as AntTimeline, Modal, Empty, Alert, Progress,
  Spin,
} from 'antd';
import {
  ArrowLeftOutlined, SaveOutlined, RobotOutlined,
  PlusOutlined, EditOutlined, DeleteOutlined,
  CheckCircleOutlined, QuestionCircleOutlined,
  ClockCircleOutlined, BulbOutlined, StopOutlined,
} from '@ant-design/icons';
import { useApp } from '../context';
import * as storage from '../storage';
import {
  CHECKLIST_TEMPLATE, getAllFields,
  ChecklistData, ChecklistField,
} from '../brandChecklist';
import {
  BrandTimeline, TimelineEntry, TimelineEntryType,
  TIMELINE_TYPE_CONFIG, TIMELINE_GUIDE_QUESTIONS,
} from '../brandTimeline';
import { fillChecklist, searchTimeline, fieldAssist } from '../ai';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// ======================== 品牌自检组件 ========================

function BrandChecklistPanel({
  projectId,
  data,
  onUpdate,
}: {
  projectId: string;
  data: ChecklistData;
  onUpdate: (data: ChecklistData) => void;
}) {
  const allFields = getAllFields();
  const filledCount = allFields.filter(f => data[f.id]?.trim()).length;
  const totalCount = allFields.length;
  const pct = Math.round((filledCount / totalCount) * 100);
  // composition 期间暂存正在编辑的字段值，避免拼音残留
  const composingRef = useRef(false);
  const [draftField, setDraftField] = useState<{ id: string; value: string } | null>(null);

  // 获取字段当前值：优先用本地 draft（composition 中间态），否则用父级 data
  const getFieldValue = useCallback((fieldId: string) => {
    if (draftField && draftField.id === fieldId) return draftField.value;
    return data[fieldId] || '';
  }, [data, draftField]);

  const handleFieldChange = (fieldId: string, value: string) => {
    if (composingRef.current) {
      // composition 中间态：用本地 state 跟踪，不提交父级
      setDraftField({ id: fieldId, value });
      return;
    }
    // 非 composition 状态：直接提交
    setDraftField(null);
    onUpdate({ ...data, [fieldId]: value });
  };

  const handleCompositionEnd = (fieldId: string, value: string) => {
    composingRef.current = false;
    setDraftField(null);
    onUpdate({ ...data, [fieldId]: value });
  };

  const compositionHandlers = (fieldId: string) => ({
    onCompositionStart: () => { composingRef.current = true; },
    onCompositionEnd: (e: any) => handleCompositionEnd(fieldId, e.target.value),
  });

  const [aiFillingField, setAiFillingField] = useState<string | null>(null);
  const [aiFillingAll, setAiFillingAll] = useState(false);

  const handleAIAssist = async (fieldId: string, label: string) => {
    setAiFillingField(fieldId);
    message.loading({ content: `AI正在辅助搜索"${label}"相关信息...`, key: 'ai-assist' });
    try {
      const result = await fieldAssist(projectId, label, data[fieldId] || '', 'initiation');
      // 将 AI 建议弹窗展示，用户确认后填充
      Modal.confirm({
        title: `AI 建议 - ${label}`,
        width: 600,
        content: (
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: 14 }}>
            {result.suggestion}
          </div>
        ),
        okText: '采纳建议',
        cancelText: '自行填写',
        onOk: () => {
          // 尝试提取第一个建议（简化处理：取建议文本第一行或全文）
          const lines = result.suggestion.split('\n').filter(l => l.trim());
          const suggestion = lines.find(l => /^\d|[·•]/.test(l.trim())) || result.suggestion;
          // 清理序号前缀
          const cleaned = suggestion.replace(/^[\d]+[.、)）]\s*/, '').replace(/[·•]\s*/, '').trim();
          onUpdate({ ...data, [fieldId]: cleaned });
          message.success('已采纳 AI 建议');
        },
      });
    } catch (err: any) {
      message.error({ content: `AI辅助失败: ${err.message}`, key: 'ai-assist' });
    } finally {
      setAiFillingField(null);
    }
  };

  const renderField = (field: ChecklistField) => {
    const value = getFieldValue(field.id);
    const isFilled = value.trim().length > 0;
    const comp = compositionHandlers(field.id);
    const isAiRunning = aiFillingField === field.id;

    const fieldLabel = (
      <Space size={4}>
        <span>{field.label}</span>
        {field.guide && (
          <Tooltip title={field.guide}>
            <QuestionCircleOutlined style={{ color: '#999', fontSize: 12 }} />
          </Tooltip>
        )}
        {field.relatedTo && (
          <Tooltip title={`关联引擎：${field.relatedTo.join('、')}`}>
            <Tag style={{ fontSize: 10, marginLeft: 4 }}>{field.relatedTo.length}个引擎</Tag>
          </Tooltip>
        )}
      </Space>
    );

    const aiAssistBtn = (
      <Tooltip title="AI 辅助填写">
        <Button
          type="text"
          size="small"
          icon={<RobotOutlined />}
          loading={isAiRunning}
          onClick={() => handleAIAssist(field.id, field.label)}
          style={{ color: '#722ed1' }}
        />
      </Tooltip>
    );

    if (field.type === 'textarea') {
      return (
        <Form.Item key={field.id} label={fieldLabel} style={{ marginBottom: 16 }}
          extra={<div style={{ position: 'absolute', right: 0, top: -28 }}>{aiAssistBtn}</div>}
        >
          <TextArea
            rows={3}
            value={value}
            onChange={e => handleFieldChange(field.id, e.target.value)}
            {...comp}
            placeholder={field.placeholder}
            style={{ borderColor: isFilled ? '#52c41a' : undefined }}
          />
        </Form.Item>
      );
    }

    if (field.type === 'select') {
      return (
        <Form.Item key={field.id} label={fieldLabel} style={{ marginBottom: 16 }}>
          <Select
            value={value || undefined}
            onChange={v => handleFieldChange(field.id, v)}
            placeholder={field.placeholder}
            allowClear
            style={{ width: '100%' }}
          >
            {field.options?.map(opt => (
              <Select.Option key={opt} value={opt}>{opt}</Select.Option>
            ))}
          </Select>
        </Form.Item>
      );
    }

    if (field.type === 'multiselect') {
      const selectedValues = value ? value.split(',').filter(Boolean) : [];
      return (
        <Form.Item key={field.id} label={fieldLabel} style={{ marginBottom: 16 }}>
          <Select
            mode="multiple"
            value={selectedValues}
            onChange={vals => handleFieldChange(field.id, vals.join(','))}
            placeholder={field.placeholder}
            style={{ width: '100%' }}
          >
            {field.options?.map(opt => (
              <Select.Option key={opt} value={opt}>{opt}</Select.Option>
            ))}
          </Select>
        </Form.Item>
      );
    }

    if (field.type === 'number') {
      return (
        <Form.Item key={field.id} label={fieldLabel} style={{ marginBottom: 16 }}>
          <Input
            type="number"
            value={value}
            onChange={e => handleFieldChange(field.id, e.target.value)}
            {...comp}
            placeholder={field.placeholder}
            style={{ borderColor: isFilled ? '#52c41a' : undefined }}
          />
        </Form.Item>
      );
    }

    // text, date
    return (
      <Form.Item key={field.id} label={fieldLabel} style={{ marginBottom: 16 }}
        extra={<div style={{ position: 'absolute', right: 0, top: -28 }}>{aiAssistBtn}</div>}
      >
        <Input
          value={value}
          onChange={e => handleFieldChange(field.id, e.target.value)}
          {...comp}
          placeholder={field.placeholder}
          style={{ borderColor: isFilled ? '#52c41a' : undefined }}
        />
      </Form.Item>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Space>
            <Tag color={pct === 100 ? 'green' : 'blue'}>完成度 {pct}%</Tag>
            <Text type="secondary">已填 {filledCount}/{totalCount} 项</Text>
          </Space>
        </div>
        <Space>
          <Button
            icon={<RobotOutlined />}
            loading={aiFillingAll}
            onClick={async () => {
              // 找出所有未填写的字段
              const emptyFields = allFields.filter(f => !data[f.id]?.trim()).map(f => f.id);
              if (emptyFields.length === 0) {
                message.info('所有字段已填写，无需补全');
                return;
              }
              setAiFillingAll(true);
              message.loading({ content: `AI正在分析已填信息，补全 ${emptyFields.length} 个空字段...`, key: 'ai-fill' });
              try {
                const result = await fillChecklist(projectId, emptyFields);
                const rawSuggestions = result.suggestions || {};
                const suggestions: Record<string, string> = typeof rawSuggestions === 'object' ? (rawSuggestions as Record<string, string>) : {};
                const filledKeys = Object.keys(suggestions);
                if (filledKeys.length === 0) {
                  message.warning({ content: 'AI未能生成补全建议', key: 'ai-fill' });
                } else {
                  // 弹窗展示建议，用户确认后批量填充
                  const preview = filledKeys.slice(0, 10).map(key => {
                    const fieldDef = allFields.find(f => f.id === key);
                    return `• ${fieldDef?.label || key}：${(suggestions[key] || '').slice(0, 60)}${(suggestions[key] || '').length > 60 ? '...' : ''}`;
                  }).join('\n');
                  const extra = filledKeys.length > 10 ? `\n... 共 ${filledKeys.length} 个字段` : '';

                  Modal.confirm({
                    title: `AI 补全建议 (${filledKeys.length} 个字段)`,
                    width: 650,
                    content: (
                      <div>
                        <Alert
                          message="以下为 AI 基于已填写信息推理的建议，请逐项审核后再确认"
                          type="warning"
                          showIcon
                          style={{ marginBottom: 12 }}
                        />
                        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: 13, maxHeight: 300, overflow: 'auto', background: '#fafafa', padding: 12, borderRadius: 4 }}>
                          {preview}{extra}
                        </div>
                      </div>
                    ),
                    okText: `全部采纳 (${filledKeys.length} 项)`,
                    cancelText: '取消',
                    onOk: () => {
                      const updated = { ...data };
                      for (const [key, val] of Object.entries(suggestions)) {
                        if (typeof val === 'string' && val.trim()) {
                          updated[key] = val.trim();
                        }
                      }
                      onUpdate(updated);
                      message.success({ content: `已补全 ${filledKeys.length} 个字段，请逐项审核修改`, key: 'ai-fill' });
                    },
                  });
                }
              } catch (err: any) {
                message.error({ content: `AI补全失败: ${err.message}`, key: 'ai-fill' });
              } finally {
                setAiFillingAll(false);
              }
            }}
          >
            AI一键补全
          </Button>
        </Space>
      </div>
      <Progress percent={pct} size="small" strokeColor={pct === 100 ? '#52c41a' : '#cf1322'} style={{ marginBottom: 24 }} />

      {CHECKLIST_TEMPLATE.map(section => {
        const sectionFilled = section.fields.filter(f => data[f.id]?.trim()).length;
        const sectionTotal = section.fields.length;
        const sectionPct = Math.round((sectionFilled / sectionTotal) * 100);

        return (
          <Card
            key={section.id}
            size="small"
            style={{ marginBottom: 16 }}
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 15 }}>{section.title}</span>
                <Space>
                  <Tag color={sectionPct === 100 ? 'green' : 'default'}>{sectionFilled}/{sectionTotal}</Tag>
                </Space>
              </div>
            }
          >
            <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 16 }}>{section.description}</Paragraph>
            <Row gutter={[24, 0]}>
              {section.fields.map(field => (
                <Col xs={24} sm={12} key={field.id}>
                  {renderField(field)}
                </Col>
              ))}
            </Row>
          </Card>
        );
      })}
    </div>
  );
}

// ======================== 品牌年谱组件 ========================

function BrandTimelinePanel({
  projectId,
  data,
  onUpdate,
}: {
  projectId: string;
  data: BrandTimeline;
  onUpdate: (data: BrandTimeline) => void;
}) {
  const [addModal, setAddModal] = useState(false);
  const [editEntry, setEditEntry] = useState<TimelineEntry | null>(null);
  const [form] = Form.useForm();
  const [aiTimelineLoading, setAiTimelineLoading] = useState(false);
  const timelineComposingRef = useRef(false);
  const [timelineDraft, setTimelineDraft] = useState<{ field: string; value: string } | null>(null);

  const getTimelineValue = useCallback((fieldId: string) => {
    if (timelineDraft && timelineDraft.field === fieldId) return timelineDraft.value;
    return (data as any)[fieldId] || '';
  }, [data, timelineDraft]);

  const handleTimelineFieldChange = (fieldId: string, value: string) => {
    if (timelineComposingRef.current) {
      // composition 中间态：用本地 state 跟踪
      setTimelineDraft({ field: fieldId, value });
      return;
    }
    setTimelineDraft(null);
    onUpdate({ ...data, [fieldId]: value, updatedAt: Date.now() });
  };

  const handleTimelineCompositionEnd = (fieldId: string, value: string) => {
    timelineComposingRef.current = false;
    setTimelineDraft(null);
    onUpdate({ ...data, [fieldId]: value, updatedAt: Date.now() });
  };

  const timelineComp = (fieldId: string) => ({
    onCompositionStart: () => { timelineComposingRef.current = true; },
    onCompositionEnd: (e: any) => handleTimelineCompositionEnd(fieldId, e.target.value),
  });

  const handleAddEntry = (values: any) => {
    const newEntry: TimelineEntry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      period: values.period,
      type: values.type,
      title: values.title,
      description: values.description,
      tags: values.tags || [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const entries = editEntry
      ? data.entries.map(e => e.id === editEntry.id ? { ...editEntry, ...newEntry, id: editEntry.id } : e)
      : [...data.entries, newEntry];

    onUpdate({ ...data, entries, updatedAt: Date.now() });
    setAddModal(false);
    setEditEntry(null);
    form.resetFields();
    message.success(editEntry ? '条目已更新' : '条目已添加');
  };

  const handleDeleteEntry = (entryId: string) => {
    Modal.confirm({
      title: '确认删除？',
      content: '删除后无法恢复',
      onOk: () => {
        onUpdate({ ...data, entries: data.entries.filter(e => e.id !== entryId), updatedAt: Date.now() });
        message.success('已删除');
      },
    });
  };

  const openEdit = (entry: TimelineEntry) => {
    setEditEntry(entry);
    form.setFieldsValue(entry);
    setAddModal(true);
  };

  const openAdd = (defaultType?: TimelineEntryType) => {
    setEditEntry(null);
    form.resetFields();
    if (defaultType) form.setFieldValue('type', defaultType);
    setAddModal(true);
  };

  // Group entries by period
  const sortedEntries = [...data.entries].sort((a, b) => a.period.localeCompare(b.period));
  const grouped = sortedEntries.reduce<Record<string, TimelineEntry[]>>((acc, entry) => {
    if (!acc[entry.period]) acc[entry.period] = [];
    acc[entry.period].push(entry);
    return acc;
  }, {});

  return (
    <div>
      <Alert
        message="品牌年谱记录"
        description="系统梳理品牌从创立至今的完整发展路径——做对了什么、错过了什么、当下的机遇与挑战、对未来的思考。这些信息是后续所有服务引擎的第一参考信息源。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {/* Quick Add Buttons */}
      <div style={{ marginBottom: 24 }}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>快速添加：</Text>
        <Space wrap>
          {Object.entries(TIMELINE_TYPE_CONFIG).map(([type, cfg]) => (
            <Button
              key={type}
              icon={<PlusOutlined />}
              onClick={() => openAdd(type as TimelineEntryType)}
              style={{ borderColor: cfg.color, color: cfg.color }}
            >
              {cfg.icon} {cfg.label}
            </Button>
          ))}
        </Space>
      </div>

      {/* Timeline Display */}
      {data.entries.length === 0 ? (
        <Empty
          description="暂无年谱记录，请点击上方按钮添加"
          style={{ padding: '60px 0' }}
        >
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openAdd()}>
            添加第一条记录
          </Button>
        </Empty>
      ) : (
        Object.entries(grouped).map(([period, entries]) => (
          <Card key={period} size="small" style={{ marginBottom: 16 }} title={<span style={{ fontSize: 15 }}>📅 {period}</span>}>
            <AntTimeline
              items={entries.map(entry => {
                const typeCfg = TIMELINE_TYPE_CONFIG[entry.type];
                return {
                  color: typeCfg.color,
                  children: (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <Space size={4}>
                          <Tag color={typeCfg.color} style={{ fontSize: 11 }}>{typeCfg.icon} {typeCfg.label}</Tag>
                          <Text strong>{entry.title}</Text>
                        </Space>
                        {entry.description && (
                          <Paragraph type="secondary" style={{ fontSize: 13, marginTop: 4, marginBottom: 0 }}>
                            {entry.description}
                          </Paragraph>
                        )}
                        {entry.tags && entry.tags.length > 0 && (
                          <div style={{ marginTop: 4 }}>
                            {entry.tags.map(t => <Tag key={t} style={{ fontSize: 10 }}>{t}</Tag>)}
                          </div>
                        )}
                      </div>
                      <Space size={4}>
                        <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(entry)} />
                        <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteEntry(entry.id)} />
                      </Space>
                    </div>
                  ),
                };
              })}
            />
          </Card>
        ))
      )}

      {/* Team Reflection */}
      <Card size="small" title={<span>💭 团队反思与总结</span>} style={{ marginBottom: 16, marginTop: 24 }}>
        <TextArea
          rows={4}
          value={getTimelineValue('teamReflection')}
          onChange={e => handleTimelineFieldChange('teamReflection', e.target.value)}
          {...timelineComp('teamReflection')}
          placeholder="梳理品牌发展过程中，团队整体认为做对了什么、做错了什么、学到了什么……"
        />
      </Card>

      {/* Future Thinking */}
      <Card size="small" title={<span>💡 未来战略思考</span>} style={{ marginBottom: 16 }}>
        <TextArea
          rows={4}
          value={getTimelineValue('futureThinking')}
          onChange={e => handleTimelineFieldChange('futureThinking', e.target.value)}
          {...timelineComp('futureThinking')}
          placeholder="对于企业、品牌未来的发展方向、战略规划、团队思考……"
        />
      </Card>

      {/* AI Assist */}
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <Button
          icon={<RobotOutlined />}
          size="large"
          loading={aiTimelineLoading}
          onClick={async () => {
            setAiTimelineLoading(true);
            message.loading({ content: 'AI正在基于已有信息分析，生成年谱建议...', key: 'ai-timeline' });
            try {
              const result = await searchTimeline(projectId);
              const entries = result.entries || [];
              if (entries.length === 0) {
                message.warning({ content: 'AI未能生成年谱建议，请先填写品牌自检信息', key: 'ai-timeline' });
              } else {
                // 弹窗展示建议条目，用户确认后批量添加
                Modal.confirm({
                  title: `AI 年谱建议 (${entries.length} 条)`,
                  width: 700,
                  content: (
                    <div>
                      <Alert
                        message="以下为 AI 基于品牌信息推理的年谱建议，请审核后再确认添加"
                        type="warning"
                        showIcon
                        style={{ marginBottom: 12 }}
                      />
                      <div style={{ maxHeight: 400, overflow: 'auto' }}>
                        {entries.map((entry: any, i: number) => (
                          <Card key={i} size="small" style={{ marginBottom: 8, borderLeft: '3px solid #cf1322' }}>
                            <Space size={4}>
                              <Text strong>{entry.year || entry.period || '未知时间'}</Text>
                              <Tag>{entry.type || 'milestone'}</Tag>
                            </Space>
                            <div style={{ fontWeight: 600 }}>{entry.title || ''}</div>
                            {entry.description && (
                              <Text type="secondary" style={{ fontSize: 13 }}>{entry.description}</Text>
                            )}
                          </Card>
                        ))}
                      </div>
                    </div>
                  ),
                  okText: `全部添加 (${entries.length} 条)`,
                  cancelText: '取消',
                  onOk: () => {
                    const newEntries: TimelineEntry[] = entries.map((entry: any) => ({
                      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
                      period: entry.year || entry.period || '',
                      type: (entry.type as TimelineEntryType) || 'milestone',
                      title: entry.title || '',
                      description: entry.description || '',
                      tags: entry.tags || [],
                      createdAt: Date.now(),
                      updatedAt: Date.now(),
                    }));
                    onUpdate({ ...data, entries: [...data.entries, ...newEntries], updatedAt: Date.now() });
                    message.success({ content: `已添加 ${entries.length} 条年谱记录，请逐条审核修改`, key: 'ai-timeline' });
                  },
                });
              }
            } catch (err: any) {
              message.error({ content: `AI年谱补全失败: ${err.message}`, key: 'ai-timeline' });
            } finally {
              setAiTimelineLoading(false);
            }
          }}
        >
          AI智能补全年谱
        </Button>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        title={editEntry ? '编辑年谱条目' : '添加年谱条目'}
        open={addModal}
        onCancel={() => { setAddModal(false); setEditEntry(null); form.resetFields(); }}
        footer={[
          <Button key="cancel" onClick={() => { setAddModal(false); setEditEntry(null); form.resetFields(); }}>取消</Button>,
          <Button key="save" onClick={() => form.submit()} type="primary">
            {editEntry ? '保存修改' : '添加'}
          </Button>,
        ]}
        width={Math.min(600, window.innerWidth - 32)}
      >
        <Form form={form} layout="vertical" onFinish={handleAddEntry}>
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item name="period" label="时间" rules={[{ required: true, message: '请填写时间' }]}>
                <Input placeholder="如：2019年3月" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={16}>
              <Form.Item name="type" label="类型" rules={[{ required: true }]}>
                <Select placeholder="选择条目类型">
                  {Object.entries(TIMELINE_TYPE_CONFIG).map(([type, cfg]) => (
                    <Select.Option key={type} value={type}>
                      {cfg.icon} {cfg.label} — {cfg.description}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请填写标题' }]}>
            <Input placeholder="简明扼要地概括这一事件" />
          </Form.Item>
          <Form.Item name="description" label="详细描述">
            <TextArea rows={4} placeholder="详细描述这个事件的背景、过程、结果和影响……" />
          </Form.Item>
          <Form.Item name="tags" label="标签（可选）">
            <Select mode="tags" placeholder="输入后按回车添加标签" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

// ======================== 主组件 ========================

export default function ProjectInitiation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, refresh } = useApp();

  const project = projects.find(p => p.id === id);

  // 本地 state 作为品牌自检/年谱的唯一真实值，不依赖 context refresh 覆盖
  const [localChecklist, setLocalChecklist] = useState<ChecklistData | null>(null);
  const [localTimeline, setLocalTimeline] = useState<BrandTimeline | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 初始化：首次从 project 同步到本地（仅一次）
  const initializedRef = useRef(false);
  useEffect(() => {
    if (project && !initializedRef.current) {
      initializedRef.current = true;
      setLocalChecklist(project.brandChecklist);
      setLocalTimeline(project.brandTimeline);
    }
  }, [project]);

  // 防抖保存到后端（不 refresh，不覆盖本地 state）
  const scheduleSave = useCallback((checklist?: ChecklistData, timeline?: BrandTimeline) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        if (checklist) await storage.updateBrandChecklist(id!, checklist);
        if (timeline) await storage.updateBrandTimeline(id!, timeline);
      } catch (err) {
        console.error('自动保存失败:', err);
      }
    }, 800);
  }, [id]);

  // 输入时更新本地 state + 防抖保存（不调用 refresh）
  const handleChecklistUpdate = useCallback((newData: ChecklistData) => {
    setLocalChecklist(newData);
    scheduleSave(newData);
  }, [scheduleSave]);

  const handleTimelineUpdate = useCallback((newData: BrandTimeline) => {
    setLocalTimeline(newData);
    scheduleSave(undefined, newData);
  }, [scheduleSave]);

  // 手动保存：强制立即写入后端 + 刷新
  const handleSave = async () => {
    try {
      if (localChecklist) await storage.updateBrandChecklist(id!, localChecklist);
      if (localTimeline) await storage.updateBrandTimeline(id!, localTimeline);
      await refresh();
      message.success('已保存');
    } catch (err) {
      message.error('保存失败');
      console.error(err);
    }
  };

  // 组件卸载时立即保存未同步的数据
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        // 同步保存
        if (localChecklist) storage.updateBrandChecklist(id!, localChecklist).catch(() => {});
        if (localTimeline) storage.updateBrandTimeline(id!, localTimeline).catch(() => {});
      }
    };
  }, [id, localChecklist, localTimeline]);

  if (!project) return <div style={{ padding: 24 }}>项目不存在</div>;
  if (!localChecklist || !localTimeline) return <div style={{ padding: 24 }}>加载中...</div>;

  // 使用本地 state 计算统计，不依赖 project.brandChecklist
  const allFields = getAllFields();
  const filledCount = allFields.filter(f => localChecklist[f.id]?.trim()).length;
  const checklistPct = Math.round((filledCount / allFields.length) * 100);
  const timelineCount = localTimeline.entries.length;

  const tabItems = [
    {
      key: 'checklist',
      label: (
        <Space>
          🔍 品牌自检
          <Badge
            count={filledCount}
            style={{ backgroundColor: checklistPct === 100 ? '#52c41a' : '#cf1322' }}
            overflowCount={999}
          />
          {checklistPct === 100 && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
        </Space>
      ),
      children: (
        <BrandChecklistPanel
          projectId={project.id}
          data={localChecklist}
          onUpdate={handleChecklistUpdate}
        />
      ),
    },
    {
      key: 'timeline',
      label: (
        <Space>
          📜 品牌年谱
          {timelineCount > 0 && <Tag>{timelineCount}条记录</Tag>}
        </Space>
      ),
      children: (
        <BrandTimelinePanel
          projectId={project.id}
          data={localTimeline}
          onUpdate={handleTimelineUpdate}
        />
      ),
    },
    {
      key: 'guide',
      label: (
        <Space>
          📋 填写指南
        </Space>
      ),
      children: (
        <div>
          <Alert
            message="如何填写品牌自检和品牌年谱？"
            description="这两个模块是整个服务体系的基石。填写越完整、越真实，后续六大引擎的AI生成内容越精准、越有价值。"
            type="success"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <Card title="🔍 品牌自检填写指南" style={{ marginBottom: 16 }}>
            <Paragraph>
              <Text strong>填写方式：</Text>可以分次填写，系统自动保存。已填写的字段边框会变为绿色。
            </Paragraph>
            <Paragraph>
              <Text strong>AI辅助：</Text>点击"AI一键补全"，AI将基于已填写的信息进行联网搜索，为空字段生成参考建议。
            </Paragraph>
            <Paragraph>
              <Text strong>修改权限：</Text>支持随时修改、补充。建议在每次深度沟通后及时更新。
            </Paragraph>
            <Divider />
            <Text strong>各板块重点提示：</Text>
            <ul>
              <li><Text strong>企业基础信息</Text> — 影响竞争分析和组织引擎</li>
              <li><Text strong>产品与业务</Text> — 影响战略定位和产品卖点体系</li>
              <li><Text strong>客户与市场</Text> — 影响竞争分析和营销策略</li>
              <li><Text strong>品牌现状</Text> — 影响亮形象引擎和品牌识别系统</li>
              <li><Text strong>空间与体验</Text> — 影响亮空间引擎</li>
              <li><Text strong>合作期待与目标</Text> — 影响服务定制和策略方向</li>
            </ul>
          </Card>

          <Card title="📜 品牌年谱填写指南" style={{ marginBottom: 16 }}>
            <Paragraph>
              <Text strong>填写方式：</Text>按照时间线添加品牌发展中的关键事件，标注类型（里程碑/做对了/做错了等）。
            </Paragraph>
            <Paragraph>
              <Text strong>AI辅助：</Text>点击"AI联网搜索补全年谱"，AI将基于品牌名称和行业信息联网搜索，自动生成年谱建议。
            </Paragraph>
            <Paragraph>
              <Text strong>沟通建议：</Text>建议在与客户的深度沟通中，逐段梳理以下引导问题：
            </Paragraph>
            <Divider />
            {Object.entries(TIMELINE_GUIDE_QUESTIONS).map(([phase, questions]) => (
              <div key={phase} style={{ marginBottom: 16 }}>
                <Text strong>
                  {phase === 'origin' ? '🌟 创始阶段' :
                   phase === 'growth' ? '📈 发展阶段' :
                   phase === 'current' ? '🎯 当前状态' :
                   '🔮 未来展望'}
                </Text>
                <ul style={{ marginTop: 4 }}>
                  {questions.map((q, i) => (
                    <li key={i}><Text type="secondary">{q}</Text></li>
                  ))}
                </ul>
              </div>
            ))}
          </Card>

          <Card title="🔗 数据流向说明" style={{ marginBottom: 16 }}>
            <Paragraph>
              品牌自检和品牌年谱填写完成后，其数据将作为<strong>第一参考信息源</strong>自动注入到以下场景：
            </Paragraph>
            <Row gutter={[16, 16]}>
              {['亮竞争', '亮战略', '亮形象', '亮空间', '亮营销', '亮组织'].map(engine => (
                <Col xs={12} sm={8} key={engine}>
                  <Card size="small" style={{ textAlign: 'center', border: '1px solid #f0f0f0' }}>
                    <div style={{ fontWeight: 600 }}>{engine}</div>
                    <Text type="secondary" style={{ fontSize: 11 }}>AI生成时自动参考</Text>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/projects/${project.id}`)} style={{ marginBottom: 16 }}>
        返回项目
      </Button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>🚀 启动阶段工作台</Title>
          <Text type="secondary">{project.name} — 品牌自检与年谱梳理</Text>
        </div>
        <Space>
          <Tag color={checklistPct === 100 && timelineCount > 0 ? 'green' : 'blue'}>
            自检 {checklistPct}% · 年谱 {timelineCount}条
          </Tag>
          <Button icon={<SaveOutlined />} onClick={handleSave}>手动保存</Button>
        </Space>
      </div>

      <Tabs items={tabItems} defaultActiveKey="checklist" />
    </div>
  );
}
