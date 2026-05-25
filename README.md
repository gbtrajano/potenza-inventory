# 🖥️ Potenza TI — Sistema de Inventário

Sistema de gerenciamento de inventário de TI com banco de dados local (.db).

## Requisitos
- Node.js 18+
- npm

## Instalação

```bash
# Extraia o arquivo
tar -xzf potenza-inventory.tar.gz
cd potenza-inventory

# Instale as dependências
npm install

# Inicie em modo desenvolvimento
npm run dev

# OU em modo produção
npm run build
npm start
```

Acesse: **http://localhost:3000**

## Banco de Dados
O banco de dados fica em `./data/inventory.db` (arquivo JSON estruturado).
Faça backup regularmente pela página "Banco de Dados" do sistema.

## Funcionalidades
- 📊 Dashboard com estatísticas completas
- 📦 Inventário com filtros por Loja, Tipo, Departamento
- ➕ Cadastro inteligente por tipo de equipamento
- 🔄 Transferência rápida entre usuários/locais
- 📥 Importação de CSV (planilha Excel)
- 📤 Exportação CSV e JSON
- 🕐 Histórico completo de alterações
- 💾 Backup e restauração do banco de dados
