# Design Document

## Overview

O sistema de autenticação e relatórios será implementado como uma aplicação web com interface inspirada no universo de Ordem Paranormal. A arquitetura consiste em múltiplas páginas HTML com CSS para estilização temática, JavaScript para lógica de autenticação e gerenciamento de relatórios, e arquivos JSON para armazenar credenciais e dados dos relatórios.

### Visual Theme - Ordem Paranormal
A interface seguirá uma estética sombria e tecnológica com:
- Fundo completamente preto para criar atmosfera imersiva
- Cores saturadas e contrastantes para elementos interativos
- Tipografia limpa com boa legibilidade
- Efeitos sutis de glow/brilho nos elementos ativos
- Layout minimalista focado na funcionalidade

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Login Page    │    │   Dashboard      │    │   Report Pages  │
│   (Auth UI)     │    │   (Main Hub)     │    │   (CRUD UI)     │
└─────────┬───────┘    └─────────┬────────┘    └─────────┬───────┘
          │                      │                       │
          └──────────────────────┼───────────────────────┘
                                 │
          ┌─────────────────────────────────────────────────┐
          │              JavaScript Logic                   │
          │  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │
          │  │    Auth     │  │   Reports   │  │  Sharing │ │
          │  │   Service   │  │   Service   │  │ Service  │ │
          │  └─────────────┘  └─────────────┘  └──────────┘ │
          └─────────────────────┬───────────────────────────┘
                                │
          ┌─────────────────────────────────────────────────┐
          │              JSON Storage                       │
          │  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │
          │  │   users.json│  │reports.json │  │teams.json│ │
          │  └─────────────┘  └─────────────┘  └──────────┘ │
          └─────────────────────────────────────────────────┘
```

A aplicação seguirá uma arquitetura modular de três camadas:
- **Presentation Layer**: Múltiplas páginas HTML/CSS para diferentes funcionalidades
- **Logic Layer**: JavaScript modular para autenticação, relatórios e compartilhamento
- **Data Layer**: Múltiplos arquivos JSON para diferentes tipos de dados

## Components and Interfaces

### User Interface Components

#### Login Page
- **Login Form**: Formulário com campos de usuário e senha
- **Submit Button**: Botão para enviar credenciais
- **Message Display**: Área para mostrar feedback ao usuário

#### Dashboard Page
- **Navigation Menu**: Menu com opções para criar relatório, ver relatórios, logout
- **Reports List**: Lista dos relatórios do usuário com preview
- **Quick Actions**: Botões de acesso rápido para funcionalidades principais

#### Report Creation Page
- **Report Form**: Formulário para criar novo relatório
- **Fields**: Título, descrição, data, status da missão
- **Save/Cancel Buttons**: Controles para salvar ou cancelar

#### Report View Page
- **Report Display**: Visualização completa do relatório
- **Share Controls**: Opções para compartilhar com equipe/chefe
- **Edit/Delete Options**: Controles para modificar relatório próprio

#### Shared Reports Page
- **Team Reports**: Lista de relatórios compartilhados pela equipe
- **Filter Options**: Filtros por autor, data, status

### Color Palette (Ordem Paranormal Theme)
- **Background**: Preto profundo (#000000 ou #0a0a0a)
- **Primary Accent**: Azul saturado tecnológico (#00d4ff ou #0099cc)
- **Error/Alert**: Vermelho sangue (#cc0000 ou #8b0000)
- **Success**: Verde musgo tecnológico (#4a7c59 ou #2d5a3d)
- **Text**: Branco/cinza claro (#ffffff ou #e0e0e0)
- **Borders/Lines**: Cinza escuro com toque de azul (#1a1a2e ou #16213e)
- **Cards/Panels**: Cinza muito escuro com transparência (#1a1a1a ou rgba(26,26,26,0.8))

### Authentication Service
- **validateCredentials()**: Função para validar login contra banco estático
- **loadUserData()**: Função para carregar dados completos do usuário
- **handleLogin()**: Função principal que coordena o processo de login
- **handleLogout()**: Função para encerrar sessão do usuário
- **checkSession()**: Função para verificar se usuário está logado

### Reports Service
- **createReport()**: Função para criar novo relatório
- **loadReports()**: Função para carregar relatórios do usuário
- **loadSharedReports()**: Função para carregar relatórios compartilhados
- **shareReport()**: Função para compartilhar relatório com outros usuários
- **deleteReport()**: Função para excluir relatório próprio
- **editReport()**: Função para editar relatório existente

### Team Management Service
- **loadTeamMembers()**: Função para carregar membros da equipe
- **checkPermissions()**: Função para verificar permissões de acesso
- **getTeamReports()**: Função para líderes acessarem relatórios da equipe

### Data Storage
- **users.json**: Arquivo contendo credenciais e dados dos usuários
- **reports.json**: Arquivo contendo todos os relatórios criados
- **teams.json**: Arquivo contendo estrutura das equipes e hierarquias

## Data Models

### User Model
```javascript
{
  "id": string,
  "username": string,
  "password": string,
  "name": string,
  "role": "agent" | "leader",
  "team": string,
  "createdAt": string
}
```

### Report Model
```javascript
{
  "id": string,
  "title": string,
  "description": string,
  "missionDate": string,
  "status": "completed" | "failed" | "partial",
  "authorId": string,
  "authorName": string,
  "createdAt": string,
  "updatedAt": string,
  "sharedWith": string[],
  "isPublic": boolean
}
```

### Team Model
```javascript
{
  "id": string,
  "name": string,
  "leaderId": string,
  "members": string[],
  "createdAt": string
}
```

### Authentication Response Model
```javascript
{
  "success": boolean,
  "message": string,
  "user": User | null,
  "sessionToken": string
}
```

### Database Schemas

#### users.json
```json
{
  "bella_evans": {
    "id": "user_001",
    "username": "bella_evans",
    "password": "sãocristovão2016",
    "name": "Bella Evans",
    "role": "agent",
    "team": "team_alpha",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### reports.json
```json
{
  "report_001": {
    "id": "report_001",
    "title": "Investigação Paranormal - Casa Abandonada",
    "description": "Relatório detalhado da investigação...",
    "missionDate": "2024-12-01",
    "status": "completed",
    "authorId": "user_001",
    "authorName": "Bella Evans",
    "createdAt": "2024-12-01T18:30:00Z",
    "updatedAt": "2024-12-01T18:30:00Z",
    "sharedWith": ["user_002"],
    "isPublic": false
  }
}
```

#### teams.json
```json
{
  "team_alpha": {
    "id": "team_alpha",
    "name": "Equipe Alpha",
    "leaderId": "user_002",
    "members": ["user_001", "user_003"],
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```
## Correc
tness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, several properties can be consolidated:
- Properties 2.2 and 4.1 both test successful authentication feedback - can be combined
- Properties 2.3 and 4.2 both test failed authentication feedback - can be combined
- Property 3.2 is the core validation logic that other properties depend on

### Core Properties

#### Authentication Properties

**Property 1: Valid credentials authentication**
*For any* credentials that exist in the user database, the authentication function should return success and provide positive feedback
**Validates: Requirements 2.2, 4.1**

**Property 2: Invalid credentials rejection**
*For any* credentials that do not exist in the user database, the authentication function should return failure and display an error message
**Validates: Requirements 2.3, 4.2**

**Property 3: Password field clearing on failure**
*For any* failed authentication attempt, the password input field should be cleared while the username field retains its value
**Validates: Requirements 2.4**

**Property 4: Database validation consistency**
*For any* credential validation request, the system should always compare against the loaded user database data
**Validates: Requirements 3.2**

#### Report Management Properties

**Property 5: Report creation persistence**
*For any* valid report data submitted by an authenticated user, the system should save the report with unique ID and timestamp
**Validates: Requirements 5.4, 5.5**

**Property 6: Report ownership**
*For any* created report, only the original author should have edit and delete permissions
**Validates: Requirements 6.3**

**Property 7: Report sharing access**
*For any* report shared with a user, that user should have read-only access to the complete report content
**Validates: Requirements 7.4, 7.5**

**Property 8: Team hierarchy access**
*For any* team leader, they should have read access to all reports created by their team members
**Validates: Requirements 8.1, 8.3**

**Property 9: Report chronological ordering**
*For any* list of reports displayed to a user, they should be ordered by creation date with most recent first
**Validates: Requirements 6.4**

## Error Handling

### File Loading Errors
- Graceful handling when users.json cannot be read
- Default to empty credentials set if file is missing
- Display appropriate error message to user

### Authentication Errors
- Clear error messages for invalid credentials
- No sensitive information leaked in error messages
- Proper state management after failed attempts

### UI Error States
- Visual feedback for network/loading issues usando vermelho sangue
- Fallback styling if CSS fails to load
- Accessible error messages with proper contrast against black background
- Success messages in verde musgo tecnológico
- Loading states with azul saturado pulsante

## Testing Strategy

### Unit Testing Approach
The system will use standard JavaScript testing with Jest or similar framework for:
- Specific credential validation examples
- UI element presence verification
- Error handling edge cases
- File loading scenarios

### Property-Based Testing Approach
Property-based testing will be implemented using fast-check library with minimum 100 iterations per test:
- **Property 1**: Generate random valid credentials from database, verify successful authentication
- **Property 2**: Generate random invalid credentials, verify rejection and error display
- **Property 3**: Test password clearing behavior with any invalid input
- **Property 4**: Verify database comparison consistency across all inputs

Each property-based test will be tagged with: **Feature: simple-login-auth, Property {number}: {property_text}**

### Testing Requirements
- Unit tests verify specific examples and integration points
- Property tests verify universal behaviors across all inputs
- Both approaches provide comprehensive coverage
- Property tests run minimum 100 iterations for thorough validation
- Each test explicitly references its corresponding correctness property