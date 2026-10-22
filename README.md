# Saúde em Dia

**Tecnologia para acompanhar cada etapa do cuidado.**

O **Saúde em Dia** é um projeto acadêmico de aplicação web demonstrativa, em desenvolvimento para a **Semana Ubíqua UNAMA 2026.2 — Soluções em Sistemas Digitais**.

A proposta é facilitar a visualização e o acompanhamento de solicitações de consultas médicas especializadas e exames, reunindo informações sobre situações, agendamentos, histórico de alterações e notificações em uma interface organizada e acessível.

A solução contempla dois perfis de utilização: **Paciente** e **Administrador**, com funcionalidades e permissões específicas.

O projeto também prevê um módulo administrativo de indicadores regionais de saúde, com identificação das fontes utilizadas e distinção entre informações oficiais verificadas e dados simulados.

> **Aviso:** o Saúde em Dia é um protótipo acadêmico. Os dados operacionais são fictícios e a aplicação não possui integração com sistemas reais do Sistema Único de Saúde (SUS).

## 1. O Problema

O acompanhamento de solicitações de consultas médicas especializadas e exames pode representar um desafio para pacientes que precisam obter informações claras sobre a situação de seus pedidos e os próximos passos do atendimento.

A ausência de uma visualização centralizada dessas informações pode dificultar a compreensão do andamento das solicitações, das datas de agendamento e das alterações ocorridas ao longo do processo.

Entre os principais desafios que motivam a proposta, destacam-se:

- Dificuldade para acompanhar a situação atual de solicitações de consultas e exames.

- **Informações descentralizadas:** ausência de uma visão unificada do histórico de solicitações e atendimentos.

- **Comunicação de alterações:** necessidade de apresentar ao paciente mudanças de agendamento e atualizações de situação de maneira clara.

- **Transparência das informações:** importância de distinguir dados demonstrativos de indicadores regionais provenientes de fontes oficiais.

Diante desse cenário, o projeto propõe explorar como uma aplicação web pode contribuir para uma experiência de acompanhamento mais organizada, acessível e transparente.

Esses desafios representam a motivação da proposta acadêmica, não resultados de uma pesquisa de campo realizada pelo projeto.

## 2. A Solução

O **Saúde em Dia** propõe uma aplicação web demonstrativa que centraliza o acompanhamento de solicitações de consultas médicas especializadas e exames, permitindo que pacientes visualizem a situação de seus pedidos, informações de agendamento, histórico de alterações e notificações em um único ambiente.

A aplicação contempla dois perfis de acesso: **Paciente**, que poderá consultar suas próprias solicitações, agendamentos, histórico de situações e notificações; e **Administrador**, responsável pelo gerenciamento demonstrativo das solicitações, agendamentos e informações administrativas do sistema.

A solução também prevê um módulo administrativo de **indicadores regionais de saúde**, destinado à apresentação de informações organizadas por localidade, com identificação das fontes consultadas. Os dados oficiais somente serão apresentados quando verificados e devidamente referenciados, mantendo-se claramente separados dos dados fictícios utilizados na demonstração.

O **Saúde em Dia** possui finalidade exclusivamente acadêmica e demonstrativa. A aplicação utiliza dados operacionais fictícios, não realiza solicitações ou agendamentos reais e não possui integração com sistemas oficiais do Sistema Único de Saúde (SUS).

## 3. Funcionalidades

### Funcionalidades do Paciente

- **Cadastro de solicitações de atendimento (implementado):** permite ao paciente autenticado registrar novas solicitações de atendimento, informando a especialidade desejada. Após o cadastro, a solicitação passa a integrar sua lista de acompanhamento.

- **Acompanhamento de agendamentos (parcialmente implementado):** acompanhar a situação das solicitações de atendimento, incluindo o status de agendamento. A exibição de datas, horários e unidades de saúde permanece prevista para etapas futuras.

- **Histórico de alterações (implementado):** o sistema registra as mudanças de status das solicitações, incluindo situação anterior, nova situação e data da alteração. O histórico pode ser consultado tanto no painel administrativo quanto no painel do paciente, respeitando as permissões de acesso.

- **Notificações (parcialmente implementadas):** o sistema apresenta mensagens de confirmação e erro durante determinadas operações. A implementação de uma central de notificações para o paciente, com avisos sobre alterações de status e possibilidade de marcar notificações como lidas, está prevista para etapas futuras.

- **Perfil do Paciente (parcialmente implementado):** o sistema identifica o paciente autenticado e permite o acesso às suas próprias solicitações, respeitando as permissões de usuário. A criação de uma área específica para consulta e gerenciamento de informações cadastrais está prevista para etapas futuras.

### Funcionalidades do Administrador

- **Painel Administrativo (Dashboard) (implementado):** permite ao administrador visualizar as solicitações de atendimento, acompanhar suas situações e acessar as funcionalidades de gerenciamento disponíveis no ambiente demonstrativo.

- **Gerenciamento de solicitações (parcialmente implementado):** o administrador pode consultar as solicitações de atendimento, atualizar suas situações e visualizar o histórico das alterações realizadas. O cadastro de novas solicitações pela interface administrativa permanece previsto para etapas futuras.

- **Gerenciamento de agendamentos (parcialmente implementado):** o administrador pode alterar a situação das solicitações para AGENDADA e acompanhar o histórico dessas alterações. O cadastro e gerenciamento de datas, horários e unidades de saúde dos agendamentos estão previstos para etapas futuras.

- **Indicadores regionais de saúde (planejado):** disponibilizar indicadores de saúde organizados por localidade, identificando as fontes dos dados e diferenciando informações oficiais verificadas de dados simulados. Essa funcionalidade está prevista para etapas futuras do desenvolvimento.

- **Gerenciamento de pacientes (planejado):** permitir ao Administrador consultar informações cadastrais dos pacientes fictícios utilizados na demonstração, respeitando as permissões de acesso. A implementação de uma área específica para gerenciamento de pacientes está prevista para etapas futuras.

- **Gerenciamento de procedimentos (planejado):** permitir ao Administrador consultar e administrar um catálogo demonstrativo de procedimentos médicos e exames utilizados nas solicitações do sistema. A implementação de uma área específica para esse gerenciamento está prevista para etapas futuras.

- **Gerenciamento de unidades de saúde (planejado):** permitir ao Administrador cadastrar, consultar e atualizar informações demonstrativas sobre unidades de saúde, incluindo identificação e localização. A implementação desse módulo está prevista para etapas futuras do desenvolvimento.

- **Gerenciamento das fontes de dados (planejado):** permitir ao Administrador consultar e administrar as fontes utilizadas nos indicadores regionais de saúde, incluindo identificação, origem e referência, diferenciando informações oficiais verificadas de dados demonstrativos. Essa funcionalidade está prevista para etapas futuras.

## 4. Tecnologias e Arquitetura

O Saúde em Dia foi planejado como uma aplicação web com arquitetura cliente-servidor, organizada em camadas de apresentação, serviços e persistência de dados. Essa estrutura busca separar as responsabilidades da interface, das regras de negócio e do armazenamento das informações, facilitando a organização, a manutenção e a evolução do projeto.

### Frontend

- **Vue 3:** framework JavaScript utilizado para construir a interface web por meio de componentes reutilizáveis e reativos.
- **Vite:** ferramenta utilizada para organizar o ambiente de desenvolvimento e gerar a versão de distribuição do Frontend.
- **PrimeVue (planejado):** biblioteca de componentes visuais para Vue 3, considerada para futuras melhorias da interface. Atualmente, os componentes da aplicação são desenvolvidos com Vue 3 e estilização CSS própria.
- **Tailwind CSS (planejado):** framework CSS utilitário considerado para futuras melhorias de estilização e responsividade. Atualmente, a aplicação utiliza CSS próprio para definir a aparência e a organização das interfaces.
- **Lucide (planejado):** biblioteca de ícones considerada para futuras melhorias na identificação visual das funcionalidades e ações da interface. Atualmente, essa biblioteca não consta nas dependências do Frontend.
- **Chart.js (planejado):** biblioteca JavaScript considerada para a criação de gráficos e visualizações de indicadores regionais de saúde e informações administrativas. Sua integração está prevista para etapas futuras do desenvolvimento.
- **SVG e mapas regionais (planejado):** utilização futura de gráficos vetoriais e referências geográficas do IBGE para representar localidades e apoiar a visualização de indicadores regionais de saúde. A implementação dos mapas interativos está prevista para etapas posteriores do projeto, com identificação das fontes de dados utilizadas.

### Backend

- **Node.js:** ambiente de execução JavaScript utilizado para desenvolver a camada de serviços e as regras de negócio da aplicação.
- **Express:** framework para Node.js utilizado na construção da API REST, responsável por receber requisições, processar operações e fornecer respostas ao Frontend.
- **API REST:** interface de comunicação entre Frontend e Backend, utilizando requisições HTTP e respostas em formato JSON para consultar e gerenciar informações demonstrativas, conforme as permissões de cada perfil de usuário.
- **Autenticação e controle de acesso:** utilização de sessões autenticadas com cookies HttpOnly e controle de permissões baseado em perfis (RBAC), diferenciando os acessos de Pacientes e Administradores e restringindo as operações conforme as responsabilidades de cada usuário.

### Banco de Dados

- **SQLite:** banco de dados relacional utilizado para armazenar os dados demonstrativos da aplicação, incluindo usuários, solicitações de atendimento e histórico de alterações de situação. O acesso ao banco é realizado por meio da biblioteca better-sqlite3. Outras estruturas, como agendamentos completos, notificações e indicadores regionais, estão previstas para a evolução do projeto.
- **Modelagem relacional e integridade dos dados:** o banco de dados implementado possui três tabelas principais: `usuarios`, `solicitacoes` e `historico_solicitacoes`. A estrutura utiliza chaves primárias, chaves estrangeiras e restrições de integridade para organizar os dados e preservar os relacionamentos entre usuários, solicitações e seus históricos. A verificação das chaves estrangeiras está explicitamente habilitada na conexão SQLite por meio da configuração `PRAGMA foreign_keys = ON`, aplicada pela biblioteca `better-sqlite3`. A ampliação da modelagem para outras entidades está prevista para etapas futuras.

## 5. Como Executar

O Saúde em Dia é uma aplicação web demonstrativa desenvolvida com Vue 3, Vite, Node.js, Express e SQLite. Para executar o sistema localmente, é necessário ter o Node.js e o npm instalados. O Frontend e o Backend possuem dependências próprias e devem ser iniciados separadamente. As instruções de instalação e execução estão apresentadas a seguir.

### 5.1. Instalação e execução do Backend

Abra um terminal na pasta principal do projeto e acesse o diretório do Backend:

```powershell
cd backend
```
Instale as dependências do Backend executando:

```powershell
npm install
```
Configure o arquivo `.env` na pasta `backend`, definindo uma chave secreta para as sessões de autenticação:

```text
SESSION_SECRET=substitua_por_uma_chave_secreta_longa_e_aleatoria
```
O arquivo `.env` contém configurações locais e informações sensíveis. Por segurança, ele não deve ser enviado ao GitHub e deve permanecer protegido pelo arquivo `.gitignore`.

Na primeira configuração do ambiente, inicialize as tabelas do banco de dados SQLite executando o comando abaixo. Essa etapa não precisa ser repetida a cada inicialização do servidor:

```powershell
node initDatabase.js
```
Na preparação inicial do ambiente, execute o comando abaixo para cadastrar os usuários demonstrativos utilizados nos testes de autenticação. Não é necessário repetir essa etapa a cada inicialização do servidor:

```powershell
node seedUsuarios.js
```
Inicie o servidor Backend:

```powershell
npm start
```
### 5.2. Instalação e execução do Frontend
Abra um novo terminal na pasta principal do projeto, mantendo o Backend em execução, e acesse o diretório do Frontend:

```powershell
cd frontend
```
Instale as dependências do Frontend:

```powershell
npm install
```
Inicie o servidor de desenvolvimento do Frontend:

```powershell
npm run dev
```
Com o Backend e o Frontend em execução, abra o navegador e acesse o endereço local padrão do Vite:

```text
http://localhost:5173
```

Caso o Vite informe outra porta no terminal, utilize o endereço exibido por ele.

## 6. Aviso Demonstrativo e Limitações

O Saúde em Dia é um projeto acadêmico de caráter exclusivamente demonstrativo, desenvolvido para apresentar uma proposta tecnológica de acompanhamento de solicitações de consultas médicas especializadas e exames. A aplicação não realiza agendamentos reais, não substitui os canais oficiais de atendimento à saúde e não possui integração com os sistemas do Sistema Único de Saúde (SUS).

Todos os dados de pacientes, solicitações e históricos utilizados na demonstração são fictícios. Os dados de agendamentos e unidades de saúde, quando incorporados à aplicação, também serão fictícios. O projeto não utilizará prontuários médicos reais nem informações pessoais sensíveis de pacientes. O controle de acesso por perfis e as medidas de proteção previstas na arquitetura têm finalidade demonstrativa e educacional.

Os indicadores regionais estão previstos para etapas futuras do desenvolvimento do Saúde em Dia. Quando implementados, deverão apresentar identificação clara da origem dos dados. Informações provenientes de fontes oficiais somente serão utilizadas após a verificação de sua procedência e referência. Quando forem empregados dados simulados, essa condição será explicitamente informada. A ausência de informações disponíveis não será interpretada como valor zero, e os indicadores não deverão ser apresentados como dados oficiais sem a devida comprovação.

## 7. Contexto Acadêmico

O Saúde em Dia é uma proposta desenvolvida no contexto da Semana Ubíqua UNAMA 2026.2 — Soluções em Sistemas Digitais. O projeto busca aplicar conhecimentos de desenvolvimento web, engenharia de software, banco de dados e experiência do usuário na construção de uma solução demonstrativa voltada à transparência e ao acompanhamento de solicitações de consultas médicas especializadas e exames.
