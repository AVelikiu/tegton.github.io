import { getHttpEndpoint } from "@orbs-network/ton-access";
import { mnemonicToWalletKey } from "@ton/crypto";
import { WalletContractV4, TonClient, fromNano, WalletContractV5R1, internal, toNano, Address, TupleBuilder } from "@ton/ton";
import { Chart, LineController, LineElement, PointElement, LinearScale, Title, CategoryScale, TimeScale } from 'chart.js';
import { BlumJetton } from '@fiscaldev/blum-sdk';
import { DEX, pTON } from "@ston-fi/sdk";
import * as QRCode from 'qrcode';




//import { TonConnect } from '@tonconnect/sdk';

// const connector = new TonConnect();

// await connector.restoreConnection(); // если пользователь уже подключался ранее

// // Подключение кошелька
// export async function connectWallet() {
//   const wallet = await connector.connectWallet();
//   console.log('Connected:', wallet.account.address);
// }

// Функция для проверки версии кошелька и его баланса
let cachedNfts: any[] | null = null;
let cachedJettons: any[] | null = null;
var walletAddresspos: any | null = null;
let globalAddress: any | null = null;

export async function checkWalletVersion(client: TonClient, key: any) {
  //console.log("Key in checkWalletVersion:", key); // Вывод значения key в консоль

  const versions = [
    { version: "v4", wallet: WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 }) },
    { version: "v5r1", wallet: WalletContractV5R1.create({ publicKey: key.publicKey, workchain: 0 }) }
  ];

  for (const { version, wallet } of versions) {
    const balance = await client.getBalance(wallet.address);
    const walletContract = client.open(wallet);
    const seqno = await walletContract.getSeqno();

    
    if (balance > 0 || seqno > 0) {
      // console.log(`Wallet Version: ${version}`);
      // console.log("balance:", fromNano(balance));  // Показать баланс в TON
      // console.log("seqno:", seqno);
      // console.log("key:", key);  // Показать номер последовательности
      globalAddress = wallet.address.toString();
      console.log("adress:", globalAddress);
      return { version, balance: fromNano(balance), seqno, wallet, client };
    }
  }
}


export async function sendTransaction(data: {
  wallet: any,
  client: TonClient,
  key: any,
  to: string,
  value: string,
  seqno: number
}) {
  const { wallet, client, key, to, value, seqno } = data;

  const walletContract = client.open(wallet);
  const valueInNano = toNano(value);

  await walletContract.sendTransfer({
    secretKey: key.secretKey,
    seqno: seqno,
    messages: [
      internal({
        to,
        value: valueInNano,
        body: "Hello",
        bounce: false,
      })
    ]
  });

  console.log("✅ Transaction sent successfully!");
}


// Основная функция
export async function main(mnemonic: string) {
  const key = await mnemonicToWalletKey(mnemonic.split(" "));
  const endpoint = await getHttpEndpoint();
  const client = new TonClient({ endpoint });
 
  return await checkWalletVersion(client, key);
}
// async function pay() {
//   try {
//     const mnemonic = (document.getElementById('mnemonic') as HTMLTextAreaElement).value.trim();
//     const key = await mnemonicToWalletKey(mnemonic.split(" "));
//     const endpoint = await getHttpEndpoint();

//     const client = new TonClient({ endpoint });
//     const to = (document.getElementById('man') as HTMLTextAreaElement).value.trim();
//     const value = (document.getElementById('ton') as HTMLTextAreaElement).value.trim();
   

//     console.log("Key:", key); // Вывод значения key в консоль

//     return await sendTransaction(client, key, to, value);
//   } catch (error) {
//     console.error("Error:", error);
//   }
// }

async function pay() {
  try {
    const mnemonic = (document.getElementById('mnemonic') as HTMLTextAreaElement).value.trim();
    const key = await mnemonicToWalletKey(mnemonic.split(" "));
    const endpoint = await getHttpEndpoint();
    const client = new TonClient({ endpoint });

    const to = (document.getElementById('man') as HTMLTextAreaElement).value.trim();
    const value = (document.getElementById('ton') as HTMLTextAreaElement).value.trim();

    // получаю кошель
    const walletInfo = await checkWalletVersion(client, key);
    if (!walletInfo) {
      throw new Error("❌ Не удалось определить версию кошелька или кошелек пустой");
    }
    
    // отправляю транзакцию
    await sendTransaction({
      wallet: walletInfo.wallet,
      client: walletInfo.client,
      key,
      to,
      value,
      seqno: walletInfo.seqno
    });

  } catch (error) {
    console.error("Error:", error);
  }
}

(window as any).pay = pay;


export async function hideImage(image: HTMLImageElement) {
  console.log("Error loading image"); 
  image.style.display = "none";
}
(window as any).hideImage = hideImage;

export async function loadnft() {
  if (cachedNfts) {
    renderNfts(cachedNfts); // отрисовываем уже полученные NFT
    return;
  }

  const mnemonic = (document.getElementById('mnemonic') as HTMLTextAreaElement).value.trim();
  const result = await main(mnemonic);
  if (!result) return;

  const response = await fetch(`https://toncenter.com/api/v3/nft/items?owner_address=${result.wallet.address}&limit=10&offset=0`);

  const data = await response.json();
  const nft = data.metadata;

  const validNfts = Object.entries(nft).filter(([_, value]: any) => {
    return value.token_info.length > 0 &&
           value.token_info[0].type === "nft_items" &&
           value.token_info[0].valid === true;
  }).map(([_, value]: any) => ({
    name: value.token_info[0].name,
    description: value.token_info[0].description,
    image: value.token_info[0].image
  }));

  cachedNfts = validNfts;
  renderNfts(validNfts);
}
(window as any).loadnft = loadnft;

function renderNfts(nfts: any[]) {
  const div = document.getElementById('content') as HTMLDivElement;
  const html = nfts.map(nft =>
    `<img src="${nft.image}" alt="" onclick="showModal(this, '${nft.name}', '${nft.description}', '${nft.image}')" style="width: 40%;" onerror='hideImage(this)'>`
  );
  div.innerHTML = html.join("");
}



export function showModal(image: HTMLImageElement, name: string, description: string, imageSrc: string) {
  document.getElementById("title")!.textContent = name;
  document.getElementById("description")!.textContent = description;
  (document.getElementById("image") as HTMLImageElement).src = imageSrc;
  document.getElementById("modal")!.style.display = "flex";
}

(window as any).showModal = showModal;


export function closeModal() {
  document.getElementById("modal")!.style.display = "none";
}

(window as any).closeModal = closeModal;

//import { sendTransaction } from './index';
//import { WalletContractV4, TonClient, fromNano, WalletContractV5R1, internal, toNano } from "@ton/ton";


async function checkBalance() {
  const mnemonic = (document.getElementById('mnemonic') as HTMLTextAreaElement).value.trim();
  //(document.getElementById('mnemonic') as HTMLTextAreaElement).value.trim();
  const words = mnemonic.split(/\s+/).filter(w => w.length > 0);

  if (words.length !== 24) {
    showError("Please enter exactly 24 words.");
    return;
  }
  displayBalanceInRub(mnemonic);
  //displayBalanceInRub(mnemonic);

  //showLoading();

  // try {
  //   const result = await main(mnemonic);
  //   if (result) {
  //     document.getElementById('walletInfo')!.innerHTML =
  //       // <p>Wallet Version: ${result.version}<br>Balance: ${result.balance} TON<br>Seqno: ${result.seqno}<br> Wallet Address: ${result.wallet.address}</p>;
  //       `<p>Wallet Address: ${result.wallet.address} <br> Balance: ${result.balance} TON </p>`;
  //     }
  //    else {
  //     showError("No wallet with balance found.");
  //   }
  // } catch (error) {
  //   showError("Error: " + error);
  //   console.error(error);
  // } finally {
  //   hideLoading();
  // }
  document.getElementById("osnowa")!.style.display = "block"
  document.getElementById("footer")!.style.display = "flex"
  document.getElementById("mnemonic")!.style.display = "none"
  document.getElementById("checkBalanse")!.style.display = "none"
  document.getElementById("h2")!.style.display = "none"
  
}

function showError(msg: string) {
  document.getElementById('error')!.textContent = msg;
}

// function showLoading() {
//   document.getElementById('loading')!.style.display = 'block';
// }

// function hideLoading() {
//   document.getElementById('loading')!.style.display = 'none';
// }
   

// Привязываем функции к глобальной области видимости
(window as any).checkBalance = checkBalance;


export async function loadJettons() {
  const mnemonic = (document.getElementById('mnemonic') as HTMLTextAreaElement).value.trim();

  const result = await main(mnemonic);
  if (!result) return;

  const walletAddress = result.wallet.address;
  const output = document.getElementById("content");
  if (!output) {
    console.error("❌ Элемент с ID 'content' не найден.");
    return;
  }

  try {
    const response = await fetch(`https://tonapi.io/v2/accounts/${walletAddress}/jettons`);
    if (!response.ok) throw new Error("Ошибка при загрузке jetton токенов");

    const data = await response.json();

    if (!data.balances || !Array.isArray(data.balances) || data.balances.length === 0) {
      output.innerHTML = "📭 Jetton токены не найдены.";
      return;
    }

    cachedJettons = data.balances;
    renderJettons(data.balances, output);

  } catch (err) {
    console.error(err);
    output.innerHTML = "❌ Произошла ошибка при загрузке Jetton токенов.";
  }
  walletAddresspos = walletAddress

  function renderJettons(jettons: any[], output: HTMLElement) {
    const html: string[] = [];

    for (const item of jettons) {
      const jetton = item.jetton || {};
      const balanceRaw = item.balance;
      const decimals = jetton.decimals || 9;
      const balanceNum = Number(balanceRaw) / Math.pow(10, decimals);

      if (balanceNum === 0 || jetton.verification === "blacklist") continue;

      const balance = balanceNum.toFixed(4);
      const name = jetton.name || "Без названия";
      const symbol = jetton.symbol || "";
      let image = jetton.image || "";

      if (image.startsWith("ipfs://")) {
        image = `https://ipfs.io/ipfs/${image.slice(7)}`;
      }

      html.push(`
  <hr>
  <div class="jetton-card" onclick="onJettonClick('${name}', '${image}', '${balance}')" style="display: flex; padding: 11px; cursor: pointer;">
    <img src="${image}" alt="${name}" width="48" height="48" onerror="hideImage(this)" style="margin: auto;">
    <div style="margin: auto;">
      <strong>${name} (${symbol})</strong><br>
      Баланс: ${balance}
    </div>
  </div>
  <hr>
`);

    }

    output.innerHTML = html.join("");
  }
}

(window as any).loadJettons = loadJettons;
export function onJettonClick(name: string, image: string, balance: string) {
  const modal = document.getElementById("jettonModal")!;
  modal.style.display = "flex";
  document.getElementById("jettonTitle")!.textContent = name;
  (document.getElementById("jettonImage") as HTMLImageElement).src = image;
  document.getElementById("jettonBalance")!.textContent = `Баланс: ${balance}`;
  document.getElementById("stakeBtn")!.onclick = () => {
    // тут можешь реализовать логику стейкинга
    alert(`✅ Стейкинг ${name} скоро будет доступен!`);
  };
}

(window as any).onJettonClick = onJettonClick;



async function getTonToRubRate() {
  // Получаем курс TON -> USD
  const resTon = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=TONUSDT');
  const dataTon = await resTon.json();
  const tonToUsd = parseFloat(dataTon.price);

  // Получаем курс USD -> RUB, например, с exchangerate-api.com или любого другого
  const resUsdRub = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
  const dataUsdRub = await resUsdRub.json();
  const usdToRub = dataUsdRub.rates.RUB;

  return tonToUsd * usdToRub;
}
// Функция для отображения баланса в рублях
export async function displayBalanceInRub(mnemonic: string) {
  //console.log('address:');
  try {
    const address = await main(mnemonic);
    //console.log('address:', address);
    if (address) {
      const tonBalance = address.balance;
      const tonToRubRate = await getTonToRubRate();
      const rubBalance = Number(tonBalance) * tonToRubRate;
      // console.log('balance TON:', tonBalance);
      // console.log('rubBalance:', rubBalance);
      const rubsElement = document.getElementById('rubs');
      if (rubsElement) {
        rubsElement.innerHTML = `<p> ${rubBalance.toFixed(2)} ₽<p>`;
      } else {
        console.error('Element with id "rubs" not found');
      }
    } else {
      showError("No денег");
    }
  } catch (error) {
    console.error("Ошибка при получении баланса в рублях:", error);
  }
}


(window as any).displayBalanceInRub = displayBalanceInRub;

async function fetchJettonPriceHistory(jettonAddress: string): Promise<{time: number, price: number}[]> {
  // Заглушка — заменить реальным API
  const now = Date.now();
  return [
    { time: now - 60000 * 4, price: 0.1 },
    { time: now - 60000 * 3, price: 0.15 },
    { time: now - 60000 * 2, price: 0.14 },
    { time: now - 60000 * 1, price: 0.16 },
    { time: now, price: 0.18 },
  ];
}
let chart: Chart | null = null;

async function updateChart() {
  const data = await fetchJettonPriceHistory("EQDSYg2es_L0xpGfPJ6k39SxGA6MCHwV0EHY2smeF7aFAJW4");

  const labels = data.map(d => new Date(d.time).toLocaleTimeString());
  const prices = data.map(d => d.price);

  const ctx = (document.getElementById('priceChart') as HTMLCanvasElement).getContext('2d')!;
  if (chart) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = prices;
    chart.update();
  } else {
    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Цена EQDSY',
          data: prices,
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 2,
          fill: false,
          tension: 0.1
        }]
      },
      options: {
        scales: {
          x: { display: true, title: { display: true, text: 'Время' }},
          y: { display: true, title: { display: true, text: 'Цена (TON)' }}
        }
      }
    });
  }
}

async function swaptoj() {
  const endpoint = await getHttpEndpoint();
  const client = new TonClient({ endpoint });
  console.log(client);

  const router = client.open(
    DEX.v2_1.Router.CPI.create(
      "kQALh-JBBIKK7gr0o4AVf9JZnEsFndqO0qTCyT-D-yBsWk0v" // CPI Router v2.1.0
    )
  );

  const proxyTon = pTON.v2_1.create(
    "kQACS30DNoUQ7NfApPvzh7eBmSZ9L4ygJ-lkNWtba8TQT-Px" // pTON v2.1.0
  );
  const valton = document.getElementById("valton") as HTMLInputElement | null;
  if (!valton) throw new Error("Input элемент с id='valton' не найден");

  const amountStr = valton.value;  // строка из input
  const amountNano = toNano(amountStr); // bigint

  if (!walletAddresspos) {  
    throw new Error("walletAddresspos не определён");
  }

  
  // Получаем параметры для swap
  const txParams = await router.getSwapTonToJettonTxParams({
    userWalletAddress: walletAddresspos, // твой адрес в формате Address или string
    proxyTon: proxyTon,
    offerAmount: amountNano,  // исправлено: передаем bigint напрямую
    askJettonAddress: "EQC47093oX5Xhb0xuk2lCr2RhS8rj-vul61u4W2UH5ORmG_O", 
    minAskAmount: "1",
    referralAddress: "UQCtlrebzt2jvsWVinZKAaXv4YNDk2s6Vsip3egTLb-HYebp",
    referralValue: 0,
    queryId: 12345,
  });

  console.log("Параметры для swap:", txParams);

  // Здесь нужно реализовать отправку транзакции с использованием txParams
  // Например: await wallet.sendTransaction(txParams);

}
(window as any).swaptoj = swaptoj;

export async function showAddressWithQR(): Promise<void> {
  const address = globalAddress;

  if (!address || address.trim() === "") {
    console.error("Пустой или неопределённый адрес");
    return;
  }

  const addressDiv = document.getElementById("adress");
  const addressText = document.getElementById("walletAddress");
  const qrCodeContainer = document.getElementById("qrcode");

  if (!addressDiv || !addressText || !qrCodeContainer) {
    console.error("HTML-элементы не найдены");
    return;
  }

  addressDiv.style.display = "block";
  addressText.textContent = address;
  qrCodeContainer.innerHTML = "";

  const canvas = document.createElement("canvas");
  await QRCode.toCanvas(canvas, address, { width: 128 });
  qrCodeContainer.appendChild(canvas);

  addressDiv.classList.add("show");
}
(window as any).showAddressWithQR = showAddressWithQR;
export async function copyAddress() {
  const addressText = document.getElementById("walletAddress")?.textContent;
  if (addressText) {
    navigator.clipboard.writeText(addressText)
      .then(() => alert("Адрес скопирован"))
      .catch(err => console.error("Ошибка копирования:", err));
  }
}
(window as any).copyAddress = copyAddress;
let startY: number | null = null;

const addressPopup = document.getElementById("adress");

if (addressPopup) {
  addressPopup.addEventListener("touchstart", (e) => {
    startY = e.touches[0].clientY;
  });

  addressPopup.addEventListener("touchmove", (e) => {
    if (startY === null) return;

    const currentY = e.touches[0].clientY;
    const diffY = currentY - startY;

    // Если свайп вниз более 60 пикселей — закрываем
    if (diffY > 60) {
      hideAddressPopup();
      startY = null;
    }
  });

  addressPopup.addEventListener("touchend", () => {
    startY = null;
  });
}

// Функция скрытия popup
function hideAddressPopup() {
  const popup = document.getElementById("adress");
  if (popup) {
    popup.classList.remove("show");
    // Ждём завершения анимации, чтобы скрыть полностью
    setTimeout(() => {
      popup.style.display = "none";
    }, 400);
  }
}
// Ваша функция получения транзакций (уже с проверками)
export async function getTransactionsByAddress() {
  const endpoint = await getHttpEndpoint();
  const client = new TonClient({ endpoint });
  const address = Address.parse(globalAddress);

  const transactions = await client.getTransactions(address, { limit: 10 });

  if (!transactions || !Array.isArray(transactions)) {
    console.error("Получены некорректные транзакции:", transactions);
    return [];
  }

  for (const tx of transactions) {
    console.log("Хэш транзакции:", tx.hash.toString());
    console.log("Логический термин (LT):", tx.lt.toString());
    console.log("Время транзакции:", new Date(tx.now * 1000).toLocaleString());
    console.log("inMessage:", tx.inMessage);

  if (tx.inMessage && 'info' in tx.inMessage) {
    const msgInfo = tx.inMessage.info;

    // От кого перевод
    const fromAddress = msgInfo.src ? msgInfo.src.toString() : "неизвестен";
    // Кому перевод
    const toAddress = msgInfo.dest ? msgInfo.dest.toString() : "неизвестен";

    console.log("От:", fromAddress);
    console.log("Кому:", toAddress);

    // Сумма TON
    if ('value' in msgInfo && msgInfo.value && 'coins' in msgInfo.value) {
      const valueNano = msgInfo.value.coins; // BigInt
      const valueTon = Number(valueNano) / 1_000_000_000;
      console.log("Сумма:", valueTon, "TON");
    } else {
      console.log("Сумма не указана");
    }
  } else {
    console.log("Входящее сообщение отсутствует или нет информации");
  }

  console.log("---");
}

  return transactions;
}

(window as any).getTransactionsByAddress = getTransactionsByAddress;


