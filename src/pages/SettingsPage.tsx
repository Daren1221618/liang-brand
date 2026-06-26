// ============================================================
// 亮品牌 · 系统设置页面（6 个 Tab）
// 仅管理员可访问
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  Tabs, Card, Form, Input, InputNumber, Switch, Button, ColorPicker,
  Select, Space, message, Modal, Typography, Divider, Row, Col, Tag, Spin, Tooltip,
} from 'antd';
import {
  SaveOutlined, UndoOutlined, ApiOutlined, ExperimentOutlined,
  BookOutlined, DollarOutlined, SettingOutlined,
  TeamOutlined, FontSizeOutlined,
} from '@ant-design/icons';
import {
  getAllSettings, updateSettings, testAIConnection, resetSettingsCategory, uploadLogo,
} from '../settings';
import { applyThemeCSS } from '../theme';
import type { SettingItem } from '../settings';
import { useApp } from '../context';
import AIUsageStats from '../components/AIUsageStats';

const { Title, Text } = Typography;

const CATEGORIES = [
  { key: 'brand', label: '品牌主题', icon: <FontSizeOutlined /> },
  { key: 'ai', label: 'AI 模型', icon: <ApiOutlined /> },
  { key: 'knowledge', label: '知识库', icon: <BookOutlined /> },
  { key: 'package', label: '套餐定价', icon: <DollarOutlined /> },
  { key: 'engine', label: '引擎颜色', icon: <ExperimentOutlined /> },
  { key: 'role', label: '角色颜色', icon: <TeamOutlined /> },
] as const;

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allSettings, setAllSettings] = useState<SettingItem[]>([]);
  const [activeTab, setActiveTab] = useState('brand');
  const { refreshPublicSettings } = useApp();

  // 加载设置
  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllSettings();
      setAllSettings(data);
    } catch (err: any) {
      message.error(err.message || '加载设置失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  // 按分类获取设置
  const getCatSettings = (category: string): SettingItem[] => {
    return allSettings.filter(s => s.category === category);
  };

  // 获取原始值
  const getVal = (key: string): string => {
    const item = allSettings.find(s => s.key === key);
    return item?.rawValue ?? '';
  };

  // 保存
  const handleSave = async (category: string, values: Record<string, any>) => {
    setSaving(true);
    try {
      const settings: Record<string, string> = {};
      for (const [key, value] of Object.entries(values)) {
        if (value && typeof value === 'object' && 'toHexString' in value) {
          settings[key] = (value as any).toHexString();
        } else if (typeof value === 'boolean') {
          settings[key] = String(value);
        } else if (typeof value === 'number') {
          settings[key] = String(value);
        } else {
          settings[key] = String(value ?? '');
        }
      }
      await updateSettings(settings, category);

      // 重新加载最新设置（allSettings 状态是异步的，不能直接用）
      const latestSettings = await getAllSettings();
      setAllSettings(latestSettings);
      message.success('设置已保存');

      // 刷新全局设置缓存（套餐名称等公开设置立即生效）
      await refreshPublicSettings();

      // 如果更新了品牌/主题色/引擎色/角色色，用最新数据重新注入 CSS 变量
      if (['brand', 'theme', 'engine', 'role'].includes(category)) {
        const themeSettings: Record<string, string> = {};
        for (const item of latestSettings) {
          if (['brand', 'theme', 'engine', 'role'].includes(item.category)) {
            themeSettings[item.key] = item.rawValue;
          }
        }
        applyThemeCSS(themeSettings);
      }
    } catch (err: any) {
      message.error(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 重置
  const handleReset = (category: string) => {
    const label = CATEGORIES.find(c => c.key === category)?.label || category;
    Modal.confirm({
      title: `重置${label}`,
      content: `确定要将"${label}"恢复为默认值吗？此操作不可撤销。`,
      okText: '确认重置',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await resetSettingsCategory(category);
          message.success(`${label}已重置为默认值`);
          await loadSettings();
        } catch (err: any) {
          message.error(err.message || '重置失败');
        }
      },
    });
  };

  // 测试 AI 连通性
  const handleTestAI = async (provider: string, apiKey: string, baseUrl?: string, model?: string) => {
    try {
      const result = await testAIConnection({ provider, apiKey, baseUrl, model });
      if (result.success) {
        message.success(result.message);
      } else {
        message.warning(result.message);
      }
    } catch (err: any) {
      message.error(err.message || '测试失败');
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}><Spin size="large" tip="加载设置中..." /></div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={4} style={{ margin: 0 }}>
          <SettingOutlined /> 系统设置
        </Title>
        <Text type="secondary">管理系统的全局配置，修改后即时生效</Text>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card"
        items={CATEGORIES.map(cat => ({
          key: cat.key,
          label: <span>{cat.icon} {cat.label}</span>,
          children: (
            <Card>
              {cat.key === 'brand' && <BrandThemeTab settings={getCatSettings('brand').concat(getCatSettings('theme'))} getVal={getVal} onSave={handleSave} onReset={handleReset} saving={saving} onAfterUpload={async () => { await loadSettings(); await refreshPublicSettings(); }} />}
              {cat.key === 'ai' && <AITab settings={getCatSettings('ai')} getVal={getVal} onSave={handleSave} onReset={handleReset} saving={saving} onTestAI={handleTestAI} />}
              {cat.key === 'knowledge' && <KnowledgeTab settings={getCatSettings('knowledge')} getVal={getVal} onSave={handleSave} onReset={handleReset} saving={saving} />}
              {cat.key === 'package' && <PackageTab settings={getCatSettings('package')} getVal={getVal} onSave={handleSave} onReset={handleReset} saving={saving} />}
              {cat.key === 'engine' && <EngineColorTab settings={getCatSettings('engine')} getVal={getVal} onSave={handleSave} onReset={handleReset} saving={saving} />}
              {cat.key === 'role' && <RoleColorTab settings={getCatSettings('role')} getVal={getVal} onSave={handleSave} onReset={handleReset} saving={saving} />}
            </Card>
          ),
        }))}
      />
    </div>
  );
}

// ========== 品牌主题 Tab ==========
function BrandThemeTab({ settings, getVal, onSave, onReset, saving, onAfterUpload }: {
  settings: SettingItem[]; getVal: (k: string) => string;
  onSave: (cat: string, values: Record<string, any>) => Promise<void>;
  onReset: (cat: string) => void; saving: boolean;
  onAfterUpload: () => Promise<void>;
}) {
  const [form] = Form.useForm();

  // 构建 formValues（从最新 settings 同步）
  const formValues: Record<string, any> = {};
  for (const s of settings) {
    if (s.key.startsWith('theme.') && s.value.match(/^#[0-9a-fA-F]{3,8}$/)) {
      formValues[s.key] = s.value;
    } else {
      formValues[s.key] = s.rawValue;
    }
  }

  // settings 变化时同步到 Form（处理异步加载和保存后刷新）
  React.useEffect(() => {
    if (Object.keys(formValues).length > 0) {
      form.setFieldsValue(formValues);
    }
  }, [form, settings]);

  return (
    <Form form={form} initialValues={formValues} layout="vertical" onFinish={(values) => onSave('theme', values)}>
      <Row gutter={[24, 16]}>
        <Col xs={24} md={12}>
          <Title level={5}>品牌信息</Title>
          <Form.Item name="brand.name" label="品牌名称">
            <Input maxLength={20} />
          </Form.Item>
          <Form.Item name="brand.company" label="公司全称">
            <Input />
          </Form.Item>
          <Form.Item name="brand.systemTitle" label="系统副标题">
            <Input />
          </Form.Item>
          <Form.Item name="brand.logo" label="Logo（文字或 Emoji）">
            <Input maxLength={4} style={{ width: 120 }} />
          </Form.Item>
          <Form.Item label="Logo 图片上传">
            <Space align="center" wrap>
              {getVal('brand.logo')?.startsWith('/uploads/') && (
                <img src={getVal('brand.logo')} alt="Logo" style={{ height: 36, maxWidth: 120, objectFit: 'contain', borderRadius: 4, border: '1px solid #d9d9d9' }} />
              )}
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.svg,.webp,.gif,.ico"
                style={{ display: 'none' }}
                ref={(el) => { (window as any).__logoInput = el; }}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const res = await uploadLogo(file);
                    message.success(res.message);
                    await onAfterUpload();
                  } catch (err: any) {
                    message.error(err.message || '上传失败');
                  }
                  e.target.value = '';
                }}
              />
              <Button
                size="small"
                onClick={() => (window as any).__logoInput?.click()}
              >
                <SaveOutlined /> 上传图片
              </Button>
              {getVal('brand.logo')?.startsWith('/uploads/') && (
                <Button
                  size="small"
                  danger
                  onClick={() => onSave('theme', { 'brand.logo': '✦' })}
                >
                  恢复默认
                </Button>
              )}
            </Space>
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>上传后将替换文字 Logo，支持 PNG/JPG/SVG/WebP/GIF/ICO，最大 2MB</div>
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Title level={5}>主题颜色</Title>
          <Form.Item name="theme.primaryColor" label="主色调">
            <ColorPicker showText format="hex" />
          </Form.Item>
          <Divider orientation="left" plain style={{ margin: '8px 0 16px' }}>侧边栏渐变</Divider>
          <Row gutter={12}>
            <Col xs={24} sm={12}>
              <Form.Item name="theme.siderGradientStart" label="起始色">
                <ColorPicker showText format="hex" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="theme.siderGradientEnd" label="结束色">
                <ColorPicker showText format="hex" />
              </Form.Item>
            </Col>
          </Row>
          <Divider orientation="left" plain style={{ margin: '8px 0 16px' }}>登录页渐变</Divider>
          <Row gutter={12}>
            <Col xs={24} sm={8}>
              <Form.Item name="theme.loginGradientStart" label="起始色">
                <ColorPicker showText format="hex" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="theme.loginGradientMid" label="中间色">
                <ColorPicker showText format="hex" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="theme.loginGradientEnd" label="结束色">
                <ColorPicker showText format="hex" />
              </Form.Item>
            </Col>
          </Row>
        </Col>
      </Row>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
        <Button icon={<UndoOutlined />} onClick={() => { onReset('theme'); onReset('brand'); }}>重置默认</Button>
        <Button type="primary" icon={<SaveOutlined />} htmlType="submit" loading={saving}>保存设置</Button>
      </div>
    </Form>
  );
}

// ========== AI 模型 Tab ==========
function AITab({ settings, getVal, onSave, onReset, saving, onTestAI }: {
  settings: SettingItem[]; getVal: (k: string) => string;
  onSave: (cat: string, values: Record<string, any>) => Promise<void>;
  onReset: (cat: string) => void; saving: boolean;
  onTestAI: (p: string, k: string, b?: string, m?: string) => Promise<void>;
}) {
  const [form] = Form.useForm();
  const formValues: Record<string, any> = {};
  for (const s of settings) {
    if (s.key.endsWith('.enabled')) {
      formValues[s.key] = s.rawValue === 'true';
    } else {
      formValues[s.key] = s.rawValue;
    }
  }

  React.useEffect(() => {
    if (Object.keys(formValues).length > 0) {
      form.setFieldsValue(formValues);
    }
  }, [form, settings]);

  const providers = [
    { prefix: 'ai.deepseek', label: 'DeepSeek', color: '#4d6bfe', modelKey: 'ai.deepseek.defaultModel', reasoningKey: 'ai.deepseek.reasoningModel' },
    { prefix: 'ai.doubao', label: '豆包 (Doubao)', color: '#2979ff', modelKey: 'ai.doubao.defaultModel' },
    { prefix: 'ai.qwen', label: '通义千问 (Qwen)', color: '#ff6a00', modelKey: 'ai.qwen.defaultModel', imageModelKey: 'ai.qwen.imageModel' },
  ];

  return (<>
    <Form form={form} initialValues={formValues} layout="vertical" onFinish={(values) => onSave('ai', values)}>
      {providers.map(p => (
        <Card key={p.prefix} size="small" style={{ marginBottom: 16 }} title={
          <Space wrap>
            <Tag color={p.color}>{p.label}</Tag>
            <Form.Item name={`${p.prefix}.enabled`} valuePropName="checked" noStyle>
              <Switch checkedChildren="启用" unCheckedChildren="关闭" />
            </Form.Item>
          </Space>
        }>
          <Row gutter={[16, 8]}>
            <Col xs={24} md={12}>
              <Form.Item name={`${p.prefix}.apiKey`} label="API Key">
                <Input.Password placeholder="sk-..." />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name={`${p.prefix}.baseUrl`} label="API 地址">
                <Input placeholder="https://api..." />
              </Form.Item>
            </Col>
            <Col xs={12} md={8}>
              <Form.Item name={p.modelKey} label="默认模型">
                <Input />
              </Form.Item>
            </Col>
            {p.reasoningKey && (
              <Col xs={12} md={8}>
                <Form.Item name={p.reasoningKey} label="推理模型">
                  <Input />
                </Form.Item>
              </Col>
            )}
            {p.imageModelKey && (
              <Col xs={12} md={8}>
                <Form.Item name={p.imageModelKey} label="图像模型">
                  <Input />
                </Form.Item>
              </Col>
            )}
            <Col xs={24} md={8} style={{ display: 'flex', alignItems: 'flex-end' }}>
              <Button
                onClick={() => {
                  const apiKey = form.getFieldValue(`${p.prefix}.apiKey`);
                  const baseUrl = form.getFieldValue(`${p.prefix}.baseUrl`);
                  const model = form.getFieldValue(p.modelKey);
                  if (!apiKey) { message.warning('请先输入 API Key'); return; }
                  onTestAI(p.prefix.split('.')[1], apiKey, baseUrl, model);
                }}
              >
                <ApiOutlined /> 测试连通性
              </Button>
            </Col>
          </Row>
        </Card>
      ))}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
        <Button icon={<UndoOutlined />} onClick={() => onReset('ai')}>重置默认</Button>
        <Button type="primary" icon={<SaveOutlined />} htmlType="submit" loading={saving}>保存设置</Button>
      </div>
    </Form>

    <div style={{ marginTop: 24 }}>
      <Card title="Token 用量统计" size="small">
        <AIUsageStats />
      </Card>
    </div>
  </>);
}

// ========== 知识库 Tab ==========
function KnowledgeTab({ settings, getVal, onSave, onReset, saving }: {
  settings: SettingItem[]; getVal: (k: string) => string;
  onSave: (cat: string, values: Record<string, any>) => Promise<void>;
  onReset: (cat: string) => void; saving: boolean;
}) {
  const [form] = Form.useForm();
  const formValues: Record<string, any> = {};
  for (const s of settings) {
    formValues[s.key] = Number(s.rawValue);
  }

  React.useEffect(() => {
    if (Object.keys(formValues).length > 0) {
      form.setFieldsValue(formValues);
    }
  }, [form, settings]);

  return (
    <Form form={form} initialValues={formValues} layout="vertical" onFinish={(values) => onSave('knowledge', values)}>
      <Row gutter={[24, 16]}>
        <Col xs={24} md={8}>
          <Form.Item name="knowledge.maxFileSize" label="单文件大小上限（MB）" extra="超出此大小的文件将无法上传">
            <InputNumber min={1} max={524288000} addonAfter="字节" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="knowledge.maxBatchCount" label="批量上传文件数上限">
            <InputNumber min={1} max={100} style={{ width: '100%' }} addonAfter="个" />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="knowledge.maxTextLength" label="文本提取字符上限">
            <InputNumber min={1000} max={100000} step={1000} style={{ width: '100%' }} addonAfter="字符" />
          </Form.Item>
        </Col>
      </Row>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
        <Button icon={<UndoOutlined />} onClick={() => onReset('knowledge')}>重置默认</Button>
        <Button type="primary" icon={<SaveOutlined />} htmlType="submit" loading={saving}>保存设置</Button>
      </div>
    </Form>
  );
}

// ========== 套餐定价 Tab ==========
function PackageTab({ settings, getVal, onSave, onReset, saving }: {
  settings: SettingItem[]; getVal: (k: string) => string;
  onSave: (cat: string, values: Record<string, any>) => Promise<void>;
  onReset: (cat: string) => void; saving: boolean;
}) {
  const [form] = Form.useForm();
  const formValues: Record<string, any> = {};
  for (const s of settings) {
    if (s.key.endsWith('.price') || s.key.endsWith('.months')) {
      formValues[s.key] = Number(s.rawValue);
    } else {
      formValues[s.key] = s.rawValue;
    }
  }

  React.useEffect(() => {
    if (Object.keys(formValues).length > 0) {
      form.setFieldsValue(formValues);
    }
  }, [form, settings]);

  const packages = [
    { prefix: 'package.set_sail', label: '起航计划', color: '#52c41a' },
    { prefix: 'package.navigate', label: '领航计划', color: '#1890ff' },
    { prefix: 'package.voyage', label: '远航计划', color: '#722ed1' },
  ];

  return (
    <Form form={form} initialValues={formValues} layout="vertical" onFinish={(values) => onSave('package', values)}>
      <Row gutter={[24, 16]}>
        {packages.map(pkg => (
          <Col xs={24} md={8} key={pkg.prefix}>
            <Card size="small" title={<Tag color={pkg.color}>{getVal(`${pkg.prefix}.name`) || pkg.label}</Tag>}>
              <Form.Item name={`${pkg.prefix}.name`} label="套餐名称">
                <Input placeholder="套餐名称" maxLength={30} />
              </Form.Item>
              <Form.Item name={`${pkg.prefix}.description`} label="套餐说明">
                <Input.TextArea rows={3} placeholder="套餐说明文本" maxLength={200} showCount />
              </Form.Item>
              <Form.Item name={`${pkg.prefix}.price`} label="价格（元）">
                <InputNumber min={0} step={10000} style={{ width: '100%' }} addonBefore="¥" />
              </Form.Item>
              <Form.Item name={`${pkg.prefix}.months`} label="服务月数">
                <InputNumber min={1} max={36} style={{ width: '100%' }} addonAfter="个月" />
              </Form.Item>
            </Card>
          </Col>
        ))}
      </Row>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
        <Button icon={<UndoOutlined />} onClick={() => onReset('package')}>重置默认</Button>
        <Button type="primary" icon={<SaveOutlined />} htmlType="submit" loading={saving}>保存设置</Button>
      </div>
    </Form>
  );
}

// ========== 引擎颜色 Tab ==========
function EngineColorTab({ settings, getVal, onSave, onReset, saving }: {
  settings: SettingItem[]; getVal: (k: string) => string;
  onSave: (cat: string, values: Record<string, any>) => Promise<void>;
  onReset: (cat: string) => void; saving: boolean;
}) {
  const [form] = Form.useForm();
  const formValues: Record<string, any> = {};
  for (const s of settings) formValues[s.key] = s.value;

  React.useEffect(() => {
    if (Object.keys(formValues).length > 0) {
      form.setFieldsValue(formValues);
    }
  }, [form, settings]);

  const engines = [
    { key: 'engine.competition.color', label: '🏆 亮竞争' },
    { key: 'engine.strategy.color', label: '🧭 亮战略' },
    { key: 'engine.image.color', label: '🎭 亮形象' },
    { key: 'engine.space.color', label: '🏗️ 亮空间' },
    { key: 'engine.marketing.color', label: '📢 亮营销' },
    { key: 'engine.organization.color', label: '👥 亮组织' },
  ];

  return (
    <Form form={form} initialValues={formValues} layout="vertical" onFinish={(values) => onSave('engine', values)}>
      <Row gutter={[24, 16]}>
        {engines.map(e => (
          <Col xs={12} md={8} key={e.key}>
            <Form.Item name={e.key} label={e.label}>
              <ColorPicker showText format="hex" />
            </Form.Item>
          </Col>
        ))}
      </Row>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
        <Button icon={<UndoOutlined />} onClick={() => onReset('engine')}>重置默认</Button>
        <Button type="primary" icon={<SaveOutlined />} htmlType="submit" loading={saving}>保存设置</Button>
      </div>
    </Form>
  );
}

// ========== 角色颜色 Tab ==========
function RoleColorTab({ settings, getVal, onSave, onReset, saving }: {
  settings: SettingItem[]; getVal: (k: string) => string;
  onSave: (cat: string, values: Record<string, any>) => Promise<void>;
  onReset: (cat: string) => void; saving: boolean;
}) {
  const [form] = Form.useForm();
  const formValues: Record<string, any> = {};
  for (const s of settings) formValues[s.key] = s.value;

  React.useEffect(() => {
    if (Object.keys(formValues).length > 0) {
      form.setFieldsValue(formValues);
    }
  }, [form, settings]);

  const roles = [
    { key: 'role.admin.color', label: '👑 管理员' },
    { key: 'role.consultant.color', label: '💼 咨询顾问' },
    { key: 'role.strategist.color', label: '🎯 策略师' },
    { key: 'role.designer.color', label: '🎨 设计师' },
    { key: 'role.pm.color', label: '📋 项目经理' },
  ];

  return (
    <Form form={form} initialValues={formValues} layout="vertical" onFinish={(values) => onSave('role', values)}>
      <Row gutter={[24, 16]}>
        {roles.map(r => (
          <Col xs={12} md={8} key={r.key}>
            <Form.Item name={r.key} label={r.label}>
              <ColorPicker showText format="hex" />
            </Form.Item>
          </Col>
        ))}
      </Row>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
        <Button icon={<UndoOutlined />} onClick={() => onReset('role')}>重置默认</Button>
        <Button type="primary" icon={<SaveOutlined />} htmlType="submit" loading={saving}>保存设置</Button>
      </div>
    </Form>
  );
}
