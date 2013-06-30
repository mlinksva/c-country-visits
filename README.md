collect.js looks at gzipped web/cache server log files in Common Log
Format, extracts for each day the number of home page hits from each
unique IP address, geo-country-locates each IP address, stores in sqlite
database.

report.js looks at sqlite database and prints in CSV format the number
of unique IP addresses for each country for each day.

These scripts are motivated by a research request for data showing
changes in visits by country over time. To comply with privacy policies
and not transfer huge log files, extraction had to be done on machine
where logs stored. The output of report.js is provided to researcher.

The host to look for home page accesses to is currently hardcoded in
collect.js.

There probably is a simple way to extract the desired report from an
existing log analyzer; I threw this together instead because I felt like
trying ~shell scripting with javascript, which I'd never done before
and it probably shows.

#Installation

Clone from git.

You'll need node installed, and the following npms:
* geoip
* lazy
* sqlite

GeoIP.dat is included, and its location hardcoded in collect.js (assumed
same directory as script). To download a new copy of GeoLite Country
visit http://dev.maxmind.com/geoip/legacy/geolite/ but there is probably
no reason to.

#Usage

  node collect.js dbfile <logfiles>

  node report.js dbfile

collect.js does not handle bad files; if you have some in your log
directory you might invoke collect.js for each file; then the bad files
won't be processed rather than halting all processing, eg:

  find path/to/logs -type f -exec node collect.js a.db {} \;

collect.js may run for a long time after printing to the console that
it has processed files. It is making sqlite inserts.

Sqlite may be the reason collect.js is very slow; I haven't bothered
trying with a database server.

#License

Code is dedicated to the public domain under
[CC0](http://creativecommons.org/publicdomain/zero/1.0/).

This product includes GeoLite data created by MaxMind, available from <a
href="http://www.maxmind.com">http://www.maxmind.com</a>. GeoIP.dat
is distributed under
[CC-BY-SA](http://creativecommons.org/licenses/by-sa/3.0/).
