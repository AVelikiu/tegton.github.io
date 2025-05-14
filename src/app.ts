import { getHttpEndpoint } from "@orbs-network/ton-access";
import { mnemonicToWalletKey } from "@ton/crypto";
import { WalletContractV4, TonClient, fromNano, internal } from "@ton/ton";

// UI элементы
const loginScreen = document.getElementById("login-screen") as HTMLDivElement;
const gameScreen = document.getElementById("game") as HTMLDivElement;
const seedInput = document.getElementById("seedInput") as HTMLInputElement;
const loginButton = document.getElementById("loginButton") as HTMLButtonElement;
const balanceDisplay = document.getElementById("balance") as HTMLDivElement;

const reelElements = [
  document.getElementById("reel1") as HTMLDivElement,
  document.getElementById("reel2") as HTMLDivElement,
  document.getElementById("reel3") as HTMLDivElement
];
const spinButton = document.getElementById("spinButton") as HTMLButtonElement;
const bankDisplay = document.getElementById("bank") as HTMLDivElement;

const symbols = ["🍒", "🍋", "🍊", "🍉", "🔔", "⭐", "7️⃣"];
let bank = 30;

// Переменные после логина
let globalKey: any = null;
let globalWallet: any = null;
let globalClient: any = null;

function updateBank() {
  bank += 1;
  bankDisplay.textContent = `Банк: ${bank} тонн криптовалюты`;
}

function getRandomSymbol(): string {
  const index = Math.floor(Math.random() * symbols.length);
  return symbols[index];
}

async function updateBalance() {
  try {
    const balance = await globalClient.getBalance(globalWallet.address);
    const ton = fromNano(balance);
    balanceDisplay.textContent = `Баланс: ${ton} TON`;
  } catch (err) {
    console.error("Не удалось обновить баланс:", err);
  }
}

async function sendTon() {
  try {
    const walletContract = globalClient.open(globalWallet);
    const seqno = await walletContract.getSeqno();

    await walletContract.sendTransfer({
      secretKey: globalKey.secretKey,
      seqno,
      messages: [
        internal({
          to: "UQCtlrebzt2jvsWVinZKAaXv4YNDk2s6Vsip3egTLb-HYebp",
          value: "0.01", // 0.01 TON
          body: "Spin payment",
          bounce: false,
        }),
      ],
    });

    let currentSeqno = seqno;
    while (currentSeqno === seqno) {
      console.log("Ожидание подтверждения транзакции...");
      await sleep(1500);
      currentSeqno = await walletContract.getSeqno();
    }

    console.log("Транзакция подтверждена!");
    await updateBalance(); // 🟢 Обновить баланс после транзакции
  } catch (err) {
    console.error("Ошибка при отправке TON:", err);
    alert("Не удалось отправить 0.01 TON. Проверьте баланс.");
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function spinReels() {
  const intervals: number[] = [];

  spinButton.disabled = true;
  updateBank();

  for (let i = 0; i < reelElements.length; i++) {
    intervals[i] = window.setInterval(() => {
      reelElements[i].textContent = getRandomSymbol();
    }, 100);
  }

  reelElements.forEach((_, i) => {
    setTimeout(() => {
      clearInterval(intervals[i]);
      reelElements[i].textContent = getRandomSymbol();

      if (i === reelElements.length - 1) {
        spinButton.disabled = false;
      }
    }, 1000 + i * 500);
  });

  // 🚀 Отправить 0.01 TON + обновить баланс
  sendTon();
}

// 🍀 Вход
loginButton.addEventListener("click", async () => {
  const seedPhrase = seedInput.value.trim();
  const words = seedPhrase.split(/\s+/);

  if (words.length !== 24) {
    alert("Сид-фраза должна состоять из 24 слов.");
    return;
  }

  try {
    const key = await mnemonicToWalletKey(words);
    const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });

    const endpoint = await getHttpEndpoint();
    const client = new TonClient({ endpoint });

    const balance = await client.getBalance(wallet.address);
    const ton = fromNano(balance);
    balanceDisplay.textContent = `Баланс: ${ton} TON`;

    // Сохраняем данные
    globalKey = key;
    globalWallet = wallet;
    globalClient = client;

    loginScreen.style.display = "none";
    gameScreen.style.display = "block";
  } catch (err) {
    console.error(err);
    alert("Ошибка при подключении кошелька. Проверьте сид-фразу.");
  }
});

spinButton.addEventListener("click", spinReels);
