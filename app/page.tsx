"use client";
import { useState, useEffect, useCallback } from "react";
import Dashboard from "@/components/Dashboard";
import InventoryList from "@/components/InventoryList";
import ItemForm from "@/components/ItemForm";
import TransferModal from "@/components/TransferModal";
import ImportExport from "@/components/ImportExport";
import DatabasePage from "@/components/DatabasePage";
import HistoryPage from "@/components/HistoryPage";
import {
  LayoutDashboard, Package, PlusCircle, ArrowRightLeft,
  UploadCloud, Database, History, Menu, X, Monitor, ChevronRight
} from "lucide-react";
import { InventoryItem } from "@/lib/db";

type Page = "dashboard" | "inventory" | "add" | "transfer" | "import-export" | "database" | "history";

export default function Home() {
  const [page, setPage] = useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [transferItem, setTransferItem] = useState<InventoryItem | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
    { id: "inventory", label: "Inventário", icon: <Package size={16} /> },
    { id: "add", label: "Adicionar Item", icon: <PlusCircle size={16} /> },
    { id: "transfer", label: "Transferência", icon: <ArrowRightLeft size={16} /> },
    { id: "import-export", label: "Import / Export", icon: <UploadCloud size={16} /> },
    { id: "history", label: "Histórico", icon: <History size={16} /> },
    { id: "database", label: "Banco de Dados", icon: <Database size={16} /> },
  ];

  const pageTitle: Record<Page, string> = {
    dashboard: "Dashboard", inventory: "Inventário", add: editItem ? "Editar Item" : "Novo Item",
    transfer: "Transferência Rápida", "import-export": "Importar / Exportar",
    database: "Banco de Dados", history: "Histórico de Alterações",
  };

  function handleEdit(item: InventoryItem) {
    setEditItem(item);
    setPage("add");
  }
  function handleTransfer(item: InventoryItem) {
    setTransferItem(item);
  }
  function handleFormDone() {
    setEditItem(null);
    setPage("inventory");
    refresh();
  }
  function handleNav(p: Page) {
    if (p !== "add") setEditItem(null);
    setPage(p);
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? 220 : 0,
        minWidth: sidebarOpen ? 220 : 0,
        background: "var(--bg2)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        transition: "width 0.2s, min-width 0.2s",
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ padding: "20px 16px 12px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
            }}>
              <Monitor size={16} color="#0a0c10" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)", lineHeight: 1 }}>POTENZA</div>
              <div style={{ fontSize: 10, color: "var(--text2)", letterSpacing: 2 }}>INVENTÁRIO TI</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
          {navItems.map(item => (
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
          v1.0.0 · SQLite Local
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <header style={{
          height: 56,
          background: "var(--bg2)",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          gap: 12,
          flexShrink: 0,
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
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflow: "auto", padding: 24 }}>
          {page === "dashboard" && <Dashboard key={refreshKey} onNavigate={handleNav} />}
          {page === "inventory" && (
            <InventoryList
              key={refreshKey}
              onEdit={handleEdit}
              onTransfer={handleTransfer}
              onRefresh={refresh}
            />
          )}
          {page === "add" && (
            <ItemForm
              item={editItem}
              onDone={handleFormDone}
              onCancel={() => { setEditItem(null); setPage("inventory"); }}
            />
          )}
          {page === "transfer" && (
            <TransferModal standalone onDone={refresh} />
          )}
          {page === "import-export" && <ImportExport onDone={refresh} />}
          {page === "history" && <HistoryPage key={refreshKey} />}
          {page === "database" && <DatabasePage key={refreshKey} onDone={refresh} />}
        </main>
      </div>

      {/* Transfer modal overlay (from inventory list) */}
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
