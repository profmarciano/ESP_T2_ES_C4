# Dashboard de Monitoramento de Clima

Este projeto é um sistema de monitoramento de clima que consome dados de uma API de meteorologia e exibe em um dashboard intuitivo.

## Arquitetura do Sistema

Abaixo está o diagrama de componentes que ilustra a interação entre o Frontend (React), o Backend (API) e o Banco de Dados (PostgreSQL).

```mermaid
graph TD
    subgraph Client_Layer [Frontend - React]
        UI[User Interface / Components]
        State[State Management]
        Fetch[Fetch API / Axios]
    end

    subgraph API_Layer [Backend]
        Controller[Controller]
        Service[Service]
        Repository[Repository]
    end

    subgraph Data_Layer [Database]
        DB[(PostgreSQL)]
    end

    %% Interactions
    UI --> State
    State --> Fetch
    
    Fetch -- "HTTP Request (JSON)" --> Controller
    
    Controller --> Service
    Service --> Repository
    
    Repository -- "SQL Query" --> DB

    %% Styling
    style Client_Layer fill:#e1f5fe,stroke:#01579b
    style API_Layer fill:#fff3e0,stroke:#e65100
    style Data_Layer fill:#e8f5e9,stroke:#1b5e20
```

## Tecnologias Utilizadas
- **Frontend:** React, Tailwind CSS
- **Backend:** [Inserir Tecnologia, ex: Node.js/Express]
- **Banco de Dados:** PostgreSQL