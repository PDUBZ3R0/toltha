
import { Client, request, fetch, parseMIMEType, ProxyAgent } from 'undici'
import { socksDispatcher } from 'fetch-socks'
import { load } from 'cheerio'

import qs from 'node:querystring'

class BodyData {
	constructor({ shortname, header, conversion, data }) {
		this.shortname = shortname;
		this.header = header;

		if (conversion) data = conversion(data);
		this.data = data;
	}
}

export class FormBody extends BodyData { 
	constructor(data){ 
		super({ shortname: "form", header: "application/x-www-form-urlencoded", data, conversion: data => (typeof data === "object") ? qs.stringify(data) : data })
	}
}
export class TextBody extends BodyData {
	constructor(data){ 
		super({ shortname: "form", header: "text/plain", data })
	}
}
export class XmlBody extends BodyData {
	constructor(data){ 
		super({ shortname: "xml", header: "application/xml; charset=utf-8", data })
	}
}
export class JsonBody extends BodyData { 
	constructor(data){ 
		super({ shortname: "json", header: "application/json", data, conversion:  data => (typeof data === "object") ? JSON.stringify(data) : data })
	}
}

const BodyHelper = (function(){
	function ibodytype(type) {
		return function(data) {
			return new type(data);
		}
	}

	return {
		json: ibodytype(JsonBody),
		form: ibodytype(FormBody),
		xml: ibodytype(XmlBody),
		text: ibodytype(TextBody)
	}
})()

const Cookie = {
	stringify(cookies) {
		let output = ""
		for (let key in cookies) {
			if (output !== "") output += "; ";
			output += `${key}=${cookies[key]}`;
		}
		return output;
	},
	parse(headers) {
		let ckmap = {};
		if (headers["set-cookie"]){
			let gsch = headers["set-cookie"];
			if (typeof gsch === "string") gsch = [ gsch ]; 
			for (let csh of gsch) {
				let parts = csh.match(/^([^=]*)=([^;]*)/);
				if (parts) ckmap[parts[1]]=parts[2]
			}
		}
		return ckmap;
	}
}

function bodytype(mimetype, body, output) {
	return new Promise(async btresolve=>{
		if (mimetype === null) {
			let text = await body.text();
			output.text = body.text
			
			output.json = new Promise(r=>r(false));
			output.dom = new Promise(r=>r(false));
			output.binary = body.arrayBuffer

			output.supports = {
				json: false,
				dom: false,
				binary: true,
				text: true
			}

		} else if (mimetype.type === "text" || /(json|xml)/.test(mimetype.subtype)){

			output.supports = {
				binary: false,
				text: true
			}

			let text = await body.text();
			if (/(x?html|xml)/.test(mimetype.subtype)) {
				output.dom = function() {
					return new Promise(async resolve=>{
						resolve(load(text));
					})
				}
			} else {
				output.dom = new Promise(r=>r(false));
				output.supports.dom = true
			}

			output.text = function(){
				return new Promise(resolve=>{
					resolve (text);
				})
			}

			if (/json/.test(mimetype.subtype)) {
				output.json = function(){
					return new Promise(resolve=>{
						resolve (JSON.parse(text));
					})
				}
			} else {
				output.json = new Promise(r=>r(false));
				output.supports.json = true
			}

			output.binary = new Promise(r=>r(false));

		} else {
			let b = await body.arrayBuffer();
			output.binary = function() {
				return new Promise(async resolve=>{
					resolve(b);
				})
			}
			output.text = function(){
				return new Promise(async resolve=>{
					const decoder = new TextDecoder();
					resolve (decoder.decode(b));
				});
			}

			output.json = new Promise(r=>r(false));
			output.dom = new Promise(r=>r(false));

			output.supports = {
				json: false,
				dom: false,
				binary: true,
				text: true
			}
		}
		
		btresolve(output);
	})
}

function proxyrequest(proxy, logger, path, task) {
	const socks = /socks([45]):\/\/(([^:]*):([^@]*)@)?([^:]*):(\d+)/;

	if (!proxy) {
		return request(path, task);

	} else if (socks.test(proxy)){
		let parts = proxy.match(socks);

		let opts = {
		    type: parseInt(parts[1]),
		    host: parts[5]
		};
		if (parts[6]) opts.port = parseInt(parts[6])
		if (parts[2]) {
		    opts.userId = parts[3]
		    opts.password = parts[4]
		}

		task.dispatcher = socksDispatcher(opts, {
		    connect: {
		        rejectUnauthorized: false,
		    },
		});

		return request(path, task);

	} else {
		const http_s = /(https?:\/\/)(?:([^:]*:[^@]*)@)?(.*)/;
		let parts = proxy.match(http_s);

		let opts = {
	    	uri: `${parts[1]}${parts[3]}`,
	      	requestTls: {
		         rejectUnauthorized: false,
		    }
	    };
		if (parts[2]) {
		    opts.token = `Basic ${Buffer.from(parts[2]).toString('base64')}`;
		}

		task.dispatcher = new ProxyAgent(opts);

		return request(path, task);
	}
}

function dispatchoptions({ path, headers, cookies, token, method, logger, query, body, redirect, timeout }){
	let opts = { method };
	if (headers) opts.headers = headers;
	else opts.headers = {};
	opts.headers["Host"] = new URL(path).hostname;
	if (token) opts.headers["Authorization"] = `Bearer ${token}`;
	if (cookies) opts.headers["Cookie"] = Cookie.stringify(cookies);
	if (query) opts.query = query;
	if (body) opts.body = body;	
	if (redirect) opts.redirect = redirect;
	if (timeout) opts.signal = AbortSignal.timeout(timeout);
	return opts;
}

function mime(headers){
	let content = headers["content-type"];
	return content ? parseMIMEType(content) : null;
}

const defaultlogger = {
	log: console.log,
	debug (...msg){
		if (process.argv.includes("--verbose")) console.debug(...msg);
	}
}

export function head(path, options={}){
	const { headers, cookies, token, query, proxy, logger=defaultlogger, timeout } = options;
	
	return new Promise(async resolve=>{
		try {
			let opts = dispatchoptions({ method: "HEAD", path, headers, cookies, token, query, logger, timeout });
			const { statusCode, headers: rh } = await proxyrequest(proxy, logger, path, opts);
		
			resolve({
				ok: statusCode === 200,
				status: statusCode,
				headers: rh,
				cookies: Cookie.parse(rh)
			});
			
		} catch (e) {
			logger.debug(e)
			resolve({
				ok: false,
				error: e,
				status: 400
			})
		}
	});
}

export function get(path, options={}){
	const { headers, cookies, token, query, proxy, logger=defaultlogger, timeout } = options;

	return new Promise(async resolve=>{
		try {
			let opts = dispatchoptions({ method: "GET", path, headers, cookies, token, query, logger, timeout });
			const { statusCode, headers: rh, body: rb } = await proxyrequest(proxy, logger, path, opts);
			let mimetype = mime(rh);

			resolve(await bodytype(mimetype, rb, {
				ok: statusCode === 200,
				status: statusCode,
				headers: rh,
				cookies: Cookie.parse(rh)
			}));
		} catch (e) {
			logger.debug(e)
			resolve({
				ok: false,
				error: e,
				status: 400
			})
		}
	});
}

export function post(path, options={}){
	const { headers, cookies, token, redirect, body, proxy, logger=defaultlogger, timeout } = options;
	
	return new Promise(async resolve=>{
		try {
			let data;
			if (!body) {
				throw new Error("body is required for POST");
			} else {
				headers["Content-Type"] = body.header;
				headers["Content-Length"] = body.data.length;
				data = body.data
			}

			let opts = dispatchoptions({ method: "POST", path, headers, cookies, token, redirect, body: data, logger, timeout });
			const { statusCode, headers: rh, body: rb } = await proxyrequest(proxy, logger, path, opts);
			let mimetype = mime(rh);

			resolve(await bodytype(mimetype, rb, {
				ok: statusCode === 200,
				status: statusCode,
				headers: rh,
				cookies: Cookie.parse(rh)
			}));
		} catch (e) {
			logger.debug(e)
			resolve({
				ok: false,
				error: e,
				status: 400
			})
		}
	});
}

export default {
	head,
	get, 
	post,
	body: BodyHelper
}
