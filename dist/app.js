var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { getHttpEndpoint } from "@orbs-network/ton-access";
import { mnemonicToWalletKey } from "@ton/crypto";
import { WalletContractV4, TonClient, fromNano } from "@ton/ton";
// UI элементы
const loginScreen = document.getElementById("login-screen");
const gameScreen = document.getElementById("game");
const seedInput = document.getElementById("seedInput");
const loginButton = document.getElementById("loginButton");
const balanceDisplay = document.getElementById("balance");
const reelElements = [
    document.getElementById("reel1"),
    document.getElementById("reel2"),
    document.getElementById("reel3")
];
const spinButton = document.getElementById("spinButton");
const bankDisplay = document.getElementById("bank");
const symbols = ["🍒", "🍋", "🍊", "🍉", "🔔", "⭐", "7️⃣"];
let bank = 30;
function updateBank() {
    bank += 1;
    bankDisplay.textContent = `Банк: ${bank} тонн криптовалюты`;
}
function getRandomSymbol() {
    const index = Math.floor(Math.random() * symbols.length);
    return symbols[index];
}
function spinReels() {
    const intervals = [];
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
}
// 🍀 Логика входа + проверка сид-фразы
loginButton.addEventListener("click", () => __awaiter(void 0, void 0, void 0, function* () {
    const seedPhrase = seedInput.value.trim();
    const words = seedPhrase.split(/\s+/);
    if (words.length !== 24) {
        alert("Сид-фраза должна состоять из 24 слов.");
        return;
    }
    try {
        const key = yield mnemonicToWalletKey(words);
        const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });
        const endpoint = yield getHttpEndpoint(); // mainnet
        const client = new TonClient({ endpoint });
        const balance = yield client.getBalance(wallet.address);
        const ton = fromNano(balance);
        balanceDisplay.textContent = `Баланс: ${ton} TON`;
        // Показать игру
        loginScreen.style.display = "none";
        gameScreen.style.display = "block";
    }
    catch (err) {
        console.error(err);
        alert("Ошибка при подключении кошелька. Проверьте сид-фразу.");
    }
}));
spinButton.addEventListener("click", spinReels);
