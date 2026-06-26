// ============================================================
// 亮品牌 · 报价详情（完整清单查阅 + 编辑 + 审定 + 导出 + 打印）
// ============================================================

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Typography, Button, Space, Tag, Descriptions, Steps,
  Table, Divider, message, Modal, Row, Col,
  InputNumber, Form, Collapse,
} from 'antd';
import {
  ArrowLeftOutlined, CheckCircleOutlined, SendOutlined,
  EditOutlined, ProjectOutlined, PrinterOutlined,
  ExclamationCircleOutlined, ExportOutlined, FileTextOutlined,
  DownOutlined, ReloadOutlined,
} from '@ant-design/icons';
import { useApp } from '../context';
import * as storage from '../storage';
import type { Quote } from '../types';
import { ENGINE_CONFIG } from '../types';
import { SERVICE_TREE } from '../serviceTree';
import { generateQuoteHTML } from '../quoteExport';
import { getPackageName } from '../theme';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

export default function QuoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { quotes, customers, refresh, publicSettings } = useApp();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm] = Form.useForm();
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const quote = quotes.find(q => q.id === id);
  if (!quote) return <div style={{ padding: 24 }}>报价单不存在</div>;

  const customer = customers.find(c => c.id === quote.customerId);
  const customerInfo = quote.customerSnapshot || (customer ? {
    company: customer.company, contact: customer.name,
    phone: customer.phone, wechat: customer.wechat || '',
    email: customer.email || '', industry: customer.industry,
  } : { company: '', contact: '', phone: '', wechat: '', email: '', industry: '' });

  const pkgName = quote.packageType === 'custom' ? '定制服务计划' :
    (getPackageName(publicSettings, quote.packageType) || quote.packageType);

  const statusSteps = ['draft', 'sent', 'accepted', 'rejected'];
  const statusLabels: Record<string, string> = { draft: '草稿', sent: '已发送', accepted: '已签约', rejected: '已拒绝' };
  const currentStep = statusSteps.indexOf(quote.status);

  // ---- 状态变更（审定） ----
  const handleStatusChange = (status: Quote['status']) => {
    Modal.confirm({
      title: status === 'accepted' ? '确认签约' : status === 'rejected' ? '确认拒绝' : '确认发送',
      icon: <ExclamationCircleOutlined />,
      content: status === 'accepted'
        ? `确认与「${quote.customerName}」签约？签约后客户状态将更新为"已签约"。`
        : status === 'rejected'
        ? `确认拒绝「${quote.customerName}」的报价？`
        : `确认将报价发送给「${quote.customerName}」？`,
      okText: '确认',
      okButtonProps: status === 'rejected' ? { danger: true } : {},
      cancelText: '取消',
      onOk: () => {
        storage.updateQuote(quote.id, { status });
        if (status === 'accepted' && customer) {
          storage.updateCustomer(customer.id, { stage: 'signed' });
        }
        refresh();
        message.success(statusLabels[status]);
      },
    });
  };

  // ---- 编辑报价（费用调整） ----
  const handleEditOpen = () => {
    editForm.setFieldsValue({
      discount: quote.discount,
      taxRate: quote.taxRate,
      travelBudget: quote.travelBudget,
      thirdPartyBudget: quote.thirdPartyBudget,
    });
    setEditModalOpen(true);
  };

  const handleEditSave = async () => {
    try {
      const values = await editForm.validateFields();
      const discount = values.discount || 0;
      const taxRate = values.taxRate || 0;
      const travelBudget = values.travelBudget || 0;
      const thirdPartyBudget = values.thirdPartyBudget || 0;
      const baseWithDiscount = quote.basePrice - discount;
      const tax = Math.round(baseWithDiscount * taxRate / 100);
      const totalPrice = baseWithDiscount + tax + travelBudget + thirdPartyBudget;
      const paymentSchedule = quote.paymentSchedule.map(s => ({
        ...s,
        amount: Math.round(totalPrice * s.percentage / 100),
      }));
      await storage.updateQuote(quote.id, {
        discount, taxRate, travelBudget, thirdPartyBudget, totalPrice, paymentSchedule,
      });
      refresh();
      setEditModalOpen(false);
      message.success('报价已更新');
    } catch { /* form validation */ }
  };

  // ---- 二次编辑（回到报价编辑页，携带 quoteId 恢复已选服务） ----
  const handleReedit = () => {
    if (quote.packageType === 'custom') {
      navigate(`/quotes/new/custom?customerId=${quote.customerId}&quoteId=${quote.id}`);
    } else {
      navigate(`/quotes/new/package/${quote.packageType}?customerId=${quote.customerId}&quoteId=${quote.id}`);
    }
  };

  // ---- 创建项目 ----
  const handleCreateProject = async () => {
    // 从报价 items 的模块 ID（moduleId）构建交付物模板 ID
    // 服务树 parent ID（如 comp-eco）→ 交付物模板 ID（如 d-comp-eco）
    const selectedIds = (quote.items || [])
      .filter(item => (item.children || []).length > 0)
      .map(item => `d-${item.moduleId}`);
    if (selectedIds.length === 0) {
      message.warning('报价中没有服务模块，无法创建项目');
      return;
    }
    try {
      const project = await storage.createProject(
        quote.id, quote.customerId, quote.customerName, customer?.industry || customerInfo.industry || '餐饮',
        quote.packageType, selectedIds,
      );
      refresh();
      message.success('项目已创建');
      navigate(`/projects/${project.id}`);
    } catch (err: any) {
      message.error(err.message || '创建项目失败');
    }
  };

  // ---- 导出 HTML ----
  const handleExport = () => {
    // 从保存的 items 构建导出数据
    const engineSummary = (quote.items || []).map(item => {
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
      planMonths: quote.totalDuration ? Math.ceil(quote.totalDuration / 30) : 6,
      planPrice: quote.basePrice,
      customerInfo,
      engineSummary,
      additionItems: quote.additionItems || [],
      totalPrice: quote.totalPrice,
      totalDuration: quote.totalDuration || 0,
      totalSelected: quote.totalSelected || 0,
    });

    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
      message.success('报价单已在新窗口打开');
    } else {
      message.error('弹窗被拦截，请允许弹窗后重试');
    }
    setExportModalOpen(false);
  };

  // ---- 打印 ----
  const handlePrint = () => handleExport(); // 导出HTML后可直接打印

  // ---- 服务清单表格列 ----
  const serviceColumns = [
    { title: '序号', key: 'idx', width: 50, render: (_: any, __: any, idx: number) => idx + 1 },
    { title: '引擎/模块', key: 'name', render: (_: any, record: any) => (
      <div>
        <Text strong>{record.moduleName}</Text>
        {record.isChild && <div style={{ fontSize: 12, color: '#999', paddingLeft: 16 }}>{record.name}</div>}
      </div>
    )},
    { title: '说明', dataIndex: 'annotation', key: 'annotation', width: 200, ellipsis: true, render: (v: string) => <Text type="secondary" style={{ fontSize: 12 }}>{v}</Text> },
    { title: '单价', dataIndex: 'price', key: 'price', width: 100, align: 'right' as const, render: (v: number) => <Text>¥{v.toLocaleString()}</Text> },
    { title: '工期', dataIndex: 'duration', key: 'duration', width: 80, align: 'right' as const, render: (v: number) => <Text>{v}天</Text> },
  ];

  // 构建服务清单表格数据：父项（模块）+ 子项（服务条目）
  const serviceTableData: any[] = [];
  (quote.items || []).forEach(item => {
    const children = item.children || [];
    if (children.length === 0) {
      serviceTableData.push({
        key: item.moduleId,
        moduleName: item.moduleName,
        annotation: '',
        price: item.price,
        duration: item.duration,
        isChild: false,
        rowSpan: 1,
      });
    } else {
      children.forEach((child, idx) => {
        serviceTableData.push({
          key: `${item.moduleId}-${child.id}`,
          moduleName: idx === 0 ? item.moduleName : '',
          name: child.name,
          annotation: child.annotation,
          price: child.price,
          duration: child.duration,
          isChild: true,
        });
      });
    }
  });

  return (
    <div className="page-container">
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>返回</Button>

      {/* 顶部操作栏 */}
      <div className="page-header-row" style={{ marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>报价单详情</Title>
          <Text type="secondary">{pkgName} · {quote.customerName}</Text>
        </div>
        <Space wrap>
          <Button icon={<EditOutlined />} onClick={handleReedit}>编辑服务选项</Button>
          <Button icon={<EditOutlined />} onClick={handleEditOpen}>调整费用</Button>
          {quote.status === 'draft' && <Button icon={<SendOutlined />} onClick={() => handleStatusChange('sent')}>发送报价</Button>}
          {quote.status === 'sent' && <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => handleStatusChange('accepted')}>确认签约</Button>}
          {quote.status !== 'accepted' && quote.status !== 'rejected' && (
            <Button danger onClick={() => handleStatusChange('rejected')}>拒绝</Button>
          )}
          {quote.status === 'rejected' && (
            <Button icon={<ReloadOutlined />} onClick={() => handleStatusChange('draft')}>重新打开</Button>
          )}
          {quote.status === 'accepted' && (
            <Button type="primary" icon={<ProjectOutlined />} onClick={handleCreateProject}>创建项目</Button>
          )}
          <Button icon={<ExportOutlined />} onClick={() => setExportModalOpen(true)}>导出报价</Button>
          <Button icon={<PrinterOutlined />} onClick={handlePrint}>打印</Button>
        </Space>
      </div>

      {/* 状态流程 */}
      <Card size="small" style={{ marginBottom: 24 }}>
        <Steps
          current={currentStep}
          size="small"
          items={statusSteps.map(s => ({
            title: statusLabels[s],
            status: s === 'rejected' && quote.status === 'rejected' ? 'error' : undefined,
          }))}
        />
      </Card>

      <Row gutter={24}>
        <Col xs={24} lg={16}>
          {/* 客户信息 */}
          <Card title="客户信息" size="small" style={{ marginBottom: 16 }}>
            <Descriptions column={{ xs: 1, sm: 2 }} size="small">
              <Descriptions.Item label="公司">{customerInfo.company}</Descriptions.Item>
              <Descriptions.Item label="联系人">{customerInfo.contact}</Descriptions.Item>
              <Descriptions.Item label="行业">{customerInfo.industry}</Descriptions.Item>
              <Descriptions.Item label="电话">{customerInfo.phone}</Descriptions.Item>
              <Descriptions.Item label="微信">{customerInfo.wechat || '-'}</Descriptions.Item>
              <Descriptions.Item label="邮箱">{customerInfo.email || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>

          {/* 完整服务清单 */}
          <Card
            title={<Space><FileTextOutlined />服务报价清单</Space>}
            size="small"
            style={{ marginBottom: 16 }}
            extra={
              <Space>
                <Text type="secondary">共 {serviceTableData.length} 项</Text>
                {quote.totalDuration && <Tag>工期 {quote.totalDuration} 天</Tag>}
              </Space>
            }
          >
            {serviceTableData.length > 0 ? (
              <Table
                dataSource={serviceTableData}
                columns={serviceColumns}
                pagination={false}
                size="small"
                rowKey="key"
                scroll={{ x: 'max-content' }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 32, color: '#999' }}>
                <Paragraph>暂无服务清单数据</Paragraph>
                <Button type="primary" onClick={handleReedit}>前往编辑服务选项</Button>
              </div>
            )}

            {/* 增项服务 */}
            {(quote.additionItems || []).length > 0 && (
              <>
                <Divider orientation="left" style={{ fontSize: 13 }}>增项服务</Divider>
                <Table
                  dataSource={quote.additionItems}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  scroll={{ x: 'max-content' }}
                  columns={[
                    { title: '序号', key: 'idx', width: 50, render: (_: any, __: any, idx: number) => serviceTableData.length + idx + 1 },
                    { title: '增项名称', dataIndex: 'name', key: 'name' },
                    { title: '说明', dataIndex: 'note', key: 'note', ellipsis: true },
                    { title: '费用', dataIndex: 'price', key: 'price', width: 100, align: 'right' as const, render: (v: number) => <Text>¥{v.toLocaleString()}</Text> },
                    { title: '工期', dataIndex: 'duration', key: 'duration', width: 80, align: 'right' as const, render: (v: number) => <Text>{v}天</Text> },
                  ]}
                />
              </>
            )}
          </Card>

          {/* 付款计划 */}
          <Card title="付款计划" size="small">
            <Table
              dataSource={quote.paymentSchedule}
              rowKey="id"
              pagination={false}
              size="small"
              scroll={{ x: 'max-content' }}
              columns={[
                { title: '阶段', dataIndex: 'label' },
                { title: '条件', dataIndex: 'condition' },
                { title: '比例', dataIndex: 'percentage', render: (v: number) => `${v}%` },
                { title: '金额', dataIndex: 'amount', render: (v: number) => <Text strong>¥{v.toLocaleString()}</Text> },
                {
                  title: '状态', dataIndex: 'paid',
                  render: (paid: boolean, record) => paid
                    ? <Tag color="green">已付</Tag>
                    : <Button size="small" onClick={() => {
                        const schedule = quote.paymentSchedule.map(s =>
                          s.id === record.id ? { ...s, paid: true, paidAt: Date.now() } : s
                        );
                        storage.updateQuote(quote.id, { paymentSchedule: schedule });
                        refresh();
                        message.success('已确认收款');
                      }}>确认收款</Button>,
                },
              ]}
            />
          </Card>
        </Col>

        {/* 右侧面板 */}
        <Col xs={24} lg={8}>
          {/* 费用汇总 */}
          <Card title="费用汇总" size="small">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text>服务费合计</Text><Text>¥{quote.basePrice.toLocaleString()}</Text>
            </div>
            {quote.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text>折扣</Text><Text type="danger">-¥{quote.discount.toLocaleString()}</Text>
              </div>
            )}
            {quote.taxRate > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text>税费 ({quote.taxRate}%)</Text><Text>¥{Math.round((quote.basePrice - quote.discount) * quote.taxRate / 100).toLocaleString()}</Text>
              </div>
            )}
            {quote.travelBudget > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text>差旅预算</Text><Text>¥{quote.travelBudget.toLocaleString()}</Text>
              </div>
            )}
            {quote.thirdPartyBudget > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text>增项/第三方</Text><Text>¥{quote.thirdPartyBudget.toLocaleString()}</Text>
              </div>
            )}
            <Divider style={{ margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text strong style={{ fontSize: 18 }}>总计</Text>
              <Text strong style={{ fontSize: 24, color: '#cf1322' }}>¥{quote.totalPrice.toLocaleString()}</Text>
            </div>
          </Card>

          {/* 报价信息 */}
          <Card title="报价信息" size="small" style={{ marginTop: 16 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="创建时间">{dayjs(quote.createdAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
              <Descriptions.Item label="有效期至">{dayjs(quote.validUntil).format('YYYY-MM-DD')}</Descriptions.Item>
              <Descriptions.Item label="预计工期">{quote.totalDuration ? `${quote.totalDuration} 天` : '-'}</Descriptions.Item>
              <Descriptions.Item label="服务项数">{quote.totalSelected || '-'}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={quote.status === 'accepted' ? 'green' : quote.status === 'rejected' ? 'red' : quote.status === 'sent' ? 'orange' : 'default'}>
                  {statusLabels[quote.status]}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* 审定操作面板 */}
          <Card title="审定操作" size="small" style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <Text type="secondary" style={{ fontSize: 13 }}>
                当前状态：<Tag color={quote.status === 'accepted' ? 'green' : quote.status === 'rejected' ? 'red' : 'default'}>{statusLabels[quote.status]}</Tag>
              </Text>
              <Space wrap>
                {quote.status !== 'accepted' && quote.status !== 'rejected' && (
                  <>
                    <Button type="primary" size="small" icon={<CheckCircleOutlined />} onClick={() => handleStatusChange('accepted')}>确认签约</Button>
                    <Button size="small" danger onClick={() => handleStatusChange('rejected')}>拒绝报价</Button>
                  </>
                )}
                {quote.status === 'rejected' && (
                  <Button size="small" icon={<ReloadOutlined />} onClick={() => handleStatusChange('draft')}>重新打开</Button>
                )}
                {quote.status === 'accepted' && (
                  <Button type="primary" size="small" icon={<ProjectOutlined />} onClick={handleCreateProject}>创建项目</Button>
                )}
              </Space>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 编辑费用弹窗 */}
      <Modal
        title="调整报价费用"
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={handleEditSave}
        okText="保存"
        cancelText="取消"
        width={Math.min(500, window.innerWidth - 32)}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item label="服务费合计" extra="服务项目费用不可在此修改，请使用「编辑服务选项」">
            <InputNumber value={quote.basePrice} disabled style={{ width: '100%' }} prefix="¥" formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="discount" label="折扣金额" rules={[{ type: 'number', min: 0 }]}>
                <InputNumber style={{ width: '100%' }} prefix="¥" placeholder="0" min={0} max={quote.basePrice} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="taxRate" label="税率 (%)" rules={[{ type: 'number', min: 0, max: 100 }]}>
                <InputNumber style={{ width: '100%' }} placeholder="0" min={0} max={100} addonAfter="%" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="travelBudget" label="差旅预算" rules={[{ type: 'number', min: 0 }]}>
                <InputNumber style={{ width: '100%' }} prefix="¥" placeholder="0" min={0} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="thirdPartyBudget" label="增项/第三方预算" rules={[{ type: 'number', min: 0 }]}>
                <InputNumber style={{ width: '100%' }} prefix="¥" placeholder="0" min={0} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
              </Form.Item>
            </Col>
          </Row>
          <Divider style={{ margin: '8px 0 12px' }} />
          <div style={{ textAlign: 'right' }}>
            <Text type="secondary">修改后总价将自动重新计算，付款计划同步更新</Text>
          </div>
        </Form>
      </Modal>

      {/* 导出确认弹窗 */}
      <Modal
        title="导出报价单"
        open={exportModalOpen}
        onCancel={() => setExportModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setExportModalOpen(false)}>取消</Button>,
          <Button key="export" type="primary" icon={<ExportOutlined />} onClick={handleExport}>导出HTML</Button>,
          <Button key="print" icon={<PrinterOutlined />} onClick={handlePrint}>导出并打印</Button>,
        ]}
        width={Math.min(400, window.innerWidth - 32)}
      >
        <div style={{ padding: '8px 0' }}>
          <Paragraph>导出格式：HTML 报价文档（4页专业版式）</Paragraph>
          <Paragraph type="secondary" style={{ fontSize: 13 }}>
            打开后点击「下载 PDF」一键保存为 PDF 文件，或点击「打印」输出纸质版。
          </Paragraph>
          <Descriptions column={1} size="small" style={{ marginTop: 12 }}>
            <Descriptions.Item label="客户">{customerInfo.company}</Descriptions.Item>
            <Descriptions.Item label="计划">{pkgName}</Descriptions.Item>
            <Descriptions.Item label="总计">¥{quote.totalPrice.toLocaleString()}</Descriptions.Item>
          </Descriptions>
        </div>
      </Modal>
    </div>
  );
}
