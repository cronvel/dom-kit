/*
	The Cedric's Swiss Knife (CSK) - CSK DOM toolbox

	Copyright (c) 2015 Cédric Ronvel 
	
	The MIT License (MIT)

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
*/



// Load modules
//var string = require( 'string-kit' ) ;



var dom = {} ;
module.exports = dom ;



// Load the svg submodule
dom.svg = require( './svg.js' ) ;



// Like jQuery's $(document).ready()
dom.ready = function ready( callback )
{
	document.addEventListener( 'DOMContentLoaded' , function internalCallback() {
		document.removeEventListener( 'DOMContentLoaded' , internalCallback , false ) ;
		callback() ;
	} , false ) ;
} ;



// Return a fragment from html code
dom.fromHtml = function fromHtml( html )
{
	var i , doc , fragment ;
	
	// Fragment allow us to return a collection that... well... is not a collection,
	// and that's fine because the html code may contains multiple top-level element
	fragment = document.createDocumentFragment() ;
	
	doc = document.createElement( 'div' ) ;	// whatever type...
	
	// either .innerHTML or .insertAdjacentHTML()
	//doc.innerHTML = html ;
	doc.insertAdjacentHTML( 'beforeend' , html ) ;
	
	for ( i = 0 ; i < doc.children.length ; i ++ )
	{
		fragment.appendChild( doc.children[ i ] ) ;
	}
	
	return fragment ;
} ;



dom.iterate = function iterate( method , elements )
{
	var i , args = Array.prototype.slice.call( arguments , 1 ) ;
	
	if ( elements instanceof Element )
	{
		args[ 0 ] = elements ;
		method.apply( this , args ) ;
	}
	else if ( Array.isArray( elements ) )
	{
		for ( i = 0 ; i < elements.length ; i ++ )
		{
			args[ 0 ] = elements[ i ] ;
			method.apply( this , args ) ;
		}
	}
	else if ( elements instanceof NodeList )
	{
		for ( i = 0 ; i < elements.length ; i ++ )
		{
			args[ 0 ] = elements[ i ] ;
			method.apply( this , args ) ;
		}
	}
} ;



dom.css = function css( element , object )	// , deb )
{
	var key ;
	
	//if ( deb ) { console.log( 'css: ' + string.inspect( object ) ) ; }
	
	for ( key in object )
	{
		element.style[ key ] = object[ key ] ;
	}
} ;



dom.remove = function remove( element ) { element.parentNode.removeChild( element ) ; } ;




