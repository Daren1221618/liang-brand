// ============================================================
// 亮品牌 · 客户详情
// ============================================================

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Descriptions, Tag, Button, Space, Typography, Tabs,
  Modal, Form, Input, Select, Timeline, message, Row, Col, Divider,
  Table, Steps,
} from 'antd';
import {
  ArrowLeftOutlined, EditOutlined, PlusOutlined,
  DollarOutlined, CheckCircleOutlined, CloseCircleOutlined,
  ProjectOutlined, FileTextOutlined, ExportOutlined, PrinterOutlined,
  SendOutlined, ReloadOutlined, ExclamationCircleOutlined, EyeOutlined,
} from '@ant-design/icons';
import { useApp } from '../context';
import * as storage from '../storage';
import { CUSTOMER_STAGE_LABELS, CustomerStage } from '../types';
import { generateQuoteHTML } from '../quoteExport';
import { SERVICE_TREE } from '../serviceTree';
import { getPackageName } from '../theme';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

const STAGE_COLORS: Record<string, string> = {
  intention: 'blue', quoting: 'orange', negotiating: 'purple', signed: 'green', lost: 'default',
};

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { customers, quotes, projects, refresh, publicSettings } = useApp();
  const [editModal, setEditModal] = useState(false);
  const [form] = Form.useForm();

  const customer = customers.find(c => c.id === id);
  if (!customer) return <div style={{ padding: 24 }}>客户不存在</div>;

  const customerQuotes = quotes.filter(q => q.customerId === customer.id);
  const customerProjects = projects.filter(p => p.customerId === customer.id);
  const [formInstance] = Form.useForm();

  const handleUpdateStage = (stage: CustomerStage) => {
    storage.updateCustomer(customer.id, { stage });
    refresh();
    message.success('阶段已更新');
  };

  const handleUpdateCustomer = (values: any) => {
    storage.updateCustomer(customer.id, values);
    refresh();
    setEditModal(false);
    message.success('客户信息已更新');
  };

  const stages: CustomerStage[] = ['intention', 'quoting', 'negotiating', 'signed'];
  const currentStageIdx = stages.indexOf(customer.stage);

  return (
    <div className="page-container">
      <div style={{ marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/customers')} style={{ marginBottom: 16 }}>返回客户列表</Button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>{customer.company}</Title>
            <Text type="secondary">{customer.name} · {customer.industry} · 来源：{customer.source || '未知'}</Text>
          </div>
          <Space wrap>
            <Button icon={<EditOutlined />} onClick={() => { form.setFieldsValue(customer); setEditModal(true); }}>编辑</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate(`/quotes/new?customerId=${customer.id}`)}>创建报价</Button>
            {customerProjects.length > 0 && (
              <Button icon={<ProjectOutlined />} onClick={() => navigate(`/projects/${customerProjects[0].id}`)}>
                进入项目
              </Button>
            )}
          </Space>
        </div>
      </div>

      {/* 阶段流程 */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {stages.map((stage, idx) => (
            <React.Fragment key={stage}>
              <div
                style={{
                  textAlign: 'center', cursor: 'pointer', flex: 1,
                  opacity: idx <= currentStageIdx ? 1 : 0.4,
                }}
                onClick={() => handleUpdateStage(stage)}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', margin: '0 auto 8px',
                  background: idx <= currentStageIdx ? '#cf1322' : '#eee',
                  color: idx <= currentStageIdx ? '#fff' : '#999',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 600, fontSize: 16,
                }}>
                  {idx < currentStageIdx ? '✓' : idx + 1}
                </div>
                <div style={{ fontSize: 12, fontWeight: idx === currentStageIdx ? 600 : 400 }}>
                  {CUSTOMER_STAGE_LABELS[stage]}
                </div>
              </div>
              {idx < stages.length - 1 && (
                <div style={{
                  height: 2, flex: 0.5,
                  background: idx < currentStageIdx ? '#cf1322' : '#eee',
                }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </Card>

      <Row gutter={24}>
        <Col xs={24} lg={14}>
          <Card title="客户信息" style={{ marginBottom: 24 }}>
            <Descriptions column={{ xs: 1, sm: 2 }}>
              <Descriptions.Item label="联系人">{customer.name}</Descriptions.Item>
              <Descriptions.Item label="公司">{customer.company}</Descriptions.Item>
              <Descriptions.Item label="行业">{customer.industry}</Descriptions.Item>
              <Descriptions.Item label="阶段">
                <Tag color={STAGE_COLORS[customer.stage]}>{CUSTOMER_STAGE_LABELS[customer.stage]}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="电话">{customer.phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="微信">{customer.wechat || '-'}</Descriptions.Item>
              <Descriptions.Item label="邮箱">{customer.email || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{dayjs(customer.createdAt).format('YYYY-MM-DD')}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title="关联项目" style={{ marginBottom: 24 }} extra={<Button type="link" onClick={() => navigate('/projects')}>全部项目</Button>}>
            {customerProjects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24, color: '#999' }}>
                <div style={{ marginBottom: 8 }}>暂无关联项目</div>
                <Button type="primary" size="small" onClick={() => navigate(`/quotes/new?customerId=${customer.id}`)}>创建报价开始项目</Button>
              </div>
            ) : (
              customerProjects.map(p => (
                <div key={p.id} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }} onClick={() => navigate(`/projects/${p.id}`)}>
                  <Text strong>{p.name}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(p.startAt).format('YYYY-MM-DD')} · {p.status === 'active' ? '进行中' : '已完成'}</Text>
                </div>
              ))
            )}
          </Card>

          <Card
            title="报价记录"
            extra={<Button type="link" onClick={() => navigate(`/quotes/new?customerId=${customer.id}`)}>创建报价</Button>}
          >
            {customerQuotes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24, color: '#999' }}>暂无报价</div>
            ) : (
              customerQuotes.map(q => {
                const statusLabels: Record<string, string> = { draft: '草稿', sent: '已发送', accepted: '已签约', rejected: '已拒绝' };
                const statusColors: Record<string, string> = { draft: 'default', sent: 'orange', accepted: 'green', rejected: 'red' };
                const pkgName = q.packageType === 'custom' ? '定制方案' : (getPackageName(publicSettings, q.packageType) || q.packageType);

                return (
                  <div
                    key={q.id}
                    style={{
                      padding: 12, marginBottom: 12,
                      background: '#fafafa', borderRadius: 8,
                      border: '1px solid #f0f0f0', cursor: 'default',
                    }}
                  >
                    {/* 报价头部 */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Space>
                        <FileTextOutlined style={{ color: '#cf1322' }} />
                        <Text strong>{pkgName}</Text>
                        <Tag color={statusColors[q.status]}>{statusLabels[q.status]}</Tag>
                      </Space>
                      <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(q.createdAt).format('YYYY-MM-DD')}</Text>
                    </div>

                    {/* 报价金额与工期 */}
                    <div style={{ display: 'flex', gap: 24, marginBottom: 8 }}>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>总报价</Text>
                        <div><Text strong style={{ color: '#cf1322', fontSize: 16 }}>¥{q.totalPrice.toLocaleString()}</Text></div>
                      </div>
                      {q.totalDuration && (
                        <div>
                          <Text type="secondary" style={{ fontSize: 12 }}>工期</Text>
                          <div><Text strong>{q.totalDuration} 天</Text></div>
                        </div>
                      )}
                      {q.totalSelected && (
                        <div>
                          <Text type="secondary" style={{ fontSize: 12 }}>服务项</Text>
                          <div><Text strong>{q.totalSelected} 项</Text></div>
                        </div>
                      )}
                    </div>

                    {/* 状态流程 */}
                    <Steps
                      current={['draft', 'sent', 'accepted'].indexOf(q.status)}
                      size="small"
                      style={{ marginBottom: 10 }}
                      items={[
                        { title: '草稿' },
                        { title: '已发送', status: q.status === 'rejected' ? 'error' as const : undefined },
                        { title: '已签约' },
                      ]}
                    />

                    {/* 操作按钮 */}
                    <Space wrap size="small">
                      <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/quotes/${q.id}`)}>查看详情</Button>
                      <Button size="small" icon={<EditOutlined />} onClick={() => {
                        if (q.packageType === 'custom') {
                          navigate(`/quotes/new/custom?customerId=${customer.id}&quoteId=${q.id}`);
                        } else {
                          navigate(`/quotes/new/package/${q.packageType}?customerId=${customer.id}&quoteId=${q.id}`);
                        }
                      }}>编辑服务</Button>
                      {q.status === 'draft' && (
                        <Button size="small" icon={<SendOutlined />} onClick={() => {
                          storage.updateQuote(q.id, { status: 'sent' });
                          refresh();
                          message.success('报价已发送');
                        }}>发送</Button>
                      )}
                      {q.status === 'sent' && (
                        <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => {
                          Modal.confirm({
                            title: '确认签约',
                            content: `确认与「${customer.company}」签约？`,
                            icon: <ExclamationCircleOutlined />,
                            okText: '确认签约',
                            onOk: () => {
                              storage.updateQuote(q.id, { status: 'accepted' });
                              storage.updateCustomer(customer.id, { stage: 'signed' });
                              refresh();
                              message.success('已签约');
                            },
                          });
                        }}>签约</Button>
                      )}
                      {q.status === 'rejected' && (
                        <Button size="small" icon={<ReloadOutlined />} onClick={() => {
                          storage.updateQuote(q.id, { status: 'draft' });
                          refresh();
                          message.success('已重新打开');
                        }}>重新打开</Button>
                      )}
                      {(q.items || []).length > 0 && (
                        <>
                          <Button size="small" icon={<ExportOutlined />} onClick={() => {
                            const engineSummary = (q.items || []).map(item => {
                              const engine = SERVICE_TREE.find(e => e.id === item.moduleId);
                              return {
                                engine: engine || { id: item.moduleId, name: item.moduleName, icon: '', color: '#cf1322', subtitle: '', annotation: '', slogan: '', parents: [] },
                                parents: (item.children || []).map(child => ({
                                  parent: { id: item.moduleId + '-' + child.id, name: child.name, annotation: child.annotation || '', engineType: item.moduleId, children: [], defaultPrice: 0, defaultDuration: 0 },
                                  selectedChildren: [{
                                    child: { id: child.id, name: child.name, annotation: child.annotation || '', price: child.price, duration: child.duration },
                                    state: { price: child.price, duration: child.duration },
                                  }],
                                })),
                              };
                            });
                            const html = generateQuoteHTML({
                              planName: pkgName,
                              planMonths: q.totalDuration ? Math.ceil(q.totalDuration / 30) : 6,
                              planPrice: q.basePrice,
                              customerInfo: q.customerSnapshot || { company: customer.company, contact: customer.name, phone: customer.phone, wechat: customer.wechat || '', email: customer.email || '', industry: customer.industry },
                              engineSummary,
                              additionItems: q.additionItems || [],
                              totalPrice: q.totalPrice,
                              totalDuration: q.totalDuration || 0,
                              totalSelected: q.totalSelected || 0,
                            });
                            const w = window.open('', '_blank');
                            if (w) { w.document.write(html); w.document.close(); }
                          }}>导出</Button>
                          <Button size="small" icon={<PrinterOutlined />} onClick={() => {
                            const engineSummary = (q.items || []).map(item => {
                              const engine = SERVICE_TREE.find(e => e.id === item.moduleId);
                              return {
                                engine: engine || { id: item.moduleId, name: item.moduleName, icon: '', color: '#cf1322', subtitle: '', annotation: '', slogan: '', parents: [] },
                                parents: (item.children || []).map(child => ({
                                  parent: { id: item.moduleId + '-' + child.id, name: child.name, annotation: child.annotation || '', engineType: item.moduleId, children: [], defaultPrice: 0, defaultDuration: 0 },
                                  selectedChildren: [{
                                    child: { id: child.id, name: child.name, annotation: child.annotation || '', price: child.price, duration: child.duration },
                                    state: { price: child.price, duration: child.duration },
                                  }],
                                })),
                              };
                            });
                            const html = generateQuoteHTML({
                              planName: pkgName,
                              planMonths: q.totalDuration ? Math.ceil(q.totalDuration / 30) : 6,
                              planPrice: q.basePrice,
                              customerInfo: q.customerSnapshot || { company: customer.company, contact: customer.name, phone: customer.phone, wechat: customer.wechat || '', email: customer.email || '', industry: customer.industry },
                              engineSummary,
                              additionItems: q.additionItems || [],
                              totalPrice: q.totalPrice,
                              totalDuration: q.totalDuration || 0,
                              totalSelected: q.totalSelected || 0,
                            });
                            const w = window.open('', '_blank');
                            if (w) { w.document.write(html); w.document.close(); w.print(); }
                          }}>打印</Button>
                        </>
                      )}
                    </Space>
                  </div>
                );
              })
            )}
          </Card>
        </Col>
      </Row>

      <Modal title="编辑客户" open={editModal} onCancel={() => setEditModal(false)} footer={null} width={Math.min(520, window.innerWidth - 32)}>
        <Form form={form} layout="vertical" onFinish={handleUpdateCustomer} initialValues={customer}>
          <Form.Item name="name" label="联系人" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="company" label="公司" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="industry" label="行业">
            <Select><Select.Option value="餐饮">餐饮</Select.Option><Select.Option value="零售">零售</Select.Option><Select.Option value="快消品">快消品</Select.Option><Select.Option value="教育">教育</Select.Option><Select.Option value="其他">其他</Select.Option></Select>
          </Form.Item>
          <Form.Item name="phone" label="电话" rules={[{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }]}><Input maxLength={11} /></Form.Item>
          <Form.Item name="wechat" label="微信"><Input /></Form.Item>
          <Form.Item name="email" label="邮箱" rules={[{ type: 'email', message: '请输入正确的邮箱格式' }]}><Input /></Form.Item>
          <Form.Item name="notes" label="备注"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item style={{ textAlign: 'right' }}>
            <Space><Button onClick={() => setEditModal(false)}>取消</Button><Button type="primary" htmlType="submit">保存</Button></Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
