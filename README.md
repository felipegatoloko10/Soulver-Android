# 🧮 Soulver para Android & PWA (Engenharia Reversa REA)

Uma réplica fiel do **Soulver 3** (iOS / macOS) projetada para **Android nativo (.APK)** e **Web/PWA**, equipada com um motor de avaliação matemática em linguagem natural (`SoulverEngine.js`), interface dual idêntica (Editor + Gutter de resultados em tempo real) e suporte completo a múltiplos idiomas (com **Português pt-BR** nativo de primeira classe).

---

## ✨ Recursos

- **Avaliador Matemático em Linguagem Natural:** Misture anotações de texto e números livremente.
- **Referenciamento de Linhas:** Use termos como `linha 1`, `linha 2`, `anterior`, `last`, `total` ou `soma`.
- **Declaração de Variáveis:** Crie variáveis intuitivas como `Salário = 5000`, `Despesas = 1500`, `Sobra = Salário - Despesas`.
- **Porcentagens Inteligentes:**
  - `20% de 500`
  - `500 + 10%`
  - `500 - 15% de desconto`
  - `50 como % de 200`
- **Conversões de Moedas & Unidades:**
  - Moedas: `100 USD em BRL`, `50 EUR para USD`, `0.05 BTC em USD`
  - Unidades: `15 km em metros`, `10 kg em lbs`, `5 horas em minutos`, `2 GB em MB`
- **Interface Idêntica ao iOS Soulver:**
  - Coluna de anotações à esquerda e coluna de resultados sincronizada à direita.
  - Teclado com barra de atalhos rápidos (`linha`, `anterior`, `total`, `+`, `-`, `×`, `÷`, `%`, conversões).
  - Suporte a Modo Escuro (Dark Mode) e Modo Claro (Light Mode).
- **Internacionalização (i18n):**
  - Alternância instantânea de idioma (Português / Inglês).

---

## 📂 Estrutura do Repositório

```
Soulver-Android/
├── engine/              # Motor de avaliação em Linguagem Natural (SoulverCore)
│   └── SoulverEngine.js
├── pwa/                 # PWA Web / Mobile offline idêntico
│   ├── index.html
│   ├── manifest.json
│   └── sw.js
├── android/             # Projeto Nativo Android (Kotlin + WebView + Assets)
│   ├── app/
│   │   ├── src/main/java/app/soulver/android/MainActivity.kt
│   │   ├── src/main/res/values-pt/strings.xml
│   │   ├── src/main/res/values-en/strings.xml
│   │   └── build.gradle
│   └── build.gradle
├── docs/                # Relatório técnico da Engenharia Reversa (REA)
└── .github/workflows/   # CI/CD automatizado para compilar o APK via GitHub Actions
```

---

## 🚀 Como Executar

### 1. Web / PWA (Instantâneo no PC ou Celular)
Abra o arquivo `pwa/index.html` diretamente em qualquer navegador moderno ou rode um servidor local:
```bash
npx serve pwa
```

### 2. Android (.APK)
- O repositório conta com **GitHub Actions** configurado para compilar o `.apk` automaticamente a cada commit ou disparo manual na aba *Actions*.
- Para compilar localmente com o Android Studio / Gradle:
  ```bash
  cd android
  ./gradlew assembleDebug
  ```
  O APK gerado ficará em `android/app/build/outputs/apk/debug/app-debug.apk`.
