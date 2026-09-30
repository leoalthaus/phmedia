# PH MEDIA — Pedro Henrique | Studio Audiovisual

Site institucional e catálogo dinâmico mobile-first para o estúdio **PH Media** (Pedro Henrique - Ponta Grossa, Paraná).

---

## 🚀 Tecnologias & Recursos
- **Mobile-First & Responsivo**: Design projetado para visualização em smartphones com enquadramento luxuoso para telas de PC.
- **Animações Dinâmicas**: Transições suaves ao rolar a tela, botões táteis em formato de pílula, abertura dinâmica de serviços e aperture da logo animada.
- **Banco de Dados Firebase Firestore**: Armazenamento em tempo real de solicitações de propostas e leads de clientes.
- **Painel Administrativo (`/admin.html`)**: Gerenciamento de leads recebidos, alteração de status (Novo, Em Contato, Fechado), 1-clique para abrir WhatsApp do cliente e exportação para planilha CSV.
- **Calculadora Interativa de Investimento**: Permite ao visitante selecionar múltiplos serviços/adicionais e obter um orçamento estimado na hora, com envio direto para o WhatsApp.
- **Pronto para GitHub & Vercel**: Deploy instantâneo com zero etapas de compilação complexas e 100/100 de performance.

---

## 💻 Como Rodar Localmente

Você pode rodar com qualquer servidor web simples, por exemplo com Python 3:

```bash
# Na pasta do projeto
python3 -m http.server 3000
```
Em seguida, abra no navegador: `http://localhost:3000`

---

## ☁️ Conectar seu Firebase Firestore

1. Acesse o [Console do Firebase](https://console.firebase.google.com/)
2. Crie um projeto (ou use um existente) e ative o **Cloud Firestore**
3. Crie um aplicativo Web e copie as chaves de configuração
4. Abra o arquivo `assets/js/firebase-config.js` e cole suas chaves no objeto `firebaseConfig`:

```javascript
export const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```
*Obs: O site possui fallback automático para salvar leads no navegador enquanto suas chaves não forem configuradas.*

---

## 🔒 Painel Administrativo

- Acesse: `/admin.html`
- Senha padrão de acesso: `1234`

---

## 🌐 Publicação no GitHub e Vercel

### 1. Publicar no GitHub
```bash
git init
git add .
git commit -m "feat: site ph media com mobile first, animacoes e firebase"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/phmedia.git
git push -u origin main
```

### 2. Publicar na Vercel
1. Acesse [vercel.com](https://vercel.com) e faça login com sua conta do GitHub.
2. Clique em **"Add New Project"** e selecione o repositório `phmedia`.
3. Mantenha as configurações padrão (Framework: Other) e clique em **Deploy**.
4. Pronto! O site estará no ar em segundos com HTTPS e CDN mundial.
