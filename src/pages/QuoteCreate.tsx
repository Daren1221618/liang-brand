// ============================================================
// 亮品牌 · 意向服务计划首页
// 完整流程：选客户 → 选计划 → 进入服务内容配置
// ============================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Typography, Card, Row, Col, Form, Input, Select, Button, Space,
  Tag, message, Alert, Divider,
} from 'antd';
import {
  ArrowLeftOutlined, RightOutlined, EditOutlined,
  StarOutlined, RocketOutlined, CompassOutlined,
  CustomerServiceOutlined, PhoneOutlined, UserOutlined,
} from '@ant-design/icons';
import { useApp } from '../context';
import { PACKAGE_PRESETS, ServiceEngine } from '../serviceTree';
import { getPackageSetting } from '../theme';

const { Title, Text, Paragraph } = Typography;

export default function QuoteCreate() {
  const { customerId: urlCustomerId } = useParams<{ customerId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { customers, refresh, publicSettings } = useApp();

  // Customer state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(urlCustomerId || '');
  const selectedCustomer = selectedCustomerId ? customers.find(c => c.id === selectedCustomerId) : null;

  // Plan selection
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    if (urlCustomerId) setSelectedCustomerId(urlCustomerId);
  }, [urlCustomerId]);

  const handleNext = () => {
    if (!selectedCustomerId) {
      message.warning('请先选择或新建客户');
      return;
    }
    if (!selectedPlan) {
      message.warning('请选择服务计划');
      return;
    }

    const customer = customers.find(c => c.id === selectedCustomerId);
    if (!customer) {
      message.error('客户不存在');
      return;
    }

    const state = {
      customerId: customer.id,
      customerInfo: {
        company: customer.company,
        contact: customer.name,
        phone: customer.phone,
        wechat: customer.wechat,
        email: customer.email,
        industry: customer.industry,
      },
    };

    if (selectedPlan === 'custom') {
      navigate(`/quotes/new/custom?customerId=${customer.id}`, { state });
    } else {
      navigate(`/quotes/new/package/${selectedPlan}?customerId=${customer.id}`, { state });
    }
  };

  const plans = [
    {
      id: 'custom',
      name: '定制服务计划',
      icon: <EditOutlined style={{ fontSize: 28 }} />,
      color: '#722ed1',
      description: '根据客户需求灵活选择服务模块，自由组合品牌服务内容',
      detail: '可选择任意服务板块、父项、子项，支持新增自定义条目，价格和工期可编辑。',
      tag: '最灵活',
    },
    ...PACKAGE_PRESETS.map(p => {
      const ps = getPackageSetting(publicSettings, p.id);
      return {
        id: p.id,
        name: ps?.name || p.name,
        icon: p.id === 'navigate' ? <StarOutlined style={{ fontSize: 28 }} /> : <RocketOutlined style={{ fontSize: 28 }} />,
        color: p.id === 'navigate' ? '#cf1322' : '#faad14',
        description: ps?.description || p.description,
        detail: ps?.description || p.descriptionDetail,
        tag: `${ps?.months || p.months}个月`,
        price: ps?.price || p.basePrice,
      };
    }),
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '16px',
    }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            style={{ marginBottom: 16, color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
            ghost
          >返回</Button>
          <Title level={2} style={{ color: '#fff', margin: 0 }}>意向服务计划</Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15, marginTop: 4 }}>
            请选择客户，再选择服务计划类型，进入服务内容定制
          </Paragraph>
        </div>

        {/* Step 1: 客户选择 */}
        <Card style={{ marginBottom: 20, borderRadius: 12 }} title={
          <Space>
            <span style={{ background: '#cf1322', color: '#fff', borderRadius: '50%', width: 24, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>1</span>
            <span>选择客户</span>
          </Space>
        }>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <div style={{ marginBottom: 8, fontWeight: 500, fontSize: 14 }}>关联客户</div>
              <Select
                showSearch
                size="large"
                placeholder="搜索并选择客户"
                style={{ width: '100%' }}
                value={selectedCustomerId || undefined}
                onChange={v => setSelectedCustomerId(v)}
                optionFilterProp="label"
                options={customers.map(c => ({
                  value: c.id,
                  label: `${c.company} (${c.name})`,
                }))}
                filterOption={(input, option) =>
                  (option?.label?.toLowerCase() || '').includes(input.toLowerCase())
                }
              />
              <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                共 {customers.length} 个客户可关联
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div style={{ marginBottom: 8, fontWeight: 500, fontSize: 14 }}>客户信息预览</div>
              {selectedCustomer ? (
                <div style={{ padding: '12px 16px', background: '#f6ffed', borderRadius: 8, border: '1px solid #b7eb8f' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 13 }}>
                    <div><Text type="secondary">公司：</Text>{selectedCustomer.company}</div>
                    <div><Text type="secondary">联系人：</Text>{selectedCustomer.name}</div>
                    <div><Text type="secondary">行业：</Text>{selectedCustomer.industry}</div>
                    <div><Text type="secondary">电话：</Text>{selectedCustomer.phone || '-'}</div>
                    <div><Text type="secondary">微信：</Text>{selectedCustomer.wechat || '-'}</div>
                    <div><Text type="secondary">邮箱：</Text>{selectedCustomer.email || '-'}</div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '24px 16px', background: '#fafafa', borderRadius: 8, textAlign: 'center', color: '#bbb' }}>
                  请先选择一个客户
                </div>
              )}
            </Col>
          </Row>
          {!selectedCustomerId && customers.length === 0 && (
            <Alert
              message="还没有客户？请先到客户管理页面创建客户"
              type="info"
              showIcon
              action={<Button size="small" onClick={() => navigate('/customers')}>前往创建</Button>}
              style={{ marginTop: 12 }}
            />
          )}
        </Card>

        {/* Step 2: 计划选择 */}
        <Card style={{ marginBottom: 20, borderRadius: 12 }} title={
          <Space>
            <span style={{ background: '#cf1322', color: '#fff', borderRadius: '50%', width: 24, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>2</span>
            <span>选择服务计划</span>
          </Space>
        }>
          <Row gutter={[16, 16]}>
            {plans.map(plan => {
              const isSelected = selectedPlan === plan.id;
              return (
            <Col xs={24} md={8} key={plan.id}>
              <Card
                hoverable
                onClick={() => setSelectedPlan(plan.id)}
                style={{
                      borderRadius: 12,
                      border: isSelected ? `2px solid ${plan.color}` : '2px solid transparent',
                      background: isSelected ? `linear-gradient(135deg, ${plan.color}08, ${plan.color}15)` : '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      height: '100%',
                    }}
                    bodyStyle={{ padding: 24 }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div style={{
                        width: 56, height: 56, borderRadius: 12,
                        background: `${plan.color}12`, color: plan.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {plan.icon}
                      </div>
                      <Tag color={plan.color} style={{ fontSize: 12 }}>{plan.tag}</Tag>
                    </div>

                    <Title level={4} style={{ margin: '0 0 8px 0', color: isSelected ? plan.color : undefined }}>
                      {plan.name}
                    </Title>
                    <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 8 }}>
                      {plan.description}
                    </Paragraph>
                    <Paragraph style={{ fontSize: 12, color: '#999', marginBottom: 0 }}>
                      {plan.detail}
                    </Paragraph>

                    {plan.id !== 'custom' && (
                      <div style={{ marginTop: 16, padding: '8px 12px', background: '#fafafa', borderRadius: 8 }}>
                        <Text style={{ fontSize: 11, color: '#999' }}>参考价格</Text>
                        <div style={{ fontSize: 22, fontWeight: 700, color: plan.color }}>
                          ¥{PACKAGE_PRESETS.find(p => p.id === plan.id)?.basePrice.toLocaleString()}
                        </div>
                      </div>
                    )}
                  </Card>
                </Col>
              );
            })}
          </Row>
        </Card>

        {/* Next Button */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Button
            type="primary"
            size="large"
            icon={<RightOutlined />}
            onClick={handleNext}
            disabled={!selectedCustomerId || !selectedPlan}
            style={{
              height: 48, paddingInline: 48, borderRadius: 24,
              fontSize: 16, fontWeight: 600,
              background: (selectedCustomerId && selectedPlan) ? 'linear-gradient(135deg, #667eea, #764ba2)' : undefined,
              border: 'none',
            }}
          >
            进入服务内容配置
          </Button>
        </div>

        {/* 公司信息 */}
        <div style={{ textAlign: 'center', marginTop: 48, color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
          <div>长沙敬亮品牌策划有限公司</div>
          <div>品牌亮点体系理论和操作方法的发明者</div>
        </div>
      </div>
    </div>
  );
}
