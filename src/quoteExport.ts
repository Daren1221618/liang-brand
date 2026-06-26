// ============================================================
// 亮品牌 · HTML报价导出模板
// 严格按照"济南-莱喜莉周期性项目服务系统.pdf"版式设计
// ============================================================

import type { ServiceEngine, ServiceParent, ServiceChild } from './serviceTree';

interface ExportData {
  planName: string;
  planMonths: number;
  planPrice: number;
  customerInfo: {
    company: string;
    contact: string;
    phone: string;
    wechat: string;
    email: string;
    industry: string;
  };
  engineSummary: Array<{
    engine: ServiceEngine;
    parents: Array<{
      parent: ServiceParent;
      selectedChildren: Array<{ child: ServiceChild; state: { price: number; duration: number } }>;
    }>;
  }>;
  additionItems: Array<{ name: string; price: number; duration: number; note: string }>;
  totalPrice: number;
  totalDuration: number;
  totalSelected: number;
  docNo?: string;
  submitDate?: string;
}

export function generateQuoteHTML(data: ExportData): string {
  const docNo = data.docNo || `LB-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
  const submitDate = data.submitDate || new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

  // Payment schedule
  const firstPayment = Math.round(data.totalPrice * 0.5);
  const midPayment = Math.round(data.totalPrice * 0.3);
  const lastPayment = data.totalPrice - firstPayment - midPayment;

  // Build deliverables list
  let deliverableIndex = 0;
  let deliverablesHTML = '';
  data.engineSummary.forEach(({ engine, parents }) => {
    parents.forEach(({ parent, selectedChildren }) => {
      deliverableIndex++;
      deliverablesHTML += `
        <tr>
          <td style="border:1px solid #d9d9d9;padding:8px 12px;text-align:center;width:40px;">${deliverableIndex}</td>
          <td style="border:1px solid #d9d9d9;padding:8px 12px;">
            <strong>${parent.name}</strong>
            <div style="font-size:11px;color:#999;margin-top:2px;">
              ${parent.annotation}
            </div>
            <div style="margin-top:6px;font-size:12px;color:#666;">
              ${selectedChildren.map(sc => `${sc.child.name}（¥${sc.state.price.toLocaleString()} / ${sc.state.duration}天）`).join('、')}
            </div>
          </td>
          <td style="border:1px solid #d9d9d9;padding:8px 12px;text-align:right;font-weight:600;">
            ¥${selectedChildren.reduce((s, sc) => s + sc.state.price, 0).toLocaleString()}
          </td>
        </tr>`;
    });
  });

  // Addition items
  if (data.additionItems.length > 0) {
    data.additionItems.forEach(item => {
      if (item.price > 0) {
        deliverableIndex++;
        deliverablesHTML += `
          <tr style="background:#fffbe6;">
            <td style="border:1px solid #d9d9d9;padding:8px 12px;text-align:center;width:40px;">${deliverableIndex}</td>
            <td style="border:1px solid #d9d9d9;padding:8px 12px;">
              <strong>增项：${item.name || '未命名'}</strong>
              ${item.note ? `<div style="font-size:11px;color:#999;margin-top:2px;">${item.note}</div>` : ''}
            </td>
            <td style="border:1px solid #d9d9d9;padding:8px 12px;text-align:right;font-weight:600;color:#faad14;">
              ¥${item.price.toLocaleString()}
            </td>
          </tr>`;
      }
    });
  }

  // Engines for cover page
  const engineListHTML = data.engineSummary.map(e => e.engine).map(eng => `
    <div style="display:inline-block;padding:6px 16px;margin:4px;border:1px solid ${eng.color};border-radius:20px;font-size:13px;">
      ${eng.icon} ${eng.name}${eng.subtitle ? ' · ' + eng.subtitle : ''}
    </div>
  `).join('');

  // Work plan timeline
  const monthsPerPage = data.planMonths <= 6 ? 6 : 12;
  let workPlanHTML = '';
  const engineList = data.engineSummary.map(e => e.engine);
  for (let m = 1; m <= monthsPerPage; m++) {
    const enginesForMonth = engineList.slice(0, Math.min(2 + Math.floor(m / 3), engineList.length));
    workPlanHTML += `
      <tr>
        <td style="border:1px solid #d9d9d9;padding:6px 10px;text-align:center;width:60px;font-weight:600;">第${m}月</td>
        <td style="border:1px solid #d9d9d9;padding:6px 10px;">
          ${enginesForMonth.map(e => `<span style="display:inline-block;margin-right:8px;">${e.icon}${e.name}</span>`).join('')}
        </td>
        <td style="border:1px solid #d9d9d9;padding:6px 10px;font-size:12px;color:#666;">
          交付物、汇报会议、评审节点
        </td>
      </tr>`;
  }

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>${data.customerInfo.company} - ${data.planName}</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: "PingFang SC", "Microsoft YaHei", "Helvetica Neue", sans-serif; color: #333; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { width: 210mm; min-height: 297mm; margin: 0 auto; position: relative; page-break-after: always; }
  .page:last-child { page-break-after: auto; }

  /* Cover Page */
  .cover { display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; text-align: center; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); color: #fff; }
  .cover-logo { font-size: 48px; font-weight: 700; letter-spacing: 8px; margin-bottom: 8px; text-shadow: 0 2px 8px rgba(0,0,0,0.3); }
  .cover-subtitle { font-size: 16px; color: rgba(255,255,255,0.7); letter-spacing: 4px; margin-bottom: 60px; }
  .cover-client { font-size: 36px; font-weight: 600; margin-bottom: 12px; }
  .cover-title { font-size: 28px; font-weight: 300; margin-bottom: 40px; letter-spacing: 2px; }
  .cover-meta { font-size: 14px; color: rgba(255,255,255,0.5); }
  .cover-from { margin-top: 80px; padding: 16px 32px; border: 1px solid rgba(255,255,255,0.3); border-radius: 8px; }
  .cover-from-name { font-size: 20px; font-weight: 600; letter-spacing: 4px; }
  .cover-from-desc { font-size: 12px; color: rgba(255,255,255,0.6); margin-top: 4px; }

  /* Content Pages */
  .content-page { padding: 40px 50px; }
  .section-title { font-size: 20px; font-weight: 700; color: #1a1a2e; border-left: 4px solid #cf1322; padding-left: 12px; margin-bottom: 20px; }
  .info-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  .info-table td { padding: 10px 16px; border: 1px solid #e8e8e8; font-size: 13px; }
  .info-table .label { background: #fafafa; width: 140px; font-weight: 500; color: #666; }

  /* Service Table */
  .service-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  .service-table th { background: #1a1a2e; color: #fff; padding: 10px 12px; font-size: 13px; text-align: center; }
  .service-table td { font-size: 13px; vertical-align: top; }

  /* Payment */
  .payment-card { background: linear-gradient(135deg, #1a1a2e, #0f3460); color: #fff; border-radius: 12px; padding: 24px; margin: 20px 0; }
  .payment-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-top: 16px; }
  .payment-item { background: rgba(255,255,255,0.1); border-radius: 8px; padding: 16px; text-align: center; }
  .payment-item .amount { font-size: 24px; font-weight: 700; color: #52c41a; }
  .payment-item .label { font-size: 12px; color: rgba(255,255,255,0.7); margin-top: 4px; }

  /* Footer */
  .footer { position: absolute; bottom: 30px; left: 50px; right: 50px; font-size: 10px; color: #999; display: flex; justify-content: space-between; }
  .warning-bar { background: #fff7e6; border: 1px solid #ffd591; border-radius: 4px; padding: 8px 16px; font-size: 11px; color: #ad6800; text-align: center; margin: 16px 0; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { margin: 0; box-shadow: none; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>

<!-- ==================== Page 1: Cover ==================== -->
<div class="page cover">
  <div class="cover-logo">亮品牌</div>
  <div class="cover-subtitle">餐饮全案咨询机构</div>
  <div style="height:1px;width:80px;background:rgba(255,255,255,0.3);margin-bottom:40px;"></div>
  <div class="cover-client">${data.customerInfo.company}</div>
  <div class="cover-title">${data.planName}</div>
  <div style="margin-bottom:20px;">
    ${engineListHTML}
  </div>
  <div class="cover-meta">
    文书编号：${docNo}　｜　提交日期：${submitDate}
  </div>
  <div class="cover-from">
    <div class="cover-from-name">长沙敬亮品牌策划有限公司</div>
    <div class="cover-from-desc">品牌亮点体系理论和操作方法的发明者</div>
  </div>
</div>

<!-- ==================== Page 2: Info & Company ==================== -->
<div class="page content-page">
  <div class="section-title">文件概况</div>
  <table class="info-table">
    <tr><td class="label">客户企业</td><td>${data.customerInfo.company}</td><td class="label">项目名称</td><td>${data.customerInfo.company}</td></tr>
    <tr><td class="label">服务类型</td><td>品牌创建</td><td class="label">行业领域</td><td>${data.customerInfo.industry}</td></tr>
    <tr><td class="label">文书编号</td><td>${docNo}</td><td class="label">提交日期</td><td>${submitDate}</td></tr>
    <tr><td class="label">联系人</td><td>${data.customerInfo.contact}</td><td class="label">电话/微信</td><td>${data.customerInfo.phone} ${data.customerInfo.wechat ? '/ ' + data.customerInfo.wechat : ''}</td></tr>
  </table>

  <div class="section-title">关于亮品牌</div>
  <div style="font-size:13px;line-height:2;color:#555;">
    <p>亮品牌是一家致力于系统性解决品牌创新、管理、发展的餐饮全案咨询公司。是中国品牌亮点体系理论和操作方法的发明者。</p>
    <p>总部位于湖南长沙后湖国际艺术园105栋。亮品牌由深研品牌系统创新近20年、拥有百余家企业咨询实战经验的品牌专家敬亮先生创办。</p>
    <p style="margin-top:12px;"><strong>核心服务理念：</strong>通过<strong>亮竞争 / 亮战略 / 亮形象 / 亮空间 / 亮营销 / 亮组织</strong>六大服务系统创新重新定义品牌独特自我。</p>
  </div>

  <div class="section-title" style="margin-top:24px;">服务亮点</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
    <div style="padding:12px;background:#f6f8fa;border-radius:8px;font-size:12px;line-height:1.8;">
      <strong style="color:#cf1322;">🏆 亮竞争</strong> — 构建可持续的竞争优势，为战略决策提供基石
    </div>
    <div style="padding:12px;background:#f6f8fa;border-radius:8px;font-size:12px;line-height:1.8;">
      <strong style="color:#cf1322;">🧭 亮战略</strong> — 定义企业使命、愿景与战略路径，统领一切行动
    </div>
    <div style="padding:12px;background:#f6f8fa;border-radius:8px;font-size:12px;line-height:1.8;">
      <strong style="color:#cf1322;">🎭 亮形象</strong> — 将战略转化为可感知的品牌体验，创造情感连接
    </div>
    <div style="padding:12px;background:#f6f8fa;border-radius:8px;font-size:12px;line-height:1.8;">
      <strong style="color:#cf1322;">🏗️ 亮空间</strong> — 将品牌战略转化为可感知的空间体验
    </div>
    <div style="padding:12px;background:#f6f8fa;border-radius:8px;font-size:12px;line-height:1.8;">
      <strong style="color:#cf1322;">📢 亮营销</strong> — 驱动品牌声量与业绩增长
    </div>
    <div style="padding:12px;background:#f6f8fa;border-radius:8px;font-size:12px;line-height:1.8;">
      <strong style="color:#cf1322;">👥 亮组织</strong> — 构建高效运营与组织进化能力
    </div>
  </div>

  <div class="footer">
    <span>机密文件 · 严禁外传</span>
    <span>保密级别：AAA</span>
    <span>第 2 页</span>
  </div>
</div>

<!-- ==================== Page 3: Service List ==================== -->
<div class="page content-page">
  <div class="section-title">${data.planName} · 服务清单</div>
  <p style="font-size:13px;color:#666;margin-bottom:16px;">
    ${data.planName} | ${data.planMonths}个月 | 共${data.totalSelected}项服务 | 预计总工期${data.totalDuration}天
  </p>

  <table class="service-table">
    <thead>
      <tr>
        <th style="width:40px;">序号</th>
        <th>服务内容</th>
        <th style="width:100px;">服务费用</th>
      </tr>
    </thead>
    <tbody>
      ${deliverablesHTML}
    </tbody>
    <tfoot>
      <tr style="background:#f0f5ff;">
        <td colspan="2" style="border:1px solid #d9d9d9;padding:12px;text-align:right;font-size:15px;font-weight:700;">
          总报价
        </td>
        <td style="border:1px solid #d9d9d9;padding:12px;text-align:right;font-size:18px;font-weight:700;color:#f5222d;">
          ¥${data.totalPrice.toLocaleString()}
        </td>
      </tr>
    </tfoot>
  </table>

  <div class="warning-bar">
    ⚠ 以上报价为周期服务打包价，已包含该周期内所有服务模块的工作。报价不含税（税点6%），不含外地差旅费用，不含第三方执行费用。
  </div>

  <div class="footer">
    <span>机密文件 · 严禁外传</span>
    <span>保密级别：AAA</span>
    <span>第 3 页</span>
  </div>
</div>

<!-- ==================== Page 4: Payment & Terms ==================== -->
<div class="page content-page">
  <div class="section-title">费用与付款方式</div>

  <div class="payment-card">
    <div style="text-align:center;">
      <div style="font-size:12px;color:rgba(255,255,255,0.7);">总费用（元）</div>
      <div style="font-size:36px;font-weight:700;margin-top:4px;">¥${data.totalPrice.toLocaleString()}</div>
    </div>
    <div class="payment-grid">
      <div class="payment-item">
        <div class="label">签约启动首付（50%）</div>
        <div class="amount">¥${firstPayment.toLocaleString()}</div>
        <div style="font-size:10px;color:rgba(255,255,255,0.5);margin-top:4px;">合同签订后3日内</div>
      </div>
      <div class="payment-item">
        <div class="label">服务中期支付（30%）</div>
        <div class="amount">¥${midPayment.toLocaleString()}</div>
        <div style="font-size:10px;color:rgba(255,255,255,0.5);margin-top:4px;">第${Math.ceil(data.planMonths / 2)}个月末</div>
      </div>
      <div class="payment-item">
        <div class="label">尾款（20%）</div>
        <div class="amount">¥${lastPayment.toLocaleString()}</div>
        <div style="font-size:10px;color:rgba(255,255,255,0.5);margin-top:4px;">服务结束（成果交付前）</div>
      </div>
    </div>
  </div>

  <div class="section-title" style="margin-top:24px;">费用说明</div>
  <div style="font-size:12px;line-height:2;color:#666;">
    <p>1. 以上报价为周期服务打包价，已包含该周期内所有服务模块的工作。</p>
    <p>2. 不包含亮空间服务模块服务费用（如需另计）。</p>
    <p>3. 报价不含税（税点6%），不含外地差旅费用（交通、住宿、餐补按实际发生结算）。</p>
    <p>4. 不含第三方执行费用（印刷、拍摄、制作、媒介投放、工程、版权购买等），如需采购按实际发生另行报价。</p>
  </div>

  <div class="section-title" style="margin-top:24px;">项目合作流程</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
    <div style="padding:12px;border-left:3px solid #cf1322;background:#f6f8fa;border-radius:0 8px 8px 0;font-size:12px;">
      <strong>A. 启动阶段</strong><br/>
      双方签订正式合同、支付首付款<br/>
      组建联合项目组<br/>
      召开项目启动会
    </div>
    <div style="padding:12px;border-left:3px solid #52c41a;background:#f6f8fa;border-radius:0 8px 8px 0;font-size:12px;">
      <strong>B. 执行阶段</strong><br/>
      每月召开品牌工程会<br/>
      关键节点正式汇报<br/>
      建立项目共享文件夹
    </div>
    <div style="padding:12px;border-left:3px solid #faad14;background:#f6f8fa;border-radius:0 8px 8px 0;font-size:12px;">
      <strong>C. 交付阶段</strong><br/>
      提交正式成果文件<br/>
      客户5个工作日内确认<br/>
      项目总结会、移交全套资料
    </div>
    <div style="padding:12px;border-left:3px solid #722ed1;background:#f6f8fa;border-radius:0 8px 8px 0;font-size:12px;">
      <strong>D. 后续支持</strong><br/>
      项目结束后3个月免费咨询<br/>
      后续扩展服务享受老客优惠
    </div>
  </div>

  <div style="margin-top:60px;padding-top:20px;border-top:2px solid #e8e8e8;">
    <table style="width:100%;font-size:12px;">
      <tr>
        <td style="width:50%;padding:12px;">
          <strong>亮品牌（甲方）</strong><br/><br/><br/>
          签章：___________________<br/><br/>
          日期：___________________
        </td>
        <td style="width:50%;padding:12px;">
          <strong>${data.customerInfo.company}（乙方）</strong><br/><br/><br/>
          签章：___________________<br/><br/>
          日期：___________________
        </td>
      </tr>
    </table>
  </div>

  <div class="footer">
    <span>机密文件 · 严禁外传</span>
    <span>保密级别：AAA</span>
    <span>第 4 页</span>
  </div>
</div>

<!-- ==================== Toolbar (no-print) ==================== -->
<div class="no-print" style="position:fixed;bottom:20px;right:20px;display:flex;gap:8px;z-index:9999;flex-direction:column;align-items:flex-end;">
  <button onclick="downloadPDF()" style="padding:12px 24px;background:#cf1322;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 2px 12px rgba(207,19,34,0.3);">
    ⬇ 下载 PDF
  </button>
  <button onclick="window.print()" style="padding:8px 16px;background:#555;color:#fff;border:none;border-radius:8px;font-size:13px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.15);">
    🖨 打印
  </button>
  <button onclick="window.close()" style="padding:8px 16px;background:#999;color:#fff;border:none;border-radius:8px;font-size:13px;cursor:pointer;">
    ✕ 关闭
  </button>
</div>

<script>
function downloadPDF() {
  var btn = event.target;
  btn.textContent = '⏳ 生成中...';
  btn.disabled = true;

  var opt = {
    margin:       0,
    filename:     '${data.customerInfo.company}-${data.planName}-报价单.pdf',
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, letterRendering: true, useCORS: true, logging: false },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
  };

  html2pdf().set(opt).from(document.body).save().then(function() {
    btn.textContent = '✅ 下载完成';
    setTimeout(function() { btn.textContent = '⬇ 下载 PDF'; btn.disabled = false; }, 2000);
  }).catch(function() {
    btn.textContent = '⬇ 下载 PDF';
    btn.disabled = false;
    alert('PDF 生成失败，请尝试使用「打印」功能');
  });
}
</script>

</body>
</html>`;
}
