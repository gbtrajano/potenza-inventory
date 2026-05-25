export const LOJAS = [
  'POTENZA-FIAT-DC', 'POTENZA-FIAT-NC', 'POTENZA-FIAT-NP', 'POTENZA-FIAT-SG',
  'POTENZA-FIAT-VR', 'POTENZA-JEEP-CG', 'POTENZA-JEEP-SG', 'POTENZA-KIA-NI',
  'POTENZA-LEAP-BT', 'POTENZA-LEAP-NC', 'POTENZA-MG-RB', 'POTENZA-NETA-RB'
];

export const TIPOS = [
  'ALEXA', 'APARELHO DE SOM', 'CAIXA DE SOM', 'CONTROLADORA DE VÍDEO', 'DESKTOP',
  'DVD', 'DVR', 'ESTABILIZADOR', 'ETIQUETADORA', 'IMPRESSORA',
  'LEITOR DE CÓDIGO DE BARRAS', 'MIKROTIK', 'MONITOR', 'MULTIPLICADOR VGA',
  'NOBREAK', 'NOTEBOOK', 'PROJETOR', 'PAGER WIRELESS', 'RELÓGIO DE PONTO',
  'ROTEADOR', 'SWITCH', 'TABLET', 'TELA', 'TELA DE SENHAS', 'TELEFONE', 'TELEVISÃO'
];

export const DEPARTAMENTOS = [
  'ADMINISTRATIVO', 'CONTAS A PAGAR', 'CONTAS A RECEBER', 'CONTROLADORIA',
  'CONTROLE BANCÁRIO', 'CRM', 'DIRETORIA', 'ESTOQUE TI', 'FATURAMENTO',
  'FISCAL', 'F&I', 'GARANTIA', 'GERÊNCIA', 'MARKETING', 'OFICINA', 'PEÇAS',
  'PNEUS', 'PÓS VENDAS', 'QUALIDADE', 'RH/DP', 'TESOURARIA', 'TI',
  'TREINAMENTO', 'VEÍCULOS NOVOS', 'VEÍCULOS USADOS', 'VENDAS DIRETAS'
];

// Fields that each tipo shows (beyond basics)
export const TIPO_FIELDS: Record<string, string[]> = {
  'IMPRESSORA': ['ip', 'pin', 'patrimonio_antigo', 'patrimonio', 'observacao'],
  'NOTEBOOK': ['usuario', 'cargo', 'patrimonio_antigo', 'patrimonio', 'patrimonio_vinculado', 'observacao'],
  'DESKTOP': ['usuario', 'cargo', 'ip', 'patrimonio_antigo', 'patrimonio', 'patrimonio_vinculado', 'observacao'],
  'MONITOR': ['usuario', 'cargo', 'patrimonio_antigo', 'patrimonio', 'patrimonio_vinculado', 'observacao'],
  'TELEFONE': ['ramal', 'usuario', 'cargo', 'patrimonio_antigo', 'patrimonio', 'observacao'],
  'TABLET': ['usuario', 'cargo', 'ip', 'patrimonio_antigo', 'patrimonio', 'observacao'],
  'SWITCH': ['ip', 'patrimonio_antigo', 'patrimonio', 'observacao'],
  'ROTEADOR': ['ip', 'patrimonio_antigo', 'patrimonio', 'observacao'],
  'MIKROTIK': ['ip', 'patrimonio_antigo', 'patrimonio', 'observacao'],
  'NOBREAK': ['patrimonio_antigo', 'patrimonio', 'observacao'],
  'ESTABILIZADOR': ['patrimonio_antigo', 'patrimonio', 'observacao'],
  'DVR': ['ip', 'patrimonio_antigo', 'patrimonio', 'observacao'],
  'TELEVISÃO': ['patrimonio_antigo', 'patrimonio', 'observacao'],
  'TELA': ['patrimonio_antigo', 'patrimonio', 'observacao'],
  'TELA DE SENHAS': ['ip', 'patrimonio_antigo', 'patrimonio', 'observacao'],
  'PROJETOR': ['patrimonio_antigo', 'patrimonio', 'observacao'],
  'DEFAULT': ['usuario', 'cargo', 'ip', 'ramal', 'pin', 'patrimonio_antigo', 'patrimonio', 'patrimonio_vinculado', 'observacao']
};

export const FIELD_LABELS: Record<string, string> = {
  loja: 'Loja',
  tipo: 'Tipo',
  departamento: 'Departamento',
  localizacao: 'Localização',
  modelo: 'Modelo',
  numero_serie: 'Nº de Série',
  ip: 'IP',
  usuario: 'Usuário',
  pin: 'PIN',
  cargo: 'Cargo',
  ramal: 'Ramal',
  patrimonio_antigo: 'Patrimônio Antigo',
  patrimonio: 'Patrimônio',
  patrimonio_vinculado: 'Patrimônio Vinculado',
  observacao: 'Observação',
};

export const CSV_COLUMN_MAP: Record<string, string> = {
  'LOJA': 'loja',
  'TIPO': 'tipo',
  'DEPARTAMENTO': 'departamento',
  'LOCALIZAÇÃO': 'localizacao',
  'LOCALIZACAO': 'localizacao',
  'MODELO': 'modelo',
  'Nº DE SÉRIE': 'numero_serie',
  'Nº DE SERIE': 'numero_serie',
  'N DE SÉRIE': 'numero_serie',
  'N DE SERIE': 'numero_serie',
  'NUMERO DE SERIE': 'numero_serie',
  'IP': 'ip',
  'USUÁRIO': 'usuario',
  'USUARIO': 'usuario',
  'PIN': 'pin',
  'CARGO': 'cargo',
  'RAMA': 'ramal',
  'RAMAL': 'ramal',
  'PATRIMÔNIO ANTIGO': 'patrimonio_antigo',
  'PATRIMONIO ANTIGO': 'patrimonio_antigo',
  'PATRIMÔNIO': 'patrimonio',
  'PATRIMONIO': 'patrimonio',
  'PATRIMÔNIO VINCULADO': 'patrimonio_vinculado',
  'PATRIMONIO VINCULADO': 'patrimonio_vinculado',
  'OBS.': 'observacao',
  'OBS': 'observacao',
  'OBSERVAÇÃO': 'observacao',
  'OBSERVACAO': 'observacao',
};
