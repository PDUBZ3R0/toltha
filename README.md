# toltha*

is a very slim wrapper on [undici](https://npm.io/package/undici)'s request (undici is the fastest http/s client for **node.js**). It's purpose is to provide a thin and simple interface to support common use cases and features that currently require a lot of research or a lot of boilerplate code. It easily replaces fetch, axios or other libraries, with the primary goal being to out-perform them all.

### Features
- Supports HTTP/S and SOCKS4/5 proxy per request (including auth support).
- Allows the response body to return as (based on Content-Type):
  - JSON parsed as an Object
  - HTML, XML & XHTML as jQuery-compatible Dom object (uses cheerio).
  - Binary formats as an ArrayBuffer
  - Text as a string, unparsed for plain text or when headers aren't correct. 

* Sets the body and content headers for different POST types (see post method below for examples):
+ Forms (string or object, as x-www-form-urlencoded)
+ JSON (string or object, as application/xml)
+ XML (string as application/xml)
+ Text (string as text/plain)

### Import

### Methods
```javascript
head (url, { headers, cookies, token, query, proxy, timeout })
```

```javascript
get (url, { headers, cookies, token, query, proxy, timeout })
```

- **url**: obvious enough.

- **headers**: add custom headers:
 ```javascript
headers: {
	"X-Custom-Header": "My Value"
}
```

- **cookies**: add cookies (sets the appropriate headers):
 ```javascript
cookies: {
	favcolor: "blue",
	"name-with-dashes": true,
	foo: "bar",
	float: -867.5309
}
```

- **token**: add a token - sets the header `Authorization: Bearer <token>`

- **query**: allows passing in an object that will be expanded to create the querystring.

- **proxy**: proxy to use as a URL string, supports http/s or socks4/5 proxies including auth support. Expects the standard URL format, examples: `http://10.20.30.40:8080/` or `socks5://user:password@hostname:1080/`

- **timeout**: provide a timeout in milliseconds, triggers an AbortSignal if the timeout is reached before the response.

### Post Request

post {url, headers, cookies, token, redirect, body, proxy, timeout }

Post has the same input parameters as `head` and `get`, except instead of *query* you specify **body** using one of the following:

```
javascript
import { FormBody, JsonBody, XmlBody, TextBody, post } from 'toltha'

let response = await post('https://website.com', { body: new JsonBody(dataObject) });
```

* **undici** is *eleven* in Italian, since so many good, simple names are taken I chose another encoded naming method: in german/dutch eleven is *elf*, that inspired the use of the *elven* language. The elven word for "fetch" is ***[tolha](https://www.elfdict.com/w/fetch)***.