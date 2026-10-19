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

- **Acompanhamento de solicitações:** visualizar suas solicitações de consultas médicas especializadas e exames, incluindo a situação atual de cada pedido.

- **Acompanhamento de agendamentos:** consultar informações sobre consultas e exames agendados, incluindo datas, horários, unidades de saúde e situações dos agendamentos, quando disponíveis.

- **Histórico de alterações:** consultar o registro das mudanças de situação de suas solicitações, permitindo acompanhar a evolução de cada pedido ao longo do tempo.

- **Notificações:** visualizar avisos sobre alterações de situação das solicitações e dos agendamentos, com possibilidade de marcar notificações como lidas.

- **Perfil do Paciente:** consultar suas informações cadastrais no ambiente demonstrativo, respeitando as permissões de acesso definidas para o usuário.

### Funcionalidades do Administrador

- **Painel Administrativo (Dashboard):** visualizar um resumo das solicitações, agendamentos e informações operacionais do sistema, utilizando dados demonstrativos.

- **Gerenciamento de solicitações:** cadastrar, consultar e atualizar solicitações demonstrativas de consultas médicas especializadas e exames, respeitando as regras de situação e o registro do histórico de alterações.

- **Gerenciamento de agendamentos:** cadastrar, consultar e atualizar agendamentos demonstrativos de consultas e exames, incluindo datas, horários, unidades de saúde e situações dos agendamentos.

- **Indicadores regionais de saúde:** consultar indicadores organizados por localidade, com identificação das fontes e distinção entre dados oficiais verificados e informações simuladas.

- **Gerenciamento de pacientes:** consultar informações cadastrais dos pacientes fictícios utilizados na demonstração, respeitando as permissões de acesso do Administrador.

- **Gerenciamento de procedimentos:** consultar e administrar o catálogo demonstrativo de procedimentos e exames utilizados nas solicitações do sistema.

- **Gerenciamento de unidades de saúde:** consultar e administrar o cadastro de unidades de saúde fictícias utilizadas nos agendamentos demonstrativos, incluindo suas informações de identificação e localização.

- **Gerenciamento das fontes de dados:** consultar e administrar o registro das fontes utilizadas nos indicadores regionais, incluindo identificação, origem e referência, diferenciando informações oficiais verificadas de dados demonstrativos.

## 4. Tecnologias e Arquitetura

O Saúde em Dia foi planejado como uma aplicação web com arquitetura cliente-servidor, organizada em camadas de apresentação, serviços e persistência de dados. Essa estrutura busca separar as responsabilidades da interface, das regras de negócio e do armazenamento das informações, facilitando a organização, a manutenção e a evolução do projeto.

### Frontend

- **Vue 3:** framework JavaScript utilizado para construir a interface web por meio de componentes reutilizáveis e reativos.
- **Vite:** ferramenta utilizada para organizar o ambiente de desenvolvimento e gerar a versão de distribuição do Frontend.
- **PrimeVue:** biblioteca de componentes visuais para Vue 3, utilizada na construção de elementos de interface padronizados e reutilizáveis.
- **Tailwind CSS:** framework CSS utilitário utilizado para estilização responsiva e manutenção da identidade visual da aplicação.
- **Lucide:** biblioteca de ícones utilizada para facilitar a identificação visual de funcionalidades e ações na interface.
- **Chart.js:** biblioteca JavaScript utilizada para apresentar gráficos e visualizações dos indicadores regionais e das informações administrativas.
- **SVG e mapas regionais:** utilização de gráficos vetoriais e referências geográficas do IBGE para representar localidades e apoiar a visualização interativa dos indicadores regionais, respeitando a identificação das fontes de dados.

### Backend

- **Node.js:** ambiente de execução JavaScript utilizado para desenvolver a camada de serviços e as regras de negócio da aplicação.
- **Express:** framework para Node.js utilizado na construção da API REST, responsável por receber requisições, processar operações e fornecer respostas ao Frontend.
- **API REST:** interface de comunicação entre Frontend e Backend, utilizando requisições HTTP e respostas em formato JSON para consultar e gerenciar informações demonstrativas, conforme as permissões de cada perfil de usuário.
- **Autenticação e controle de acesso:** utilização de sessões autenticadas com cookies HttpOnly e controle de permissões baseado em perfis (RBAC), diferenciando os acessos de Pacientes e Administradores e restringindo as operações conforme as responsabilidades de cada usuário.

### Banco de Dados

- **SQLite:** sistema de gerenciamento de banco de dados relacional utilizado para armazenar as informações demonstrativas da aplicação, incluindo usuários, localidades, unidades de saúde, procedimentos, solicitações, agendamentos, históricos de situação, notificações e indicadores regionais.
- **Modelagem relacional e integridade dos dados:** organização do banco em 11 entidades relacionadas, utilizando chaves primárias, chaves estrangeiras, normalização e regras de integridade para manter a consistência dos registros demonstrativos e dos relacionamentos entre usuários, solicitações, agendamentos e demais informações do sistema.

## 5. Como Executar

O Saúde em Dia encontra-se em fase de desenvolvimento. As instruções para instalação das dependências, configuração do ambiente e execução do Frontend e do Backend serão documentadas nesta seção após a implementação e a validação dos respectivos procedimentos.

## 6. Aviso Demonstrativo e Limitações

O Saúde em Dia é um projeto acadêmico de caráter exclusivamente demonstrativo, desenvolvido para apresentar uma proposta tecnológica de acompanhamento de solicitações de consultas médicas especializadas e exames. A aplicação não realiza agendamentos reais, não substitui os canais oficiais de atendimento à saúde e não possui integração com os sistemas do Sistema Único de Saúde (SUS).

Todos os dados de pacientes, solicitações, agendamentos, históricos e unidades de saúde utilizados na demonstração serão fictícios. O projeto não utilizará prontuários médicos reais nem informações pessoais sensíveis de pacientes. O controle de acesso por perfis e as medidas de proteção previstas na arquitetura têm finalidade demonstrativa e educacional.

Os indicadores regionais apresentados no Saúde em Dia deverão possuir identificação clara de sua origem. Informações provenientes de fontes oficiais somente serão utilizadas após a verificação de sua procedência e referência. Quando forem empregados dados simulados, essa condição será explicitamente informada. A ausência de informações disponíveis não será interpretada como valor zero, e os indicadores não deverão ser apresentados como dados oficiais sem a devida comprovação.

## 7. Contexto Acadêmico

O Saúde em Dia é uma proposta desenvolvida no contexto da Semana Ubíqua UNAMA 2026.2 — Soluções em Sistemas Digitais. O projeto busca aplicar conhecimentos de desenvolvimento web, engenharia de software, banco de dados e experiência do usuário na construção de uma solução demonstrativa voltada à transparência e ao acompanhamento de solicitações de consultas médicas especializadas e exames.
