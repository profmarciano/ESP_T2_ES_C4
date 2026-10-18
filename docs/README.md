# Dashboard de Monitoramento de Clima

MVP web responsivo para pesquisar cidades e acompanhar condições meteorológicas atuais e previsão para os próximos dias. A interface foi implementada em React e Tailwind CSS e consome os serviços públicos do Open-Meteo.

## Funcionalidades

- Consulta inicial de Curitiba e busca de outras cidades;
- Temperatura atual, sensação térmica, umidade, vento e chance de chuva;
- Previsão diária para cinco dias, com máximas e mínimas;
- Estados de carregamento, cidade não encontrada e falha de conexão;
- Layout responsivo para desktop e dispositivos móveis.

## Tecnologias e Ferramentas

- React 19.3.1 e React DOM 19.3.1;
- Tailwind CSS 4.3.3 e CSS para estilos específicos dos componentes;
- Vite 8.3.4 para desenvolvimento e build;
- Express 5.3.0 para o endpoint backend e Zod 4.6.7 para validar entrada e saída;
- Google GenAI SDK 2.30.0, com o modelo `gemini-3.8-flash` para recomendações em JSON estruturado;
- `express-rate-limit` para limitar consultas ao assistente;
- Axios 1.20.0 para requisições HTTP;
- Lucide React 1.59.0 para ícones;
- Vitest 5.0.5, Testing Library e jsdom para testes;
- Open-Meteo para geocodificação e previsão, sem chave de API;
- GitHub Copilot como assistente de código.

As versões exatas e dependências transitivas estão registradas em [`../package.json`](../package.json) e [`../package-lock.json`](../package-lock.json).

## Configuração e Execução Local

### Pré-requisitos

- Node.js 20.19+ ou 22.12+;
- npm;
- Acesso à internet para consultar Open-Meteo e Gemini;
- Uma chave da Gemini API criada no [Google AI Studio](https://aistudio.google.com/apikey). A disponibilidade da faixa gratuita, cotas e condições pode mudar.

### Instalar dependências

Na raiz do repositório:

```bash
npm ci
```

Crie o arquivo local de ambiente e preencha a chave:

```powershell
Copy-Item .env.example .env
```

No `.env`, substitua `cole_sua_chave_aqui` pela chave gerada no Google AI Studio. Esse arquivo é ignorado pelo Git; nunca coloque a chave em arquivos `VITE_*` ou no código React.

Se o servidor já estiver em execução, reinicie `npm run dev` para carregar ou atualizar a chave.

### Executar em desenvolvimento

```bash
npm run dev
```

Abra a URL mostrada pelo Vite, normalmente `http://localhost:5173`.

### Gerar build de produção

```bash
npm run build
npm run preview
```

## Uso e Integração

Digite uma cidade no campo de busca e pressione **Buscar** ou Enter. A tela apresenta os dados atuais e a previsão. A busca inicial é Curitiba; uma falha posterior mantém os dados anteriores e informa o erro.

O serviço em `src/services/weatherApi.js` consulta:

- `https://geocoding-api.open-meteo.com/v1/search` para obter nome, região e coordenadas da cidade;
- `https://api.open-meteo.com/v1/forecast` para temperatura, umidade, sensação térmica, vento, código meteorológico e previsão diária.

Os resultados são normalizados para os objetos `location`, `current` e `daily` antes de chegar aos componentes React.

### Assistente de planejamento do dia

Digite uma pergunta ou selecione uma sugestão, como “Preciso levar guarda-chuva?”. O React envia a pergunta e os dados meteorológicos atuais para `POST /api/weather/advice`. O Express valida o payload, limita a 12 chamadas por IP a cada 15 minutos e solicita ao Gemini uma resposta JSON com `title`, `recommendation`, `summary` e `reasons`. O modelo recebe instruções para usar somente a previsão fornecida e a chamada é feita com `store: false`.

O endpoint não requer outro segredo além de `GEMINI_API_KEY` no backend. Sem a chave, o dashboard e a previsão continuam funcionando, mas o assistente retorna uma mensagem de configuração. O proxy do Vite encaminha `/api` para o servidor Express durante o desenvolvimento.

O plano gratuito do Gemini está sujeito a limites e alterações. De acordo com as condições atuais do Google, dados enviados na faixa gratuita podem ser usados para melhorar os produtos; não envie informações pessoais ou sensíveis no campo de pergunta. Consulte os [termos e preços atuais da Gemini API](https://ai.google.dev/gemini-api/docs/pricing) antes de publicar ou ampliar o uso.

## Arquitetura

```mermaid
graph LR
    User[Usuário] --> UI[React UI]
    UI --> Search[Busca por cidade]
    Search --> Weather[Open-Meteo]
    Weather --> UI
    UI -->|Pergunta + previsão| API[Express API]
    API --> Validate[Validação Zod]
    Validate --> Gemini[Gemini 3.8 Flash]
    Gemini -->|JSON estruturado| API
    API --> UI
```

## Testes Automatizados

Execute os testes com:

```bash
npm test
```

Os testes cobrem a normalização da resposta meteorológica, cidade não encontrada, falha de rede, renderização inicial, busca por cidade, envio e apresentação de recomendações, validação do endpoint, configuração ausente, formato da resposta e limite de chamadas. As chamadas ao Gemini são simuladas; a suíte não consome cota da API. O script `npm run test:watch` inicia o Vitest em modo interativo.

Para gerar e servir a versão de produção, execute `npm run build` e depois `npm start`. O Express serve os arquivos compilados de `dist/` e mantém o endpoint `/api` no mesmo host.

## Limitações e Próximos Passos

- As recomendações dependem da disponibilidade, cotas e condições da Gemini API e do Open-Meteo;
- A busca usa o primeiro resultado de geocodificação; cidades homônimas ainda não oferecem seleção de região;
- Não há favoritos, histórico ou persistência própria;
- A suíte cobre serviço e componentes, mas ainda não possui testes E2E em navegador;
- Créditos de autoria e licença do projeto precisam ser definidos antes de uma distribuição formal.

## Créditos e Licença

Dados meteorológicos por [Open-Meteo](https://open-meteo.com/); geocodificação baseada em [OpenStreetMap](https://www.openstreetmap.org/copyright). A licença do código ainda não foi definida.

## Releases e Tags

Ainda não há release ou tag publicada. Recomenda-se criar uma tag versionada, como `v1.0.0`, após a revisão final do MVP e da licença.