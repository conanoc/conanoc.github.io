var venders = ["bithumb", "korbit", "coinone"];  // local venders
var currencys = ["btc", "eth", "xrp", "eos", "ltc"];
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
var reqOptions = {
  headers: {
    "Accept-Encoding": "gzip,deflate"    
  }
}
var krwPerUsd = 1000;
function computePrimium() {
  ticker.binance.btc *= krwPerUsd; 
  for (currency of currencys) {
    var foreign = ticker["coinmarket"][currency];
    var korean = ticker.bithumb[currency];
    var primium = 100 * (korean - foreign) / foreign;
    document.getElementById(currency+"-average").innerHTML 
      = Number(Number(korean).toFixed(0)).toLocaleString();
    document.getElementById(currency+"-primium").innerHTML 
      = Number(primium).toFixed(2) + "%";

    if (currency != "btc")
      ticker.binance[currency] *= ticker.binance.btc;
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
function setBithumbPrice(currency, json) {
  var item = json.data[currency.toUpperCase()];
  ticker["bithumb"][currency] = Number(item.closing_price);
  document.getElementById(currency+"-bithumb").innerHTML 
    = Number(item.closing_price).toLocaleString();
  document.getElementById(currency+"-change-bithumb").innerHTML 
    = Number(100*(item.closing_price - item.opening_price)/item.opening_price).toFixed(2) + "%";

  if (Number(item.closing_price) > Number(item.opening_price)) {
    document.getElementById(currency+"-change-bithumb").style.color = "red";
    document.getElementById(currency+"-change-bithumb").innerHTML += ' <i class="fas fa-caret-up"></i>';
  } else {
    document.getElementById(currency+"-change-bithumb").style.color = "blue";
    document.getElementById(currency+"-change-bithumb").innerHTML += ' <i class="fas fa-caret-down"></i>';
  }
}
function fetchUsdRate() {
  return fetch("https://api.manana.kr/exchange/rate/KRW/USD.json", reqOptions).then(function(response) {
    return response.json();
  }).then(function(json) {
    krwPerUsd = json[0]["rate"];
    document.getElementById("krw_usd").innerHTML = Number(krwPerUsd).toLocaleString();
  });  
}
function fetchBithumb() {
  return fetch("https://api.bithumb.com/public/ticker/all", reqOptions).then(function(response) {
    return response.json();
  }).then(function(json) {
    for (currency of currencys)
      setBithumbPrice(currency, json);
  });
}
function fetchKorbit() {
  return fetch("https://conanoc-eval-prod.apigee.net/korbit", reqOptions).then(function(response) {
    return response.json();
  }).then(function(json) {
    for (currency of currencys) {
      if (json[currency] === undefined)
        continue;
      ticker["korbit"][currency] = Number(json[currency].last);
      document.getElementById(currency+"-korbit").innerHTML 
        = Number(json[currency].last).toLocaleString();            
    }
  });
}
function fetchCoinone() {
  return fetch("https://conanoc-eval-prod.apigee.net/coinone", reqOptions).then(function(response) {
    return response.json();
  }).then(function(json) {
    for (currency of currencys) {
      if (json[currency] === undefined)
        continue;
      ticker["coinone"][currency] = Number(json[currency].last);
      document.getElementById(currency+"-coinone").innerHTML 
        = Number(json[currency].last).toLocaleString();            
    }
  });
}
function fetchCoinmarket() {
  return fetch("https://conanoc-eval-prod.apigee.net/coinmarket", reqOptions).then(function(response) {
    return response.json();
  }).then(function(json) {
    for (item of json.data) {
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
  return fetch("https://conanoc-eval-prod.apigee.net/binance", reqOptions).then(function(response) {
    return response.json();
  }).then(function(json) {
    var count = 0;
    for (item of json) {
      var currency = item.symbol.substring(0, 3).toLowerCase();
      if (currency == "bcc") {
        currency = "bch";
        item.symbol = "BCH" + item.symbol.substring(3);
      } else if (currency == "das") {
        currency = "dash";
      }
      if (currency == "btc" || (currencys.includes(currency) && item.symbol.toLowerCase() == (currency + "btc"))) {
        ticker["binance"][currency] = Number(item.price);
        count++;
      }
      if (count == currencys.length)
        break;
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
  if (location.protocol == 'http:' && location.host.startsWith("conanoc")) {
    location.href = 'https:' + window.location.href.substring(window.location.protocol.length);
    return;
  }

  writeTable();
  var bithumb = fetchBithumb();
  var korbit = fetchKorbit();
  var coinone = fetchCoinone();
  var coinmarketcap = fetchCoinmarket();
  var binance = fetchBinance();
  var usd = fetchUsdRate();
  Promise.all([bithumb, coinone, korbit, coinmarketcap, binance, usd]).then(function() {
    computePrimium();
    computeArbitrage();
  });
}

