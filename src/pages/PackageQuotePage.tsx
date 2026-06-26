// ============================================================
// 亮品牌 · 卓航/领航计划报价页
// 预选套餐内容，可二次确认/调整
// 含实时计算、增项服务、已选明细、导出
// ============================================================

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Typography, Card, Row, Col, Collapse, Checkbox, InputNumber, Button, Space,
  Divider, Tag, message, Popconfirm, Drawer, Table, Empty, Spin, Select, Alert,
} from 'antd';
import {
  ArrowLeftOutlined, PlusOutlined, DeleteOutlined, SaveOutlined,
  ExportOutlined, PrinterOutlined, MinusCircleOutlined, ReloadOutlined,
  FileTextOutlined, InfoCircleOutlined,
} from '@ant-design/icons';
import { useApp } from '../context';
import * as storage from '../storage';
import { Input } from 'antd';
import { SERVICE_TREE, PACKAGE_PRESETS, calcChildrenTotal } from '../serviceTree';
import { generateQuoteHTML } from '../quoteExport';
import type { ServiceEngine, ServiceParent, ServiceChild } from '../serviceTree';
import { getPackageSetting } from '../theme';

const { Title, Text, Paragraph } = Typography;

// Selected state: { [childId]: { selected: boolean, price: number, duration: number } }
interface ChildState {
  selected: boolean;
  price: number;
  duration: number;
  name?: string;
  isCustom?: boolean;
}

export default function PackageQuotePage() {
  const { planId, customerId } = useParams<{ planId: string; customerId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as any) || {};
  const searchParams = new URLSearchParams(location.search);
  const editingQuoteId = searchParams.get('quoteId');
  const { customers, quotes, refresh, publicSettings } = useApp();

  const editingQuote = editingQuoteId ? quotes.find(q => q.id === editingQuoteId) : null;
  // 编辑模式下，优先从报价恢复 customerId（不依赖 URL 参数）
  const effectiveCustomerId = customerId || editingQuote?.customerId || '';
  const customer = effectiveCustomerId ? customers.find(c => c.id === effectiveCustomerId) : null;
  const preset = PACKAGE_PRESETS.find(p => p.id === planId);
  if (!preset) return <div style={{ padding: 24, textAlign: 'center' }}>计划不存在</div>;

  // 从设置中读取套餐名称/描述/月数（覆盖硬编码预设值）
  const pkgSetting = getPackageSetting(publicSettings, planId || '');
  const pkgName = pkgSetting?.name || preset.name;
  const pkgMonths = pkgSetting?.months || preset.months;
  const pkgDescription = pkgSetting?.description || preset.description;

  // State: map of childId -> childState
  const [childStates, setChildStates] = useState<Record<string, ChildState>>({});
  const [additionItems, setAdditionItems] = useState<Array<{ id: string; name: string; price: number; duration: number; note: string }>>([]);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialize: pre-select package items, or restore from existing quote
  useEffect(() => {
    const initial: Record<string, ChildState> = {};
    // 如果是编辑已有报价，从报价的 items 恢复已选状态
    if (editingQuote && editingQuote.items && editingQuote.items.length > 0) {
      // 先按服务树初始化所有子项
      SERVICE_TREE.forEach(engine => {
        engine.parents.forEach(parent => {
          parent.children.forEach(child => {
            initial[child.id] = {
              selected: false,
              price: child.price,
              duration: child.duration,
              name: child.name,
            };
          });
        });
      });
      // 再从已保存的 items 中恢复选中状态和自定义价格
      editingQuote.items.forEach(item => {
        (item.children || []).forEach(child => {
          if (initial[child.id]) {
            initial[child.id] = {
              selected: true,
              price: child.price,
              duration: child.duration,
              name: child.name,
            };
          }
        });
      });
    } else {
      // 新建：按套餐预设
      SERVICE_TREE.forEach(engine => {
        engine.parents.forEach(parent => {
          const isPreset = preset.selectedParentIds.includes(parent.id);
          parent.children.forEach(child => {
            initial[child.id] = {
              selected: isPreset,
              price: child.price,
              duration: child.duration,
              name: child.name,
            };
          });
        });
      });
    }
    setChildStates(initial);

    // 恢复增项服务
    if (editingQuote?.additionItems && editingQuote.additionItems.length > 0) {
      setAdditionItems(editingQuote.additionItems.map(a => ({ ...a })));
    }
  }, [planId]);

  // Computed values
  const { totalPrice, totalDuration, totalSelected, serviceSummary, engineSummary } = useMemo(() => {
    let price = 0, duration = 0, count = 0;
    const engines: Array<{ engine: ServiceEngine; parents: Array<{ parent: ServiceParent; selectedCount: number; totalPrice: number; totalDuration: number }> }> = [];

    SERVICE_TREE.forEach(engine => {
      const parentSummary: typeof engines[0]['parents'] = [];
      engine.parents.forEach(parent => {
        let pPrice = 0, pDur = 0, pCount = 0;
        parent.children.forEach(child => {
          const cs = childStates[child.id];
          if (cs?.selected) {
            price += cs.price;
            duration += cs.duration;
            count++;
            pPrice += cs.price;
            pDur += cs.duration;
            pCount++;
          }
        });
        if (pCount > 0) {
          parentSummary.push({ parent, selectedCount: pCount, totalPrice: pPrice, totalDuration: pDur });
        }
      });
      if (parentSummary.length > 0) {
        engines.push({ engine, parents: parentSummary });
      }
    });

    const additionPrice = additionItems.reduce((s, a) => s + a.price, 0);
    const additionDuration = additionItems.reduce((s, a) => s + a.duration, 0);

    return {
      totalPrice: price + additionPrice,
      totalDuration: duration + additionDuration,
      totalSelected: count,
      serviceSummary: { basePrice: price, additionPrice, baseDuration: duration, additionDuration },
      engineSummary: engines,
    };
  }, [childStates, additionItems]);

  // Handlers
  const toggleChild = (childId: string, checked: boolean) => {
    setChildStates(prev => ({
      ...prev,
      [childId]: { ...prev[childId], selected: checked },
    }));
  };

  const toggleParent = (parentId: string, checked: boolean) => {
    let parentObj: ServiceParent | undefined;
    SERVICE_TREE.forEach(e => { parentObj = e.parents.find(p => p.id === parentId) || parentObj; });
    if (!parentObj) return;

    setChildStates(prev => {
      const next = { ...prev };
      parentObj!.children.forEach(child => {
        next[child.id] = { ...next[child.id], selected: checked };
      });
      return next;
    });
  };

  // 引擎级一键勾选
  const toggleEngine = (engineId: string, checked: boolean) => {
    const engine = SERVICE_TREE.find(e => e.id === engineId);
    if (!engine) return;
    setChildStates(prev => {
      const next = { ...prev };
      engine.parents.forEach(parent => {
        parent.children.forEach(child => {
          next[child.id] = { ...next[child.id], selected: checked };
        });
      });
      return next;
    });
  };

  const updateChildPrice = (childId: string, price: number) => {
    setChildStates(prev => ({ ...prev, [childId]: { ...prev[childId], price } }));
  };

  const updateChildDuration = (childId: string, duration: number) => {
    setChildStates(prev => ({ ...prev, [childId]: { ...prev[childId], duration } }));
  };

  const addAdditionItem = () => {
    setAdditionItems(prev => [...prev, {
      id: 'add-' + Date.now(),
      name: '',
      price: 0,
      duration: 0,
      note: '',
    }]);
  };

  const updateAdditionItem = (id: string, field: string, value: any) => {
    setAdditionItems(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const removeAdditionItem = (id: string) => {
    setAdditionItems(prev => prev.filter(a => a.id !== id));
  };

  // 客户选择器状态（允许在编辑时切换关联客户）
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // 初始化时设置 selectedCustomerId
  useEffect(() => {
    if (effectiveCustomerId) {
      setSelectedCustomerId(effectiveCustomerId);
    }
  }, [effectiveCustomerId]);

  // 当前生效的客户（优先用户手动选择 > URL参数 > 报价原有）
  const activeCustomer = selectedCustomerId
    ? customers.find(c => c.id === selectedCustomerId) || null
    : customer;

  const handleSave = async () => {
    // 客户检查：编辑模式下优先从报价的 customerSnapshot 恢复
    if (!activeCustomer && !state.customerInfo?.company && !editingQuote?.customerSnapshot?.company) {
      message.warning('请先关联客户');
      return;
    }

    setSaving(true);
    try {
      // 使用用户选择的客户 或 报价原客户
      const saveCustomerId = selectedCustomerId || effectiveCustomerId || editingQuote?.customerId || '';
      const saveCustomer = saveCustomerId ? customers.find(c => c.id === saveCustomerId) : null;

      // 构建完整的报价清单 items（含子项快照）
      const items = engineSummary.map(({ engine, parents }) => ({
        moduleId: engine.id,
        moduleName: engine.name,
        engineType: engine.id,
        selected: true,
        price: parents.reduce((s, p) => s + p.totalPrice, 0),
        duration: parents.reduce((s, p) => s + p.totalDuration, 0),
        deliverableIds: [] as string[],
        children: parents.flatMap(({ parent, selectedCount, totalPrice }) =>
          parent.children
            .filter(c => childStates[c.id]?.selected)
            .map(child => ({
              id: child.id,
              name: child.name,
              annotation: child.annotation,
              price: childStates[child.id].price,
              duration: childStates[child.id].duration,
              selected: true,
            }))
        ),
      }));

      const quoteData = {
        customerId: saveCustomerId,
        customerName: saveCustomer?.company || customer?.company || state.customerInfo?.company || editingQuote?.customerSnapshot?.company || '未指定客户',
        packageType: planId as any,
        items,
        basePrice: serviceSummary.basePrice,
        discount: editingQuote?.discount || 0,
        taxRate: editingQuote?.taxRate || 0,
        travelBudget: editingQuote?.travelBudget || 0,
        thirdPartyBudget: additionItems.reduce((s, a) => s + a.price, 0),
        totalPrice,
        validUntil: editingQuote?.validUntil || Date.now() + 30 * 86400000,
        paymentSchedule: editingQuote?.paymentSchedule || [
          { id: 'p1', label: '签约首付（50%）', percentage: 50, amount: Math.round(totalPrice * 0.5), condition: '合同签订后3日内', paid: false },
          { id: 'p2', label: '服务中期（30%）', percentage: 30, amount: Math.round(totalPrice * 0.3), condition: `第${Math.ceil(preset.months / 2)}个月末`, paid: false },
          { id: 'p3', label: '尾款（20%）', percentage: 20, amount: totalPrice - Math.round(totalPrice * 0.5) - Math.round(totalPrice * 0.3), condition: '服务结束（成果交付前）', paid: false },
        ],
        additionItems: additionItems.filter(a => a.price > 0),
        totalDuration,
        totalSelected,
        customerSnapshot: {
          company: saveCustomer?.company || customer?.company || state.customerInfo?.company || editingQuote?.customerSnapshot?.company || '',
          contact: saveCustomer?.name || customer?.name || state.customerInfo?.contact || editingQuote?.customerSnapshot?.contact || '',
          phone: saveCustomer?.phone || customer?.phone || state.customerInfo?.phone || editingQuote?.customerSnapshot?.phone || '',
          wechat: saveCustomer?.wechat || customer?.wechat || state.customerInfo?.wechat || editingQuote?.customerSnapshot?.wechat || '',
          email: saveCustomer?.email || customer?.email || state.customerInfo?.email || editingQuote?.customerSnapshot?.email || '',
          industry: saveCustomer?.industry || customer?.industry || state.customerInfo?.industry || editingQuote?.customerSnapshot?.industry || '',
        },
      };

      if (editingQuoteId) {
        // 更新已有报价
        await storage.updateQuote(editingQuoteId, quoteData);
        refresh();
        message.success('报价已更新');
        navigate(`/quotes/${editingQuoteId}`);
      } else {
        // 新建报价
        const quote = await storage.createQuote({
          ...quoteData,
          status: 'draft',
        });
        if (customerId) {
          await storage.updateCustomer(customerId, { stage: 'quoting' });
        }
        refresh();
        message.success('报价已保存');
        navigate(`/quotes/${quote.id}`);
      }
    } catch (err: any) {
      message.error(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    // Build export data from current state
    const exportEngineSummary = engineSummary.map(({ engine, parents }) => ({
      engine,
      parents: parents.map(({ parent, selectedCount, totalPrice, totalDuration }) => {
        const selectedChildren = parent.children
          .filter(c => childStates[c.id]?.selected)
          .map(child => ({
            child,
            state: { price: childStates[child.id].price, duration: childStates[child.id].duration },
          }));
        return { parent, selectedChildren };
      }),
    }));

    const html = generateQuoteHTML({
      planName: pkgName,
      planMonths: preset.months,
      planPrice: preset.basePrice,
      customerInfo: {
        company: activeCustomer?.company || customer?.company || state.customerInfo?.company || editingQuote?.customerSnapshot?.company || '',
        contact: activeCustomer?.name || customer?.name || state.customerInfo?.contact || editingQuote?.customerSnapshot?.contact || '',
        phone: activeCustomer?.phone || customer?.phone || state.customerInfo?.phone || editingQuote?.customerSnapshot?.phone || '',
        wechat: activeCustomer?.wechat || customer?.wechat || state.customerInfo?.wechat || editingQuote?.customerSnapshot?.wechat || '',
        email: activeCustomer?.email || customer?.email || state.customerInfo?.email || editingQuote?.customerSnapshot?.email || '',
        industry: activeCustomer?.industry || customer?.industry || state.customerInfo?.industry || editingQuote?.customerSnapshot?.industry || '',
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
            <Title level={4} style={{ margin: 0 }}>
              {editingQuoteId ? `编辑报价 · ` : ''}{pkgName} · 服务内容配置
            </Title>
            <Tag color="blue">{pkgMonths}个月</Tag>
          </Space>
          <Space wrap>
            <Button icon={<ReloadOutlined />} onClick={() => {
              if (confirm('确认重置为默认服务内容？')) {
                const initial: Record<string, ChildState> = {};
                SERVICE_TREE.forEach(engine => {
                  engine.parents.forEach(parent => {
                    const isPreset = preset.selectedParentIds.includes(parent.id);
                    parent.children.forEach(child => {
                      initial[child.id] = { selected: isPreset, price: child.price, duration: child.duration, name: child.name };
                    });
                  });
                });
                setChildStates(initial);
                setAdditionItems([]);
              }
            }}>重置</Button>
            <Button icon={<ExportOutlined />} onClick={handleExport}>导出报价</Button>
            <Button icon={<PrinterOutlined />} onClick={() => window.print()}>打印</Button>
            <Button icon={<SaveOutlined />} type="primary" onClick={handleSave} loading={saving}>保存报价</Button>
          </Space>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px' }}>
        {/* 客户关联信息 */}
        <Card size="small" style={{ marginBottom: 16, borderRadius: 8, borderLeft: '4px solid #cf1322' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <Space wrap>
              <Text strong style={{ fontSize: 15 }}>关联客户：</Text>
              {activeCustomer ? (
                <Tag color="blue" style={{ fontSize: 14, padding: '2px 8px' }}>
                  {activeCustomer.company}
                </Tag>
              ) : editingQuote?.customerSnapshot?.company ? (
                <Space>
                  <Tag color="orange" style={{ fontSize: 14, padding: '2px 8px' }}>
                    {editingQuote.customerSnapshot.company}
                  </Tag>
                  <Text type="secondary" style={{ fontSize: 12 }}>(客户列表中未找到，已从报价快照恢复)</Text>
                </Space>
              ) : (
                <Text type="warning" style={{ color: '#faad14' }}>⚠️ 尚未关联客户，保存前请选择客户</Text>
              )}
              {activeCustomer && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  联系人：{activeCustomer.name} | 电话：{activeCustomer.phone || '未填写'} | 行业：{activeCustomer.industry || '未填写'}
                </Text>
              )}
            </Space>
            <Select
              showSearch
              placeholder="切换/选择关联客户"
              optionFilterProp="label"
              style={{ width: '100%', maxWidth: 280 }}
              value={selectedCustomerId || undefined}
              allowClear
              onChange={(val) => setSelectedCustomerId(val || null)}
              options={customers.map(c => ({
                value: c.id,
                label: `${c.company}${c.name ? `（${c.name}）` : ''}`,
              }))}
            />
          </div>
        </Card>
        <Row gutter={24}>
          {/* Left: Service Tree */}
          <Col xs={24} lg={16}>
            {SERVICE_TREE.map(engine => {
              const isIncluded = preset.includedEngineIds.includes(engine.id);
              const engineParents = engine.parents.filter(p =>
                preset.selectedParentIds.includes(p.id) || !isIncluded
              );
              const engineSelectedCount = engine.parents.reduce((s, p) =>
                s + p.children.filter(c => childStates[c.id]?.selected).length, 0
              );
              const engineTotalCount = engine.parents.reduce((s, p) => s + p.children.length, 0);
              const engineAllSelected = engineSelectedCount === engineTotalCount && engineTotalCount > 0;
              const engineIndeterminate = engineSelectedCount > 0 && !engineAllSelected;
              const enginePrice = engine.parents.reduce((s, p) =>
                s + p.children.filter(c => childStates[c.id]?.selected).reduce((ss, c) => ss + (childStates[c.id]?.price || 0), 0), 0
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
                          checked={engineAllSelected}
                          indeterminate={engineIndeterminate}
                          onChange={e => toggleEngine(engine.id, e.target.checked)}
                        />
                        <span style={{ fontSize: 20 }}>{engine.icon}</span>
                        <Text strong>{engine.name}</Text>
                        {isIncluded && <Tag color="blue">套餐包含</Tag>}
                      </Space>
                      <Space>
                        {engineSelectedCount > 0 && <Text type="secondary" style={{ fontSize: 12 }}>¥{enginePrice.toLocaleString()}</Text>}
                        <Tag>{engineSelectedCount}/{engineTotalCount} 项</Tag>
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
                    defaultActiveKey={engineParents.map(p => p.id)}
                    items={engineParents.map(parent => {
                      const selectedChildren = parent.children.filter(c => childStates[c.id]?.selected);
                      const allSelected = selectedChildren.length === parent.children.length && parent.children.length > 0;
                      const parentPrice = selectedChildren.reduce((s, c) => s + (childStates[c.id]?.price || 0), 0);
                      const parentDuration = selectedChildren.reduce((s, c) => s + (childStates[c.id]?.duration || 0), 0);

                      return {
                        key: parent.id,
                        label: (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingRight: 8 }}>
                            <Space>
                              <Checkbox
                                checked={allSelected}
                                indeterminate={selectedChildren.length > 0 && !allSelected}
                                onChange={e => { e.stopPropagation(); toggleParent(parent.id, e.target.checked); }}
                                onClick={e => e.stopPropagation()}
                              />
                              <Text strong>{parent.name}</Text>
                              <Tag color="orange">{selectedChildren.length}项</Tag>
                              {selectedChildren.length > 0 && <Text type="secondary" style={{ fontSize: 12 }}>¥{parentPrice.toLocaleString()}</Text>}
                            </Space>
                          </div>
                        ),
                        children: (
                          <div style={{ padding: '4px 0 4px 32px' }}>
                            {/* Parent annotation */}
                            <div style={{ fontSize: 12, color: '#999', marginBottom: 8, fontStyle: 'italic' }}>
                              💡 {parent.annotation}
                            </div>
                            {/* Children */}
                            {parent.children.map(child => {
                              const cs = childStates[child.id] || { selected: false, price: child.price, duration: child.duration };
                              return (
                                <div
                                  key={child.id}
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '6px 8px', marginBottom: 4,
                                    background: cs.selected ? '#f0f5ff' : 'transparent',
                                    borderRadius: 6, transition: 'background 0.2s',
                                    flexWrap: 'wrap',
                                  }}
                                >
                                  <Checkbox
                                    checked={cs.selected}
                                    onChange={e => toggleChild(child.id, e.target.checked)}
                                    style={{ flex: '0 0 auto' }}
                                  />
                                  <Text style={{ flex: '1 1 200px', fontSize: 13 }}>{child.name}</Text>
                                  <Text type="secondary" style={{ fontSize: 11, flex: '0 0 auto', maxWidth: 200 }}>
                                    💡{child.annotation}
                                  </Text>
                                  {cs.selected && (
                                    <>
                                      <InputNumber
                                        size="small"
                                        value={cs.price}
                                        onChange={v => updateChildPrice(child.id, v || 0)}
                                        prefix="¥"
                                        min={0}
                                        style={{ width: 100 }}
                                        formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                      />
                                      <InputNumber
                                        size="small"
                                        value={cs.duration}
                                        onChange={v => updateChildDuration(child.id, v || 0)}
                                        min={0}
                                        style={{ width: 80 }}
                                        addonAfter="天"
                                      />
                                    </>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ),
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
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, padding: 8, background: '#fafafa', borderRadius: 6 }}>
                    <Text style={{ flex: 1 }}>增项名称</Text>
                    <Input
                      size="small"
                      placeholder="增项名称"
                      value={item.name}
                      onChange={e => updateAdditionItem(item.id, 'name', e.target.value)}
                      style={{ flex: 2 }}
                    />
                    <Input
                      size="small"
                      placeholder="说明"
                      value={item.note}
                      onChange={e => updateAdditionItem(item.id, 'note', e.target.value)}
                      style={{ flex: 2 }}
                    />
                    <InputNumber
                      size="small"
                      value={item.price}
                      onChange={v => updateAdditionItem(item.id, 'price', v || 0)}
                      prefix="¥"
                      min={0}
                      style={{ width: 100 }}
                    />
                    <InputNumber
                      size="small"
                      value={item.duration}
                      onChange={v => updateAdditionItem(item.id, 'duration', v || 0)}
                      min={0}
                      style={{ width: 80 }}
                      addonAfter="天"
                    />
                    <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeAdditionItem(item.id)} />
                  </div>
                ))
              )}
            </Card>
          </Col>

          {/* Right: Summary Panel */}
          <Col xs={24} lg={8}>
            <Card
              title="已选服务明细"
              style={{ position: 'sticky', top: 80, borderRadius: 8 }}
              size="small"
            >
              {/* Service Summary */}
              {engineSummary.length === 0 ? (
                <Empty description="请选择服务项目" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <>
                  {engineSummary.map(({ engine, parents }) => (
                    <div key={engine.id} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <Text strong>{engine.icon} {engine.name}</Text>
                        <Tag>{parents.reduce((s, p) => s + p.selectedCount, 0)}项</Tag>
                      </div>
                      {parents.map(({ parent, selectedCount, totalPrice }) => (
                        <div key={parent.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0 2px 16px', fontSize: 12 }}>
                          <Text type="secondary">{parent.name}（{selectedCount}项）</Text>
                          <Text>¥{totalPrice.toLocaleString()}</Text>
                        </div>
                      ))}
                    </div>
                  ))}

                  {additionItems.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <Text strong style={{ color: '#faad14' }}>➕ 增项服务</Text>
                        <Tag color="orange">{additionItems.length}项</Tag>
                      </div>
                      {additionItems.map(item => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0 2px 16px', fontSize: 12 }}>
                          <Text type="secondary">{item.name || '未命名增项'}</Text>
                          <Text>¥{(item.price || 0).toLocaleString()}</Text>
                        </div>
                      ))}
                    </div>
                  )}

                  <Divider style={{ margin: '12px 0' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text type="secondary">服务项合计</Text>
                    <Text>¥{serviceSummary.basePrice.toLocaleString()}</Text>
                  </div>
                  {serviceSummary.additionPrice > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text type="secondary">增项合计</Text>
                      <Text>¥{serviceSummary.additionPrice.toLocaleString()}</Text>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text type="secondary">预计总工期</Text>
                    <Text>{totalDuration} 天</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text type="secondary">已选服务项数</Text>
                    <Text>{totalSelected} 项</Text>
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

      {/* Print styles - hidden, only for @media print */}
      <style>{`
        @media print {
          .ant-btn, .ant-checkbox, .ant-input-number, .ant-collapse-header .ant-collapse-arrow { display: none !important; }
          .ant-card { box-shadow: none !important; border: 1px solid #e8e8e8 !important; break-inside: avoid; }
          body { background: #fff !important; }
        }
      `}</style>
    </div>
  );
}
