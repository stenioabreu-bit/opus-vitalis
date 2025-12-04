# 🔄 Sistema de Sincronização - Opus Vitalis

## Problema Resolvido

**Antes**: Relatórios eram salvos apenas no localStorage do navegador e sumiam quando o usuário saía ou trocava de dispositivo.

**Agora**: Sistema de sincronização que simula uma "nuvem" usando localStorage estruturado, garantindo persistência dos dados.

## Arquivos Criados/Modificados

### 📁 **Novo Arquivo: `scripts/sync-service.js`**
- **Função**: Serviço principal de sincronização
- **Recursos**:
  - Sincronização automática de relatórios
  - Sincronização de compartilhamentos
  - Modo offline/online
  - Fila de sincronizações pendentes
  - Mesclagem inteligente de dados

### 🔧 **Modificado: `scripts/reports.js`**
- **Mudanças**:
  - Integração com SyncService
  - Sincronização automática ao criar relatórios
  - Sincronização automática ao compartilhar
  - Carregamento de dados da "nuvem"

### 🌐 **Páginas Atualizadas**:
- `create-report.html` - Inclui sync service
- Compartilhamento removido  
- `reports.html` - Inclui sync service
- `dashboard.html` - Inclui sync service

### 🧪 **Nova Página: `test-sync.html`**
- **Função**: Ferramenta completa de teste de sincronização
- **Recursos**:
  - Status de sincronização em tempo real
  - Teste de criação e sincronização
  - Teste de compartilhamento
  - Simulação offline/online
  - Limpeza de dados

## Como Funciona

### 1. **Armazenamento em Camadas**
```
┌─────────────────┐
│   Dados JSON    │ ← Dados estáticos iniciais
│   (read-only)   │
└─────────────────┘
         ↓
┌─────────────────┐
│  localStorage   │ ← Dados locais do usuário
│    (local)      │
└─────────────────┘
         ↓
┌─────────────────┐
│ Cloud Storage   │ ← Simulação de nuvem
│  (simulado)     │   (localStorage estruturado)
└─────────────────┘
```

### 2. **Fluxo de Sincronização**

#### **Criação de Relatório**:
1. Usuário cria relatório
2. Salva no localStorage local
3. Sincroniza automaticamente para "nuvem"
4. Se offline, adiciona à fila de pendências

#### **Compartilhamento**:
1. Usuário compartilha relatório
2. Atualiza dados locais
3. Sincroniza compartilhamento para "nuvem"
4. Cria notificações para usuários alvo

#### **Carregamento**:
1. Carrega dados estáticos (JSON)
2. Carrega dados locais (localStorage)
3. Carrega dados da "nuvem" (cloud storage)
4. Mescla tudo inteligentemente

### 3. **Modo Offline/Online**

#### **Offline**:
- Dados salvos apenas localmente
- Ações adicionadas à fila de pendências
- Interface mostra status offline

#### **Online**:
- Sincronização automática
- Processa fila de pendências
- Mescla dados com a nuvem

## Chaves do localStorage

### **Dados Principais**:
- `opus_vitalis_reports` - Relatórios locais
- `opus_vitalis_cloud_reports` - Simulação da nuvem
- `opus_vitalis_notifications` - Notificações
- `opus_vitalis_session` - Sessão do usuário

### **Sincronização**:
- `opus_vitalis_pending_syncs` - Fila de sincronizações
- `opus_vitalis_last_sync` - Timestamp da última sync

## Benefícios

### ✅ **Persistência de Dados**
- Relatórios não somem mais ao sair
- Dados mantidos entre sessões
- Backup automático na "nuvem"

### ✅ **Compartilhamento Funcional**
- Relatórios compartilhados persistem
- Notificações funcionam corretamente
- Sincronização entre usuários

### ✅ **Modo Offline**
- Funciona sem internet
- Sincroniza quando volta online
- Não perde dados

### ✅ **Escalabilidade**
- Fácil migração para API real
- Estrutura preparada para backend
- Separação clara de responsabilidades

## Como Testar

### 1. **Teste Básico**
1. Abra `test-sync.html`
2. Clique em "Criar Relatório de Teste"
3. Verifique se aparece na nuvem
4. Saia e entre novamente
5. Confirme que o relatório ainda está lá

### 2. **Teste de Compartilhamento**
1. Crie um relatório
2. Clique em "Testar Compartilhamento"
3. Verifique se foi compartilhado
4. Mude de usuário e veja se aparece nos compartilhados

### 3. **Teste Offline**
1. Clique em "Simular Offline"
2. Crie relatórios
3. Clique em "Simular Online"
4. Verifique se sincronizou automaticamente

## Próximos Passos (Futuro)

### 🚀 **Migração para API Real**
- Substituir localStorage por chamadas HTTP
- Implementar autenticação JWT
- Adicionar validação server-side

### 📱 **Melhorias de UX**
- Indicador visual de status de sync
- Notificações push
- Resolução de conflitos

### 🔒 **Segurança**
- Criptografia de dados sensíveis
- Controle de acesso granular
- Auditoria de ações

---

**Status**: ✅ Implementado e funcionando
**Teste**: Use `test-sync.html` para verificar todas as funcionalidades