var PointList;
var Tempre;

L.Map.mergeOptions({
    // @section Mousewheel options
    // @option smoothWheelZoom: Boolean|String = true
    // Whether the map can be zoomed by using the mouse wheel. If passed `'center'`,
    // it will zoom to the center of the view regardless of where the mouse was.
    smoothWheelZoom: true,

    // @option smoothWheelZoom: number = 1
    // setting zoom speed
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

function getName(x) {
    return x == 'temp' ? '現在の気温' :
           x == 'humidity' ? '現在の湿度' :
           x == 'snow' ? '現在の積雪深' :
           x == 'snow1h' ? '1時間降雪量' :
           x == 'snow3h' ? '3時間降雪量' :
           x == 'snow12h' ? '12時間降雪量' :
           x == 'snow24h' ? '24時間降雪量' :
           x == 'sun10m' ? '10分日照時間' :
           x == 'sun1h' ? '1時間日照時間' :
           x == 'precipitation10m' ? '10分降雨量' :
           x == 'precipitation1h' ? '1時間降雨量' :
           x == 'precipitation3h' ? '3時間降雨量' :
           x == 'precipitation24h' ? '24時間降雨量' :
           x == 'pressure' ? '現地気圧' :
           x == 'normalPressure' ? '海面更正気圧' :
           'データなし';
}
function getModeName(x) {
    return x == 'temp' ? '気温' :
           x == 'humidity' ? '湿度' :
           x == 'snow' ? '積雪深' :
           x == 'snow1h' ? '1時間降雪量' :
           x == 'snow3h' ? '3時間降雪量' :
           x == 'snow12h' ? '12時間降雪量' :
           x == 'snow24h' ? '24時間降雪量' :
           x == 'sun10m' ? '10分日照時間' :
           x == 'sun1h' ? '1時間日照時間' :
           x == 'precipitation10m' ? '10分間降雨量' :
           x == 'precipitation1h' ? '1時間降雨量' :
           x == 'precipitation3h' ? '3時間降雨量' :
           x == 'precipitation24h' ? '24時間降雨量' :
           x == 'pressure' ? '現地気圧' :
           x == 'normalPressure' ? '海面更正気圧' :
           '---';
}

function getHanreiNumber(x) {
    return x == 'temp' ? [35, 30, 25, 20 ,15, 10, 5, 0, -5, -10 ,-15] :
           x == 'humidity' ? [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0] :
           x == 'snow' ? [300, 250, 200, 150, 100, 75, 50 ,20, 10, 5, 0] :
           x == 'snow1h' ? [40, 30, 20, 15, 10, 5, 3, 2, 1, 0.1, 0] :
           x == 'snow3h' ? [100, 80, 60, 40, 30, 20, 10, 5, 2, 0.1, 0] :
           x == 'snow12h' ? [200, 150, 100, 60, 30, 20, 10, 5, 2, 0.1, 0] :
           x == 'snow24h' ? [400, 300, 200, 100, 50, 30, 10 ,5, 2, 0.1, 0] :
           x == 'sun10m' ? [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0] :
           x == 'sun1h' ? [60, 53, 47, 41, 35, 29, 23, 17, 11, 5, 0] :
           x == 'precipitation10m' ? [40, 30, 20, 15, 10, 5, 3, 2, 1, 0.1, 0] :
           x == 'precipitation1h' ? [100, 80, 60, 40, 30, 20, 10, 5, 2, 0.1, 0] :
           x == 'precipitation3h' ? [200, 150, 100, 60, 30, 20, 10, 5, 2, 0.1, 0] :
           x == 'precipitation24h' ? [400, 300, 200, 100, 50, 30, 10 ,5, 2, 0.1, 0] :
           x == 'pressure' ? [1030, 1025, 1020, 1015, 1010, 1005, 1000, 995, 990, 980, 950] :
           x == 'normalPressure' ?  [1020, 1015, 1012, 1010, 1008, 1006, 1004, 1002, 1000, 990, 950]:
           '---';
}

function getUnit(x) {
    return x == 'temp' ? '℃' :
           x == 'humidity' ? '%' :
           x == 'snow' ? 'cm' :
           x == 'snow1h' ? 'cm' :
           x == 'snow3h' ? 'cm' :
           x == 'snow12h' ? 'cm' :
           x == 'snow24h' ? 'cm' :
           x == 'sun10m' ? '分' :
           x == 'sun1h' ? '分' :
           x == 'precipitation10m' ? 'mm' :
           x == 'precipitation1h' ? 'mm' :
           x == 'precipitation3h' ? 'mm' :
           x == 'precipitation24h' ? 'mm' :
           x == 'pressure' ? 'hPa' :
           x == 'normalPressure' ? 'hPa' :
           '';
}

function getColor_temp(d) {
    return d >= 35 ? '#CC00FF' :
            d >= 30  ? '#FF0000' :
            d >= 25  ? '#FF8800' :
            d >= 20  ? '#D9E100' :
            d >= 15   ? '#44dd00' :
            d >= 10   ? '#007700' :
            d >= 5   ? '#00aadd' :
            d >= 0   ? '#002AFF' :
            d >= -5   ? '#002080' :
            d >= -10   ? '#999999' :
            d >= -15   ? '#595959' :
                        '#000000';
}
function getColor_humidity(d) {
    return d >= 100 ? '#dd0088' :
            d >= 90 ? '#CC00FF' :
            d >= 80  ? '#FF0000' :
            d >= 70  ? '#FF8800' :
            d >= 60  ? '#D9E100' :
            d >= 50   ? '#44dd00' :
            d >= 40   ? '#007700' :
            d >= 30   ? '#00aadd' :
            d >= 20   ? '#002AFF' :
            d >= 10   ? '#002080' :
            d >= 0   ? '#838383' :
            d >= -15   ? '#000000' :
                        '#00000000';
}
function getColor_snow(d) {
    return d >= 300 ? '#CC00FF' :
            d >= 250  ? '#FF0000' :
            d >= 200  ? '#FF8800' :
            d >= 150  ? '#D9E100' :
            d >= 100   ? '#44dd00' :
            d >= 75   ? '#007700' :
            d >= 50   ? '#00aadd' :
            d >= 20   ? '#002AFF' :
            d >= 10   ? '#002080' :
            d >= 5   ? '#838383' :
            d >= 0   ? '#83838399' :
            d >= -15   ? '#00000000' :
                        '#00000000';
}
function getColor_pressure(d) {
    return d >= 1030 ? '#CC00FF' :
            d >= 1025 ? '#FF0000' :
            d >= 1020  ? '#FF8800' :
            d >= 1015  ? '#D9E100' :
            d >= 1010  ? '#44dd00' :
            d >= 1005   ? '#007700' :
            d >= 1000   ? '#00aadd' :
            d >= 995   ? '#002AFF' :
            d >= 990   ? '#002080' :
            d >= 980   ? '#999999' :
            d >= 950   ? '#595959' :
            d >= -15   ? '#000000' :
                        '#00000000';
}
function getColor_normalPressure(d) {
    return d >= 1020 ? '#CC00FF' :
            d >= 1015 ? '#FF0000' :
            d >= 1012  ? '#FF8800' :
            d >= 1010  ? '#D9E100' :
            d >= 1008  ? '#44dd00' :
            d >= 1006   ? '#007700' :
            d >= 1004   ? '#00aadd' :
            d >= 1002   ? '#002AFF' :
            d >= 1000   ? '#002080' :
            d >= 990   ? '#999999' :
            d >= 950   ? '#595959' :
            d >= -15   ? '#000000' :
                        '#00000000';
}
function getColor_sun10m(d) {
    return d >= 10 ? '#dd0088' :
            d >= 9 ? '#CC00FF' :
            d >= 8  ? '#FF0000' :
            d >= 7  ? '#FF8800' :
            d >= 6  ? '#D9E100' :
            d >= 5   ? '#44dd00' :
            d >= 4   ? '#007700' :
            d >= 3   ? '#00aadd' :
            d >= 2   ? '#002AFF' :
            d >= 1   ? '#002080' :
            d > 0   ? '#838383' :
            d >= -15   ? '#83838300' :
                        '#00000000';
}
function getColor_sun1h(d) {
    return d >= 60 ? '#dd0088' :
            d >= 53 ? '#CC00FF' :
            d >= 47  ? '#FF0000' :
            d >= 41  ? '#FF8800' :
            d >= 35  ? '#D9E100' :
            d >= 29   ? '#44dd00' :
            d >= 23   ? '#007700' :
            d >= 17   ? '#00aadd' :
            d >= 11   ? '#002AFF' :
            d >= 5  ? '#002080' :
            d > 0   ? '#838383' :
            d >= -15   ? '#83838300' :
                        '#00000000';
}
function getColor_precipitation10m(d) {
    return d >= 40 ? '#CC00FF' :
            d >= 30  ? '#FF0000' :
            d >= 20  ? '#FF8800' :
            d >= 15  ? '#D9E100' :
            d >= 10   ? '#44dd00' :
            d >= 5   ? '#007700' :
            d >= 3   ? '#00aadd' :
            d >= 2   ? '#002AFF' :
            d >= 1  ? '#002080' :
            d > 0   ? '#838383' :
            d >= -15   ? '#83838300' :
                        '#00000000';
}
function getColor_precipitation1h(d) {
    return d >= 100 ? '#CC00FF' :
            d >= 80  ? '#FF0000' :
            d >= 60  ? '#FF8800' :
            d >= 40  ? '#D9E100' :
            d >= 30   ? '#44dd00' :
            d >= 20   ? '#007700' :
            d >= 10   ? '#00aadd' :
            d >= 5   ? '#002AFF' :
            d >= 2  ? '#002080' :
            d > 0   ? '#838383' :
            d >= -15   ? '#83838300' :
                        '#00000000';
}
function getColor_precipitation3h(d) {
    return d >= 200 ? '#CC00FF' :
            d >= 150  ? '#FF0000' :
            d >= 100  ? '#FF8800' :
            d >= 60  ? '#D9E100' :
            d >= 30   ? '#44dd00' :
            d >= 20   ? '#007700' :
            d >= 10   ? '#00aadd' :
            d >= 5   ? '#002AFF' :
            d >= 2  ? '#002080' :
            d > 0   ? '#838383' :
            d >= -15   ? '#83838300' :
                        '#00000000';
}
function getColor_precipitation24h(d) {
    return d >= 400 ? '#CC00FF' :
            d >= 300  ? '#FF0000' :
            d >= 200  ? '#FF8800' :
            d >= 100  ? '#D9E100' :
            d >= 50   ? '#44dd00' :
            d >= 30   ? '#007700' :
            d >= 10   ? '#00aadd' :
            d >= 5   ? '#002AFF' :
            d >= 2  ? '#002080' :
            d > 0   ? '#838383' :
            d >= -15   ? '#83838300' :
                        '#00000000';
}

function getColor_snow1h(d) {
    return d >= 40 ? '#CC00FF' :
            d >= 30  ? '#FF0000' :
            d >= 20  ? '#FF8800' :
            d >= 15  ? '#D9E100' :
            d >= 10   ? '#44dd00' :
            d >= 5   ? '#007700' :
            d >= 3   ? '#00aadd' :
            d >= 2   ? '#002AFF' :
            d >= 1  ? '#002080' :
            d > 0   ? '#838383' :
            d >= -15   ? '#83838300' :
                        '#00000000';
}
function getColor_snow3h(d) {
    return d >= 100 ? '#CC00FF' :
            d >= 80  ? '#FF0000' :
            d >= 60  ? '#FF8800' :
            d >= 40  ? '#D9E100' :
            d >= 30   ? '#44dd00' :
            d >= 20   ? '#007700' :
            d >= 10   ? '#00aadd' :
            d >= 5   ? '#002AFF' :
            d >= 2  ? '#002080' :
            d > 0   ? '#838383' :
            d >= -15   ? '#83838300' :
                        '#00000000';
}
function getColor_snow12h(d) {
    return d >= 200 ? '#CC00FF' :
            d >= 150  ? '#FF0000' :
            d >= 100  ? '#FF8800' :
            d >= 60  ? '#D9E100' :
            d >= 30   ? '#44dd00' :
            d >= 20   ? '#007700' :
            d >= 10   ? '#00aadd' :
            d >= 5   ? '#002AFF' :
            d >= 2  ? '#002080' :
            d > 0   ? '#838383' :
            d >= -15   ? '#83838300' :
                        '#00000000';
}
function getColor_snow24h(d) {
    return d >= 400 ? '#CC00FF' :
            d >= 300  ? '#FF0000' :
            d >= 200  ? '#FF8800' :
            d >= 100  ? '#D9E100' :
            d >= 50   ? '#44dd00' :
            d >= 30   ? '#007700' :
            d >= 10   ? '#00aadd' :
            d >= 5   ? '#002AFF' :
            d >= 2  ? '#002080' :
            d > 0   ? '#838383' :
            d >= -15   ? '#83838300' :
                        '#00000000';
}

L.Map.addInitHook('addHandler', 'smoothWheelZoom', L.Map.SmoothWheelZoom );

var map = L.map('map', {
    zoomSnap: 0,
    center: [37.575, 137.984],
    zoom: 5.6,
    minZoom: 4,
    scrollWheelZoom: false,
    smoothWheelZoom: true,
    smoothSensitivity: 1
});
//L.control.scale({maxWidth:150,position:'bottomright',imperial:false}).addTo(map);  // スケールを表示
map.zoomControl.setPosition('topright');

map.createPane("pane_map").style.zIndex = 1;
map.createPane("nowcast").style.zIndex = 10;
map.createPane("pane_map_2").style.zIndex = 50;
map.createPane("important").style.zIndex = 70;
map.createPane("amedas").style.zIndex = 100;
var mapdata;
      let border; //市区町界
            $.getJSON("https://miyakocam.github.io/geojsons/pref.geojson",function(data) {
                mapdata = data;
                border = L.geoJson(data,{
                    pane: "pane_map",
                    style: {
                    "color": "#333533",
                    "weight": 0.7,
                    "opacity": 1,
                    "fillColor": "#ffffff",
                    "fillOpacity": 1,
                    }
                }).addTo(map);
                let border_2; //市区町界        
                border_2 = L.geoJson(mapdata,{
                    pane: "pane_map_2",
                    style: {
                    "color": "#333533",
                    "weight": 1,
                    "opacity": 1,
                    "fillOpacity": 0,
                    }
                }).addTo(map);
            });
      

//L.tileLayer('https://tile.weathernews.jp/3/tile/rad_anl/2023/04/19/2023-04-19-14-00_Tiles_999999999999/{z}_{x}_{y}.png', {pane: "pane_map",opacity: 0.8}).addTo(map);

var PointList;
var latestTime;
var tempJson;
var lowtempList = [];
var hightempList = [];
Cookies.remove('latesttemp');

var amedas = L.layerGroup();
var nowcast = L.layerGroup();

async function PointList_get() {
    const url = "amedastable.json";
    const response = await fetch(url)
        .then(response => response.json())
        .then(response => {
            PointList = response;
            TempInfo_get()
        });
}
var param = "temp";
var already;
var displayDate;
var nowcastDate;
var graphDate
function TempInfo_get() {
    already = false;
    $.get("https://www.jma.go.jp/bosai/amedas/data/latest_time.txt", function(data){
        latestTime = data;
        nowcastDate = new Date(data.substring(0,19));
        graphDate = new Date(data.substring(0,19));
        displayDate = new Date(data.substring(0,19));
        nowcastDate.setHours(nowcastDate.getHours() - 9);
        
        if (param == "snow" || param == "snow1h" || param == "snow6h" || param == "snow12h" || param == "snow24h") {
            latestTime = latestTime.substring(0, 4)+ latestTime.substring(5, 7)+ latestTime.substring(8,10)+ latestTime.substring(11,13)+ '0000';
        } else {
            latestTime = latestTime.substring(0, 4)+ latestTime.substring(5, 7)+ latestTime.substring(8,10)+ latestTime.substring(11,13)+ latestTime.substring(14,16)+ latestTime.substring(17,19);
        }
        document.getElementById('title_text').innerText = getName(param);
        document.getElementById('title_time').innerHTML = latestTime.substring(4,6)+'<span class="small">月</span>'+latestTime.substring(6,8)+'<span class="small">日</span> '+latestTime.substring(8,10)+'<span class="small">時</span>'+latestTime.substring(10,12)+'<span class="small">分</span>現在';
        
        console.log(latestTime+".json を取得中です…。");
        (async() => {
            const url = "https://www.jma.go.jp/bosai/amedas/data/map/"+latestTime+".json";
            const response = await fetch(url)
                .then(response => response.json())
                .then(response => {
                    tempJson = response;
                    mapDraw(param, true);
                });
        })();
    });   
}
PointList_get();

var unit;
var nowcast_basemap;

// setInterval(() => {
//     TempInfo_get();
// }, 120000);

function mapDraw(param_mapDraw, redrawNowcast) {
    document.getElementById('title_text').innerText = getName(param_mapDraw);
    //if (amedas) {
        map.removeLayer(amedas);
        amedas = L.layerGroup();
        
    //}
    if (redrawNowcast != "") {
        map.removeLayer(nowcast);
        nowcast = L.layerGroup();
        let nowcastyear = nowcastDate.getFullYear();
        let nowcastmonth = ('0' + (nowcastDate.getMonth() + 1)).slice(-2);
        let nowcastday = ('0' + nowcastDate.getDate()).slice(-2);
        let nowcasthour = ('0' + nowcastDate.getHours()).slice(-2);
        let nowcastminute = ('0' + nowcastDate.getMinutes()).slice(-2);
        let nowcastGetTime = "" + nowcastyear + nowcastmonth + nowcastday + nowcasthour + nowcastminute + "00"

        let nowcast_url = "https://www.jma.go.jp/bosai/jmatile/data/nowc/"+nowcastGetTime+"/none/"+nowcastGetTime+"/surf/hrpns/{z}/{x}/{y}.png"

        nowcast_basemap = L.tileLayer(nowcast_url, {opacity: 0.5,pane:"nowcast",attribution: "<a href='https://www.jma.go.jp/bosai/nowc' target='_blank'>気象庁</a>"})
        if (document.getElementById('amagumo_settings_range_span').innerText != "0.50") {
            let opacity = document.getElementById('amagumo_settings_range_span').innerText;
            nowcast_basemap["options"]["opacity"] = opacity;
        }
        
        nowcast.addLayer(nowcast_basemap);
        if (document.getElementById('amagumo_settings_checkbox').checked) {
            nowcast.addTo(map);
        }
    }

    param = param_mapDraw;

    document.title = getName(param_mapDraw) + " アメダス天気Viewer for MiyakoCam"
    
    lowtempList = [];
    hightempList = [];

    let hanreiNumberList = getHanreiNumber(param_mapDraw);
    let hanreiNumberListLength = hanreiNumberList.length + 1;
    for (let i = 1; i <= hanreiNumberListLength; i++) {
        if (i == hanreiNumberListLength) {
                eval("document.getElementById('hanrei_td"+i+"_1').style.color = getColor_"+param_mapDraw+"("+((hanreiNumberList[i-2])-0.1)+");");
        } else {
            eval("document.getElementById('hanrei_td"+i+"_1').style.color = getColor_"+param_mapDraw+"("+hanreiNumberList[i-1]+");");
        }
    }
    for (let a = 1; a <= hanreiNumberListLength; a++) {
        if (param_mapDraw == "temp" || param_mapDraw.indexOf('ressure') !== -1) {
            if (a == 1) { //最初は100～とするため。
                eval("document.getElementById('hanrei_td"+a+"_2').innerText = "+hanreiNumberList[a-1]);
                eval("document.getElementById('hanrei_td"+a+"_4').innerText = ''");
            } else if (a == hanreiNumberListLength) { //最後は～-10とするため。
                eval("document.getElementById('hanrei_td"+a+"_2').innerText = ''");
                eval("document.getElementById('hanrei_td"+a+"_4').innerText = "+hanreiNumberList[a-2]);
            } else {
                eval("document.getElementById('hanrei_td"+a+"_2').innerText = "+hanreiNumberList[a-1]);
                eval("document.getElementById('hanrei_td"+a+"_4').innerText = "+hanreiNumberList[a-2]);
            }
        } else {
            if (a == 1) { //最初は100～とするため。
                eval("document.getElementById('hanrei_td"+a+"_2').innerText = "+hanreiNumberList[a-1]);
                eval("document.getElementById('hanrei_td"+a+"_4').innerText = ''");
            } else if (a == hanreiNumberListLength) { //最後は0～10とするため。
                
            } else {
                eval("document.getElementById('hanrei_td"+a+"_2').innerText = "+hanreiNumberList[a-1]);
                eval("document.getElementById('hanrei_td"+a+"_4').innerText = "+hanreiNumberList[a-2]);
            }
        }
    }
    if (param_mapDraw == "temp" || param_mapDraw.indexOf('ressure') !== -1) {
        document.getElementById('hanrei_td11').style.display = "table-row";
        document.getElementById('hanrei_td12').style.display = "table-row";
    } else if (hanreiNumberListLength == 12) {
        document.getElementById('hanrei_td11').style.display = "table-row";
        document.getElementById('hanrei_td12').style.display = "none";
    } else {
        document.getElementById('hanrei_td11').style.display = "none";
        document.getElementById('hanrei_td12').style.display = "none";
    }

    Object.entries(PointList).forEach(element => {
        
        unit = getUnit(param_mapDraw);
        if (element[0] in tempJson) {
            if (param_mapDraw in tempJson[element[0]]) {
                if (tempJson[element[0]][param_mapDraw][0] != null) {
                    if (param_mapDraw == "sun1h" && already == false) {tempJson[element[0]][param_mapDraw][0] = tempJson[element[0]][param_mapDraw][0] * 60;}
                    if (param_mapDraw == "temp" || param_mapDraw == "pressure" || param_mapDraw == "normalPressure") {tempJson[element[0]][param_mapDraw][0] = Number(tempJson[element[0]][param_mapDraw][0]).toFixed(1);}
                    var amedas_latlng = new L.LatLng((element[1]["lat"][0] + element[1]["lat"][1]/60) , (element[1]["lon"][0] + element[1]["lon"][1]/60));
                    eval("circle"+element[0]+" = L.circle(amedas_latlng, {pane: \"amedas\", radius:6000, weight: 3,opacity:1,popupAnchor: [0,-50],fillColor: getColor_"+param_mapDraw+"(tempJson[element[0]][param_mapDraw][0]),fillOpacity:0.3,color:getColor_"+param_mapDraw+"(tempJson[element[0]][param_mapDraw][0])});");
                    eval("circle"+element[0]+".bindTooltip('<ruby>'+element[1]['kjName'] + '<rt>' + element[1]['knName'] + '</rt></ruby>　'+tempJson[element[0]][param_mapDraw][0]+unit,{direction: 'auto', permanent: false, sticky: false,});");
                    eval("circle"+element[0]+".on('click', function(e) { createGraph("+element[0]+", e);})");
                    eval("circle"+element[0]+".kjName = element[1]['kjName']");
                    eval("circle"+element[0]+".knName = element[1]['knName']");
                    eval("circle"+element[0]+".temp = tempJson[element[0]][param_mapDraw][0]");
                    eval("circle"+element[0]+".tempUnit = tempJson[element[0]][param_mapDraw][0]+unit");
                    eval("amedas.addLayer(circle"+element[0]+");");
                    
                    //if (param_mapDraw == "temp") {
                        if (! Cookies.get('i')) {
                            Cookies.set('i',0);
                            var i = 0;
                        }
                        var i = Cookies.get('i');
                        eval('lowtempList['+i+'] = {};');
                        eval('lowtempList['+i+']["key"] = "'+element[0]+'";');
                        eval('lowtempList['+i+']["name"] = "'+element[1]["kjName"]+'";');
                        eval('lowtempList['+i+']["name_kana"] = "'+element[1]["knName"]+'";');
                        eval('lowtempList['+i+']["temp"] = "'+tempJson[element[0]][param][0]+'";');
                        eval('hightempList['+i+'] = {};');
                        eval('hightempList['+i+']["key"] = "'+element[0]+'";');
                        eval('hightempList['+i+']["name"] = "'+element[1]["kjName"]+'";');
                        eval('hightempList['+i+']["name_kana"] = "'+element[1]["knName"]+'";');
                        eval('hightempList['+i+']["temp"] = "'+tempJson[element[0]][param][0]+'";');
                        i++;
                        Cookies.set('i',i);
                    //}
                }
            }
        }
    });
    //if (param == "temp") {
    Cookies.remove('i');
    lowtempList.sort((x, y) => x.temp - y.temp);
    hightempList.sort((x, y) => y.temp - x.temp);
    //}
    if (document.getElementById('amagumo_settings_checkbox_amedas').checked){
        map.addLayer(amedas);
    }
    
    if (param_mapDraw == "sun1h") {already = true;}
}



function getParam(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}


function modeChange(e) {
    const mode = e.currentTarget.dataset.mode;
    param = mode;
    if (param == "snow" || param == "snow1h" || param == "snow6h" || param == "snow12h" || param == "snow24h") {
        TempInfo_get();
    } else {
        mapDraw(mode);
    }
}

function ranking_create(type) {
    document.getElementById('table_datetime').innerText = latestTime.substring(4,6)+"月"+latestTime.substring(6,8)+"日 "+latestTime.substring(8,10)+":"+latestTime.substring(10,12)+"現在";
    document.getElementById('table_title').innerText = getModeName(param)+"ランキング トップ--";
    Cookies.remove('latesttemp');
    if (type == 'low') {
        let i = 0;
        let itemCount = 0;
        let all0 = false;
        for (let a = 0; a < 16; a++) {
            if (i == (lowtempList.length)) {
                if (a == 0) {
                    all0 = true;
                }
                    document.getElementById('num'+(a+1)).innerHTML = '　';
                    document.getElementById('name'+(a+1)).innerHTML = '<ruby>　<rt>　</rt></ruby>';
                    document.getElementById('temp'+(a+1)).innerHTML = '　';
            }else {
                if (lowtempList[i]["temp"] == 0 && param != "temp") {
                    a--;
                    document.getElementById('table_title').innerText = "低"+getModeName(param)+"ランキング トップ"+itemCount;
                }else {
                    itemCount++;
                    if (lowtempList[i]["temp"] == Cookies.get('latesttemp')) {
                        document.getElementById('num'+(a+1)).innerHTML = document.getElementById('num'+a).innerText;
                        itemCount--;
                    } else if (a == 0) {
                        document.getElementById('num'+(a+1)).innerHTML = 1;
                    } else {
                        document.getElementById('num'+(a+1)).innerHTML = Number(document.getElementById('num'+a).innerText)+1;
                    }
                    document.getElementById('table_title').innerText = "低"+getModeName(param)+"ランキング トップ"+itemCount;
                    document.getElementById('name'+(a+1)).innerHTML = '<ruby>'+lowtempList[i]["name"]+'<rt>'+lowtempList[i]["name_kana"]+'</rt></ruby>';
                    document.getElementById('temp'+(a+1)).innerHTML = lowtempList[i]["temp"]+unit;
                    document.getElementById('name'+(a+1)).setAttribute("onclick", "clickRankingName(event)");
                    document.getElementById('temp'+(a+1)).setAttribute("onclick", "clickRankingName(event)");
                    document.getElementById('name'+(a+1)).setAttribute("data-key", lowtempList[i]["key"]);
                    document.getElementById('temp'+(a+1)).setAttribute("data-key", lowtempList[i]["key"]);
                    Cookies.set('latesttemp',lowtempList[i]["temp"]);
                }
                i++;
            }
        }
        if (all0 == true) {
            document.getElementById('num1').innerHTML = 0;
            document.getElementById('name1').innerHTML = "データがありません。"
        }
    } else if (type == 'high') {
        let i = 0;
        let itemCount = 0;
        let all0 = false;
        for (let a = 0; a < 16; a++) {
            if (i == (hightempList.length)) {
                if (a == 0) {
                    all0 = true;
                }
                document.getElementById('num'+(a+1)).innerHTML = '　';
                document.getElementById('name'+(a+1)).innerHTML = '<ruby>　<rt>　</rt></ruby>';
                document.getElementById('temp'+(a+1)).innerHTML = '　';
                
            }else {
                if (hightempList[i]["temp"] == 0 && param != "temp") {
                    a--;
                    document.getElementById('table_title').innerText = "高"+getModeName(param)+"ランキング トップ"+itemCount;
                }else {
                    itemCount++;
                    if (hightempList[i]["temp"] == Cookies.get('latesttemp')) {
                        document.getElementById('num'+(a+1)).innerHTML = document.getElementById('num'+a).innerText;
                        itemCount--;
                    } else if (a == 0) {
                        document.getElementById('num'+(a+1)).innerHTML = 1;
                    } else {
                        document.getElementById('num'+(a+1)).innerHTML = Number(document.getElementById('num'+a).innerText)+1;
                    }
                    document.getElementById('table_title').innerText = "高"+getModeName(param)+"ランキング トップ"+itemCount;
                    document.getElementById('name'+(a+1)).innerHTML = '<ruby>'+hightempList[i]["name"]+'<rt>'+hightempList[i]["name_kana"]+'</rt></ruby>';
                    document.getElementById('temp'+(a+1)).innerHTML = hightempList[i]["temp"]+unit;
                    document.getElementById('name'+(a+1)).setAttribute("onclick", "clickRankingName(event)");
                    document.getElementById('temp'+(a+1)).setAttribute("onclick", "clickRankingName(event)");
                    document.getElementById('name'+(a+1)).setAttribute("data-key", hightempList[i]["key"]);
                    document.getElementById('temp'+(a+1)).setAttribute("data-key", hightempList[i]["key"]);
                    Cookies.set('latesttemp',hightempList[i]["temp"]);
                }
                i++;
            }
        }
        if (all0 == true) {
            document.getElementById('num1').innerHTML = 0;
            document.getElementById('name1').innerHTML = "データがありません。"
        }
    }
}

var YesAllData = {};
var ToAllData = {};
var ToAllDatalength = 0;
var AllData = {};

function createGraph(stationID, e) {
    console.log('createGraph('+stationID+', '+e.target.kjName+'('+e.target.knName+')'+')');
    YesAllData = {};
    ToAllData = {};
    ToAllDatalength = 0;
    AllData = {};
    var isToDataGetFinish = false;
    var isYesDataGetFinish = false;
    var xisTooltipDisplay = false;
    document.getElementById('tempChartBacktooltip').classList.add("on");

    document.getElementById('tempChartBackreload').addEventListener("click",()=>{
        createGraph(stationID, e);
        return;
    });
    document.getElementById('tempChartBacktooltip').addEventListener("click",()=>{
        if (xisTooltipDisplay == false) {
            xisTooltipDisplay = true;
            document.getElementById('tempChartBacktooltip').classList.remove("on");
        } else {
            xisTooltipDisplay = false;
            document.getElementById('tempChartBacktooltip').classList.add("on");
        }
        AllDataContinue(true, true);
    });
    
    var year = graphDate.getFullYear();
    var month = ('0' + (graphDate.getMonth() + 1)).slice(-2);
    var date = ('0' + graphDate.getDate()).slice(-2);
    var hour = ('0' + graphDate.getHours()).slice(-2);
    var minute = ('0' + graphDate.getMinutes()).slice(-2);
    getTodayData(stationID, year, month, date, hour, minute);

    graphDate.setDate(graphDate.getDate() - 1);
    month = ('0' + (graphDate.getMonth() + 1)).slice(-2);
    date = ('0' + graphDate.getDate()).slice(-2);
    getYesterdayData(stationID, year, month, date);
    graphDate.setDate(graphDate.getDate() + 1);

    document.getElementById('tempChartWait').classList.add('display');
    
    function ToAllDataWait(last) {
        if (last == "last") {
            setTimeout(() => {
                console.log("Todaygetdata successful.");
                // console.log(ToAllData);
                isToDataGetFinish = true;
                AllDataContinue(isToDataGetFinish, isYesDataGetFinish);
            }, 300); 
        } else {
            setTimeout(() => {
                if (Object.keys(ToAllData).length == ToAllDatalength) {
                    ToAllDataWait("last");
                } else {
                    ToAllDataWait();
                    // console.log(ToAllData);
                }
            }, 300);  
        }
    }
    ToAllDataWait();

    function YesAllDataWait(last) {
        if (last == "last") {
            setTimeout(() => {
                console.log("Yesterdaygetdata successful.");
                // console.log(YesAllData);
                isYesDataGetFinish = true;
                AllDataContinue(isToDataGetFinish, isYesDataGetFinish);
            }, 300); 
        } else {
            setTimeout(() => {
                if (Object.keys(YesAllData).length == 144) {
                    YesAllDataWait("last");
                } else {
                    YesAllDataWait();
                    // console.log(YesAllData);
                }
            }, 300);  
        }
    }
    YesAllDataWait();
    
    function AllDataContinue(To, Yes) {
    if (To != true || Yes != true) {return;}
    document.getElementById('tempChartWait').classList.remove('display');
    var ToTempData = [];
    var YesTempData = [];
    var ToTempHigh = -100000;
    var ToTempHighArr;
    var ToTempLow = 100000;
    var ToTempLowArr;
    var YesTempHigh = -100000;
    var YesTempHighArr;
    var YesTempLow = 100000;
    var YesTempLowArr;
    var keys = ["0000", "0010", "0020", "0030", "0040", "0050", "0100", "0110", "0120", "0130", "0140", "0150", "0200", "0210", "0220", "0230", "0240", "0250", 
    "0300", "0310", "0320", "0330", "0340", "0350", "0400", "0410", "0420", "0430", "0440", "0450", "0500", "0510", "0520", "0530", "0540", "0550", 
    "0600", "0610", "0620", "0630", "0640", "0650", "0700", "0710", "0720", "0730", "0740", "0750", "0800", "0810", "0820", "0830", "0840", "0850", 
    "0900", "0910", "0920", "0930", "0940", "0950", "1000", "1010", "1020", "1030", "1040", "1050", "1100", "1110", "1120", "1130", "1140", "1150", 
    "1200", "1210", "1220", "1230", "1240", "1250", "1300", "1310", "1320", "1330", "1340", "1350", "1400", "1410", "1420", "1430", "1440", "1450", 
    "1500", "1510", "1520", "1530", "1540", "1550", "1600", "1610", "1620", "1630", "1640", "1650", "1700", "1710", "1720", "1730", "1740", "1750", 
    "1800", "1810", "1820", "1830", "1840", "1850", "1900", "1910", "1920", "1930", "1940", "1950", "2000", "2010", "2020", "2030", "2040", "2050", 
    "2100", "2110", "2120", "2130", "2140", "2150", "2200", "2210", "2220", "2230", "2240", "2250", "2300", "2310", "2320", "2330", "2340", "2350"];
    for (let i = 0; i < ToAllDatalength; i++) {
        if (ToAllData[keys[i]]) {
            if (ToAllData[keys[i]][param]) {
                ToTempData.push(ToAllData[keys[i]][param][0]);
                if (ToAllData[keys[i]][param][0] >= ToTempHigh) {
                    ToTempHigh = ToAllData[keys[i]][param][0];
                    ToTempHighArr = keys[i];
                }
                if (ToAllData[keys[i]][param][0] <= ToTempLow) {
                    ToTempLow = ToAllData[keys[i]][param][0];
                    ToTempLowArr = keys[i];
                }
            } else {
                ToTempData.push(null);
            }
        } else {
            ToTempData.push(null);
        }
    }

    let yesI = 0;
    keys.forEach(element => {
        if (YesAllData[element]) {
            if (YesAllData[element][param]) {
                YesTempData.push(YesAllData[element][param][0]);
                if (YesAllData[element][param][0] >= YesTempHigh) {
                    YesTempHigh = YesAllData[element][param][0];
                    YesTempHighArr = keys[yesI];
                }
                if (YesAllData[element][param][0] <= YesTempLow) {
                    YesTempLow = YesAllData[element][param][0];
                    YesTempLowArr = keys[yesI];
                }
            } else {
                YesTempData.push(null);
            }
        } else {
            YesTempData.push(null);
        }
        yesI++;
    });

    document.getElementById('tempChartStaName').innerHTML = '<ruby>'+e.target.kjName+'<rt>'+e.target.knName+'</rt></ruby>';
    document.getElementById('tempChartLowHighTable').innerHTML = '<tr><td>最高</td><td>'+ToTempHighArr.substring(0,2)+":"+ToTempHighArr.substring(2,4)+'</td><td>'+ToTempHigh.toFixed(1)+getUnit(param)+'</td></tr><tr><td>最低</td><td>'+ToTempLowArr.substring(0,2)+":"+ToTempLowArr.substring(2,4)+'</td><td>'+ToTempLow.toFixed(1)+getUnit(param)+'</td></tr>';
    document.getElementById('tempChartStaTemp').innerText = '現在：'+e.target.tempUnit;

    if (typeof myChart !== "undefined") {
        myChart.destroy();
    }
    console.log(e.target.kjName+"("+e.target.knName+")"+stationID);
    document.getElementById('tempChartBack').classList.add("display");
    var ctx = document.getElementById('tempChart');
    var labels_data;
    // if (param == "snow" || param == "snow1h" || param == "snow6h" || param == "snow12h" || param == "snow24h") {
    //     labels_data = ["00:00", "01:00", "02:00", "03:00","04:00", "05:00", "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
    //      "13:00", "14:00", "15:00", "16:00", "17:00", "18:00" ,"19:00", "20:00", "21:00" , "22:00", "23:00"]
    // } else {
        labels_data = ["00:00", "00:10", "00:20", "00:30", "00:40", "00:50", "01:00", "01:10", "01:20", "01:30", "01:40", "01:50", 
        "02:00", "02:10", "02:20", "02:30", "02:40", "02:50", "03:00", "03:10", "03:20", "03:30", "03:40", "03:50", 
        "04:00", "04:10", "04:20", "04:30", "04:40", "04:50", "05:00", "05:10", "05:20", "05:30", "05:40", "05:50", 
        "06:00", "06:10", "06:20", "06:30", "06:40", "06:50", "07:00", "07:10", "07:20", "07:30", "07:40", "07:50", 
        "08:00", "08:10", "08:20", "08:30", "08:40", "08:50", "09:00", "09:10", "09:20", "09:30", "09:40", "09:50", 
        "10:00", "10:10", "10:20", "10:30", "10:40", "10:50", "11:00", "11:10", "11:20", "11:30", "11:40", "11:50", 
        "12:00", "12:10", "12:20", "12:30", "12:40", "12:50", "13:00", "13:10", "13:20", "13:30", "13:40", "13:50", 
        "14:00", "14:10", "14:20", "14:30", "14:40", "14:50", "15:00", "15:10", "15:20", "15:30", "15:40", "15:50", 
        "16:00", "16:10", "16:20", "16:30", "16:40", "16:50", "17:00", "17:10", "17:20", "17:30", "17:40", "17:50", 
        "18:00", "18:10", "18:20", "18:30", "18:40", "18:50", "19:00", "19:10", "19:20", "19:30", "19:40", "19:50", 
        "20:00", "20:10", "20:20", "20:30", "20:40", "20:50", "21:00", "21:10", "21:20", "21:30", "21:40", "21:50", 
        "22:00", "22:10", "22:20", "22:30", "22:40", "22:50", "23:00", "23:10", "23:20", "23:30", "23:40", "23:50"];
    // }
    var data = {
        labels: labels_data,
        datasets: [{
            label: '今日の'+getModeName(param),
            data: ToTempData,
            lineTension: 0.1,
            borderColor: "#ffff55",
            order: 1,
            borderWidth: 5
        }, {
            label: '昨日の'+getModeName(param),
            data: YesTempData,
            lineTension: 0.1,
            borderColor: "#ffffff",
            borderDash: [8,4],
            order: 2,
            borderWidth: 3
        }]
    };
    var options = {
        responsive: true,
        maintainAspectRatio: false,
        pointRadius: 0,
        pointHitRadius: 5,
        pointhoverBorderWidth: 0,
        pointHoverRadius: 0,
        plugins: {
            title: {
                display: true,
                color: "white",
                font: {size: 20,family: "'ヒラギノ角ゴ-Pro','Noto Sans JP'",weight: "500"},
                padding: 10,
                text: getModeName(param)+"の10分ごとの推移"
            },
            legend: {
                position: "bottom",
                labels: {
                    boxWidth: 16,
                    boxHeight: 16,
                    color: "white",
                    font: {
                        size: 18,
                        family: "'ヒラギノ角ゴ-Pro','Noto Sans JP'",weight: "500"
                    }
                }
            },
            tooltip: {
                mode: "index",
                intersect: xisTooltipDisplay,
                titleFont: {size: 18,family: "'ヒラギノ角ゴ-Pro','Noto Sans JP'",weight: "600"},
                bodyFont: {size: 16,family: "'ヒラギノ角ゴ-Pro','Noto Sans JP'",weight: "500"},
                cornerRadius: 0,
                displayColors: true,
                boxPadding: 5,
                multiKeyBackground: '#00000000',
                caretSize: 0
            },
            annotation: {
                annotations: {
                    time0jiku: {
                        type: 'line',
                        xMin: "00:00",
                        xMax: "00:00",
                        borderColor: '#ffffff',
                        borderWidth: 2,
                    },
                    time23jiku: {
                        type: 'line',
                        xMin: "23:50",
                        xMax: "23:50",
                        borderColor: '#ffffff',
                        borderWidth: 2,
                    },
                    TodayHigh: {
                        type: 'line',
                        xMin: ToTempHighArr.substring(0,2)+":"+ToTempHighArr.substring(2,4),
                        xMax: ToTempHighArr.substring(0,2)+":"+ToTempHighArr.substring(2,4),
                        borderColor: '#ff5555',
                        borderWidth: 2,
                        z: 2
                    },
                    TodayLow: {
                        type: 'line',
                        xMin: ToTempLowArr.substring(0,2)+":"+ToTempLowArr.substring(2,4),
                        xMax: ToTempLowArr.substring(0,2)+":"+ToTempLowArr.substring(2,4),
                        borderColor: '#66aaff',
                        borderWidth: 2,
                        z: 2
                    },
                    HighLabel: {
                        type: 'label',
                        content: "最高",
                        font: {size: 18,family: "'ヒラギノ角ゴ-Pro','Noto Sans JP'",weight: "600"},
                        color: '#ff5555',
                        backgroundColor: '#222222',
                        xValue: ToTempHighArr.substring(0,2)+":"+ToTempHighArr.substring(2,4),
                        xAdjust: 22,
                        yValue: ToTempLow.toFixed(1),
                        yAdjust: -6,
                        padding: 3,
                        textAlign: 'left',
                        z: 3
                    },
                    LowLabel: {
                        type: 'label',
                        content: "最低",
                        font: {size: 18,family: "'ヒラギノ角ゴ-Pro','Noto Sans JP'",weight: "600"},
                        color: '#66aaff',
                        backgroundColor: '#222222',
                        xValue: ToTempLowArr.substring(0,2)+":"+ToTempLowArr.substring(2,4),
                        xAdjust: 22,
                        yValue: ToTempHigh.toFixed(1),
                        yAdjust: 6,
                        padding: 3,
                        textAlign: 'left',
                        z: 3
                    },
                    YesterdayHigh: {
                        type: 'line',
                        xMin: YesTempHighArr.substring(0,2)+":"+YesTempHighArr.substring(2,4),
                        xMax: YesTempHighArr.substring(0,2)+":"+YesTempHighArr.substring(2,4),
                        borderColor: '#ff5555',
                        borderWidth: 1,
                        borderDash: [8,4],
                        z: 1
                    },
                    YesterdayLow: {
                        type: 'line',
                        xMin: YesTempLowArr.substring(0,2)+":"+YesTempLowArr.substring(2,4),
                        xMax: YesTempLowArr.substring(0,2)+":"+YesTempLowArr.substring(2,4),
                        borderColor: '#66aaff',
                        borderWidth: 1,
                        borderDash: [8,4],
                        z: 1
                    }
                }
            }
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: "時刻 (時)",
                    color: "#ffffff",
                    font: {size: 16,family: "'ヒラギノ角ゴ-Pro','Noto Sans JP'",weight: "500"}
                },
                ticks: {
                color: "#ffffff",
                font: {size: 16,family: "'ヒラギノ角ゴ-Pro','Noto Sans JP'",weight: "500"},
                callback: function(tick) {
                    let arr2 = [0,18,36,54,72,90,108,126];
                    if (tick == 143) {
                        return 24;
                    } else {
                    if (tick%6 == 0) {
                        if (arr2.includes(Number(tick))) {
                            return tick/6;
                        } else {
                            return "・";
                        }
                    } else {
                        return;
                    }}
                },
                maxRotation: 0,
                minRotation: 0
                },
                grid:{display: false, drawBorder: false}
            },
            y: {
                title: {
                    display: true,
                    text: getModeName(param)+" ("+getUnit(param)+")",
                    color: "#ffffff",
                    font: {size: 16,family: "'ヒラギノ角ゴ-Pro','Noto Sans JP'",weight: "500"}
                },
                ticks: {
                color: "#ffffff",
                font: {size: 16,family: "'ヒラギノ角ゴ-Pro','Noto Sans JP'",weight: "500"}
                },
                grid: {
                    color: "#ffffff",
                    lineWidth: 1
                },
                suggestedMin: param == "pressure" ? 980 :
                              param == "normalPressure" ? 1000 :
                              param == "humidity" ? 0 :
                              param == "sun10m" ? 0 :
                              param == "sun1h" ? 0 : 5,

                suggestedMax: param == "pressure" ? 1030 :
                              param == "normalPressure" ? 1040 :
                              param == "humidity" ? 100 :
                              param == "sun10m" ? 10 :
                              param == "sun1h" ? 1 : 25,
            }
        }
    };
    window.myChart = new Chart(ctx, {
        type:   param == 'temp' ? 'line' :
                param == 'humidity' ? 'line' :
                param == 'snow' ? 'bar' :
                param == 'snow1h' ? 'bar' :
                param == 'snow3h' ? 'bar' :
                param == 'snow12h' ? 'bar' :
                param == 'snow24h' ? 'bar' :
                param == 'sun10m' ? 'line' :
                param == 'sun1h' ? 'line' :
                param == 'snow10m' ? 'bar' :
                param == 'precipitation1h' ? 'bar' :
                param == 'precipitation3h' ? 'bar' :
                param == 'precipitation24h' ? 'bar' :
                param == 'pressure' ? 'line' :
                param == 'normalPressure' ? 'line' :
                'line',
        data: data,
        options: options
    });
    myChart.canvas.parentNode.style.width = (window.innerWidth/1.3)+"px";
    myChart.canvas.parentNode.style.height = (window.innerHeight/1.7)+"px";
    }
    }
document.getElementById('tempChartBackClose').addEventListener("click",()=>{
    document.getElementById('tempChartBack').classList.remove("display");
});

function timeBefore(time) {
    if (time == "1d") {
        displayDate.setDate(displayDate.getDate() - 1);
    } else if ((time.indexOf("h")) !== -1) {
        time = time.replace("h","");
        displayDate.setHours(displayDate.getHours() - Number(time));
    } else if (time == "10m") {
        time = time.replace("m","");
        displayDate.setMinutes(displayDate.getMinutes() - Number(time));
    } else {console.log("引数\"time\"に不正な値が与えられました。");}
    //if (((nowDate.getDate() - displayDate.getDate()) < 9) && ((displayDate.getHours()) != 0) && ((displayDate.getMinutes()) != 0)) {
        let year = displayDate.getFullYear();
        let month = ('0' + (displayDate.getMonth() + 1)).slice(-2);
        let day = ('0' + displayDate.getDate()).slice(-2);
        let hour = ('0' + displayDate.getHours()).slice(-2);
        let minute = ('0' + displayDate.getMinutes()).slice(-2);
        if (param == "snow" || param == "snow1h" || param == "snow6h" || param == "snow12h" || param == "snow24h") {
            latestTime = ''+ year+ month+ day+ hour+ '0000';
        } else {
            latestTime = ''+ year+ month+ day+ hour+ minute+ '00';
        }
        document.getElementById('title_time').innerHTML = latestTime.substring(4,6)+'<span class="small">月</span>'+latestTime.substring(6,8)+'<span class="small">日</span> '+latestTime.substring(8,10)+'<span class="small">時</span>'+latestTime.substring(10,12)+'<span class="small">分</span>現在';
        nowcastDate = new Date(year, month - 1, day, hour, minute, "00");
        nowcastDate.setHours(nowcastDate.getHours() - 9);
        console.log(latestTime+".json を取得中です…。");
        (async() => {
            const url = "https://www.jma.go.jp/bosai/amedas/data/map/"+latestTime+".json";
            const response = await fetch(url)
                .then(response => response.json())
                .then(response => {
                    tempJson = response;
                    mapDraw(param, true);
                });
        })();
    //}
}
function timeAfter(time) {
    if (time == "1d") {
        displayDate.setDate(displayDate.getDate() + 1);
    } else if ((time.indexOf("h")) !== -1) {
        time = time.replace("h","");
        displayDate.setHours(displayDate.getHours() + Number(time));
    } else if (time == "10m") {
        time = time.replace("m","");
        displayDate.setMinutes(displayDate.getMinutes() + Number(time));
    } else {console.log("引数\"time\"に不正な値が与えられました。");}
    //if (((nowDate.getDate() - displayDate.getDate()) >= 0) && ((nowDate.getHours() - displayDate.getHours()) >= 0) && ((nowDate.getMinutes() - displayDate.getMinutes()) >= 0)) {
        let year = displayDate.getFullYear();
        let month = ('0' + (displayDate.getMonth() + 1)).slice(-2);
        let day = ('0' + displayDate.getDate()).slice(-2);
        let hour = ('0' + displayDate.getHours()).slice(-2);
        let minute = ('0' + displayDate.getMinutes()).slice(-2);
        if (param == "snow" || param == "snow1h" || param == "snow6h" || param == "snow12h" || param == "snow24h") {
            latestTime = ''+ year+ month+ day+ hour+ '0000';
        } else {
            latestTime = ''+ year+ month+ day+ hour+ minute+ '00';
        }
        document.getElementById('title_time').innerHTML = latestTime.substring(4,6)+'<span class="small">月</span>'+latestTime.substring(6,8)+'<span class="small">日</span> '+latestTime.substring(8,10)+'<span class="small">時</span>'+latestTime.substring(10,12)+'<span class="small">分</span>現在';
        nowcastDate = new Date(year, month - 1, day, hour, minute, "00");
        nowcastDate.setHours(displayDate.getHours() - 9);
        console.log(latestTime+".json を取得中です…。");
        (async() => {
            const url = "https://www.jma.go.jp/bosai/amedas/data/map/"+latestTime+".json";
            const response = await fetch(url)
                .then(response => response.json())
                .then(response => {
                    tempJson = response;
                    mapDraw(param, true);
                });
        })();
    //}
}

function clickRankingName(e) {
    const key = e.currentTarget.dataset.key;
    let data = PointList[key];
    document.getElementById('map').click();
    let latlng = new L.LatLng((data["lat"][0] + data["lat"][1]/60) , (data["lon"][0] + data["lon"][1]/60));
    eval("circle"+key+".openTooltip();");
    goPoint(latlng, key);
}

function goPoint(latlng, key) {
    document.getElementById('ranking_table_close').click();
    map.flyTo(latlng, 8, { duration: 1 })
    console.log(key);
    var important = L.circle(latlng, {pane: "important", radius: 16000, weight: 6, opacity: 1, fillOpacity: 0.5, dashArray: "10 10", color: "#000000", fillColor: "#00ff00"});
    setTimeout(() => {
        important.addTo(map);
        setTimeout(() => {
            map.removeLayer(important);
            setTimeout(() => {
                important.addTo(map);
                setTimeout(() => {
                    map.removeLayer(important);
                    setTimeout(() => {
                        important.addTo(map);
                        setTimeout(() => {
                            map.removeLayer(important);
                            setTimeout(() => {
                                important.addTo(map);
                                setTimeout(() => {
                                    map.removeLayer(important);
                                }, 500);
                            }, 500);
                        }, 500);
                    }, 500);
                }, 500);
            }, 500);
        }, 500);
    }, 1000);
}

setInterval(() => {
    TempInfo_get();
}, 300000);

document.getElementById('ranking_lowtemp').addEventListener("click",()=>{
    document.getElementById('ranking_table').classList.add('display');
    ranking_create('low');
});
document.getElementById('ranking_hightemp').addEventListener("click",()=>{
    document.getElementById('ranking_table').classList.add('display');
    ranking_create('high');
});
document.getElementById('ranking_table_close').addEventListener("click",()=>{
    document.getElementById('ranking_table').classList.remove('display');
});
document.getElementById('reload').addEventListener("click",()=>{
    TempInfo_get();
});
document.getElementById('amagumo_btn').addEventListener("click",()=>{
    if (document.getElementById('amagumo_settings').classList.contains('display')) {
        document.getElementById('amagumo_settings').classList.remove('display');
    } else {
        document.getElementById('amagumo_settings').classList.add('display');
    }
});
document.getElementById('amagumo_settings_close').addEventListener("click",()=>{
    document.getElementById('amagumo_settings').classList.remove('display');
});
document.getElementById('amagumo_settings_checkbox_amedas').addEventListener("change",()=>{
    if (document.getElementById('amagumo_settings_checkbox_amedas').checked) {map.addLayer(amedas);} else {map.removeLayer(amedas);}
});
document.getElementById('amagumo_settings_checkbox').addEventListener("change",()=>{
    if (document.getElementById('amagumo_settings_checkbox').checked) {map.addLayer(nowcast);} else {map.removeLayer(nowcast);}
});
document.getElementById('amagumo_settings_range').addEventListener("input",()=>{
    let opacity = Number(document.getElementById('amagumo_settings_range').value).toFixed(2);
    document.getElementById('amagumo_settings_range_span').innerText = opacity;
});
document.getElementById('amagumo_settings_range').addEventListener("change",()=>{
    let opacity = document.getElementById('amagumo_settings_range_span').innerText;
    nowcast_basemap["options"]["opacity"] = opacity;
    map.removeLayer(nowcast);
    if (document.getElementById('amagumo_settings_checkbox').checked) {
        nowcast.addTo(map);
    }
});
document.getElementById('amagumo_settings_zindex').addEventListener("input",()=>{
    let zindex = document.getElementById('amagumo_settings_zindex').value;
    document.getElementsByClassName('leaflet-nowcast-pane')[0].style.zIndex = zindex;
});
document.getElementById('amagumo_settings_checkbox_title').addEventListener("click",()=>{
    if (document.getElementById('title').classList.contains('display')) {
        document.getElementById('title').classList.remove('display');
    } else {
        document.getElementById('title').classList.add('display');
    }
});
document.getElementById('amagumo_settings_checkbox_hanrei').addEventListener("click",()=>{
    if (document.getElementsByClassName('hanrei')[0].classList.contains('display')) {
        document.getElementsByClassName('hanrei')[0].classList.remove('display');
    } else {
        document.getElementsByClassName('hanrei')[0].classList.add('display');
    }
});

function getTodayData(stationID, year, month, date, hour, minute) {
    
    if (hour >= 1 || (hour >= 0 && minute >= 10)) {
        $.getJSON('https://www.jma.go.jp/bosai/amedas/data/point/'+stationID+'/'+year+month+date+'_00.json')
        .done(function (Today00) {
            ToAllDatalength += Object.keys(Today00).length;
            var keynum = 0;
            var keys = Object.keys(Today00);
            Object.keys(Today00).forEach(element => {
                eval('ToAllData["'+keys[keynum].substring(8,12)+'"] = Today00["'+year+month+date+keys[keynum].substring(8,12)+'00"]');
                keynum++;
            });
        });
    }
    if (hour >= 4 || (hour >= 3 && minute >= 10)) {
        $.getJSON('https://www.jma.go.jp/bosai/amedas/data/point/'+stationID+'/'+year+month+date+'_03.json')
        .done(function (Today03) {
            ToAllDatalength += Object.keys(Today03).length;
            var keynum = 0;
            var keys = Object.keys(Today03);
            Object.keys(Today03).forEach(element => {
                eval('ToAllData["'+keys[keynum].substring(8,12)+'"] = Today03["'+year+month+date+keys[keynum].substring(8,12)+'00"]');
                keynum++;
            });
        });
    }
    if (hour >= 7 || (hour >= 6 && minute >= 10)) {
        $.getJSON('https://www.jma.go.jp/bosai/amedas/data/point/'+stationID+'/'+year+month+date+'_06.json')
        .done(function (Today06) {
            ToAllDatalength += Object.keys(Today06).length;
            var keynum = 0;
            var keys = Object.keys(Today06);
            Object.keys(Today06).forEach(element => {
                eval('ToAllData["'+keys[keynum].substring(8,12)+'"] = Today06["'+year+month+date+keys[keynum].substring(8,12)+'00"]');
                keynum++;
            });
        });
    }
    if (hour >= 10 || (hour >= 9 && minute >= 10)) {
        $.getJSON('https://www.jma.go.jp/bosai/amedas/data/point/'+stationID+'/'+year+month+date+'_09.json')
        .done(function (Today09) {
            ToAllDatalength += Object.keys(Today09).length;
            var keynum = 0;
            var keys = Object.keys(Today09);
            Object.keys(Today09).forEach(element => {
                eval('ToAllData["'+keys[keynum].substring(8,12)+'"] = Today09["'+year+month+date+keys[keynum].substring(8,12)+'00"]');
                keynum++;
            });
        });
    }
    if (hour >= 12) {
        $.getJSON('https://www.jma.go.jp/bosai/amedas/data/point/'+stationID+'/'+year+month+date+'_12.json')
        .done(function (Today12) {
            ToAllDatalength += Object.keys(Today12).length;
            var keynum = 0;
            var keys = Object.keys(Today12);
            Object.keys(Today12).forEach(element => {
                eval('ToAllData["'+keys[keynum].substring(8,12)+'"] = Today12["'+year+month+date+keys[keynum].substring(8,12)+'00"]');
                keynum++;
            });
        });
    }
    if (hour >= 15) {
        $.getJSON('https://www.jma.go.jp/bosai/amedas/data/point/'+stationID+'/'+year+month+date+'_15.json')
        .done(function (Today15) {
            ToAllDatalength += Object.keys(Today15).length;
            var keynum = 0;
            var keys = Object.keys(Today15);
            Object.keys(Today15).forEach(element => {
                eval('ToAllData["'+keys[keynum].substring(8,12)+'"] = Today15["'+year+month+date+keys[keynum].substring(8,12)+'00"]');
                keynum++;
            });
        });
    }
    if (hour >= 18) {
        $.getJSON('https://www.jma.go.jp/bosai/amedas/data/point/'+stationID+'/'+year+month+date+'_18.json')
        .done(function (Today18) {
        ToAllDatalength += Object.keys(Today18).length;
            var keynum = 0;
            var keys = Object.keys(Today18);
            Object.keys(Today18).forEach(element => {
                eval('ToAllData["'+keys[keynum].substring(8,12)+'"] = Today18["'+year+month+date+keys[keynum].substring(8,12)+'00"]');
                keynum++;
            });
        });
    }
    if (hour >= 21) {
        $.getJSON('https://www.jma.go.jp/bosai/amedas/data/point/'+stationID+'/'+year+month+date+'_21.json')
        .done(function (Today21) {
            ToAllDatalength += Object.keys(Today21).length;
            var keynum = 0;
            var keys = Object.keys(Today21);
            Object.keys(Today21).forEach(element => {
                eval('ToAllData["'+keys[keynum].substring(8,12)+'"] = Today21["'+year+month+date+keys[keynum].substring(8,12)+'00"]');
                keynum++;
            });
        });
    }
}
function getYesterdayData(stationID, year, month, date) {
    $.getJSON('https://www.jma.go.jp/bosai/amedas/data/point/'+stationID+'/'+year+month+date+'_00.json')
    .done(function (Yesterday00) {
        var keynum = 0;
        var keys = Object.keys(Yesterday00);
        Object.keys(Yesterday00).forEach(element => {
            eval('YesAllData["'+keys[keynum].substring(8,12)+'"] = Yesterday00["'+year+month+date+keys[keynum].substring(8,12)+'00"]');
            keynum++;
        });
    });
    $.getJSON('https://www.jma.go.jp/bosai/amedas/data/point/'+stationID+'/'+year+month+date+'_03.json')
    .done(function (Yesterday03) {
        var keynum = 0;
        var keys = Object.keys(Yesterday03);
        Object.keys(Yesterday03).forEach(element => {
            eval('YesAllData["'+keys[keynum].substring(8,12)+'"] = Yesterday03["'+year+month+date+keys[keynum].substring(8,12)+'00"]');
            keynum++;
        });
    });
    $.getJSON('https://www.jma.go.jp/bosai/amedas/data/point/'+stationID+'/'+year+month+date+'_06.json')
    .done(function (Yesterday06) {
        var keynum = 0;
        var keys = Object.keys(Yesterday06);
        Object.keys(Yesterday06).forEach(element => {
            eval('YesAllData["'+keys[keynum].substring(8,12)+'"] = Yesterday06["'+year+month+date+keys[keynum].substring(8,12)+'00"]');
            keynum++;
        });
    });
    $.getJSON('https://www.jma.go.jp/bosai/amedas/data/point/'+stationID+'/'+year+month+date+'_09.json')
    .done(function (Yesterday09) {
        var keynum = 0;
        var keys = Object.keys(Yesterday09);
        Object.keys(Yesterday09).forEach(element => {
            eval('YesAllData["'+keys[keynum].substring(8,12)+'"] = Yesterday09["'+year+month+date+keys[keynum].substring(8,12)+'00"]');
            keynum++;
        });
    });
    $.getJSON('https://www.jma.go.jp/bosai/amedas/data/point/'+stationID+'/'+year+month+date+'_12.json')
    .done(function (Yesterday12) {
        var keynum = 0;
        var keys = Object.keys(Yesterday12);
        Object.keys(Yesterday12).forEach(element => {
            eval('YesAllData["'+keys[keynum].substring(8,12)+'"] = Yesterday12["'+year+month+date+keys[keynum].substring(8,12)+'00"]');
            keynum++;
        });
    });
    $.getJSON('https://www.jma.go.jp/bosai/amedas/data/point/'+stationID+'/'+year+month+date+'_15.json')
    .done(function (Yesterday15) {
        var keynum = 0;
        var keys = Object.keys(Yesterday15);
        Object.keys(Yesterday15).forEach(element => {
            eval('YesAllData["'+keys[keynum].substring(8,12)+'"] = Yesterday15["'+year+month+date+keys[keynum].substring(8,12)+'00"]');
            keynum++;
        });
    });
    $.getJSON('https://www.jma.go.jp/bosai/amedas/data/point/'+stationID+'/'+year+month+date+'_18.json')
    .done(function (Yesterday18) {
        var keynum = 0;
        var keys = Object.keys(Yesterday18);
        Object.keys(Yesterday18).forEach(element => {
            eval('YesAllData["'+keys[keynum].substring(8,12)+'"] = Yesterday18["'+year+month+date+keys[keynum].substring(8,12)+'00"]');
            keynum++;
        });
    });
    $.getJSON('https://www.jma.go.jp/bosai/amedas/data/point/'+stationID+'/'+year+month+date+'_21.json')
    .done(function (Yesterday21) {
        var keynum = 0;
        var keys = Object.keys(Yesterday21);
        Object.keys(Yesterday21).forEach(element => {
            eval('YesAllData["'+keys[keynum].substring(8,12)+'"] = Yesterday21["'+year+month+date+keys[keynum].substring(8,12)+'00"]');
            keynum++;
        });
    });
    }