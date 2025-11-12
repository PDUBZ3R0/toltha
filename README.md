# fetching

Fetching is a very slim wrapper on undici's request (the fastest http client for node) providing a user-friendly interface to simplify performing
common tasks the correct way:

* Support HTTP/S and SOCKS4/5 proxy per request (with auth support).

* Optional body parsing returns (based on content-type):
+ JSON as an Object
+ html, xhtml / xml with cheerio

* Sets the body and content headers for different POST types:
+ Forms (string or object, as x-www-form-urlencoded)
+ JSON (string or object, as application/xml)
+ XML (string, as application/xml)
+ Text as (text/plain)# fetching
