# ContaCerta

Aplicação web mobile-first em português brasileiro para contas, recorrências e vencimentos. Projeto independente do Brotar, sem alterações no aplicativo existente e sem backend.

## Executar

Requer Node.js 22 ou superior.

```sh
cd /Users/apps/brotar-frontend/contacerta
npm ci
npm run dev
```

Abra o endereço exibido pelo Vite. `npm run build` verifica o TypeScript e gera `dist/`; `npm run preview` serve o build. `npm test` executa os testes de domínio e IndexedDB. `npm run format` formata as fontes.

## Arquitetura e fluxo

- `src/types`: conta, ocorrência, pagamento e preferências.
- `src/services/domain.ts`: recorrências, status, pagamentos e validação de backups.
- `src/services/storage.ts`: IndexedDB versão 1, snapshots em transações atômicas.
- `src/services/notifications.ts`: permissão explícita e notificações locais Capacitor.
- `src/services/backup.ts`: download web e compartilhamento nativo de JSON.
- `src/stores`: Zustand, gravação antes da atualização visual, erros e toasts. Transações serializam gravações entre janelas; BroadcastChannel atualiza as outras janelas.
- `src/hooks`: preferência de tema, mudança de dia e retomada do app.
- `src/components`: itens de conta, identidade, estados vazios e diálogos acessíveis.
- `src/pages`: Início → Contas/Calendário → Detalhes → Editar ou registrar pagamento. Nova conta fica acessível pelo painel e pela lista. Ajustes reúne tema, lembretes, backup e privacidade.

React Router usa hash para navegação interna compatível com arquivos empacotados em WebView. Tailwind fornece a base e utilitários; estilos próprios implementam os componentes, temas e safe areas. Não há fontes, gráficos ou dados financeiros carregados de serviços externos.

## Consistência dos dados

Valores são inteiros em centavos. Datas de vencimento e pagamento são strings locais `AAAA-MM-DD`, sem conversão para UTC. Uma conta não paga é vencida apenas quando sua data é anterior ao dia local.

Cada ocorrência possui ID determinístico `conta:data`. Gerações repetidas são idempotentes. Há no máximo uma ocorrência por ciclo semanal (segunda a domingo), mensal ou anual. Ao mudar o vencimento, um ciclo com histórico preservado não é criado novamente. Dia 31 é limitado ao último dia de meses curtos, retomando o dia original no mês seguinte; 29/02 anual é tratado da mesma forma.

Ocorrências são geradas até 12 meses à frente do dia atual e ampliadas ao abrir/retomar o app. Contas únicas distantes são incluídas. Meses fora desse horizonte podem aparecer vazios para recorrências. O app não precisa ficar aberto para preservar os dados.

Editar a conta altera as próximas ocorrências não pagas e a ocorrência inicial quando ela ainda não tem histórico. Ocorrências com pagamentos ou estornos mantêm valor e vencimento originais; outras ocorrências vencidas já geradas são preservadas. Alterar uma ocorrência isoladamente não faz parte desta versão. A exclusão de uma conta remove toda a série e seu histórico, mediante confirmação.

Pagamentos guardam a data efetiva e o valor da ocorrência. Cliques repetidos não registram dois pagamentos ativos. Desfazer pagamento registra a data do estorno, preservando a auditoria. O resumo mensal considera o mês de vencimento, inclusive quando o pagamento ocorre em outro mês.

Backups são validados por versão, referências, datas, valores e unicidade. Importar substitui os dados com confirmação; os lembretes precisam ser reativados no aparelho. A demonstração só é criada na primeira abertura e pode ser removida em Ajustes sem apagar contas próprias.

## Android e iOS com Capacitor

Os módulos e a configuração Capacitor estão incluídos. Os projetos nativos devem ser gerados no ambiente de desenvolvimento com Android Studio e/ou Xcode:

```sh
npm run build
npx cap add android
npx cap add ios
npm run cap:sync
npx cap open android
npx cap open ios
```

Execute `cap add` apenas uma vez por plataforma. Depois de alterações web, use `npm run cap:sync`. Não há servidor remoto na configuração nativa: os arquivos de `dist/` são empacotados no app.

Para iOS, inclua `native/PrivacyInfo.xcprivacy` nos recursos do target App no Xcode. O arquivo declara o motivo de acesso a timestamps exigido pelo plugin Filesystem. Verifique também os manifests de privacidade fornecidos pelos plugins ao preparar a distribuição.

Notificações são solicitadas apenas ao ativar Lembretes em Ajustes. O plugin agenda às 9h locais os próximos 60 lembretes elegíveis, respeitando o limite de notificações do iOS. Ao abrir o app, pagar, editar ou excluir contas, o agendamento é atualizado. A entrega depende das permissões e políticas do sistema. A WebView isolada não oferece notificações com o app fechado. Esta versão não solicita alarmes exatos no Android.

O backup nativo usa o diretório de cache privado e a folha de compartilhamento do aparelho; não requer acesso amplo aos arquivos. O seletor de importação usa o input de arquivo nativo da WebView.

O build web e os fluxos no navegador foram verificados. APK/IPA, assinatura, envio às lojas e comportamento real dos plugins em aparelhos não foram executados nesta entrega.

## Verificação

Os testes cobrem centavos, datas locais, recorrências semanais/mensais/anuais, fim de mês e ano bissexto, geração idempotente, edição de ciclos pagos, pagamento repetido, estorno, validação de backup, persistência e gravações concorrentes. Foram inspecionados layouts de celular e desktop, temas claro/escuro, formulário de edição, registro/estorno e seleção no calendário.

Dados ficam no armazenamento do navegador/aplicativo. Limpar esse armazenamento ou desinstalar pode removê-los: o backup JSON é o mecanismo de portabilidade desta versão.
