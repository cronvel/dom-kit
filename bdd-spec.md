ID length 1: j
ID length 3: MuW
ID length 5: EjpuB
ID length 8: Rfbz28OR
# TOC
   - [Base64](#base64)
   - [Fingerprint](#fingerprint)
   - [randomIdentifier()](#randomidentifier)
<a name=""></a>
 
<a name="base64"></a>
# Base64
should encode and decode a string using Base64 encoding and Base64 URL encoding.

```js
base64Tests( '' , '' , '' ) ;
base64Tests( 'Hello world' , 'SGVsbG8gd29ybGQ=' , 'SGVsbG8gd29ybGQ' ) ;
base64Tests( 'Hello world!' , 'SGVsbG8gd29ybGQh' , 'SGVsbG8gd29ybGQh' ) ;
base64Tests( 'Hello world!!' , 'SGVsbG8gd29ybGQhIQ==' , 'SGVsbG8gd29ybGQhIQ' ) ;
base64Tests( 'Hello world!!!' , 'SGVsbG8gd29ybGQhISE=' , 'SGVsbG8gd29ybGQhISE' ) ;
base64Tests( 'Hello world!!!!' , 'SGVsbG8gd29ybGQhISEh' , 'SGVsbG8gd29ybGQhISEh' ) ;
base64Tests( 'H3110 \\/\\/021dZ! d4 `/4 1:|<3 d01142$?' , 'SDMxMTAgXC9cLzAyMWRaISBkNCBgLzQgMTp8PDMgZDAxMTQyJD8=' , 'SDMxMTAgXC9cLzAyMWRaISBkNCBgLzQgMTp8PDMgZDAxMTQyJD8' ) ;
base64Tests( '^~#°%£µ*§$' , 'Xn4jwrAlwqPCtSrCpyQ=' , 'Xn4jwrAlwqPCtSrCpyQ' ) ;
base64Tests( undefined , 'hw+/' , 'hw-_' ) ;
```

<a name="fingerprint"></a>
# Fingerprint
should give a fingerprint for any number, string or object.

```js
expect( hash.fingerprint( undefined ) ).to.be( undefined ) ;
expect( hash.fingerprint( null ) ).to.be( undefined ) ;
expect( hash.fingerprint( true ) ).to.be( undefined ) ;
expect( hash.fingerprint( false ) ).to.be( undefined ) ;

expect( hash.fingerprint( '' ) ).to.be( '1B2M2Y8AsgTpgAmY7PhCfg' ) ;
expect( hash.fingerprint( 'Hello world' ) ).to.be( 'PiWWCnnbxptnTNTsZ6csYg' ) ;
expect( hash.fingerprint( 'Hello world!' ) ).to.be( 'hvsmnRkNLIX24EaM7KQqIA' ) ;
expect( hash.fingerprint( 'Hello world!!' ) ).to.be( 'HZTdff0FBBAYWlNblXXhhA' ) ;
expect( hash.fingerprint( 'Hello world!!!' ) ).to.be( 'h-5zLYMWkPRbhgaxVHvQng' ) ;
expect( hash.fingerprint( 'Hello world!!!!' ) ).to.be( '4PtDH15tYRUdK3nO25BJRQ' ) ;

expect( hash.fingerprint( 0 ) ).to.be( 'AAAAAAAAAAA' ) ;
expect( hash.fingerprint( 3 ) ).to.be( 'AAAAAAAACEA' ) ;
expect( hash.fingerprint( -3 ) ).to.be( 'AAAAAAAACMA' ) ;
expect( hash.fingerprint( 0.111 ) ).to.be( '0SLb-X5qvD8' ) ;
expect( hash.fingerprint( 3.1416 ) ).to.be( 'p-hILv8hCUA' ) ;
expect( hash.fingerprint( 1024 ) ).to.be( 'AAAAAAAAkEA' ) ;
expect( hash.fingerprint( 1234.5678 ) ).to.be( 'rfpcbUVKk0A' ) ;
expect( hash.fingerprint( -98765.01234 ) ).to.be( 'h22LMtAc-MA' ) ;

expect( hash.fingerprint( { a: 'simple object' } ) ).to.be( 'WJ86ea_U_oFPIzWCPPnDbg' ) ;
expect( hash.fingerprint( { a: 'more', complex: 'object' } ) ).to.be( '0wXBJSfTRdkEhAfBgyZWKA' ) ;
expect( hash.fingerprint( {
	yo: 'dawg',
	i: 'herd yo like object' ,
	so: {
		i: 'put object' ,
		into: {
			object: {
				into: {
					object: {} ,
					so: 'you can code OO' ,
					'while': 'you code OO'
				}
			}
		}
	} ,
	dawg: '!'
} ) ).to.be( 'GiMV0HBoL-FPWphYkNbmQA' ) ;

expect( hash.fingerprint( [1,2,3] ) ).to.be( '8eRvMo5t7NVsZN1edh3Ctw' ) ;
expect( hash.fingerprint( [ 'one' , 'two' , 'three' ] ) ).to.be( '54iNs6qLk1eoz57dmYp4kA' ) ;
```

<a name="randomidentifier"></a>
# randomIdentifier()
should create random identifier.

```js
console.log( "ID length 1: " + hash.randomIdentifier( 1 ) ) ;
console.log( "ID length 3: " + hash.randomIdentifier( 3 ) ) ;
console.log( "ID length 5: " + hash.randomIdentifier( 5 ) ) ;
console.log( "ID length 8: " + hash.randomIdentifier( 8 ) ) ;
```

