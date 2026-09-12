import React, { useState } from 'react';
import {
  type LLMConfig,
  saveLLMConfig,
  testLLMConnection,
} from '../services/llmService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: LLMConfig;
  onUpdateConfig: (newConfig: LLMConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
}) => {
  const [formData, setFormData] = useState<LLMConfig>({ ...config });
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success?: boolean;
    latencyMs?: number;
    message?: string;
    error?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    const res = await testLLMConnection(formData);
    setIsTesting(false);
    setTestResult(res);
  };

  const handleSave = () => {
    saveLLMConfig(formData);
    onUpdateConfig(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-[480px] bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-neutral-200/80 flex flex-col text-neutral-900 select-none"
        style={{
          boxShadow: '0 20px 50px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">⚙️</span>
            <div>
              <h3 className="text-[16px] font-bold tracking-tight text-neutral-900">
                FreeLLMAPI & 游戏配置
              </h3>
              <p className="text-[12px] text-neutral-400">
                连接你自建的 LLM 服务器，激活 AI 对手灵魂与教练
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <div className="flex flex-col gap-4 py-4 text-xs">
          {/* API Base URL */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-neutral-700 flex items-center justify-between">
              <span>API 接口地址 (Base URL)</span>
              <span className="text-[11px] text-neutral-400 font-normal">兼容 OpenAI /v1 规范</span>
            </label>
            <input
              type="text"
              value={formData.baseUrl}
              onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
              placeholder="http://你的服务器IP:8000/v1 或 /api/chat"
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none text-xs transition-all font-mono"
            />
            <span className="text-[10.5px] text-neutral-400 leading-tight">
              💡 部署到 Vercel 时，系统会自动通过 Edge 函数转发你的 HTTP 服务器，彻底免受浏览器 Mixed Content 和跨域 CORS 拦截。
            </span>
          </div>

          {/* Model Name */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-neutral-700">
              模型名称 (Model)
            </label>
            <input
              type="text"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder="deepseek-chat / gpt-4o-mini / qwen2.5"
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none text-xs transition-all font-mono"
            />
          </div>

          {/* API Key */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-neutral-700 flex items-center justify-between">
              <span>API Key (密钥)</span>
              <span className="text-[11px] text-neutral-400 font-normal">自建无鉴权可留空</span>
            </label>
            <input
              type="password"
              value={formData.apiKey}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              placeholder="sk-... (无则留空)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none text-xs transition-all font-mono"
            />
          </div>

          {/* Feature Toggles */}
          <div className="flex flex-col gap-2 pt-1">
            <span className="font-semibold text-neutral-700">功能开关</span>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 border border-neutral-100">
              <span className="text-neutral-700 font-medium">💬 AI 牌手个性对话与垃圾话气泡</span>
              <input
                type="checkbox"
                checked={formData.botChatEnabled}
                onChange={(e) => setFormData({ ...formData, botChatEnabled: e.target.checked })}
                className="w-4 h-4 accent-sky-500 cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 border border-neutral-100">
              <span className="text-neutral-700 font-medium">🧠 AI 实时德州教练建议 (Coach)</span>
              <input
                type="checkbox"
                checked={formData.coachEnabled}
                onChange={(e) => setFormData({ ...formData, coachEnabled: e.target.checked })}
                className="w-4 h-4 accent-sky-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Test connection output */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border text-[11.5px] leading-relaxed transition-all ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {testResult.success ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm">✓</span>
                  <span>
                    <strong>连通成功</strong> ({testResult.latencyMs}ms) · {testResult.message}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <span className="font-bold flex items-center gap-1.5">
                    <span>✕</span> 连接失败 ({testResult.latencyMs}ms)
                  </span>
                  <span className="font-mono text-[11px] opacity-85">{testResult.error}</span>
                  <span className="text-[10.5px] text-rose-600 mt-0.5">
                    💡 提示：如果服务在云服务器，请确认已开启 CORS 跨域允许或放行对应安全组端口。
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
          <button
            type="button"
            onClick={handleTest}
            disabled={isTesting || !formData.baseUrl}
            className="px-4 py-2 text-xs font-semibold text-neutral-700 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 disabled:opacity-50 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            {isTesting ? (
              <>
                <span className="w-2.5 h-2.5 border-2 border-neutral-600 border-t-transparent rounded-full animate-spin" />
                <span>测试中...</span>
              </>
            ) : (
              <>
                <span>⚡</span>
                <span>测试连通性</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-700 rounded-xl transition-all cursor-pointer"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 active:scale-95 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              保存配置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
