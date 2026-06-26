// ============================================================
// 亮品牌 · 定制服务计划页
// 完整服务树 + 折叠 + 全选 + 新增 + 价格编辑 + 实时计算
// ============================================================

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Typography, Card, Row, Col, Collapse, Checkbox, InputNumber, Button, Space,
  Divider, Tag, message, Empty, Input, Popconfirm,
} from 'antd';
import {
  ArrowLeftOutlined, PlusOutlined, DeleteOutlined, SaveOutlined,
  PrinterOutlined, ReloadOutlined, InfoCircleOutlined, MinusCircleOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import { useApp } from '../context';
import * as storage from '../storage';
import { SERVICE_TREE, calcChildrenTotal } from '../serviceTree';
import { generateQuoteHTML } from '../quoteExport';
import type { ServiceParent } from '../serviceTree';

const { Title, Text, Paragraph } = Typography;

interface ChildState {
  selected: boolean;
  price: number;
  duration: number;
  name: string;
  annotation: string;
  isCustom?: boolean;
}

export default function CustomQuotePage() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as any) || {};
  const searchParams = new URLSearchParams(location.search);
  const editingQuoteId = searchParams.get('quoteId');
  const { customers, quotes, refresh } = useApp();

  const customer = customerId ? customers.find(c => c.id === customerId) : null;
  const editingQuote = editingQuoteId ? quotes.find(q => q.id === editingQuoteId) : null;

  // Map: parentId -> ChildState[]
  const [parentChildStates, setParentChildStates] = useState<Record<string, ChildState[]>>({});
  const [additionItems, setAdditionItems] = useState<Array<{ id: string; name: string; price: number; duration: number; note: string }>>([]);
  const [saving, setSaving] = useState(false);

  // Initialize from service tree; restore selections if editing existing quote
  useEffect(() => {
    const initial: Record<string, ChildState[]> = {};

    if (editingQuote && editingQuote.items && editingQuote.items.length > 0) {
      // 从已有报价恢复
      SERVICE_TREE.forEach(engine => {
        engine.parents.forEach(parent => {
          // 先初始化所有子项
          initial[parent.id] = parent.children.map(child => ({
            selected: false,
            price: child.price,
            duration: child.duration,
            name: child.name,
            annotation: child.annotation,
          }));
          // 从报价 items 恢复选中状态
          editingQuote.items.forEach(item => {
            (item.children || []).forEach(savedChild => {
              const idx = parent.children.findIndex(c => c.id === savedChild.id);
              if (idx >= 0) {
                initial[parent.id][idx] = {
                  ...initial[parent.id][idx],
                  selected: true,
                  price: savedChild.price,
                  duration: savedChild.duration,
                };
              }
            });
          });
        });
      });
    } else {
      // 新建：全部不选中
      SERVICE_TREE.forEach(engine => {
        engine.parents.forEach(parent => {
          initial[parent.id] = parent.children.map(child => ({
            selected: false,
            price: child.price,
            duration: child.duration,
            name: child.name,
            annotation: child.annotation,
          }));
        });
      });
    }
    setParentChildStates(initial);

    // 恢复增项服务
    if (editingQuote?.additionItems && editingQuote.additionItems.length > 0) {
      setAdditionItems(editingQuote.additionItems.map(a => ({ ...a })));
    }
  }, []);

  // Computed
  const { totalPrice, totalDuration, totalSelected, engineSummary, serviceSummary } = useMemo(() => {
    let price = 0, duration = 0, count = 0;
    const engines: Array<{
      engine: typeof SERVICE_TREE[0];
      parents: Array<{ parent: ServiceParent; selectedCount: number; totalPrice: number; totalDuration: number }>;
    }> = [];

    SERVICE_TREE.forEach(engine => {
      const parentSumm: typeof engines[0]['parents'] = [];
      engine.parents.forEach(parent => {
        const children = parentChildStates[parent.id] || [];
        let pPrice = 0, pDur = 0, pCount = 0;
        children.forEach(cs => {
          if (cs.selected) { price += cs.price; duration += cs.duration; count++; pPrice += cs.price; pDur += cs.duration; pCount++; }
        });
        if (pCount > 0) parentSumm.push({ parent, selectedCount: pCount, totalPrice: pPrice, totalDuration: pDur });
      });
      if (parentSumm.length > 0) engines.push({ engine, parents: parentSumm });
    });

    const addPrice = additionItems.reduce((s, a) => s + a.price, 0);
    const addDur = additionItems.reduce((s, a) => s + a.duration, 0);

    return {
      totalPrice: price + addPrice,
      totalDuration: duration + addDur,
      totalSelected: count,
      engineSummary: engines,
      serviceSummary: { basePrice: price, additionPrice: addPrice },
    };
  }, [parentChildStates, additionItems]);

  // Handlers
  const toggleChild = (parentId: string, childIdx: number, checked: boolean) => {
    setParentChildStates(prev => ({
      ...prev,
      [parentId]: prev[parentId].map((c, i) => i === childIdx ? { ...c, selected: checked } : c),
    }));
  };

  const toggleParentAll = (parentId: string, checked: boolean) => {
    setParentChildStates(prev => ({
      ...prev,
      [parentId]: prev[parentId].map(c => ({ ...c, selected: checked })),
    }));
  };

  // 引擎级一键勾选
  const toggleEngine = (engineId: string, checked: boolean) => {
    const engine = SERVICE_TREE.find(e => e.id === engineId);
    if (!engine) return;
    setParentChildStates(prev => {
      const next = { ...prev };
      engine.parents.forEach(parent => {
        next[parent.id] = (next[parent.id] || []).map(c => ({ ...c, selected: checked }));
      });
      return next;
    });
  };

  const updateChild = (parentId: string, childIdx: number, field: string, value: any) => {
    setParentChildStates(prev => ({
      ...prev,
      [parentId]: prev[parentId].map((c, i) => i === childIdx ? { ...c, [field]: value } : c),
    }));
  };

  const addCustomChild = (parentId: string) => {
    setParentChildStates(prev => ({
      ...prev,
      [parentId]: [...prev[parentId], {
        selected: true, price: 0, duration: 0,
        name: '自定义服务项', annotation: '请填写说明',
        isCustom: true,
      }],
    }));
  };

  const removeCustomChild = (parentId: string, childIdx: number) => {
    setParentChildStates(prev => ({
      ...prev,
      [parentId]: prev[parentId].filter((_, i) => i !== childIdx),
    }));
  };

  const addAdditionItem = () => {
    setAdditionItems(prev => [...prev, { id: 'add-' + Date.now(), name: '', price: 0, duration: 0, note: '' }]);
  };

  const updateAdditionItem = (id: string, field: string, value: any) => {
    setAdditionItems(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const removeAdditionItem = (id: string) => {
    setAdditionItems(prev => prev.filter(a => a.id !== id));
  };

  const handleSave = async () => {
    if (!customer && !state.customerInfo?.company) {
      message.warning('请先关联客户');
      return;
    }

    setSaving(true);
    try {
      // 构建完整的报价清单 items
      const items = engineSummary.map(({ engine, parents }) => ({
        moduleId: engine.id,
        moduleName: engine.name,
        engineType: engine.id,
        selected: true,
        price: parents.reduce((s, p) => s + p.totalPrice, 0),
        duration: parents.reduce((s, p) => s + p.totalDuration, 0),
        deliverableIds: [] as string[],
        children: parents.flatMap(({ parent }) => {
          const children = parentChildStates[parent.id] || [];
          return children
            .filter(c => c.selected)
            .map((child, idx) => ({
              id: parent.children[idx]?.id || `custom-${child.name}`,
              name: child.name,
              annotation: child.annotation,
              price: child.price,
              duration: child.duration,
              selected: true,
            }));
        }),
      }));

      const quoteData = {
        customerId: customerId || '',
        customerName: customer?.company || state.customerInfo?.company || '未指定客户',
        packageType: 'custom' as const,
        items,
        basePrice: serviceSummary.basePrice,
        discount: editingQuote?.discount || 0,
        taxRate: editingQuote?.taxRate || 0,
        travelBudget: editingQuote?.travelBudget || 0,
        thirdPartyBudget: serviceSummary.additionPrice,
        totalPrice,
        validUntil: editingQuote?.validUntil || Date.now() + 30 * 86400000,
        paymentSchedule: editingQuote?.paymentSchedule || [
          { id: 'p1', label: '签约首付（50%）', percentage: 50, amount: Math.round(totalPrice * 0.5), condition: '合同签订后3日内', paid: false },
          { id: 'p2', label: '服务中期（30%）', percentage: 30, amount: Math.round(totalPrice * 0.3), condition: '服务中期', paid: false },
          { id: 'p3', label: '尾款（20%）', percentage: 20, amount: totalPrice - Math.round(totalPrice * 0.5) - Math.round(totalPrice * 0.3), condition: '服务结束（成果交付前）', paid: false },
        ],
        additionItems: additionItems.filter(a => a.price > 0),
        totalDuration,
        totalSelected,
        customerSnapshot: {
          company: customer?.company || state.customerInfo?.company || '',
          contact: customer?.name || state.customerInfo?.contact || '',
          phone: customer?.phone || state.customerInfo?.phone || '',
          wechat: customer?.wechat || state.customerInfo?.wechat || '',
          email: customer?.email || state.customerInfo?.email || '',
          industry: customer?.industry || state.customerInfo?.industry || '',
        },
      };

      if (editingQuoteId) {
        // 更新已有报价
        await storage.updateQuote(editingQuoteId, quoteData);
        refresh();
        message.success('定制报价已更新');
        navigate(`/quotes/${editingQuoteId}`);
      } else {
        // 新建报价
        const quote = await storage.createQuote({ ...quoteData, status: 'draft' });
        if (customerId) await storage.updateCustomer(customerId, { stage: 'quoting' });
        refresh();
        message.success('定制报价已保存');
        navigate(`/quotes/${quote.id}`);
      }
    } catch (err: any) {
      message.error(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    const exportEngineSummary = engineSummary.map(({ engine, parents }) => ({
      engine,
      parents: parents.map(({ parent, selectedCount, totalPrice, totalDuration }) => {
        const children = parentChildStates[parent.id] || [];
        const selectedChildren = children
          .filter(c => c.selected)
          .map(child => ({
            child: { id: `custom-${child.name}`, name: child.name, annotation: child.annotation, price: child.price, duration: child.duration, isCustom: child.isCustom },
            state: { price: child.price, duration: child.duration },
          }));
        return { parent, selectedChildren };
      }),
    }));

    const html = generateQuoteHTML({
      planName: '定制服务计划',
      planMonths: Math.ceil(totalDuration / 30) || 3,
      planPrice: serviceSummary.basePrice,
      customerInfo: {
        company: customer?.company || state.customerInfo?.company || '',
        contact: customer?.name || state.customerInfo?.contact || '',
        phone: customer?.phone || state.customerInfo?.phone || '',
        wechat: customer?.wechat || state.customerInfo?.wechat || '',
        email: customer?.email || state.customerInfo?.email || '',
        industry: customer?.industry || state.customerInfo?.industry || '',
      },
      engineSummary: exportEngineSummary,
      additionItems: additionItems.filter(a => a.price > 0),
      totalPrice,
      totalDuration,
      totalSelected,
    });

    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
    } else {
      message.error('弹窗被拦截，请允许弹窗后重试');
    }
  };

  const renderChildren = (parentId: string) => {
    const children = parentChildStates[parentId] || [];
    if (children.length === 0) return null;

    const selectedCount = children.filter(c => c.selected).length;
    const allSelected = selectedCount === children.length;
    const totalChildPrice = children.filter(c => c.selected).reduce((s, c) => s + c.price, 0);

    // Find parent annotation
    let parentAnnotation = '';
    SERVICE_TREE.forEach(e => {
      const p = e.parents.find(pp => pp.id === parentId);
      if (p) parentAnnotation = p.annotation;
    });

    return (
      <>
        {/* Parent annotation */}
        <div style={{ fontSize: 12, color: '#999', marginBottom: 8, fontStyle: 'italic', padding: '4px 0' }}>
          💡 {parentAnnotation}
        </div>

        {/* Children list */}
        {children.map((child, idx) => (
          <div
            key={`${parentId}-${idx}`}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 8px', marginBottom: 3,
              background: child.selected ? '#f0f5ff' : 'transparent',
              borderRadius: 6, transition: 'background 0.2s',
              flexWrap: 'wrap',
            }}
          >
            <Checkbox
              checked={child.selected}
              onChange={e => toggleChild(parentId, idx, e.target.checked)}
            />
            {child.isCustom ? (
              <Input
                size="small"
                value={child.name}
                onChange={e => updateChild(parentId, idx, 'name', e.target.value)}
                style={{ flex: '1 1 160px', minWidth: 120 }}
              />
            ) : (
              <Text style={{ flex: '1 1 160px', minWidth: 100, fontSize: 13 }}>{child.name}</Text>
            )}
            {child.isCustom ? (
              <Input
                size="small"
                value={child.annotation}
                onChange={e => updateChild(parentId, idx, 'annotation', e.target.value)}
                placeholder="注解说明"
                style={{ flex: '1 1 140px', minWidth: 100 }}
              />
            ) : (
              <Text type="secondary" style={{ flex: '1 1 140px', minWidth: 80, fontSize: 11 }}>💡{child.annotation}</Text>
            )}
            {child.selected && (
              <>
                <InputNumber
                  size="small" value={child.price}
                  onChange={v => updateChild(parentId, idx, 'price', v || 0)}
                  prefix="¥" min={0} style={{ width: 90, flex: '0 0 90px' }}
                />
                <InputNumber
                  size="small" value={child.duration}
                  onChange={v => updateChild(parentId, idx, 'duration', v || 0)}
                  min={0} style={{ width: 72, flex: '0 0 72px' }} addonAfter="天"
                />
              </>
            )}
            {child.isCustom && (
              <Button size="small" danger type="text" icon={<MinusCircleOutlined />}
                onClick={() => removeCustomChild(parentId, idx)} />
            )}
          </div>
        ))}

        {/* Add custom child button */}
        <Button
          type="dashed" size="small" icon={<PlusOutlined />}
          style={{ width: '100%', marginTop: 4 }}
          onClick={() => addCustomChild(parentId)}
        >
          新增子项
        </Button>
      </>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Top Bar */}
      <div style={{
        background: '#fff', padding: '12px 16px',
        borderBottom: '1px solid #f0f0f0',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <Space wrap>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>返回</Button>
            <Title level={4} style={{ margin: 0 }}>{editingQuoteId ? '编辑报价 · ' : ''}定制服务计划</Title>
          </Space>
          <Space wrap>
            <Button icon={<ExportOutlined />} onClick={handleExport}>导出报价</Button>
            <Button icon={<PrinterOutlined />} onClick={() => window.print()}>打印</Button>
            <Button icon={<SaveOutlined />} type="primary" onClick={handleSave} loading={saving}>保存报价</Button>
          </Space>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 16 }}>
        <Row gutter={24}>
          <Col xs={24} lg={16}>
            {SERVICE_TREE.map(engine => {
              const eSelectedCount = engine.parents.reduce((s, p) =>
                s + (parentChildStates[p.id] || []).filter(c => c.selected).length, 0);
              const eTotalCount = engine.parents.reduce((s, p) => s + (parentChildStates[p.id] || []).length, 0);
              const eAllSelected = eSelectedCount === eTotalCount && eTotalCount > 0;
              const eIndeterminate = eSelectedCount > 0 && !eAllSelected;
              const ePrice = engine.parents.reduce((s, p) =>
                s + (parentChildStates[p.id] || []).filter(c => c.selected).reduce((ss, c) => ss + c.price, 0), 0
              );

              return (
                <Card
                  key={engine.id}
                  size="small"
                  style={{ marginBottom: 16, borderRadius: 8 }}
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Space>
                        <Checkbox
                          checked={eAllSelected}
                          indeterminate={eIndeterminate}
                          onChange={e => toggleEngine(engine.id, e.target.checked)}
                        />
                        <span style={{ fontSize: 20 }}>{engine.icon}</span>
                        <Text strong>{engine.name}</Text>
                      </Space>
                      <Space>
                        {eSelectedCount > 0 && <Text type="secondary" style={{ fontSize: 12 }}>¥{ePrice.toLocaleString()}</Text>}
                        <Tag>{eSelectedCount}/{eTotalCount} 项</Tag>
                      </Space>
                    </div>
                  }
                >
                  {/* 引擎说明区域 */}
                  <div style={{ marginBottom: 12, padding: '12px 14px', background: '#fafafa', borderRadius: 6, fontSize: 13, color: '#555', lineHeight: 1.7 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <InfoCircleOutlined style={{ color: engine.color, fontSize: 14 }} />
                      <Text strong style={{ color: '#333', fontSize: 14 }}>{engine.annotation}</Text>
                    </div>
                    <div style={{ marginTop: 6, color: '#888', fontStyle: 'italic' }}>
                      {engine.slogan}
                    </div>
                    {engine.note && (
                      <div style={{ marginTop: 6, color: engine.color, fontSize: 12 }}>
                        💡 {engine.note}
                      </div>
                    )}
                  </div>

                  <Collapse
                    ghost
                    defaultActiveKey={engine.parents.map(p => p.id)}
                    items={engine.parents.map(parent => {
                      const children = parentChildStates[parent.id] || [];
                      const selCount = children.filter(c => c.selected).length;
                      const allSel = selCount === children.length && children.length > 0;
                      const pTotal = children.filter(c => c.selected).reduce((s, c) => s + c.price, 0);

                      return {
                        key: parent.id,
                        label: (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingRight: 8 }}>
                            <Space>
                              <Checkbox
                                checked={allSel}
                                indeterminate={selCount > 0 && !allSel}
                                onChange={e => { e.stopPropagation(); toggleParentAll(parent.id, e.target.checked); }}
                                onClick={e => e.stopPropagation()}
                              />
                              <Text strong>{parent.name}</Text>
                              {selCount > 0 && (
                                <>
                                  <Tag color="blue">{selCount}项</Tag>
                                  <Text type="secondary" style={{ fontSize: 12 }}>¥{pTotal.toLocaleString()}</Text>
                                </>
                              )}
                            </Space>
                          </div>
                        ),
                        children: renderChildren(parent.id),
                      };
                    })}
                  />
                </Card>
              );
            })}

            {/* 增项服务 */}
            <Card
              size="small"
              title={<Space><PlusOutlined />增项服务</Space>}
              style={{ marginBottom: 16, borderRadius: 8 }}
              extra={<Button type="dashed" size="small" icon={<PlusOutlined />} onClick={addAdditionItem}>添加增项</Button>}
            >
              {additionItems.length === 0 ? (
                <Empty description="暂无增项服务" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                additionItems.map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: 8, background: '#fafafa', borderRadius: 6, flexWrap: 'wrap' }}>
                    <Input size="small" placeholder="增项名称" value={item.name} onChange={e => updateAdditionItem(item.id, 'name', e.target.value)} style={{ flex: '1 1 160px' }} />
                    <Input size="small" placeholder="说明" value={item.note} onChange={e => updateAdditionItem(item.id, 'note', e.target.value)} style={{ flex: '1 1 160px' }} />
                    <InputNumber size="small" value={item.price} onChange={v => updateAdditionItem(item.id, 'price', v || 0)} prefix="¥" min={0} style={{ width: 90 }} />
                    <InputNumber size="small" value={item.duration} onChange={v => updateAdditionItem(item.id, 'duration', v || 0)} min={0} style={{ width: 72 }} addonAfter="天" />
                    <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeAdditionItem(item.id)} />
                  </div>
                ))
              )}
            </Card>
          </Col>

          {/* Right: Summary */}
          <Col xs={24} lg={8}>
            <Card title="已选服务明细" size="small" style={{ position: 'sticky', top: 80, borderRadius: 8 }}>
              {engineSummary.length === 0 && additionItems.length === 0 ? (
                <Empty description="请选择服务项目" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <>
                  {engineSummary.map(({ engine, parents }) => (
                    <div key={engine.id} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text strong>{engine.icon} {engine.name}</Text>
                        <Tag>{parents.reduce((s, p) => s + p.selectedCount, 0)}项</Tag>
                      </div>
                      {parents.map(({ parent, selectedCount, totalPrice }) => (
                        <div key={parent.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0 1px 16px', fontSize: 12 }}>
                          <Text type="secondary">{parent.name}（{selectedCount}项）</Text>
                          <Text>¥{totalPrice.toLocaleString()}</Text>
                        </div>
                      ))}
                    </div>
                  ))}

                  {additionItems.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <Text strong style={{ color: '#faad14' }}>➕ 增项服务 <Tag color="orange">{additionItems.length}项</Tag></Text>
                      {additionItems.map(item => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0 1px 16px', fontSize: 12 }}>
                          <Text type="secondary">{item.name || '未命名'}</Text>
                          <Text>¥{(item.price || 0).toLocaleString()}</Text>
                        </div>
                      ))}
                    </div>
                  )}

                  <Divider style={{ margin: '12px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text type="secondary">服务项合计</Text><Text>¥{serviceSummary.basePrice.toLocaleString()}</Text>
                  </div>
                  {serviceSummary.additionPrice > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text type="secondary">增项合计</Text><Text>¥{serviceSummary.additionPrice.toLocaleString()}</Text>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text type="secondary">预计总工期</Text><Text>{totalDuration} 天</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text type="secondary">已选服务项数</Text><Text>{totalSelected} 项</Text>
                  </div>
                  <Divider />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Title level={5} style={{ margin: 0 }}>总报价</Title>
                    <Title level={4} style={{ margin: 0, color: '#f5222d' }}>¥{totalPrice.toLocaleString()}</Title>
                  </div>
                </>
              )}
            </Card>
          </Col>
        </Row>
      </div>

      <style>{`
        @media print {
          .ant-btn, .ant-checkbox, .ant-input-number, .ant-collapse-header .ant-collapse-arrow, .ant-empty { display: none !important; }
          .ant-card { box-shadow: none !important; border: 1px solid #e8e8e8 !important; break-inside: avoid; }
          body { background: #fff !important; }
        }
      `}</style>
    </div>
  );
}
