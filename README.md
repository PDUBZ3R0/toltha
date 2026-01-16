[*](#story)***toltha***</a> is a very slim wrapper on [undici](https://npm.io/package/undici)'s request (undici is the fastest http/s client for node.js). It's purpose is to provide a thin and simple interface to support common use cases and features that currently require a lot of research or a lot of boilerplate code. It easily replaces fetch, axios or other libraries, with the primary goal being to out-perform them all.

### Features
- Supports HTTP/S and SOCKS4/5 proxies per request (including auth support).
- Allows the response body to return an object based on `Content-Type` parse **JSON** as an Object,  **HTML, XML** & **XHTML** as a representation of the dom w/ selector support ([cheerio](https://npm.io/package/cheerio) object: uses jQuery compatible syntax) Dom object (uses cheerio).
	- Binary formats as an ArrayBuffer
	- Text as a string, for plain text (and the fallback for mismatched headers). 

- Makes it simple to POST data as a *form*, plain *text*, JSON or XML. Automatically sets `Content-Type` and `Content-Length` headers for the data type. 

***

### Import
You can import / require the default object:
	
	import { default as http } from 'toltha' // ESM default
	import http from 'toltha'				 // ESM default #2
	
	const http = require("tolha");
	
	http.head(u).then(response=>{ // Promises })
	
	// async/await || This example specifies the body type w/ the default import
	const response = await http.post(u, { body: http.body.json(data) })

ESM style for tree shaking:

	import { get, post, JsonBody } from 'toltha'
	const response = await post(url, { body: new JsonBody(data) })

***

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
head(url, { headers: {
	"X-Custom-Header": "My Value"
}})
```

- **cookies**: add cookies (sets the appropriate headers):

```javascript
get(url, { cookies: {
	favcolor: "blue",
	"name-with-dashes": true,
	foo: "bar",
	float: -867.5309
}})
```

- **token**: add a token - sets the header `Authorization: Bearer <token>`

- **query**: allows passing in an object that will be expanded to create the querystring.

- **proxy**: proxy to use as a URL string, supports http/s or socks4/5 proxies including auth support. Expects the standard URL format, examples: `http://10.20.30.40:8080/` or `socks5://user:password@hostname:1080/`

- **timeout**: provide a timeout in milliseconds, triggers an AbortSignal if the timeout is reached before the response.

****

### Post Request

```javascript
post (url, { headers, cookies, token, redirect, body, proxy, timeout })
```

Post has the same input parameters as `head` and `get` except body replaces *query* 

- **redirect**: specifies whether the client should follow redirects and load the target page content, or just return the redirect response status along with the headers and cookies that response contains.

- **body**: specifies the body type and data. With the default import use the body property i.e. `toltha.body.json()` see the example above in the import section. or you can import the type you need and use it as shown below:

```javascript
import { FormBody, JsonBody, XmlBody, TextBody, post } from 'toltha'

let response = await post('https://website.com', { body: new FormBody(dataObject) });
```

#### BodyType

The following body types are provided:

- **FormBody** (object || string) will be encoded and sent as **x-www-form-urlencoded**
- **JsonBody** (object || string) encoded as **application/json**
- **XmlBody** (string) sent as **application/xml**
- **TextBody** (string) as **text/plain**

****


### Response

The `head`, `get` and `post` methods all return `Promise<Response>`:

* **ok**: is the request successful, in terms of getting back a timely response with a non-error status code? 
* **status**: the status code returned by the server* (* or in the case of an exception in the handler, this is set to the special value of 400).
* **error**: when an error with a message is caught or detected, that message will be available here. 
* **headers**: the headers set on the response.
* **cookies**: the cookie values sent by the server, that a browser would then save, from the `Set-Cookie` headers. 

* **supports**:  an object that tells you how the body content can be returned, each of these properties are boolean: true/false
	+ **binary**: binary format, available for any mime type that isn't `text/***`returned by calling: `await response.arrayBuffer()`
	+ **text**: if there is a response, even if no content-type header is present, text will be supported.
	+ **dom**: x?html / xml content, returns [cheerio](https://npm.io/package/cheerio) object (jQuery compatible syntax);
	+ **json**: parses JSON into an object if the document is complete / syntax is valid.

##### Examples

```javascript
const response = await get(uril);
if (response.ok) {
	if (response.supports.json) {
		let data = await response.json();
	} 
} else {
	let message = {
		status: response.status,
		error: response.error
	}
	if (typeof response.error === "undefined" && response.supports.dom){
		let $ = await response.dom();
		message.error = $("div.error")?.text();
	}
}
```



<a name="story" style="text-decoration: none; color: slategrey">* The story behind the name of undici started a quest to find a unique name for this project that was inspired.</a>
> **undici** is "eleven" in *Italian*:<br/>
> the *German / Dutch* word for "undici" is: ***elf***<br/>
> the *elven* word for "fetch" is ***[toltha](https://www.elfdict.com/w/fetch)***.