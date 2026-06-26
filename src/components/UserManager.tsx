// ============================================================
// 亮品牌 · 用户管理组件（修改密码 + 用户管理）
// 从 App.tsx 拆出，通过 ref 暴露 show 方法
// ============================================================

import React, { forwardRef, useState, useImperativeHandle } from 'react';
import {
  Modal, Form, Input, Select, Button, message, Avatar, Tag,
  Row, Col, Typography,
} from 'antd';
import { UserAddOutlined, KeyOutlined } from '@ant-design/icons';
import * as storage from '../storage';
import { ROLE_CONFIG } from '../permissions';
import type { Role } from '../userTypes';

const { Text } = Typography;

export interface UserManagerRef {
  showPassword: () => void;
  showUsers: () => void;
}

const ROLE_COLORS: Record<string, string> = {
  admin: '#f5222d',
  consultant: '#cf1322',
  strategist: '#722ed1',
  designer: '#eb2f96',
  pm: '#13c2c2',
};

export default forwardRef<UserManagerRef>(function UserManager(_props, ref) {
  // 修改密码
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordForm] = Form.useForm();

  const handlePasswordChange = async () => {
    try {
      const values = await passwordForm.validateFields();
      await storage.changePassword(values.oldPassword, values.newPassword);
      message.success('密码修改成功');
      setPasswordModalOpen(false);
      passwordForm.resetFields();
    } catch (err: any) {
      message.error(err.message || '修改失败');
    }
  };

  // 用户管理
  const [usersModalOpen, setUsersModalOpen] = useState(false);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [addUserForm] = Form.useForm();

  const showUsersModal = async () => {
    try {
      const users = await storage.getUsers();
      setUsersList(users);
      setUsersModalOpen(true);
    } catch (err: any) {
      message.error('获取用户列表失败');
    }
  };

  const handleCreateUser = async () => {
    try {
      const values = await addUserForm.validateFields();
      await storage.createUser(values);
      message.success('用户创建成功');
      addUserForm.resetFields();
      showUsersModal(); // 刷新列表
    } catch (err: any) {
      message.error(err.message || '创建失败');
    }
  };

  const handleDeleteUser = async (username: string, userId: string) => {
    if (username === 'admin') return message.warning('不能删除管理员');
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除用户 "${username}" 吗？`,
      onOk: async () => {
        await storage.deleteUser(userId);
        message.success('用户已删除');
        showUsersModal();
      },
    });
  };

  useImperativeHandle(ref, () => ({
    showPassword: () => setPasswordModalOpen(true),
    showUsers: showUsersModal,
  }));

  return (
    <>
      {/* 修改密码弹窗 */}
      <Modal
        title="修改密码"
        open={passwordModalOpen}
        onCancel={() => setPasswordModalOpen(false)}
        onOk={handlePasswordChange}
        okText="确认修改"
        cancelText="取消"
      >
        <Form form={passwordForm} layout="vertical">
          <Form.Item name="oldPassword" label="旧密码" rules={[{ required: true, message: '请输入旧密码' }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="newPassword" label="新密码" rules={[{ required: true, min: 6, message: '密码至少6位' }]}>
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>

      {/* 用户管理弹窗 */}
      <Modal
        title="用户管理"
        open={usersModalOpen}
        onCancel={() => setUsersModalOpen(false)}
        footer={null}
        width={Math.min(600, typeof window !== 'undefined' ? window.innerWidth - 32 : 568)}
      >
        {/* 新增用户 */}
        <div style={{ marginBottom: 16, padding: 16, background: 'var(--apple-bg-secondary)', borderRadius: 'var(--apple-radius-md)' }}>
          <div style={{ fontWeight: 600, marginBottom: 12 }}>新增用户</div>
          <Form form={addUserForm} layout="vertical" onFinish={handleCreateUser}>
            <Row gutter={12}>
              <Col xs={24} sm={12}>
                <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
                  <Input placeholder="用户名" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="password" rules={[{ required: true, min: 6, message: '密码至少6位' }]}>
                  <Input.Password placeholder="密码" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="role" rules={[{ required: true, message: '请选择角色' }]}>
                  <Select
                    placeholder="角色"
                    options={Object.entries(ROLE_CONFIG).map(([k, v]) => ({ value: k, label: v.label }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="displayName">
                  <Input placeholder="姓名" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<UserAddOutlined />} block>
                创建用户
              </Button>
            </Form.Item>
          </Form>
        </div>
        {/* 用户列表 */}
        <div style={{ maxHeight: 300, overflow: 'auto' }}>
          {usersList.map((u: any) => (
            <div
              key={u.id}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', borderBottom: '1px solid var(--apple-border-light)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar size={28} style={{ background: ROLE_COLORS[u.role] || '#999', fontSize: 12 }}>
                  {u.displayName?.charAt(0) || u.username?.charAt(0) || 'U'}
                </Avatar>
                <div>
                  <div style={{ fontWeight: 500 }}>{u.displayName || u.username}</div>
                  <div style={{ fontSize: 12, color: '#999' }}>@{u.username}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Tag color={ROLE_COLORS[u.role]}>{ROLE_CONFIG[u.role as Role]?.label}</Tag>
                {u.username !== 'admin' && (
                  <Button size="small" danger onClick={() => handleDeleteUser(u.username, u.id)}>
                    删除
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
});
