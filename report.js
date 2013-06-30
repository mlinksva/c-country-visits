var sqlite3 = require('sqlite3').verbose();

if (process.argv.length < 2) {
  console.error('Usage: '+process.argv[0]+' '+process.argv[1]+' dbfile');
  process.exit(1);
}

var dbfile = process.argv[2];

var db = new sqlite3.Database(dbfile);

var query = db.prepare("SELECT day, country, count(country) as n from ipday group by day, country order by day, country, n");

query.each(function(err, row) {
  console.log(row['day']+','+row['country']+','+row['n']);
});
