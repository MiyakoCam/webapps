// スムーズスクロール
L.Map.mergeOptions({
    smoothWheelZoom: true,
    smoothSensitivity:0.5
});
L.Map.SmoothWheelZoom = L.Handler.extend({

    addHooks: function () {
        L.DomEvent.on(this._map._container, 'wheel', this._onWheelScroll, this);
    },

    removeHooks: function () {
        L.DomEvent.off(this._map._container, 'wheel', this._onWheelScroll, this);
    },

    _onWheelScroll: function (e) {
        if (!this._isWheeling) {
            this._onWheelStart(e);
        }
        this._onWheeling(e);
    },

    _onWheelStart: function (e) {
        var map = this._map;
        this._isWheeling = true;
        this._wheelMousePosition = map.mouseEventToContainerPoint(e);
        this._centerPoint = map.getSize()._divideBy(2);
        this._startLatLng = map.containerPointToLatLng(this._centerPoint);
        this._wheelStartLatLng = map.containerPointToLatLng(this._wheelMousePosition);
        this._startZoom = map.getZoom();
        this._moved = false;
        this._zooming = true;

        map._stop();
        if (map._panAnim) map._panAnim.stop();

        this._goalZoom = map.getZoom();
        this._prevCenter = map.getCenter();
        this._prevZoom = map.getZoom();

        this._zoomAnimationId = requestAnimationFrame(this._updateWheelZoom.bind(this));
    },

    _onWheeling: function (e) {
        var map = this._map;

        this._goalZoom = this._goalZoom + L.DomEvent.getWheelDelta(e) * 0.003 * map.options.smoothSensitivity;
        if (this._goalZoom < map.getMinZoom() || this._goalZoom > map.getMaxZoom()) {
            this._goalZoom = map._limitZoom(this._goalZoom);
        }
        this._wheelMousePosition = this._map.mouseEventToContainerPoint(e);

        clearTimeout(this._timeoutId);
        this._timeoutId = setTimeout(this._onWheelEnd.bind(this), 200);

        L.DomEvent.preventDefault(e);
        L.DomEvent.stopPropagation(e);
    },

    _onWheelEnd: function (e) {
        this._isWheeling = false;
        cancelAnimationFrame(this._zoomAnimationId);
        this._map._moveEnd(true);
    },

    _updateWheelZoom: function () {
        var map = this._map;

        if ((!map.getCenter().equals(this._prevCenter)) || map.getZoom() != this._prevZoom)
            return;

        this._zoom = map.getZoom() + (this._goalZoom - map.getZoom()) * 0.3;
        this._zoom = Math.floor(this._zoom * 100) / 100;

        var delta = this._wheelMousePosition.subtract(this._centerPoint);
        if (delta.x === 0 && delta.y === 0)
            return;

        if (map.options.smoothWheelZoom === 'center') {
            this._center = this._startLatLng;
        } else {
            this._center = map.unproject(map.project(this._wheelStartLatLng, this._zoom).subtract(delta), this._zoom);
        }

        if (!this._moved) {
            map._moveStart(true, false);
            this._moved = true;
        }

        map._move(this._center, this._zoom);
        this._prevCenter = map.getCenter();
        this._prevZoom = map.getZoom();

        this._zoomAnimationId = requestAnimationFrame(this._updateWheelZoom.bind(this));
    }

});

L.Map.addInitHook('addHandler', 'smoothWheelZoom', L.Map.SmoothWheelZoom );

var map = L.map('map', {
    zoomSnap: 0,
    center: [37.575, 137.984],
    zoom: 5.6,
    minZoom: 4,
    scrollWheelZoom: false,
    smoothWheelZoom: true,
    smoothSensitivity: 1.5,
    preferCanvas:false,
});
//L.control.scale({maxWidth:150,position:'bottomright',imperial:false}).addTo(map);  // スケールを表示
map.zoomControl.setPosition('topright');

map.attributionControl.addAttribution(
    "<a href='https://www.jma.go.jp/' target='_blank'>気象庁</a>"
);

map.createPane("pane_map_1").style.zIndex = 1;
map.createPane("pane_map_2").style.zIndex = 2;
map.createPane("pane_map_yoho").style.zIndex = 3;
map.createPane("pane_map_keiho").style.zIndex = 4;
map.createPane("nowcast").style.zIndex = 10;
map.createPane("pane_map_3").style.zIndex = 50;
map.createPane("liden").style.zIndex = 60;
map.createPane("important").style.zIndex = 70;
map.createPane("mlit").style.zIndex = 99;
map.createPane("amedas").style.zIndex = 100;

var map_cities;
var map_cities2;
var mapData_cities;
var map_pref;
var mapData_pref;
$.getJSON("https://miyakocam.github.io/geojsons/warningPref.geojson",function(data) {
    mapData_pref = data;
    map_pref = L.geoJson(data,{
        pane: "pane_map_1",
        style: {
        "opacity": 0,
        "fillColor": "#ffffff",
        "fillOpacity": 1,
        }
    }).addTo(map);
    
    data["features"].forEach(element => {
        var map_pref2 = L.geoJson(element,{
            pane: "pane_map_3",
            style: {
            "color": "#333533",
            "weight": 1,
            "opacity": 1,
            "fillOpacity": 0,
            }
        });
        map_pref2.prefName = element["properties"]["name"];
        map_pref2.on('mouseover', function(e) {createOverview(element["properties"]["code"], element["properties"]["name"])});
        map_pref2.on('mouseout', function(e) {deleteOverview(element["properties"]["code"], element["properties"]["name"])});
        map_pref2.on('click', function(e) { createDetail(element["properties"]["code"], element["properties"]["name"])}).addTo(map);
    })

    // var list = [];
    // data["features"].forEach(element => {
    //     list.push(element["properties"]["code"]);
    // })
    // console.log(list)
    
});
// $.getJSON("https://miyakocam.github.io/geojsons/warningSaibun.geojson",function(data) {
//     
//     map_pref2 = L.geoJson(data,{
//         pane: "pane_map_3",
//         style: {
//         "color": "#333533",
//         "weight": 0.7,
//         "opacity": 1,
//         "fillOpacity": 0,
//         }
//     }).addTo(map);
// });
$.getJSON("https://miyakocam.github.io/geojsons/warningCities.geojson",function(data) {
    mapData_cities = data;
    // map_cities = L.geoJson(data,{
    //     pane: "pane_map_2",
    //     style: {
    //     "opacity": 0,
    //     "fillColor": "#ffffff",
    //     "fillOpacity": 1,
    //     }
    // }).addTo(map);
    map_cities2 = L.geoJson(data,{
        pane: "pane_map_2",
            style: {
            "color": "#333533",
            "weight": 0.5,
            "opacity": 1,
            "fillOpacity": 0,
            }
    }).addTo(map);

    getData();
});

var JSONdata;
var filledList = {};
var filledMaxList = {};
var filled_layer = L.layerGroup();
var latestTime;
var latestClickPref;
var autoScroll_onoff = "off";
var autoReload_onoff = "off";
var autoReloadInterval;
var lightMode_onoff = "off";

var isAll_text = "";

function getData() {
    $.getJSON("https://www.jma.go.jp/bosai/warning/data/warning/map.json",function(data) {
        JSONdata = data;
        mapDraw();
        if ($('#text_yososhindo').hasClass("display") && $('#text_yososhindo').hasClass("ichiranAll")) {
            document.getElementById('ichiranAll').click();
        } else if ($('#text_yososhindo').hasClass("display") && latestClickPref != "" && latestClickPref != undefined) {
            createDetail(latestClickPref, prefNameList[prefCodeList.indexOf(latestClickPref)])
        }
    });
}

function mapDraw() {
    map.removeLayer(filled_layer);
    filled_layer = L.layerGroup();
    filledList = {}; //{"4540600": {"18": 1}}のように、{"地域コード": {"注意報警報コード": 注意報警報数字の最大}}で保存
    filledMaxList = {}; //{"4540600": 1}のように、{"地域コード": 注意報警報数字の最大}で保存
    
    for (let i = 0; i < JSONdata.length; i++) {
        if (i == 0) {
            latestTime = new Date(JSONdata[i]["reportDatetime"]);
        } else {
            if (new Date(JSONdata[i]["reportDatetime"]) > latestTime) {
                latestTime = new Date(JSONdata[i]["reportDatetime"]);
            }
        }
        JSONdata[i]["areaTypes"][1]["areas"].forEach(element2 => {
            var array_Num = cityCode.indexOf(element2["code"]);
            if (array_Num != -1) {
                var style = {
                    "weight": 0,
                    "opacity": 0,
                    "fillOpacity": 0,
                };
                element2["warnings"].forEach(element3 => {
                    if (element3["status"] != "発表警報・注意報はなし") {
                        if (element3["status"] == "発表" || element3["status"] == "継続") {
                            if (filledMaxList[element2["code"]] < warningLevel[element3["code"]] || filledMaxList[element2["code"]] == undefined) { //それ以上の種別で塗りつぶしできるまたは塗りつぶしされていない場合。
                                filledMaxList[element2["code"]] = warningLevel[element3["code"]];
                                
                            } else { //すでに同じまたはそれ以上の種別で塗りつぶしがされている場合。

                            }
                            if (filledList[element2["code"]] == undefined) {
                                filledList[element2["code"]] = {};
                            }
                            filledList[element2["code"]][element3["code"]] = warningLevel[element3["code"]];
                        } else if (element3["status"] == "継続") {
                        } else if (element3["status"] == "解除") {
                            if (filledList[element2["code"]]) {
                                if (filledList[element2["code"]][element3["code"]]) {
                                    console.error("削除しました。２");
                                    delete filledList[element2["code"]][element3["code"]];
                                }
                            }
                        }
                    } else {
                        if (filledList[element2["code"]] && filledMaxList[element2["code"]]) {
                            console.error("削除しました。１");
                            delete filledList[element2["code"]];
                            delete filledMaxList[element2["code"]];
                        }
                    }
                })
            }
        });
    }

    let latestTime_month = ('0' + (latestTime.getMonth() + 1)).slice(-2);
    let latestTime_date = ('0' + latestTime.getDate()).slice(-2);
    let latestTime_hour = ('0' + latestTime.getHours()).slice(-2);
    let latestTime_minute = ('0' + latestTime.getMinutes()).slice(-2);
    document.getElementById('title_time').innerHTML = latestTime_month+'<span class="small">月</span>'+latestTime_date+'<span class="small">日</span> '+latestTime_hour+'<span class="small">時</span>'+latestTime_minute+'<span class="small">分</span>更新';

    if (lightMode_onoff == "on") { // 都道府県ごとで塗りつぶし
        map.removeLayer(map_cities2);

        var prefFilledMaxList = {};
        Object.keys(filledMaxList).forEach(FMLi => {
            if (prefFilledMaxList[cityToPref[FMLi]] == undefined) {
                prefFilledMaxList[cityToPref[FMLi]] = "";
            }
            if (prefFilledMaxList[cityToPref[FMLi]] < filledMaxList[FMLi]) {
                prefFilledMaxList[cityToPref[FMLi]] = filledMaxList[FMLi];
            }
        });
        
        Object.keys(prefFilledMaxList).forEach(PRFkey => {
            var style;
            if (prefFilledMaxList[PRFkey] == 1) {
                style = {"color": "#333533","weight": 0.5,"opacity": 1,"fillColor": "#ffd000","fillOpacity": 1,}
            } else if (prefFilledMaxList[PRFkey] == 2) {
                style = {"color": "#333533","weight": 0.5,"opacity": 1,"fillColor": "#dd0000","fillOpacity": 1,}
            } else if (prefFilledMaxList[PRFkey] == 3) {
                style = {"color": "#333533","weight": 0.5,"opacity": 1,"fillColor": "#aa00dd","fillOpacity": 1,}
            } else {
                style = {"weight": 0,"opacity": 0,"fillOpacity": 0,}
            }
            var data_japan = mapData_pref["features"][prefCodeList.indexOf(PRFkey)];
            var FILLEDLAYER = L.geoJSON(data_japan, {
                style: style,
                pane: "pane_map_yoho"
            });
            filled_layer.addLayer(FILLEDLAYER);
        });
    } else { // 市区町村ごとで塗りつぶし
        map.removeLayer(map_cities2);
        map.addLayer(map_cities2);

        Object.keys(filledMaxList).forEach(FMLi => {
            if (filledMaxList[FMLi] == 1) {
                style = {"color": "#333533","weight": 0.5,"opacity": 1,"fillColor": "#ffd000","fillOpacity": 1,}
            } else if (filledMaxList[FMLi] == 2) {
                style = {"color": "#333533","weight": 0.5,"opacity": 1,"fillColor": "#dd0000","fillOpacity": 1,}
            } else if (filledMaxList[FMLi] == 3) {
                style = {"color": "#333533","weight": 0.5,"opacity": 1,"fillColor": "#aa00dd","fillOpacity": 1,}
            } else {
                style = {"weight": 0,"opacity": 0,"fillOpacity": 0,}
            }
            var data_japan = mapData_cities["features"][cityCode.indexOf(FMLi)];
            var FILLEDLAYER = L.geoJSON(data_japan, {
                style: style,
                pane: "pane_map_yoho"
            });
            filled_layer.addLayer(FILLEDLAYER);
        });
    }

    map.addLayer(filled_layer);
    
}

function createDetail(pref, prefName, isAll) {
    if (document.getElementById('btn_scroll_text_yososhindo').innerText == "ｽｸﾛｰﾙ停止") {
        clearInterval(scrollInterval);
        document.getElementById('btn_scroll_text_yososhindo').innerText = "ｽｸﾛｰﾙ開始";
    }

    var text1 = '<tr><td class="cityName">'+prefName+'</td><td class="cityName">発表警報・注意報</td></tr>';
    var textTr_level3 = "";
    var textTr_level2 = "";
    var textTr_level1 = "";
    
    prefToCity[pref].forEach(element => {
        if (filledList[element]) {
            var text_allKari = "";
            var array_Num = cityCode.indexOf(element);
            var textSpan_level3 = "";
            var textSpan_level2 = "";
            var textSpan_level1 = "";
            Object.keys(filledList[element]).forEach(element2 => {
                if (warningLevel[element2] == 3) {
                    textSpan_level3 += '<span class="color'+filledList[element][element2]+'">'+warningShortName[element2]+'</span>';
                } else if (warningLevel[element2] == 2) {
                    textSpan_level2 += '<span class="color'+filledList[element][element2]+'">'+warningShortName[element2]+'</span>';
                } else if (warningLevel[element2] == 1) {
                    textSpan_level1 += '<span class="color'+filledList[element][element2]+'">'+warningShortName[element2]+'</span>';
                }
            });
            text_allKari += '<tr><td><ruby>'+cityName[array_Num]+'<rt>'+cityNameKana[array_Num]+'</rt></ruby></td>';
            text_allKari += '<td>';
            text_allKari += textSpan_level3 + textSpan_level2 + textSpan_level1;
            text_allKari += '</td>';
            if (filledMaxList[element] == 3) {
                textTr_level3 += text_allKari;
            } else if (filledMaxList[element] == 2) {
                textTr_level2 += text_allKari;
            } else if (filledMaxList[element] == 1) {
                textTr_level1 += text_allKari;
            }
        }
    });
    
    text1 += textTr_level3 + textTr_level2 + textTr_level1;

    if (isAll != undefined) {
        latestClickPref = "";
        $('#text_yososhindo').addClass("ichiranAll");

        if (isAll == 0) { // 最初
            if (textTr_level3 != "" || textTr_level2 != "" || textTr_level1 != "") {
                isAll_text += text1;
            }
        } else if (isAll == 63) { // 最後
            if (textTr_level3 != "" || textTr_level2 != "" || textTr_level1 != "") {
                if (isAll_text != "") {
                    isAll_text += ('<tr><td colspan="2" style="height: 2rem;opacity: 0;"></td></tr>'+text1);
                } else {
                    isAll_text += (text1);
                }
            }
            document.getElementById('table_text_yososhindo').innerHTML = isAll_text;
            isAll_text = "";
        } else { // 途中
            if (textTr_level3 != "" || textTr_level2 != "" || textTr_level1 != "") {
                if (isAll_text != "") {
                    isAll_text += ('<tr><td colspan="2" style="height: 2rem;opacity: 0;"></td></tr>'+text1);
                } else {
                    isAll_text += (text1);
                }
            }
        }
    } else {
        latestClickPref = pref;
        $('#text_yososhindo').removeClass("ichiranAll");

        if (textTr_level3 == "" && textTr_level2 == "" && textTr_level1 == "") {
            text1 += '<tr><td colspan="2" class="nowarning">現在発表されている警報・注意報はありません。</td></tr>';
        }
        document.getElementById('table_text_yososhindo').innerHTML = text1;
    }
    document.getElementById('text_yososhindo').classList.add("display");
    if (autoReload_onoff == "on" && autoScroll_onoff == "on" && document.getElementById('btn_scroll_text_yososhindo').innerText == "ｽｸﾛｰﾙ開始") {
        document.getElementById('table_text_yososhindo').scrollTop = 0;
        document.getElementById('btn_scroll_text_yososhindo').click();
    }
    if (latestClickPref != undefined || latestClickPref != "") {
        document.getElementById('table_text_yososhindo').scrollTop = 0;
    }
}

function createOverview(pref, prefName) {
    var level3 = [];
    var level2 = [];
    var level1 = [];
    prefToCity[pref].forEach(element => {
        if (filledList[element]) {
            Object.keys(filledList[element]).forEach(element2 => {
                if (warningLevel[element2] == 3) {
                    if (level3.indexOf(element2) == -1) {level3.push(element2);}
                } else if (warningLevel[element2] == 2) {
                    if (level2.indexOf(element2) == -1) {level2.push(element2);}
                } else if (warningLevel[element2] == 1) {
                    if (level1.indexOf(element2) == -1) {level1.push(element2);}
                }
            });
            
        }
    });
    var level3_text = "";
    var level2_text = "";
    var level1_text = "";
    level3.forEach(L => {level3_text += '<span class="color3">'+warningShortName[L]+'</span>';});
    level2.forEach(L => {level2_text += '<span class="color2">'+warningShortName[L]+'</span>';});
    level1.forEach(L => {level1_text += '<span class="color1">'+warningShortName[L]+'</span>';});
    if (level3_text == "" && level2_text == "" && level1_text == "") {
        level3_text = "発表されている警報・注意報はありません。";
    }
    document.getElementById('overview').innerHTML = '<div style="line-height: 1.4em;font-size: 1.1em;">'+prefName+'</div>'+level3_text+level2_text+level1_text;
    document.getElementById('overview').classList.add("display");
}
function deleteOverview(pref, e) {
    //document.getElementById('overview').innerHTML = "";
    document.getElementById('overview').classList.remove("display");
}
document.getElementById('map').addEventListener("mousemove", (e)=>{overviewMove(e);});
document.getElementById('overview').addEventListener("mousemove", (e)=>{overviewMove(e);});
function overviewMove(e) {
    if (document.getElementById('overview').classList.contains("display") == true) {
        document.getElementById('overview').style.top = (e.clientY + 10) + "px";
        document.getElementById('overview').style.left = (e.clientX + 10) + "px";
    }
}


var koushin;
var koushin_ok;
//ボタン押下時のイベント設定とローカルストレージの設定
document.getElementById('reload').addEventListener("click",()=>{
    clearTimeout(koushin);
    clearTimeout(koushin_ok);
    getData();
    document.getElementById('reload').innerText = "更新中…";
    koushin = setTimeout(() => {
        document.getElementById('reload').innerText = "更新完了";
        koushin_ok = setTimeout(() => {
            document.getElementById('reload').innerText = "情報更新";
        }, 1000);
    }, 1000);
});

document.getElementById('autoReload').addEventListener("click",()=>{
    if (autoReload_onoff == "on") {
        document.getElementById('autoReload').classList.remove('on');
        document.getElementById('text_yososhindo_autoreload_onoff').innerText = "AR:×";
    } else {
        document.getElementById('autoReload').classList.add('on');
        document.getElementById('text_yososhindo_autoreload_onoff').innerText = "AR:⭘";
    }
    interval();
});
function interval() {
    var autoReload_onoff_num = 5 * 60 * 1000;
    if (autoReload_onoff == "off") {
        if (autoReloadInterval != null || autoReloadInterval != 0) {
            clearInterval(autoReloadInterval);
            autoReloadInterval = null;
        }
        console.warn("5分間隔で情報の自動更新を行います。\n異常時に自動更新を強制停止させる場合は「clearInterval(autoReloadInterval);」または「interval();」をこのコンソールにコピーし実行してください。");
        autoReloadInterval = setInterval(() => {
            getData();
        }, autoReload_onoff_num);
        autoReload_onoff = "on";
    } else {
        clearInterval(autoReloadInterval);
        autoReloadInterval = null;
        autoReload_onoff = "off";
        console.info("情報の自動更新を解除しました。");
    }
}

document.getElementById('ichiranAll').addEventListener("click",()=>{
    for (let i = 0; i < prefCodeList.length; i++) {
        var code = prefCodeList[i];
        var name = prefNameList[i];
        createDetail(code, name, i);
    }
});

$('#lightMode').click(event => {
    if (lightMode_onoff == "off") {
        lightMode_onoff = "on";
        $('#lightMode').addClass('on');
        mapDraw(true);
    } else {
        lightMode_onoff = "off";
        $('#lightMode').removeClass('on');
        mapDraw();
    }
});


document.getElementById('close_text_yososhindo').addEventListener("click",()=>{
    document.getElementById('text_yososhindo').classList.remove("display");
    scrollY = 0;
    clearInterval(scrollInterval);
    document.getElementById('btn_scroll_text_yososhindo').innerText = "ｽｸﾛｰﾙ開始";
    latestClickPref = "";
});

var scrollInterval;
var scrollY = 0;
document.getElementById('btn_scroll_text_yososhindo').addEventListener("click", ()=>{
    var table = document.querySelector('#table_text_yososhindo');
    var tbody = document.querySelector('#table_text_yososhindo tbody');
    if (document.getElementById('btn_scroll_text_yososhindo').innerText == "ｽｸﾛｰﾙ開始") {
        document.getElementById('btn_scroll_text_yososhindo').innerText = "ｽｸﾛｰﾙ停止";
        autoScroll_onoff = "on";
        scrollY = table.scrollTop;
        scrollInterval = setInterval(() => {
            table.scrollTop = scrollY + 1;
            scrollY += 1;
            
            if (scrollY > (tbody.scrollHeight-table.clientHeight+20)) {
                scrollY = 0;
                document.getElementById('btn_scroll_text_yososhindo').click();
            }
        }, 20);
    } else {
        clearInterval(scrollInterval);
        document.getElementById('btn_scroll_text_yososhindo').innerText = "ｽｸﾛｰﾙ開始";
        autoScroll_onoff = "off";
    }
});