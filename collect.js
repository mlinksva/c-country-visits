var fs = require('fs');
var geoip = require('geoip');
var sqlite3 = require('sqlite3').verbose();
var zlib = require('zlib');
var lazy = require('lazy');

if (process.argv.length < 3) {
  console.error('Usage: '+process.argv[0]+' '+process.argv[1]+' dbfile <logfiles>');
  process.exit(1);
}

var dbfile = process.argv[2];
var args = process.argv.slice(3);

var db = new sqlite3.Database(dbfile);

db.serialize(function() {
  db.run("CREATE TABLE if not exists ipday (ip TEXT, country TEXT, day TEXT, unique(ip, day) on conflict IGNORE)");
  db.run("CREATE TABLE if not exists filesseen (path TEXT, completed DATE)");
});

var ipdayInsert = db.prepare("INSERT INTO ipday VALUES (?, ?, ?)");
var filesseenInsert = db.prepare("INSERT INTO filesseen VALUES (?, ?)");
var filesseenQuery = db.prepare("SELECT completed from filesseen where path = ?");

args.forEach(function(entry) {
  processLogFile(fs.realpathSync(entry));
});

function processLogFile(logFile) {
  db.serialize(function() {
    filesseenQuery.get(logFile, function(err, row) {
      if (row === undefined) {
        console.log('processing: '+logFile);
        new lazy(fs.createReadStream(logFile)
          .pipe(zlib.createUnzip())).lines
          .forEach(function(line) {processLogLine(line.toString())})
          .on('pipe', function() {
            console.log('processed: '+logFile);
            filesseenInsert.run(logFile, new Date().toString());
          })
          .on('error', function(err) {
            console.log('ERROR: '+logFile+' '+err);
          });
      } else {
        console.log('previously processed, skipping: '+logFile);
      }
    });
  });
}

//logLineRE = /^(\S+) (\S+) (\S+) \[(\d+)\/(\w+)\/(\d+):(\d+:\d+:\d+) ([^\]]+)\] "(\S+) (\S+) ?(\S+)?" (\S+) (\S+) "([^"]+)" "([^"]+)"$/;
var logLineRE = /^(\S+) (\S+) (\S+) \[(\d+)\/(\w+)\/(\d+):(\d+:\d+:\d+) ([^\]]+)\] "(\S+) http:\/\/creativecommons.org(:\d+)?\/( \S+)?" 200 (\S+) "([^"]+)" "([^"]+)"$/;

var country = new geoip.Country('GeoIP.dat');

var months = {
 'Jan' : '01',
 'Feb' : '02',
 'Mar' : '03',
 'Apr' : '04',
 'May' : '05',
 'Jun' : '06',
 'Jul' : '07',
 'Aug' : '08',
 'Sep' : '09',
 'Oct' : '10',
 'Nov' : '11',
 'Dec' : '12'
};

function processLogLine(logLine) {
  match = logLineRE.exec(logLine);
  if (match) {
    var ipCountry = country.lookupSync(match[1]);
    var ipCountryCode3 = 'unknown';
    if (ipCountry) {
      ipCountryCode3 = ipCountry.country_code3;
    }
    ipdayInsert.run(match[1], ipCountryCode3, match[6]+'-'+months[match[5]]+'-'+match[4]);
  }
}
