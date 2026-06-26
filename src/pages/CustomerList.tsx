// ============================================================
// 亮品牌 · 客户管理列表
// ============================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Space, Tag, Input, Modal, Form, Select, Typography, Card, Row, Col, Statistic } from 'antd';
import { PlusOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons';
import { useApp } from '../context';
import * as storage from '../storage';
import { Customer, CustomerStage, CUSTOMER_STAGE_LABELS } from '../types';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

const STAGE_COLORS: Record<CustomerStage, string> = {
  intention: 'blue',
  quoting: 'orange',
  negotiating: 'purple',
  signed: 'green',
  lost: 'default',
};

export default function CustomerList() {
  const { customers, refresh } = useApp();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [form] = Form.useForm();

  const filtered = customers.filter(c =>
    c.name.includes(search) || c.company.includes(search) || c.industry.includes(search)
  );

  const handleCreate = (values: any) => {
    storage.createCustomer({ ...values, stage: 'intention', createdAt: Date.now(), notes: '' });
    refresh();
    setModalOpen(false);
    form.resetFields();
  };

  const columns = [
    {
      title: '客户信息', dataIndex: 'name', key: 'name',
      render: (text: string, record: Customer) => (
        <div>
          <div style={{ fontWeight: 600 }}>{text}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.company} · {record.industry}</div>
        </div>
      ),
    },
    {
      title: '联系方式', key: 'contact',
      render: (_: any, record: Customer) => (
        <div style={{ fontSize: 13 }}>
          <div>📱 {record.phone}</div>
          {record.wechat && <div>💬 {record.wechat}</div>}
        </div>
      ),
    },
    {
      title: '阶段', dataIndex: 'stage', key: 'stage',
      render: (stage: CustomerStage) => <Tag color={STAGE_COLORS[stage]}>{CUSTOMER_STAGE_LABELS[stage]}</Tag>,
      filters: Object.entries(CUSTOMER_STAGE_LABELS).map(([k, v]) => ({ text: v, value: k })),
      onFilter: (value: any, record: Customer) => record.stage === value,
    },
    {
      title: '来源', dataIndex: 'source', key: 'source',
      render: (s: string) => s || '-',
    },
    {
      title: '创建时间', dataIndex: 'createdAt', key: 'createdAt',
      render: (t: number) => dayjs(t).format('YYYY-MM-DD'),
      sorter: (a: Customer, b: Customer) => a.createdAt - b.createdAt,
    },
    {
      title: '操作', key: 'action',
      render: (_: any, record: Customer) => (
        <Space>
          <Button type="link" size="small" onClick={() => navigate(`/customers/${record.id}`)}>查看</Button>
          <Button type="link" size="small" onClick={() => navigate(`/quotes/new?customerId=${record.id}`)}>报价</Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header page-header-row">
        <div>
          <Title level={3} style={{ margin: 0 }}>客户管理</Title>
          <Typography.Text type="secondary">管理意向客户、报价洽谈、签约转化全流程</Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>新增客户</Button>
      </div>

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}><Card><Statistic title="全部客户" value={customers.length} prefix={<UserOutlined />} /></Card></Col>
        <Col xs={12} sm={6}><Card><Statistic title="意向客户" value={customers.filter(c => c.stage === 'intention').length} valueStyle={{ color: '#cf1322' }} /></Card></Col>
        <Col xs={12} sm={6}><Card><Statistic title="报价中" value={customers.filter(c => c.stage === 'quoting').length} valueStyle={{ color: '#faad14' }} /></Card></Col>
        <Col xs={12} sm={6}><Card><Statistic title="已签约" value={customers.filter(c => c.stage === 'signed').length} valueStyle={{ color: '#52c41a' }} /></Card></Col>
      </Row>

      <Card>
        <Input
          placeholder="搜索客户名称、公司、行业..."
          prefix={<SearchOutlined />}
          size="large"
          style={{ marginBottom: 16 }}
          onChange={e => setSearch(e.target.value)}
          allowClear
        />
        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          scroll={{ x: 'max-content' }}
          onRow={(record) => ({ onClick: () => navigate(`/customers/${record.id}`), style: { cursor: 'pointer' } })}
        />
      </Card>

      <Modal title="新增客户" open={modalOpen} onCancel={() => setModalOpen(false)} footer={null} width={Math.min(560, window.innerWidth - 32)}>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="name" label="联系人" rules={[{ required: true, message: '请输入联系人' }]}>
                <Input placeholder="姓名" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="company" label="公司名称" rules={[{ required: true, message: '请输入公司名称' }]}>
                <Input placeholder="企业名称" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="industry" label="行业" rules={[{ required: true }]}>
                <Select placeholder="选择行业">
                  <Option value="餐饮">餐饮</Option>
                  <Option value="零售">零售</Option>
                  <Option value="快消品">快消品</Option>
                  <Option value="教育">教育</Option>
                  <Option value="医疗健康">医疗健康</Option>
                  <Option value="科技">科技</Option>
                  <Option value="其他">其他</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="source" label="客户来源">
                <Select placeholder="选择来源" allowClear>
                  <Option value="转介绍">转介绍</Option>
                  <Option value="线上咨询">线上咨询</Option>
                  <Option value="活动获客">活动获客</Option>
                  <Option value="主动拜访">主动拜访</Option>
                  <Option value="其他">其他</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="phone" label="电话" rules={[
                { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号（11位）' },
              ]}>
                <Input placeholder="联系电话" maxLength={11} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="wechat" label="微信">
                <Input placeholder="微信号" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="email" label="邮箱" rules={[
            { type: 'email', message: '请输入正确的邮箱格式' },
          ]}>
            <Input placeholder="电子邮箱" />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">创建客户</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
