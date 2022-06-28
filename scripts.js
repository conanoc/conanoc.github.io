var venders = ["bithumb", "korbit", "coinone"];
var currencys = ["btc", "eth", "xrp", "eos", "bch", "doge", "bat"];
var ticker = {
  bithumb: {},
  korbit: {},
  coinone: {},
  coinmarket: {},
  binance: {}
};
var diffList = [];
var homepage = {
  bithumb: "https://www.bithumb.com",
  korbit: "https://www.korbit.co.kr",
  coinone: "https://coinone.co.kr"
}
var proxyUrl = "https://asia-northeast3-coinprice-189909.cloudfunctions.net/corsproxy"
var krwPerUsd = 1000;
function getProxy(url) {
  return `${proxyUrl}?url=${encodeURIComponent(url)}`
}
function binanceSymbols() {
  var symbols = "symbols=["
  for (currency of currencys) {
    var symbol = currency.toUpperCase() + "USDT";
    symbols += '"' + symbol + '",';
  }
  symbols = symbols.substring(0, symbols.length - 1);
  symbols += "]";
  return symbols;
}
function coinmarketSymbols() {
  var symbols = "symbol="
  for (currency of currencys) {
    var symbol = currency.toUpperCase();
    symbols += symbol + ',';
  }
  symbols = symbols.substring(0, symbols.length - 1);
  return symbols;
}
function computePrimium() {
  for (currency of currencys) {
    var foreign = ticker["coinmarket"][currency];
    var korean = ticker.bithumb[currency];
    var primium = 100 * (korean - foreign) / foreign;
    document.getElementById(currency+"-average").innerHTML 
      = Number(Number(korean).toFixed(0)).toLocaleString();
    document.getElementById(currency+"-primium").innerHTML 
      = Number(primium).toFixed(2) + "%";

    ticker["binance"][currency] *= krwPerUsd;
    var binance = ticker["binance"][currency];
    var diff = 100 * (korean - binance) / binance;
    document.getElementById(currency+"-binance").innerHTML 
      = Number(Number(binance).toFixed(0)).toLocaleString();
    document.getElementById(currency+"-binance-diff").innerHTML 
      = Number(diff).toFixed(2) + "%";

    if (currency != "btg")
      diffList.push({
        "currency":currency,
        "diff":diff
      });
  }
}
function getMaxVender(currency) {
  var max = venders[0];
  for (vender of venders)
    if (ticker[vender][currency] > ticker[max][currency])
      max = vender;
  return max;
}
function getMinVender(currency) {
  var min = venders[0];
  for (vender of venders)
    if (ticker[vender][currency] < ticker[min][currency])
      min = vender;
  return min;
}
function computeArbitrage() {
  // arbitrage btw korean exchange.
  for (currency of currencys) {
    var max = getMaxVender(currency);
    var min = getMinVender(currency);
    document.getElementById(currency+"-arbitrage").innerHTML = max + " - " + min;
    var percent = (ticker[max][currency] - ticker[min][currency]) * 100 / ticker[min][currency];
    document.getElementById(currency+"-arbitrage-percent").innerHTML
      = Number(percent).toFixed(2) + " %";
  }

  // arbitrage with binance.
  diffList.sort(function(a,b) {
    return a.diff - b.diff;
  });
  var max = diffList[diffList.length - 1];
  var min = diffList[0];
  document.getElementById("binance-arbitrage").innerHTML = "binance arbitrage: " + max.currency.toUpperCase() + " - " + min.currency.toUpperCase() + " = " + Number(max.diff - min.diff).toFixed(2) + " %";
}
function setBithumbPrice(item) {
  var currency = item.currency
  ticker["bithumb"][currency] = Number(item.data.closing_price);
  document.getElementById(currency+"-bithumb").innerHTML 
    = Number(item.data.closing_price).toLocaleString();
  document.getElementById(currency+"-change-bithumb").innerHTML 
    = Number(100*(item.data.closing_price - item.data.opening_price)/item.data.opening_price).toFixed(2) + "%";

  if (Number(item.data.closing_price) > Number(item.data.opening_price)) {
    document.getElementById(currency+"-change-bithumb").style.color = "red";
    document.getElementById(currency+"-change-bithumb").innerHTML += ' <i class="fas fa-caret-up"></i>';
  } else {
    document.getElementById(currency+"-change-bithumb").style.color = "blue";
    document.getElementById(currency+"-change-bithumb").innerHTML += ' <i class="fas fa-caret-down"></i>';
  }
}
function fetchUsdRate() {
  return fetch(getProxy("https://api.manana.kr/exchange/rate/KRW/USD.json")).then(function(response) {
    return response.json();
  }).then(function(json) {
    krwPerUsd = json[0]["rate"];
    document.getElementById("krw_usd").innerHTML = Number(krwPerUsd).toLocaleString();
  });  
}
function getBithumbTicker(currency) {
  return fetch(getProxy("https://api.bithumb.com/public/ticker/" + currency + "_krw")).then(function(response) {
    return response.json();
  }).then(function(json) {
    json.currency = currency;
    return json;
  });
}
function fetchBithumb() {
  Promise.all(currencys.map(getBithumbTicker)).then(function(json) {
    for (item of json) {
      setBithumbPrice(item);
    }
  });
}
function getKorbitTicker(currency) {
  return fetch(getProxy("https://api.korbit.co.kr/v1/ticker?currency_pair="+currency+"_krw")).then(function(response) {
    return response.json();
  }).then(function(json) {
    json.currency = currency;
    return json;
  });
}
function fetchKorbit() {
  Promise.all(currencys.map(getKorbitTicker)).then(function(json) {
    for (item of json) {
      var currency = item.currency;
      ticker["korbit"][currency] = Number(item.last);
      document.getElementById(currency+"-korbit").innerHTML
        = Number(item.last).toLocaleString();
    }
  });
}
function getCoinoneTicker(currency) {
  return fetch(getProxy("https://api.coinone.co.kr/public/v2/ticker_new/krw/"+currency)).then(function(response) {
    return response.json();
  }).then(function(json) {
    json.currency = currency;
    return json;
  });
}
function fetchCoinone() {
  Promise.all(currencys.map(getCoinoneTicker)).then(function(json) {
    for (item of json) {
      var currency = item.currency;
      ticker["coinone"][currency] = Number(item.tickers[0].last);
      document.getElementById(currency+"-coinone").innerHTML 
        = Number(item.tickers[0].last).toLocaleString();            
    }
  });
}
function fetchCoinmarket() {
  return fetch(getProxy("https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?convert=KRW&CMC_PRO_API_KEY=7a6ebd1b-fde3-4f0c-8237-328378a273ea&"+coinmarketSymbols())).then(function(response) {
    return response.json();
  }).then(function(json) {
    for ([_, item] of Object.entries(json.data)) {
      var currency = item.symbol.toLowerCase();
      if (currencys.includes(currency)) {
        ticker["coinmarket"][currency] = Number(item.quote.KRW.price);
        document.getElementById(currency + "-coinmarket").innerHTML 
          = Number(Number(item.quote.KRW.price).toFixed()).toLocaleString();
        document.getElementById(currency + "-change-coinmarket").innerHTML 
          = Number(item.quote.KRW.percent_change_24h).toFixed(2) + "%";

        if (item.quote.KRW.percent_change_24h > 0) {
          document.getElementById(currency +"-change-coinmarket").style.color = "red";
          document.getElementById(currency+"-change-coinmarket").innerHTML += ' <i class="fas fa-caret-up"></i>';
        } else {
          document.getElementById(currency +"-change-coinmarket").style.color = "blue";
          document.getElementById(currency+"-change-coinmarket").innerHTML += ' <i class="fas fa-caret-down"></i>';
        }
      }
    }
  });
}
function fetchBinance() {
  return fetch(getProxy("https://api1.binance.com/api/v3/ticker/price?"+binanceSymbols())).then(function(response) {
    return response.json();
  }).then(function(json) {
    for (item of json) {
      var length = item.symbol.length - "USDT".length;
      var currency = item.symbol.substring(0, length).toLowerCase();
      ticker["binance"][currency] = Number(item.price);
    }
  });
}
function getTableBody(venders, arbitrage = false) {
  var tbody = "";
  for (currency of currencys) {
    tbody += "<tr>" + "<td align=center>" + currency.toUpperCase() + "</td>";
    if (arbitrage) {
      tbody += "<td id=" + currency + "-arbitrage" + " align=center>로딩중</td>";
      tbody += "<td id=" + currency + "-arbitrage-percent" + " align=right>0</td>";
      tbody += "</tr>";
      continue;
    }

    for (vender of venders) {
      if (currency == "btc")
        tbody += "<td id=" + currency + "-" + vender + " align=right>로딩중</td>";
      else
        tbody += "<td id=" + currency + "-" + vender + " align=right>0</td>";
      if (vender == "bithumb" || vender == "coinmarket")
        tbody += "<td><div id=" + currency + "-change-" + vender + " align=right style='width: 60px'>-</div></td>";
      if (vender == "coinmarket") {
        tbody += "<td id=" + currency + "-average" + " align=right>0</td>";
        tbody += "<td id=" + currency + "-primium" + " align=right>0</td>";
        tbody += "<td id=" + currency + "-binance" + " align=right>0</td>";
        tbody += "<td id=" + currency + "-binance-diff" + " align=right>0</td>";
      }
    }
    tbody += "</tr>";
  }
  return tbody;
}
function writeTable() {
  for (vender of venders) {
    document.getElementById("currency-header-local").innerHTML += "<th><a target=_ href=" + homepage[vender] + ">" + vender + "</a></th>";
    if (vender == "bithumb")
      document.getElementById("currency-header-local").innerHTML += "<th width>24H</th>";
  }
  document.getElementById("currency-header-arbitrage").innerHTML += "<th>차익 기준</th>";
  document.getElementById("currency-header-arbitrage").innerHTML += "<th>차익 %</th>";

  document.getElementById("currency-header-primium").innerHTML += "<th>" + "coinmarket" + "</th>";
  document.getElementById("currency-header-primium").innerHTML += "<th>24H</th>";
  document.getElementById("currency-header-primium").innerHTML += "<th>bithumb</th>";
  document.getElementById("currency-header-primium").innerHTML += "<th>김프1</th>";
  document.getElementById("currency-header-primium").innerHTML += "<th>binance</th>";
  document.getElementById("currency-header-primium").innerHTML += "<th>김프2</th>";

  document.getElementById("currency-tbody-local").innerHTML = getTableBody(venders);
  document.getElementById("currency-tbody-arbitrage").innerHTML = getTableBody(null, true);
  document.getElementById("currency-tbody-primium").innerHTML = getTableBody(["coinmarket"]);
}
function loadPage() {
  writeTable();
  var bithumb = fetchBithumb();
  var korbit = fetchKorbit();
  var coinone = fetchCoinone();
  var coinmarketcap = fetchCoinmarket();
  var binance = fetchBinance();
  var usd = fetchUsdRate();
  Promise.allSettled([bithumb, coinone, korbit, coinmarketcap, binance, usd]).then(function() {
    computePrimium();
    computeArbitrage();
  });
}

