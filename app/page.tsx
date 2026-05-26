"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Dashboard from "@/components/Dashboard";
import InventoryList from "@/components/InventoryList";
import ItemForm from "@/components/ItemForm";
import TransferModal from "@/components/TransferModal";
import ImportExport from "@/components/ImportExport";
import DatabasePage from "@/components/DatabasePage";
import HistoryPage from "@/components/HistoryPage";
import UsersPage from "@/components/UsersPage";
import {
  LayoutDashboard, Package, PlusCircle, ArrowRightLeft,
  UploadCloud, Database, History, Menu, X, Monitor,
  ChevronRight, LogOut, Users, Shield, ChevronDown,
} from "lucide-react";
import { InventoryItem } from "@/lib/db";

type Page = "dashboard" | "inventory" | "add" | "transfer" | "import-export" | "database" | "history" | "users";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [page, setPage] = useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [transferItem, setTransferItem] = useState<InventoryItem | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);
  const role = (session?.user as any)?.role as string;
  const isAdmin = role === "admin";
  const canEdit = role === "admin" || role === "editor";

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status === "loading" || status === "unauthenticated") return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", color: "var(--text2)", fontSize: 13 }}>
      Carregando...
    </div>
  );

  const navItems: { id: Page; label: string; icon: React.ReactNode; adminOnly?: boolean; editorOnly?: boolean }[] = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
    { id: "inventory", label: "Inventário", icon: <Package size={16} /> },
    { id: "add", label: "Adicionar Item", icon: <PlusCircle size={16} />, editorOnly: true },
    { id: "transfer", label: "Transferência", icon: <ArrowRightLeft size={16} />, editorOnly: true },
    { id: "import-export", label: "Import / Export", icon: <UploadCloud size={16} />, editorOnly: true },
    { id: "history", label: "Histórico", icon: <History size={16} /> },
    { id: "database", label: "Banco de Dados", icon: <Database size={16} />, adminOnly: true },
    { id: "users", label: "Usuários", icon: <Users size={16} />, adminOnly: true },
  ];

  const visibleNav = navItems.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.editorOnly && !canEdit) return false;
    return true;
  });

  const pageTitle: Record<Page, string> = {
    dashboard: "Dashboard", inventory: "Inventário", add: editItem ? "Editar Item" : "Novo Item",
    transfer: "Transferência Rápida", "import-export": "Importar / Exportar",
    database: "Banco de Dados", history: "Histórico de Alterações", users: "Gerenciar Usuários",
  };

  const ROLE_DISPLAY: Record<string, { label: string; color: string }> = {
    admin: { label: "Admin", color: "#f59e0b" },
    editor: { label: "Editor", color: "#3b82f6" },
    viewer: { label: "Visualizador", color: "#6b7280" },
  };
  const roleInfo = ROLE_DISPLAY[role] || ROLE_DISPLAY.viewer;

  function handleEdit(item: InventoryItem) { setEditItem(item); setPage("add"); }
  function handleTransfer(item: InventoryItem) { setTransferItem(item); }
  function handleFormDone() { setEditItem(null); setPage("inventory"); refresh(); }
  function handleNav(p: Page) {
    if (p !== "add") setEditItem(null);
    setPage(p);
    setUserMenuOpen(false);
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? 220 : 0, minWidth: sidebarOpen ? 220 : 0,
        background: "var(--bg2)", borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column", overflow: "hidden",
        transition: "width 0.2s, min-width 0.2s", flexShrink: 0,
      }}>
        <div style={{ padding: "20px 16px 12px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Monitor size={16} color="#0a0c10" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)", lineHeight: 1 }}>POTENZA</div>
              <div style={{ fontSize: 10, color: "var(--text2)", letterSpacing: 2 }}>INVENTÁRIO TI</div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
          {visibleNav.map(item => (
            <button
              key={item.id}
              className={`sidebar-link${page === item.id ? " active" : ""}`}
              onClick={() => handleNav(item.id)}
            >
              {item.icon}
              <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>
            </button>
          ))}
        </nav>

        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", fontSize: 10, color: "var(--text2)" }}>
          v1.1.0 · SQLite Local
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <header style={{
          height: 56, background: "var(--bg2)", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", padding: "0 20px", gap: 12, flexShrink: 0,
        }}>
          <button
            onClick={() => setSidebarOpen(o => !o)}
            style={{ background: "none", border: "none", color: "var(--text2)", cursor: "pointer", padding: 4, display: "flex" }}
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text2)" }}>
            <span>TI</span>
            <ChevronRight size={12} />
            <span style={{ color: "var(--text)", fontWeight: 600 }}>{pageTitle[page]}</span>
          </div>

          {/* User menu */}
          <div style={{ marginLeft: "auto", position: "relative" }}>
            <button
              onClick={() => setUserMenuOpen(o => !o)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "var(--bg3)", border: "1px solid var(--border)",
                borderRadius: 8, padding: "6px 12px", cursor: "pointer",
                color: "var(--text)", fontSize: 12, fontFamily: "inherit",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
            >
              <div style={{
                width: 24, height: 24, borderRadius: "50%",
                background: `${roleInfo.color}22`, border: `1px solid ${roleInfo.color}55`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Shield size={12} color={roleInfo.color} />
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontWeight: 600, lineHeight: 1 }}>{session?.user?.name}</div>
                <div style={{ fontSize: 10, color: roleInfo.color, lineHeight: 1, marginTop: 1 }}>{roleInfo.label}</div>
              </div>
              <ChevronDown size={12} style={{ color: "var(--text2)", marginLeft: 2 }} />
            </button>

            {userMenuOpen && (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setUserMenuOpen(false)} />
                <div style={{
                  position: "absolute", right: 0, top: "calc(100% + 8px)",
                  background: "var(--bg2)", border: "1px solid var(--border)",
                  borderRadius: 10, padding: 8, minWidth: 180,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4)", zIndex: 50,
                  animation: "slideUp 0.15s ease",
                }}>
                  <div style={{ padding: "8px 12px 10px", borderBottom: "1px solid var(--border)", marginBottom: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{session?.user?.name}</div>
                    <div style={{ fontSize: 10, color: "var(--text2)", marginTop: 2 }}>@{(session?.user as any)?.username}</div>
                  </div>
                  {isAdmin && (
                    <button className="sidebar-link" onClick={() => handleNav("users")} style={{ fontSize: 12 }}>
                      <Users size={14} /> Gerenciar Usuários
                    </button>
                  )}
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      width: "100%", padding: "8px 12px", background: "none",
                      border: "none", cursor: "pointer", color: "#ef4444",
                      fontSize: 12, fontFamily: "inherit", borderRadius: 6,
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}
                    onMouseLeave={e => e.currentTarget.style.background = "none"}
                  >
                    <LogOut size={14} /> Sair do sistema
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflow: "auto", padding: 24 }}>
          {page === "dashboard" && <Dashboard key={refreshKey} onNavigate={handleNav} />}
          {page === "inventory" && (
            <InventoryList
              key={refreshKey}
              onEdit={canEdit ? handleEdit : () => {}}
              onTransfer={canEdit ? handleTransfer : () => {}}
              onRefresh={refresh}
              canEdit={canEdit}
            />
          )}
          {page === "add" && canEdit && (
            <ItemForm item={editItem} onDone={handleFormDone} onCancel={() => { setEditItem(null); setPage("inventory"); }} />
          )}
          {page === "transfer" && canEdit && (
            <TransferModal standalone onDone={refresh} />
          )}
          {page === "import-export" && canEdit && <ImportExport onDone={refresh} />}
          {page === "history" && <HistoryPage key={refreshKey} />}
          {page === "database" && isAdmin && <DatabasePage key={refreshKey} onDone={refresh} />}
          {page === "users" && isAdmin && <UsersPage key={refreshKey} />}
        </main>
      </div>

      {transferItem && (
        <TransferModal
          item={transferItem}
          onDone={() => { setTransferItem(null); refresh(); }}
          onClose={() => setTransferItem(null)}
        />
      )}
    </div>
  );
}
