
import {
  LayoutDashboard,
  Search,
  Bot,
  ListTodo,
  History,
  FileCode2,
  Terminal,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  pendingCount: number;
  runnerState: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  pendingCount,
  runnerState
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'search', label: 'Job Search', icon: Search },
    { id: 'automation', label: 'Automation', icon: Bot, badge: runnerState === 'Running' ? 'Active' : undefined },
    { id: 'queue', label: 'Review Queue', icon: ListTodo, count: pendingCount },
    { id: 'history', label: 'History', icon: History },
    { id: 'config', label: 'Configuration', icon: FileCode2 },
    { id: 'logs', label: 'Logs', icon: Terminal },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-screen z-30 transition-all duration-300 border-r border-slate-800/80 bg-slate-950/80 backdrop-blur-xl flex flex-col justify-between ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div>
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/60">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center glow-primary">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-slate-100 tracking-tight text-base leading-none">JobPilot AI</h1>
                <span className="text-[10px] font-semibold tracking-wider uppercase text-cyan-400">Enterprise Edition</span>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-full flex justify-center">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center glow-primary">
                <Zap className="w-5 h-5 text-white" />
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600/30 to-cyan-500/20 text-white border border-indigo-500/30 shadow-lg shadow-indigo-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                } ${collapsed ? 'justify-center px-0' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                {!collapsed && <span className="truncate flex-1 text-left">{item.label}</span>}

                {!collapsed && item.count !== undefined && item.count > 0 && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {item.count}
                  </span>
                )}
                {!collapsed && item.badge && (
                  <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Engine Status Footprint */}
      {!collapsed && (
        <div className="p-4 border-t border-slate-800/60">
          <div className="glass-panel p-3 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    runnerState === 'Running'
                      ? 'bg-emerald-400'
                      : runnerState === 'Paused'
                      ? 'bg-amber-400'
                      : 'bg-slate-500'
                  }`}
                ></span>
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    runnerState === 'Running'
                      ? 'bg-emerald-500'
                      : runnerState === 'Paused'
                      ? 'bg-amber-500'
                      : 'bg-slate-400'
                  }`}
                ></span>
              </span>
              <div>
                <div className="text-xs font-semibold text-slate-200">Engine {runnerState}</div>
                <div className="text-[10px] text-slate-400">Playwright Worker v1.48</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
