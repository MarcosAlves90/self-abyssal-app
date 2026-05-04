# Mobile

App mobile do Abyssal feito com React Native, Expo e React Navigation.

## Estado atual

O app hoje entrega estes fluxos principais:

- autenticação com login e cadastro;
- home com filial em destaque e próximos passos da experiência;
- menu com busca, categorias e itens em destaque;
- detalhes do prato;
- carrinho com ajustes de quantidade e remoção de itens;
- checkout de delivery com endereço e finalização do pedido;
- reservas com criação, lista e detalhes;
- acompanhamento de pedidos;
- perfil com endereço principal e sincronização de conta.

A navegação autenticada usa tabs para `Inicio`, `Menu`, `Reserva` e `Perfil`. Quando autenticado, o usuário também acessa `DishDetails`, `Cart`, `DeliveryCheckout`, `ReservationDetails` e `OrderTracking`.

## Stack

- Expo SDK 54
- React Native 0.81
- React 19
- React Navigation 7
- Axios
- react-native-qrcode-svg
- expo-font e fontes Cormorant Garamond e Space Grotesk

## Execução local

Os scripts do pacote são:

- `npm run start` para abrir o Expo;
- `npm run web` para rodar no navegador;
- `npm run android` para abrir no Android;
- `npm run ios` para abrir no iOS;
- `npm run build:android:debug` e `npm run build:android:release`;
- `npm run build:ios:debug` e `npm run build:ios:release`;
- `npm run build:android:store` e `npm run build:ios:store`;
- `npm run test` para a suíte de Jest.

## Configuração

A URL da API é lida de `EXPO_PUBLIC_API_BASE_URL`.

- Em desenvolvimento, o app usa fallback local quando a variável não está definida.
- Em produção, `EXPO_PUBLIC_API_BASE_URL` é obrigatória, precisa ser `https://` e não pode apontar para `localhost`.

Exemplo de configuração local:

```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:3334/api
```

Quando o app roda no web em desenvolvimento, URLs locais são ajustadas automaticamente para alcançar a API do backend. Em Android emulador, o fallback usa `10.0.2.2`.

## Estrutura

- `src/screens`: telas da aplicação.
- `src/navigation`: navegação principal.
- `src/services`: cliente HTTP e integrações com a API.
- `src/contracts`: normalização e contratos dos dados do backend.
- `src/context`: estado global de autenticação e carrinho.
- `src/components`: componentes de interface reutilizáveis.
- `src/theme`: tokens visuais e layout.

## Observações

A interface usa tema escuro, cards contrastados e tipografia editorial para manter a identidade visual do Abyssal consistente com o restante do produto.