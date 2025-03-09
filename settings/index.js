var fontLF = localforage.createInstance({
    driver   : localforage.INDEXEDDB,
    name     : 'font',
    storeName: 'font',
    version  : 1
});
var fontSettingsLF = localforage.createInstance({
    driver   : localforage.INDEXEDDB,
    name     : 'font',
    storeName: 'settings',
    version  : 1
});
const mapLF = localforage.createInstance({
    driver   : localforage.INDEXEDDB,
    name     : 'webappData',
    storeName: 'map',
    version  : 1
});

var fontNameList = ["hiragino_w5", "hiragino_w6"];
var fontUrlList = ["https://nanka.cloudfree.jp/static/font/hiraginokakugo/hiragino_w5.woff2", "https://nanka.cloudfree.jp/static/font/hiraginokakugo/hiragino_w6.woff2"];
var fontWeightList = [500, 600];
var fontFamilyList = ["ヒラギノ角ゴ-Pro", "ヒラギノ角ゴ-Pro"];
var fontSizeList = ["3.06", "3.09"];

var mapNameList = ["asia", "cities", "countries", "fukenyohoukutou", "pref", "saibun", "warningCities", "warningPref"];
var mapUrlList = ["https://miyakocam.github.io/geojsons/asia.geojson", "https://miyakocam.github.io/geojsons/cities.geojson", "https://miyakocam.github.io/geojsons/countries.geojson", "https://nanka.cloudfree.jp/webapps/atsusa/source/fukenyohoukutou.geojson", "https://miyakocam.github.io/geojsons/pref.geojson", "https://miyakocam.github.io/geojsons/saibun.geojson", "https://miyakocam.github.io/geojsons/warningCities.geojson", "https://miyakocam.github.io/geojsons/warningPref.geojson"];
var mapFamilyList = ["アジア", "市区町村", "世界(アジア除く)", "府県予報区", "都道府県", "細分区域", "市区町村(塗りつぶし用)", "都道府県(塗りつぶし用)"];
var mapSizeList = ["1.22", "10.0", "0.31", "2.42", "3.42", "6.45", "5.12", "2.42"];

// フォント部分
async function createFontTable() {
    var tableHTML = `<table class="table_1"><tr align="center"><td>フォント名</td><td>管理名</td><td>太さ</td><td>サイズ</td></tr>`;
    
    for (let i = 0; i <fontNameList.length; i++) {
        
        var fontName = fontNameList[i];
        var fontFamily = fontFamilyList[i];
        var fontWeight = fontWeightList[i];
        var fontSize = fontSizeList[i];
    
        // localForageからフォントデータを取得
        var existingFontData = await fontLF.getItem(fontName);
    
        if (existingFontData) {
            tableHTML += `<tr><td>${fontFamily}</td><td>${fontName}</td><td>${fontWeight}</td><td>約 ${fontSize} MB</td></tr>`;
        }
    }
    
    tableHTML += `</table>`;
    document.getElementById('fontTable').innerHTML = tableHTML;
};

async function newFont() {
    document.getElementById('fontTable').innerHTML = "";
    reloadON();

    for (let i = 0; i < fontNameList.length; i++) {
        var fontName = fontNameList[i];
        var fontURL = fontUrlList[i];

        try {
            var response = await fetch(fontURL);
            console.log(`Font Loading completed: '${fontName}', Network`);
            var fontData = await response.arrayBuffer();
            // Blobオブジェクトに変換
            var blob = new Blob([fontData], { type: 'font/woff2' }); // フォントの種類に合わせてtypeを調整

            await fontLF.setItem(fontName, blob);
            console.log(`Font saved successfully: '${fontName}', IndexedDB`);
        } catch (error) {
            console.error(`Font Loading failed: '${fontName}', Network\n${error}`);
        }
    }
    createFontTable();
    reloadOFF();
}

async function deleteFont() {
    document.getElementById('fontTable').innerHTML = "";
    reloadON();

    for (let i = 0; i <fontNameList.length; i++) {
        
        var fontName = fontNameList[i];
    
        // localForageからフォントデータを取得
        await fontLF.removeItem(fontName);
    }
    createFontTable();
    reloadOFF();
}

(async () => {
    await createFontTable();
    await loadFont();
    createFontTable();
})();

// 地図部分
async function createMapTable() {
    var tableHTML = `<table class="table_1"><tr align="center"><td>地図名</td><td>管理名</td><td>サイズ</td></tr>`;
    
    for (let i = 0; i <mapNameList.length; i++) {
        
        var mapName = mapNameList[i];
        var mapFamily = mapFamilyList[i];
        var mapSize = mapSizeList[i];
    
        // localForageからフォントデータを取得
        var existingMapData = await mapLF.getItem(mapName);
    
        if (existingMapData) {
            tableHTML += `<tr><td>${mapFamily}</td><td>${mapName}</td><td>約 ${mapSize} MB</td></tr>`;
        }
    }
    
    tableHTML += `</table>`;
    document.getElementById('mapTable').innerHTML = tableHTML;
};
async function newMap() {
    document.getElementById('mapTable').innerHTML = "";
    reloadON();

    for (let i = 0; i < mapNameList.length; i++) {
        var mapName = mapNameList[i];
        var mapURL = mapUrlList[i];

        try {
            var response = await fetch(mapURL);
            console.log(`Map Loading completed: '${mapName}', Network`);
            var mapData = await response.json();

            await mapLF.setItem(mapName, mapData);
            console.log(`Map saved successfully: '${mapName}', IndexedDB`);
        } catch (error) {
            console.error(`Map Loading failed: '${mapName}', Network\n${error}`);
        }
    }

    createMapTable();
    reloadOFF();
}
async function deleteMap() {
    document.getElementById('mapTable').innerHTML = "";
    reloadON();

    for (let i = 0; i <mapNameList.length; i++) {
        
        var mapName = mapNameList[i];
    
        // localForageからフォントデータを取得
        await mapLF.removeItem(mapName);
    }
    createMapTable();
    reloadOFF();
}

(async () => {
    createMapTable();
})();

document.getElementById('set_font1_switch').addEventListener("change",()=>{
    if (document.getElementById('set_font1_switch').checked == true) {
        fontSettingsLF.setItem(`loadFont`, true);
    } else {
        fontSettingsLF.setItem(`loadFont`, false);
    }
});
(async () => {
    var result = await fontSettingsLF.getItem(`loadFont`);
    if (result == true) {
        document.getElementById('set_font1_switch').checked = true;
    } else {
        document.getElementById('set_font1_switch').checked = false;
    }
})();

document.getElementById('set_font2_switch').addEventListener("change",()=>{
    if (document.getElementById('set_font2_switch').checked == true) {
        fontSettingsLF.setItem(`loadFont_useFont`, true);
    } else {
        fontSettingsLF.setItem(`loadFont_useFont`, false);
    }
});
(async () => {
    var result = await fontSettingsLF.getItem(`loadFont_useFont`);
    if (result == true) {
        document.getElementById('set_font2_switch').checked = true;
    } else {
        document.getElementById('set_font2_switch').checked = false;
    }
})();

function reloadON() {
    document.getElementById('data_reload').classList.add("display");
    document.getElementById('data_reload_bg').classList.add("display");
}
function reloadOFF() {
    document.getElementById('data_reload').classList.remove("display");
    document.getElementById('data_reload_bg').classList.remove("display");
}