let request = require("request");

let yts_api = 'https://yts.ag/api/v2/list_movies.json?sort_by=like_count&with_rt_ratings=true&limit=50&page=';
let oneon_api = 'http://oneom.tk/ep';


var oneon_headers = {
    'Accept-Encoding': 'utf8',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36',
    'Accept': 'application/json',
    'Cache-Control': 'no-cache'
};


function get_shows(error, response, body) {
    if (!error && response.statusCode == 200) {
        //console.log(body);
    } else { console.log(response.statusCode); }
}
function get_movies(error, response, body) {
    if (!error && response.statusCode == 200) {
        console.log(body);
    } else { console.log(response.statusCode); }
}

request({url: yts_api, headers: oneon_headers}, get_shows);
request({url: oneon_api, headers: oneon_headers}, get_movies);